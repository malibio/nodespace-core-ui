/**
 * Tests for CollapsedStateLoader component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollapsedStateLoader } from '../CollapsedStateLoader';

describe('CollapsedStateLoader', () => {
  const mockChildren = <div data-testid="child-content">Child Content</div>;
  const mockError = new Error('Test error');
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('normal state', () => {
    it('should render children normally when not loading and no error', () => {
      render(
        <CollapsedStateLoader isLoading={false} error={null}>
          {mockChildren}
        </CollapsedStateLoader>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.queryByText('Loading collapsed state...')).not.toBeInTheDocument();
      expect(screen.queryByText('Failed to load collapsed state')).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading skeleton when loading', () => {
      render(
        <CollapsedStateLoader isLoading={true} error={null}>
          {mockChildren}
        </CollapsedStateLoader>
      );

      expect(screen.getByText('Loading collapsed state...')).toBeInTheDocument();
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      
      // Children should have reduced opacity and disabled interactions
      const loadingContent = screen.getByTestId('child-content').parentElement;
      expect(loadingContent).toHaveStyle({ opacity: '0.5', pointerEvents: 'none' });
    });

    it('should show loading spinner when loading', () => {
      render(
        <CollapsedStateLoader isLoading={true} error={null}>
          {mockChildren}
        </CollapsedStateLoader>
      );

      const spinner = document.querySelector('.ns-loading-spinner');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error banner when error exists', () => {
      render(
        <CollapsedStateLoader isLoading={false} error={mockError}>
          {mockChildren}
        </CollapsedStateLoader>
      );

      expect(screen.getByText('Failed to load collapsed state')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('should show retry button when onRetry is provided', () => {
      render(
        <CollapsedStateLoader isLoading={false} error={mockError} onRetry={mockOnRetry}>
          {mockChildren}
        </CollapsedStateLoader>
      );

      const retryButton = screen.getByRole('button', { name: 'Retry loading collapsed state' });
      expect(retryButton).toBeInTheDocument();
    });

    it('should not show retry button when onRetry is not provided', () => {
      render(
        <CollapsedStateLoader isLoading={false} error={mockError}>
          {mockChildren}
        </CollapsedStateLoader>
      );

      expect(screen.queryByRole('button', { name: 'Retry loading collapsed state' })).not.toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', () => {
      render(
        <CollapsedStateLoader isLoading={false} error={mockError} onRetry={mockOnRetry}>
          {mockChildren}
        </CollapsedStateLoader>
      );

      const retryButton = screen.getByRole('button', { name: 'Retry loading collapsed state' });
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('should show error icon', () => {
      render(
        <CollapsedStateLoader isLoading={false} error={mockError}>
          {mockChildren}
        </CollapsedStateLoader>
      );

      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });
  });

  describe('combined states', () => {
    it('should prioritize loading state over error state', () => {
      render(
        <CollapsedStateLoader isLoading={true} error={mockError}>
          {mockChildren}
        </CollapsedStateLoader>
      );

      expect(screen.getByText('Loading collapsed state...')).toBeInTheDocument();
      expect(screen.queryByText('Failed to load collapsed state')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper aria-label on retry button', () => {
      render(
        <CollapsedStateLoader isLoading={false} error={mockError} onRetry={mockOnRetry}>
          {mockChildren}
        </CollapsedStateLoader>
      );

      const retryButton = screen.getByRole('button', { name: 'Retry loading collapsed state' });
      expect(retryButton).toHaveAttribute('aria-label', 'Retry loading collapsed state');
    });
  });

  describe('CSS classes', () => {
    it('should apply correct CSS classes for loading state', () => {
      render(
        <CollapsedStateLoader isLoading={true} error={null}>
          {mockChildren}
        </CollapsedStateLoader>
      );

      expect(document.querySelector('.ns-collapsed-state-loader')).toBeInTheDocument();
      expect(document.querySelector('.ns-loading-skeleton')).toBeInTheDocument();
      expect(document.querySelector('.ns-loading-spinner')).toBeInTheDocument();
      expect(document.querySelector('.ns-loading-text')).toBeInTheDocument();
      expect(document.querySelector('.ns-loading-content')).toBeInTheDocument();
    });

    it('should apply correct CSS classes for error state', () => {
      render(
        <CollapsedStateLoader isLoading={false} error={mockError} onRetry={mockOnRetry}>
          {mockChildren}
        </CollapsedStateLoader>
      );

      expect(document.querySelector('.ns-collapsed-state-loader')).toBeInTheDocument();
      expect(document.querySelector('.ns-error-banner')).toBeInTheDocument();
      expect(document.querySelector('.ns-error-content')).toBeInTheDocument();
      expect(document.querySelector('.ns-error-icon')).toBeInTheDocument();
      expect(document.querySelector('.ns-error-details')).toBeInTheDocument();
      expect(document.querySelector('.ns-error-title')).toBeInTheDocument();
      expect(document.querySelector('.ns-error-message')).toBeInTheDocument();
      expect(document.querySelector('.ns-retry-button')).toBeInTheDocument();
      expect(document.querySelector('.ns-error-fallback-content')).toBeInTheDocument();
    });
  });
});