import React from 'react';
import { TextNodeEditor, NodeEditorProps } from './TextNodeEditor';
import { TaskNodeEditor } from './TaskNodeEditor';

/**
 * Factory component that renders the appropriate editor based on node type
 */
export function NodeEditorFactory(props: NodeEditorProps) {
  const { node } = props;
  const nodeType = node.getNodeType();
  
  switch (nodeType) {
    case 'text':
      return <TextNodeEditor {...props} />;
    
    case 'task':
      return <TaskNodeEditor {...props} />;
    
    case 'date':
      // Will return <DateNodeEditor {...props} /> when implemented
      return <TextNodeEditor {...props} />;
    
    case 'node-link':
      // Will return <NodeLinkEditor {...props} /> when implemented
      return <TextNodeEditor {...props} />;
    
    case 'entity':
      // Will return <EntityNodeEditor {...props} /> when implemented
      return <TextNodeEditor {...props} />;
    
    default:
      // Unknown node type, falling back to text editor
      return <TextNodeEditor {...props} />;
  }
}

/**
 * Static method for getting the appropriate editor component class
 * Useful for testing or conditional rendering
 */
export function getEditorComponentForNodeType(nodeType: string): React.ComponentType<NodeEditorProps> {
  switch (nodeType) {
    case 'text':
      return TextNodeEditor;
    
    case 'task':
      return TaskNodeEditor;
    
    default:
      return TextNodeEditor;
  }
}