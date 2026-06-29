function parseClientIds(raw) {
  if (!raw?.trim()) {
    return [];
  }

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export const googleAuthConfig = Object.freeze({
  clientIds: parseClientIds(process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || ''),
});
