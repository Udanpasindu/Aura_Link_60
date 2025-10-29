import React, { useState } from 'react';
import type { EmailMessage } from '../types/Email';
import { deleteReceivedEmail, markEmailAsRead, markAllEmailsAsRead } from '../services/EmailService';
import './EmailInbox.css';

interface EmailInboxProps {
  emails: EmailMessage[];
  onRefresh?: () => void;
  loading?: boolean;
}

const EmailInbox: React.FC<EmailInboxProps> = ({ emails, onRefresh, loading }) => {
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'unread' | 'read'>('all');
  const [markingAllRead, setMarkingAllRead] = useState(false);

  // Filter emails by search query
  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate unread and read emails
  const unreadEmails = filteredEmails.filter(email => !email.isRead);
  const readEmails = filteredEmails.filter(email => email.isRead);

  // Determine which emails to display based on view mode
  const displayedEmails = viewMode === 'all' 
    ? filteredEmails 
    : viewMode === 'unread' 
      ? unreadEmails 
      : readEmails;

  const handleEmailClick = async (email: EmailMessage) => {
    setSelectedEmail(email);
    
    // Mark as read if unread
    if (!email.isRead) {
      try {
        await markEmailAsRead(email.id);
        
        // Refresh to get updated data from backend
        if (onRefresh) {
          onRefresh();
        }
      } catch (error) {
        console.error('Error marking email as read:', error);
      }
    }
  };

  const handleDeleteEmail = async (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this email?')) {
      return;
    }

    setDeleting(emailId);
    try {
      await deleteReceivedEmail(emailId);
      
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

  const handleMarkAllAsRead = async () => {
    if (unreadEmails.length === 0) {
      alert('All emails are already marked as read!');
      return;
    }

    setMarkingAllRead(true);
    try {
      const result = await markAllEmailsAsRead();
      alert(`Successfully marked ${result.count} email(s) as read!`);
      
      // Refresh the list
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error marking all emails as read:', error);
      alert('Failed to mark all emails as read. Please try again.');
    } finally {
      setMarkingAllRead(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  const getPriorityIcon = (priority?: string) => {
    if (!priority) return '📧';
    switch (priority.toUpperCase()) {
      case 'HIGH':
        return '🔴';
      case 'MEDIUM':
        return '🟡';
      case 'LOW':
        return '🟢';
      default:
        return '📧';
    }
  };

  return (
    <div className="email-inbox-container">
      {/* Inbox Header */}
      <div className="inbox-header">
        <div className="inbox-header-top">
          <h2>📬 Inbox</h2>
          <div className="inbox-actions">
            <button 
              onClick={handleMarkAllAsRead} 
              disabled={markingAllRead || unreadEmails.length === 0}
              className="mark-all-read-btn"
              title="Mark all emails as read"
            >
              {markingAllRead ? '⏳ Marking...' : '✓ Mark All Read'}
            </button>
            {onRefresh && (
              <button onClick={onRefresh} disabled={loading} className="inbox-refresh-btn">
                {loading ? '↻ Loading...' : '↻ Refresh'}
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="inbox-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search emails by subject, sender, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="inbox-search-input"
          />
        </div>

        {/* View Mode Tabs */}
        <div className="inbox-view-tabs">
          <button 
            className={`view-tab ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            <span className="tab-icon">📨</span>
            <span className="tab-label">All</span>
            <span className="tab-count">{filteredEmails.length}</span>
          </button>
          <button 
            className={`view-tab ${viewMode === 'unread' ? 'active' : ''}`}
            onClick={() => setViewMode('unread')}
          >
            <span className="tab-icon">📬</span>
            <span className="tab-label">Unread</span>
            <span className="tab-count unread-count">{unreadEmails.length}</span>
          </button>
          <button 
            className={`view-tab ${viewMode === 'read' ? 'active' : ''}`}
            onClick={() => setViewMode('read')}
          >
            <span className="tab-icon">📭</span>
            <span className="tab-label">Read</span>
            <span className="tab-count">{readEmails.length}</span>
          </button>
        </div>
      </div>

      {/* Email Content */}
      <div className="inbox-content">
        {/* Email List */}
        <div className="inbox-list">
          {displayedEmails.length === 0 ? (
            <div className="inbox-empty">
              <div className="empty-icon">📭</div>
              <h3>No emails here</h3>
              <p>
                {searchQuery 
                  ? 'No emails found matching your search' 
                  : viewMode === 'unread'
                    ? 'All caught up! No unread emails.'
                    : viewMode === 'read'
                      ? 'No read emails yet.'
                      : 'Your inbox is empty.'}
              </p>
            </div>
          ) : (
            <div className="inbox-email-list">
              {displayedEmails.map((email) => (
                <div
                  key={email.id}
                  className={`inbox-email-item ${!email.isRead ? 'unread' : ''} ${
                    selectedEmail?.id === email.id ? 'selected' : ''
                  }`}
                  onClick={() => handleEmailClick(email)}
                >
                  <div className="email-item-left">
                    <div className={`email-read-indicator ${!email.isRead ? 'show' : ''}`} />
                    <div className="email-priority-icon">
                      {getPriorityIcon(email.priority)}
                    </div>
                  </div>
                  
                  <div className="email-item-content">
                    <div className="email-item-header-row">
                      <span className={`email-sender ${!email.isRead ? 'bold' : ''}`}>
                        {email.from.split('<')[0].trim() || email.from}
                      </span>
                      <span className="email-time">{formatDate(email.receivedAt)}</span>
                    </div>
                    
                    <div className={`email-subject ${!email.isRead ? 'bold' : ''}`}>
                      {email.subject || '(No Subject)'}
                    </div>
                    
                    {email.summary && (
                      <div className="email-summary-preview">
                        <span className="summary-badge">AI</span>
                        {email.summary}
                      </div>
                    )}
                    
                    <div className="email-preview-text">
                      {email.body.substring(0, 120)}
                      {email.body.length > 120 && '...'}
                    </div>
                  </div>

                  <div className="email-item-actions">
                    {email.priority && (
                      <span
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(email.priority) }}
                        title={`${email.priority} Priority`}
                      >
                        {email.priority}
                      </span>
                    )}
                    <button
                      className="delete-btn-mini"
                      onClick={(e) => handleDeleteEmail(email.id, e)}
                      disabled={deleting === email.id}
                      title="Delete email"
                    >
                      {deleting === email.id ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Details Panel */}
        {selectedEmail && (
          <div className="inbox-detail-panel">
            <div className="detail-panel-header">
              <div className="detail-header-top">
                <h3>{selectedEmail.subject || '(No Subject)'}</h3>
                <div className="detail-header-actions">
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDeleteEmail(selectedEmail.id, e)}
                    disabled={deleting === selectedEmail.id}
                    title="Delete email"
                  >
                    {deleting === selectedEmail.id ? '⏳ Deleting...' : '🗑️ Delete'}
                  </button>
                  <button 
                    className="close-panel-btn"
                    onClick={() => setSelectedEmail(null)}
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="detail-meta">
                <div className="detail-meta-row">
                  <div className="sender-info">
                    <div className="sender-avatar">
                      {selectedEmail.from.charAt(0).toUpperCase()}
                    </div>
                    <div className="sender-details">
                      <div className="sender-name">
                        {selectedEmail.from.split('<')[0].trim() || selectedEmail.from}
                      </div>
                      <div className="sender-email">{selectedEmail.from}</div>
                    </div>
                  </div>
                  <div className="email-timestamp">
                    {new Date(selectedEmail.receivedAt || '').toLocaleString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                <div className="detail-meta-row">
                  <strong>To:</strong> {selectedEmail.to.join(', ')}
                </div>

                {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                  <div className="detail-meta-row">
                    <strong>CC:</strong> {selectedEmail.cc.join(', ')}
                  </div>
                )}

                <div className="detail-badges">
                  {selectedEmail.priority && (
                    <span
                      className="detail-priority-badge"
                      style={{ backgroundColor: getPriorityColor(selectedEmail.priority) }}
                    >
                      {getPriorityIcon(selectedEmail.priority)} {selectedEmail.priority} Priority
                    </span>
                  )}
                  <span className={`detail-read-badge ${selectedEmail.isRead ? 'read' : 'unread'}`}>
                    {selectedEmail.isRead ? '✓ Read' : '⚠ Unread'}
                  </span>
                </div>

                {selectedEmail.summary && (
                  <div className="detail-ai-summary">
                    <div className="ai-summary-header">
                      <span className="ai-badge">🤖 AI Summary</span>
                    </div>
                    <p>{selectedEmail.summary}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-panel-body">
              {selectedEmail.isHtml ? (
                <div 
                  className="email-html-content"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body }} 
                />
              ) : (
                <div className="email-text-content">
                  {selectedEmail.body}
                </div>
              )}
            </div>

            {selectedEmail.errorMessage && (
              <div className="detail-error">
                <strong>⚠ Error:</strong> {selectedEmail.errorMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailInbox;
