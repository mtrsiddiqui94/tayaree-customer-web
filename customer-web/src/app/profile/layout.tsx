'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from './profile.module.css';

interface Profile {
  fullName: string;
  email: string;
  phone: string;
  phoneCountry: string;
  imageUrl: string;
  isEmailVerified: boolean;
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=' + encodeURIComponent(pathname));
      return;
    }

    async function loadProfile() {
      try {
        setIsLoading(true);
        const res = await api.get<{ status: boolean; data: any }>('/api/v1/profile/me');
        if (res.status && res.data) {
          const raw = res.data;
          setProfile({
            fullName: raw.full_name || 'unset',
            email: raw.email || 'unset',
            phone: raw.phone || 'unset',
            phoneCountry: raw.phone_country || 'PK',
            imageUrl: raw.image_url || '',
            isEmailVerified: raw.is_email_verified === 1 || raw.isEmailVerified === true,
          });
        }
      } catch (e) {
        console.error('Error fetching profile in layout:', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [pathname]);

  const handleSignOut = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('phone');
    router.push('/login');
  };

  // Helper to check active nav link
  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <>
      <Header />

      <main className={styles.page}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>My Dashboard</span>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
            <p style={{ marginTop: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>Loading dashboard...</p>
          </div>
        ) : (
          <div className={styles.dashLayout}>
            {/* LEFT SIDEBAR PANEL */}
            <aside className={styles.sidebar}>
              <div className={styles.userCard}>
                <div className={styles.userAvatar}>
                  {profile?.imageUrl ? (
                    <img src={profile.imageUrl} alt={profile.fullName} />
                  ) : (
                    <i className="bx bx-user"></i>
                  )}
                </div>
                <h3 className={styles.userName}>{profile?.fullName || 'unset'}</h3>
                <p className={styles.userEmail}>{profile?.email || 'unset'}</p>
                <p className={styles.userPhone}>
                  {profile?.phone && profile.phone !== 'unset' ? `+92 ${profile.phone}` : 'unset'}
                </p>
                <div className={styles.userBadgeRow}>
                  <span className={styles.userBadge}>
                    <i className="bx bx-check-shield"></i>
                    {profile?.isEmailVerified ? 'Verified Account' : 'Standard Account'}
                  </span>
                </div>
                <button onClick={handleSignOut} className={styles.logoutBtn}>
                  <i className="bx bx-log-out"></i> Sign Out
                </button>
              </div>

              {/* Sidebar Navigation */}
              <div className={styles.sidebarNav}>
                <div style={{ padding: '8px 16px 2px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Settings
                </div>
                <Link
                  href="/profile"
                  className={`${styles.sidebarNavItem} ${isActive('/profile') ? styles.sidebarNavItemActive : ''}`}
                >
                  <i className="bx bx-cog"></i> Profile Settings
                  <i className={`bx bx-chevron-right ${styles.chev}`}></i>
                </Link>
                <Link
                  href="/profile/address"
                  className={`${styles.sidebarNavItem} ${isActive('/profile/address') ? styles.sidebarNavItemActive : ''}`}
                >
                  <i className="bx bx-map"></i> My Addresses
                  <i className={`bx bx-chevron-right ${styles.chev}`}></i>
                </Link>
                <Link
                  href="/profile/password"
                  className={`${styles.sidebarNavItem} ${isActive('/profile/password') ? styles.sidebarNavItemActive : ''}`}
                >
                  <i className="bx bx-lock-alt"></i> Change Password
                  <i className={`bx bx-chevron-right ${styles.chev}`}></i>
                </Link>
                <Link
                  href="/profile/phone"
                  className={`${styles.sidebarNavItem} ${isActive('/profile/phone') ? styles.sidebarNavItemActive : ''}`}
                >
                  <i className="bx bx-phone"></i> Phone Number
                  <i className={`bx bx-chevron-right ${styles.chev}`}></i>
                </Link>
                
                <div style={{ padding: '14px 16px 2px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Event Planner
                </div>
                <Link href="/events" className={styles.sidebarNavItem}>
                  <i className="bx bx-calendar"></i> My Events
                  <i className={`bx bx-chevron-right ${styles.chev}`}></i>
                </Link>
                <Link href="/registry" className={styles.sidebarNavItem}>
                  <i className="bx bx-gift"></i> Gift Registry
                  <i className={`bx bx-chevron-right ${styles.chev}`}></i>
                </Link>

                 <div style={{ padding: '14px 16px 2px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Bookings
                </div>
                <Link href="/orders" className={styles.sidebarNavItem}>
                  <i className="bx bx-package"></i> My Orders
                  <i className={`bx bx-chevron-right ${styles.chev}`}></i>
                </Link>
                <Link
                  href="/profile/deliveries"
                  className={`${styles.sidebarNavItem} ${isActive('/profile/deliveries') ? styles.sidebarNavItemActive : ''}`}
                >
                  <i className="bx bx-package"></i> My Deliveries
                  <i className={`bx bx-chevron-right ${styles.chev}`}></i>
                </Link>
                <Link href="/quotes" className={styles.sidebarNavItem}>
                  <i className="bx bx-receipt"></i> My Quotes
                  <i className={`bx bx-chevron-right ${styles.chev}`}></i>
                </Link>
                <Link
                  href="/profile/payments"
                  className={`${styles.sidebarNavItem} ${isActive('/profile/payments') ? styles.sidebarNavItemActive : ''}`}
                >
                  <i className="bx bx-credit-card"></i> Payments History
                  <i className={`bx bx-chevron-right ${styles.chev}`}></i>
                </Link>
                <Link href="/chat" className={styles.sidebarNavItem}>
                  <i className="bx bx-message-square-detail"></i> Inbox Messages
                  <i className={`bx bx-chevron-right ${styles.chev}`}></i>
                </Link>
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
