'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import styles from '../../quotes.module.css';

export default function QuoteRevisionPage() {
  const params = useParams();
  const rawParam = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const quoteId = rawParam ? String(rawParam).toLowerCase() : 'catering';

  return (
    <DashboardLayout breadcrumbTitle="Request Revision">
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '60px' }}>
        <Link href={`/quotes/${quoteId}/review`} className={styles.backLink}>
          <i className="bx bx-chevron-left"></i> Back to Review Quote
        </Link>

        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>Request Revision</h1>
          <p className={styles.pageSub}>Specify changes and adjustments you'd like to see in this quote.</p>
        </div>

        <div className={styles.qbCard}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 800, display: 'block', marginBottom: '8px' }}>What would you like to change?</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button type="button" className={`${styles.qbtn} ${styles.qbtnPrimary}`}>Lower price</button>
              <button type="button" className={`${styles.qbtn}`}>Change quantity</button>
              <button type="button" className={`${styles.qbtn}`}>Swap an item</button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 800, display: 'block', marginBottom: '8px' }}>Note to vendor</label>
            <textarea 
              placeholder="e.g. Can you bring the total under PKR 2,00,000 and confirm the dessert swap?"
              style={{ width: '100%', minHeight: '110px', padding: '14px', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)', background: 'var(--card)', fontFamily: 'inherit', fontSize: '13px', outline: 'none' }}
            ></textarea>
          </div>

          <div className={styles.anonNote} style={{ marginBottom: '20px' }}>
            <i className="bx bxs-shield-alt-2"></i>
            <div className={styles.anonNoteS}>
              Sent through Tayaree — you stay anonymous. The vendor replies with a revised quote.
            </div>
          </div>

          <div className={styles.qbFoot}>
            <Link href={`/quotes/${quoteId}/sent`} className={`${styles.qbtn} ${styles.qbtnPrimary}`} style={{ marginLeft: 'auto', width: '100%', justifyContent: 'center', height: '44px', fontSize: '14px' }}>
              <i className="bx bx-send"></i> Send Revision Request
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
