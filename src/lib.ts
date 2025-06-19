// Main library export
import './nodeSpace.css';

export { default } from './NodeSpaceEditor';

// Export types and utilities that consumers might need
export * from './nodes';
export * from './utils';
export * from './hierarchy';
export * from './editors';
export * from './Icon';
export * from './NodeIndicator';
export * from './SlashCommandModal';

// Export the main component interface
export type { NodeSpaceEditorProps } from './NodeSpaceEditor';