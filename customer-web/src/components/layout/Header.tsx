'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import styles from './Header.module.css';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [avatarLetter, setAvatarLetter] = useState('U');

  useEffect(() => {
    // Check if token exists in localStorage (client-side only)
    const token = localStorage.getItem('access_token');
    const phone = localStorage.getItem('phone') || '';
    setIsLoggedIn(!!token);

    if (token) {
      // Set avatar letter to first char of phone (or name if we had it, fallback to 'U')
      const cleanPhone = phone.replace('+', '');
      setAvatarLetter(cleanPhone ? cleanPhone.charAt(0) : 'U');
    }
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        {/* LOGO */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoMark}>T</div>
          <span className={styles.logoName}>Tayaree</span>
        </Link>

        {/* SEARCH BAR */}
        <form onSubmit={handleSearchSubmit} className={styles.headerSearch}>
          <i className="bx bx-search"></i>
          <input
            type="text"
            placeholder="Search caterers, venues, decorators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* NAVIGATION */}
        <nav className={styles.headerNav}>
          <Link
            href="/"
            className={`${styles.navLink} ${
              pathname === '/' ? styles.navLinkActive : ''
            }`}
          >
            Home
          </Link>
          {isLoggedIn && (
            <>
              <Link
                href="/services"
                className={`${styles.navLink} ${
                  pathname.startsWith('/services') ? styles.navLinkActive : ''
                }`}
              >
                Packages
              </Link>
              <Link
                href="/deals"
                className={`${styles.navLink} ${
                  pathname === '/deals' ? styles.navLinkActive : ''
                }`}
              >
                Deals
              </Link>
              <Link
                href="/events"
                className={`${styles.navLink} ${
                  pathname.startsWith('/events') ? styles.navLinkActive : ''
                }`}
              >
                Events
              </Link>
              <Link
                href="/quotes"
                className={`${styles.navLink} ${
                  pathname.startsWith('/quotes') ? styles.navLinkActive : ''
                }`}
              >
                Quotes
              </Link>
              <Link
                href="/registry"
                className={`${styles.navLink} ${
                  pathname.startsWith('/registry') ? styles.navLinkActive : ''
                }`}
              >
                Registry
              </Link>
              <Link
                href="/orders"
                className={`${styles.navLink} ${
                  pathname.startsWith('/orders') ? styles.navLinkActive : ''
                }`}
              >
                My Orders
              </Link>
            </>
          )}
        </nav>

        {/* ACTIONS */}
        <div className={styles.headerActions}>
          <Link href="/mobile-app" className={styles.mobileLink}>
            <i className="bx bx-mobile-alt"></i>
            <span>Get App</span>
          </Link>

          {isLoggedIn ? (
            <>
              <Link href="/wishlist" className={styles.iconBtn} title="Wishlist">
                <i className="bx bx-heart"></i>
                <span className={styles.iconBadge}>2</span>
              </Link>
              <Link
                href="/notifications"
                className={styles.iconBtn}
                title="Notifications"
              >
                <i className="bx bx-bell"></i>
                <span className={styles.iconBadge}>5</span>
              </Link>
              <Link href="/cart" className={styles.iconBtn} title="Cart">
                <i className="bx bx-cart"></i>
              </Link>
              <Link href="/chat" className={styles.iconBtn} title="Messages">
                <i className="bx bx-message-square-detail"></i>
              </Link>
              <Link href="/profile" className={styles.avatarBtn} title="Profile">
                {avatarLetter}
              </Link>
            </>
          ) : (
            <Link href="/login" className={styles.signInBtn}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
