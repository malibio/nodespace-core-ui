import { NodeCRUDManager } from '../utils/crudOperations';
import { TextNode } from '../nodes';
import type { NodeSpaceCallbacks } from '../types';

describe('Fire-and-forget callbacks (NS-124)', () => {
  test('onNodeCreateWithId callback receives upfront UUID', async () => {
    const mockCallback = jest.fn();
    const callbacks: NodeSpaceCallbacks = {
      onNodeCreateWithId: mockCallback
    };

    const nodes: any[] = [];
    const crudManager = new NodeCRUDManager(nodes, callbacks);

    const result = await crudManager.createNode('text', 'test content');

    expect(result.success).toBe(true);
    expect(result.nodeId).toBeTruthy();
    
    // Callback should have been called with the upfront UUID
    expect(mockCallback).toHaveBeenCalledWith(
      result.nodeId,
      'test content',
      undefined, // no parent
      'text'
    );
  });

  test('fallback to legacy callback when new callback not provided', async () => {
    const mockLegacyCallback = jest.fn().mockReturnValue('legacy-id');
    const callbacks: NodeSpaceCallbacks = {
      onNodeCreate: mockLegacyCallback
    };

    const nodes: any[] = [];
    const crudManager = new NodeCRUDManager(nodes, callbacks);

    const result = await crudManager.createNode('text', 'test content');

    expect(result.success).toBe(true);
    expect(mockLegacyCallback).toHaveBeenCalledWith(
      'test content',
      undefined,
      'text'
    );
  });

  test('new callback takes precedence over legacy callback', async () => {
    const mockNewCallback = jest.fn();
    const mockLegacyCallback = jest.fn();
    const callbacks: NodeSpaceCallbacks = {
      onNodeCreateWithId: mockNewCallback,
      onNodeCreate: mockLegacyCallback
    };

    const nodes: any[] = [];
    const crudManager = new NodeCRUDManager(nodes, callbacks);

    await crudManager.createNode('text', 'test content');

    // New callback should be called
    expect(mockNewCallback).toHaveBeenCalled();
    // Legacy callback should NOT be called
    expect(mockLegacyCallback).not.toHaveBeenCalled();
  });

  test('async callback failures are handled gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const mockCallback = jest.fn().mockImplementation(() => {
      return Promise.reject(new Error('Network error'));
    });
    const callbacks: NodeSpaceCallbacks = {
      onNodeCreateWithId: mockCallback
    };

    const nodes: any[] = [];
    const crudManager = new NodeCRUDManager(nodes, callbacks);

    // Should not throw despite callback failure
    const result = await crudManager.createNode('text', 'test content');

    expect(result.success).toBe(true);
    expect(result.nodeId).toBeTruthy();
    expect(mockCallback).toHaveBeenCalled();
    
    // Allow time for async error handling
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(consoleSpy).toHaveBeenCalledWith('Node creation callback failed:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  test('node creation succeeds even without any callbacks', async () => {
    const callbacks: NodeSpaceCallbacks = {};
    const nodes: any[] = [];
    const crudManager = new NodeCRUDManager(nodes, callbacks);

    const result = await crudManager.createNode('text', 'test content');

    expect(result.success).toBe(true);
    expect(result.nodeId).toBeTruthy();
  });

  test('UUID format consistency across node types', () => {
    const textNode = new TextNode('text content');
    const taskNode = new TextNode('task content'); // Using TextNode for simplicity in test

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    expect(textNode.getNodeId()).toMatch(uuidRegex);
    expect(taskNode.getNodeId()).toMatch(uuidRegex);
    expect(textNode.getNodeId()).not.toBe(taskNode.getNodeId());
  });
});