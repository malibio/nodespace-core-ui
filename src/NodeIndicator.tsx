import { BaseNode } from './nodes';

interface NodeIndicatorProps {
  node: BaseNode;
  className?: string;
  hasChildren?: boolean;
  onStatusChange?: () => void;
}

export function NodeIndicator({ node, className = '', hasChildren = false, onStatusChange }: NodeIndicatorProps) {
  const nodeType = node.getNodeType();
  
  // Handle task nodes with CSS-based indicators
  if (nodeType === 'task') {
    const taskNode = node as any; // Cast to access task-specific properties
    const taskStatus = taskNode.getStatus ? taskNode.getStatus() : 'pending';
    
    const handleClick = () => {
      if (taskNode.cycleThroughStatus) {
        taskNode.cycleThroughStatus();
        onStatusChange?.(); // Trigger re-render
      }
    };
    
    return (
      <span 
        className={`ns-node-indicator ${node.getIndicatorClass()} ${className}`}
        data-node-type={nodeType}
        data-task-status={taskStatus}
        data-has-children={hasChildren}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      />
    );
  }
  
  if (nodeType === 'text') {
    return (
      <span 
        className={`ns-node-indicator ${node.getIndicatorClass()} ${className}`}
        data-node-type={nodeType}
        data-has-children={hasChildren}
      />
    );
  }

  const indicatorElement = node.createIndicator();
  
  return (
    <span 
      className={`ns-node-indicator ${node.getIndicatorClass()} ${className}`}
      data-node-type={nodeType}
      data-has-children={hasChildren}
      dangerouslySetInnerHTML={{ __html: indicatorElement.innerHTML }}
      style={{
        color: indicatorElement.style.color || undefined,
        fontSize: indicatorElement.style.fontSize || undefined,
        border: hasChildren ? '2px solid #808080' : 'none',
      }}
    />
  );
}
