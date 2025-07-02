import React, { useState } from 'react';
import { BaseNode } from '../nodes';
import NodeSpaceEditor from '../NodeSpaceEditor';
import { NodeSpaceCallbacks } from '../hierarchy';
import './demo.css';

function DemoApp() {
  // Start with empty nodes to test empty state behavior
  const [nodes, setNodes] = useState<BaseNode[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Add logging helper
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  // Callback handlers with logging
  const callbacks: NodeSpaceCallbacks = {
    onNodeCreateWithId: (nodeId: string, content: string, parentId?: string, nodeType?: string) => {
      addLog(`🟢 CREATE: ${nodeType} node "${content}" (ID: ${nodeId.slice(0, 8)}...) ${parentId ? `Parent: ${parentId.slice(0, 8)}...` : 'ROOT'}`);
    },
    
    onNodeChange: (nodeId: string, content: string) => {
      addLog(`🟡 CHANGE: Node ${nodeId.slice(0, 8)}... content: "${content}"`);
    },
    
    onNodeDelete: (nodeId: string) => {
      addLog(`🔴 DELETE: Node ${nodeId.slice(0, 8)}...`);
    },
    
    onNodesChange: (updatedNodes: BaseNode[]) => {
      addLog(`🔄 NODES UPDATED: ${updatedNodes.length} total nodes`);
      
      // Debug the structure being received
      console.log('🔄 DEMO: onNodesChange received nodes:', updatedNodes.length);
      console.log('🔄 DEMO: Root nodes:', updatedNodes.filter(n => !n.parent).map(n => `"${n.getContent()}"`));
      console.log('🔄 DEMO: Nodes with parents:', updatedNodes.filter(n => n.parent).map(n => `"${n.getContent()}" -> parent: "${n.parent!.getContent()}"`));
      
      setNodes(updatedNodes);
      
      console.log('🔄 DEMO: setNodes called, React will re-render');
    },
    
    // NEW: Structure change callback for indentation/outdentation
    onNodeStructureChange: (operation: 'indent' | 'outdent' | 'move', nodeId: string, details?: any) => {
      const detailsStr = details ? JSON.stringify(details, null, 2) : 'No details';
      addLog(`🏗️ STRUCTURE: ${operation.toUpperCase()} operation on node ${nodeId.slice(0, 8)}...`);
      addLog(`📋 DETAILS: ${detailsStr}`);
      
      // In a real app, you'd persist the structure change here
      console.log('🔔 Structure Change Event Received:', {
        operation,
        nodeId,
        details
      });
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className={`demo-app ${isDarkMode ? 'ns-dark-mode' : ''}`}>
      <div className="demo-header">
        <div className="demo-title-row">
          <h1>NodeSpace Core UI - Indentation & Structure Change Demo</h1>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="theme-toggle">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
        <p>Test the hierarchical editing features. Watch the logs to see structure change events!</p>
        <div className="demo-info">
          <strong>🎯 Key Features to Test:</strong>
          <ul>
            <li><strong>Tab:</strong> Indent a node (makes it a child of previous sibling)</li>
            <li><strong>Shift+Tab:</strong> Outdent a node (moves it up one level)</li>
            <li><strong>Enter:</strong> Create new sibling nodes</li>
            <li><strong>Structure Events:</strong> Watch for STRUCTURE log entries with full details</li>
            <li><strong>Visual Hierarchy:</strong> See indented nodes with connecting lines</li>
          </ul>
        </div>
      </div>

      <div className="demo-content">
        <div className="editor-section">
          <h2>Editor</h2>
          <NodeSpaceEditor
            nodes={nodes}
            callbacks={callbacks}
            className={`demo-editor${isDarkMode ? ' ns-dark-mode' : ''}`}
          />
        </div>

        <div className="logs-section">
          <div className="logs-header">
            <h2>Event Logs</h2>
            <button onClick={clearLogs} className="clear-button">Clear Logs</button>
          </div>
          <div className="logs-container">
            {logs.length === 0 ? (
              <div className="no-logs">No events yet. Start typing in the editor!</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="log-entry">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="demo-footer">
        <p>
          <strong>🧪 Test Indentation Steps:</strong>
        </p>
        <ol>
          <li><strong>Create nodes:</strong> Type "Parent" → Enter → Type "Child"</li>
          <li><strong>Test Tab:</strong> Put cursor on "Child" → Press Tab (should indent)</li>
          <li><strong>Check logs:</strong> Look for "🏗️ STRUCTURE: INDENT" with detailed JSON</li>
          <li><strong>Test Shift+Tab:</strong> Press Shift+Tab (should outdent)</li>
          <li><strong>Visual feedback:</strong> Watch hierarchy lines appear/disappear</li>
        </ol>
      </div>
    </div>
  );
}

export default DemoApp;