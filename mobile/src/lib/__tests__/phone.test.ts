import { describe, expect, it } from '@jest/globals';
import { maskIndianPhone, formatIndianPhoneDisplay } from '../phone';

describe('maskIndianPhone', () => {
  it('masks middle digits and shows last two', () => {
    expect(maskIndianPhone('+919876543210')).toBe('+91 •••• ••10');
    expect(maskIndianPhone('9876543210')).toBe('+91 •••• ••10');
  });

  it('formats readable display phone', () => {
    expect(formatIndianPhoneDisplay('+919876543210')).toBe('+91 98765 43210');
  });
});
