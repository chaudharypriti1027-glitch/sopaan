import mongoose from 'mongoose';

const vocabularyWordSchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: true,
      trim: true,
    },
    pronunciation: {
      type: String,
      trim: true,
    },
    partOfSpeech: {
      type: String,
      trim: true,
    },
    meaning: {
      type: String,
      required: true,
      trim: true,
    },
    example: {
      type: String,
      trim: true,
    },
    synonyms: {
      type: [String],
      default: [],
    },
    date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

vocabularyWordSchema.index({ date: -1 });
vocabularyWordSchema.index({ word: 1 }, { unique: true });
vocabularyWordSchema.index({ word: 'text', meaning: 'text' });

export const VocabularyWord = mongoose.model('VocabularyWord', vocabularyWordSchema);
