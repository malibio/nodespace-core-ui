import { BaseNode } from './BaseNode';

/**
 * Image metadata extracted from image files
 */
export interface ImageMetadata {
  // File information
  filename?: string;
  fileSize?: number;
  mimeType?: string;
  
  // Image dimensions
  width?: number;
  height?: number;
  
  // EXIF data (when available)
  dateTime?: string;
  camera?: {
    make?: string;
    model?: string;
    settings?: {
      aperture?: string;
      shutterSpeed?: string;
      iso?: number;
      focalLength?: string;
    };
  };
  
  // GPS information (when available)
  gps?: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
  };
  
  // Additional metadata
  description?: string;
  tags?: string[];
}

/**
 * ImageNode represents an image within the NodeSpace hierarchy.
 * Contains image data, metadata, and supports the same hierarchical
 * operations as other node types.
 */
export class ImageNode extends BaseNode {
  private imageData?: Uint8Array;
  private metadata: ImageMetadata;
  private description?: string;

  constructor(
    imageData?: Uint8Array,
    metadata: ImageMetadata = {},
    description?: string,
    nodeId?: string
  ) {
    super('image', description || metadata.description || 'Untitled Image', nodeId);
    
    this.imageData = imageData;
    this.metadata = metadata;
    this.description = description;
  }

  // Abstract method implementations
  createIndicator(): HTMLElement {
    const indicator = document.createElement('div');
    indicator.className = 'ns-image-indicator';
    indicator.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
        <rect x="1" y="2" width="10" height="8" rx="1" stroke="currentColor" fill="none" stroke-width="1"/>
        <circle cx="4" cy="5" r="1" fill="currentColor"/>
        <path d="m8 7-2-2-2 2-1-1-2 2v2h7v-2l-1-1z" fill="currentColor"/>
      </svg>
    `;
    return indicator;
  }

  getIndicatorClass(): string {
    return 'ns-image-indicator';
  }

  getDefaultProperties(): Record<string, any> {
    return {
      nodeType: 'image',
      hasImageData: !!this.imageData,
      hasMetadata: Object.keys(this.metadata).length > 0,
      imageSize: this.imageData?.length || 0,
      dimensions: this.metadata.width && this.metadata.height 
        ? `${this.metadata.width}x${this.metadata.height}` 
        : undefined
    };
  }

  // Image-specific methods
  getImageData(): Uint8Array | undefined {
    return this.imageData;
  }

  setImageData(data: Uint8Array): void {
    this.imageData = data;
  }

  getMetadata(): ImageMetadata {
    return { ...this.metadata };
  }

  setMetadata(metadata: ImageMetadata): void {
    this.metadata = { ...metadata };
    
    // Update description if provided in metadata
    if (metadata.description && !this.description) {
      this.setContent(metadata.description);
    }
  }

  getDescription(): string | undefined {
    return this.description;
  }

  setDescription(description: string): void {
    this.description = description;
    this.setContent(description);
  }

  // Image utility methods
  hasImageData(): boolean {
    return !!this.imageData && this.imageData.length > 0;
  }

  getImageUrl(): string | undefined {
    if (!this.imageData) return undefined;
    
    // Convert Uint8Array to blob URL for display
    const blob = new Blob([this.imageData], { 
      type: this.metadata.mimeType || 'image/jpeg' 
    });
    return URL.createObjectURL(blob);
  }

  getDisplayTitle(): string {
    return this.description || 
           this.metadata.filename || 
           this.metadata.description || 
           'Untitled Image';
  }

  // Override content methods to sync with description
  setContent(content: string): void {
    super.setContent(content);
    this.description = content;
  }

  // Plain text extraction for search/indexing
  getPlainTextContent(): string {
    const parts: string[] = [];
    
    // Add description
    if (this.description) {
      parts.push(this.description);
    }
    
    // Add filename
    if (this.metadata.filename) {
      parts.push(this.metadata.filename);
    }
    
    // Add metadata tags
    if (this.metadata.tags?.length) {
      parts.push(...this.metadata.tags);
    }
    
    // Add camera info for searchability
    if (this.metadata.camera?.make) {
      parts.push(this.metadata.camera.make);
    }
    if (this.metadata.camera?.model) {
      parts.push(this.metadata.camera.model);
    }
    
    return parts.join(' ');
  }

  // Enhanced serialization with image metadata
  toJSON(): any {
    const baseJson = super.toJSON();
    return {
      ...baseJson,
      imageData: this.imageData ? Array.from(this.imageData) : undefined,
      metadata: this.metadata,
      description: this.description,
      hasImageData: this.hasImageData(),
      displayTitle: this.getDisplayTitle()
    };
  }

  // Static factory methods
  static fromImageFile(
    imageData: Uint8Array, 
    filename: string, 
    mimeType: string,
    description?: string
  ): ImageNode {
    const metadata: ImageMetadata = {
      filename,
      mimeType,
      fileSize: imageData.length
    };
    
    return new ImageNode(imageData, metadata, description);
  }

  static createPlaceholder(description: string = 'Image placeholder'): ImageNode {
    return new ImageNode(undefined, {}, description);
  }
}