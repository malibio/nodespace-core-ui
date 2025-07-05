import { BaseNode, TextNode, TaskNode, ImageNode, DateNode, EntityNode, AIChatNode, ImageMetadata, DateFormat } from '../nodes';
import { NodeSpaceCallbacks } from '../types';
import { findNodeById } from './nodeUtils';
import { getBeforeSiblingId } from './hierarchyUtils';

/**
 * Unified CRUD Operations Manager
 * 
 * Provides consistent operation patterns for all node manipulation:
 * Create, Read, Update, Delete, Move, Reorder
 * 
 * Architecture: Core-UI → Desktop → Tauri → Core-Logic → Data Store
 */

/**
 * Type-safe node constructor patterns
 */
export class NodeFactory {
  /**
   * Create Pattern - Type-safe node constructors
   */
  static createTextNode(content: string = '', nodeId?: string): TextNode {
    return new TextNode(content, nodeId);
  }

  static createTaskNode(content: string = '', nodeId?: string): TaskNode {
    return new TaskNode(content, nodeId);
  }

  static createAIChatNode(content: string = '', nodeId?: string): AIChatNode {
    return new AIChatNode(content, nodeId);
  }

  static createImageNode(imageData?: Uint8Array, metadata: ImageMetadata = {}, description?: string, nodeId?: string): ImageNode {
    return new ImageNode(imageData, metadata, description, nodeId);
  }

  static createDateNode(date: Date, dateFormat: DateFormat = 'full', nodeId?: string): DateNode {
    return new DateNode(date, dateFormat, nodeId);
  }

  static createEntityNode(entityType: string, content: string = '', properties: Record<string, any> = {}, nodeId?: string): EntityNode {
    return new EntityNode(entityType, content, properties, nodeId);
  }

  /**
   * Create node by type with validation
   */
  static createNodeByType(nodeType: string, content: string = '', nodeId?: string, additionalProps?: any): BaseNode {
    switch (nodeType.toLowerCase()) {
      case 'text':
        return NodeFactory.createTextNode(content, nodeId);
      case 'task':
        return NodeFactory.createTaskNode(content, nodeId);
      case 'ai-chat':
        return NodeFactory.createAIChatNode(content, nodeId);
      case 'image':
        return NodeFactory.createImageNode(
          additionalProps?.imageData,
          additionalProps?.metadata || {},
          content || additionalProps?.description,
          nodeId
        );
      case 'date':
        return NodeFactory.createDateNode(
          additionalProps?.date || new Date(),
          additionalProps?.dateFormat || 'full',
          nodeId
        );
      case 'entity':
        return NodeFactory.createEntityNode(
          additionalProps?.entityType || 'general',
          content,
          additionalProps?.properties || {},
          nodeId
        );
      default:
        // Fallback to TextNode for unknown types
        return NodeFactory.createTextNode(content, nodeId);
    }
  }
}

/**
 * CRUD Operation Result types
 */
export interface CrudOperationResult {
  success: boolean;
  nodeId?: string;
  error?: string;
}

export interface MoveOperationResult extends CrudOperationResult {
  oldParentId?: string;
  newParentId?: string;
  oldPosition?: number;
  newPosition?: number;
}

/**
 * Unified CRUD Operations Manager
 */
export class NodeCRUDManager {
  private nodes: BaseNode[];
  private callbacks: NodeSpaceCallbacks;

  constructor(nodes: BaseNode[], callbacks: NodeSpaceCallbacks) {
    this.nodes = nodes;
    this.callbacks = callbacks;
  }

  /**
   * Create Pattern - Fire-and-forget node creation
   */
  async createNode(
    nodeType: string,
    content: string = '',
    parentId?: string,
    afterSiblingId?: string
  ): Promise<CrudOperationResult> {
    try {
      // Create node with UUID upfront (fire-and-forget pattern)
      const newNode = NodeFactory.createNodeByType(nodeType, content);
      const nodeId = newNode.getNodeId();
      
      // Only call backend if content has non-whitespace characters
      if (content.trim().length > 0 && this.callbacks.onNodeCreateWithId) {
        const result = this.callbacks.onNodeCreateWithId(nodeId, content, parentId, nodeType);
        
        // Handle both sync and async responses (fire-and-forget)
        if (result instanceof Promise) {
          result.catch(error => {
            // Callback failures are handled silently for fire-and-forget pattern
          });
        }
      }

      // Local tree structure update
      if (parentId) {
        const parentNode = findNodeById(this.nodes, parentId);
        if (parentNode) {
          if (afterSiblingId) {
            // Insert after specific sibling
            const siblingIndex = parentNode.children.findIndex(child => child.getNodeId() === afterSiblingId);
            if (siblingIndex >= 0) {
              parentNode.children.splice(siblingIndex + 1, 0, newNode);
            } else {
              parentNode.children.push(newNode);
            }
          } else {
            // Append as last child
            parentNode.children.push(newNode);
          }
          newNode.parent = parentNode;
        }
      } else {
        // Add as root node
        this.nodes.push(newNode);
      }

      // Fire onNodesChange callback for UI updates
      if (this.callbacks.onNodesChange) {
        this.callbacks.onNodesChange([...this.nodes]);
      }

      return {
        success: true,
        nodeId: newNode.getNodeId()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during node creation'
      };
    }
  }

  /**
   * Update Pattern - Enhanced for node objects
   */
  updateNode(updatedNode: BaseNode): CrudOperationResult {
    try {
      const nodeId = updatedNode.getNodeId();
      const existingNode = findNodeById(this.nodes, nodeId);
      
      if (!existingNode) {
        return {
          success: false,
          error: `Node with ID ${nodeId} not found`
        };
      }

      // Update content and preserve structure
      existingNode.setContent(updatedNode.getContent());
      
      // Copy any custom metadata or properties
      const updatedProps = updatedNode.getDefaultProperties();
      Object.keys(updatedProps).forEach(key => {
        if (key !== 'nodeId' && key !== 'type') {
          (existingNode as any)[key] = (updatedNode as any)[key];
        }
      });

      // Fire callbacks
      if (this.callbacks.onNodeUpdate) {
        this.callbacks.onNodeUpdate(nodeId, {
          content: updatedNode.getContent(),
          parentId: updatedNode.parent?.getNodeId(),
          beforeSiblingId: getBeforeSiblingId(updatedNode),
          nodeType: updatedNode.getNodeType(),
          metadata: updatedNode.getNodeType() === 'text' ? null : updatedNode.getDefaultProperties()
        });
      }
      
      if (this.callbacks.onNodeChange) {
        this.callbacks.onNodeChange(nodeId, updatedNode.getContent());
      }

      if (this.callbacks.onNodesChange) {
        this.callbacks.onNodesChange([...this.nodes]);
      }

      return {
        success: true,
        nodeId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during node update'
      };
    }
  }

  /**
   * Delete Pattern - Consistent deletion
   */
  deleteNode(nodeId: string, preserveChildren: boolean = false): CrudOperationResult {
    try {
      const node = findNodeById(this.nodes, nodeId);
      
      if (!node) {
        return {
          success: false,
          error: `Node with ID ${nodeId} not found`
        };
      }

      // Handle children
      if (preserveChildren && node.children.length > 0) {
        const parent = node.parent;
        const nodeIndex = parent ? parent.children.indexOf(node) : this.nodes.indexOf(node);
        
        // Move children to parent
        node.children.forEach((child, index) => {
          child.parent = parent;
          if (parent) {
            parent.children.splice(nodeIndex + index + 1, 0, child);
          } else {
            this.nodes.splice(nodeIndex + index + 1, 0, child);
          }
        });
      }

      // Remove from tree structure
      if (node.parent) {
        node.parent.children = node.parent.children.filter(child => child !== node);
      } else {
        this.nodes = this.nodes.filter(n => n !== node);
      }

      // Fire callbacks
      if (this.callbacks.onNodeDelete) {
        this.callbacks.onNodeDelete(nodeId);
      }

      if (this.callbacks.onNodesChange) {
        this.callbacks.onNodesChange([...this.nodes]);
      }

      return {
        success: true,
        nodeId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during node deletion'
      };
    }
  }

  /**
   * Move Pattern - Change parent
   */
  moveNode(nodeId: string, newParentId?: string, afterSiblingId?: string): MoveOperationResult {
    try {
      const node = findNodeById(this.nodes, nodeId);
      
      if (!node) {
        return {
          success: false,
          error: `Node with ID ${nodeId} not found`
        };
      }

      const oldParent = node.parent;
      const oldParentId = oldParent?.getNodeId();
      
      // Remove from current position
      if (oldParent) {
        oldParent.children = oldParent.children.filter(child => child !== node);
      } else {
        this.nodes = this.nodes.filter(n => n !== node);
      }

      // Add to new position
      if (newParentId) {
        const newParent = findNodeById(this.nodes, newParentId);
        if (!newParent) {
          return {
            success: false,
            error: `Parent node with ID ${newParentId} not found`
          };
        }

        if (afterSiblingId) {
          const siblingIndex = newParent.children.findIndex(child => child.getNodeId() === afterSiblingId);
          if (siblingIndex >= 0) {
            newParent.children.splice(siblingIndex + 1, 0, node);
          } else {
            newParent.children.push(node);
          }
        } else {
          newParent.children.push(node);
        }
        
        node.parent = newParent;
      } else {
        // Move to root level
        this.nodes.push(node);
        node.parent = null;
      }

      // Fire callbacks
      if (this.callbacks.onNodeMove) {
        this.callbacks.onNodeMove(nodeId, newParentId, afterSiblingId);
      }

      if (this.callbacks.onNodesChange) {
        this.callbacks.onNodesChange([...this.nodes]);
      }

      return {
        success: true,
        nodeId,
        oldParentId,
        newParentId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during node move'
      };
    }
  }

  /**
   * Reorder Pattern - Change sibling position
   */
  reorderNode(nodeId: string, afterSiblingId?: string): CrudOperationResult {
    try {
      const node = findNodeById(this.nodes, nodeId);
      
      if (!node) {
        return {
          success: false,
          error: `Node with ID ${nodeId} not found`
        };
      }

      const parent = node.parent;
      const siblings = parent ? parent.children : this.nodes;
      
      // Remove from current position
      const currentIndex = siblings.indexOf(node);
      siblings.splice(currentIndex, 1);

      // Insert at new position
      if (afterSiblingId) {
        const siblingIndex = siblings.findIndex(sibling => sibling.getNodeId() === afterSiblingId);
        if (siblingIndex >= 0) {
          siblings.splice(siblingIndex + 1, 0, node);
        } else {
          siblings.push(node);
        }
      } else {
        // Move to beginning
        siblings.unshift(node);
      }

      // Fire callbacks
      if (this.callbacks.onNodeReorder) {
        this.callbacks.onNodeReorder(nodeId, afterSiblingId);
      }

      if (this.callbacks.onNodesChange) {
        this.callbacks.onNodesChange([...this.nodes]);
      }

      return {
        success: true,
        nodeId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during node reorder'
      };
    }
  }

  /**
   * Convenience method for updating nodes array reference
   */
  setNodes(nodes: BaseNode[]): void {
    this.nodes = nodes;
  }

  /**
   * Get current nodes reference
   */
  getNodes(): BaseNode[] {
    return this.nodes;
  }
}