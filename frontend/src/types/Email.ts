export interface EmailMessage {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml: boolean;
  sentAt?: string;
  receivedAt?: string;
  attachmentNames?: string[];
  status: string;
  errorMessage?: string;
  summary?: string;
  priority?: string;
  isRead?: boolean;
}

export interface EmailRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml: boolean;
}

export interface EmailStats {
  sentCount: number;
  receivedCount: number;
  unreadCount: number;
  failedCount: number;
}

export interface SimpleEmailRequest {
  to: string;
  subject: string;
  body: string;
}

export interface SensorAlertRequest {
  to: string;
  alertType: string;
  message: string;
}
