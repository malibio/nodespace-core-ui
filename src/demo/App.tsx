import React, { useState, useRef } from 'react';
import { TextNode, BaseNode, TaskNode } from '../nodes';
import NodeSpaceEditor from '../NodeSpaceEditor';
import { NodeSpaceCallbacks } from '../hierarchy';
import { countAllNodes } from '../utils';
import './demo.css';

function DemoApp() {
  const [nodes, setNodes] = useState<BaseNode[]>(() => {
    // Create complex test scenarios for backspace behavior testing
    
    // Scenario 1: Root A (collapsed) -> Root B with children
    const rootA = new TextNode('Root A (collapsed)');
    const childA1 = new TextNode('Child A1 (hidden)');
    const childA2 = new TextNode('Child A2 (hidden)');
    rootA.addChild(childA1);
    rootA.addChild(childA2);
    
    const rootB = new TextNode('Root B - DELETE ME');
    const childB1 = new TextNode('Child B1');
    const childB2 = new TextNode('Child B2');
    const grandchildB2a = new TextNode('Grandchild B2a');
    rootB.addChild(childB1);
    rootB.addChild(childB2);
    childB2.addChild(grandchildB2a);
    
    // Scenario 2: Root C (expanded) -> Root D with children  
    const rootC = new TextNode('Root C (expanded)');
    const childC1 = new TextNode('Child C1 (visible)');
    const childC2 = new TextNode('Child C2 (visible)');
    const grandchildC1a = new TextNode('Grandchild C1a');
    rootC.addChild(childC1);
    rootC.addChild(childC2);
    childC1.addChild(grandchildC1a);
    // rootC stays expanded (default)
    
    const rootD = new TextNode('Root D - DELETE ME TOO');
    const childD1 = new TextNode('Child D1');
    const childD2 = new TextNode('Child D2');
    const grandchildD2a = new TextNode('Grandchild D2a');
    const greatGrandchildD2a1 = new TextNode('Great-grandchild D2a1');
    rootD.addChild(childD1);
    rootD.addChild(childD2);
    childD2.addChild(grandchildD2a);
    grandchildD2a.addChild(greatGrandchildD2a1);
    
    // Scenario 3: Deep hierarchy for complex testing
    const rootE = new TextNode('Root E (complex hierarchy)');
    const childE1 = new TextNode('Child E1');
    const grandchildE1a = new TextNode('Grandchild E1a');
    const greatGrandchildE1a1 = new TextNode('Great-grandchild E1a1');
    const greatGrandchildE1a2 = new TextNode('Great-grandchild E1a2');
    rootE.addChild(childE1);
    childE1.addChild(grandchildE1a);
    grandchildE1a.addChild(greatGrandchildE1a1);
    grandchildE1a.addChild(greatGrandchildE1a2);
    
    const rootF = new TextNode('Root F - MERGE WITH DEEP NODE');
    const childF1 = new TextNode('Child F1 (should become sibling of Child E1)');
    const childF2 = new TextNode('Child F2 (should become sibling of Child E1)');
    const grandchildF2a = new TextNode('Grandchild F2a (should become sibling of Grandchild E1a)');
    rootF.addChild(childF1);
    rootF.addChild(childF2);
    childF2.addChild(grandchildF2a);
    
    // TaskNode test scenario
    const taskRoot = new TaskNode('Task Root');
    const taskChild = new TaskNode('Task Child');
    taskRoot.addChild(taskChild);
    
    return [rootA, rootB, rootC, rootD, rootE, rootF, taskRoot];
  });
  
  // Set up initial collapsed state - rootA should be collapsed initially
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(() => {
    if (nodes.length > 0) {
      return new Set([nodes[0].getNodeId()]); // Collapse first node (rootA)
    }
    return new Set();
  });
  
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});
  
  const totalNodeCount = countAllNodes(nodes);

  const logEvent = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setEventLog(prev => [...prev.slice(-9), `${timestamp}: ${message}`]);
  };

  const callbacks: NodeSpaceCallbacks = {
    onNodesChange: (newNodes: BaseNode[]) => {
      setNodes(newNodes);
    },
    onNodeChange: (nodeId: string, content: string) => {
      logEvent(`Content saved (debounced): ${nodeId.slice(0, 8)}... → "${content}"`);
    },
    onNodeCreate: (content: string, parentId?: string, nodeType?: string) => {
      const parent = parentId ? parentId.slice(0, 8) + '...' : 'root';
      logEvent(`Node created: "${content}" (${nodeType}) under ${parent}`);
      
      // Simulate async backend ID generation
      return new Promise<string>((resolve) => {
        setTimeout(() => {
          const realBackendId = `backend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          logEvent(`Backend assigned real ID: ${realBackendId.slice(0, 16)}...`);
          resolve(realBackendId);
        }, 100); // 100ms to simulate network delay
      });
    },
    onNodeDelete: (nodeId: string) => {
      logEvent(`Node deleted: ${nodeId.slice(0, 8)}...`);
    },
    onNodeStructureChange: (operation: 'indent' | 'outdent' | 'move', nodeId: string, details?: any) => {
      logEvent(`Structure: ${operation} ${nodeId.slice(0, 8)}...`);
    }
  };

  const handleFocus = (nodeId: string) => {
    setFocusedNodeId(nodeId);
  };

  const handleBlur = () => {
    setFocusedNodeId(null);
  };

  const handleCollapseChange = (nodeId: string, collapsed: boolean) => {
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (collapsed) {
        newSet.add(nodeId);
      } else {
        newSet.delete(nodeId);
      }
      return newSet;
    });
  };

  const handleRemoveNode = (node: BaseNode) => {
    if (totalNodeCount > 1) {
      if (node.parent) {
        node.parent.removeChild(node);
      } else {
        const newNodes = nodes.filter(n => n.getNodeId() !== node.getNodeId());
        setNodes(newNodes);
        return;
      }
      setNodes([...nodes]);
    }
  };

  const addNode = () => {
    const newNode = new TextNode('New node');
    setNodes([...nodes, newNode]);
    
    setTimeout(() => {
      const newTextarea = textareaRefs.current[newNode.getNodeId()];
      if (newTextarea) {
        newTextarea.focus();
      }
    }, 0);
  };

  return (
    <div className={`demo-container ${isDarkMode ? 'ns-dark-mode' : ''}`}>
      <div className="demo-header">
        <h1>NodeSpace UI - Hierarchical Block Editor</h1>
        <div className="demo-status">
          {totalNodeCount} total nodes • {nodes.length} root nodes • {focusedNodeId ? `Focused: ${focusedNodeId.slice(0, 8)}...` : 'No focus'}
        </div>
      </div>

      <NodeSpaceEditor
        nodes={nodes}
        focusedNodeId={focusedNodeId}
        callbacks={callbacks}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onRemoveNode={handleRemoveNode}
        collapsedNodes={collapsedNodes}
        onCollapseChange={handleCollapseChange}
      />

      <div className="demo-controls">
        <button onClick={addNode} className="demo-button">
          Add Root Node
        </button>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="demo-button">
          {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
        <button onClick={() => setEventLog([])} className="demo-button">
          Clear Event Log
        </button>
      </div>

      <div className="demo-event-log">
        <h3>Event Log:</h3>
        <div className="event-log-content">
          {eventLog.length === 0 ? (
            <div className="event-log-empty">No events yet. Try creating, editing, or deleting nodes!</div>
          ) : (
            eventLog.map((event, index) => (
              <div key={index} className="event-log-item">{event}</div>
            ))
          )}
        </div>
      </div>

      <div className="demo-help">
        <strong>Keyboard Shortcuts:</strong>
        <ul>
          <li><strong>Enter:</strong> Split content and create new sibling node (children transfer based on collapsed/expanded state)</li>
          <li><strong>Shift+Enter:</strong> Add newline within current node</li>
          <li><strong>Backspace at start:</strong> Join with previous visible node - intelligent children transfer with context-aware placement</li>
          <li><strong>Delete at end:</strong> Join with next visible node - intelligent children transfer with context-aware placement</li>
          <li><strong>Tab:</strong> Indent node (make child of previous sibling)</li>
          <li><strong>Shift+Tab:</strong> Outdent node (make sibling of parent)</li>
        </ul>
        <strong>Event Testing & ID Synchronization:</strong>
        <ul>
          <li><strong>Node Creation:</strong> Press Enter to split nodes → Watch ID sync from temporary to backend ID</li>
          <li><strong>Ghost Node Fix:</strong> New nodes get backend IDs asynchronously → Can now edit content after creation</li>
          <li><strong>Node Deletion:</strong> Use Backspace/Delete to merge nodes and watch deletion events</li>
          <li><strong>Structure Changes:</strong> Use Tab/Shift+Tab to indent/outdent and watch structure events</li>
          <li><strong>Content Changes:</strong> Type to see debounced content save events (300ms delay)</li>
        </ul>
        <strong>Hierarchy:</strong>
        <p>Visual indentation shows parent-child relationships. Events track all user interactions semantically.</p>
      </div>
    </div>
  );
}

export default DemoApp;