
import React, { useEffect, useState } from 'react';

const CHECKIN_KEY = 'project-companion-v04-checkin';

function localDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DailyCheckIn({ onPlan }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const check = () => {
      const date = localDate();
      const previous = localStorage.getItem(CHECKIN_KEY);

      setVisible(previous !== date);
      setMessage(
        `${greeting()}. It's good to see you. ` +
        'Do you have anything important planned for today? ' +
        "I can help you organize it."
      );
    };

    check();

    // Recheck when the date changes or the tab becomes active.
    const interval = setInterval(check, 60_000);
    window.addEventListener('focus', check);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', check);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(CHECKIN_KEY, localDate());
    setVisible(false);
  }

  function plan() {
    dismiss();
    onPlan();
  }

  if (!visible) return null;

  return (
    <section className="v04-checkin">
      <div className="v04-checkin-header">
        <span>☀️</span>
        <strong>Bruno's Daily Check-in</strong>
      </div>

      <p>{message}</p>

      <div className="v04-actions">
        <button type="button" onClick={plan}>
          Plan my day
        </button>

        <button type="button" onClick={dismiss}>
          Maybe later
        </button>

        <button type="button" onClick={dismiss}>
          No plans today
        </button>
      </div>
    </section>
  );
}
