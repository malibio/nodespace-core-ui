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

// Export persistence functionality
export * from './types/persistence';
export * from './hooks/useCollapsedStatePersistence';
export * from './components/CollapsedStateLoader';

// Export chat interfaces and types
export * from './types/chat';

// Export the main component interface
export type { NodeSpaceEditorProps } from './NodeSpaceEditor';