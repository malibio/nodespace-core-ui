import { BaseNode } from '../nodes';
import { EditContext, KeyboardResult, NodeKeyboardHandler } from './keyboardHandlers';
import { indentNode, outdentNode, NodeFactory, getVisibleNodes } from './nodeUtils';

/**
 * Keyboard handler for TextNode
 * Handles standard text editing behaviors
 */
export class TextNodeKeyboardHandler implements NodeKeyboardHandler {
  
  canHandleNodeType(nodeType: string): boolean {
    return nodeType === 'text';
  }
  
  handleEnter(node: BaseNode, context: EditContext): KeyboardResult {
    const { cursorPosition, content } = context;
    
    // Special case: cursor at beginning - create empty node above
    if (cursorPosition === 0) {
      const newNode = NodeFactory.createSimilarNode(node, '');
      let updatedNodes: BaseNode[] = [];
      
      if (node.parent) {
        const parentChildren = node.parent.children;
        const nodeIndex = parentChildren.findIndex(child => child.getNodeId() === node.getNodeId());
        parentChildren.splice(nodeIndex, 0, newNode); // Insert before current node
        newNode.parent = node.parent;
        
        updatedNodes = this.getRootNodes(context);
      } else {
        const allNodes = context.allNodes;
        const rootIndex = allNodes.findIndex(n => n.getNodeId() === node.getNodeId());
        updatedNodes = [...allNodes];
        updatedNodes.splice(rootIndex, 0, newNode); // Insert before current node
      }
      
      return {
        handled: true,
        newNodes: updatedNodes,
        focusNodeId: node.getNodeId(), // Stay focused on original node
        cursorPosition: 0, // Cursor stays at beginning of original node
        preventDefault: true
      };
    }
    
    // Normal case: split content at cursor position
    const leftContent = content.substring(0, cursorPosition);
    const rightContent = content.substring(cursorPosition);
    
    node.setContent(leftContent);
    const newNode = NodeFactory.createSimilarNode(node, rightContent);
    
    // Handle children transfer based on collapsed state
    if (node.children.length > 0) {
      const isCollapsed = context.collapsedNodes?.has(node.getNodeId()) ?? false;
      
      if (isCollapsed) {
        // When collapsed, children stay with the original node
        // No children transfer needed
      } else {
        // When expanded, children go to the right (new) node
        newNode.children = [...node.children];
        newNode.children.forEach(child => {
          child.parent = newNode;
        });
        node.children = [];
      }
    }
    
    let updatedNodes: BaseNode[] = [];
    
    if (node.parent) {
      const parentChildren = node.parent.children;
      const nodeIndex = parentChildren.findIndex(child => child.getNodeId() === node.getNodeId());
      parentChildren.splice(nodeIndex + 1, 0, newNode);
      newNode.parent = node.parent;
      
      updatedNodes = this.getRootNodes(context);
    } else {
      const allNodes = context.allNodes;
      const rootIndex = allNodes.findIndex(n => n.getNodeId() === node.getNodeId());
      updatedNodes = [...allNodes];
      updatedNodes.splice(rootIndex + 1, 0, newNode);
    }
    
    return {
      handled: true,
      newNodes: updatedNodes,
      focusNodeId: newNode.getNodeId(),
      cursorPosition: 0,
      preventDefault: true
    };
  }
  
  handleBackspace(node: BaseNode, context: EditContext): KeyboardResult {
    const { cursorPosition, allNodes, collapsedNodes } = context;
    
    if (cursorPosition !== 0) {
      return { handled: false };
    }
    
    const visibleNodes = getVisibleNodes(allNodes);
    const currentIndex = visibleNodes.findIndex(n => n.getNodeId() === node.getNodeId());
    
    if (currentIndex <= 0) {
      return { handled: false };
    }
    
    const prevNode = visibleNodes[currentIndex - 1];
    const prevContent = prevNode.getContent();
    const currentContent = node.getContent();
    
    if (currentContent.trim() === '') {
      // Remove empty node
      this.removeNodeFromTree(node, allNodes);
      
      return {
        handled: true,
        newNodes: [...allNodes],
        focusNodeId: prevNode.getNodeId(),
        cursorPosition: prevContent.length,
        preventDefault: true
      };
    } else {
      // Join with previous node
      const junctionPosition = prevContent.length;
      const joinedContent = prevContent + currentContent;
      
      prevNode.setContent(joinedContent);
      
      // Handle children transfer before removing the node using sophisticated logic
      if (node.children.length > 0) {
        this.transferChildrenWithDepthPreservation(node, prevNode, allNodes, collapsedNodes);
      }
      
      this.removeNodeFromTree(node, allNodes);
      
      return {
        handled: true,
        newNodes: [...allNodes],
        focusNodeId: prevNode.getNodeId(),
        cursorPosition: junctionPosition,
        preventDefault: true
      };
    }
  }
  
  handleDelete(node: BaseNode, context: EditContext): KeyboardResult {
    const { cursorPosition, content, allNodes, collapsedNodes } = context;
    
    if (cursorPosition !== content.length) {
      return { handled: false };
    }
    
    const visibleNodes = getVisibleNodes(allNodes);
    const currentIndex = visibleNodes.findIndex(n => n.getNodeId() === node.getNodeId());
    
    if (currentIndex >= visibleNodes.length - 1) {
      return { handled: false };
    }
    
    const nextNode = visibleNodes[currentIndex + 1];
    
    // Don't merge with TaskNodes to preserve their metadata
    if (nextNode.getNodeType() === 'task') {
      return { handled: false };
    }
    
    const currentContent = node.getContent();
    const nextContent = nextNode.getContent();
    
    const joinedContent = currentContent + nextContent;
    node.setContent(joinedContent);
    
    // Transfer children from next node with depth preservation
    if (nextNode.children.length > 0) {
      this.transferChildrenWithDepthPreservation(nextNode, node, allNodes, collapsedNodes);
    }
    
    this.removeNodeFromTree(nextNode, allNodes);
    
    return {
      handled: true,
      newNodes: [...allNodes],
      focusNodeId: node.getNodeId(),
      cursorPosition: currentContent.length,
      preventDefault: true
    };
  }
  
  handleTab(node: BaseNode, context: EditContext): KeyboardResult {
    const { allNodes } = context;
    
    const success = indentNode(allNodes, node.getNodeId());
    
    if (success) {
      return {
        handled: true,
        newNodes: [...allNodes],
        focusNodeId: node.getNodeId(),
        preventDefault: true
      };
    }
    
    return { handled: false };
  }
  
  handleShiftTab(node: BaseNode, context: EditContext): KeyboardResult {
    const { allNodes } = context;
    
    const success = outdentNode(allNodes, node.getNodeId());
    
    if (success) {
      return {
        handled: true,
        newNodes: [...allNodes],
        focusNodeId: node.getNodeId(),
        preventDefault: true
      };
    }
    
    return { handled: false };
  }
  
  /**
   * Helper method to get the root nodes array from the context
   */
  private getRootNodes(context: EditContext): BaseNode[] {
    return context.allNodes.filter(node => !node.parent);
  }

  /**
   * Helper method to remove a node from the tree structure
   */
  private removeNodeFromTree(nodeToRemove: BaseNode, allNodes: BaseNode[]): void {
    if (nodeToRemove.parent) {
      // Remove from parent's children
      const parentChildren = nodeToRemove.parent.children;
      const nodeIndex = parentChildren.findIndex(child => child.getNodeId() === nodeToRemove.getNodeId());
      if (nodeIndex !== -1) {
        parentChildren.splice(nodeIndex, 1);
      }
    } else {
      // Remove from root nodes
      const rootIndex = allNodes.findIndex(n => n.getNodeId() === nodeToRemove.getNodeId());
      if (rootIndex !== -1) {
        allNodes.splice(rootIndex, 1);
      }
    }
  }

  /**
   * Get the depth of a node in the hierarchy
   */
  private getNodeDepth(node: BaseNode): number {
    let depth = 0;
    let current = node.parent;
    while (current) {
      depth++;
      current = current.parent;
    }
    return depth;
  }

  /**
   * Find the appropriate parent node at the specified depth
   */
  private findParentAtDepth(startNode: BaseNode, targetDepth: number): BaseNode | null {
    let current: BaseNode | null = startNode;
    
    // Walk up the tree to find a node at the target depth
    while (current && this.getNodeDepth(current) > targetDepth) {
      current = current.parent;
    }
    
    // If we found a node at exactly the target depth, return it
    if (current && this.getNodeDepth(current) === targetDepth) {
      return current;
    }
    
    return null;
  }

  /**
   * Find the root ancestor (depth 0) of a given node
   */
  private findRootAncestor(node: BaseNode): BaseNode | null {
    let current: BaseNode | null = node;
    
    // Walk up to find the root
    while (current && current.parent) {
      current = current.parent;
    }
    
    return current;
  }

  /**
   * Transfer children from source node, preserving their relative hierarchy.
   * Uses context-aware placement: direct target vs root ancestor based on source depth.
   */
  private transferChildrenWithDepthPreservation(
    sourceNode: BaseNode, 
    targetNode: BaseNode, 
    allNodes: BaseNode[],
    collapsedNodes?: Set<string>
  ): void {
    if (sourceNode.children.length === 0) return;
    
    // Track which nodes get new children for auto-expansion
    const nodesGettingNewChildren = new Set<BaseNode>();
    
    const sourceDepth = this.getNodeDepth(sourceNode);
    
    // Determine the appropriate parent for the transferred children
    let newParent: BaseNode;
    let insertAtBeginning = false;
    
    if (sourceDepth === 0) {
      // Source is a root node - children should find appropriate level in target hierarchy
      // Use root ancestor approach for root sources
      const targetRootAncestor = this.findRootAncestor(targetNode);
      if (!targetRootAncestor) return;
      newParent = targetRootAncestor;
      insertAtBeginning = collapsedNodes?.has(targetRootAncestor.getNodeId()) ?? false;
    } else {
      // Source is not a root - children should go directly to target
      // Use direct target approach for non-root sources
      newParent = targetNode;
      insertAtBeginning = collapsedNodes?.has(targetNode.getNodeId()) ?? false;
    }
    
    // Move all direct children of the source to the determined parent
    if (insertAtBeginning) {
      // Target was collapsed - insert new children at the BEGINNING
      const existingChildren = [...newParent.children];
      newParent.children = [...sourceNode.children, ...existingChildren];
    } else {
      // Target was expanded - insert new children at the END  
      newParent.children.push(...sourceNode.children);
    }
    
    // Update parent references for all transferred children
    sourceNode.children.forEach(child => {
      child.parent = newParent;
    });
    
    // Mark parent as getting new children
    nodesGettingNewChildren.add(newParent);
    
    // Clear the source node's children since they've been moved
    sourceNode.children = [];
    
    // Auto-expand nodes that received new children
    nodesGettingNewChildren.forEach(node => {
      if (collapsedNodes?.has(node.getNodeId())) {
        collapsedNodes.delete(node.getNodeId());
      }
    });
  }
}