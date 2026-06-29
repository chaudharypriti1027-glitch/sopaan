export const wellnessSessions = [
  {
    id: 'breathing',
    title: 'Box breathing',
    category: 'breathing',
    durationMin: 5,
    description: '4-4-4-4 breath cycle to calm nerves before study.',
  },
  {
    id: 'pre-exam',
    title: 'Pre-exam calm',
    category: 'pre-exam',
    durationMin: 8,
    description: 'Guided relaxation to steady focus before a mock or exam.',
  },
  {
    id: 'sleep',
    title: 'Sleep wind-down',
    category: 'sleep',
    durationMin: 12,
    description: 'Slow breathing and body scan to end the study day.',
  },
  {
    id: 'focus-reset',
    title: 'Focus reset',
    category: 'focus',
    durationMin: 6,
    description: 'Quick mental reset between intense study blocks.',
  },
];

export function listWellnessSessions() {
  return { items: wellnessSessions };
}
