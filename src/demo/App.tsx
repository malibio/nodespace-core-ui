import React, { useState } from 'react';
import { BaseNode } from '../nodes';
import NodeSpaceEditor from '../NodeSpaceEditor';
import { NodeSpaceCallbacks } from '../hierarchy';
import { RAGQueryRequest, RAGQueryResponse, ChatMessage, RAGResponseStatus } from '../types/chat';
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
    // Single unified callback for all node updates
    onNodeUpdate: (nodeId: string, nodeData: any) => {
      const { content, parentId, beforeSiblingId, nodeType, metadata } = nodeData;
      
      let logMessage = `🔄 UPDATE: ${nodeType} node "${content}" (ID: ${nodeId.slice(0, 8)}...)`;
      
      if (parentId) {
        logMessage += ` Parent: ${parentId.slice(0, 8)}...`;
      } else {
        logMessage += ' ROOT';
      }
      
      if (beforeSiblingId) {
        logMessage += ` After: ${beforeSiblingId.slice(0, 8)}...`;
      }
      
      if (metadata) {
        if (nodeType === 'ai-chat') {
          const { question, response, node_sources } = metadata;
          logMessage += ` Q: "${question}"`;
          if (response) {
            logMessage += ` Response: Yes`;
          }
          if (node_sources && node_sources.length > 0) {
            logMessage += ` (${node_sources.length} sources)`;
          }
        } else {
          logMessage += ` Metadata: ${Object.keys(metadata).join(', ')}`;
        }
      }
      
      addLog(logMessage);
      
      // In a real app, you'd persist the node data here
      console.log('🔔 Node Update Event Received:', {
        nodeId,
        nodeData
      });
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
    
    onNodeDelete: (nodeId: string) => {
      addLog(`🔴 DELETE: Node ${nodeId.slice(0, 8)}...`);
    },

    // NEW: AI Chat callbacks for testing RAG integration
    onAIChatQuery: async (request: RAGQueryRequest): Promise<RAGQueryResponse> => {
      addLog(`🤖 AI CHAT QUERY: "${request.query}" (Session: ${request.session_id.slice(0, 8)}...)`);
      
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create mock response based on query
      const mockResponse: RAGQueryResponse = {
        message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: `**AI Response to:** "${request.query}"\n\n✅ **This callback is working!** The desktop app would normally:\n- Send this query to the backend AI service\n- Retrieve relevant knowledge from your database\n- Generate a contextual response with source attribution\n\n**Mock Knowledge Sources Found:**\n- Demo Document 1: Project planning notes\n- Demo Document 2: Technical specifications\n- Demo Document 3: Meeting transcripts\n\n*Note: This is a demo response from the core-ui component callbacks.*`,
        rag_context: {
          sources_used: ['demo-doc-1', 'demo-doc-2', 'demo-doc-3'],
          retrieval_score: 0.89,
          context_tokens: 420,
          generation_time_ms: 1850,
          knowledge_summary: 'Found relevant information from 3 demo knowledge sources'
        },
        status: RAGResponseStatus.Success
      };
      
      addLog(`✅ AI RESPONSE: Generated response with ${mockResponse.rag_context.sources_used.length} sources`);
      return mockResponse;
    },

    onAIChatMessageSent: (message: ChatMessage, nodeId: string) => {
      addLog(`📤 AI MESSAGE SENT: "${message.content}" (Node: ${nodeId.slice(0, 8)}...)`);
    },

    onAIChatResponseReceived: (response: RAGQueryResponse, nodeId: string) => {
      addLog(`📥 AI RESPONSE RECEIVED: Status=${response.status}, Sources=${response.rag_context?.sources_used.length || 0} (Node: ${nodeId.slice(0, 8)}...)`);
    },

    onAIChatError: (error: string, nodeId: string) => {
      addLog(`❌ AI CHAT ERROR: ${error} (Node: ${nodeId.slice(0, 8)}...)`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className={`demo-app ${isDarkMode ? 'ns-dark-mode' : ''}`}>
      <div className="demo-header">
        <div className="demo-title-row">
          <h1>NodeSpace Core UI - Full Feature Demo</h1>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="theme-toggle">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
        <p>Test all NodeSpace features including AI chat integration. Watch the logs to see all events!</p>
        <div className="demo-info">
          <strong>🎯 Key Features to Test:</strong>
          <ul>
            <li><strong>Slash Commands:</strong> Type "/" to create AI chat, task, or other node types</li>
            <li><strong>AI Chat:</strong> Create "/ai" nodes and click "Ask" to test RAG callbacks</li>
            <li><strong>Tab/Shift+Tab:</strong> Indent/outdent nodes for hierarchical structure</li>
            <li><strong>Enter:</strong> Create new sibling nodes</li>
            <li><strong>Keyboard Navigation:</strong> Arrow keys for cross-node navigation</li>
            <li><strong>Single Callback:</strong> All node updates now use onNodeUpdate with complete context</li>
            <li><strong>Event Logging:</strong> Watch for unified update events with hierarchy info</li>
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
          <strong>🧪 Test Single Callback Steps:</strong>
        </p>
        <ol>
          <li><strong>Create nodes:</strong> Type "Parent" → Enter → Type "Child"</li>
          <li><strong>Test Tab:</strong> Put cursor on "Child" → Press Tab (should indent)</li>
          <li><strong>Check logs:</strong> Look for "🔄 UPDATE" with Parent and hierarchy info</li>
          <li><strong>Test AI Chat:</strong> Type "/ai" → Enter question → Click Ask</li>
          <li><strong>Watch metadata:</strong> See complete AI chat state in update logs</li>
          <li><strong>Visual feedback:</strong> Watch hierarchy lines appear/disappear</li>
        </ol>
      </div>
    </div>
  );
}

export default DemoApp;