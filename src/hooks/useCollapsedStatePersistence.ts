/**
 * Hook for managing collapsed state persistence with loading, saving, and error handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { NodeSpaceCallbacks } from '../types';
import type { CollapsePersistenceConfig } from '../types/persistence';
import { CollapseBatchManager } from '../utils/collapseBatchOperations';

export interface UseCollapsedStatePersistenceOptions {
  callbacks?: NodeSpaceCallbacks;
  config?: CollapsePersistenceConfig;
  initialNodes?: Set<string>;
}

export interface UseCollapsedStatePersistenceReturn {
  collapsedNodes: Set<string>;
  setCollapsedNodes: (nodes: Set<string>) => void;
  toggleNodeCollapse: (nodeId: string) => void;
  isLoading: boolean;
  isSaving: boolean;
  lastSaveError: Error | null;
  retryLoad: () => Promise<void>;
  forceSave: () => Promise<void>;
}

const DEFAULT_CONFIG: CollapsePersistenceConfig = {
  enabled: true,
  debounceMs: 500,
  batchSize: 10,
  autoSave: true,
  loadOnMount: true,
};

export function useCollapsedStatePersistence(
  options: UseCollapsedStatePersistenceOptions
): UseCollapsedStatePersistenceReturn {
  const { callbacks, config: userConfig, initialNodes } = options;
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  // State management
  const [collapsedNodes, setCollapsedNodesState] = useState<Set<string>>(
    initialNodes || new Set()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveError, setLastSaveError] = useState<Error | null>(null);
  
  // Refs for cleanup and batch management
  const batchManagerRef = useRef<CollapseBatchManager | null>(null);
  const mountedRef = useRef(true);
  const loadRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // Initialize batch manager
  useEffect(() => {
    if (!config.enabled || !callbacks?.onBatchCollapseChange) return;

    const handleBatchExecute = async (operations: Array<{ nodeId: string; collapsed: boolean; timestamp: number }>) => {
      if (!mountedRef.current) return;
      
      setIsSaving(true);
      setLastSaveError(null);

      try {
        // Convert to the format expected by callback
        const changes = operations.map(op => ({
          nodeId: op.nodeId,
          collapsed: op.collapsed
        }));

        await callbacks.onBatchCollapseChange!(changes);
      } catch (error) {
        const saveError = error as Error;
        setLastSaveError(saveError);
        throw saveError;
      } finally {
        if (mountedRef.current) {
          setIsSaving(false);
        }
      }
    };

    batchManagerRef.current = new CollapseBatchManager(
      handleBatchExecute,
      config.batchSize,
      config.debounceMs
    );

    return () => {
      batchManagerRef.current?.destroy();
      batchManagerRef.current = null;
    };
  }, [config.enabled, config.batchSize, config.debounceMs, callbacks?.onBatchCollapseChange]);

  // Load collapsed state on mount
  const loadCollapsedState = useCallback(async (): Promise<void> => {
    if (!config.enabled || !config.loadOnMount || !callbacks?.onLoadCollapsedState) {
      return;
    }

    setIsLoading(true);
    setLastSaveError(null);

    try {
      const loadedNodes = await callbacks.onLoadCollapsedState();
      if (mountedRef.current) {
        setCollapsedNodesState(loadedNodes);
        retryCountRef.current = 0; // Reset retry count on successful load
      }
    } catch (error) {
      const loadError = error as Error;
      if (mountedRef.current) {
        setLastSaveError(loadError);
        
        // Exponential backoff retry for load failures
        const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
        retryCountRef.current++;
        
        if (retryCountRef.current <= 3) {
          loadRetryTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              loadCollapsedState();
            }
          }, retryDelay);
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [config.enabled, config.loadOnMount, callbacks]);

  // Load on mount
  useEffect(() => {
    loadCollapsedState();
  }, [loadCollapsedState]);

  // Manual retry function
  const retryLoad = useCallback(async (): Promise<void> => {
    retryCountRef.current = 0; // Reset retry count for manual retry
    await loadCollapsedState();
  }, [loadCollapsedState]);

  // Save collapsed state
  const saveCollapsedState = useCallback(async (nodes: Set<string>): Promise<void> => {
    if (!config.enabled || !config.autoSave || !callbacks?.onSaveCollapsedState) {
      return;
    }

    setIsSaving(true);
    setLastSaveError(null);

    try {
      await callbacks.onSaveCollapsedState(nodes);
    } catch (error) {
      const saveError = error as Error;
      if (mountedRef.current) {
        setLastSaveError(saveError);
      }
      throw saveError;
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [config.enabled, config.autoSave, callbacks]);

  // Force save function
  const forceSave = useCallback(async (): Promise<void> => {
    if (batchManagerRef.current) {
      await batchManagerRef.current.flush();
    } else {
      await saveCollapsedState(collapsedNodes);
    }
  }, [saveCollapsedState, collapsedNodes]);

  // Set collapsed nodes with persistence
  const setCollapsedNodes = useCallback((nodes: Set<string>): void => {
    setCollapsedNodesState(nodes);

    if (config.enabled && config.autoSave) {
      if (batchManagerRef.current) {
        // Use batch manager for better performance
        // This is a complete state replacement, so we need to handle it differently
        // For now, fall back to direct save
        saveCollapsedState(nodes).catch(() => {
          // Error already handled in saveCollapsedState
        });
      } else {
        saveCollapsedState(nodes).catch(() => {
          // Error already handled in saveCollapsedState
        });
      }
    }
  }, [config.enabled, config.autoSave, saveCollapsedState]);

  // Toggle individual node collapse
  const toggleNodeCollapse = useCallback((nodeId: string): void => {
    let wasCollapsed: boolean;
    let isNowCollapsed: boolean;
    
    setCollapsedNodesState(prev => {
      const newSet = new Set(prev);
      wasCollapsed = newSet.has(nodeId);
      isNowCollapsed = !wasCollapsed;

      if (isNowCollapsed) {
        newSet.add(nodeId);
      } else {
        newSet.delete(nodeId);
      }

      return newSet;
    });

    // Immediate callback for UI responsiveness (moved outside setState)
    if (callbacks?.onCollapseStateChange) {
      callbacks.onCollapseStateChange(nodeId, isNowCollapsed!);
    }

    // Batch persistence if enabled
    if (config.enabled && config.autoSave && batchManagerRef.current) {
      batchManagerRef.current.addOperation(nodeId, isNowCollapsed!);
    } else if (config.enabled && config.autoSave) {
      // Fallback to direct save - get the updated state
      setCollapsedNodesState(currentState => {
        saveCollapsedState(currentState).catch(() => {
          // Error already handled in saveCollapsedState
        });
        return currentState; // No state change, just access current state
      });
    }
  }, [callbacks, config.enabled, config.autoSave, saveCollapsedState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (loadRetryTimeoutRef.current) {
        clearTimeout(loadRetryTimeoutRef.current);
      }
      batchManagerRef.current?.destroy();
    };
  }, []);

  return {
    collapsedNodes,
    setCollapsedNodes,
    toggleNodeCollapse,
    isLoading,
    isSaving,
    lastSaveError,
    retryLoad,
    forceSave,
  };
}