'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { formatPrice } from '@/lib/formatPrice';
import styles from './page.module.css';

export default function OrderCancelledPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string || '';

  const [isPkgOpen, setIsPkgOpen] = useState(false);
  const [cancelDetails, setCancelDetails] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem('temp_cancel_details');
    if (data) {
      try {
        setCancelDetails(JSON.parse(data));
      } catch(e){}
    }
  }, []);

  const toggleTyPkg = () => {
    setIsPkgOpen(!isPkgOpen);
  };

  const refundTotal = cancelDetails?.refundTotal || 0;
  const reason = cancelDetails?.reason || 'Event date changed';
  const cancelledPackages = cancelDetails?.cancelledPackages || [];

  return (
    <>
      <Header />

      <main className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <Link href="/orders">My Orders</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Order Cancelled</span>
        </div>

        <div className={styles.thankyouPanel}>
          <div className={styles.tyHero}>
            <div className={styles.tyCircle}>
              <i className="bx bx-calendar-x"></i>
            </div>
          </div>
          <div className={styles.tyTitle}>Your cancellation is confirmed</div>
          <div className={styles.tySub}>
            We&apos;re sorry to see your plans change — sometimes they do.<br />
            Your refund is on its way, and your event is always welcome back with us.
          </div>

          <div className={styles.tyGrid}>
            <div className={styles.tyCard}>
              <div className={styles.tyCardTitle}>
                <i className="bx bx-receipt"></i>Cancellation Summary
              </div>
              <div className={styles.tyRow}>
                <span className={styles.tyRowLbl}>Order Number</span>
                <span className={styles.tyRowVal} style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '.3px' }}>
                  #{orderId}
                </span>
              </div>
              <div className={styles.tyDivider}></div>
              <div className={styles.tyRow}>
                <span className={styles.tyRowLbl}>Cancelled On</span>
                <span className={styles.tyRowVal}>
                  {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className={styles.tyDivider}></div>
              <div className={styles.tyRow}>
                <span className={styles.tyRowLbl}>Reason</span>
                <span className={styles.tyRowVal}>{reason}</span>
              </div>
              <div className={styles.tyDivider}></div>
              <div className={styles.tyRow}>
                <span className={styles.tyRowLbl}>Total Refund</span>
                <span className={styles.tyRowVal} style={{ color: 'var(--success)' }}>
                  PKR {formatPrice(refundTotal)}
                </span>
              </div>

              <div className={`${styles.tyPkgAcc} ${isPkgOpen ? styles.open : ''}`}>
                <button className={styles.tyPkgHead} onClick={toggleTyPkg}>
                  <span className={styles.tyPkgHeadLbl}>
                    <i className="bx bx-package"></i>Cancelled Packages <span className={styles.tyPkgCount}>{cancelledPackages.length}</span>
                  </span>
                  <i className={`bx bx-chevron-down ${styles.tyPkgChev}`}></i>
                </button>
                <div className={styles.tyPkgBody}>
                  {cancelledPackages.map((pkg: any, i: number) => (
                    <div className={styles.tyPkgRow} key={i}>
                      <img className={styles.sdbImg} src={pkg.img || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=100&h=100&q=80'} alt={pkg.name} />
                      <div className={styles.sdbInfo}>
                        <div className={styles.sdbName}>{pkg.name}</div>
                        <div className={styles.sdbPkg}>{pkg.vendor} · refund after fee</div>
                      </div>
                      <div className={styles.sdbPrice}>PKR {formatPrice(pkg.amount * 0.27)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.tyPayCard}>
              <div className={styles.tyPaidLbl}><i className="bx bx-check-circle"></i>Refund Initiated</div>
              <div className={styles.tyPaidBig}>PKR {formatPrice(refundTotal)}</div>
              <div className={styles.tyPaidMethod}>To original payment method</div>
              <div className={styles.tyFutureBlock}>
                <div className={styles.tyFutureLbl}><i className="bx bx-time-five"></i>Expected in 3–5 business days</div>
                <div className={styles.tyFutureDue}>
                  A cancellation fee (10%) was deducted as per policy. You&apos;ll get a notification once the refund settles.
                </div>
              </div>
            </div>
          </div>

          <div className={styles.tyNextTitle}><i className="bx bx-list-ol"></i>What happens next</div>
          <div className={styles.tySteps}>
            <div className={styles.tyStep}>
              <div className={styles.tyStepTop}>
                <div className={styles.tyStepNum}>1</div>
                <i className="bx bx-wallet ${styles.tyStepIcon}"></i>
              </div>
              <div className={styles.tyStepTitle}>Refund Processing</div>
              <div className={styles.tyStepDesc}>
                PKR {formatPrice(refundTotal)} is being returned to your payment method. It typically lands within 3–5 business days.
              </div>
            </div>
            <div className={styles.tyStep}>
              <div className={styles.tyStepTop}>
                <div className={styles.tyStepNum}>2</div>
                <i className={`bx bx-bell ${styles.tyStepIcon}`}></i>
              </div>
              <div className={styles.tyStepTitle}>Vendors Notified</div>
              <div className={styles.tyStepDesc}>
                Vendors have been informed and have released your booking slots.
              </div>
            </div>
            <div className={styles.tyStep}>
              <div className={styles.tyStepTop}>
                <div className={styles.tyStepNum}>3</div>
                <i className={`bx bx-heart ${styles.tyStepIcon}`}></i>
              </div>
              <div className={styles.tyStepTitle}>Rebook Anytime</div>
              <div className={styles.tyStepDesc}>
                When your new date is set, these vendors are just a tap away. Your other packages remain active.
              </div>
            </div>
          </div>

          <div className={styles.tyActions}>
            <Link href="/orders" className={styles.btnTyPrimary}>
              <i className="bx bx-list-check" style={{ fontSize: '18px' }}></i> Back to My Orders
            </Link>
            <Link href="/" className={styles.btnTyOutline}>
              <i className="bx bx-store"></i> Continue Shopping
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
