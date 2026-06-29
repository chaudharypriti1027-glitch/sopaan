import { privacyConfig } from '../config/privacyConfig.js';

export function getPrivacyPolicy() {
  return {
    version: privacyConfig.policyVersion,
    updatedAt: privacyConfig.policyVersion,
    url: privacyConfig.policyUrl,
    termsUrl: privacyConfig.termsUrl,
    jurisdiction: 'India',
    framework: 'Designed with India\'s Digital Personal Data Protection Act, 2023 (DPDP) in mind — not legal advice.',
    disclaimer:
      'This policy describes our data practices. Consult qualified legal counsel for compliance sign-off.',
    sections: [
      {
        id: 'controller',
        title: 'Data fiduciary',
        body: 'Sopaan ("we", "us") operates the Sopaan exam-prep app. Contact: privacy@sopaan.app.',
      },
      {
        id: 'collected',
        title: 'What we collect',
        items: [
          { field: 'Account', purpose: 'Authentication and profile', examples: 'Name, email or phone, password hash' },
          { field: 'Study profile', purpose: 'Personalised plans', examples: 'Exam goal, category, state, education' },
          { field: 'Activity', purpose: 'Progress tracking', examples: 'Test attempts, planner sessions, focus logs' },
          { field: 'Device', purpose: 'Notifications', examples: 'Expo push token (optional)' },
          { field: 'Payments', purpose: 'Subscriptions', examples: 'Order ids, plan, amount — via Razorpay' },
          { field: 'AI usage', purpose: 'Quota and quality', examples: 'Feature name, token counts — not prompts in logs after retention' },
        ],
      },
      {
        id: 'why',
        title: 'Why we process data',
        items: [
          'Provide exam preparation features you request',
          'Personalise study plans and AI coaching',
          'Process subscriptions and support',
          'Send notifications you opt into',
          'Improve reliability and security',
        ],
      },
      {
        id: 'rights',
        title: 'Your rights (DPDP-aware)',
        items: [
          'Access and download your data (Settings → Download my data)',
          'Correct profile information in the app',
          'Withdraw marketing consent anytime',
          'Request erasure (Settings → Delete account)',
          'Grievance: email privacy@sopaan.app',
        ],
      },
      {
        id: 'retention',
        title: 'Retention',
        body: `AI call metadata: ${privacyConfig.retentionDays.aiCallLogs} days. Notifications: ${privacyConfig.retentionDays.notifications} days. Payment records may be retained longer for legal/tax obligations. Deleted accounts are anonymized; minimal stub may remain for fraud prevention.`,
      },
      {
        id: 'processors',
        title: 'Third-party processors',
        processors: privacyConfig.processors,
      },
      {
        id: 'ai',
        title: 'AI processing',
        body: 'We send study content and performance statistics to Claude (Anthropic). We do not send your name, email, or phone in AI prompts. You consent to AI processing at signup; without it, AI features are unavailable.',
      },
      {
        id: 'children',
        title: 'Children',
        body: 'Sopaan is intended for exam aspirants aged 13+. Users under 18 should use the app with guardian consent.',
      },
    ],
    consentRequirements: {
      privacyPolicy: true,
      aiProcessing: true,
      marketing: false,
    },
  };
}

export function getDataInventory() {
  return {
    version: privacyConfig.policyVersion,
    categories: getPrivacyPolicy().sections.find((s) => s.id === 'collected')?.items ?? [],
    processors: privacyConfig.processors,
    retentionDays: privacyConfig.retentionDays,
  };
}
