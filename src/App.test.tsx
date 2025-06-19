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
  
  // Should show test scenario content
  expect(screen.getByDisplayValue(/Root A \(collapsed\)/i)).toBeInTheDocument();
  expect(screen.getByDisplayValue(/Root B - DELETE ME/i)).toBeInTheDocument();
  expect(screen.getByDisplayValue(/Task Root/i)).toBeInTheDocument();
  
  // Should have proper CSS classes and data attributes
  const nodeWrappers = container.querySelectorAll('.ns-node-wrapper');
  expect(nodeWrappers.length).toBeGreaterThan(0);
  
  // Should have node indicators
  const nodeIndicators = container.querySelectorAll('.ns-node-indicator');
  expect(nodeIndicators.length).toBeGreaterThan(0);
  
  // Check for both text and task node types
  const textIndicators = container.querySelectorAll('.ns-node-indicator[data-node-type="text"]');
  const taskIndicators = container.querySelectorAll('.ns-node-indicator[data-node-type="task"]');
  expect(textIndicators.length).toBeGreaterThan(0);
  expect(taskIndicators.length).toBeGreaterThan(0);
});
