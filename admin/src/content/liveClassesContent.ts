/** Default exam tag for admin live class forms. */
export const DEFAULT_LIVE_EXAM_TAG = 'General';

export const LIVE_CLASS_DURATION = {
  min: 15,
  max: 240,
  default: 60,
} as const;

export const DEFAULT_LIVE_CLASS_FORM = {
  title: '',
  description: '',
  instructor: '',
  exam: DEFAULT_LIVE_EXAM_TAG,
  topic: '',
  startsAt: '',
  durationMin: String(LIVE_CLASS_DURATION.default),
  autoRecord: true,
  notify: true,
  coverUrl: '',
};

export type LiveClassFormState = typeof DEFAULT_LIVE_CLASS_FORM;

export type LiveAdminTab = 'room' | 'schedule' | 'upcoming' | 'recordings';

/** Centralized admin live console copy (English until admin i18n lands). */
export const LIVE_ADMIN_COPY = {
  pageTitle: 'Live classes',
  tabs: {
    room: 'Live now',
    schedule: 'Schedule',
    upcoming: 'Upcoming',
    recordings: 'Recordings',
  },
  metrics: {
    liveNow: 'Live now',
    scheduled: 'Scheduled',
    recordings: 'Recordings',
    watchingNow: 'Watching now',
  },
  room: {
    starting: 'Starting live room…',
    tokenError: 'Unable to load host token. Check LiveKit configuration.',
    empty: 'No class is live. Start one from Upcoming.',
  },
  schedule: {
    title: 'Schedule a live class',
    notifyLabel: 'Notify students (push + in-app banner)',
    submit: 'Schedule & notify students',
    autoRecordOn: 'On — save to recordings',
    autoRecordOff: 'Off',
  },
  fields: {
    title: 'Title',
    educator: 'Educator',
    exam: 'Exam',
    topic: 'Topic',
    when: 'Date & time',
    duration: 'Duration (minutes)',
    autoRecord: 'Auto-record',
    cover: 'Cover image',
  },
  toast: {
    scheduled: 'Live class scheduled',
    live: 'Class is live',
    ended: 'Class ended · recording saved',
    cancelled: 'Class cancelled',
    published: 'Recording published',
    unpublished: 'Recording unpublished',
    required: 'Title and schedule are required',
  },
  upcoming: {
    scheduleBtn: 'Schedule class',
    loading: 'Loading classes…',
    empty: 'No upcoming classes',
    openRoom: 'Open room',
    goLive: 'Go live',
    cancel: 'Cancel',
    now: 'Now',
    statusLive: 'Live',
    statusScheduled: 'Scheduled',
    columns: {
      class: 'Class',
      educator: 'Educator',
      when: 'When',
      status: 'Status',
    },
  },
  recordings: {
    loading: 'Loading recordings…',
    empty: 'No recordings yet',
    columns: {
      recording: 'Recording',
      educator: 'Educator',
      duration: 'Duration',
      peakViewers: 'Peak viewers',
      status: 'Status',
    },
    open: 'Open',
    publish: 'Publish',
    unpublish: 'Unpublish',
    statusPublished: 'Published',
    statusReady: 'Ready',
    statusPending: 'Pending',
  },
} as const;

export const LIVE_ADMIN_TABS: ReadonlyArray<{ key: LiveAdminTab; labelKey: keyof typeof LIVE_ADMIN_COPY.tabs }> = [
  { key: 'room', labelKey: 'room' },
  { key: 'schedule', labelKey: 'schedule' },
  { key: 'upcoming', labelKey: 'upcoming' },
  { key: 'recordings', labelKey: 'recordings' },
];
