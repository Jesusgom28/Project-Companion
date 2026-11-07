
import React, { useEffect, useRef, useState } from 'react';

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

export default function TaskScheduler({ tasks = [], onUpdateTask }) {
  const [now, setNow] = useState(Date.now());
  const [alerts, setAlerts] = useState([]);
  const [permission, setPermission] = useState(
    typeof Notification === 'undefined'
      ? 'unsupported'
      : Notification.permission
  );

  const notified = useRef(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    for (const task of tasks) {
      if (!task.dueAt || isComplete(task)) continue;

      const due = new Date(task.dueAt).getTime();
      if (!Number.isFinite(due)) continue;

      const minutes = Number(task.reminderMinutes ?? 0);
      const reminderTime = due - minutes * 60_000;

      // Deliver only during the first five minutes
      // after the reminder time, while the app is open.
      if (now < reminderTime || now >= reminderTime + 300_000) {
        continue;
      }

      const key = `${task.id}:${task.dueAt}:${minutes}`;
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
          new Notification(title, {
            body,
            tag: key
          });
        } catch {
          // In-app reminder still appears.
        }
      }
    }
  }, [now, tasks]);

  async function enableNotifications() {
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
        Set deadlines for your tasks. Bruno can remind you
        while Project Companion is open.
      </p>

      {permission === 'default' && (
        <button type="button" onClick={enableNotifications}>
          Enable browser notifications
        </button>
      )}

      {permission === 'denied' && (
        <p className="v04-muted">
          Browser notifications are blocked. In-app reminders
          will still appear.
        </p>
      )}

      {permission === 'unsupported' && (
        <p className="v04-muted">
          Browser notifications aren't available here.
          In-app reminders are still supported.
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
