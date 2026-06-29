import * as privacyService from '../services/privacy/privacyService.js';

export async function getPolicy(_req, res) {
  res.json(privacyService.getPublicPolicy());
}

export async function getInventory(_req, res) {
  res.json(privacyService.getPublicDataInventory());
}

export async function getConsent(req, res) {
  const result = await privacyService.getUserConsentStatus(req.user._id);
  res.json(result);
}

export async function updateMarketingConsent(req, res) {
  const result = await privacyService.updateMarketingConsent(req.user._id, req.body.marketing);
  res.json(result);
}

export async function exportData(req, res) {
  const data = await privacyService.exportAccountData(req.user._id);
  const filename = `sopaan-data-export-${req.user._id}.json`;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.json(data);
}

export async function requestDeletion(req, res) {
  const result = await privacyService.requestAccountDeletion(req.user._id, req.body);
  res.json(result);
}

export async function confirmDeletion(req, res) {
  const result = await privacyService.confirmAccountDeletion(req.user._id, {
    ...req.body,
    refreshToken: req.body.refreshToken,
  });
  res.json(result);
}
