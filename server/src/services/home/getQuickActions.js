import { safeHomeCall } from './safe.js';

/** Server-driven quick actions — reorder or A/B without app release. */
export const HOME_QUICK_ACTIONS = [
  { key: 'test', label: 'Take test', icon: 'clipboard-list', deeplink: '/tabs/Practice' },
  { key: 'ai', label: 'Ask AI', icon: 'sparkles', deeplink: '/stack/AskAI' },
  { key: 'ca', label: 'Affairs', icon: 'newspaper', deeplink: '/tabs/CurrentAffairs' },
  { key: 'games', label: 'Games', icon: 'gamepad-2', deeplink: '/stack/Games' },
];

export async function getQuickActions(_user) {
  return safeHomeCall(
    'getQuickActions',
    async () => HOME_QUICK_ACTIONS.map((action) => ({ ...action })),
    [],
  );
}
