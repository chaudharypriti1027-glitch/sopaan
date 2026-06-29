let testPhoneSeq = 0;

/** Unique +91 test phone for signup / User.create in tests. */
export function nextTestPhone() {
  testPhoneSeq += 1;
  const suffix = String(40000 + testPhoneSeq).padStart(5, '0').slice(-5);
  return `98765${suffix}`;
}

export function nextTestPhoneE164() {
  return `+91${nextTestPhone()}`;
}

export const testPrivacyConsent = {
  policyVersion: '2025-06-01',
  aiProcessing: true,
  marketing: false,
};

export function withPrivacyConsent(payload) {
  return {
    phone: nextTestPhone(),
    ...payload,
    privacyConsent: testPrivacyConsent,
  };
}
