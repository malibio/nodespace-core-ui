import React, { useState, useEffect, useRef } from 'react';
import { BaseNode } from '../nodes';
import { NodeEditor, NodeSpaceCallbacks } from './NodeEditor';

interface NodeComponentProps {
  node: BaseNode;
  depth: number;
  focusedNodeId: string | null;
  textareaRefs: React.MutableRefObject<{ [key: string]: HTMLTextAreaElement | null }>;
  onRemoveNode: (node: BaseNode) => void;
  isRemoveDisabled: boolean;
  nodes: BaseNode[];
  callbacks: NodeSpaceCallbacks;
  onFocus: (nodeId: string) => void;
  onBlur: () => void;
  navigationStateRef: React.MutableRefObject<{ preferredColumn: number | null; resetCounter: number }>;
  collapsedNodes: Set<string>;
  collapsibleNodeTypes: Set<string>;
  onCollapseChange?: (nodeId: string, collapsed: boolean) => void;
  onFocusedNodeIdChange: (nodeId: string | null) => void;
}

export function NodeComponent({
  node,
  depth,
  focusedNodeId,
  textareaRefs,
  onRemoveNode,
  isRemoveDisabled,
  nodes,
  callbacks,
  onFocus,
  onBlur,
  navigationStateRef,
  collapsedNodes,
  collapsibleNodeTypes,
  onCollapseChange,
  onFocusedNodeIdChange
}: NodeComponentProps) {
  const nodeId = node.getNodeId();
  const isFocused = focusedNodeId === nodeId;
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsedNodes.has(nodeId);
  const isCollapsible = collapsibleNodeTypes.has(node.getNodeType());
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper function to find the correct indicator element (NodeIndicator or TaskNode checkbox)
  const findIndicatorElement = (container: Element): HTMLElement | null => {
    // For task nodes, look for the checkbox in TaskNodeEditor
    const taskCheckbox = container.querySelector('.ns-task-checkbox') as HTMLElement;
    if (taskCheckbox) return taskCheckbox;
    
    // For other nodes, look for the standard node indicator
    const nodeIndicator = container.querySelector('.ns-node-indicator') as HTMLElement;
    return nodeIndicator;
  };

  // Calculate and set dynamic line height for parent nodes
  useEffect(() => {
    if (hasChildren && !isCollapsed && containerRef.current) {
      // Find the last child's circle indicator position
      const calculateLineHeight = () => {
        const container = containerRef.current;
        if (!container) return;

        // Find only DIRECT children circle indicators (not grandchildren)
        const directChildrenContainer = container.querySelector('.ns-node-children');
        if (!directChildrenContainer) return;
        
        // Get only direct child containers (depth + 1)
        const directChildContainers = directChildrenContainer.querySelectorAll(`:scope > .ns-node-container[data-depth="${depth + 1}"]`);
        
        if (directChildContainers.length === 0) return;
        
        // Get the indicator from the last direct child (text circle or task box)
        const lastDirectChild = directChildContainers[directChildContainers.length - 1];
        const lastChildIndicator = findIndicatorElement(lastDirectChild.querySelector('.ns-node-wrapper')!);
        
        if (lastChildIndicator) {
          const containerRect = container.getBoundingClientRect();
          const lastIndicatorRect = lastChildIndicator.getBoundingClientRect();
          
          // Calculate vertical line height from start to last child indicator center
          const lineStartY = 20.5;
          const lastIndicatorCenterY = lastIndicatorRect.top - containerRect.top + (lastIndicatorRect.height / 2);
          const lineHeight = Math.max(0, lastIndicatorCenterY - lineStartY);
          
          container.style.setProperty('--ns-line-height', `${lineHeight}px`);

          // Calculate horizontal line positions for each direct child 
          const parentIndicator = findIndicatorElement(container.querySelector('.ns-node-wrapper')!);
          if (!parentIndicator) return;
          
          const parentIndicatorRect = parentIndicator.getBoundingClientRect();
          
          // Calculate visual center based on indicator type
          let parentVisualCenterX;
          const parentNodeType = node.getNodeType(); // Use the node type directly
          
          if (parentNodeType === 'text') {
            // Text circles: 6px circle in 9px container
            parentVisualCenterX = parentIndicatorRect.left + (parentIndicatorRect.width / 2);
          } else if (parentNodeType === 'task') {
            // Task checkboxes: account for 1-2px right offset of actual checkbox
            parentVisualCenterX = parentIndicatorRect.left + (parentIndicatorRect.width / 2) + 1;
          } else {
            // Default: use geometric center
            parentVisualCenterX = parentIndicatorRect.left + (parentIndicatorRect.width / 2);
          }
          
          const parentVerticalLineX = parentVisualCenterX;
          
          // Set vertical line X position dynamically
          const verticalLineLeft = parentVerticalLineX - containerRect.left - 0.5;
          container.style.setProperty('--ns-vertical-line-left', `${verticalLineLeft}px`);
          
          directChildContainers.forEach((childContainer) => {
            const childWrapper = childContainer.querySelector('.ns-node-wrapper') as HTMLElement;
            const childIndicator = findIndicatorElement(childWrapper);
            const childTriangle = childContainer.querySelector('.ns-collapse-triangle') as HTMLElement;
            
            if (childWrapper && childIndicator) {
              const childContainerRect = childContainer.getBoundingClientRect();
              const childIndicatorRect = childIndicator.getBoundingClientRect();
              const childIndicatorCenterY = childIndicatorRect.top - childContainerRect.top + (childIndicatorRect.height / 2);
              const childIndicatorCenterX = childIndicatorRect.left + (childIndicatorRect.width / 2);
              
              // Calculate horizontal line positioning
              const horizontalLineStart = parentVerticalLineX - childContainerRect.left;
              const horizontalLineWidth = Math.max(0, childIndicatorCenterX - parentVerticalLineX - 4);
              const horizontalLineY = childIndicatorCenterY - 0.5;
              
              // Set CSS custom properties for horizontal line
              childWrapper.style.setProperty('--ns-horizontal-line-left', `${horizontalLineStart}px`);
              childWrapper.style.setProperty('--ns-horizontal-line-width', `${horizontalLineWidth}px`);
              childWrapper.style.setProperty('--ns-horizontal-line-top', `${horizontalLineY}px`);
              
              // Calculate triangle position to center on parent indicator
              if (childTriangle) {
                // Calculate triangle position relative to the child wrapper
                const childWrapperRect = childWrapper.getBoundingClientRect();
                const targetTriangleX = parentVerticalLineX - 4.5; // Where we want triangle center
                const triangleOffset = targetTriangleX - childWrapperRect.left; // Offset from wrapper's left edge
                
                childWrapper.style.setProperty('--ns-triangle-left', `${triangleOffset}px`);
              }
            }
          });
        }
      };

      // Try immediate calculation first, fallback to delayed if needed
      const attemptCalculation = () => {
        const container = containerRef.current;
        if (!container) return false;
        
        // Quick check if elements are positioned (not at 0,0)
        const indicator = findIndicatorElement(container.querySelector('.ns-node-wrapper')!);
        if (!indicator) return false;
        
        const rect = indicator.getBoundingClientRect();
        if (rect.left === 0 && rect.top === 0) return false; // Not positioned yet
        
        calculateLineHeight();
        return true;
      };
      
      // Fallback to delayed calculation if immediate failed
      let timeoutId: NodeJS.Timeout | null = null;
      if (!attemptCalculation()) {
        timeoutId = setTimeout(() => {
          requestAnimationFrame(calculateLineHeight);
        }, 50); // Reduced from 200ms to 50ms
      }

      // Add MutationObserver to recalculate when tree structure changes
      let observer: MutationObserver | null = null;
      
      try {
        observer = new MutationObserver(() => {
          // Debounce rapid changes - reduced delay
          setTimeout(() => {
            if (containerRef.current) {
              requestAnimationFrame(calculateLineHeight);
            }
          }, 10); // Reduced from 50ms to 10ms
        });

        // Observe the children container for any changes
        const childrenContainer = containerRef.current?.querySelector('.ns-node-children');
        if (childrenContainer) {
          observer.observe(childrenContainer, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-depth', 'data-has-children', 'data-collapsed']
          });
        }
      } catch (error) {
        // MutationObserver setup failed, continuing without
      }
      
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (observer) {
          observer.disconnect();
        }
      };
    }
  }, [hasChildren, isCollapsed, node.children.length, nodes, depth, node]); // Add missing dependencies

  // Visual Viewport API for zoom detection
  useEffect(() => {
    if (hasChildren && !isCollapsed && window.visualViewport) {
      const handleViewportChange = () => {
        if (containerRef.current) {
          setTimeout(() => {
            requestAnimationFrame(() => {
              const container = containerRef.current;
              if (!container) return;

              const directChildrenContainer = container.querySelector('.ns-node-children');
              if (!directChildrenContainer) return;
              
              const directChildContainers = directChildrenContainer.querySelectorAll(`:scope > .ns-node-container[data-depth="${depth + 1}"]`);
              if (directChildContainers.length === 0) return;
              
              const lastDirectChild = directChildContainers[directChildContainers.length - 1];
              const lastChildIndicator = lastDirectChild.querySelector('.ns-node-wrapper .ns-node-indicator') as HTMLElement;
              
              if (lastChildIndicator) {
                const containerRect = container.getBoundingClientRect();
                const lastIndicatorRect = lastChildIndicator.getBoundingClientRect();
                
                const lineStartY = 20.5;
                const lastIndicatorCenterY = lastIndicatorRect.top - containerRect.top + (lastIndicatorRect.height / 2);
                const lineHeight = Math.max(0, lastIndicatorCenterY - lineStartY);
                
                container.style.setProperty('--ns-line-height', `${lineHeight}px`);

                const parentIndicator = container.querySelector('.ns-node-wrapper .ns-node-indicator') as HTMLElement;
                if (!parentIndicator) return;
                
                const parentIndicatorRect = parentIndicator.getBoundingClientRect();
                const parentVerticalLineX = parentIndicatorRect.left + (parentIndicatorRect.width / 2);
                
                const verticalLineLeft = parentVerticalLineX - containerRect.left - 0.5;
                container.style.setProperty('--ns-vertical-line-left', `${verticalLineLeft}px`);
                
                directChildContainers.forEach((childContainer) => {
                  const childWrapper = childContainer.querySelector('.ns-node-wrapper') as HTMLElement;
                  const childIndicator = childContainer.querySelector('.ns-node-wrapper .ns-node-indicator') as HTMLElement;
                  
                  if (childWrapper && childIndicator) {
                    const childContainerRect = childContainer.getBoundingClientRect();
                    const childIndicatorRect = childIndicator.getBoundingClientRect();
                    const childIndicatorCenterY = childIndicatorRect.top - childContainerRect.top + (childIndicatorRect.height / 2);
                    const childIndicatorCenterX = childIndicatorRect.left + (childIndicatorRect.width / 2);
                    
                    const horizontalLineStart = parentVerticalLineX - childContainerRect.left;
                    const horizontalLineWidth = Math.max(0, childIndicatorCenterX - parentVerticalLineX - 4);
                    const horizontalLineY = childIndicatorCenterY - 0.5;
                    
                    childWrapper.style.setProperty('--ns-horizontal-line-left', `${horizontalLineStart}px`);
                    childWrapper.style.setProperty('--ns-horizontal-line-width', `${horizontalLineWidth}px`);
                    childWrapper.style.setProperty('--ns-horizontal-line-top', `${horizontalLineY}px`);
                  }
                });
              }
            });
          }, 20); // Reduced from 100ms to 20ms for faster zoom response
        }
      };
      
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportChange);
        }
      };
    }
  }, [hasChildren, isCollapsed, depth]);

  // Separate effect for root node triangle positioning (runs regardless of collapse state)
  useEffect(() => {
    if (depth === 0 && hasChildren && containerRef.current) {
      const positionRootTriangle = () => {
        const container = containerRef.current;
        if (!container) return;

        const rootTriangle = container.querySelector('.ns-collapse-triangle') as HTMLElement;
        const rootWrapper = container.querySelector('.ns-node-wrapper') as HTMLElement;
        
        if (rootTriangle && rootWrapper) {
          // Move triangle closer to indicator (positive value moves right toward indicator)
          rootWrapper.style.setProperty('--ns-triangle-left', '4px');
        }
      };

      // Minimal delay for DOM readiness
      const timeoutId = setTimeout(() => {
        requestAnimationFrame(positionRootTriangle);
      }, 10); // Reduced from 50ms to 10ms

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [depth, hasChildren]); // Runs when root node with children mounts/updates

  const handleToggleCollapse = () => {
    if (onCollapseChange) {
      onCollapseChange(nodeId, !isCollapsed);
    }
    // Trigger callbacks to notify parent of structure change
    if (callbacks.onNodeStructureChange) {
      callbacks.onNodeStructureChange('move', nodeId, { operation: 'toggle-collapse' });
    }
  };

  return (
    <div className="ns-node-container" data-depth={depth} ref={containerRef}>
      <div 
        className="ns-node-wrapper"
        data-focused={isFocused}
        data-node-type={node.getNodeType()}
        data-depth={depth}
        data-has-children={hasChildren}
        data-collapsed={isCollapsed}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Collapse triangle - only show for collapsible parent nodes and only on hover */}
        {hasChildren && isCollapsible && (
          <div 
            className="ns-collapse-triangle"
            data-collapsed={isCollapsed}
            onClick={handleToggleCollapse}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggleCollapse();
              }
            }}
            aria-label={isCollapsed ? 'Expand node' : 'Collapse node'}
            style={{
              opacity: isHovering ? 1.0 : 0, // Fully visible on hover
              transition: 'opacity 0.2s ease',
            }}
          />
        )}

        {/* Spacer for nodes without children to maintain alignment */}
        {!hasChildren && (
          <div 
            className="ns-collapse-spacer"
            style={{
              width: '9px',
              height: '9px',
              marginTop: '11.5px',
              flexShrink: 0,
            }}
          />
        )}

        <NodeEditor
          node={node}
          depth={depth}
          focused={isFocused}
          textareaRefs={textareaRefs}
          onRemoveNode={onRemoveNode}
          isRemoveDisabled={isRemoveDisabled}
          nodes={nodes}
          callbacks={callbacks}
          onFocus={onFocus}
          onBlur={onBlur}
          navigationStateRef={navigationStateRef}
          collapsedNodes={collapsedNodes}
          focusedNodeId={focusedNodeId}
          onFocusedNodeIdChange={onFocusedNodeIdChange}
        />
      </div>

      {/* Only render children if node has children AND is not collapsed */}
      {hasChildren && !isCollapsed && (
        <div className="ns-node-children" data-depth={depth}>
          {node.children.map((childNode) => (
            <NodeComponent
              key={childNode.getNodeId()}
              node={childNode}
              depth={depth + 1}
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
      )}
    </div>
  );
}