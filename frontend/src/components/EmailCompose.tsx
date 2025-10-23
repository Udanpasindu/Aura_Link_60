import React, { useState } from 'react';
import { sendEmail, sendSensorAlert } from '../services/EmailService';
import type { EmailRequest } from '../types/Email';
import './EmailCompose.css';

interface EmailComposeProps {
  onEmailSent?: () => void;
}

const EmailCompose: React.FC<EmailComposeProps> = ({ onEmailSent }) => {
  const [emailType, setEmailType] = useState<'standard' | 'alert'>('standard');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isHtml, setIsHtml] = useState(false);
  const [alertType, setAlertType] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage(null);

    try {
      if (emailType === 'standard') {
        const emailRequest: EmailRequest = {
          to: to.split(',').map(email => email.trim()),
          cc: cc ? cc.split(',').map(email => email.trim()) : [],
          bcc: bcc ? bcc.split(',').map(email => email.trim()) : [],
          subject,
          body,
          isHtml
        };

        await sendEmail(emailRequest);
        setMessage({ type: 'success', text: 'Email sent successfully!' });
      } else {
        await sendSensorAlert(to, alertType, body);
        setMessage({ type: 'success', text: 'Sensor alert sent successfully!' });
      }

      // Clear form
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
      setAlertType('');

      if (onEmailSent) {
        onEmailSent();
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setMessage({ type: 'error', text: 'Failed to send email. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="email-compose-container">
      <div className="email-compose-header">
        <h2>Compose Email</h2>
        <div className="email-type-selector">
          <button
            className={emailType === 'standard' ? 'active' : ''}
            onClick={() => setEmailType('standard')}
          >
            Standard Email
          </button>
          <button
            className={emailType === 'alert' ? 'active' : ''}
            onClick={() => setEmailType('alert')}
          >
            Sensor Alert
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="email-compose-form">
        <div className="form-group">
          <label htmlFor="to">
            To: <span className="required">*</span>
          </label>
          <input
            type="text"
            id="to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com (comma-separated for multiple)"
            required
          />
        </div>

        {emailType === 'standard' && (
          <>
            <div className="form-group">
              <label htmlFor="cc">CC:</label>
              <input
                type="text"
                id="cc"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com (comma-separated for multiple)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="bcc">BCC:</label>
              <input
                type="text"
                id="bcc"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="bcc@example.com (comma-separated for multiple)"
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label htmlFor="subject">
            {emailType === 'alert' ? 'Alert Type' : 'Subject'}: <span className="required">*</span>
          </label>
          {emailType === 'alert' ? (
            <input
              type="text"
              id="subject"
              value={alertType}
              onChange={(e) => setAlertType(e.target.value)}
              placeholder="e.g., High Temperature Alert"
              required
            />
          ) : (
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              required
            />
          )}
        </div>

        <div className="form-group">
          <label htmlFor="body">
            {emailType === 'alert' ? 'Alert Message' : 'Message'}: <span className="required">*</span>
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              emailType === 'alert'
                ? 'Describe the sensor alert...'
                : 'Enter your message here...'
            }
            rows={10}
            required
          />
        </div>

        {emailType === 'standard' && (
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={isHtml}
                onChange={(e) => setIsHtml(e.target.checked)}
              />
              Send as HTML
            </label>
          </div>
        )}

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" disabled={sending} className="send-btn">
            {sending ? 'Sending...' : `Send ${emailType === 'alert' ? 'Alert' : 'Email'}`}
          </button>
          <button
            type="button"
            onClick={() => {
              setTo('');
              setCc('');
              setBcc('');
              setSubject('');
              setBody('');
              setAlertType('');
              setMessage(null);
            }}
            className="clear-btn"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmailCompose;
