import type { AiDoubtHistoryItem } from '../../api/ai';

export type AiChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'error';
  text: string;
  fromCache?: boolean;
  cacheSource?: string | null;
  answerId?: string;
  responseMs?: number;
  inputSummary?: string;
  imageUri?: string;
  imageBase64?: string | null;
  saved?: boolean;
  retryPayload?: {
    question: string;
    imageBase64?: string | null;
  };
};

export function historyToChatMessages(items: AiDoubtHistoryItem[]): AiChatMessage[] {
  const chronological = [...items].reverse();
  const messages: AiChatMessage[] = [];

  for (const item of chronological) {
    messages.push({
      id: `u_${item.id}`,
      role: 'user',
      text: item.question,
    });
    messages.push({
      id: `a_${item.id}`,
      role: 'assistant',
      text: item.explanation,
      fromCache: item.fromCache,
      answerId: item.id,
      responseMs: item.responseMs,
      inputSummary: item.question,
      saved: false,
    });
  }

  return messages;
}
