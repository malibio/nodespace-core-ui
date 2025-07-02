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
    const { cursorPosition, content, callbacks } = context;
    
    // Special case: cursor at beginning - create virtual node above
    if (cursorPosition === 0) {
      // NEW: Use virtual node manager for NS-117
      const newNode = context.virtualNodeManager 
        ? context.virtualNodeManager.createVirtualNode(
            () => NodeFactory.createSimilarNode(node, ''),
            node.parent?.getNodeId()
          )
        : NodeFactory.createSimilarNode(node, ''); // Fallback to immediate creation
      
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
      
      // No immediate callback - content persistence will handle this when user types content
      // The newNode exists in UI immediately, but no backend call until content exists
      
      return {
        handled: true,
        newNodes: updatedNodes,
        focusNodeId: newNode.getNodeId(), // Focus the new node above
        cursorPosition: 0, // Cursor at beginning of new node
        preventDefault: true
      };
    }
    
    // Normal case: split content at cursor position
    const leftContent = content.substring(0, cursorPosition);
    const rightContent = content.substring(cursorPosition);
    
    node.setContent(leftContent);
    
    // NEW: Use virtual node manager for NS-117
    const newNode = context.virtualNodeManager 
      ? context.virtualNodeManager.createVirtualNode(
          () => NodeFactory.createSimilarNode(node, rightContent),
          node.parent?.getNodeId()
        )
      : NodeFactory.createSimilarNode(node, rightContent); // Fallback to immediate creation
    
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
    
    // Content persistence will handle backend creation when user types content
    // If rightContent has actual content, schedule immediate persistence
    if (context.contentPersistenceManager && rightContent.trim().length > 0) {
      context.contentPersistenceManager.immediatelyPersistNode(
        newNode.getNodeId(),
        rightContent,
        node.parent?.getNodeId(),
        newNode.getNodeType()
      );
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
    const { cursorPosition, allNodes, collapsedNodes, callbacks } = context;
    
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
      const nodeId = node.getNodeId();
      
      // Gather deletion context before removal
      const deletionContext = {
        type: 'empty_removal' as const,
        parentId: node.parent?.getNodeId(),
        childrenIds: node.children.map(c => c.getNodeId()),
        childrenTransferredTo: prevNode.getNodeId(),
        contentLost: currentContent,
        siblingPosition: visibleNodes.indexOf(node),
        mergedIntoNode: undefined
      };
      
      // Remove empty node
      this.removeNodeFromTree(node, allNodes);
      
      // Fire semantic deletion event with context
      if (callbacks.onNodeDelete) {
        callbacks.onNodeDelete(nodeId, deletionContext);
      }
      
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
      
      const nodeId = node.getNodeId();
      
      // Gather deletion context BEFORE removing/transferring anything
      const deletionContext = {
        type: 'content_merge' as const,
        parentId: node.parent?.getNodeId(),
        childrenIds: node.children.map(c => c.getNodeId()), // Capture BEFORE transfer
        childrenTransferredTo: prevNode.getNodeId(),
        contentLost: currentContent,
        siblingPosition: visibleNodes.indexOf(node),
        mergedIntoNode: prevNode.getNodeId()
      };
      
      // Handle children transfer before removing the node using sophisticated logic
      if (node.children.length > 0) {
        this.transferChildrenWithDepthPreservation(node, prevNode, allNodes, collapsedNodes);
      }
      
      this.removeNodeFromTree(node, allNodes);
      
      // Fire semantic deletion event with context
      if (callbacks.onNodeDelete) {
        callbacks.onNodeDelete(nodeId, deletionContext);
      }
      
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
    const { cursorPosition, content, allNodes, collapsedNodes, callbacks } = context;
    
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
    
    const nextNodeId = nextNode.getNodeId();
    
    // Gather deletion context BEFORE transferring/removing anything
    const deletionContext = {
      type: 'content_merge' as const,
      parentId: nextNode.parent?.getNodeId(),
      childrenIds: nextNode.children.map(c => c.getNodeId()), // Capture BEFORE transfer
      childrenTransferredTo: node.getNodeId(),
      contentLost: nextContent,
      siblingPosition: visibleNodes.indexOf(nextNode),
      mergedIntoNode: node.getNodeId()
    };
    
    // Transfer children from next node with depth preservation
    if (nextNode.children.length > 0) {
      this.transferChildrenWithDepthPreservation(nextNode, node, allNodes, collapsedNodes);
    }
    
    this.removeNodeFromTree(nextNode, allNodes);
    
    // Fire semantic deletion event with context
    if (callbacks.onNodeDelete) {
      callbacks.onNodeDelete(nextNodeId, deletionContext);
    }
    
    return {
      handled: true,
      newNodes: [...allNodes],
      focusNodeId: node.getNodeId(),
      cursorPosition: currentContent.length,
      preventDefault: true
    };
  }
  
  handleTab(node: BaseNode, context: EditContext): KeyboardResult {
    const { allNodes, callbacks } = context;
    
    console.log('⌨️  TAB DEBUG: Tab key pressed');
    console.log('⌨️  Current node:', `"${node.getContent()}" (${node.getNodeId().slice(-8)})`);
    console.log('⌨️  Total nodes in context:', allNodes.length);
    console.log('⌨️  All root nodes:', allNodes.map(n => `"${n.getContent()}" (${n.getNodeId().slice(-8)})`));
    
    // Get the previous sibling before indenting to include parent info in callback
    const siblings = node.parent ? node.parent.children : allNodes;
    const nodeIndex = siblings.findIndex(child => child.getNodeId() === node.getNodeId());
    const previousSibling = nodeIndex > 0 ? siblings[nodeIndex - 1] : null;
    const parentId = previousSibling?.getNodeId() || null; // Capture the ID before indentNode

    console.log('🔔 TAB DEBUG: About to indent, parentId will be:', parentId);
    console.log('🆔 ID DEBUG: Current node full ID:', node.getNodeId());
    console.log('🆔 ID DEBUG: Parent node full ID:', parentId);
    console.log('🆔 ID DEBUG: Node content:', `"${node.getContent()}"`);
    console.log('🆔 ID DEBUG: All nodes in context:', allNodes.map(n => ({ 
      id: n.getNodeId(), 
      content: `"${n.getContent()}"` 
    })));

    const success = indentNode(allNodes, node.getNodeId());
    
    if (success) {
      console.log('✅ TAB DEBUG: Indentation successful');
      
      // Fire semantic structure change event with parent information
      if (callbacks.onNodeStructureChange) {
        const detailsObject = {
          parentId: parentId,
          newParentId: parentId, // Will be the new parent after indent
          operation: 'indent',
          nodeContent: node.getContent(),
          nodeType: node.getNodeType(),
          previousSiblingId: parentId,
          hierarchyLevel: node.parent ? this.getNodeDepth(node) : 0,
          timestamp: new Date().toISOString()
        };
        
        console.log('🔔 TAB DEBUG: Firing onNodeStructureChange callback');
        console.log('📤 EVENT HANDLER: onNodeStructureChange');
        console.log('📤 Parameter 1 (operation):', 'indent');
        console.log('📤 Parameter 2 (nodeId):', node.getNodeId());
        console.log('📤 Parameter 3 (details object):', JSON.stringify(detailsObject, null, 2));
        
        callbacks.onNodeStructureChange('indent', node.getNodeId(), detailsObject);
        
        console.log('✅ EVENT SENT: onNodeStructureChange fired successfully');
      } else {
        console.log('⚠️  TAB DEBUG: No onNodeStructureChange callback available');
        console.log('⚠️  Available callbacks:', Object.keys(callbacks));
      }
      
      return {
        handled: true,
        newNodes: [...allNodes],
        focusNodeId: node.getNodeId(),
        preventDefault: true
      };
    }
    
    console.log('❌ TAB DEBUG: Indentation failed');
    return { handled: false };
  }
  
  handleShiftTab(node: BaseNode, context: EditContext): KeyboardResult {
    const { allNodes, callbacks } = context;
    
    console.log('⌨️  SHIFT+TAB DEBUG: Shift+Tab key pressed');
    console.log('⌨️  Current node:', `"${node.getContent()}" (${node.getNodeId().slice(-8)})`);
    console.log('⌨️  Has parent:', !!node.parent);
    if (node.parent) {
      console.log('⌨️  Parent:', `"${node.parent.getContent()}" (${node.parent.getNodeId().slice(-8)})`);
    }
    
    const success = outdentNode(allNodes, node.getNodeId());
    
    if (success) {
      console.log('✅ SHIFT+TAB DEBUG: Outdentation successful');
      
      // Fire semantic structure change event
      if (callbacks.onNodeStructureChange) {
        const detailsObject = {
          formerParentId: node.parent?.getNodeId() || null,
          newParentId: node.parent?.parent?.getNodeId() || null, // Will be grandparent or null (root)
          operation: 'outdent',
          nodeContent: node.getContent(),
          nodeType: node.getNodeType(),
          hierarchyLevel: this.getNodeDepth(node),
          timestamp: new Date().toISOString()
        };
        
        console.log('🔔 SHIFT+TAB DEBUG: Firing onNodeStructureChange callback');
        console.log('📤 EVENT HANDLER: onNodeStructureChange');
        console.log('📤 Parameter 1 (operation):', 'outdent');
        console.log('📤 Parameter 2 (nodeId):', node.getNodeId());
        console.log('📤 Parameter 3 (details object):', JSON.stringify(detailsObject, null, 2));
        
        callbacks.onNodeStructureChange('outdent', node.getNodeId(), detailsObject);
        
        console.log('✅ EVENT SENT: onNodeStructureChange fired successfully');
      } else {
        console.log('⚠️  SHIFT+TAB DEBUG: No onNodeStructureChange callback available');
        console.log('⚠️  Available callbacks:', Object.keys(callbacks));
      }
      
      return {
        handled: true,
        newNodes: [...allNodes],
        focusNodeId: node.getNodeId(),
        preventDefault: true
      };
    }
    
    console.log('❌ SHIFT+TAB DEBUG: Outdentation failed');
    return { handled: false };
  }
  
  /**
   * Helper method to get the root nodes array from the context
   */
  private getRootNodes(context: EditContext): BaseNode[] {
    return context.allNodes.filter(node => !node.parent);
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