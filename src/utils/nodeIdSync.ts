import { BaseNode } from '../nodes';

/**
 * Utility functions for synchronizing node IDs with backend
 */

/**
 * Updates a node's ID and all references to it
 * @param nodes The root nodes array
 * @param temporaryId The temporary ID to replace
 * @param realId The real backend ID
 * @param textareaRefs Textarea refs that need updating
 * @param focusedNodeId Current focused node ID (for updating if it matches)
 * @returns Updated focused node ID if it was changed
 */
export function updateNodeId(
  nodes: BaseNode[],
  temporaryId: string,
  realId: string,
  textareaRefs: React.MutableRefObject<{ [key: string]: HTMLTextAreaElement | null }>,
  focusedNodeId: string | null
): string | null {
  // Find the node with the temporary ID
  const nodeToUpdate = findNodeById(nodes, temporaryId);
  if (!nodeToUpdate) {
    return focusedNodeId;
  }

  // Update the node's ID
  nodeToUpdate.setNodeId(realId);

  // Update textarea refs
  const textarea = textareaRefs.current[temporaryId];
  if (textarea) {
    textareaRefs.current[realId] = textarea;
    delete textareaRefs.current[temporaryId];
  }

  // Update focused node ID if it matches
  const updatedFocusedNodeId = focusedNodeId === temporaryId ? realId : focusedNodeId;

  return updatedFocusedNodeId;
}

/**
 * Find a node by ID in a tree structure
 */
function findNodeById(nodes: BaseNode[], nodeId: string): BaseNode | null {
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