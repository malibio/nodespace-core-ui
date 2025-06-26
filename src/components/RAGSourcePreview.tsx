import React, { useState } from 'react';

interface RAGSourcePreviewProps {
  source: {
    nodeId: string;
    title: string;
    type: string;
  };
  relevanceScore?: number;
  onSourceClick?: (nodeId: string) => void;
}

/**
 * Component for displaying RAG knowledge sources with preview tooltips
 * Implements NS-59 requirements for source attribution and knowledge previews
 */
export function RAGSourcePreview({ 
  source, 
  relevanceScore, 
  onSourceClick 
}: RAGSourcePreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });

  // Mock content for preview - in real implementation this would come from backend
  const getMockPreviewContent = (nodeId: string): string => {
    switch (nodeId) {
      case 'mock-1':
        return 'NodeSpace is a hierarchical knowledge management system that uses AI to help you organize and discover information...';
      case 'mock-2':
        return 'Getting started with NodeSpace involves creating your first text nodes and understanding the hierarchical structure...';
      case 'mock-3':
        return 'Research findings indicate that users prefer hierarchical organization for complex knowledge structures...';
      case 'mock-4':
        return 'Implementation details for authentication systems require careful consideration of security protocols...';
      default:
        return 'This is a preview of the source content. In the full implementation, this would show the actual content snippet that was relevant to your query.';
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPreviewPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setShowPreview(true);
  };

  const handleMouseLeave = () => {
    setShowPreview(false);
  };

  const handleClick = () => {
    if (onSourceClick) {
      onSourceClick(source.nodeId);
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return '#10b981'; // green
    if (score >= 0.6) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getRelevanceLabel = (score: number) => {
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <>
      <div 
        className="ns-ai-chat-source-item enhanced"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{ cursor: onSourceClick ? 'pointer' : 'default' }}
      >
        <span className="ns-ai-chat-source-icon">
          {source.type === 'task' ? '✓' : source.type === 'ai-chat' ? '🤖' : '📄'}
        </span>
        <span className="ns-ai-chat-source-title">
          {source.title}
        </span>
        <span className="ns-ai-chat-source-type">
          ({source.type})
        </span>
        {relevanceScore !== undefined && (
          <span 
            className="ns-relevance-score"
            style={{ 
              color: getRelevanceColor(relevanceScore),
              backgroundColor: `${getRelevanceColor(relevanceScore)}15`,
              padding: '2px 6px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '500'
            }}
          >
            {Math.round(relevanceScore * 100)}% • {getRelevanceLabel(relevanceScore)}
          </span>
        )}
        {onSourceClick && (
          <span className="ns-source-link-indicator">
            →
          </span>
        )}
      </div>

      {/* Knowledge Preview Tooltip */}
      {showPreview && (
        <div 
          className="ns-knowledge-preview-tooltip"
          style={{
            position: 'fixed',
            left: previewPosition.x,
            top: previewPosition.y,
            transform: 'translateX(-50%) translateY(-100%)',
            zIndex: 1000
          }}
        >
          <div className="ns-preview-content">
            <div className="ns-preview-header">
              <strong>{source.title}</strong>
              <span className="ns-preview-type">({source.type})</span>
            </div>
            <div className="ns-preview-excerpt">
              {getMockPreviewContent(source.nodeId)}
            </div>
            {relevanceScore !== undefined && (
              <div className="ns-preview-relevance">
                <span style={{ color: getRelevanceColor(relevanceScore) }}>
                  {getRelevanceLabel(relevanceScore)} relevance ({Math.round(relevanceScore * 100)}%)
                </span>
              </div>
            )}
          </div>
          <div className="ns-preview-arrow"></div>
        </div>
      )}
    </>
  );
}