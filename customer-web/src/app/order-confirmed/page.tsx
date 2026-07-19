'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import styles from './order-confirmed.module.css';

function OrderConfirmedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id') || '#TY-89240';
  const total = searchParams.get('total') || '114,750';

  const formatPrice = (val: string | number | undefined | null) => {
    if (val === undefined || val === null || val === '') return 'unset';
    const valStr = val.toString().trim();
    if (valStr === 'unset') return valStr;
    let formatted = valStr.replace(/\b\d+\b/g, (match: string) => {
      const num = parseInt(match, 10);
      return num.toLocaleString('en-US');
    });
    if (!formatted.includes('PKR')) {
      formatted = `PKR ${formatted}`;
    }
    return formatted;
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.successIcon}>
          <i className="bx bx-check-circle"></i>
        </div>

        <h1 className={styles.title}>Order Confirmed!</h1>
        <p className={styles.subtitle}>
          Thank you for your order. We have sent a confirmation email with all details.
        </p>

        <div className={styles.detailsBlock}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Order ID</span>
            <span className={styles.detailVal}>{orderId}</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Delivery Date</span>
            <span className={styles.detailVal}>Saturday, March 15, 2025</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Payment Method</span>
            <span className={styles.detailVal}>Visa ending in 1234</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Amount Paid</span>
            <span className={`${styles.detailVal} ${styles.detailValHighlight}`}>
              {formatPrice(total)}
            </span>
          </div>
        </div>

        <div className={styles.btnGroup}>
          <Link href="/orders" className={styles.primaryBtn}>
            Track My Order
          </Link>
          <Link href="/" className={styles.secondaryBtn}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmedPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <div className={styles.page}>
          <p>Loading confirmation details...</p>
        </div>
      }>
        <OrderConfirmedContent />
      </Suspense>
      <Footer />
    </>
  );
}
