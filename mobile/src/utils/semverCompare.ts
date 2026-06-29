/** Compare semver major.minor.patch (pre-release suffix ignored). */
export function compareSemver(a: string, b: string): number {
  const parse = (version: string) => {
    const core = version.trim().split('-')[0] ?? version;
    const parts = core.split('.').map((part) => Number.parseInt(part, 10));
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0] as const;
  };

  const [aMajor, aMinor, aPatch] = parse(a);
  const [bMajor, bMinor, bPatch] = parse(b);

  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  return aPatch - bPatch;
}

export function isVersionLessThan(current: string, minimum: string): boolean {
  return compareSemver(current, minimum) < 0;
}
