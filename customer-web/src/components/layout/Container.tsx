import React from 'react';
import styles from './Container.module.css';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Container({ children, className = '', style }: ContainerProps) {
  return (
    <div className={`${styles.container} ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export function TwoColumnLayout({ children, className = '', style }: ContainerProps) {
  return (
    <div className={`${styles.twoColumnLayout} ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
