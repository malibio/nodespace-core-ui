import { BaseNode } from './BaseNode';
import { TextNode } from './TextNode';
import { TaskNode } from './TaskNode';
import { DateNode } from './DateNode';
import { NodeLinkNode } from './NodeLinkNode';
import { EntityNode } from './EntityNode';

// Export new base class and all node types
export { BaseNode } from './BaseNode';
export { TextNode } from './TextNode';
export { TaskNode, type TaskStatus, type TaskPriority } from './TaskNode';
export { DateNode, type DateFormat } from './DateNode';
export { NodeLinkNode } from './NodeLinkNode';
export { EntityNode } from './EntityNode';


// Export all node types as a union
export type NodeType = 
  | BaseNode
  | TextNode 
  | TaskNode
  | DateNode
  | NodeLinkNode
  | EntityNode;

// Utility function to create nodes
export function createNode(type: string, content: string = '', ...args: any[]): BaseNode {
  switch (type) {
    case 'text':
      return new TextNode(content, args[0]);
    case 'task':
      return new TaskNode(content, args[0]);
    case 'date':
      return new DateNode(args[0] || new Date(), args[1] || 'full', args[2]);
    case 'node-link':
      return new NodeLinkNode(args[0], content, args[1]);
    case 'entity':
      return new EntityNode(args[0] || 'custom', content, args[1] || {}, args[2]);
    default:
      throw new Error(`Unknown node type: ${type}`);
  }
}