import { BaseNode } from './nodes';

export interface NodeSpaceCallbacks {
  onNodesChange?: (newNodes: BaseNode[]) => void;
  onNodeChange?: (nodeId: string, content: string) => void;
  onNodeCreate?: (content: string, parentId?: string) => Promise<string>;
  onNodeDelete?: (nodeId: string) => void;
  onNodeStructureChange?: (operation: string, nodeId: string, details?: any) => void;
  onCollapseStateChange?: (nodeId: string, collapsed: boolean) => void;
}
