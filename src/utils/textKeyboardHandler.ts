import { BaseNode } from '../nodes';
import { EditContext, KeyboardResult, NodeKeyboardHandler } from './keyboardHandlers';
import { indentNode, outdentNode, NodeFactory } from './nodeUtils';

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
    const { cursorPosition, allNodes } = context;
    
    if (cursorPosition !== 0) {
      return { handled: false };
    }
    
    // Find previous sibling or parent
    let previousNode: BaseNode | null = null;
    let mergePosition = 0;
    
    if (node.parent) {
      const siblings = node.parent.children;
      const nodeIndex = siblings.findIndex(child => child.getNodeId() === node.getNodeId());
      
      if (nodeIndex > 0) {
        previousNode = siblings[nodeIndex - 1];
        mergePosition = previousNode.getContent().length;
      } else {
        previousNode = node.parent;
        mergePosition = previousNode.getContent().length;
      }
    } else {
      const rootIndex = allNodes.findIndex(n => n.getNodeId() === node.getNodeId());
      if (rootIndex > 0) {
        previousNode = allNodes[rootIndex - 1];
        mergePosition = previousNode.getContent().length;
      }
    }
    
    if (!previousNode) {
      return { handled: false };
    }
    
    // Merge content
    previousNode.setContent(previousNode.getContent() + node.getContent());
    
    // Transfer children
    if (node.children.length > 0) {
      previousNode.children.push(...node.children);
      node.children.forEach(child => {
        child.parent = previousNode;
      });
    }
    
    // Remove the current node
    if (node.parent) {
      const siblings = node.parent.children;
      const nodeIndex = siblings.findIndex(child => child.getNodeId() === node.getNodeId());
      siblings.splice(nodeIndex, 1);
    } else {
      const rootIndex = allNodes.findIndex(n => n.getNodeId() === node.getNodeId());
      allNodes.splice(rootIndex, 1);
    }
    
    return {
      handled: true,
      newNodes: this.getRootNodes(context),
      focusNodeId: previousNode.getNodeId(),
      cursorPosition: mergePosition,
      preventDefault: true
    };
  }
  
  handleDelete(node: BaseNode, context: EditContext): KeyboardResult {
    const { cursorPosition, content, allNodes } = context;
    
    if (cursorPosition !== content.length) {
      return { handled: false };
    }
    
    // Find next sibling or next node
    let nextNode: BaseNode | null = null;
    const currentContentLength = content.length;
    
    if (node.parent) {
      const siblings = node.parent.children;
      const nodeIndex = siblings.findIndex(child => child.getNodeId() === node.getNodeId());
      
      if (nodeIndex < siblings.length - 1) {
        nextNode = siblings[nodeIndex + 1];
      }
    } else {
      const rootIndex = allNodes.findIndex(n => n.getNodeId() === node.getNodeId());
      if (rootIndex < allNodes.length - 1) {
        nextNode = allNodes[rootIndex + 1];
      }
    }
    
    if (!nextNode) {
      return { handled: false };
    }
    
    // Merge content
    node.setContent(content + nextNode.getContent());
    
    // Transfer children
    if (nextNode.children.length > 0) {
      node.children.push(...nextNode.children);
      nextNode.children.forEach(child => {
        child.parent = node;
      });
    }
    
    // Remove the next node
    if (nextNode.parent) {
      const siblings = nextNode.parent.children;
      const nodeIndex = siblings.findIndex(child => child.getNodeId() === nextNode!.getNodeId());
      siblings.splice(nodeIndex, 1);
    } else {
      const rootIndex = allNodes.findIndex(n => n.getNodeId() === nextNode!.getNodeId());
      allNodes.splice(rootIndex, 1);
    }
    
    return {
      handled: true,
      newNodes: this.getRootNodes(context),
      focusNodeId: node.getNodeId(),
      cursorPosition: currentContentLength,
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
}