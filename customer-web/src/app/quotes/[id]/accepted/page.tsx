'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import styles from '../../quotes.module.css';

export default function QuoteAcceptedPage() {
  return (
    <DashboardLayout breadcrumbTitle="Quote Accepted">
      <div style={{ maxWidth: '600px', margin: '30px auto 60px' }}>
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--card)', borderRadius: 'var(--radius-l)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(26,122,54,0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', margin: '0 auto 20px' }}>
            <i className="bx bx-check"></i>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '10px' }}>Quote Accepted!</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
            You have successfully accepted the quote. The vendor's identity is now revealed.
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--surface)', padding: '16px', borderRadius: 'var(--radius-m)', textAlign: 'left', marginBottom: '24px', border: '1px solid var(--border)' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-s)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              <i className="bx bx-store"></i>
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Royal Dastarkhwan</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Catering · 4.9★ (Tayaree Verified Vendor)</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/quotes" className={styles.qbtn}>
              Go to Quotes
            </Link>
            <Link href="/checkout" className={`${styles.qbtn} ${styles.qbtnPrimary}`}>
              <i className="bx bx-cart"></i> Pay Booking Deposit
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
