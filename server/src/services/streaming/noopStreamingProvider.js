import { AppError } from '../../utils/AppError.js';

export const noopStreamingProvider = {
  id: 'noop',

  isConfigured() {
    return false;
  },

  async createRoom() {
    throw new AppError('Live streaming is not configured', 503, 'STREAMING_NOT_CONFIGURED');
  },

  async createViewerToken() {
    throw new AppError('Live streaming is not configured', 503, 'STREAMING_NOT_CONFIGURED');
  },

  async createHostToken() {
    throw new AppError('Live streaming is not configured', 503, 'STREAMING_NOT_CONFIGURED');
  },

  async getParticipantCount() {
    return 0;
  },

  async finalizeRecording() {
    return null;
  },

  getConnectionUrl() {
    return null;
  },
};
