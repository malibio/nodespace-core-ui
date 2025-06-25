import React, { useState } from 'react';
import { BaseNode } from '../nodes';
import { NodeIndicator } from '../NodeIndicator';
import { NodeEditorFactory } from '../editors';
import { SlashCommandModal, DEFAULT_SLASH_OPTIONS } from '../SlashCommandModal';
import type { SlashCommandOption } from '../SlashCommandModal';
import { getVisibleNodes, KeyboardHandlerRegistry, initializeKeyboardHandlers, NodeFactory, updateNodeId } from '../utils';
import type { KeyboardResult } from '../utils';

export interface NodeSpaceCallbacks {
  onNodesChange?: (nodes: BaseNode[]) => void;
  onNodeChange?: (nodeId: string, content: string) => void;
  onNodeCreate?: (content: string, parentId?: string, nodeType?: string) => Promise<string> | string;
  onNodeDelete?: (nodeId: string) => void;
  onNodeStructureChange?: (operation: 'indent' | 'outdent' | 'move', nodeId: string, details?: any) => void;
}

interface NodeEditorProps {
  node: BaseNode;
  depth: number;
  focused: boolean;
  textareaRefs: React.MutableRefObject<{ [key: string]: HTMLTextAreaElement | null }>;
  onRemoveNode: (node: BaseNode) => void;
  isRemoveDisabled: boolean;
  nodes: BaseNode[];
  callbacks: NodeSpaceCallbacks;
  onFocus: (nodeId: string) => void;
  onBlur: () => void;
  navigationStateRef: React.MutableRefObject<{ preferredColumn: number | null; resetCounter: number }>;
  collapsedNodes?: Set<string>;
  // Additional props for ID synchronization
  focusedNodeId: string | null;
  onFocusedNodeIdChange: (nodeId: string | null) => void;
}

// Helper function to calculate node depth in hierarchy
function getNodeDepth(node: BaseNode): number {
  let depth = 0;
  let current = node.parent;
  while (current) {
    depth++;
    current = current.parent;
  }
  return depth;
}

export function NodeEditor({
  node,
  focused,
  textareaRefs,
  onRemoveNode,
  isRemoveDisabled,
  nodes,
  callbacks,
  onFocus,
  onBlur,
  navigationStateRef,
  collapsedNodes,
  focusedNodeId,
  onFocusedNodeIdChange
}: NodeEditorProps) {
  const nodeId = node.getNodeId();
  
  // Local state to track when the navigation state was last reset
  const [, setLastResetCounter] = useState(navigationStateRef.current.resetCounter);
  
  // Slash command state
  const [showSlashModal, setShowSlashModal] = useState(false);
  const [slashModalPosition, setSlashModalPosition] = useState({ x: 0, y: 0 });
  const [slashQuery, setSlashQuery] = useState('');
  
  // Reference to update modal position function for scroll handling
  const updateModalPositionRef = React.useRef<(() => void) | null>(null);
  
  // Debounced content change handling
  const contentChangeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Add scroll event listener to update modal position when scrolling
  React.useEffect(() => {
    if (!showSlashModal) return;

    const handleScroll = () => {
      if (updateModalPositionRef.current) {
        updateModalPositionRef.current();
      }
    };

    // Add scroll listeners to window and any scrollable parents
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [showSlashModal]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (contentChangeTimeoutRef.current) {
        clearTimeout(contentChangeTimeoutRef.current);
      }
    };
  }, []);

  const resetNavigationState = () => {
    navigationStateRef.current.preferredColumn = null;
    navigationStateRef.current.resetCounter += 1;
    setLastResetCounter(navigationStateRef.current.resetCounter);
  };

  // Handle slash command modal
  const handleSlashCommand = (textarea: HTMLTextAreaElement) => {
    const cursorPosition = textarea.selectionStart;
    const content = node.getContent();
    
    // Check if user typed "/" at the beginning of an empty node
    const contentBeforeCursor = content.substring(0, cursorPosition);
    const lastSlashIndex = contentBeforeCursor.lastIndexOf('/');
    
    // Only show modal if "/" is at the very beginning and node has no other content
    if (lastSlashIndex === 0) {
      // Get query text after the slash
      const queryAfterSlash = contentBeforeCursor.substring(lastSlashIndex + 1);
      
      // Check if the entire node content only contains "/" and optional query text
      // This ensures no other text exists before or after the slash command
      if (content === contentBeforeCursor) {
        // Update the search query
        setSlashQuery(queryAfterSlash.toLowerCase());
        
        // Calculate position of the "/" character in the textarea
        const updateModalPosition = () => {
          const textareaRect = textarea.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(textarea);
          const paddingLeft = parseInt(computedStyle.paddingLeft) || 0;
          const paddingTop = parseInt(computedStyle.paddingTop) || 0;
          const lineHeight = parseInt(computedStyle.lineHeight) || 20;
          
          // Since "/" is at position 0, it's at the start of the textarea
          // Position modal directly below the "/" character
          const modalX = textareaRect.left + paddingLeft;
          const modalY = textareaRect.top + paddingTop + lineHeight;
          
          setSlashModalPosition({ x: modalX, y: modalY });
        };
        
        // Store the update function reference for scroll handling
        updateModalPositionRef.current = updateModalPosition;
        
        updateModalPosition();
        setShowSlashModal(true);
      }
    }
  };

  const handleSlashOptionSelect = (option: SlashCommandOption) => {
    const textarea = textareaRefs.current[nodeId];
    if (!textarea) return;

    const content = node.getContent();
    
    // Remove the "/" character and any query text after it
    const currentCursorPosition = textarea.selectionStart;
    const contentBeforeCursor = content.substring(0, currentCursorPosition);
    const lastSlashIndex = contentBeforeCursor.lastIndexOf('/');
    
    // Remove from slash position to current cursor position
    const newContent = content.substring(0, lastSlashIndex) + content.substring(currentCursorPosition);
    
    // If converting to a different node type, create a new node
    if (option.nodeType !== node.getNodeType()) {
      const newNode = NodeFactory.createNodeByType(option.nodeType, newContent);
      
      // Copy tree structure relationships
      newNode.parent = node.parent;
      newNode.children = [...node.children];
      
      // Update children's parent reference
      newNode.children.forEach(child => {
        child.parent = newNode;
      });
      
      // Update the nodes array
      const updatedNodes = nodes.map(n => {
        if (n.getNodeId() === nodeId) {
          return newNode;
        }
        return n;
      });
      
      // Replace in parent's children if this node has a parent
      if (node.parent) {
        const parentIndex = node.parent.children.indexOf(node);
        if (parentIndex >= 0) {
          node.parent.children[parentIndex] = newNode;
        }
      }
      
      callbacks.onNodesChange?.(updatedNodes);
      
      // Focus the new node after conversion
      setTimeout(() => {
        const newTextarea = textareaRefs.current[newNode.getNodeId()];
        if (newTextarea) {
          newTextarea.focus();
          newTextarea.setSelectionRange(newContent.length, newContent.length);
        }
      }, 0);
    } else {
      // Same node type, just update content
      callbacks.onNodeChange?.(nodeId, newContent);
    }
    
    setShowSlashModal(false);
    updateModalPositionRef.current = null;
  };

  const handleSlashModalClose = () => {
    setShowSlashModal(false);
    setSlashQuery('');
    updateModalPositionRef.current = null;
  };

  // Filter options based on query
  const filteredOptions = DEFAULT_SLASH_OPTIONS.filter(option => 
    option.label.toLowerCase().includes(slashQuery) ||
    option.nodeType.toLowerCase().includes(slashQuery)
  );


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Initialize keyboard handlers if not already done
    initializeKeyboardHandlers();
    
    const textarea = e.currentTarget;
    const cursorPosition = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const hasSelection = cursorPosition !== selectionEnd;
    const content = node.getContent();
    
    // Get the appropriate keyboard handler for this node type
    const handler = KeyboardHandlerRegistry.getHandlerForNode(node);
    
    if (!handler) {
      console.warn(`No keyboard handler found for node type: ${node.getNodeType()}`);
      return;
    }
    
    // Create the edit context
    const editContext = {
      cursorPosition,
      content,
      allNodes: nodes,
      textareaRefs,
      callbacks,
      collapsedNodes
    };
    
    let result: KeyboardResult = { handled: false };
    
    // Route to appropriate handler method
    if (e.key === 'Enter' && !e.shiftKey) {
      result = handler.handleEnter(node, editContext);
    } else if (e.key === 'Backspace' && cursorPosition === 0 && !hasSelection) {
      result = handler.handleBackspace(node, editContext);
    } else if (e.key === 'Delete' && cursorPosition === content.length && !hasSelection) {
      result = handler.handleDelete(node, editContext);
    } else if (e.key === 'Tab' && !e.shiftKey) {
      result = handler.handleTab(node, editContext);
    } else if (e.key === 'Tab' && e.shiftKey) {
      result = handler.handleShiftTab(node, editContext);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      // Keep arrow navigation in NodeEditor for now since it's complex and node-agnostic
      const isUpArrow = e.key === 'ArrowUp';
      
      // More precise boundary detection for multi-line content
      const lines = content.split('\n');
      const textBeforeCursor = content.substring(0, cursorPosition);
      const currentLineIndex = textBeforeCursor.split('\n').length - 1;
      const currentLineStartIndex = textBeforeCursor.lastIndexOf('\n') + 1;
      const columnInCurrentLine = cursorPosition - currentLineStartIndex;
      
      let isAtNodeBoundary = false;
      
      if (isUpArrow) {
        // For up arrow: at boundary if cursor is in first line (and would move out of node)
        isAtNodeBoundary = currentLineIndex === 0;
      } else {
        // For down arrow: at boundary if cursor is in last line (and would move out of node)
        isAtNodeBoundary = currentLineIndex === lines.length - 1;
      }
      
      if (isAtNodeBoundary) {
        e.preventDefault();
        
        const allNodes = getVisibleNodes(nodes);
        const currentIndex = allNodes.findIndex(n => n.getNodeId() === node.getNodeId());
        const targetIndex = isUpArrow ? currentIndex - 1 : currentIndex + 1;
        
        if (targetIndex >= 0 && targetIndex < allNodes.length) {
          const targetNode = allNodes[targetIndex];
          const targetTextarea = textareaRefs.current[targetNode.getNodeId()];
          
          if (targetTextarea) {
            targetTextarea.focus();
            
            // Visual cursor preservation logic using the column position we calculated
            const currentDepth = getNodeDepth(node);
            const targetDepth = getNodeDepth(targetNode);
            const depthDifference = targetDepth - currentDepth;
            const adjustedColumn = Math.max(0, columnInCurrentLine - (depthDifference * 2));
            
            const targetContent = targetNode.getContent();
            const targetLines = targetContent.split('\n');
            
            let targetCursorPosition: number;
            if (isUpArrow) {
              // Moving up: position in last line of target
              const targetLine = targetLines[targetLines.length - 1];
              const targetLineStart = targetContent.length - targetLine.length;
              targetCursorPosition = Math.min(targetLineStart + adjustedColumn, targetContent.length);
            } else {
              // Moving down: position in first line of target
              targetCursorPosition = Math.min(adjustedColumn, targetLines[0]?.length || 0);
            }
            
            setTimeout(() => {
              targetTextarea.setSelectionRange(targetCursorPosition, targetCursorPosition);
            }, 0);
          }
        }
        // If no target node found, let the default behavior handle it (cursor goes to line boundary)
      } else {
        // Reset preferred column when doing normal within-node navigation
        resetNavigationState();
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
      // Reset preferred column for horizontal navigation
      resetNavigationState();
    } else if (e.key === 'Escape' && showSlashModal) {
      // Close slash modal on Escape
      e.preventDefault();
      setShowSlashModal(false);
    }
    
    // Apply the result if the handler processed the event
    if (result.handled) {
      if (result.preventDefault) {
        e.preventDefault();
      }
      
      if (result.newNodes) {
        callbacks.onNodesChange?.(result.newNodes);
      }
      
      // Handle async operations (ID synchronization)
      if (result.asyncOperation) {
        const { temporaryNodeId, realNodeIdPromise } = result.asyncOperation;
        
        realNodeIdPromise.then((realId) => {
          // Update the node ID and all references
          const updatedFocusedNodeId = updateNodeId(
            result.newNodes || nodes,
            temporaryNodeId,
            realId,
            textareaRefs,
            focusedNodeId
          );
          
          // Update focused node ID if it changed
          if (updatedFocusedNodeId !== focusedNodeId) {
            onFocusedNodeIdChange(updatedFocusedNodeId);
          }
          
          // Trigger re-render to reflect ID changes
          callbacks.onNodesChange?.(result.newNodes || [...nodes]);
        }).catch((error) => {
          console.error('Failed to synchronize node ID:', error);
          // Handle error gracefully - node will keep temporary ID
        });
      }

      if (result.focusNodeId && result.cursorPosition !== undefined) {
        setTimeout(() => {
          const targetTextarea = textareaRefs.current[result.focusNodeId!];
          if (targetTextarea) {
            targetTextarea.focus();
            targetTextarea.setSelectionRange(result.cursorPosition!, result.cursorPosition!);
          }
        }, 0);
      } else if (result.focusNodeId) {
        setTimeout(() => {
          const targetTextarea = textareaRefs.current[result.focusNodeId!];
          if (targetTextarea) {
            targetTextarea.focus();
          }
        }, 0);
      }
    }
  };
  const handleBlur = () => {
    onBlur();
  };

  const handleClick = () => {
    // Reset preferred column when user explicitly clicks to position cursor
    resetNavigationState();
  };

  // Note: handleRemove not currently used but kept for potential future use
  // const handleRemove = () => {
  //   onRemoveNode(node);
  // };

  return (
    <>
      {/* Only show NodeIndicator for non-task nodes - TaskNodes handle their own checkbox */}
      {node.getNodeType() !== 'task' && (
        <NodeIndicator 
          node={node}
          className="ns-node-indicator"
          hasChildren={node.children.length > 0}
          onStatusChange={() => {
            callbacks.onNodesChange?.([...nodes]); // Trigger re-render when status changes
          }}
        />
      )}
      
      <NodeEditorFactory
        node={node}
        nodeId={nodeId}
        focused={focused}
        textareaRefs={textareaRefs}
        onFocus={onFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onContentChange={(content) => {
          // Always update local state immediately for responsive UI
          callbacks.onNodesChange?.([...nodes]); // Ensure re-render for content changes
          
          // Reset preferred column when user types (changes content)
          resetNavigationState();
          
          // Debounce the semantic onNodeChange callback
          if (contentChangeTimeoutRef.current) {
            clearTimeout(contentChangeTimeoutRef.current);
          }
          contentChangeTimeoutRef.current = setTimeout(() => {
            callbacks.onNodeChange?.(nodeId, content);
          }, 300); // 300ms debounce delay
          
          // Check for slash command after content changes
          const textarea = textareaRefs.current[nodeId];
          if (textarea && content.includes('/')) {
            setTimeout(() => handleSlashCommand(textarea), 0);
          } else if (!content.includes('/')) {
            // Hide modal if slash was removed
            setShowSlashModal(false);
            setSlashQuery('');
            updateModalPositionRef.current = null;
          }
        }}
        onClick={handleClick}
      />
      
      
      {/* Slash Command Modal */}
      <SlashCommandModal
        isVisible={showSlashModal && filteredOptions.length > 0}
        position={slashModalPosition}
        options={filteredOptions}
        onSelect={handleSlashOptionSelect}
        onClose={handleSlashModalClose}
      />
    </>
  );
}

