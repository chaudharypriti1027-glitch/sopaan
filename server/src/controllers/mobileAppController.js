import { evaluateMobileVersionRequirements } from '../services/mobileAppService.js';

export async function getVersionRequirements(req, res) {
  const platform = req.query.platform;
  const nativeVersion = req.query.nativeVersion ?? req.query.version;

  const requirements = evaluateMobileVersionRequirements({
    platform: typeof platform === 'string' ? platform : undefined,
    nativeVersion: typeof nativeVersion === 'string' ? nativeVersion : undefined,
  });

  res.status(200).json({
    ...requirements,
    clientNativeVersion: nativeVersion ?? null,
    checkedAt: new Date().toISOString(),
  });
}
