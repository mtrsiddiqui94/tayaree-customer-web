'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import styles from './confirmed.module.css';

interface OrderConfirmation {
  orderId: number;
  orderNumber: string;
  confirmationMessage: string;
  paymentId: number;
}

export default function OrderConfirmedPage() {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('orderConfirmed');
    if (!raw) {
      router.push('/');
      return;
    }
    const timer = setTimeout(() => {
      try {
        const parsed = JSON.parse(raw);
        setConfirmation(parsed);
      } catch {
        router.push('/');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [router]);

  if (!confirmation) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
      </div>
    );
  }

  return (
    <>
      <Header />

      <main className={styles.page}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Order Confirmed</span>
        </div>

        <div className={styles.thankyouPanel}>
          {/* Success circle */}
          <div className={styles.tyHero}>
            <div className={styles.tyCircle}>
              <i className="bx bx-check-shield"></i>
            </div>
            <div className={styles.tyHeart}>
              <i className="bx bxs-heart"></i>
            </div>
          </div>

          <h1 className={styles.tyTitle}>Thank You for Your Order!</h1>
          <p className={styles.tySub}>
            {confirmation.confirmationMessage || 'Your booking request has been successfully submitted to the vendors.'}
          </p>

          <div className={styles.tyGrid}>
            {/* Summary card */}
            <div className={styles.tyCard}>
              <h3 className={styles.tyCardTitle}>
                <i className="bx bx-receipt"></i> Booking Invoice Details
              </h3>
              <div className={styles.tyRow}>
                <span className={styles.tyRowLbl}>Order Number:</span>
                <span className={styles.tyRowVal} style={{ color: 'var(--primary)', fontWeight: 800 }}>
                  {confirmation.orderNumber || 'unset'}
                </span>
              </div>
              <div className={styles.tyDivider}></div>
              <div className={styles.tyRow}>
                <span className={styles.tyRowLbl}>Order ID:</span>
                <span className={styles.tyRowVal}>{confirmation.orderId || 'unset'}</span>
              </div>
              <div className={styles.tyDivider}></div>
              <div className={styles.tyRow}>
                <span className={styles.tyRowLbl}>Booking Date:</span>
                <span className={styles.tyRowVal}>
                  {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className={styles.tyDivider}></div>
              <div className={styles.tyRow}>
                <span className={styles.tyRowLbl}>Status:</span>
                <span className={styles.tyRowVal} style={{ color: 'var(--success)' }}>
                  <i className="bx bxs-check-circle" style={{ verticalAlign: '-1px', marginRight: '4px' }}></i>
                  Booking Placed
                </span>
              </div>
            </div>

            {/* Payment card */}
            <div className={styles.tyPayCard}>
              <span className={styles.tyPaidLbl}>Booking Payment Status</span>
              <h2 className={styles.tyPaidBig}>Pending Verification</h2>
              <span className={styles.tyPaidMethod}>
                Our system will update the installment plan dates upon vendor confirmation.
              </span>
              
              <div className={styles.tyRow} style={{ marginTop: 'auto', paddingTop: '10px' }}>
                <span className={styles.tyRowLbl}>Invoice Code:</span>
                <span className={styles.tyRowVal}>#INV-{confirmation.paymentId || 'unset'}</span>
              </div>
            </div>
          </div>

          {/* Next steps timeline */}
          <h3 className={styles.tyNextTitle}>
            <i className="bx bx-git-commit"></i> What Happens Next?
          </h3>
          <div className={styles.tySteps}>
            <div className={styles.tyStep}>
              <div className={styles.tyStepTop}>
                <div className={styles.tyStepNum}>1</div>
                <i className={`bx bx-message-check ${styles.tyStepIcon}`}></i>
              </div>
              <h4 className={styles.tyStepTitle}>Vendor Acceptance</h4>
              <p className={styles.tyStepDesc}>
                The selected vendors review the event date slots and accept your booking.
              </p>
            </div>

            <div className={styles.tyStep}>
              <div className={styles.tyStepTop}>
                <div className={styles.tyStepNum}>2</div>
                <i className={`bx bx-wallet ${styles.tyStepIcon}`}></i>
              </div>
              <h4 className={styles.tyStepTitle}>Payment Verification</h4>
              <p className={styles.tyStepDesc}>
                Our coordinator verifies your billing instructions and confirms installments.
              </p>
            </div>

            <div className={styles.tyStep}>
              <div className={styles.tyStepTop}>
                <div className={styles.tyStepNum}>3</div>
                <i className={`bx bx-calendar-star ${styles.tyStepIcon}`}></i>
              </div>
              <h4 className={styles.tyStepTitle}>Event Finalized</h4>
              <p className={styles.tyStepDesc}>
                Keep track of vendor statuses and chat messages directly in the workspace portal.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className={styles.tyActions}>
            <Link href="/" className={styles.btnTyPrimary}>
              <i className="bx bx-home-alt"></i> Return to Homepage
            </Link>
            <Link href="/orders" className={styles.btnTyOutline}>
              <i className="bx bx-list-ul"></i> View My Bookings
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
