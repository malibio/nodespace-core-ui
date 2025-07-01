import { VirtualNodeManager } from '../utils/virtualNodeManager';
import { NodeFactory } from '../utils/crudOperations';
import { NodeSpaceCallbacks } from '../types';

describe('VirtualNodeManager (NS-117)', () => {
  let virtualNodeManager: VirtualNodeManager;
  let mockCallbacks: NodeSpaceCallbacks;
  let mockOnTreeUpdate: jest.Mock;

  beforeEach(() => {
    mockOnTreeUpdate = jest.fn();
    mockCallbacks = {
      onNewNodeCreated: jest.fn()
    };
    virtualNodeManager = new VirtualNodeManager(mockCallbacks, mockOnTreeUpdate);
  });

  afterEach(() => {
    virtualNodeManager.destroy();
  });

  it('should create virtual nodes with temporary IDs', () => {
    const virtualNode = virtualNodeManager.createVirtualNode(
      () => NodeFactory.createTextNode('test content'),
      'parent-id'
    );

    expect(virtualNode.getNodeId()).toMatch(/^virtual-/);
    expect(virtualNode.getContent()).toBe('test content');
    expect(virtualNodeManager.isVirtualNode(virtualNode.getNodeId())).toBe(true);
  });

  it('should track pending conversions', () => {
    const virtualNode = virtualNodeManager.createVirtualNode(
      () => NodeFactory.createTextNode('test'),
      'parent-id'
    );

    const pendingConversions = virtualNodeManager.getPendingConversions();
    expect(pendingConversions.size).toBe(1);
    expect(pendingConversions.has(virtualNode.getNodeId())).toBe(true);
  });

  it('should emit newNodeCreated event after debounce delay', (done) => {
    const virtualNode = virtualNodeManager.createVirtualNode(
      () => NodeFactory.createTextNode('test'),
      'parent-id'
    );

    // Should call onNewNodeCreated after 300ms
    setTimeout(() => {
      expect(mockCallbacks.onNewNodeCreated).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onNewNodeCreated).toHaveBeenCalledWith(
        virtualNode,
        expect.any(Function)
      );
      done();
    }, 350); // Wait slightly longer than debounce delay
  });

  it('should handle conversion completion with real UUID', (done) => {
    const virtualNode = virtualNodeManager.createVirtualNode(
      () => NodeFactory.createTextNode('test'),
      'parent-id'
    );

    const originalId = virtualNode.getNodeId();
    const realUuid = 'real-uuid-123';

    // Mock the callback to simulate desktop-app providing real UUID
    (mockCallbacks.onNewNodeCreated as jest.Mock).mockImplementation((node, getNewNodeIdLambda) => {
      // Simulate desktop-app processing and calling back with real UUID
      setTimeout(() => {
        getNewNodeIdLambda(realUuid);
      }, 10);
    });

    setTimeout(() => {
      expect(virtualNode.getNodeId()).toBe(realUuid);
      expect(virtualNodeManager.isVirtualNode(originalId)).toBe(false);
      expect(mockOnTreeUpdate).toHaveBeenCalled();
      done();
    }, 400);
  });

  it('should cancel conversions when requested', () => {
    const virtualNode = virtualNodeManager.createVirtualNode(
      () => NodeFactory.createTextNode('test'),
      'parent-id'
    );

    virtualNodeManager.cancelConversion(virtualNode.getNodeId());
    
    expect(virtualNodeManager.getPendingConversions().size).toBe(0);
  });

  it('should handle missing onNewNodeCreated callback gracefully', (done) => {
    // Test fallback behavior when new callback is not provided
    const callbacksWithoutNew: NodeSpaceCallbacks = {};
    const fallbackManager = new VirtualNodeManager(callbacksWithoutNew, mockOnTreeUpdate);

    fallbackManager.createVirtualNode(
      () => NodeFactory.createTextNode('test'),
      'parent-id'
    );

    setTimeout(() => {
      // Should still work, just log a warning
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('onNewNodeCreated callback not provided')
      );
      fallbackManager.destroy();
      done();
    }, 350);
  });

  it('should clean up all conversions on destroy', () => {
    virtualNodeManager.createVirtualNode(() => NodeFactory.createTextNode('test1'));
    virtualNodeManager.createVirtualNode(() => NodeFactory.createTextNode('test2'));
    
    expect(virtualNodeManager.getPendingConversions().size).toBe(2);
    
    virtualNodeManager.destroy();
    
    expect(virtualNodeManager.getPendingConversions().size).toBe(0);
  });
});