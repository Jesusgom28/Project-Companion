
import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const NATIVE = Capacitor.isNativePlatform();
const REMINDER_STORE = 'companion-quest-native-reminders-v1';

function localDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isComplete(task) {
  if (task.recurring) {
    return (task.completedOn || []).includes(localDate());
  }
  return (task.completedOn || []).length > 0;
}

function formatDate(value) {
  if (!value) return 'Not scheduled';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid date';

  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function taskStatus(task) {
  if (isComplete(task)) return 'Completed';
  if (!task.dueAt) return 'Unscheduled';

  const due = new Date(task.dueAt).getTime();
  if (!Number.isFinite(due)) return 'Invalid date';

  const remaining = due - Date.now();

  if (remaining < 0) return 'Overdue';
  if (remaining < 60 * 60 * 1000) return 'Due soon';

  return 'Upcoming';
}

function getReminderTime(task) {
  const due = new Date(task.dueAt).getTime();
  const minutes = Number(task.reminderMinutes ?? 0);

  if (!Number.isFinite(due) || !Number.isFinite(minutes)) {
    return NaN;
  }

  return due - minutes * 60_000;
}

function readNativeStore() {
  try {
    const value = JSON.parse(localStorage.getItem(REMINDER_STORE));
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value
      : {};
  } catch {
    return {};
  }
}

function saveNativeStore(value) {
  localStorage.setItem(REMINDER_STORE, JSON.stringify(value));
}

// Generate a positive Android notification ID from a task ID.
// Resolve collisions against IDs already assigned in our store.
function allocateId(taskId, store) {
  const existing = store[taskId]?.id;
  if (Number.isInteger(existing) && existing > 0) return existing;

  let hash = 0;
  for (const character of String(taskId)) {
    hash = (Math.imul(31, hash) + character.charCodeAt(0)) | 0;
  }

  let id = (hash >>> 0) % 2000000000 + 1;
  const used = new Set(
    Object.values(store).map(item => item.id)
  );

  while (used.has(id)) {
    id = id % 2000000000 + 1;
  }

  return id;
}

export default function TaskScheduler({ tasks = [], onUpdateTask }) {
  const [now, setNow] = useState(Date.now());
  const [alerts, setAlerts] = useState([]);
  const [permission, setPermission] = useState(
    NATIVE
      ? 'checking'
      : typeof Notification === 'undefined'
        ? 'unsupported'
        : Notification.permission
  );

  const [nativeMessage, setNativeMessage] = useState('');
  const notified = useRef(new Set());

  // Serialize Android scheduling operations to avoid overlapping updates.
  const syncQueue = useRef(Promise.resolve());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  // Check Android notification permission.
  useEffect(() => {
    if (!NATIVE) return;

    let active = true;

    LocalNotifications.checkPermissions()
      .then(result => {
        if (active) setPermission(result.display);
      })
      .catch(error => {
        console.error('Notification permission check failed:', error);
        if (active) setPermission('denied');
      });

    return () => {
      active = false;
    };
  }, []);

  // Keep the original browser reminder functionality.
  useEffect(() => {
    if (NATIVE) return;

    for (const task of tasks) {
      if (!task.dueAt || isComplete(task)) continue;

      const reminderTime = getReminderTime(task);
      if (!Number.isFinite(reminderTime)) continue;

      if (
        now < reminderTime ||
        now >= reminderTime + 300_000
      ) {
        continue;
      }

      const key =
        `${task.id}:${task.dueAt}:${task.reminderMinutes ?? 0}`;

      if (notified.current.has(key)) continue;
      notified.current.add(key);

      const title = 'Bruno has a reminder';
      const body =
        `"${task.title}" is scheduled for ${formatDate(task.dueAt)}.`;

      setAlerts(previous => [
        ...previous,
        { key, title, body }
      ].slice(-5));

      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(title, { body, tag: key });
        } catch (error) {
          console.warn('Browser notification unavailable:', error);
        }
      }
    }
  }, [now, tasks]);

  // Reconcile Android reminders whenever tasks or permission change.
  useEffect(() => {
    if (!NATIVE || permission !== 'granted') return;

    let cancelled = false;

    const snapshot = tasks.map(task => ({
      ...task,
      completedOn: [...(task.completedOn || [])]
    }));

    const run = async () => {
      if (cancelled) return;

      try {
        const store = readNativeStore();
        const desired = {};

        for (const task of snapshot) {
          if (!task.dueAt || isComplete(task)) continue;

          const time = getReminderTime(task);
          if (!Number.isFinite(time) || time <= Date.now()) {
            continue;
          }

          const taskId = String(task.id);
          const id = allocateId(taskId, {
            ...store,
            ...desired
          });

          const signature = JSON.stringify({
            title: task.title,
            dueAt: task.dueAt,
            minutes: Number(task.reminderMinutes ?? 0)
          });

          desired[taskId] = { id, signature, time };
        }

        const pending = await LocalNotifications.getPending();
        const pendingIds = new Set(
          pending.notifications.map(item => item.id)
        );

        const cancelIds = [];

        for (const [taskId, old] of Object.entries(store)) {
          const next = desired[taskId];

          if (
            !next ||
            next.signature !== old.signature ||
            !pendingIds.has(old.id)
          ) {
            if (pendingIds.has(old.id)) {
              cancelIds.push({ id: old.id });
            }
          }
        }

        if (cancelIds.length) {
          await LocalNotifications.cancel({
            notifications: cancelIds
          });
        }

        const toSchedule = [];

        for (const [taskId, item] of Object.entries(desired)) {
          const old = store[taskId];

          if (
            old?.signature === item.signature &&
            pendingIds.has(item.id) &&
            !cancelIds.some(entry => entry.id === item.id)
          ) {
            continue;
          }

          const task = snapshot.find(
            candidate => String(candidate.id) === taskId
          );

          if (!task || item.time <= Date.now()) continue;

          toSchedule.push({
            id: item.id,
            title: 'Bruno has a reminder',
            body: `"${task.title}" is scheduled for ${formatDate(task.dueAt)}.`,
            schedule: {
              at: new Date(item.time),
              allowWhileIdle: true
            },
            extra: {
              taskId
            }
          });
        }

        // Save cancellations even if a later schedule call fails.
        const surviving = {};

        for (const [taskId, item] of Object.entries(desired)) {
          if (
            store[taskId]?.signature === item.signature &&
            pendingIds.has(item.id) &&
            !cancelIds.some(entry => entry.id === item.id)
          ) {
            surviving[taskId] = item;
          }
        }

        saveNativeStore(surviving);

        if (toSchedule.length) {
          await LocalNotifications.schedule({
            notifications: toSchedule
          });
        }

        saveNativeStore(desired);

        if (!cancelled) {
          setNativeMessage(
            `${Object.keys(desired).length} future reminder(s) configured.`
          );
        }
      } catch (error) {
        console.error('Android reminder scheduling failed:', error);

        if (!cancelled) {
          setNativeMessage(
            'Could not schedule reminders. Check Android notification and alarm permissions.'
          );
        }
      }
    };

    syncQueue.current = syncQueue.current
      .catch(() => {})
      .then(run);

    return () => {
      cancelled = true;
    };
  }, [tasks, permission, now]);

  async function enableNotifications() {
    if (NATIVE) {
      try {
        const result = await LocalNotifications.requestPermissions();
        setPermission(result.display);

        if (result.display === 'granted') {
          setNativeMessage(
            'Notifications enabled. Future reminders can now be scheduled.'
          );
        } else {
          setNativeMessage(
            'Android notification permission was not granted.'
          );
        }
      } catch (error) {
        console.error(error);
        setNativeMessage(
          'Unable to request Android notification permission.'
        );
      }

      return;
    }

    if (typeof Notification === 'undefined') return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch {
      setPermission('unsupported');
    }
  }

  function update(task, changes) {
    onUpdateTask(task.id, changes);
  }

  return (
    <section className="v04-scheduler">
      <h2>Task Schedule & Reminders</h2>

      <p className="v04-muted">
        {NATIVE
          ? 'Schedule Android reminders for your tasks. Notifications may appear even when Companion Quest is closed.'
          : 'Set deadlines for your tasks. Bruno can remind you while Project Companion is open.'}
      </p>

      {permission === 'default' ||
      (NATIVE && permission === 'prompt') ? (
        <button type="button" onClick={enableNotifications}>
          {NATIVE
            ? 'Enable Android notifications'
            : 'Enable browser notifications'}
        </button>
      ) : null}

      {NATIVE && permission === 'denied' && (
        <p className="v04-muted">
          Android notifications are disabled. Open your phone's
          Settings, find Companion Quest, and allow notifications.
        </p>
      )}

      {!NATIVE && permission === 'denied' && (
        <p className="v04-muted">
          Browser notifications are blocked. In-app reminders
          will still appear.
        </p>
      )}

      {!NATIVE && permission === 'unsupported' && (
        <p className="v04-muted">
          Browser notifications aren't available here.
          In-app reminders are still supported.
        </p>
      )}

      {NATIVE && permission === 'granted' && (
        <p className="v04-muted">
          Android notifications are enabled.
        </p>
      )}

      {NATIVE && nativeMessage && (
        <p className="v04-muted" role="status">
          {nativeMessage}
        </p>
      )}

      {alerts.map(alert => (
        <div className="v04-alert" key={alert.key} role="status">
          <strong>{alert.title}</strong>
          <p>{alert.body}</p>

          <button
            type="button"
            onClick={() =>
              setAlerts(previous =>
                previous.filter(item => item.key !== alert.key)
              )
            }
          >
            Dismiss
          </button>
        </div>
      ))}

      {tasks.length === 0 && (
        <p>You don't have any tasks yet.</p>
      )}

      <div className="v04-task-list">
        {tasks.map(task => {
          const status = taskStatus(task);

          return (
            <article className="v04-task" key={task.id}>
              <div className="v04-task-heading">
                <strong>{task.title}</strong>
                <span>{status}</span>
              </div>

              <p className="v04-muted">
                {formatDate(task.dueAt)}
                {' · '}
                {task.xp} XP
              </p>

              <label>
                Due date and time
                <input
                  type="datetime-local"
                  value={task.dueAt || ''}
                  onChange={event =>
                    update(task, {
                      dueAt: event.target.value,
                      reminderMinutes: Number(
                        task.reminderMinutes ?? 0
                      )
                    })
                  }
                />
              </label>

              <label>
                Remind me
                <select
                  value={task.reminderMinutes ?? 0}
                  onChange={event =>
                    update(task, {
                      reminderMinutes: Number(event.target.value)
                    })
                  }
                >
                  <option value={0}>At due time</option>
                  <option value={15}>15 minutes before</option>
                  <option value={60}>1 hour before</option>
                </select>
              </label>

              {task.dueAt && (
                <button
                  type="button"
                  onClick={() =>
                    update(task, {
                      dueAt: '',
                      reminderMinutes: 0
                    })
                  }
                >
                  Remove schedule
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
