import React, { useState } from 'react';
import type { EmailMessage } from '../types/Email';
import { deleteSentEmail, deleteReceivedEmail } from '../services/EmailService';
import './EmailList.css';

interface EmailListProps {
  emails: EmailMessage[];
  title: string;
  onRefresh?: () => void;
  loading?: boolean;
  emailType?: 'sent' | 'received';
}

const EmailList: React.FC<EmailListProps> = ({ emails, title, onRefresh, loading, emailType }) => {
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteEmail = async (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this email?')) {
      return;
    }

    setDeleting(emailId);
    try {
      if (emailType === 'sent') {
        await deleteSentEmail(emailId);
      } else if (emailType === 'received') {
        await deleteReceivedEmail(emailId);
      }
      
      // Close detail view if the deleted email was selected
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }
      
      // Refresh the list
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting email:', error);
      alert('Failed to delete email. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SENT':
        return '#4caf50';
      case 'FAILED':
        return '#f44336';
      case 'RECEIVED':
        return '#2196f3';
      default:
        return '#9e9e9e';
    }
  };

  const getPriorityColor = (priority?: string) => {
    if (!priority) return '#9e9e9e';
    switch (priority.toUpperCase()) {
      case 'HIGH':
        return '#f44336';
      case 'MEDIUM':
        return '#ff9800';
      case 'LOW':
        return '#4caf50';
      default:
        return '#9e9e9e';
    }
  };

  const getPriorityLabel = (priority?: string) => {
    if (!priority) return '';
    return priority.toUpperCase();
  };

  return (
    <div className="email-list-container">
      <div className="email-list-header">
        <h2>{title}</h2>
        <div className="email-list-actions">
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="email-search-input"
          />
          {onRefresh && (
            <button onClick={onRefresh} disabled={loading} className="refresh-btn">
              {loading ? '↻ Loading...' : '↻ Refresh'}
            </button>
          )}
        </div>
      </div>

      <div className="email-list-content">
        <div className="email-list">
          {filteredEmails.length === 0 ? (
            <div className="no-emails">
              {searchQuery ? 'No emails found matching your search' : 'No emails to display'}
            </div>
          ) : (
            filteredEmails.map((email) => (
              <div
                key={email.id}
                className={`email-item ${selectedEmail?.id === email.id ? 'selected' : ''}`}
                onClick={() => setSelectedEmail(email)}
              >
                <div className="email-item-header">
                  <span className="email-from">{email.from}</span>
                  <div className="email-badges">
                    {email.priority && (
                      <span
                        className="email-priority"
                        style={{ backgroundColor: getPriorityColor(email.priority) }}
                      >
                        {getPriorityLabel(email.priority)}
                      </span>
                    )}
                    <span
                      className="email-status"
                      style={{ backgroundColor: getStatusColor(email.status) }}
                    >
                      {email.status}
                    </span>
                    {emailType && (
                      <button
                        className="delete-email-btn"
                        onClick={(e) => handleDeleteEmail(email.id, e)}
                        disabled={deleting === email.id}
                        title="Delete email"
                      >
                        {deleting === email.id ? '⏳' : '🗑️'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="email-subject">{email.subject}</div>
                {email.summary && (
                  <div className="email-summary">
                    <strong>AI Summary:</strong> {email.summary}
                  </div>
                )}
                <div className="email-preview">
                  {email.body.substring(0, 100)}
                  {email.body.length > 100 && '...'}
                </div>
                <div className="email-date">
                  {formatDate(email.sentAt || email.receivedAt)}
                </div>
              </div>
            ))
          )}
        </div>

        {selectedEmail && (
          <div className="email-details">
            <div className="email-details-header">
              <h3>{selectedEmail.subject}</h3>
              <div className="email-details-actions">
                {emailType && (
                  <button
                    onClick={(e) => handleDeleteEmail(selectedEmail.id, e)}
                    disabled={deleting === selectedEmail.id}
                    className="delete-detail-btn"
                    title="Delete email"
                  >
                    {deleting === selectedEmail.id ? '⏳ Deleting...' : '🗑️ Delete'}
                  </button>
                )}
                <button onClick={() => setSelectedEmail(null)} className="close-btn">
                  ✕
                </button>
              </div>
            </div>
            <div className="email-details-meta">
              <div className="email-meta-row">
                <strong>From:</strong> {selectedEmail.from}
              </div>
              <div className="email-meta-row">
                <strong>To:</strong> {selectedEmail.to.join(', ')}
              </div>
              {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                <div className="email-meta-row">
                  <strong>CC:</strong> {selectedEmail.cc.join(', ')}
                </div>
              )}
              <div className="email-meta-row">
                <strong>Date:</strong> {formatDate(selectedEmail.sentAt || selectedEmail.receivedAt)}
              </div>
              <div className="email-meta-row">
                <strong>Status:</strong>{' '}
                <span
                  className="email-status"
                  style={{ backgroundColor: getStatusColor(selectedEmail.status) }}
                >
                  {selectedEmail.status}
                </span>
              </div>
              {selectedEmail.priority && (
                <div className="email-meta-row">
                  <strong>Priority:</strong>{' '}
                  <span
                    className="email-priority"
                    style={{ backgroundColor: getPriorityColor(selectedEmail.priority) }}
                  >
                    {getPriorityLabel(selectedEmail.priority)}
                  </span>
                </div>
              )}
              {selectedEmail.summary && (
                <div className="email-meta-row">
                  <strong>AI Summary:</strong> {selectedEmail.summary}
                </div>
              )}
            </div>
            <div className="email-details-body">
              {selectedEmail.isHtml ? (
                <div dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />
              ) : (
                <pre>{selectedEmail.body}</pre>
              )}
            </div>
            {selectedEmail.errorMessage && (
              <div className="email-error">
                <strong>Error:</strong> {selectedEmail.errorMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailList;
