'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import styles from './order-confirmed.module.css';

interface OrderInfo {
  orderId: number | string;
  orderNumber: string;
  confirmationMessage: string;
  paymentId?: string | number;
}

function OrderConfirmedContent() {
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [isPkgOpen, setIsPkgOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('orderConfirmed');
      if (stored) {
        setOrderInfo(JSON.parse(stored));
      } else {
        setOrderInfo({
          orderId: 'unset',
          orderNumber: 'unset',
          confirmationMessage: 'Order placed successfully!'
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  if (!orderInfo) {
    return <div className={styles.page}><p>Loading confirmation details...</p></div>;
  }

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        <span className={styles.sep}>/</span>
        <Link href="/orders">My Orders</Link>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>Order Confirmed</span>
      </nav>

      <div className={styles.thankyouPanel}>
        <div className={styles.tyHero}>
          <div className={styles.tyCircle}><i className="bx bx-shopping-bag"></i></div>
          <div className={styles.tyHeart}><i className="bx bxs-heart"></i></div>
        </div>
        <div className={styles.tyTitle}>Thanks for your order!</div>
        <div className={styles.tySub}>
          We&apos;ve started preparing your items with care.<br/>
          Your celebration is in great hands with our trusted vendors.<br/>
          {orderInfo.confirmationMessage && <strong>{orderInfo.confirmationMessage}</strong>}
        </div>

        {/* Two-column summary */}
        <div className={styles.tyGrid}>
          <div className={styles.tyCard}>
            <div className={styles.tyCardTitle}><i className="bx bx-receipt"></i>Order Summary</div>
            <div className={styles.tyRow}>
              <span className={styles.tyRowLbl}>Order Number</span>
              <span className={styles.tyRowVal} style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '.3px' }}>
                {orderInfo.orderNumber}
              </span>
            </div>
            <div className={styles.tyDivider}></div>
            <div className={styles.tyRow}>
              <span className={styles.tyRowLbl}>Order Date</span>
              <span className={styles.tyRowVal}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className={styles.tyDivider}></div>
            <div className={styles.tyRow}>
              <span className={styles.tyRowLbl}>Status</span>
              <span className={styles.tyRowVal}>Confirmed</span>
            </div>

            {/* Packages Ordered */}
            <div className={`${styles.tyPkgAcc} ${isPkgOpen ? styles.open : ''}`}>
              <button className={styles.tyPkgHead} onClick={() => setIsPkgOpen(!isPkgOpen)}>
                <span className={styles.tyPkgHeadLbl}>
                  <i className="bx bx-package"></i>Packages Ordered 
                </span>
                <i className={`bx bx-chevron-down ${styles.tyPkgChev}`}></i>
              </button>
              <div className={styles.tyPkgBody}>
                <div className={styles.tyPkgRow} style={{ padding: '15px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  Please view the &quot;My Orders&quot; tab to see your detailed packages list.
                </div>
              </div>
            </div>
          </div>

          <div className={styles.tyPayCard}>
            <div className={styles.tyPaidLbl}>Payment Method</div>
            <div className={styles.tyPaidBig}>
              {orderInfo.paymentId ? 'Card / COD' : 'Processed'}
            </div>
            <div className={styles.tyPaidMethod}>See order details for full amount</div>
            <div className={styles.tyFutureBlock}>
              <div className={styles.tyFutureLbl}>Future Payments</div>
              <div className={styles.tyFutureDue}>Any remaining balance will be due closer to the event dates.</div>
            </div>
          </div>
        </div>

        {/* Next steps */}
        <div className={styles.tyNextTitle}><i className="bx bx-list-ol"></i>What happens next</div>
        <div className={styles.tySteps}>
          <div className={styles.tyStep}>
            <div className={styles.tyStepTop}>
              <div className={styles.tyStepNum}>1</div>
              <i className={`bx bx-bell ${styles.tyStepIcon}`}></i>
            </div>
            <div className={styles.tyStepTitle}>Vendor Confirmation</div>
            <div className={styles.tyStepDesc}>Your vendors confirm availability within 24 hours. You&apos;ll get a notification once each one is confirmed.</div>
          </div>
          <div className={styles.tyStep}>
            <div className={styles.tyStepTop}>
              <div className={styles.tyStepNum}>2</div>
              <i className={`bx bx-calendar-check ${styles.tyStepIcon}`}></i>
            </div>
            <div className={styles.tyStepTitle}>Remaining Balance</div>
            <div className={styles.tyStepDesc}>Any outstanding remaining balance is automatically managed. No action needed right now.</div>
          </div>
          <div className={styles.tyStep}>
            <div className={styles.tyStepTop}>
              <div className={styles.tyStepNum}>3</div>
              <i className={`bx bx-map ${styles.tyStepIcon}`}></i>
            </div>
            <div className={styles.tyStepTitle}>Track on Event Day</div>
            <div className={styles.tyStepDesc}>Follow live delivery &amp; setup timings for every package from My Orders on your event days.</div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.tyActions}>
          <Link href="/orders" className={styles.btnTyPrimary}>
            <i className="bx bx-list-check" style={{ fontSize: '18px' }}></i> Review Recent Orders
          </Link>
          <Link href="/" className={styles.btnTyOutline}>
            <i className="bx bx-store"></i> Continue Shopping
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
      <Suspense fallback={<div className={styles.page}><p>Loading confirmation details...</p></div>}>
        <OrderConfirmedContent />
      </Suspense>
      <Footer />
    </>
  );
}
