'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import styles from './page.module.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <DashboardLayout breadcrumbTitle="Dashboard">
      <div className={styles.statsStrip}>
        <div className={styles.statCard}>
          <div className={styles.statVal} style={{ color: 'var(--primary)' }}>12</div>
          <div className={styles.statLbl}>Total Orders</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal} style={{ color: 'var(--success)' }}>PKR 1,500</div>
          <div className={styles.statLbl}>Referral Earnings</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal} style={{ color: 'var(--warning)' }}>3</div>
          <div className={styles.statLbl}>Active Events</div>
        </div>
      </div>

      <div className={styles.sectionLbl}>Your Activities</div>
      <div className={styles.tileGrid}>
        <Link href="/orders" className={styles.gridTile}>
          <div className={styles.gridTileIcon}><i className="bx bx-shopping-bag"></i></div>
          <span className={styles.gridTileLabel}>Orders</span>
        </Link>
        <Link href="/profile/deliveries" className={styles.gridTile}>
          <div className={styles.gridTileIcon}><i className="bx bx-truck"></i></div>
          <span className={styles.gridTileLabel}>Deliveries</span>
        </Link>
        <Link href="/profile/payments" className={styles.gridTile}>
          <div className={styles.gridTileIcon}><i className="bx bx-credit-card"></i></div>
          <span className={styles.gridTileLabel}>Payments</span>
        </Link>
        <Link href="/quotes" className={styles.gridTile}>
          <div className={styles.gridTileIcon}><i className="bx bx-file-blank"></i></div>
          <span className={styles.gridTileLabel}>Quotes</span>
        </Link>
        <Link href="/events" className={styles.gridTile}>
          <div className={styles.gridTileIcon}><i className="bx bx-calendar"></i></div>
          <span className={styles.gridTileLabel}>Events</span>
        </Link>
        <Link href="/registry" className={styles.gridTile}>
          <div className={styles.gridTileIcon}><i className="bx bx-gift"></i></div>
          <span className={styles.gridTileLabel}>Registries</span>
        </Link>
        <Link href="/wishlist" className={styles.gridTile}>
          <div className={styles.gridTileIcon}><i className="bx bx-heart"></i></div>
          <span className={styles.gridTileLabel}>Wish List</span>
        </Link>
        <Link href="/notifications" className={styles.gridTile}>
          <div className={styles.gridTileIcon}><i className="bx bx-bell"></i></div>
          <span className={styles.gridTileLabel}>Notifications</span>
        </Link>
      </div>

      <div className={styles.sectionLbl}>Your Information</div>
      <div className={styles.tileGrid}>
        <Link href="/profile/address" className={styles.gridTile}>
          <div className={styles.gridTileIcon}><i className="bx bx-map"></i></div>
          <span className={styles.gridTileLabel}>Address</span>
        </Link>
        <Link href="/profile/payments" className={styles.gridTile}>
          <div className={styles.gridTileIcon}><i className="bx bx-wallet"></i></div>
          <span className={styles.gridTileLabel}>Methods</span>
        </Link>
        <Link href="/invite" className={styles.gridTile}>
          <div className={styles.gridTileIcon}><i className="bx bx-user-plus"></i></div>
          <span className={styles.gridTileLabel}>Invite</span>
        </Link>
        <Link href="/profile" className={styles.gridTile}>
          <div className={styles.gridTileIcon}><i className="bx bx-user"></i></div>
          <span className={styles.gridTileLabel}>Profile</span>
        </Link>
        <Link href="/profile/password" className={styles.gridTile}>
          <div className={styles.gridTileIcon}><i className="bx bx-lock"></i></div>
          <span className={styles.gridTileLabel}>Password</span>
        </Link>
        <Link href="/profile/phone" className={styles.gridTile}>
          <div className={styles.gridTileIcon}><i className="bx bx-phone"></i></div>
          <span className={styles.gridTileLabel}>Phone</span>
        </Link>
      </div>

      <div className={styles.actionList}>
        <Link href="/chat" className={styles.actionRow}>
          <div className={styles.actionRowIcon}><i className="bx bx-headphone"></i></div>
          <div className={styles.actionRowBody}>
            <div className={styles.actionRowLabel}>Customer Service</div>
            <div className={styles.actionRowDesc}>Chat with our support team</div>
          </div>
          <i className={`bx bx-chevron-right ${styles.actionChevron}`}></i>
        </Link>
        <Link href="/privacy" className={styles.actionRow}>
          <div className={styles.actionRowIcon}><i className="bx bx-shield"></i></div>
          <div className={styles.actionRowBody}>
            <div className={styles.actionRowLabel}>Privacy Policy</div>
            <div className={styles.actionRowDesc}>Review how we use your data</div>
          </div>
          <i className={`bx bx-chevron-right ${styles.actionChevron}`}></i>
        </Link>
      </div>
    </DashboardLayout>
  );
}
