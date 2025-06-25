/**
 * Batch operations support for collapsed state management
 */

export interface CollapseOperation {
  nodeId: string;
  collapsed: boolean;
  timestamp: number;
}

export class CollapseBatchManager {
  private operations: CollapseOperation[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  constructor(
    private onBatchExecute: (ops: CollapseOperation[]) => Promise<void>,
    private batchSize: number = 10,
    private debounceMs: number = 500
  ) {}

  addOperation(nodeId: string, collapsed: boolean): void {
    // Remove any existing operation for this node
    this.operations = this.operations.filter(op => op.nodeId !== nodeId);
    
    // Add new operation
    this.operations.push({
      nodeId,
      collapsed,
      timestamp: Date.now()
    });

    // Clear existing timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    // If we've reached batch size, flush immediately
    if (this.operations.length >= this.batchSize) {
      this.flush();
    } else {
      // Otherwise, schedule debounced flush
      this.batchTimeout = setTimeout(() => {
        this.flush();
      }, this.debounceMs);
    }
  }

  async flush(): Promise<void> {
    if (this.operations.length === 0) return;

    const operationsToExecute = [...this.operations];
    this.operations = [];

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    try {
      await this.onBatchExecute(operationsToExecute);
    } catch (error) {
      // Re-queue failed operations for retry
      this.operations.unshift(...operationsToExecute);
      throw error;
    }
  }

  clear(): void {
    this.operations = [];
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  destroy(): void {
    this.clear();
  }

  // Get pending operations count for debugging/monitoring
  getPendingCount(): number {
    return this.operations.length;
  }
}