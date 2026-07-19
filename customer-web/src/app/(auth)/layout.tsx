'use client';

import React from 'react';
import Link from 'next/link';
import styles from './auth.module.css';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
