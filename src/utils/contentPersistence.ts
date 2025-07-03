/**
 * Content-based persistence manager
 * Triggers onNodeUpdate for all nodes, including empty ones
 */

import { NodeSpaceCallbacks } from '../types';

export interface PendingNodeCreation {
  nodeId: string;
  content: string;
  parentId?: string;
  nodeType: string;
  beforeSiblingId?: string;
  metadata?: any;
  timestamp: number;
}

export class ContentPersistenceManager {
  private pendingCreations = new Map<string, PendingNodeCreation>();
  private persistedNodes = new Set<string>(); // Track which nodes have been persisted
  private debounceTimeouts = new Map<string, NodeJS.Timeout>();
  private callbacks: NodeSpaceCallbacks;
  private debounceMs: number;

  constructor(callbacks: NodeSpaceCallbacks, debounceMs: number = 500) {
    this.callbacks = callbacks;
    this.debounceMs = debounceMs;
  }

  /**
   * Update callbacks without losing debounce state
   * This prevents recreation of the manager when parent callbacks change
   */
  updateCallbacks(newCallbacks: NodeSpaceCallbacks): void {
    this.callbacks = newCallbacks;
    // Preserve all pending operations and timeouts
  }

  /**
   * Check if content qualifies for persistence (always true now - we persist all nodes)
   */
  private hasActualContent(content: string): boolean {
    return true; // Always persist nodes, regardless of content
  }

  /**
   * Schedule or update content persistence for a node
   */
  scheduleContentPersistence(
    nodeId: string,
    content: string,
    parentId?: string,
    nodeType: string = 'text',
    beforeSiblingId?: string,
    metadata?: any
  ): void {
    // If node already persisted, don't persist again
    if (this.persistedNodes.has(nodeId)) {
      return;
    }

    // If no actual content, don't persist
    if (!this.hasActualContent(content)) {
      return;
    }

    // Clear existing timeout for this node
    const existingTimeout = this.debounceTimeouts.get(nodeId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Store pending creation
    this.pendingCreations.set(nodeId, {
      nodeId,
      content,
      parentId,
      nodeType,
      beforeSiblingId,
      metadata,
      timestamp: Date.now()
    });

    // Schedule debounced persistence
    const timeout = setTimeout(() => {
      this.persistNode(nodeId);
    }, this.debounceMs);

    this.debounceTimeouts.set(nodeId, timeout);
  }

  /**
   * Immediately persist a node (called on blur/focus change)
   */
  immediatelyPersistNode(
    nodeId: string,
    content: string,
    parentId?: string,
    nodeType: string = 'text',
    beforeSiblingId?: string,
    metadata?: any
  ): void {
    // If node already persisted, don't persist again
    if (this.persistedNodes.has(nodeId)) {
      return;
    }

    // If no actual content, don't persist
    if (!this.hasActualContent(content)) {
      return;
    }

    // Clear any pending debounced operation
    const existingTimeout = this.debounceTimeouts.get(nodeId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.debounceTimeouts.delete(nodeId);
    }

    // Store and immediately persist
    this.pendingCreations.set(nodeId, {
      nodeId,
      content,
      parentId,
      nodeType,
      beforeSiblingId,
      metadata,
      timestamp: Date.now()
    });

    this.persistNode(nodeId);
  }

  /**
   * Execute the actual persistence call
   */
  private async persistNode(nodeId: string): Promise<void> {
    const pending = this.pendingCreations.get(nodeId);
    if (!pending) {
      return;
    }

    // Mark as persisted
    this.persistedNodes.add(nodeId);
    
    // Clean up
    this.pendingCreations.delete(nodeId);
    this.debounceTimeouts.delete(nodeId);

    // Call the backend
    if (this.callbacks.onNodeUpdate) {
      try {
        this.callbacks.onNodeUpdate(pending.nodeId, {
          content: pending.content,
          parentId: pending.parentId,
          beforeSiblingId: pending.beforeSiblingId,
          nodeType: pending.nodeType,
          metadata: pending.metadata
        });
      } catch (error) {
        console.warn('Node update persistence failed:', error);
        // Remove from persisted set so it can be retried
        this.persistedNodes.delete(nodeId);
      }
    }
  }

  /**
   * Check if a node has been persisted to backend
   */
  isNodePersisted(nodeId: string): boolean {
    return this.persistedNodes.has(nodeId);
  }

  /**
   * Clear all pending operations (cleanup)
   */
  clear(): void {
    // Clear all timeouts
    this.debounceTimeouts.forEach(timeout => clearTimeout(timeout));
    this.debounceTimeouts.clear();
    this.pendingCreations.clear();
  }

  /**
   * Get pending operations count for debugging
   */
  getPendingCount(): number {
    return this.pendingCreations.size;
  }
}