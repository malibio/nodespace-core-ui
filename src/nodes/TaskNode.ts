import { BaseNode } from './BaseNode';

export type TaskStatus = 'pending' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

/**
 * Task node for metadata-based task management.
 */
export class TaskNode extends BaseNode {
  public __status: TaskStatus = 'pending';
  public __dueDate?: string;
  public __assignedTo?: string;
  public __priority?: TaskPriority;

  constructor(content: string = '', nodeId?: string) {
    super('task', content, nodeId);
  }

  createIndicator(): HTMLElement {
    const indicator = document.createElement('span');
    indicator.className = 'node-indicator-task';
    indicator.style.marginRight = '8px';
    indicator.style.fontSize = '16px';
    indicator.style.cursor = 'pointer';
    
    this.updateIndicatorAppearance(indicator);
    return indicator;
  }

  private updateIndicatorAppearance(indicator: HTMLElement): void {
    switch (this.__status) {
      case 'completed':
        indicator.innerHTML = '✓';
        indicator.style.color = '#10b981';
        break;
      case 'in-progress':
        indicator.innerHTML = '◐';
        indicator.style.color = '#f59e0b';
        break;
      default:
        indicator.innerHTML = '☐';
        indicator.style.color = '#6b7280';
    }
  }

  getIndicatorClass(): string {
    return `node-indicator-task task-${this.__status}`;
  }

  getDefaultProperties(): Record<string, any> {
    return {
      type: 'task',
      status: 'pending',
      extractable: false
    };
  }

  // Task-specific methods
  setStatus(status: TaskStatus): void {
    this.__status = status;
  }

  getStatus(): TaskStatus {
    return this.__status;
  }

  cycleThroughStatus(): void {
    const statusOrder: TaskStatus[] = ['pending', 'in-progress', 'completed'];
    const currentIndex = statusOrder.indexOf(this.__status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    this.__status = statusOrder[nextIndex];
  }

  setDueDate(dueDate: string): void {
    this.__dueDate = dueDate;
  }

  getDueDate(): string | undefined {
    return this.__dueDate;
  }

  setAssignedTo(assignedTo: string): void {
    this.__assignedTo = assignedTo;
  }

  getAssignedTo(): string | undefined {
    return this.__assignedTo;
  }

  setPriority(priority: TaskPriority): void {
    this.__priority = priority;
  }

  getPriority(): TaskPriority | undefined {
    return this.__priority;
  }

  // Override toJSON to include task-specific metadata
  toJSON(): any {
    return {
      ...super.toJSON(),
      status: this.__status,
      dueDate: this.__dueDate,
      assignedTo: this.__assignedTo,
      priority: this.__priority
    };
  }
}
