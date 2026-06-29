/** Format 10-digit Indian mobile for API (+91XXXXXXXXXX). */
export function formatIndianPhone(digits10: string): string {
  return `+91${digits10}`;
}

/** Validates a 10-digit Indian mobile (6–9 prefix). */
export function isValidIndianMobile(digits: string): boolean {
  return /^[6-9]\d{9}$/.test(digits);
}

/** Mask phone for display: +91 •••• ••42 */
export function maskIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const national = digits.length >= 10 ? digits.slice(-10) : digits;

  if (national.length < 2) {
    return '+91 •••• ••••';
  }

  const last2 = national.slice(-2);
  return `+91 •••• ••${last2}`;
}

/** Readable verified phone: +91 98765 43210 */
export function formatIndianPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);

  if (digits.length !== 10) {
    return phone;
  }

  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}
