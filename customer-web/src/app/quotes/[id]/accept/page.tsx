'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import styles from '../../quotes.module.css';

const CATEGORY_PRICES: Record<string, { total: string; deposit: string }> = {
  catering: { total: 'PKR 2,10,000', deposit: 'PKR 52,500' },
  venue: { total: 'PKR 2,50,000', deposit: 'PKR 62,500' },
  decor: { total: 'PKR 98,000', deposit: 'PKR 24,500' },
  photo: { total: 'PKR 90,000', deposit: 'PKR 22,500' },
  beauty: { total: 'PKR 55,000', deposit: 'PKR 13,750' },
  clothing: { total: 'PKR 1,80,000', deposit: 'PKR 45,000' }
};

export default function QuoteAcceptPage() {
  const params = useParams();
  const rawParam = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const quoteId = rawParam ? String(rawParam).toLowerCase() : 'catering';
  const priceInfo = CATEGORY_PRICES[quoteId] || CATEGORY_PRICES.catering;

  function handleAccept() {
    try {
      const stored = JSON.parse(localStorage.getItem('accepted_quotes') || '[]');
      if (Array.isArray(stored) && !stored.includes(quoteId)) {
        stored.push(quoteId);
        localStorage.setItem('accepted_quotes', JSON.stringify(stored));
      }
    } catch (e) {}
  }

  return (
    <DashboardLayout breadcrumbTitle="Accept Quote">
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '60px' }}>
        <Link href={`/quotes/${quoteId}/review`} className={styles.backLink}>
          <i className="bx bx-chevron-left"></i> Back to Review Quote
        </Link>

        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>Accept &amp; Finalize Quote</h1>
          <p className={styles.pageSub}>Confirm your details to lock in this price and reveal the vendor.</p>
        </div>

        <div className={styles.qbCard}>
          <div className={styles.qbTag}>Order Overview</div>
          <div className={styles.qbLabelRow}>
            <div className={styles.qbAv}>
              <i className="bx bx-check-circle"></i>
            </div>
            <div>
              <div className={styles.qbLabel}>Quote Terms &amp; Confirmation</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Ref: #ACCEPT-{quoteId.toUpperCase()}-2026
              </div>
            </div>
          </div>
          
          <div className={styles.qbPrice}>
            <div className={styles.qbPriceMain}>
              <span className={styles.qbPriceLbl}>Agreed Total Price</span>
              <span className={styles.qbPriceAmt}>{priceInfo.total}</span>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '16px', background: 'var(--surface)', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '8px' }}>Payment Schedule</h3>
            <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: 1.8 }}>
              <li><b>25% Deposit:</b> {priceInfo.deposit} due now to confirm booking</li>
              <li><b>50% Milestone:</b> Due 7 days before event</li>
              <li><b>25% Final Settlement:</b> Due on event day</li>
            </ul>
          </div>

          <div className={styles.qbFoot}>
            <Link href={`/quotes/${quoteId}/review`} className={styles.qbtn}>
              Go Back
            </Link>
            <Link 
              href={`/quotes/${quoteId}/accepted`} 
              onClick={handleAccept} 
              className={`${styles.qbtn} ${styles.qbtnPrimary}`} 
              style={{ marginLeft: 'auto' }}
            >
              <i className="bx bx-lock-alt"></i> Confirm Acceptance
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
