import { e2eConfig } from './e2eConfig.js';

const isProduction = process.env.NODE_ENV === 'production';

/** Never stub AI in production — ignore DEV_STUB_AI / E2E flags when NODE_ENV=production. */
const devStubAi = !isProduction && process.env.DEV_STUB_AI === 'true';

export const aiRuntimeConfig = Object.freeze({
  /** Use deterministic local responses instead of calling Anthropic. */
  stubResponses: !isProduction && (e2eConfig.stubAi || devStubAi),
  devStubAi,
});

if (devStubAi && isProduction) {
  throw new Error('DEV_STUB_AI cannot be enabled when NODE_ENV=production');
}

if (aiRuntimeConfig.stubResponses && process.env.NODE_ENV === 'development') {
  console.warn('[ai] DEV_STUB_AI / E2E stub active — Anthropic API will not be called');
}
