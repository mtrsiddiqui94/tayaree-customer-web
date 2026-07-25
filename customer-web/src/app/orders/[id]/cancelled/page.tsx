'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Container } from '@/components/layout/Container';
import styles from './cancelled.module.css';

interface CancelledPackage {
  name: string;
  vendor?: string;
  img?: string;
  refund?: number;
}

export default function OrderCancelledPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const orderId = unwrappedParams.id;

  const [isPkgOpen, setIsPkgOpen] = useState(true);

  const [cancelInfo, setCancelInfo] = useState({
    orderNumber: `#TAY-${orderId}`,
    cancelDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    refundReference: `#RF-${orderId}-9432`,
    paymentMethod: 'Visa ending in •••• 6411',
    refundTotal: 'PKR 94,432',
    cancelledPackages: [] as CancelledPackage[],
  });

  const formatAmount = (num: number) => `PKR ${num.toLocaleString('en-US')}`;

  useEffect(() => {
    try {
      const stored = localStorage.getItem('confirmed_cancellation');
      if (stored) {
        const parsed = JSON.parse(stored);
          const rawOrd = parsed.orderNumber || orderId;
          const formattedOrd = String(rawOrd).startsWith('#')
            ? String(rawOrd)
            : (String(rawOrd).includes('-') ? `#${rawOrd}` : `#SXE-224-${String(rawOrd).padStart(6, '0')}`);
          setCancelInfo({
            orderNumber: formattedOrd,
            cancelDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            refundReference: parsed.refundReference || `#RF-${orderId}-9432`,
            paymentMethod: parsed.paymentMethod || 'Visa ending in •••• 6411',
            refundTotal: formatAmount(parsed.refundTotal || 0),
            cancelledPackages: parsed.cancelledPackages || [],
          });
        }
      } catch (e) {
      console.error('Error parsing confirmed cancellation', e);
    }
  }, [orderId]);

  return (
    <>
      <Header />
      <div className={styles.page}>
        <Container style={{ paddingBottom: '100px' }}>
          <nav className={styles.breadcrumb}>
            <Link href="/">Home</Link>
            <span className={styles.sep}>/</span>
            <Link href="/orders">My Orders</Link>
            <span className={styles.sep}>/</span>
            <Link href={`/orders/${orderId}`}>Order Details</Link>
            <span className={styles.sep}>/</span>
            <span className={styles.current}>Order Cancelled</span>
          </nav>

          <div className={styles.thankyouPanel}>
            {/* HERO BADGE */}
            <div className={styles.tyHero}>
              <div className={styles.tyCircle}>
                <i className="bx bx-shopping-bag"></i>
              </div>
            </div>

            <h1 className={styles.tyTitle}>Cancellation Confirmed</h1>
            <p className={styles.tySub}>
              We&apos;re sorry to see your plans change — sometimes they do.<br />
              Your refund is on its way, and your event is always welcome back with us.
            </p>

            {/* DETAILS GRID */}
            <div className={styles.tyGrid}>
              <div className={styles.tyCard}>
                <div className={styles.tyCardTitle}>
                  <i className="bx bx-receipt"></i> Cancellation Summary
                </div>

                <div className={styles.tyRow}>
                  <span className={styles.tyRowLbl}>Refund Reference</span>
                  <span className={styles.tyRowVal} style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {cancelInfo.refundReference}
                  </span>
                </div>
                <div className={styles.tyDivider}></div>

                <div className={styles.tyRow}>
                  <span className={styles.tyRowLbl}>Order Number</span>
                  <span className={styles.tyRowVal}>{cancelInfo.orderNumber}</span>
                </div>
                <div className={styles.tyDivider}></div>

                <div className={styles.tyRow}>
                  <span className={styles.tyRowLbl}>Cancellation Date</span>
                  <span className={styles.tyRowVal}>{cancelInfo.cancelDate}</span>
                </div>
                <div className={styles.tyDivider}></div>

                <div className={styles.tyRow}>
                  <span className={styles.tyRowLbl}>Refund Status</span>
                  <span className={styles.tyRowVal} style={{ color: 'var(--success)' }}>
                    Refund Initiated
                  </span>
                </div>

                {/* CANCELLED PACKAGES ACCORDION */}
                <div className={`${styles.tyPkgAcc} ${isPkgOpen ? styles.open : ''}`}>
                  <button
                    type="button"
                    className={styles.tyPkgHead}
                    onClick={() => setIsPkgOpen(!isPkgOpen)}
                  >
                    <span className={styles.tyPkgHeadLbl}>
                      <i className="bx bx-package"></i> Packages Cancelled
                    </span>
                    <i className={`bx bx-chevron-down ${styles.tyPkgChev}`}></i>
                  </button>

                  <div className={styles.tyPkgBody}>
                    {cancelInfo.cancelledPackages.length > 0 ? (
                      cancelInfo.cancelledPackages.map((pkg, idx) => (
                        <div key={idx} className={styles.tyPkgRow}>
                          {pkg.img ? (
                            <img src={pkg.img} alt={pkg.name} className={styles.sdbImg} />
                          ) : (
                            <div
                              className={styles.sdbImg}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                                color: 'var(--text-muted)',
                              }}
                            >
                              <i className="bx bx-box"></i>
                            </div>
                          )}
                          <div className={styles.sdbInfo}>
                            <div className={styles.sdbName}>{pkg.name}</div>
                            {pkg.vendor && <div className={styles.sdbPkg}>{pkg.vendor}</div>}
                          </div>
                          {pkg.refund && (
                            <div className={styles.sdbPrice}>{formatAmount(pkg.refund)}</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className={styles.tyPkgRow} style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        Line items released back to vendor schedule.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* REFUND CARD */}
              <div className={styles.tyPayCard}>
                <div className={styles.tyPaidLbl}>
                  <i className="bx bx-check-circle"></i> TOTAL REFUND INITIATED
                </div>
                <div className={styles.tyPaidBig}>{cancelInfo.refundTotal}</div>
                <div className={styles.tyPaidMethod}>{cancelInfo.paymentMethod}</div>

                <div className={styles.tyFutureBlock}>
                  <div className={styles.tyFutureLbl}>
                    <i className="bx bx-time-five"></i> Refund Credited
                  </div>
                  <div className={styles.tyFutureDue}>
                    Within 3–5 business days to your original payment method.
                  </div>
                </div>
              </div>
            </div>

            {/* NEXT STEPS */}
            <div className={styles.tyNextTitle}>
              <i className="bx bx-list-check"></i> What happens next
            </div>

            <div className={styles.tySteps}>
              <div className={styles.tyStep}>
                <div className={styles.tyStepTop}>
                  <div className={styles.tyStepNum}>1</div>
                  <i className={`bx bx-wallet ${styles.tyStepIcon}`}></i>
                </div>
                <div className={styles.tyStepTitle}>Refund Processing</div>
                <div className={styles.tyStepDesc}>
                  {cancelInfo.refundTotal} is being returned to your {cancelInfo.paymentMethod}. It typically lands within 3–5 business days.
                </div>
              </div>

              <div className={styles.tyStep}>
                <div className={styles.tyStepTop}>
                  <div className={styles.tyStepNum}>2</div>
                  <i className={`bx bx-bell ${styles.tyStepIcon}`}></i>
                </div>
                <div className={styles.tyStepTitle}>Vendors Notified</div>
                <div className={styles.tyStepDesc}>
                  {cancelInfo.cancelledPackages.length > 0
                    ? `${Array.from(new Set(cancelInfo.cancelledPackages.map((p) => p.vendor).filter(Boolean))).join(', ')} have been informed and have released your booking slots.`
                    : 'Vendors have been informed and have released your booking slots.'}
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

            {/* ACTIONS */}
            <div className={styles.tyActions}>
              <Link href="/orders" className={styles.btnTyPrimary}>
                <i className="bx bx-list-check"></i> Back to My Orders
              </Link>
              <Link href="/" className={styles.btnTyOutline}>
                <i className="bx bx-store-alt"></i> Continue Shopping
              </Link>
            </div>
          </div>
        </Container>
      </div>
      <Footer />
    </>
  );
}
