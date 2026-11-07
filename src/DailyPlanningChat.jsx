
import React, { useState } from 'react';

const EXAMPLE = 'Study for exam, Do laundry, Finish homework';

function extractTasks(message) {
  return message
    .replace(/^(yes|yeah|sure)[,!. ]*/i, '')
    .replace(/^(i need to|i have to|my plans are|today i need to)\s+/i, '')
    .split(/[,;\n]+|\s+and\s+/i)
    .map((part) =>
      part.trim()
        .replace(/^(i need to|i have to|i want to)\s+/i, '')
        .replace(/[.!]+$/, '')
        .trim()
    )
    .filter(Boolean)
    .slice(0, 15)
    .map((title, index) => ({
      id: index,
      title,
      category: 'Personal',
      xp: 10,
      selected: true
    }));
}

export default function DailyPlanningChat({ onAddTasks }) {
  const [message, setMessage] = useState('');
  const [stage, setStage] = useState('ask');
  const [suggestions, setSuggestions] = useState([]);
  const [savedCount, setSavedCount] = useState(0);

  function preview(event) {
    event.preventDefault();

    const tasks = extractTasks(message);
    if (!tasks.length) return;

    setSuggestions(tasks);
    setStage('preview');
  }

  function updateTask(id, changes) {
    setSuggestions((previous) =>
      previous.map((task) =>
        task.id === id ? { ...task, ...changes } : task
      )
    );
  }

  function confirmTasks() {
    const tasks = suggestions
      .filter((task) => task.selected && task.title.trim())
      .map((task) => ({
        title: task.title.trim(),
        category: task.category,
        xp: Number(task.xp),
        recurring: false
      }));

    if (!tasks.length) return;

    onAddTasks(tasks);
    setSavedCount(tasks.length);
    setStage('saved');
  }

  function startAgain() {
    setMessage('');
    setSuggestions([]);
    setStage('ask');
  }

  return (
    <section className="panel planningChat">
      <h2>Plan your day with Bruno</h2>

      <div className="planningBubble">
        <strong>Bruno Bucciarati</strong>
        <p>
          {stage === 'ask'
            ? "Do you have anything planned for today? Tell me what you need to do, and I'll help you organize it."
            : stage === 'preview'
            ? "I've prepared your tasks. Review them first, and I'll add only the ones you approve."
            : `Excellent. I've added ${savedCount} task${savedCount === 1 ? '' : 's'} to your planner. Let's make today count.`}
        </p>
      </div>

      {stage === 'ask' && (
        <form className="planningForm" onSubmit={preview}>
          <textarea
            aria-label="Your plans for today"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={EXAMPLE}
            maxLength={1500}
            rows={3}
            required
          />

          <button className="primary" type="submit">
            Preview my tasks
          </button>
        </form>
      )}

      {stage === 'preview' && (
        <div className="planningPreview">
          <h3>Suggested tasks</h3>

          {suggestions.map((task) => (
            <div className="planningTask" key={task.id}>
              <label className="checklabel">
                <input
                  type="checkbox"
                  checked={task.selected}
                  onChange={(e) =>
                    updateTask(task.id, {
                      selected: e.target.checked
                    })
                  }
                />
                Add this task
              </label>

              <input
                aria-label="Task title"
                value={task.title}
                maxLength={100}
                onChange={(e) =>
                  updateTask(task.id, {
                    title: e.target.value
                  })
                }
              />

              <div className="formrow">
                <select
                  aria-label="Task category"
                  value={task.category}
                  onChange={(e) =>
                    updateTask(task.id, {
                      category: e.target.value
                    })
                  }
                >
                  {[
                    'Personal',
                    'Self-care',
                    'Study',
                    'Work',
                    'Home',
                    'Wellness'
                  ].map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Task XP"
                  value={task.xp}
                  onChange={(e) =>
                    updateTask(task.id, {
                      xp: Number(e.target.value)
                    })
                  }
                >
                  <option value={5}>Easy - 5 XP</option>
                  <option value={10}>Medium - 10 XP</option>
                  <option value={15}>Hard - 15 XP</option>
                </select>
              </div>
            </div>
          ))}

          <button
            className="primary"
            type="button"
            disabled={!suggestions.some(
              (task) => task.selected && task.title.trim()
            )}
            onClick={confirmTasks}
          >
            Confirm and add tasks
          </button>

          <button
            className="secondaryButton"
            type="button"
            onClick={() => setStage('ask')}
          >
            Edit my plans
          </button>
        </div>
      )}

      {stage === 'saved' && (
        <div className="planningPreview">
          <p>Your tasks are ready in the Planner tab.</p>
          <button
            className="primary"
            type="button"
            onClick={startAgain}
          >
            Plan something else
          </button>
        </div>
      )}
    </section>
  );
}
