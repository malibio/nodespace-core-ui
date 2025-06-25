import { v4 as uuidv4 } from 'uuid';

/**
 * Base class for all nodes in the NodeSpace hierarchy.
 * All nodes are hierarchical by default and can have children.
 */
export abstract class BaseNode {
  // Core state properties
  protected __nodeType: string;
  protected __tags: string[] = [];
  protected __customMetadata: Record<string, any> = {};
  protected __nodeId: string;
  protected __content: string = '';
  
  // Tree structure
  public children: BaseNode[] = [];
  public parent: BaseNode | null = null;

  constructor(nodeType: string, content: string = '', nodeId?: string) {
    this.__nodeType = nodeType;
    this.__content = content;
    this.__nodeId = nodeId || uuidv4();
  }

  // Abstract methods that must be implemented by subclasses
  abstract createIndicator(): HTMLElement;
  abstract getIndicatorClass(): string;
  abstract getDefaultProperties(): Record<string, any>;

  // Optional text extraction (primarily for text nodes)
  getPlainTextContent?(): string;

  // Tag system
  addTag(tag: string): void {
    if (!this.__tags.includes(tag)) {
      this.__tags.push(tag);
    }
  }

  removeTag(tag: string): void {
    this.__tags = this.__tags.filter(t => t !== tag);
  }

  getTags(): string[] {
    return [...this.__tags];
  }

  // Custom metadata system
  setCustomMetadata(key: string, value: any): void {
    this.__customMetadata[key] = value;
  }

  getCustomMetadata(key: string): any {
    return this.__customMetadata[key];
  }

  getAllCustomMetadata(): Record<string, any> {
    return { ...this.__customMetadata };
  }

  // Node identification
  getNodeId(): string {
    return this.__nodeId;
  }

  // Internal method to update node ID (used for backend synchronization)
  setNodeId(newId: string): void {
    this.__nodeId = newId;
  }

  getNodeType(): string {
    return this.__nodeType;
  }

  // Content management
  getContent(): string {
    return this.__content;
  }

  setContent(content: string): void {
    this.__content = content;
  }

  // Tree structure methods
  addChild(child: BaseNode): void {
    child.parent = this;
    this.children.push(child);
  }

  removeChild(child: BaseNode): void {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
      child.parent = null;
    }
  }

  // Serialization
  toJSON(): any {
    return {
      id: this.__nodeId,
      type: this.__nodeType,
      content: this.__content,
      tags: this.__tags,
      customMetadata: this.__customMetadata,
      children: this.children.map(child => child.toJSON())
    };
  }
}