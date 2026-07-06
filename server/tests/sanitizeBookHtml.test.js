import { describe, expect, it } from '@jest/globals';
import { sanitizeBookHtml } from '../src/utils/sanitizeBookHtml.js';

describe('sanitizeBookHtml', () => {
  it('keeps allowed structural tags', () => {
    const input = '<h2>Title</h2><p>Hello <b>world</b></p><ul><li>One</li></ul>';
    expect(sanitizeBookHtml(input)).toBe(input);
  });

  it('strips scripts and unsafe attributes', () => {
    const input = '<p onclick="alert(1)">Hi</p><script>alert(1)</script><img src=x onerror=alert(1) />';
    expect(sanitizeBookHtml(input)).toBe('<p>Hi</p>');
  });

  it('keeps blockquote and code', () => {
    const input = '<blockquote>Note</blockquote><p><code>x = 1</code></p>';
    expect(sanitizeBookHtml(input)).toBe(input);
  });
});
