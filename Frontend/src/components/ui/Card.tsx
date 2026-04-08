import React, { Component } from 'react';
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  onClick?: () => void;
}
const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
};
export function Card({
  children,
  className = '',
  padding = 'md',
  hoverable = false,
  onClick
}: CardProps) {
  const isClickable = hoverable || onClick;
  return <div className={`
        bg-white rounded-xl border border-gray-100 shadow-card
        ${isClickable ? 'cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:border-primary/20 hover:scale-[1.01]' : ''}
        ${paddingStyles[padding]}
        ${className}
      `} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}>
      {children}
    </div>;
}
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}
export function CardHeader({
  children,
  className = ''
}: CardHeaderProps) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}
interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}
export function CardTitle({
  children,
  className = '',
  as: Component = 'h3'
}: CardTitleProps) {
  return <Component className={`font-heading font-semibold text-gray-900 ${className}`}>
      {children}
    </Component>;
}
interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}
export function CardDescription({
  children,
  className = ''
}: CardDescriptionProps) {
  return <p className={`text-sm text-gray-500 mt-1 ${className}`}>{children}</p>;
}
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}
export function CardContent({
  children,
  className = ''
}: CardContentProps) {
  return <div className={className}>{children}</div>;
}
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}
export function CardFooter({
  children,
  className = ''
}: CardFooterProps) {
  return <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`}>
      {children}
    </div>;
}