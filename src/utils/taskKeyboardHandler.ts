import { BaseNode } from '../nodes';
import { EditContext, KeyboardResult, NodeKeyboardHandler } from './keyboardHandlers';
import { indentNode, outdentNode, NodeFactory } from './nodeUtils';

/**
 * Keyboard handler for TaskNode
 * Demonstrates different keyboard behavior from text nodes
 */
export class TaskNodeKeyboardHandler implements NodeKeyboardHandler {
  
  canHandleNodeType(nodeType: string): boolean {
    return nodeType === 'task';
  }
  
  handleEnter(node: BaseNode, context: EditContext): KeyboardResult {
    // For tasks, Enter could create a new task (instead of splitting content)
    // For now, use similar logic to text but could be customized
    const { cursorPosition, content /* callbacks */ } = context;
    
    const leftContent = content.substring(0, cursorPosition);
    const rightContent = content.substring(cursorPosition);
    
    node.setContent(leftContent);
    const newNode = NodeFactory.createSimilarNode(node, rightContent);
    
    // Future: Task-specific behavior could be different:
    // - New tasks could start with default status
    // - Could inherit priority/due date from parent
    // - Different children transfer rules
    
    // For now, use similar children transfer logic as text nodes
    if (node.children.length > 0) {
      if (true) { // Collapsed state handled at editor level
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
  
  handleBackspace(_node: BaseNode, context: EditContext): KeyboardResult {
    // TaskNode backspace merges are disabled to preserve task metadata
    const { cursorPosition } = context;
    
    if (cursorPosition !== 0) {
      return { handled: false };
    }
    
    // Disable backspace merge for TaskNodes - just return unhandled
    return { handled: false };
  }
  
  handleDelete(_node: BaseNode, context: EditContext): KeyboardResult {
    // TaskNode delete merges are disabled to preserve task metadata
    const { cursorPosition, content } = context;
    
    if (cursorPosition !== content.length) {
      return { handled: false };
    }
    
    // Disable delete merge for TaskNodes - just return unhandled
    return { handled: false };
  }
  
  handleTab(node: BaseNode, context: EditContext): KeyboardResult {
    // Tasks could have different indentation rules
    // For now, use same logic as text nodes
    const { allNodes, callbacks } = context;
    
    const success = indentNode(allNodes, node.getNodeId());
    
    if (success) {
      // Fire semantic structure change event
      if (callbacks.onNodeStructureChange) {
        callbacks.onNodeStructureChange('indent', node.getNodeId());
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
    // Tasks could have different outdentation rules
    // For now, use same logic as text nodes
    const { allNodes, callbacks } = context;
    
    const success = outdentNode(allNodes, node.getNodeId());
    
    if (success) {
      // Fire semantic structure change event
      if (callbacks.onNodeStructureChange) {
        callbacks.onNodeStructureChange('outdent', node.getNodeId());
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
}