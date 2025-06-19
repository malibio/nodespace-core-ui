import { BaseNode } from './BaseNode';

export type DateFormat = 'full' | 'short' | 'relative';

/**
 * Date node for organizing content by time periods.
 */
export class DateNode extends BaseNode {
  public __date: Date;
  public __dateFormat: DateFormat = 'full';

  constructor(date: Date, dateFormat: DateFormat = 'full', nodeId?: string) {
    super('date', '', nodeId);
    this.__date = date;
    this.__dateFormat = dateFormat;
    this.setContent(this.formatDate());
  }

  createIndicator(): HTMLElement {
    const indicator = document.createElement('span');
    indicator.className = 'node-indicator-date';
    indicator.innerHTML = '📅';
    indicator.style.marginRight = '8px';
    indicator.style.fontSize = '16px';
    return indicator;
  }

  getIndicatorClass(): string {
    return 'node-indicator-date';
  }

  getDefaultProperties(): Record<string, any> {
    return {
      type: 'date',
      isContainer: true,
      extractable: false
    };
  }

  private formatDate(): string {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - this.__date.getTime()) / (1000 * 60 * 60 * 24));

    switch (this.__dateFormat) {
      case 'relative':
        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays === -1) return 'Tomorrow';
        if (diffInDays > 0) return `${diffInDays} days ago`;
        return `In ${Math.abs(diffInDays)} days`;
      
      case 'short':
        return this.__date.toLocaleDateString();
      
      case 'full':
      default:
        return this.__date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
    }
  }

  // Date-specific methods
  setDate(date: Date): void {
    this.__date = date;
    this.setContent(this.formatDate());
  }

  getDate(): Date {
    return this.__date;
  }

  setDateFormat(format: DateFormat): void {
    this.__dateFormat = format;
    this.setContent(this.formatDate());
  }

  getDateFormat(): DateFormat {
    return this.__dateFormat;
  }

  // Override toJSON to include date-specific metadata
  toJSON(): any {
    return {
      ...super.toJSON(),
      date: this.__date.toISOString(),
      dateFormat: this.__dateFormat
    };
  }
}
