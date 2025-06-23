import { useState, useEffect, useRef } from 'react';
import { Icon, type IconName } from './Icon';

export interface SlashCommandOption {
  id: string;
  label: string;
  icon: IconName;
  nodeType: string;
}

interface SlashCommandModalProps {
  isVisible: boolean;
  position: { x: number; y: number };
  options: SlashCommandOption[];
  onSelect: (option: SlashCommandOption) => void;
  onClose: () => void;
}

export function SlashCommandModal({
  isVisible,
  position,
  options,
  onSelect,
  onClose
}: SlashCommandModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset selection when modal becomes visible
  useEffect(() => {
    if (isVisible) {
      setSelectedIndex(0);
    }
  }, [isVisible]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, options.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (options[selectedIndex]) {
            onSelect(options[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, selectedIndex, options, onSelect, onClose]);

  // Handle clicks outside modal
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible, onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={modalRef}
      className="ns-slash-command-modal"
      style={{
        position: 'fixed', // Changed from absolute to fixed for viewport positioning
        left: position.x,
        top: position.y, // Removed the +20 offset since we're calculating it precisely
        zIndex: 1000
      }}
    >
      <div className="ns-slash-command-list">
        {options.map((option, index) => (
          <div
            key={option.id}
            className={`ns-slash-command-option ${index === selectedIndex ? 'ns-selected' : ''}`}
            onClick={() => onSelect(option)}
          >
            <div className="ns-slash-command-icon">
              <Icon name={option.icon} size={16} />
            </div>
            <span className="ns-slash-command-label">{option.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Default slash command options
export const DEFAULT_SLASH_OPTIONS: SlashCommandOption[] = [
  {
    id: 'text',
    label: 'Text',
    icon: 'text',
    nodeType: 'text'
  },
  {
    id: 'task',
    label: 'Task',
    icon: 'task',
    nodeType: 'task'
  },
  {
    id: 'ai',
    label: 'NodeSpace AI',
    icon: 'sparkles',
    nodeType: 'ai-chat'
  }
];