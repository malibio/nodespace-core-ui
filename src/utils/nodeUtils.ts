import { BaseNode } from '../nodes';

/**
 * Utility functions for working with node hierarchies
 */

/**
 * Count total nodes in a tree structure (root nodes + all descendants)
 */
export function countAllNodes(nodes: BaseNode[]): number {
  let count = 0;
  
  function countRecursive(nodeList: BaseNode[]) {
    for (const node of nodeList) {
      count++;
      if (node.children.length > 0) {
        countRecursive(node.children);
      }
    }
  }
  
  countRecursive(nodes);
  return count;
}
/**
 * Find a node by ID in a tree structure
 */
export function findNodeById(nodes: BaseNode[], nodeId: string): BaseNode | null {
  function searchRecursive(nodeList: BaseNode[]): BaseNode | null {
    for (const node of nodeList) {
      if (node.getNodeId() === nodeId) {
        return node;
      }
      if (node.children.length > 0) {
        const found = searchRecursive(node.children);
        if (found) return found;
      }
    }
    return null;
  }
  
  return searchRecursive(nodes);
}

/**
 * Get all nodes in a flat array (useful for operations that need to work on all nodes)
 */
export function flattenNodes(nodes: BaseNode[]): BaseNode[] {
  const flattened: BaseNode[] = [];
  
  function flattenRecursive(nodeList: BaseNode[]) {
    for (const node of nodeList) {
      flattened.push(node);
      if (node.children.length > 0) {
        flattenRecursive(node.children);
      }
    }
  }
  
  flattenRecursive(nodes);
  return flattened;
}

/**
 * Get visible nodes in a flat array (respects collapsed state - skips children of collapsed nodes)
 */
export function getVisibleNodes(nodes: BaseNode[]): BaseNode[] {
  const visible: BaseNode[] = [];
  
  function visitRecursive(nodeList: BaseNode[]) {
    for (const node of nodeList) {
      visible.push(node);
      // Only recurse into children (collapsed state handled at editor level now)
      if (node.children.length > 0) {
        visitRecursive(node.children);
      }
    }
  }
  
  visitRecursive(nodes);
  return visible;
}

/**
 * Indent a node: makes the node a child of the previous sibling.
 * @returns boolean indicating if the operation was successful.
 */
export function indentNode(rootNodes: BaseNode[], nodeId: string): boolean {
  const nodeToIndent = findNodeById(rootNodes, nodeId);
  if (!nodeToIndent) {
    return false; // Node to indent not found
  }

  const siblings = nodeToIndent.parent ? nodeToIndent.parent.children : rootNodes;
  const nodeIndex = siblings.findIndex(child => child.getNodeId() === nodeId);

  if (nodeIndex <= 0) {
    // Cannot indent if it's the first child or a root node (and first overall)
    return false;
  }

  const previousSibling = siblings[nodeIndex - 1];

  // Remove node from current parent's children (or root nodes list)
  siblings.splice(nodeIndex, 1);
  if (nodeToIndent.parent) {
    nodeToIndent.parent = null; 
  }

  // Add node as a child of the previous sibling
  previousSibling.addChild(nodeToIndent);

  // Note: Collapsed state management now handled at editor level

  return true;
}

/**
 * Outdent a node: makes the node a sibling of its parent (after the parent).
 * If the outdented node had an immediate next sibling, that sibling (and its children)
 * becomes a child of the outdented node.
 * @returns boolean indicating if the operation was successful.
 */
export function outdentNode(rootNodes: BaseNode[], nodeId: string): boolean {
  const nodeToOutdent = findNodeById(rootNodes, nodeId);

  // 1. Pre-conditions: Cannot outdent root nodes or nodes without a parent.
  if (!nodeToOutdent || !nodeToOutdent.parent) {
    return false;
  }

  const originalParent = nodeToOutdent.parent;
  const grandparentNode = originalParent.parent; // This can be null if originalParent is a root node.

  const originalIndexOfNodeToOutdentInParent = originalParent.children.indexOf(nodeToOutdent);
  let nextOriginalSibling: BaseNode | null = null;

  if (originalIndexOfNodeToOutdentInParent !== -1 && originalIndexOfNodeToOutdentInParent + 1 < originalParent.children.length) {
    nextOriginalSibling = originalParent.children[originalIndexOfNodeToOutdentInParent + 1];
  }
  
  // 2. Perform the outdent operation: Move nodeToOutdent.
  // Remove nodeToOutdent from its originalParent. This also sets nodeToOutdent.parent = null via removeChild.
  originalParent.removeChild(nodeToOutdent);

  if (grandparentNode) {
    // nodeToOutdent becomes a child of grandparentNode, inserted after originalParent.
    const parentIndexInGrandparent = grandparentNode.children.indexOf(originalParent);
    grandparentNode.children.splice(parentIndexInGrandparent + 1, 0, nodeToOutdent);
    nodeToOutdent.parent = grandparentNode;
  } else {
    // nodeToOutdent becomes a root node, inserted after originalParent in the rootNodes list.
    const parentIndexInRoot = rootNodes.indexOf(originalParent);
    rootNodes.splice(parentIndexInRoot + 1, 0, nodeToOutdent);
    // nodeToOutdent.parent is already null from originalParent.removeChild(nodeToOutdent).
  }

  // 3. Handle the nextOriginalSibling: Make it a child of the (now outdented) nodeToOutdent.
  if (nextOriginalSibling) {
    // First, remove nextOriginalSibling from its original parent (which is originalParent).
    // This is crucial because nextOriginalSibling's parent pointer needs to be cleared,
    // and it needs to be removed from originalParent's children list.
    originalParent.removeChild(nextOriginalSibling);

    // Then, add it as a child to nodeToOutdent.
    // The addChild method in BaseNode will handle setting its parent to nodeToOutdent
    // and adding it to the end of nodeToOutdent.children list.
    nodeToOutdent.addChild(nextOriginalSibling);
  }

  return true;
}

/**
 * NodeFactory - Creates new nodes dynamically based on existing node types
 */
export class NodeFactory {
  /**
   * Creates a new node of the same type as the source node with the given content
   * @param sourceNode - The node to copy the type from
   * @param content - The content for the new node
   * @returns A new node instance of the same type as sourceNode
   */
  static createSimilarNode(sourceNode: BaseNode, content: string = ''): BaseNode {
    const nodeType = sourceNode.getNodeType();
    
    switch (nodeType) {
      case 'text':
        // Import here to avoid circular dependencies
        const { TextNode } = require('../nodes');
        return new TextNode(content);
      
      case 'task':
        // TaskNode is now implemented for testing
        const { TaskNode } = require('../nodes');
        return new TaskNode(content);
      
      case 'ai-chat':
        // AIChatNode for AI interactions
        const { AIChatNode } = require('../nodes');
        return new AIChatNode(content);
      
      // Future node types will be added here as they're implemented
      case 'date':
      case 'node-link':
      default:
        // For now, unknown types fallback to text node
        // This ensures backward compatibility and prevents runtime errors
        const { TextNode: FallbackTextNode } = require('../nodes');
        return new FallbackTextNode(content);
    }
  }
  
  /**
   * Creates a new node of a specific type with the given content
   * @param nodeType - The type of node to create
   * @param content - The content for the new node
   * @returns A new node instance of the specified type
   */
  static createNodeByType(nodeType: string, content: string = ''): BaseNode {
    switch (nodeType) {
      case 'text':
        const { TextNode } = require('../nodes');
        return new TextNode(content);
      
      case 'task':
        const { TaskNode } = require('../nodes');
        return new TaskNode(content);
      
      case 'ai-chat':
        const { AIChatNode } = require('../nodes');
        return new AIChatNode(content);
      
      // Future node types will be added here as they're implemented
      case 'date':
      case 'node-link':
        throw new Error(`Node type '${nodeType}' not yet implemented`);
      
      default:
        throw new Error(`Unknown node type: ${nodeType}`);
    }
  }
}