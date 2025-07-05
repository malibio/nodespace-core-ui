import React, { useState } from 'react';
import { BaseNode } from '../nodes';
import { NodeIndicator } from '../NodeIndicator';
import { NodeEditorFactory } from '../editors';
import { SlashCommandModal, DEFAULT_SLASH_OPTIONS } from '../SlashCommandModal';
import type { SlashCommandOption } from '../SlashCommandModal';
import { getVisibleNodes, KeyboardHandlerRegistry, initializeKeyboardHandlers, NodeFactory } from '../utils';
import type { KeyboardResult } from '../utils';
import type { ImageUploadResult, NodeSpaceCallbacks } from '../types';
import { VirtualNodeManager } from '../utils/virtualNodeManager';
import { ContentPersistenceManager } from '../utils/contentPersistence';
import { getHierarchyContext, getNodeType } from '../utils/hierarchyUtils';

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
  virtualNodeManager?: VirtualNodeManager; // Virtual node conversion support
  contentPersistenceManager?: ContentPersistenceManager; // Content-based persistence
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
  onFocusedNodeIdChange,
  virtualNodeManager,
  contentPersistenceManager
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
      } else {
      }
    }
  };

  const handleSlashOptionSelect = async (option: SlashCommandOption) => {
    const content = node.getContent();
    
    // Remove the "/" character and any query text after it
    // For markdown display mode, we'll just remove the leading "/"
    let newContent = content;
    if (content.startsWith('/')) {
      newContent = content.substring(1);
    }
    
    // Special handling for image node type
    if (option.nodeType === 'image') {
      try {

        // Show loading state by updating node content
        node.setContent('📸 Loading image...');
        // callbacks.onNodesChange?.([...nodes]);

        let imageData: ImageUploadResult | undefined;

        // Check Tauri environment
        const hasTauri = typeof window !== 'undefined' && (window as any).__TAURI__;

        // Try Tauri invoke first (for desktop app environment)
        if (hasTauri) {
          const { invoke } = (window as any).__TAURI__.tauri;
          
          try {
            imageData = await invoke('create_image_node');
          } catch (tauriError) {
            throw tauriError;
          }
        }
        // Fallback to callback pattern (for standalone/demo environment) 
        else if (callbacks.onImageNodeCreate) {
          // For callback pattern, we need to trigger file selection differently
          // This would need to be implemented by the parent application
          throw new Error('Image upload via callback not yet implemented. Please use desktop app.');
        } else {
          throw new Error('Image upload not available. Please ensure you are running in the desktop app environment.');
        }

        if (imageData) {
          // Create new ImageNode with the returned data
          const { ImageNode } = await import('../nodes/ImageNode');
          const imageNode = new ImageNode(
            imageData.imageData,
            imageData.metadata,
            newContent || imageData.metadata.description || 'Untitled Image'
          );
          
          // Copy tree structure relationships
          imageNode.parent = node.parent;
          imageNode.children = [...node.children];
          
          // Update children's parent reference
          imageNode.children.forEach(child => {
            child.parent = imageNode;
          });
          
          // Update the nodes array
          const updatedNodes = nodes.map(n => {
            if (n.getNodeId() === nodeId) {
              return imageNode;
            }
            return n;
          });
          
          // Replace in parent's children if this node has a parent
          if (node.parent) {
            const parentIndex = node.parent.children.indexOf(node);
            if (parentIndex >= 0) {
              node.parent.children[parentIndex] = imageNode;
            }
          }
          
          // Update parent component state with new nodes array
          if (callbacks.onNodesChange) {
            callbacks.onNodesChange(updatedNodes);
          }
          
          // Use onNodeUpdate to indicate this is a node transformation, not creation
          if (callbacks.onNodeUpdate) {
            const hierarchyContext = getHierarchyContext(imageNode);
            callbacks.onNodeUpdate(imageNode.getNodeId(), {
              content: imageNode.getContent(),
              parentId: hierarchyContext.parentId,
              beforeSiblingId: hierarchyContext.beforeSiblingId,
              nodeType: getNodeType(imageNode),
              metadata: { 
                imageData: imageNode.getImageData(),
                metadata: imageNode.getMetadata()
              }
            });
          }
          
          // Focus the new node after creation
          setTimeout(() => {
            // Update focus state first
            onFocus(imageNode.getNodeId());
            
            // Then focus the textarea (it should exist after onFocus triggers re-render)
            setTimeout(() => {
              const newTextarea = textareaRefs.current[imageNode.getNodeId()];
              if (newTextarea) {
                newTextarea.focus();
                newTextarea.setSelectionRange(newContent.length, newContent.length);
              }
            }, 50); // Small delay to allow re-render
          }, 0);
        }
      } catch (error) {
        console.error('Image upload failed:', error);
        
        // Handle error gracefully with specific guidance
        let userMessage = '❌ Image upload failed';
        
        if (error instanceof Error) {
          // Provide specific guidance based on error type
          if (error.message.includes('not found') || error.message.includes('command')) {
            userMessage = '❌ Image upload unavailable - Desktop app feature not found';
          } else if (error.message.includes('permission') || error.message.includes('access')) {
            userMessage = '❌ Image upload blocked - Permission denied';
          } else if (error.message.includes('canceled') || error.message.includes('cancelled')) {
            userMessage = '📸 Image selection cancelled';
          } else {
            userMessage = `❌ Image upload failed: ${error.message}`;
          }
        } else {
          userMessage = '❌ Image upload failed: Unknown error';
        }
        
        
        node.setContent(userMessage);
        // callbacks.onNodesChange?.([...nodes]);
        
        // Show error for a few seconds, then restore original content
        // Use longer timeout for cancelled operations (shorter feedback cycle)
        const timeoutDuration = userMessage.includes('cancelled') ? 1500 : 4000;
        setTimeout(() => {
          node.setContent(newContent);
            // callbacks.onNodesChange?.([...nodes]);
        }, timeoutDuration);
        
      }
    }
    // Handle other node types with existing logic
    else if (option.nodeType !== node.getNodeType()) {
      // Handle all node types normally, including AIChatNode
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
      
      // Update parent component state with new nodes array
      if (callbacks.onNodesChange) {
        callbacks.onNodesChange(updatedNodes);
      }
      
      // Use onNodeUpdate to indicate this is a node transformation, not creation
      if (callbacks.onNodeUpdate) {
        const hierarchyContext = getHierarchyContext(newNode);
        
        // Set appropriate metadata based on node type
        let metadata = null;
        if (newNode.getNodeType() === 'ai-chat') {
          metadata = {
            question: '',
            question_timestamp: new Date().toISOString(),
            response: null,
            response_timestamp: null,
            generation_time_ms: null,
            overall_confidence: null,
            node_sources: [],
            error: null
          };
        }
        
        callbacks.onNodeUpdate(newNode.getNodeId(), {
          content: newNode.getContent(),
          parentId: hierarchyContext.parentId,
          beforeSiblingId: hierarchyContext.beforeSiblingId,
          nodeType: getNodeType(newNode),
          metadata
        });
      }
      
      // Focus the new node after conversion
      setTimeout(() => {
        // Update focus state first
        onFocus(newNode.getNodeId());
        
        // Then focus the textarea (it should exist after onFocus triggers re-render)
        setTimeout(() => {
          const newTextarea = textareaRefs.current[newNode.getNodeId()];
          if (newTextarea) {
            newTextarea.focus();
            newTextarea.setSelectionRange(newContent.length, newContent.length);
          }
        }, 50); // Small delay to allow re-render
      }, 0);
    } else {
      // Same node type, just update content
      if (callbacks.onNodeUpdate) {
        const hierarchyContext = getHierarchyContext(node);
        callbacks.onNodeUpdate(nodeId, {
          content: newContent,
          parentId: hierarchyContext.parentId,
          beforeSiblingId: hierarchyContext.beforeSiblingId,
          nodeType: getNodeType(node),
          metadata: null
        });
      }
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
      return;
    }
    
    // Create the edit context
    const editContext = {
      cursorPosition,
      content,
      allNodes: nodes,
      textareaRefs,
      callbacks,
      collapsedNodes,
      virtualNodeManager, // Virtual node conversion support
      contentPersistenceManager // Content-based persistence
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
      
      // UUIDs generated upfront, no swapping needed

      // Apply focus changes immediately after DOM updates
      if (result.focusNodeId) {
        
        // Update parent component's focus tracking first
        onFocusedNodeIdChange(result.focusNodeId);
        
        // Then focus the DOM element using requestAnimationFrame for proper timing
        requestAnimationFrame(() => {
          const targetTextarea = textareaRefs.current[result.focusNodeId!];
          
          if (targetTextarea) {
            targetTextarea.focus();
            if (result.cursorPosition !== undefined) {
              targetTextarea.setSelectionRange(result.cursorPosition, result.cursorPosition);
            }
          } else {
            // If textarea not found immediately, try again after a short delay for new nodes
            setTimeout(() => {
              const retryTextarea = textareaRefs.current[result.focusNodeId!];
              if (retryTextarea) {
                retryTextarea.focus();
                if (result.cursorPosition !== undefined) {
                  retryTextarea.setSelectionRange(result.cursorPosition, result.cursorPosition);
                }
              } else {
              }
            }, 10);
          }
        });
      }
    }
  };
  const handleBlur = () => {
    // Immediately persist content on blur if it exists
    if (contentPersistenceManager) {
      const content = node.getContent();
      contentPersistenceManager.immediatelyPersistNode(
        nodeId,
        content,
        node.parent?.getNodeId(),
        node.getNodeType()
      );
    }
    
    onBlur();
  };

  const handleClick = () => {
    // Reset preferred column when user explicitly clicks to position cursor
    resetNavigationState();
  };


  return (
    <>
      {/* Only show NodeIndicator for nodes that don't handle their own indicators */}
      {node.getNodeType() !== 'task' && node.getNodeType() !== 'ai-chat' && (
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
        callbacks={callbacks}
        onContentChange={(content) => {
          // Always update local state immediately for responsive UI
          callbacks.onNodesChange?.([...nodes]); // Ensure re-render for content changes
          
          // Reset preferred column when user types (changes content)
          resetNavigationState();
          
          // Debounce the semantic onNodeUpdate callback
          if (contentChangeTimeoutRef.current) {
            clearTimeout(contentChangeTimeoutRef.current);
          }
          contentChangeTimeoutRef.current = setTimeout(() => {
            if (callbacks.onNodeUpdate) {
              const hierarchyContext = getHierarchyContext(node);
              callbacks.onNodeUpdate(nodeId, {
                content,
                parentId: hierarchyContext.parentId,
                beforeSiblingId: hierarchyContext.beforeSiblingId,
                nodeType: getNodeType(node),
                metadata: null
              });
            }
          }, 300); // 300ms debounce delay
          
          // Schedule content persistence (only for nodes with actual content)
          if (contentPersistenceManager) {
            contentPersistenceManager.scheduleContentPersistence(
              nodeId,
              content,
              node.parent?.getNodeId(),
              node.getNodeType()
            );
          }
          
          // Check for slash command only if content starts with '/'
          const textarea = textareaRefs.current[nodeId];
          if (textarea && content.startsWith('/')) {
            setTimeout(() => handleSlashCommand(textarea), 0);
          } else if (!content.startsWith('/')) {
            // Hide modal if slash was removed from beginning
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

