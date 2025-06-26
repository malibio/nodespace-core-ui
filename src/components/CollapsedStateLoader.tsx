/**
 * Loading state management component for collapsed state persistence
 */

import React from 'react';

interface CollapsedStateLoaderProps {
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

export const CollapsedStateLoader: React.FC<CollapsedStateLoaderProps> = ({
  isLoading,
  error,
  onRetry,
  children
}) => {
  // Show loading state
  if (isLoading) {
    return (
      <div className="ns-collapsed-state-loader">
        <div className="ns-loading-skeleton">
          <div className="ns-loading-spinner"></div>
          <div className="ns-loading-text">Loading collapsed state...</div>
        </div>
        {/* Render children with reduced opacity during loading */}
        <div className="ns-loading-content" style={{ opacity: 0.5, pointerEvents: 'none' }}>
          {children}
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="ns-collapsed-state-loader">
        <div className="ns-error-banner">
          <div className="ns-error-content">
            <span className="ns-error-icon">⚠️</span>
            <div className="ns-error-details">
              <div className="ns-error-title">Failed to load collapsed state</div>
              <div className="ns-error-message">{error.message}</div>
            </div>
            {onRetry && (
              <button 
                className="ns-retry-button" 
                onClick={onRetry}
                aria-label="Retry loading collapsed state"
              >
                Retry
              </button>
            )}
          </div>
        </div>
        {/* Still render children even with error - fall back to local state */}
        <div className="ns-error-fallback-content">
          {children}
        </div>
      </div>
    );
  }

  // Normal state - just render children
  return <>{children}</>;
};