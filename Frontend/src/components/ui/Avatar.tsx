import React, { useState, Children, cloneElement, isValidElement } from 'react';
import { UserIcon } from 'lucide-react';
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
}
const sizeStyles: Record<AvatarSize, {
  container: string;
  text: string;
  icon: string;
}> = {
  xs: {
    container: 'w-6 h-6',
    text: 'text-xs',
    icon: 'w-3 h-3'
  },
  sm: {
    container: 'w-8 h-8',
    text: 'text-sm',
    icon: 'w-4 h-4'
  },
  md: {
    container: 'w-10 h-10',
    text: 'text-base',
    icon: 'w-5 h-5'
  },
  lg: {
    container: 'w-12 h-12',
    text: 'text-lg',
    icon: 'w-6 h-6'
  },
  xl: {
    container: 'w-16 h-16',
    text: 'text-xl',
    icon: 'w-8 h-8'
  }
};
function getInitials(name: string): string {
  return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
}
function getColorFromName(name: string): string {
  const colors = ['bg-primary', 'bg-secondary', 'bg-success', 'bg-warning', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}
export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  className = ''
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const styles = sizeStyles[size];
  const showImage = src && !imageError;
  const showInitials = !showImage && name;
  const showIcon = !showImage && !name;
  return <div className={`
        relative inline-flex items-center justify-center
        rounded-full overflow-hidden flex-shrink-0
        ${styles.container}
        ${showInitials ? getColorFromName(name) : 'bg-gray-200'}
        ${className}
      `}>
      {showImage && <img src={src} alt={alt || name || 'Avatar'} className="w-full h-full object-cover" onError={() => setImageError(true)} />}
      {showInitials && <span className={`font-medium text-white ${styles.text}`}>
          {getInitials(name)}
        </span>}
      {showIcon && <UserIcon className={`text-gray-400 ${styles.icon}`} aria-hidden="true" />}
    </div>;
}
interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  size?: AvatarSize;
  className?: string;
}
export function AvatarGroup({
  children,
  max = 4,
  size = 'md',
  className = ''
}: AvatarGroupProps) {
  const childArray = Children.toArray(children);
  const visibleChildren = childArray.slice(0, max);
  const remainingCount = childArray.length - max;
  return <div className={`flex -space-x-2 ${className}`}>
      {visibleChildren.map((child, index) => <div key={index} className="ring-2 ring-white rounded-full">
          {isValidElement(child) ? cloneElement(child as React.ReactElement<AvatarProps>, {
        size
      }) : child}
        </div>)}
      {remainingCount > 0 && <div className={`
            flex items-center justify-center rounded-full
            bg-gray-100 text-gray-600 font-medium ring-2 ring-white
            ${sizeStyles[size].container} ${sizeStyles[size].text}
          `}>
          +{remainingCount}
        </div>}
    </div>;
}