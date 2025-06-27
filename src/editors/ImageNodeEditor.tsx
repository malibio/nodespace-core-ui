import React, { useState, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { ImageNode } from '../nodes';
import { NodeEditorProps } from './TextNodeEditor';

/**
 * Editor component specifically for image nodes
 * Displays image preview with editable description
 */
export function ImageNodeEditor({
  node,
  nodeId,
  focused,
  textareaRefs,
  onFocus,
  onBlur,
  onKeyDown,
  onContentChange,
  onClick
}: NodeEditorProps) {
  
  const imageNode = node as ImageNode;
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [showLargePreview, setShowLargePreview] = useState(false);
  
  // Generate image URL for preview
  useEffect(() => {
    const url = imageNode.getImageUrl();
    setImageUrl(url);
    
    // Cleanup object URL on component unmount
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [imageNode]);

  const metadata = imageNode.getMetadata();
  const hasImageData = imageNode.hasImageData();
  
  const handleImageClick = () => {
    setShowLargePreview(true);
  };

  const handleClosePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowLargePreview(false);
  };

  const renderImagePreview = () => {
    if (!hasImageData || !imageUrl) {
      return (
        <div className="ns-image-placeholder">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="currentColor" opacity="0.5">
            <rect x="4" y="8" width="40" height="32" rx="2" stroke="currentColor" fill="none" strokeWidth="2"/>
            <circle cx="16" cy="20" r="3" fill="currentColor"/>
            <path d="m32 28-8-8-8 8-4-4-8 8v8h28v-8l-4-4z" fill="currentColor"/>
          </svg>
          <span className="ns-image-placeholder-text">
            {metadata.filename || 'No image data'}
          </span>
        </div>
      );
    }

    return (
      <div className="ns-image-preview" onClick={handleImageClick}>
        <img 
          src={imageUrl}
          alt={imageNode.getDescription() || 'Image'}
          className="ns-image-thumbnail"
          loading="lazy"
        />
        {metadata.width && metadata.height && (
          <div className="ns-image-info">
            <span className="ns-image-dimensions">
              {metadata.width}×{metadata.height}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderMetadata = () => {
    const items = [];
    
    if (metadata.filename) {
      items.push(
        <div key="filename" className="ns-metadata-item">
          <span className="ns-metadata-label">File:</span>
          <span className="ns-metadata-value">{metadata.filename}</span>
        </div>
      );
    }
    
    if (metadata.fileSize) {
      const sizeKB = Math.round(metadata.fileSize / 1024);
      items.push(
        <div key="size" className="ns-metadata-item">
          <span className="ns-metadata-label">Size:</span>
          <span className="ns-metadata-value">{sizeKB}KB</span>
        </div>
      );
    }
    
    if (metadata.camera?.make || metadata.camera?.model) {
      items.push(
        <div key="camera" className="ns-metadata-item">
          <span className="ns-metadata-label">Camera:</span>
          <span className="ns-metadata-value">
            {metadata.camera.make} {metadata.camera.model}
          </span>
        </div>
      );
    }
    
    if (metadata.dateTime) {
      items.push(
        <div key="datetime" className="ns-metadata-item">
          <span className="ns-metadata-label">Date:</span>
          <span className="ns-metadata-value">
            {new Date(metadata.dateTime).toLocaleDateString()}
          </span>
        </div>
      );
    }

    return items.length > 0 ? (
      <div className="ns-image-metadata">
        {items}
      </div>
    ) : null;
  };

  return (
    <div className="ns-image-node-editor">
      {/* Image preview section */}
      <div className="ns-image-section">
        {renderImagePreview()}
        {renderMetadata()}
      </div>
      
      {/* Editable description */}
      <div className="ns-image-description">
        <TextareaAutosize
          ref={(el) => {
            textareaRefs.current[nodeId] = el;
          }}
          value={node.getContent()}
          onChange={(e) => {
            node.setContent(e.target.value);
            onContentChange(e.target.value);
          }}
          onFocus={() => onFocus(nodeId)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          onClick={onClick}
          placeholder="Add image description..."
          className={`ns-image-textarea ${focused ? 'ns-textarea-focused' : ''}`}
          minRows={1}
          maxRows={8}
        />
      </div>

      {/* Large image preview modal */}
      {showLargePreview && imageUrl && (
        <div className="ns-image-modal" onClick={handleClosePreview}>
          <div className="ns-image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="ns-image-modal-close" 
              onClick={handleClosePreview}
              aria-label="Close preview"
            >
              ×
            </button>
            <img 
              src={imageUrl}
              alt={imageNode.getDescription() || 'Image'}
              className="ns-image-full"
            />
            {imageNode.getDescription() && (
              <div className="ns-image-modal-description">
                {imageNode.getDescription()}
              </div>
            )}
            {renderMetadata()}
          </div>
        </div>
      )}
    </div>
  );
}