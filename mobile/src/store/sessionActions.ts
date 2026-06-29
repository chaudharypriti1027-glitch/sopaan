/** Breaks api/client ↔ store/auth require cycle — auth registers signOut at startup. */
let signOutHandler: (() => Promise<void>) | null = null;

export function registerSignOutHandler(handler: () => Promise<void>) {
  signOutHandler = handler;
}

export async function runSignOutHandler() {
  if (signOutHandler) {
    await signOutHandler();
  }
}
