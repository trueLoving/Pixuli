import { RefreshCw, X } from 'lucide-react';
import React from 'react';
import './ContentFeedback.css';

export type ContentFeedbackVariant = 'error' | 'warning';

export interface ContentFeedbackProps {
  variant?: ContentFeedbackVariant;
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  retryLabel?: string;
  dismissLabel?: string;
  className?: string;
}

const ContentFeedback: React.FC<ContentFeedbackProps> = ({
  variant = 'error',
  message,
  onDismiss,
  onRetry,
  retryLabel = 'Retry',
  dismissLabel = 'Dismiss',
  className = '',
}) => {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`content-feedback content-feedback--${variant} ${className}`.trim()}
      role="alert"
    >
      <p className="content-feedback-message">{message}</p>
      <div className="content-feedback-actions">
        {onRetry ? (
          <button
            type="button"
            className="content-feedback-button content-feedback-button--retry"
            onClick={onRetry}
          >
            <RefreshCw
              className="content-feedback-icon content-feedback-icon--sm"
              aria-hidden
            />
            {retryLabel}
          </button>
        ) : null}
        {onDismiss ? (
          <button
            type="button"
            className="content-feedback-button content-feedback-button--dismiss"
            onClick={onDismiss}
            aria-label={dismissLabel}
          >
            <X className="content-feedback-icon" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default ContentFeedback;
