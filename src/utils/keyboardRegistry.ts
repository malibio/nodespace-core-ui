import { KeyboardHandlerRegistry } from './keyboardHandlers';
import { TextNodeKeyboardHandler } from './textKeyboardHandler';
import { TaskNodeKeyboardHandler } from './taskKeyboardHandler';

/**
 * Initialize and register all keyboard handlers
 */
export function initializeKeyboardHandlers(): void {
  // Register text node handler
  KeyboardHandlerRegistry.register('text', new TextNodeKeyboardHandler());
  
  // Register task node handler
  KeyboardHandlerRegistry.register('task', new TaskNodeKeyboardHandler());
  
  // Future handlers will be registered here:
  // KeyboardHandlerRegistry.register('date', new DateNodeKeyboardHandler());
}

// Initialize handlers immediately when this module is imported
initializeKeyboardHandlers();