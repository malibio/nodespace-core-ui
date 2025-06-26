import React, { useState, useRef } from 'react';
import { TextNode, BaseNode, TaskNode } from '../nodes';
import NodeSpaceEditor from '../NodeSpaceEditor';
import { NodeSpaceCallbacks } from '../hierarchy';
import { countAllNodes } from '../utils';
import './demo.css';

function DemoApp() {
  const [nodes, setNodes] = useState<BaseNode[]>(() => {
    // Text Node 1: Project Planning (initially collapsed)
    const projectNode = new TextNode('Project Planning');
    const phase1 = new TextNode('Phase 1: Research');
    const research1 = new TextNode('Market Analysis');
    const research2 = new TextNode('Competitor Research');
    const deepResearch = new TextNode('Deep Dive: Customer Interviews');
    const interview1 = new TextNode('Interview: Tech Professionals');
    const interview2 = new TextNode('Interview: Business Users');
    
    projectNode.addChild(phase1);
    phase1.addChild(research1);
    phase1.addChild(research2);
    research1.addChild(deepResearch);
    deepResearch.addChild(interview1);
    deepResearch.addChild(interview2);
    
    const phase2 = new TextNode('Phase 2: Development');
    const dev1 = new TextNode('Frontend Development');
    const dev2 = new TextNode('Backend Development');
    const testing = new TextNode('Testing & QA');
    const unitTests = new TextNode('Unit Tests');
    const integrationTests = new TextNode('Integration Tests');
    const e2eTests = new TextNode('End-to-End Tests');
    
    projectNode.addChild(phase2);
    phase2.addChild(dev1);
    phase2.addChild(dev2);
    phase2.addChild(testing);
    testing.addChild(unitTests);
    testing.addChild(integrationTests);
    testing.addChild(e2eTests);
    
    // Text Node 2: Documentation (expanded)
    const docsNode = new TextNode('Documentation');
    const userGuide = new TextNode('User Guide');
    const gettingStarted = new TextNode('Getting Started');
    const basicFeatures = new TextNode('Basic Features');
    const advancedFeatures = new TextNode('Advanced Features');
    const customization = new TextNode('Customization Options');
    const themes = new TextNode('Themes & Styling');
    const plugins = new TextNode('Plugin Development');
    
    docsNode.addChild(userGuide);
    userGuide.addChild(gettingStarted);
    userGuide.addChild(basicFeatures);
    userGuide.addChild(advancedFeatures);
    advancedFeatures.addChild(customization);
    customization.addChild(themes);
    customization.addChild(plugins);
    
    const apiDocs = new TextNode('API Documentation');
    const coreApi = new TextNode('Core API');
    const endpoints = new TextNode('REST Endpoints');
    const authentication = new TextNode('Authentication');
    const examples = new TextNode('Code Examples');
    const nodeExamples = new TextNode('Node.js Examples');
    const pythonExamples = new TextNode('Python Examples');
    
    docsNode.addChild(apiDocs);
    apiDocs.addChild(coreApi);
    apiDocs.addChild(endpoints);
    coreApi.addChild(authentication);
    endpoints.addChild(examples);
    examples.addChild(nodeExamples);
    examples.addChild(pythonExamples);
    
    // Task Node: Sprint Tasks (with nested subtasks)
    const sprintTasks = new TaskNode('Sprint 1 Tasks');
    const backendTask = new TaskNode('Implement user authentication');
    const authFeature1 = new TaskNode('Set up JWT middleware');
    const authFeature2 = new TaskNode('Create login endpoint');
    const authFeature3 = new TaskNode('Add password hashing');
    const securityCheck = new TaskNode('Security audit');
    const penTest = new TaskNode('Penetration testing');
    
    sprintTasks.addChild(backendTask);
    backendTask.addChild(authFeature1);
    backendTask.addChild(authFeature2);
    backendTask.addChild(authFeature3);
    authFeature3.addChild(securityCheck);
    securityCheck.addChild(penTest);
    
    const frontendTask = new TaskNode('Design user interface');
    const wireframes = new TaskNode('Create wireframes');
    const mockups = new TaskNode('Design high-fidelity mockups');
    const prototypes = new TaskNode('Build interactive prototypes');
    const userTesting = new TaskNode('Conduct user testing');
    const feedback = new TaskNode('Gather feedback');
    const iterations = new TaskNode('Design iterations');
    
    sprintTasks.addChild(frontendTask);
    frontendTask.addChild(wireframes);
    frontendTask.addChild(mockups);
    frontendTask.addChild(prototypes);
    prototypes.addChild(userTesting);
    userTesting.addChild(feedback);
    feedback.addChild(iterations);
    
    const qaTask = new TaskNode('Quality assurance testing');
    const testPlan = new TaskNode('Write test plan');
    const automated = new TaskNode('Automated testing setup');
    const manual = new TaskNode('Manual testing scenarios');
    const bugTriage = new TaskNode('Bug triage process');
    const criticalBugs = new TaskNode('Critical bug fixes');
    const minorBugs = new TaskNode('Minor bug fixes');
    
    sprintTasks.addChild(qaTask);
    qaTask.addChild(testPlan);
    qaTask.addChild(automated);
    qaTask.addChild(manual);
    qaTask.addChild(bugTriage);
    bugTriage.addChild(criticalBugs);
    bugTriage.addChild(minorBugs);
    
    return [projectNode, docsNode, sprintTasks];
  });
  
  // Set up initial collapsed state - Project Planning should be collapsed initially
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(() => {
    if (nodes.length > 0) {
      return new Set([nodes[0].getNodeId()]); // Collapse first node (Project Planning)
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

  const handleCollapseStateChange = (nodeId: string, collapsed: boolean) => {
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
    },
    onCollapseStateChange: handleCollapseStateChange, // NEW
  };

  const handleFocus = (nodeId: string) => {
    setFocusedNodeId(nodeId);
  };

  const handleBlur = () => {
    setFocusedNodeId(null);
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
        initialCollapsedNodes={collapsedNodes}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onRemoveNode={handleRemoveNode}
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
        <strong>Demo Structure:</strong>
        <ul>
          <li><strong>Project Planning</strong> (Text Node, initially collapsed) - Deep hierarchy with research phases</li>
          <li><strong>Documentation</strong> (Text Node, expanded) - Multi-level user guides and API docs</li>
          <li><strong>Sprint 1 Tasks</strong> (Task Node) - Nested task hierarchy with checkboxes</li>
        </ul>
        <p>Visual indentation shows parent-child relationships. Events track all user interactions semantically.</p>
      </div>
    </div>
  );
}

export default DemoApp;