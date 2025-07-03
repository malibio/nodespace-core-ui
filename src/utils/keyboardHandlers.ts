import { BaseNode } from '../nodes';
import { NodeSpaceCallbacks } from '../types';
import { VirtualNodeManager } from './virtualNodeManager';
import { ContentPersistenceManager } from './contentPersistence';

/**
 * Context information available to keyboard handlers
 */
export interface EditContext {
  cursorPosition: number;
  content: string;
  allNodes: BaseNode[];
  textareaRefs: React.MutableRefObject<{ [key: string]: HTMLTextAreaElement | null }>;
  callbacks: NodeSpaceCallbacks;
  collapsedNodes?: Set<string>;
  virtualNodeManager?: VirtualNodeManager; // Virtual node conversion support
  contentPersistenceManager?: ContentPersistenceManager; // Content-based persistence
}

/**
 * Result of a keyboard handler operation
 */
export interface KeyboardResult {
  handled: boolean;
  newNodes?: BaseNode[];
  focusNodeId?: string;
  cursorPosition?: number;
  preventDefault?: boolean;
  // UUIDs generated upfront, no ID swapping needed
}

/**
 * Interface for node-type-specific keyboard handlers
 */
export interface NodeKeyboardHandler {
  /**
   * Handle Enter key press
   */
  handleEnter(node: BaseNode, context: EditContext): KeyboardResult;
  
  /**
   * Handle Backspace key press at start of content
   */
  handleBackspace(node: BaseNode, context: EditContext): KeyboardResult;
  
  /**
   * Handle Delete key press at end of content
   */
  handleDelete(node: BaseNode, context: EditContext): KeyboardResult;
  
  /**
   * Handle Tab key press (indent)
   */
  handleTab(node: BaseNode, context: EditContext): KeyboardResult;
  
  /**
   * Handle Shift+Tab key press (outdent)
   */
  handleShiftTab(node: BaseNode, context: EditContext): KeyboardResult;
  
  /**
   * Check if this handler can handle the given node type
   */
  canHandleNodeType(nodeType: string): boolean;
}

/**
 * Registry for keyboard handlers by node type
 */
export class KeyboardHandlerRegistry {
  private static handlers: Map<string, NodeKeyboardHandler> = new Map();
  
  /**
   * Register a keyboard handler for a specific node type
   */
  static register(nodeType: string, handler: NodeKeyboardHandler): void {
    this.handlers.set(nodeType, handler);
  }
  
  /**
   * Get the keyboard handler for a specific node type
   */
  static getHandler(nodeType: string): NodeKeyboardHandler | null {
    return this.handlers.get(nodeType) || null;
  }
  
  /**
   * Get handler for a node instance
   */
  static getHandlerForNode(node: BaseNode): NodeKeyboardHandler | null {
    return this.getHandler(node.getNodeType());
  }
  
  /**
   * Check if a handler is registered for a node type
   */
  static hasHandler(nodeType: string): boolean {
    return this.handlers.has(nodeType);
  }
  
  /**
   * Get all registered node types
   */
  static getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}