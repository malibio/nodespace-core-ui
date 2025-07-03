import { BaseNode } from '../nodes';

/**
 * Utility functions for hierarchy detection and node positioning
 */

/**
 * Get the parent ID of a node
 */
export function getParentId(node: BaseNode): string | undefined {
  return node.parent?.getNodeId();
}

/**
 * Get the ID of the sibling immediately before this node
 * Returns undefined if this is the first child
 */
export function getBeforeSiblingId(node: BaseNode): string | undefined {
  if (!node.parent) return undefined;
  
  const siblings = node.parent.children;
  const nodeIndex = siblings.indexOf(node);
  
  if (nodeIndex <= 0) return undefined;
  
  return siblings[nodeIndex - 1].getNodeId();
}

/**
 * Get complete hierarchy context for a node
 */
export function getHierarchyContext(node: BaseNode): {
  parentId?: string;
  beforeSiblingId?: string;
  depth: number;
  position: number;
} {
  const parentId = getParentId(node);
  const beforeSiblingId = getBeforeSiblingId(node);
  
  // Calculate depth by traversing up the tree
  let depth = 0;
  let current = node.parent;
  while (current) {
    depth++;
    current = current.parent;
  }
  
  // Calculate position within siblings
  const position = node.parent ? node.parent.children.indexOf(node) : 0;
  
  return {
    parentId,
    beforeSiblingId,
    depth,
    position
  };
}

/**
 * Get node type string from node instance
 */
export function getNodeType(node: BaseNode): string {
  // Use the node's built-in getNodeType method which returns the correct type
  return node.getNodeType();
}