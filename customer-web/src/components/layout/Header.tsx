'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';
import styles from './Header.module.css';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch notification unread count
      async function fetchNotificationCount() {
        try {
          const result = await api.get<{ data: { count: number } }>(ENDPOINTS.NOTIFICATION_UNREAD_COUNT);
          setNotificationCount(result?.data?.count ?? 0);
        } catch {
          // Non-critical, ignore
        }
      }
      fetchNotificationCount();
    }
  }, [isAuthenticated, pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Get avatar letter from user profile or phone
  const avatarLetter = user?.first_name
    ? user.first_name.charAt(0).toUpperCase()
    : user?.phone
      ? user.phone.replace('+', '').charAt(0)
      : 'U';

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
          {isAuthenticated && (
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
                  pathname === '/deals' || pathname.startsWith('/deals/') ? styles.navLinkActive : ''
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

          {isAuthenticated ? (
            <>
              <Link href="/wishlist" className={styles.iconBtn} title="Wishlist">
                <i className="bx bx-heart"></i>
              </Link>
              <Link
                href="/notifications"
                className={styles.iconBtn}
                title="Notifications"
              >
                <i className="bx bx-bell"></i>
                {notificationCount > 0 && (
                  <span className={styles.iconBadge}>{notificationCount}</span>
                )}
              </Link>
              <Link href="/cart" className={styles.iconBtn} title="Cart">
                <i className="bx bx-cart"></i>
                {cartCount > 0 && (
                  <span className={styles.iconBadge}>{cartCount}</span>
                )}
              </Link>
              <Link href="/chat" className={styles.iconBtn} title="Messages">
                <i className="bx bx-message-square-detail"></i>
              </Link>
              <Link href="/profile" className={styles.avatarBtn} title="Profile">
                {user?.image ? (
                  <img src={user.image} alt={user.first_name || 'Profile'} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  avatarLetter
                )}
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

