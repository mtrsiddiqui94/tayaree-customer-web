'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import styles from '../../quotes.module.css';

export default function QuoteAcceptPage() {
  const params = useParams();
  const quoteId = params.id;

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <Link href="/quotes">Quotes</Link>
          <span className={styles.sep}>/</span>
          <Link href={`/quotes/${quoteId}`}>Package Details</Link>
          <span className={styles.sep}>/</span>
          <Link href={`/quotes/${quoteId}/review`}>Review Quote</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Accept Quote</span>
        </div>

        <div className={styles.dashLayout}>
          <div className={styles.dashContent} style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className={styles.pageHead}>
              <h1 className={styles.pageTitle}>Accept &amp; Finalize Quote</h1>
              <p className={styles.pageSub}>Confirm your details to lock in this price and reveal the vendor.</p>
            </div>

            <div className={styles.qbCard}>
              <div className={styles.qbLabelRow}>
                <div className={styles.qbAv}>
                  <i className="bx bx-check-circle"></i>
                </div>
                <div className={styles.qbLabel}>Quote Overview</div>
              </div>
              
              <div className={styles.qbPrice}>
                <div className={styles.qbPriceMain}>
                  <span className={styles.qbPriceLbl}>Agreed Price</span>
                  <span className={styles.qbPriceAmt}>PKR 2,10,000</span>
                </div>
              </div>

              <div style={{ marginTop: '20px', padding: '16px', background: 'var(--surface)', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>Payment Schedule</h3>
                <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: 1.6 }}>
                  <li>25% Due now to confirm booking (PKR 52,500)</li>
                  <li>50% Due 7 days before event</li>
                  <li>25% Due on event day</li>
                </ul>
              </div>

              <div className={styles.qbFoot}>
                <Link href={`/quotes/${quoteId}/review`} className={styles.qbtn}>
                  Go Back
                </Link>
                <Link href={`/quotes/${quoteId}/accepted`} className={`${styles.qbtn} ${styles.qbtnPrimary}`} style={{ marginLeft: 'auto' }}>
                  <i className="bx bx-lock-alt"></i> Confirm Acceptance
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
