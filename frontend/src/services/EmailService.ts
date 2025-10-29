import axios from 'axios';
import type { EmailMessage, EmailRequest, EmailStats } from '../types/Email';

const API_URL = 'http://localhost:8080/api/email';

/**
 * Send an email with full control over recipients, subject, and body
 */
export const sendEmail = async (emailRequest: EmailRequest): Promise<EmailMessage> => {
  const response = await axios.post<EmailMessage>(`${API_URL}/send`, emailRequest);
  return response.data;
};

/**
 * Send a simple text email
 */
export const sendSimpleEmail = async (to: string, subject: string, body: string): Promise<EmailMessage> => {
  const response = await axios.post<EmailMessage>(
    `${API_URL}/send-simple`,
    null,
    {
      params: { to, subject, body }
    }
  );
  return response.data;
};

/**
 * Send a sensor alert email
 */
export const sendSensorAlert = async (
  to: string,
  alertType: string,
  message: string
): Promise<EmailMessage> => {
  const response = await axios.post<EmailMessage>(
    `${API_URL}/send-alert`,
    null,
    {
      params: { to, alertType, message }
    }
  );
  return response.data;
};

/**
 * Get all sent emails
 */
export const getSentEmails = async (): Promise<EmailMessage[]> => {
  const response = await axios.get<EmailMessage[]>(`${API_URL}/sent`);
  return response.data;
};

/**
 * Get a specific sent email by ID
 */
export const getSentEmailById = async (id: string): Promise<EmailMessage> => {
  const response = await axios.get<EmailMessage>(`${API_URL}/sent/${id}`);
  return response.data;
};

/**
 * Get all received emails
 */
export const getReceivedEmails = async (): Promise<EmailMessage[]> => {
  const response = await axios.get<EmailMessage[]>(`${API_URL}/received`);
  return response.data;
};

/**
 * Get a specific received email by ID
 */
export const getReceivedEmailById = async (id: string): Promise<EmailMessage> => {
  const response = await axios.get<EmailMessage>(`${API_URL}/received/${id}`);
  return response.data;
};

/**
 * Manually fetch new emails from the server
 */
export const fetchNewEmails = async (): Promise<EmailMessage[]> => {
  const response = await axios.post<EmailMessage[]>(`${API_URL}/fetch`);
  return response.data;
};

/**
 * Search emails by query string
 */
export const searchEmails = async (query: string): Promise<EmailMessage[]> => {
  const response = await axios.get<EmailMessage[]>(`${API_URL}/search`, {
    params: { query }
  });
  return response.data;
};

/**
 * Get email statistics
 */
export const getEmailStats = async (): Promise<EmailStats> => {
  const response = await axios.get<EmailStats>(`${API_URL}/stats`);
  return response.data;
};

/**
 * Clear sent emails history
 */
export const clearSentEmails = async (): Promise<{ message: string }> => {
  const response = await axios.delete<{ message: string }>(`${API_URL}/sent`);
  return response.data;
};

/**
 * Delete a specific sent email by ID
 */
export const deleteSentEmail = async (id: string): Promise<{ message: string }> => {
  const response = await axios.delete<{ message: string }>(`${API_URL}/sent/${id}`);
  return response.data;
};

/**
 * Clear received emails cache
 */
export const clearReceivedEmails = async (): Promise<{ message: string }> => {
  const response = await axios.delete<{ message: string }>(`${API_URL}/received`);
  return response.data;
};

/**
 * Delete a specific received email by ID
 */
export const deleteReceivedEmail = async (id: string): Promise<{ message: string }> => {
  const response = await axios.delete<{ message: string }>(`${API_URL}/received/${id}`);
  return response.data;
};

/**
 * Check email service health
 */
export const checkEmailHealth = async (): Promise<{ status: string; service: string }> => {
  const response = await axios.get<{ status: string; service: string }>(`${API_URL}/health`);
  return response.data;
};

/**
 * Reprocess a single email with AI
 */
export const reprocessEmailWithAI = async (id: string): Promise<EmailMessage> => {
  const response = await axios.post<EmailMessage>(`${API_URL}/ai/reprocess/${id}`);
  return response.data;
};

/**
 * Reprocess all emails with AI
 */
export const reprocessAllEmailsWithAI = async (): Promise<EmailMessage[]> => {
  const response = await axios.post<EmailMessage[]>(`${API_URL}/ai/reprocess-all`);
  return response.data;
};

/**
 * Get emails filtered by priority
 */
export const getEmailsByPriority = async (priority: string): Promise<EmailMessage[]> => {
  const response = await axios.get<EmailMessage[]>(`${API_URL}/priority/${priority}`);
  return response.data;
};

/**
 * Mark an email as read
 */
export const markEmailAsRead = async (id: string): Promise<{ message: string }> => {
  const response = await axios.put<{ message: string }>(`${API_URL}/received/${id}/read`);
  return response.data;
};

/**
 * Mark all emails as read
 */
export const markAllEmailsAsRead = async (): Promise<{ message: string; count: number }> => {
  const response = await axios.put<{ message: string; count: number }>(`${API_URL}/received/read-all`);
  return response.data;
};
