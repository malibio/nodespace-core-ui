/**
 * Tests for CollapseBatchManager
 */

import { CollapseBatchManager, CollapseOperation } from '../collapseBatchOperations';

describe('CollapseBatchManager', () => {
  let mockBatchExecute: jest.Mock;
  let batchManager: CollapseBatchManager;

  beforeEach(() => {
    mockBatchExecute = jest.fn().mockResolvedValue(undefined);
    batchManager = new CollapseBatchManager(mockBatchExecute, 3, 100); // batchSize: 3, debounce: 100ms
  });

  afterEach(() => {
    batchManager.destroy();
  });

  describe('addOperation', () => {
    it('should add operations to the batch', () => {
      batchManager.addOperation('node1', true);
      batchManager.addOperation('node2', false);
      
      expect(batchManager.getPendingCount()).toBe(2);
    });

    it('should replace existing operation for the same node', () => {
      batchManager.addOperation('node1', true);
      batchManager.addOperation('node1', false);
      
      expect(batchManager.getPendingCount()).toBe(1);
    });

    it('should trigger immediate flush when batch size is reached', async () => {
      batchManager.addOperation('node1', true);
      batchManager.addOperation('node2', false);
      batchManager.addOperation('node3', true);
      
      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockBatchExecute).toHaveBeenCalledTimes(1);
      expect(mockBatchExecute).toHaveBeenCalledWith([
        expect.objectContaining({ nodeId: 'node1', collapsed: true }),
        expect.objectContaining({ nodeId: 'node2', collapsed: false }),
        expect.objectContaining({ nodeId: 'node3', collapsed: true })
      ]);
      expect(batchManager.getPendingCount()).toBe(0);
    });

    it('should debounce operations when batch size is not reached', async () => {
      batchManager.addOperation('node1', true);
      batchManager.addOperation('node2', false);
      
      // Should not execute immediately
      expect(mockBatchExecute).not.toHaveBeenCalled();
      
      // Wait for debounce period
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockBatchExecute).toHaveBeenCalledTimes(1);
      expect(batchManager.getPendingCount()).toBe(0);
    });
  });

  describe('flush', () => {
    it('should execute all pending operations', async () => {
      batchManager.addOperation('node1', true);
      batchManager.addOperation('node2', false);
      
      await batchManager.flush();
      
      expect(mockBatchExecute).toHaveBeenCalledWith([
        expect.objectContaining({ nodeId: 'node1', collapsed: true }),
        expect.objectContaining({ nodeId: 'node2', collapsed: false })
      ]);
      expect(batchManager.getPendingCount()).toBe(0);
    });

    it('should handle empty batch', async () => {
      await batchManager.flush();
      
      expect(mockBatchExecute).not.toHaveBeenCalled();
    });

    it('should re-queue operations on failure', async () => {
      const error = new Error('Batch execution failed');
      mockBatchExecute.mockRejectedValue(error);
      
      batchManager.addOperation('node1', true);
      
      await expect(batchManager.flush()).rejects.toThrow(error);
      expect(batchManager.getPendingCount()).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all pending operations', () => {
      batchManager.addOperation('node1', true);
      batchManager.addOperation('node2', false);
      
      batchManager.clear();
      
      expect(batchManager.getPendingCount()).toBe(0);
    });

    it('should cancel pending timeout', async () => {
      batchManager.addOperation('node1', true);
      batchManager.clear();
      
      // Wait longer than debounce period
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockBatchExecute).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should clear operations and cancel timeout', async () => {
      batchManager.addOperation('node1', true);
      batchManager.destroy();
      
      expect(batchManager.getPendingCount()).toBe(0);
      
      // Wait longer than debounce period
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockBatchExecute).not.toHaveBeenCalled();
    });
  });

  describe('operation timestamps', () => {
    it('should include timestamps in operations', async () => {
      const startTime = Date.now();
      batchManager.addOperation('node1', true);
      
      await batchManager.flush();
      
      const operations = mockBatchExecute.mock.calls[0][0] as CollapseOperation[];
      expect(operations[0].timestamp).toBeGreaterThanOrEqual(startTime);
      expect(operations[0].timestamp).toBeLessThanOrEqual(Date.now());
    });
  });
});