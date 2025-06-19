import { BaseNode } from './BaseNode';

/**
 * Entity node for user-defined node types.
 * Provides a flexible foundation for custom node implementations.
 */
export class EntityNode extends BaseNode {
  public __entityType: string;
  public __properties: Record<string, any> = {};

  constructor(entityType: string, content: string = '', properties: Record<string, any> = {}, nodeId?: string) {
    super('entity', content, nodeId);
    this.__entityType = entityType;
    this.__properties = properties;
  }

  createIndicator(): HTMLElement {
    const indicator = document.createElement('span');
    indicator.className = 'node-indicator-entity';
    indicator.innerHTML = '◆';
    indicator.style.color = '#8b5cf6';
    indicator.style.fontSize = '16px';
    indicator.style.marginRight = '8px';
    return indicator;
  }

  getIndicatorClass(): string {
    return `node-indicator-entity entity-${this.__entityType}`;
  }

  getDefaultProperties(): Record<string, any> {
    return {
      type: 'entity',
      entityType: this.__entityType,
      customizable: true,
      ...this.__properties
    };
  }

  // Entity-specific methods
  getEntityType(): string {
    return this.__entityType;
  }

  setEntityType(entityType: string): void {
    this.__entityType = entityType;
  }

  getProperty(key: string): any {
    return this.__properties[key];
  }

  setProperty(key: string, value: any): void {
    this.__properties[key] = value;
  }

  getAllProperties(): Record<string, any> {
    return { ...this.__properties };
  }

  // Override toJSON to include entity-specific data
  toJSON(): any {
    return {
      ...super.toJSON(),
      entityType: this.__entityType,
      properties: this.__properties
    };
  }
}