import { BaseNode } from '../nodes';
import { EditContext, KeyboardResult, NodeKeyboardHandler } from './keyboardHandlers';
import { indentNode, outdentNode, NodeFactory } from './nodeUtils';

/**
 * Keyboard handler for AIChatNode
 * Handles tab indentation and Enter key for creating sibling TextNodes
 */
export class AIChatNodeKeyboardHandler implements NodeKeyboardHandler {
  
  canHandleNodeType(nodeType: string): boolean {
    return nodeType === 'ai-chat';
  }
  
  handleEnter(node: BaseNode, context: EditContext): KeyboardResult {
    const { cursorPosition, content } = context;
    
    // For AIChatNode, Enter always creates a new TextNode sibling below
    // (since AIChatNode content should not be split)
    
    // Create a new TextNode (not AIChatNode) as sibling
    const newNode = context.virtualNodeManager 
      ? context.virtualNodeManager.createVirtualNode(
          () => NodeFactory.createNodeByType('text', ''), // Always create TextNode
          node.parent?.getNodeId()
        )
      : NodeFactory.createNodeByType('text', ''); // Always create TextNode
    
    let updatedNodes: BaseNode[] = [];
    
    if (node.parent) {
      const parentChildren = node.parent.children;
      const nodeIndex = parentChildren.findIndex(child => child.getNodeId() === node.getNodeId());
      parentChildren.splice(nodeIndex + 1, 0, newNode); // Insert after current node
      newNode.parent = node.parent;
      
      updatedNodes = this.getRootNodes(context);
    } else {
      const allNodes = context.allNodes;
      const rootIndex = allNodes.findIndex(n => n.getNodeId() === node.getNodeId());
      updatedNodes = [...allNodes];
      updatedNodes.splice(rootIndex + 1, 0, newNode); // Insert after current node
    }
    
    return {
      handled: true,
      newNodes: updatedNodes,
      focusNodeId: newNode.getNodeId(), // Focus the new TextNode
      cursorPosition: 0, // Cursor at beginning of new node
      preventDefault: true
    };
  }
  
  handleBackspace(node: BaseNode, context: EditContext): KeyboardResult {
    // AIChatNode should not merge with other nodes to preserve chat structure
    return { handled: false };
  }
  
  handleDelete(node: BaseNode, context: EditContext): KeyboardResult {
    // AIChatNode should not merge with other nodes to preserve chat structure
    return { handled: false };
  }
  
  handleTab(node: BaseNode, context: EditContext): KeyboardResult {
    const { allNodes, callbacks } = context;
    
    // Get the previous sibling before indenting to include parent info in callback
    const siblings = node.parent ? node.parent.children : allNodes;
    const nodeIndex = siblings.findIndex(child => child.getNodeId() === node.getNodeId());
    const previousSibling = nodeIndex > 0 ? siblings[nodeIndex - 1] : null;
    const parentId = previousSibling?.getNodeId() || null; // Capture the ID before indentNode

    const success = indentNode(allNodes, node.getNodeId());
    
    if (success) {
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
        
        callbacks.onNodeStructureChange('indent', node.getNodeId(), detailsObject);
      }
      
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
    const { allNodes, callbacks } = context;
    
    const success = outdentNode(allNodes, node.getNodeId());
    
    if (success) {
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
        
        callbacks.onNodeStructureChange('outdent', node.getNodeId(), detailsObject);
      }
      
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
}