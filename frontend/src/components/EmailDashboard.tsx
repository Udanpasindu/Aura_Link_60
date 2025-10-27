import React, { useState, useEffect } from 'react';
import EmailCompose from './EmailCompose';
import EmailList from './EmailList';
import {
  getSentEmails,
  getReceivedEmails,
  fetchNewEmails,
  getEmailStats,
  getEmailsByPriority,
  reprocessAllEmailsWithAI
} from '../services/EmailService';
import type { EmailMessage, EmailStats } from '../types/Email';
import './EmailDashboard.css';

const EmailDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compose' | 'sent' | 'received'>('compose');
  const [sentEmails, setSentEmails] = useState<EmailMessage[]>([]);
  const [receivedEmails, setReceivedEmails] = useState<EmailMessage[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [stats, setStats] = useState<EmailStats>({
    sentCount: 0,
    receivedCount: 0,
    unreadCount: 0,
    failedCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [aiProcessing, setAiProcessing] = useState(false);

  const loadSentEmails = async () => {
    try {
      const emails = await getSentEmails();
      setSentEmails(emails);
    } catch (error) {
      console.error('Error loading sent emails:', error);
    }
  };

  const loadReceivedEmails = async () => {
    try {
      let emails;
      if (priorityFilter) {
        emails = await getEmailsByPriority(priorityFilter);
      } else {
        emails = await getReceivedEmails();
      }
      setReceivedEmails(emails);
    } catch (error) {
      console.error('Error loading received emails:', error);
    }
  };

  const loadStats = async () => {
    try {
      const emailStats = await getEmailStats();
      setStats(emailStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFetchNewEmails = async () => {
    setLoading(true);
    try {
      await fetchNewEmails();
      await loadReceivedEmails();
      await loadStats();
    } catch (error) {
      console.error('Error fetching new emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshReceivedEmails = async () => {
    try {
      await loadReceivedEmails();
      await loadStats();
    } catch (error) {
      console.error('Error refreshing received emails:', error);
    }
  };

  const handleRefreshAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadSentEmails(), loadReceivedEmails(), loadStats()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSent = () => {
    loadSentEmails();
    loadStats();
    setActiveTab('sent');
  };

  const handleReprocessAllEmails = async () => {
    setAiProcessing(true);
    try {
      await reprocessAllEmailsWithAI();
      await loadReceivedEmails();
      alert('All emails have been reprocessed with AI!');
    } catch (error) {
      console.error('Error reprocessing emails:', error);
      alert('Failed to reprocess emails. Please try again.');
    } finally {
      setAiProcessing(false);
    }
  };

  const handlePriorityFilter = (priority: string | null) => {
    setPriorityFilter(priority);
  };

  useEffect(() => {
    loadSentEmails();
    loadReceivedEmails();
    loadStats();
  }, []);

  useEffect(() => {
    loadReceivedEmails();
  }, [priorityFilter]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadReceivedEmails();
      loadStats();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className="email-dashboard">
      <div className="email-dashboard-header">
        <div className="header-title">
          <h1>📧 Email Management</h1>
          <p>Send and manage emails for your AuraLink system</p>
        </div>
        <div className="header-actions">
          <button onClick={handleFetchNewEmails} disabled={loading} className="fetch-btn">
            {loading ? '↻ Fetching...' : '↻ Fetch New Emails'}
          </button>
          <button onClick={handleRefreshAll} disabled={loading} className="refresh-all-btn">
            ⟳ Refresh All
          </button>
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
        </div>
      </div>

      <div className="email-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#4caf50' }}>📤</div>
          <div className="stat-content">
            <div className="stat-value">{stats.sentCount}</div>
            <div className="stat-label">Sent Emails</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#2196f3' }}>📥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.receivedCount}</div>
            <div className="stat-label">Received Emails</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#ff9800' }}>📬</div>
          <div className="stat-content">
            <div className="stat-value">{stats.unreadCount}</div>
            <div className="stat-label">Unread</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f44336' }}>⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.failedCount}</div>
            <div className="stat-label">Failed</div>
          </div>
        </div>
      </div>

      <div className="email-tabs">
        <button
          className={activeTab === 'compose' ? 'active' : ''}
          onClick={() => setActiveTab('compose')}
        >
          ✉️ Compose
        </button>
        <button
          className={activeTab === 'sent' ? 'active' : ''}
          onClick={() => setActiveTab('sent')}
        >
          📤 Sent ({sentEmails.length})
        </button>
        <button
          className={activeTab === 'received' ? 'active' : ''}
          onClick={() => setActiveTab('received')}
        >
          📥 Received ({receivedEmails.length})
        </button>
      </div>

      {activeTab === 'received' && (
        <div className="priority-filters">
          <span className="filter-label">Filter by Priority:</span>
          <button
            className={priorityFilter === null ? 'filter-btn active' : 'filter-btn'}
            onClick={() => handlePriorityFilter(null)}
          >
            All
          </button>
          <button
            className={priorityFilter === 'HIGH' ? 'filter-btn high active' : 'filter-btn high'}
            onClick={() => handlePriorityFilter('HIGH')}
          >
            🔴 High
          </button>
          <button
            className={priorityFilter === 'MEDIUM' ? 'filter-btn medium active' : 'filter-btn medium'}
            onClick={() => handlePriorityFilter('MEDIUM')}
          >
            🟡 Medium
          </button>
          <button
            className={priorityFilter === 'LOW' ? 'filter-btn low active' : 'filter-btn low'}
            onClick={() => handlePriorityFilter('LOW')}
          >
            🟢 Low
          </button>
          <button
            className="ai-reprocess-btn"
            onClick={handleReprocessAllEmails}
            disabled={aiProcessing}
          >
            {aiProcessing ? '🤖 Processing...' : '🤖 Reprocess All with AI'}
          </button>
        </div>
      )}

      <div className="email-content">
        {activeTab === 'compose' && <EmailCompose onEmailSent={handleEmailSent} />}
        {activeTab === 'sent' && (
          <EmailList
            emails={sentEmails}
            title="Sent Emails"
            onRefresh={loadSentEmails}
            loading={loading}
            emailType="sent"
          />
        )}
        {activeTab === 'received' && (
          <EmailList
            emails={receivedEmails}
            title="Received Emails"
            onRefresh={handleRefreshReceivedEmails}
            loading={loading}
            emailType="received"
          />
        )}
      </div>
    </div>
  );
};

export default EmailDashboard;
