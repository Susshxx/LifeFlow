import React, { useEffect, useRef } from 'react';
import { XIcon } from 'lucide-react';
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}
const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl'
};
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined} aria-describedby={description ? 'modal-description' : undefined}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div ref={modalRef} tabIndex={-1} className={`
          relative w-full ${sizeStyles[size]}
          bg-white rounded-2xl shadow-xl
          animate-scale-in
          max-h-[90vh] overflow-hidden flex flex-col
        `}>
        {/* Header */}
        {(title || showCloseButton) && <div className="flex items-start justify-between p-6 border-b border-gray-100">
            <div>
              {title && <h2 id="modal-title" className="text-xl font-heading font-semibold text-gray-900">
                  {title}
                </h2>}
              {description && <p id="modal-description" className="mt-1 text-sm text-gray-500">
                  {description}
                </p>}
            </div>
            {showCloseButton && <button onClick={onClose} className="p-2 -m-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100" aria-label="Close modal">
                <XIcon className="w-5 h-5" />
              </button>}
          </div>}

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>;
}