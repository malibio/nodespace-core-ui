import React from 'react';
import { BaseNode } from '../nodes';
import { NodeComponent } from './NodeComponent';
import { NodeSpaceCallbacks } from './NodeEditor';

interface RenderNodeTreeProps {
  nodes: BaseNode[];
  focusedNodeId: string | null;
  textareaRefs: React.MutableRefObject<{ [key: string]: HTMLTextAreaElement | null }>;
  onRemoveNode: (node: BaseNode) => void;
  totalNodeCount: number;
  callbacks: NodeSpaceCallbacks;
  onFocus: (nodeId: string) => void;
  onBlur: () => void;
  collapsedNodes: Set<string>;
  collapsibleNodeTypes: Set<string>;
  onCollapseChange?: (nodeId: string, collapsed: boolean) => void;
  onFocusedNodeIdChange: (nodeId: string | null) => void;
}

export function RenderNodeTree(props: RenderNodeTreeProps) {
  const { nodes, totalNodeCount, focusedNodeId, textareaRefs, onRemoveNode, callbacks, onFocus, onBlur, collapsedNodes, collapsibleNodeTypes, onCollapseChange, onFocusedNodeIdChange } = props;
  const isRemoveDisabled = totalNodeCount <= 1;
  
  // Shared navigation state using React Context or a simple ref
  const navigationStateRef = React.useRef<{ preferredColumn: number | null; resetCounter: number }>({
    preferredColumn: null,
    resetCounter: 0
  });

  return (
    <div className="ns-nodes-container">
      {nodes.map((node) => (
        <NodeComponent
          key={node.getNodeId()}
          node={node}
          depth={0}
          focusedNodeId={focusedNodeId}
          textareaRefs={textareaRefs}
          onRemoveNode={onRemoveNode}
          isRemoveDisabled={isRemoveDisabled}
          nodes={nodes}
          callbacks={callbacks}
          onFocus={onFocus}
          onBlur={onBlur}
          navigationStateRef={navigationStateRef}
          collapsedNodes={collapsedNodes}
          collapsibleNodeTypes={collapsibleNodeTypes}
          onCollapseChange={onCollapseChange}
          onFocusedNodeIdChange={onFocusedNodeIdChange}
        />
      ))}
    </div>
  );
}