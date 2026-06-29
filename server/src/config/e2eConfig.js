/**
 * E2E / Maestro test mode — enable only on staging or CI hosts, never production.
 */
const isProduction = process.env.NODE_ENV === 'production';
const deployEnv = process.env.DEPLOY_ENV?.trim() || (isProduction ? 'production' : 'development');

const enabled =
  !isProduction &&
  (process.env.E2E_STUB_AI === 'true' ||
    process.env.E2E_MODE === 'true' ||
    process.env.DEPLOY_ENV === 'e2e');

export const e2eConfig = Object.freeze({
  enabled,
  stubAi: enabled,
  sandboxPayments: enabled && process.env.E2E_SANDBOX_PAYMENTS !== 'false',
});

if (enabled && isProduction && deployEnv === 'production') {
  throw new Error('E2E_STUB_AI / E2E_MODE cannot be enabled when DEPLOY_ENV=production');
}
