/**
 * Tests for useCollapsedStatePersistence hook
 */

import React from 'react';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useCollapsedStatePersistence } from '../useCollapsedStatePersistence';
import type { NodeSpaceCallbacks } from '../../hierarchy/NodeEditor';
import type { CollapsePersistenceConfig } from '../../types/persistence';

// Mock setTimeout/clearTimeout for better test control
jest.useFakeTimers();

describe('useCollapsedStatePersistence', () => {
  let mockCallbacks: NodeSpaceCallbacks;
  let mockConfig: CollapsePersistenceConfig;

  beforeEach(() => {
    mockCallbacks = {
      onLoadCollapsedState: jest.fn().mockResolvedValue(new Set(['node1', 'node2'])),
      onSaveCollapsedState: jest.fn().mockResolvedValue(undefined),
      onBatchCollapseChange: jest.fn().mockResolvedValue(undefined),
      onCollapseStateChange: jest.fn()
    };

    mockConfig = {
      enabled: true,
      debounceMs: 500,
      batchSize: 10,
      autoSave: true,
      loadOnMount: true
    };
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('initialization', () => {
    it('should initialize with empty set when no initial nodes provided', () => {
      const { result } = renderHook(() =>
        useCollapsedStatePersistence({ callbacks: mockCallbacks, config: mockConfig })
      );

      expect(result.current.collapsedNodes).toEqual(new Set());
    });

    it('should initialize with provided initial nodes', () => {
      const initialNodes = new Set(['node1', 'node2']);
      const { result } = renderHook(() =>
        useCollapsedStatePersistence({
          callbacks: mockCallbacks,
          config: mockConfig,
          initialNodes
        })
      );

      expect(result.current.collapsedNodes).toEqual(initialNodes);
    });

    it('should load state on mount when enabled', async () => {
      const { result } = renderHook(() =>
        useCollapsedStatePersistence({ callbacks: mockCallbacks, config: mockConfig })
      );

      expect(result.current.isLoading).toBe(true);
      expect(mockCallbacks.onLoadCollapsedState).toHaveBeenCalledTimes(1);

      await act(async () => {
        jest.runAllTimers();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.collapsedNodes).toEqual(new Set(['node1', 'node2']));
    });

    it('should not load state when loadOnMount is false', () => {
      const config = { ...mockConfig, loadOnMount: false };
      renderHook(() =>
        useCollapsedStatePersistence({ callbacks: mockCallbacks, config })
      );

      expect(mockCallbacks.onLoadCollapsedState).not.toHaveBeenCalled();
    });

    it('should not load state when disabled', () => {
      const config = { ...mockConfig, enabled: false };
      renderHook(() =>
        useCollapsedStatePersistence({ callbacks: mockCallbacks, config })
      );

      expect(mockCallbacks.onLoadCollapsedState).not.toHaveBeenCalled();
    });
  });

  describe('toggleNodeCollapse', () => {
    it('should toggle node collapse state', () => {
      const { result } = renderHook(() =>
        useCollapsedStatePersistence({ callbacks: mockCallbacks, config: mockConfig })
      );

      act(() => {
        result.current.toggleNodeCollapse('node1');
      });

      expect(result.current.collapsedNodes.has('node1')).toBe(true);
      expect(mockCallbacks.onCollapseStateChange).toHaveBeenCalledWith('node1', true);

      act(() => {
        result.current.toggleNodeCollapse('node1');
      });

      expect(result.current.collapsedNodes.has('node1')).toBe(false);
      expect(mockCallbacks.onCollapseStateChange).toHaveBeenCalledWith('node1', false);
    });

    it('should use batch operations when available', () => {
      const { result } = renderHook(() =>
        useCollapsedStatePersistence({ callbacks: mockCallbacks, config: mockConfig })
      );

      act(() => {
        result.current.toggleNodeCollapse('node1');
        result.current.toggleNodeCollapse('node2');
        result.current.toggleNodeCollapse('node3');
      });

      // Batch operations should be queued, not immediately executed
      expect(mockCallbacks.onBatchCollapseChange).not.toHaveBeenCalled();
      expect(mockCallbacks.onSaveCollapsedState).not.toHaveBeenCalled();

      // Fast-forward timers to trigger batch execution
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockCallbacks.onBatchCollapseChange).toHaveBeenCalledWith([
        { nodeId: 'node1', collapsed: true },
        { nodeId: 'node2', collapsed: true },
        { nodeId: 'node3', collapsed: true }
      ]);
    });

    it('should not save when autoSave is disabled', () => {
      const config = { ...mockConfig, autoSave: false };
      const { result } = renderHook(() =>
        useCollapsedStatePersistence({ callbacks: mockCallbacks, config })
      );

      act(() => {
        result.current.toggleNodeCollapse('node1');
      });

      expect(mockCallbacks.onBatchCollapseChange).not.toHaveBeenCalled();
      expect(mockCallbacks.onSaveCollapsedState).not.toHaveBeenCalled();
    });
  });

  describe('setCollapsedNodes', () => {
    it('should update collapsed nodes and save', async () => {
      const { result } = renderHook(() =>
        useCollapsedStatePersistence({ callbacks: mockCallbacks, config: mockConfig })
      );

      // Wait for initial load to complete
      await act(async () => {
        jest.runAllTimers();
      });

      const newNodes = new Set(['node3', 'node4']);

      await act(async () => {
        result.current.setCollapsedNodes(newNodes);
      });

      expect(result.current.collapsedNodes).toEqual(newNodes);
      expect(mockCallbacks.onSaveCollapsedState).toHaveBeenCalledWith(newNodes);
    });
  });

  describe('error handling', () => {
    it('should handle load errors with retry', async () => {
      const loadError = new Error('Load failed');
      mockCallbacks.onLoadCollapsedState = jest.fn().mockRejectedValue(loadError);

      const { result } = renderHook(() =>
        useCollapsedStatePersistence({ callbacks: mockCallbacks, config: mockConfig })
      );

      await act(async () => {
        jest.runAllTimers();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.lastSaveError).toEqual(loadError);

      // Should retry automatically with exponential backoff
      expect(mockCallbacks.onLoadCollapsedState).toHaveBeenCalledTimes(1);

      await act(async () => {
        jest.advanceTimersByTime(1000); // First retry delay
      });

      expect(mockCallbacks.onLoadCollapsedState).toHaveBeenCalledTimes(2);
    });

    it('should handle save errors', async () => {
      const saveError = new Error('Save failed');
      mockCallbacks.onSaveCollapsedState = jest.fn().mockRejectedValue(saveError);

      const { result } = renderHook(() =>
        useCollapsedStatePersistence({ callbacks: mockCallbacks, config: mockConfig })
      );

      const newNodes = new Set(['node1']);

      await act(async () => {
        result.current.setCollapsedNodes(newNodes);
      });

      expect(result.current.lastSaveError).toEqual(saveError);
    });

    it('should allow manual retry', async () => {
      const loadError = new Error('Load failed');
      mockCallbacks.onLoadCollapsedState = jest.fn()
        .mockRejectedValueOnce(loadError)
        .mockResolvedValueOnce(new Set(['node1']));

      const { result } = renderHook(() =>
        useCollapsedStatePersistence({ callbacks: mockCallbacks, config: mockConfig })
      );

      await act(async () => {
        jest.runAllTimers();
      });

      expect(result.current.lastSaveError).toEqual(loadError);

      // Manual retry should work
      await act(async () => {
        await result.current.retryLoad();
      });

      expect(result.current.lastSaveError).toBeNull();
      expect(result.current.collapsedNodes).toEqual(new Set(['node1']));
    });
  });

  describe('forceSave', () => {
    it('should force immediate save', async () => {
      const { result } = renderHook(() =>
        useCollapsedStatePersistence({ callbacks: mockCallbacks, config: mockConfig })
      );

      act(() => {
        result.current.toggleNodeCollapse('node1');
      });

      // Force save should trigger immediate batch execution
      await act(async () => {
        await result.current.forceSave();
      });

      expect(mockCallbacks.onBatchCollapseChange).toHaveBeenCalledWith([
        { nodeId: 'node1', collapsed: true }
      ]);
    });
  });

  describe('loading states', () => {
    it('should track loading state correctly', async () => {
      let resolveLoad: (value: Set<string>) => void;
      const loadPromise = new Promise<Set<string>>(resolve => {
        resolveLoad = resolve;
      });
      mockCallbacks.onLoadCollapsedState = jest.fn().mockReturnValue(loadPromise);

      const { result } = renderHook(() =>
        useCollapsedStatePersistence({ callbacks: mockCallbacks, config: mockConfig })
      );

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveLoad!(new Set(['node1']));
        await loadPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should track saving state correctly', async () => {
      let resolveSave: () => void;
      const savePromise = new Promise<void>(resolve => {
        resolveSave = resolve;
      });
      mockCallbacks.onSaveCollapsedState = jest.fn().mockReturnValue(savePromise);

      const { result } = renderHook(() =>
        useCollapsedStatePersistence({ callbacks: mockCallbacks, config: mockConfig })
      );

      const newNodes = new Set(['node1']);

      act(() => {
        result.current.setCollapsedNodes(newNodes);
      });

      expect(result.current.isSaving).toBe(true);

      await act(async () => {
        resolveSave!();
        await savePromise;
      });

      expect(result.current.isSaving).toBe(false);
    });
  });
});