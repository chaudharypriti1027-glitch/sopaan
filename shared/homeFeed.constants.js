/** @typedef {import('./homeFeed.ts').HomeFeed} HomeFeed */

/** Default home quick actions (mirrors shared/homeFeed.ts). */
export const HOME_QUICK_ACTIONS = [
  { key: 'test', label: 'Take test', icon: 'clipboard-list', deeplink: '/tabs/Practice' },
  { key: 'ai', label: 'Ask AI', icon: 'sparkles', deeplink: '/stack/AskAI' },
  { key: 'ca', label: 'Affairs', icon: 'newspaper', deeplink: '/tabs/CurrentAffairs' },
  { key: 'games', label: 'Games', icon: 'gamepad-2', deeplink: '/stack/Games' },
];
