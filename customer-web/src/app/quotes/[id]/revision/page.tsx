'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import styles from '../../quotes.module.css';

export default function QuoteRevisionPage() {
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
          <Link href={`/quotes/${quoteId}/review`}>Review Quote</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Request Revision</span>
        </div>

        <div className={styles.dashLayout}>
          <div className={styles.dashContent} style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Link href={`/quotes/${quoteId}/review`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '16px' }}>
              <i className='bx bx-chevron-left'></i>Back to Review
            </Link>

            <div className={styles.pageHead}>
              <h1 className={styles.pageTitle}>Request Revision</h1>
              <p className={styles.pageSub}>Specify changes and adjustments you'd like to see in this quote.</p>
            </div>

            <div className={styles.qbCard}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>What would you like to change?</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button className={`${styles.qbtn}`}>Lower price</button>
                  <button className={`${styles.qbtn}`}>Change quantity</button>
                  <button className={`${styles.qbtn}`}>Swap an item</button>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Note to vendor</label>
                <textarea 
                  className={styles.textareaField} 
                  placeholder="e.g. Can you bring the total under PKR 2,00,000 and confirm the dessert swap?"
                  style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)', background: 'var(--input-bg)' }}
                ></textarea>
              </div>

              <div className={styles.anonNote} style={{ marginBottom: '20px', padding: '12px', background: 'rgba(26, 107, 181, 0.05)', borderRadius: 'var(--radius-m)' }}>
                <i className="bx bxs-shield-alt-2" style={{ color: 'var(--info)', fontSize: '18px' }}></i>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Sent through Tayaree — you stay anonymous. The vendor replies with a revised quote.
                </div>
              </div>

              <div className={styles.qbFoot}>
                <Link href={`/quotes/${quoteId}/sent`} className={`${styles.qbtn} ${styles.qbtnPrimary}`} style={{ marginLeft: 'auto', width: '100%', justifyContent: 'center', height: '48px', fontSize: '14px' }}>
                  <i className="bx bx-send"></i> Send Revision Request
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
