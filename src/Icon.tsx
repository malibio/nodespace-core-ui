import { iconLibrary, type IconName } from './icons';

export interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  color?: string;
}

export function Icon({ name, size = 20, className = '', color }: IconProps) {
  const iconPath = iconLibrary[name];
  
  if (!iconPath) {
    return null;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 -960 960 960"
      className={`ns-icon ${className}`}
      style={{ 
        fill: color || 'currentColor',
        display: 'block',
        flexShrink: 0
      }}
      aria-hidden="true"
    >
      <path d={iconPath} />
    </svg>
  );
}

// Convenience function to get available icon names
export function getIconNames(): IconName[] {
  return Object.keys(iconLibrary) as IconName[];
}

// Re-export types for convenience
export type { IconName };