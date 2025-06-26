/**
 * Type definitions for collapsed state persistence
 */

export interface CollapsedStateData {
  nodes: Record<string, boolean>;
  timestamp: number;
  version: string;
}

export interface PersistenceError extends Error {
  code: 'LOAD_FAILED' | 'SAVE_FAILED' | 'NETWORK_ERROR' | 'VALIDATION_ERROR';
  retryable: boolean;
  details?: any;
}

export interface PersistenceMetrics {
  loadTime: number;
  saveTime: number;
  batchSize: number;
  errorCount: number;
}

export interface CollapsePersistenceConfig {
  enabled: boolean;
  debounceMs: number;          // Debounce saves (default: 500ms)
  batchSize: number;           // Batch multiple changes (default: 10)
  autoSave: boolean;           // Auto-save on changes (default: true)
  loadOnMount: boolean;        // Load state on component mount (default: true)
}