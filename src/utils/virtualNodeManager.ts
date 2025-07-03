import { BaseNode } from '../nodes';
import { NodeSpaceCallbacks } from '../types';

export interface VirtualNodeConversion {
  virtualNode: BaseNode;
  timeoutId: NodeJS.Timeout;
  conversionTimeMs: number;
  isConverting: boolean;
}

/**
 * Virtual Node Manager
 * 
 * Manages the conversion of virtual nodes (with temporary IDs) to real nodes
 * after a debounce period. This moves debounce logic from desktop-app to core-ui.
 */
export class VirtualNodeManager {
  private pendingConversions = new Map<string, VirtualNodeConversion>();
  private readonly VIRTUAL_TO_REAL_DELAY = 300; // 300ms for virtual→real conversion
  private readonly UPDATE_DEBOUNCE_DELAY = 500; // 500ms for existing node updates
  
  constructor(
    private callbacks: NodeSpaceCallbacks,
    private onNodeTreeUpdate: (nodes: BaseNode[]) => void
  ) {}

  /**
   * Creates a virtual node that will be converted to a real node after debounce delay
   */
  createVirtualNode(
    nodeFactory: () => BaseNode,
    parentId?: string,
    afterSiblingId?: string
  ): BaseNode {
    const virtualNode = nodeFactory();
    
    // Mark as virtual by using a temporary ID prefix
    virtualNode.setNodeId(`virtual-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
    
    // Schedule conversion to real node
    const timeoutId = setTimeout(() => {
      this.convertVirtualToReal(virtualNode.getNodeId());
    }, this.VIRTUAL_TO_REAL_DELAY);
    
    // Track the pending conversion
    this.pendingConversions.set(virtualNode.getNodeId(), {
      virtualNode,
      timeoutId,
      conversionTimeMs: Date.now() + this.VIRTUAL_TO_REAL_DELAY,
      isConverting: false
    });
    
    return virtualNode;
  }

  /**
   * Converts a virtual node to a real node by emitting the newNodeCreated event
   */
  private async convertVirtualToReal(virtualNodeId: string): Promise<void> {
    const conversion = this.pendingConversions.get(virtualNodeId);
    if (!conversion || conversion.isConverting) {
      return;
    }

    conversion.isConverting = true;
    const { virtualNode } = conversion;

    try {
      // Create callback lambda for desktop-app to provide real UUID
      const getNewNodeIdLambda = (newNodeId: string) => {
        this.finalizeConversion(virtualNodeId, newNodeId);
      };

      // Use fire-and-forget pattern with contentPersistenceManager
      // No callback needed - virtual nodes are now handled by content persistence
      this.finalizeConversion(virtualNodeId, virtualNode.getNodeId());
    } catch (error) {
      console.error('Virtual to real conversion failed:', error);
      this.revertToVirtual(virtualNodeId);
    }
  }

  /**
   * Finalizes the conversion by updating the node with the real UUID
   */
  private finalizeConversion(virtualNodeId: string, realNodeId: string): void {
    const conversion = this.pendingConversions.get(virtualNodeId);
    if (!conversion) {
      return;
    }

    const { virtualNode } = conversion;
    
    // Update node with real UUID
    virtualNode.setNodeId(realNodeId);
    
    // Clean up conversion tracking
    this.pendingConversions.delete(virtualNodeId);
    
    // Trigger tree update
    this.onNodeTreeUpdate([]);
  }

  /**
   * Reverts a failed conversion back to virtual state with retry mechanism
   */
  private revertToVirtual(virtualNodeId: string): void {
    const conversion = this.pendingConversions.get(virtualNodeId);
    if (!conversion) {
      return;
    }

    console.warn(`Reverting virtual node ${virtualNodeId} due to conversion failure`);
    
    // Keep as virtual, but stop current conversion attempt
    conversion.isConverting = false;
    
    // Schedule retry after 1 second (exponential backoff could be added here)
    setTimeout(() => {
      const retryConversion = this.pendingConversions.get(virtualNodeId);
      if (retryConversion && !retryConversion.isConverting) {
        console.log(`Retrying conversion for virtual node ${virtualNodeId}`);
        this.convertVirtualToReal(virtualNodeId);
      }
    }, 1000);
  }

  /**
   * Cancels a pending virtual node conversion
   */
  cancelConversion(virtualNodeId: string): void {
    const conversion = this.pendingConversions.get(virtualNodeId);
    if (conversion) {
      clearTimeout(conversion.timeoutId);
      this.pendingConversions.delete(virtualNodeId);
    }
  }

  /**
   * Checks if a node is currently virtual (pending conversion)
   */
  isVirtualNode(nodeId: string): boolean {
    return this.pendingConversions.has(nodeId) || nodeId.startsWith('virtual-');
  }

  /**
   * Gets pending conversion info for debugging
   */
  getPendingConversions(): Map<string, VirtualNodeConversion> {
    return new Map(this.pendingConversions);
  }

  /**
   * Force convert all pending virtual nodes (for testing)
   */
  flushAllConversions(): void {
    const virtualNodeIds = Array.from(this.pendingConversions.keys());
    for (const virtualNodeId of virtualNodeIds) {
      this.convertVirtualToReal(virtualNodeId);
    }
  }

  /**
   * Clean up on component unmount
   */
  destroy(): void {
    const conversions = Array.from(this.pendingConversions.values());
    for (const conversion of conversions) {
      clearTimeout(conversion.timeoutId);
    }
    this.pendingConversions.clear();
  }
}