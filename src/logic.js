
export const STORAGE_KEY = 'project-companion-v1';


/*
 * Companion Quest — Character Roster
 *
 * Each companion has a unique ID.
 * Relationship XP is stored separately by ID.
 */

export const companions = [
  {
    id: 'bruno',
    name: 'Bruno Bucciarati',
    role: 'Your dependable mentor',
    image: `${import.meta.env.BASE_URL}characters/bruno-main.jpg`,
    alt: `${import.meta.env.BASE_URL}characters/bruno-alt.jpg`
  },
  {
    id: 'josuke',
    name: 'Josuke Higashikata',
    role: 'Your loyal and energetic friend',
    image: `${import.meta.env.BASE_URL}characters/josuke-classic-full.webp`,
    alt: `${import.meta.env.BASE_URL}characters/josuke-classic-full.webp`
  }
];


export const starterTasks = [
  { title: 'Brush your teeth', category: 'Self-care', xp: 5, recurring: true },
  { title: 'Drink a glass of water', category: 'Self-care', xp: 5, recurring: true },
  { title: 'Study for 30 minutes', category: 'Study', xp: 10, recurring: true },
  { title: 'Tidy your space', category: 'Home', xp: 10, recurring: true },
  { title: 'Take a short walk', category: 'Wellness', xp: 10, recurring: true }
];

export function today() {
  return new Date().toLocaleDateString('en-CA');
}

export function levelFromXp(xp) {
  return Math.floor(Math.max(0, xp) / 100) + 1;
}

export function tierFromLevel(level) {
  return level >= 50 ? 'Trusted Partner'
    : level >= 35 ? 'Trusted Companion'
    : level >= 20 ? 'Close Friend'
    : level >= 10 ? 'Friend'
    : level >= 5 ? 'Acquaintance'
    : 'New Partner';
}

export function initialState() {
  return {
    selected: 'bruno',
    relationships: {
      bruno: { xp: 0 }
    },
    tasks: starterTasks.map((task, index) => ({
      ...task,
      id: `starter-${index}`,
      completedOn: []
    })),
    history: [],
    settings: { voice: false },
    lastDialogue: ''
  };
}

export function normalizeState(data) {
  const base = initialState();

  if (!data || typeof data !== 'object') {
    return base;
  }

  return {
    ...base,
    ...data,
    relationships: {
      ...base.relationships,
      ...data.relationships
    },
    tasks: Array.isArray(data.tasks) ? data.tasks : base.tasks,
    history: Array.isArray(data.history) ? data.history : [],
    settings: {
      ...base.settings,
      ...data.settings
    }
  };
}

export function completeTask(state, id, date = today()) {
  const task = state.tasks.find(t => t.id === id);

  if (
    !task ||
    task.completedOn?.includes(date) ||
    (!task.recurring && task.completedOn?.length)
  ) {
    return state;
  }

  const tasks = state.tasks.map(t =>
    t.id === id
      ? { ...t, completedOn: [...(t.completedOn || []), date] }
      : t
  );

  const companion = state.selected;
  const xp = state.relationships[companion]?.xp || 0;

  return {
    ...state,
    tasks,
    relationships: {
      ...state.relationships,
      [companion]: { xp: xp + task.xp }
    },
    history: [
      ...state.history,
      {
        id: `${id}:${date}`,
        taskId: id,
        companion,
        date,
        xp: task.xp
      }
    ].slice(-1000)
  };
}

export function uncompleteTask(state, id, date = today()) {
  const entry = state.history.find(
    h => h.taskId === id && h.date === date
  );

  if (!entry) {
    return state;
  }

  return {
    ...state,
    tasks: state.tasks.map(t =>
      t.id === id
        ? {
            ...t,
            completedOn: (t.completedOn || []).filter(d => d !== date)
          }
        : t
    ),
    history: state.history.filter(
      h => !(h.taskId === id && h.date === date)
    ),
    relationships: {
      ...state.relationships,
      [entry.companion]: {
        xp: Math.max(
          0,
          (state.relationships[entry.companion]?.xp || 0) - entry.xp
        )
      }
    }
  };
}

export const dialogue = {
  greeting: [
    {
      min: 1,
      text: 'I’m Bruno Bucciarati. We’ll take today one step at a time.'
    },
    {
      min: 1,
      text: 'Good to see you. What would you like to accomplish today?'
    },
    {
      min: 5,
      text: 'You’ve been making steady progress. Keep that momentum.'
    },
    {
      min: 10,
      text: 'I know I can count on you to give today your best effort.'
    },
    {
      min: 20,
      text: 'We’ve built something good together. Let’s keep moving forward.'
    }
  ],

  complete: [
    {
      min: 1,
      text: 'Good work. Every step forward matters.'
    },
    {
      min: 1,
      text: 'One task done. You’re building a good habit.'
    },
    {
      min: 1,
      text: 'You followed through. That’s what counts.'
    },
    {
      min: 5,
      text: 'I can see how seriously you’re taking your goals.'
    },
    {
      min: 10,
      text: 'I knew you had it in you. Nicely done.'
    },
    {
      min: 20,
      text: 'That determination is one of your strengths.'
    }
  ],

  all: [
    {
      min: 1,
      text: 'You kept your word to yourself today. Be proud of that.'
    },
    {
      min: 10,
      text: 'Another day well handled. I’m proud to be on your team.'
    }
  ],

  level: [
    {
      min: 1,
      text: 'Our teamwork is getting stronger.'
    },
    {
      min: 10,
      text: 'I’ve come to trust your determination.'
    },
    {
      min: 20,
      text: 'We’ve come a long way together.'
    }
  ],

  return: [
    {
      min: 1,
      text: 'You’re here now. That’s what matters. Let’s continue.'
    }
  ]
};

export function pickDialogue(event, level, last = '') {
  const eligible = (dialogue[event] || dialogue.greeting)
    .filter(line => line.min <= level);

  const choices = eligible.filter(line => line.text !== last);

  return (choices.length ? choices : eligible)[
    Math.floor(Math.random() * (choices.length || eligible.length))
  ]?.text || '';
}
