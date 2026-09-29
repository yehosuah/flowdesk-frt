import { apiClient } from '@/services/apiClient';

export interface ChatSource {
  tool: string;
  domain: 'inventory' | 'sales' | 'customers';
  start_date: string | null;
  end_date: string | null;
  as_of: string;
  filters: Record<string, unknown>;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string | null;
}

export interface ChatResponse {
  conversation_id: string;
  message_id: string;
  answer: string;
  created_at: string;
  expires_at: string;
  sources: ChatSource[];
  limitations: string[];
}

export function sendChatMessage(
  message: string,
  conversationId: string | null,
): Promise<ChatResponse> {
  const body: ChatRequest = {
    message,
    conversation_id: conversationId,
  };

  return apiClient.request<ChatResponse>(
    '/api/v1/ai/chat',
    {
      method: 'POST',
      auth: true,
      body,
    },
  );
}