// NodeSpace UI Icon Library
// Organized by category for better maintainability and tree shaking

import * as ui from './ui';
import * as navigation from './navigation';
import * as actions from './actions';
import * as visual from './visual';

// UI Icons - Interface elements and content types
export * from './ui';

// Navigation Icons - Triangles, arrows, and directional elements  
export * from './navigation';

// Action Icons - User actions and operations
export * from './actions';

// Visual Elements - Node indicators and visual feedback elements
export * from './visual';

export const iconLibrary = {
  ...ui,
  ...navigation,
  ...actions,
  ...visual,
  
  // Legacy aliases for backward compatibility
  'triangle_right': navigation.triangleRight,
  'triangle_down': navigation.triangleDown,
} as const;

// Type-safe icon names
export type IconName = keyof typeof iconLibrary;