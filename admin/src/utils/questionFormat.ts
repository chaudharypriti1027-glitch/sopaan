export function formatQuestionRef(id: string) {
  const suffix = id.replace(/[^a-z0-9]/gi, '').slice(-4).toUpperCase();
  return `#Q-${suffix || id.slice(-4).toUpperCase()}`;
}

export function truncateText(text: string, max = 72) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
