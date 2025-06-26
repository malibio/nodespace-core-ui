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

  const findIndicatorElement = (container: Element): HTMLElement | null => {
    const taskCheckbox = container.querySelector('.ns-task-checkbox') as HTMLElement;
    if (taskCheckbox) return taskCheckbox;
    
    const textIndicator = container.querySelector('.ns-text-indicator') as HTMLElement;
    if (textIndicator) return textIndicator;
    
    const nodeIndicator = container.querySelector('.ns-node-indicator') as HTMLElement;
    if (nodeIndicator) return nodeIndicator;
    
    const textEditor = container.querySelector('.ns-text-editor-container .ns-text-indicator') as HTMLElement;
    if (textEditor) return textEditor;
    
    const taskEditor = container.querySelector('.ns-task-editor-container .ns-task-checkbox') as HTMLElement;
    if (taskEditor) return taskEditor;
    
    return null;
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

          const parentIndicator = findIndicatorElement(container.querySelector('.ns-node-wrapper')!);
          if (!parentIndicator) return;
          
          const parentIndicatorRect = parentIndicator.getBoundingClientRect();
          
          let parentVisualCenterX: number;
          const parentNodeType = node.getNodeType();
          
          if (parentNodeType === 'text') {
            parentVisualCenterX = parentIndicatorRect.left + (parentIndicatorRect.width / 2);
          } else if (parentNodeType === 'task') {
            parentVisualCenterX = parentIndicatorRect.left + (parentIndicatorRect.width / 2);
          } else {
            parentVisualCenterX = parentIndicatorRect.left + (parentIndicatorRect.width / 2);
          }
          
          const parentVerticalLineX = parentVisualCenterX;
          
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
              
              const horizontalLineStart = parentVerticalLineX - childContainerRect.left;
              const horizontalLineWidth = Math.max(0, childIndicatorCenterX - parentVerticalLineX - 4);
              const horizontalLineY = childIndicatorCenterY - 0.5;
              
              childWrapper.style.setProperty('--ns-horizontal-line-left', `${horizontalLineStart}px`);
              childWrapper.style.setProperty('--ns-horizontal-line-width', `${horizontalLineWidth}px`);
              childWrapper.style.setProperty('--ns-horizontal-line-top', `${horizontalLineY}px`);
              
              if (childTriangle) {
                const childWrapperRect = childWrapper.getBoundingClientRect();
                const targetTriangleX = parentVisualCenterX - 4.75;
                const triangleOffset = targetTriangleX - childWrapperRect.left;
                
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
    // Note: Collapse/expand is purely a UI visibility change, not a structural change
    // The onCollapseStateChange callback already handles this event appropriately
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