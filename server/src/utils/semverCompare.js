/**
 * Compare semver strings (major.minor.patch). Pre-release segments are ignored.
 * @returns negative if a < b, 0 if equal, positive if a > b
 */
export function compareSemver(a, b) {
  const parse = (version) => {
    const core = String(version).trim().split('-')[0];
    const parts = core.split('.').map((n) => Number.parseInt(n, 10));
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
  };

  const [aMajor, aMinor, aPatch] = parse(a);
  const [bMajor, bMinor, bPatch] = parse(b);

  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  return aPatch - bPatch;
}

export function isVersionLessThan(current, minimum) {
  return compareSemver(current, minimum) < 0;
}

export function isVersionAtLeast(current, minimum) {
  return compareSemver(current, minimum) >= 0;
}
