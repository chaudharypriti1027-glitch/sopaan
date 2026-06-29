import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

const streakSchema = new mongoose.Schema(
  {
    /** @deprecated Legacy alias — kept in sync with `current` via pre-save hook */
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** @deprecated Legacy alias — kept in sync with `lastActiveOn` via pre-save hook */
    lastActiveDate: {
      type: Date,
      default: null,
    },
    current: {
      type: Number,
      default: 0,
      min: 0,
    },
    best: {
      type: Number,
      default: 0,
      min: 0,
    },
    freezes: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActiveOn: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      required() {
        return !this.googleSub;
      },
      index: true,
    },
    googleSub: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['GEN', 'OBC', 'SC', 'ST', 'EWS'],
    },
    targetExam: {
      type: String,
      trim: true,
    },
    examDate: {
      type: Date,
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'gu'],
      default: 'en',
    },
    educationLevel: {
      type: String,
      enum: ['10th', '12th', 'Graduate', 'PG', 'Diploma'],
    },
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
    rank: {
      type: Number,
      default: null,
    },
    role: {
      type: String,
      enum: ['student', 'admin', 'mentor'],
      default: 'student',
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumPlan: {
      type: String,
      enum: ['monthly', 'yearly', 'trial'],
      default: null,
    },
    premiumExpiresAt: {
      type: Date,
      default: null,
    },
    premiumTrialUsed: {
      type: Boolean,
      default: false,
    },
    coins: {
      type: Number,
      default: 0,
      min: 0,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    weeklyXp: {
      type: Number,
      default: 0,
      min: 0,
    },
    leagueTier: {
      type: String,
      default: 'Bronze',
      trim: true,
    },
    activeGoalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      default: null,
    },
    streak: {
      type: streakSchema,
      default: () => ({}),
    },
    expoPushToken: {
      type: String,
      default: null,
      trim: true,
    },
    expoPushPlatform: {
      type: String,
      enum: ['ios', 'android', 'web'],
      default: undefined,
    },
    pushNotificationsEnabled: {
      type: Boolean,
      default: true,
    },
    currentAffairsAlertsEnabled: {
      type: Boolean,
      default: false,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notificationPreferences: {
      types: {
        type: mongoose.Schema.Types.Mixed,
        default: undefined,
      },
      dailyPushCap: {
        type: Number,
        min: 1,
        max: 50,
        default: undefined,
      },
      quietHours: {
        enabled: { type: Boolean, default: undefined },
        start: { type: String, trim: true, default: undefined },
        end: { type: String, trim: true, default: undefined },
        timezone: { type: String, trim: true, default: undefined },
      },
    },
    privacyConsent: {
      policyVersion: { type: String, trim: true, default: null },
      acceptedAt: { type: Date, default: null },
      aiProcessing: { type: Boolean, default: false },
      marketing: { type: Boolean, default: false },
    },
    accountStatus: {
      type: String,
      enum: ['active', 'deleted'],
      default: 'active',
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ role: 1 });
userSchema.index({ activeGoalId: 1 }, { sparse: true });

userSchema.pre('save', function mirrorStreakFields() {
  if (!this.isModified('streak') || !this.streak) {
    return;
  }

  const streak = this.streak;
  const current = streak.current ?? streak.count ?? 0;
  streak.current = current;
  streak.count = current;

  const lastActive = streak.lastActiveOn ?? streak.lastActiveDate ?? null;
  streak.lastActiveOn = lastActive;
  streak.lastActiveDate = lastActive;

  if (current > (streak.best ?? 0)) {
    streak.best = current;
  }

  if (streak.freezes == null) {
    streak.freezes = 0;
  }
});

userSchema.methods.setPassword = async function setPassword(plainPassword) {
  this.passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
};

userSchema.methods.verifyPassword = async function verifyPassword(plainPassword) {
  if (!this.passwordHash) {
    return false;
  }

  return bcrypt.compare(plainPassword, this.passwordHash);
};

/**
 * Shared Profile shape (shared/auth.ts) — never includes passwordHash.
 * @returns {import('../../shared/auth.ts').Profile}
 */
userSchema.methods.toProfile = function toProfile() {
  const streakCurrent = this.streak?.current ?? this.streak?.count;
  const includeStreak = streakCurrent != null && streakCurrent > 0;

  return {
    id: String(this._id),
    name: this.name ?? '',
    phone: this.phone ?? '',
    ...(this.email ? { email: this.email } : {}),
    ...(this.avatarUrl ? { avatarUrl: this.avatarUrl } : {}),
    state: this.state ?? '',
    ...(this.category ? { category: this.category } : {}),
    targetExam: this.targetExam ?? '',
    ...(this.examDate ? { examDate: this.examDate.toISOString() } : {}),
    language: this.language ?? 'en',
    ...(this.educationLevel ? { educationLevel: this.educationLevel } : {}),
    createdAt: (this.createdAt ?? new Date()).toISOString(),
    ...(includeStreak ? { streak: streakCurrent } : {}),
    rank: this.rank ?? null,
    level: this.level ?? 1,
    coins: this.coins ?? 0,
    onboardingComplete: Boolean(this.onboardingComplete),
  };
};

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
