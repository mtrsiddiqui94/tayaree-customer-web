'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';
import { formatPrice } from '@/lib/formatPrice';
import styles from './page.module.css';

const REASONS = [
  'Event date changed',
  'Event cancelled completely',
  'Found a better deal elsewhere',
  'Vendor unresponsive',
  'Other'
];

export default function MegaCancelOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [reason, setReason] = useState<string>('');
  const [comment, setComment] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push(`/login?redirect=/orders/${orderId}/cancel/mega`);
      return;
    }
    loadOrderDetails();
  }, [orderId]);

  async function loadOrderDetails() {
    try {
      setIsLoading(true);
      const numOrderId = parseInt(orderId as string, 10);
      const res = await api.get<{ status: boolean; data: any[] }>(ENDPOINTS.ORDERS_LIST + '?limit=50&page=1');
      if (res.status && res.data) {
        let found: any = null;
        for (const section of res.data) {
          const bodyList = section.body || [];
          const match = bodyList.find((ord: any) => ord.order_id === numOrderId);
          if (match) {
            found = match;
            break;
          }
        }

        if (found) {
          setOrder(found);
          const detailRes = await api.get<{status: boolean, data: any}>(`/api/v1/order/items/${found.order_package_line_id}/detail/${found.order_id}?is_full=1`);
          if (detailRes.status && detailRes.data) {
            setItems(detailRes.data.line_item || []);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const handleNext = () => {
    if (!reason) return;
    const orderTotal = order.total_amount || 0;
    const paid = Math.round(orderTotal * 0.30);
    const fee = Math.round(paid * 0.10);

    const summaryDetails = {
      orderId,
      amountPaidSoFar: paid,
      cancellationFeeTotal: fee,
      refundTotal: paid - fee,
      reason,
      comment,
      cancelledPackages: items.map(i => ({
        name: i.item_name,
        vendor: i.vendor_name,
        img: i.image_url,
        amount: orderTotal / items.length
      }))
    };
    localStorage.setItem('temp_cancel_details', JSON.stringify(summaryDetails));
    router.push(`/orders/${orderId}/cancel/summary`);
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
          <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>Loading cancellation details...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header />
        <div className={styles.page}>
          <div style={{ padding: '100px 0', textAlign: 'center' }}>
            <h2 style={{ margin: '16px 0 8px' }}>Order Not Found</h2>
            <Link href="/orders" className={styles.btnPrimary} style={{ display: 'inline-flex', width: 'auto', padding: '0 24px' }}>
              Back to Orders
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const orderTotal = order.total_amount || 0;
  const paid = Math.round(orderTotal * 0.30);
  const fee = Math.round(paid * 0.10);
  const refundTotal = paid - fee;

  return (
    <>
      <Header />

      <main className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <Link href="/orders">My Orders</Link>
          <span className={styles.sep}>/</span>
          <Link href={`/orders/${orderId}/mega`}>{order.package_name || 'Mega Booking'}</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Cancel Mega Deal</span>
        </div>

        <div className={styles.pageHead}>
          <div>
            <div className={styles.pageTitle}>Cancel Mega Deal <span className={styles.mSquare}>M</span></div>
            <div className={styles.pageSub}>{order.package_name || 'Mega Booking'} · all {items.length} packages cancel together</div>
          </div>
          <Link href={`/orders/${orderId}/mega`} className={styles.backLink}>
            <i className="bx bx-arrow-back"></i> Back to Order
          </Link>
        </div>

        <div className={styles.layout}>
          <div>
            <div className={styles.warnBanner}>
              <div className={styles.wbIc}>M</div>
              <div>
                <div className={styles.warnTitle}>Cancelling cancels all {items.length} packages</div>
                <div className={styles.warnBody}>
                  Mega Deals are booked together as one bundle, so packages can&apos;t be cancelled individually. Cancelling reverses the bundle discount and stops the upcoming installments. This action cannot be undone.
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.cardTitle}>
                  <i className="bx bx-package"></i>Packages Being Cancelled <span className={styles.count}>{items.length} items</span>
                </div>
                <div className={styles.cardSubtitle}>Because this is a Mega Deal, all included packages must be cancelled together.</div>

                {items.map((pkg, idx) => (
                  <div key={idx} className={styles.cpkg}>
                    <div className={styles.cpkgBox}><i className="bx bx-check"></i></div>
                    <div className={styles.cpkgBody}>
                      <div className={styles.ciHeader}>
                        <img className={styles.ciImg} src={pkg.image_url || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=150&h=150&q=80'} alt={pkg.item_name} />
                        <div className={styles.ciHeadInfo}>
                          <div className={styles.ciHeadTop}>
                            <div>
                              <div className={styles.ciName}>{pkg.item_name}</div>
                              <div className={styles.ciVendor}><i className="bx bx-store"></i> {pkg.vendor_name}</div>
                            </div>
                            <div className={styles.ciBadges}>
                              <span className={`${styles.ciStatus} ${styles.confirmed}`}><i className="bx bx-check-circle"></i>{pkg.status || 'Confirmed'}</span>
                            </div>
                          </div>
                          <div className={styles.ciMetaRow}>
                            <span className={styles.ciMeta}><i className="bx bx-calendar"></i>{pkg.delivery_date}</span>
                            <span className={styles.ciMeta}><i className="bx bx-group"></i>{pkg.quantity} guests/items</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.cardTitle}>
                  <i className="bx bx-message-square-detail"></i>Why are you cancelling?
                </div>
                <div className={styles.cardSubtitle}>
                  Please let us know why you need to cancel this bundle.
                </div>

                <div>
                  {REASONS.map((r, i) => (
                    <div key={i} className={`${styles.reasonRow} ${reason === r ? styles.sel : ''}`} onClick={() => setReason(r)}>
                      <div className={styles.reasonRadio}></div>
                      <div className={styles.reasonLabel}>{r}</div>
                    </div>
                  ))}
                </div>

                <div className={styles.reasonCommentLbl}>Additional details (optional)</div>
                <textarea
                  className={styles.reasonTextarea}
                  placeholder="Tell us more about why you're cancelling..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                ></textarea>
                <span className={styles.reasonCount}>{comment.length} / 500</span>
              </div>
            </div>
          </div>

          <div>
            <div className={styles.sidebarSticky}>
              <div className={styles.bookingCard}>
                <div className={styles.sidebarHead}>
                  <div className={styles.shTop}>
                    <div className={styles.shEyebrow}>
                      <span className={styles.shM}>M</span> Mega Deal Cancel
                    </div>
                    <span className={styles.shStatus}><i className="bx bx-x-circle"></i>Cancelling</span>
                  </div>
                  <div className={styles.shTitle}>#{order.order_id}</div>
                  <div className={styles.shOrderdate}><i className="bx bx-calendar"></i>Ordered {order.order_date || 'N/A'}</div>
                  <div className={styles.shSub}>{items.length} packages included</div>
                </div>

                <div className={styles.refundBlock}>
                  <div className={styles.refundTitle}><i className="bx bx-wallet"></i>Estimated Refund</div>
                  <div className={styles.refundRow}>
                    Paid so far <span className={styles.v}>PKR {formatPrice(paid)}</span>
                  </div>
                  <div className={styles.refundRow}>
                    Cancellation fee (10%) <span className={`${styles.v} ${styles.fee}`}>− PKR {formatPrice(fee)}</span>
                  </div>
                  <hr className={styles.refundDashed} />
                  <div className={styles.refundTotal}>
                    <span className={styles.refundTotalLbl}>Total Refund</span>
                    <span className={styles.refundTotalVal}>PKR {formatPrice(refundTotal)}</span>
                  </div>
                </div>

                <div className={styles.policyNote}>
                  <i className="bx bx-info-circle"></i>
                  <div className={styles.policyNoteTxt}>
                    Refunds are subject to our <a href="#">Cancellation Policy</a> and typically take 3-5 business days to process.
                  </div>
                </div>

                <div className={styles.actionsBlock}>
                  <button className={styles.btnDanger} disabled={!reason} onClick={handleNext}>
                    Review Cancellation
                  </button>
                  <Link href={`/orders/${orderId}/mega`} className={styles.btnOutline}>
                    Keep Order
                  </Link>
                </div>
                <div className={styles.undoneNote}>
                  <i className="bx bx-lock-alt"></i>This action cannot be undone
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
