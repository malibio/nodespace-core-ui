import { BaseNode } from './BaseNode';

/**
 * Node link decorator for inline references within text.
 */
export class NodeLinkNode extends BaseNode {
  public __targetNodeId: string;
  public __linkText: string;

  constructor(targetNodeId: string, linkText: string, nodeId?: string) {
    super('node-link', linkText, nodeId);
    this.__targetNodeId = targetNodeId;
    this.__linkText = linkText;
  }

  createIndicator(): HTMLElement {
    const indicator = document.createElement('span');
    indicator.className = 'node-indicator-link';
    indicator.innerHTML = '🔗';
    indicator.style.marginRight = '8px';
    indicator.style.fontSize = '14px';
    indicator.style.color = '#3b82f6';
    return indicator;
  }

  getIndicatorClass(): string {
    return 'node-indicator-link';
  }

  getDefaultProperties(): Record<string, any> {
    return {
      type: 'node-link',
      isDecorator: true,
      extractable: false
    };
  }

  getTargetNodeId(): string {
    return this.__targetNodeId;
  }

  getLinkText(): string {
    return this.__linkText;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      targetNodeId: this.__targetNodeId,
      linkText: this.__linkText
    };
  }
}
