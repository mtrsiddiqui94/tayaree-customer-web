'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import styles from './dashboard.module.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumbTitle?: string;
}

export default function DashboardLayout({ children, breadcrumbTitle = 'Dashboard' }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(pathname));
    }
  }, [mounted, isLoading, isAuthenticated, router, pathname]);

  const handleSignOut = async () => {
    await logout();
    router.push('/login');
  };

  // Helper to check active nav link
  const isActive = (path: string, exact: boolean = false) => {
    if (exact) {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const getNameForAvatar = () => {
    const name = user?.full_name || user?.name || user?.first_name;
    if (name && name.trim().length > 0) return name.trim().charAt(0).toUpperCase();
    if (user?.phone && user.phone.trim().length > 0) return user.phone.replace(/[^0-9a-zA-Z]/g, '').charAt(0).toUpperCase();
    return 'U';
  };
  const avatarLetter = getNameForAvatar();
  const hasImage = user?.image && user.image.trim().length > 0 && user.image !== 'null';

  return (
    <>
      <Header />

      <main className={styles.page}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>{breadcrumbTitle}</span>
        </div>

        {!mounted || isLoading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
            <p style={{ marginTop: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>Loading dashboard...</p>
          </div>
        ) : (
          <div className={styles.dashLayout}>
            {/* LEFT SIDEBAR PANEL */}
            <aside className={styles.sidebar}>
              <div className={styles.sidebarCard}>
                <div className={styles.userCard}>
                  <div className={styles.userAvatar} style={!hasImage ? { background: 'var(--primary)', color: '#fff', border: 'none' } : {}}>
                    {hasImage ? (
                      <img src={user.image!} alt={user?.name || 'User'} />
                    ) : (
                      <span style={{ fontSize: '36px', fontWeight: 700 }}>
                        {avatarLetter}
                      </span>
                    )}
                  </div>
                  <h3 className={styles.userName}>
                    {user?.full_name || user?.name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'unset')}
                  </h3>
                  <p className={styles.userEmail}>{user?.email || 'unset'}</p>
                  <p className={styles.userPhone}>
                    {user?.phone && user.phone !== 'unset' ? `+${user.phone_country || '92'} ${user.phone}` : 'unset'}
                  </p>
                  <div className={styles.userBadgeRow}>
                    <span className={styles.userBadge}>
                      <i className="bx bx-check-shield"></i>
                      {user?.is_verified ? 'Verified Account' : 'Standard Account'}
                    </span>
                  </div>
                </div>

                {/* Sidebar Navigation */}
                <nav className={styles.sidebarNav}>
                  
                  <div className={styles.sidebarNavLabel}>Activities</div>
                  <Link
                    href="/orders"
                    className={`${styles.sidebarNavItem} ${isActive('/orders') ? styles.sidebarNavItemActive : ''}`}
                  >
                    <i className="bx bx-receipt"></i> Orders
                  </Link>
                  <Link
                    href="/profile/deliveries"
                    className={`${styles.sidebarNavItem} ${isActive('/profile/deliveries') ? styles.sidebarNavItemActive : ''}`}
                  >
                    <i className="bx bx-package"></i> Deliveries
                  </Link>
                  <Link
                    href="/payments"
                    className={`${styles.sidebarNavItem} ${isActive('/payments') ? styles.sidebarNavItemActive : ''}`}
                  >
                    <i className="bx bx-credit-card"></i> Payments
                  </Link>
                  <Link
                    href="/quotes"
                    className={`${styles.sidebarNavItem} ${isActive('/quotes') ? styles.sidebarNavItemActive : ''}`}
                  >
                    <i className="bx bx-file-blank"></i> Quotes
                  </Link>
                  <Link
                    href="/events"
                    className={`${styles.sidebarNavItem} ${isActive('/events') ? styles.sidebarNavItemActive : ''}`}
                  >
                    <i className="bx bx-calendar"></i> Events
                  </Link>
                  <Link
                    href="/registry"
                    className={`${styles.sidebarNavItem} ${isActive('/registry') ? styles.sidebarNavItemActive : ''}`}
                  >
                    <i className="bx bx-gift"></i> Registries
                  </Link>
                  <Link
                    href="/wishlist"
                    className={`${styles.sidebarNavItem} ${isActive('/wishlist') ? styles.sidebarNavItemActive : ''}`}
                  >
                    <i className="bx bx-heart"></i> Wish List
                  </Link>
                  <Link
                    href="/notifications"
                    className={`${styles.sidebarNavItem} ${isActive('/notifications') ? styles.sidebarNavItemActive : ''}`}
                  >
                    <i className="bx bx-bell"></i> Notifications
                  </Link>

                  <div className={styles.sidebarNavLabel}>Account</div>
                  <Link
                    href="/profile/address"
                    className={`${styles.sidebarNavItem} ${isActive('/profile/address') ? styles.sidebarNavItemActive : ''}`}
                  >
                    <i className="bx bx-map"></i> Address
                  </Link>
                  <Link
                    href="/profile/payments"
                    className={`${styles.sidebarNavItem} ${isActive('/profile/payments') ? styles.sidebarNavItemActive : ''}`}
                  >
                    <i className="bx bx-wallet"></i> Payment Methods
                  </Link>
                  <Link
                    href="/referrals"
                    className={`${styles.sidebarNavItem} ${isActive('/referrals') ? styles.sidebarNavItemActive : ''}`}
                  >
                    <i className="bx bx-user-plus"></i> Invite Friends
                  </Link>
                  <Link
                    href="/profile"
                    className={`${styles.sidebarNavItem} ${isActive('/profile', true) ? styles.sidebarNavItemActive : ''}`}
                  >
                    <i className="bx bx-user"></i> Profile
                  </Link>
                  <Link
                    href="/profile/password"
                    className={`${styles.sidebarNavItem} ${isActive('/profile/password') ? styles.sidebarNavItemActive : ''}`}
                  >
                    <i className="bx bx-lock"></i> Password
                  </Link>
                  <Link
                    href="/profile/phone"
                    className={`${styles.sidebarNavItem} ${isActive('/profile/phone') ? styles.sidebarNavItemActive : ''}`}
                  >
                    <i className="bx bx-phone"></i> Phone
                  </Link>

                  <div className={styles.sidebarNavLabel}>Support</div>
                  <Link
                    href="/chat"
                    className={`${styles.sidebarNavItem} ${isActive('/chat') ? styles.sidebarNavItemActive : ''}`}
                  >
                    <i className="bx bx-headphone"></i> Customer Service
                  </Link>
                  <Link
                    href="/privacy"
                    className={`${styles.sidebarNavItem} ${isActive('/privacy') ? styles.sidebarNavItemActive : ''}`}
                  >
                    <i className="bx bx-shield"></i> Privacy Policy
                  </Link>
                  
                  <button onClick={handleSignOut} className={styles.sidebarNavItem} style={{ color: 'var(--primary)', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <i className="bx bx-log-out"></i> Sign Out
                  </button>

                </nav>
              </div>
            </aside>

            {/* RIGHT MAIN WORKSPACE CONTENT */}
            <section className={styles.mainContent}>
              {children}
            </section>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
