export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function caseInsensitiveRegex(value) {
  return { $regex: escapeRegex(value), $options: 'i' };
}
