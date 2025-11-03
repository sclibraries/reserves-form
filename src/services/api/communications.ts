import { API_ENDPOINTS } from '@/config/endpoints';
import { getAuthHeaders } from '@/store/authStore';

export interface Message {
  id: number;
  resource_id: number | null;
  subject: string | null;
  message: string;
  category: 'question' | 'issue' | 'update' | 'note';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'active' | 'resolved' | 'archived';
  sender_name: string;
  sender_type: 'faculty' | 'staff';
  created_at: string;
  is_read: boolean;
  reply_count: number;
  replies: Reply[];
}

export interface Reply {
  id: number;
  message: string;
  sender_name: string;
  sender_type: 'faculty' | 'staff';
  created_at: string;
}

export interface CreateMessageRequest {
  message: string;
  subject?: string;
  category?: 'question' | 'issue' | 'update' | 'note';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  resource_id?: number;
  parent_message_id?: number;
}

export interface UpdateMessageRequest {
  message?: string;
  subject?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  status?: 'active' | 'resolved' | 'archived';
}

export class CommunicationsAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_ENDPOINTS.COURSE_RESERVES.BASE_URL;
  }

  /**
   * Get all messages for a submission
   */
  async getMessages(submissionUuid: string): Promise<Message[]> {
    const response = await fetch(
      `${this.baseUrl}/faculty-submission/${submissionUuid}/communications`,
      { 
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...getAuthHeaders()
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }

    const data = await response.json();
    return data.messages || [];
  }

  /**
   * Create a new message or reply
   */
  async createMessage(
    submissionUuid: string,
    data: CreateMessageRequest
  ): Promise<{ success: boolean; message_id: number; message: string }> {
    const response = await fetch(
      `${this.baseUrl}/faculty-submission/${submissionUuid}/communications`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data)
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create message: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update an existing message
   */
  async updateMessage(
    submissionUuid: string,
    messageId: number,
    data: UpdateMessageRequest
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(
      `${this.baseUrl}/faculty-submission/${submissionUuid}/communications/${messageId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data)
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update message: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete a message (soft delete - archives it)
   */
  async deleteMessage(
    submissionUuid: string,
    messageId: number
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(
      `${this.baseUrl}/faculty-submission/${submissionUuid}/communications/${messageId}`,
      {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          ...getAuthHeaders()
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete message: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Mark a message as read
   */
  async markAsRead(
    submissionUuid: string,
    messageId: number
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(
      `${this.baseUrl}/faculty-submission/${submissionUuid}/communications/${messageId}/read`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...getAuthHeaders()
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to mark message as read: ${response.statusText}`);
    }

    return await response.json();
  }
}
