import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './demo/App';

test('renders NodeSpace UI title', () => {
  render(<App />);
  const titleElement = screen.getByText(/NodeSpace UI - Hierarchical Block Editor/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders complex node hierarchy with proper structure', () => {
  const { container } = render(<App />);
  
  // Should show add root node button
  expect(screen.getByText(/Add Root Node/i)).toBeInTheDocument();
  
  // Should show keyboard shortcuts help
  expect(screen.getByText(/Keyboard Shortcuts:/i)).toBeInTheDocument();
  
  // Should show demo scenario content (updated to match current demo)
  expect(screen.getByDisplayValue(/^Project Planning$/i)).toBeInTheDocument();
  expect(screen.getByDisplayValue(/^Documentation$/i)).toBeInTheDocument();
  expect(screen.getByDisplayValue(/^Sprint 1 Tasks$/i)).toBeInTheDocument();
  
  // Should have proper CSS classes and data attributes
  const nodeWrappers = container.querySelectorAll('.ns-node-wrapper');
  expect(nodeWrappers.length).toBeGreaterThan(0);
  
  // Should have node indicators
  const nodeIndicators = container.querySelectorAll('.ns-node-indicator');
  expect(nodeIndicators.length).toBeGreaterThan(0);
  
  // Check for text node indicators (TaskNodes handle their own checkboxes, not indicators)
  const textIndicators = container.querySelectorAll('.ns-node-indicator[data-node-type="text"]');
  expect(textIndicators.length).toBeGreaterThan(0);
  
  // TaskNodes should be present but don't use NodeIndicators
  const taskEditors = container.querySelectorAll('.ns-task-editor-container');
  expect(taskEditors.length).toBeGreaterThan(0);
});
