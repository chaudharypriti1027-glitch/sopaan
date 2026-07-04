import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'default',
      unique: true,
      immutable: true,
    },
    freeAiQuota: {
      type: Number,
      default: 10,
      min: 0,
      max: 10_000,
    },
    freeAiTestsPerDay: {
      type: Number,
      default: 2,
      min: 0,
      max: 10_000,
    },
    freeAiQualityDoubtsPerDay: {
      type: Number,
      default: 2,
      min: 0,
      max: 10_000,
    },
    freeAiEvaluationsPerDay: {
      type: Number,
      default: 0,
      min: 0,
      max: 10_000,
    },
    freeMocksPerDay: {
      type: Number,
      default: 3,
      min: 0,
      max: 10_000,
    },
    freeShowAds: {
      type: Boolean,
      default: true,
    },
    freeDetailedAnalytics: {
      type: Boolean,
      default: false,
    },
    proPriceMonthly: {
      type: Number,
      default: 299,
      min: 1,
      max: 1_000_000,
    },
    proPriceYearly: {
      type: Number,
      default: 2499,
      min: 1,
      max: 10_000_000,
    },
    proAiTestsPerDay: {
      type: Number,
      default: 999,
      min: 0,
      max: 100_000,
    },
    proAiDoubtsPerDay: {
      type: Number,
      default: 200,
      min: 0,
      max: 100_000,
    },
    proAiQualityDoubtsPerDay: {
      type: Number,
      default: 50,
      min: 0,
      max: 100_000,
    },
    proAiEvaluationsPerDay: {
      type: Number,
      default: 999,
      min: 0,
      max: 100_000,
    },
    proMocksPerDay: {
      type: Number,
      default: 999,
      min: 0,
      max: 100_000,
    },
  },
  {
    timestamps: true,
  },
);

export const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);
