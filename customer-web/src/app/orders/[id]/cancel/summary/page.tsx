'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from './page.module.css';

interface CancelledPackage {
  name: string;
  vendor: string;
  img: string;
  meta: string;
  date: string;
  refund: number;
  fee: number;
}

export default function CancelSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const orderId = parseInt(unwrappedParams.id, 10);

  const [cancelledPackages, setCancelledPackages] = useState<CancelledPackage[]>([]);
  const [amountPaidSoFar, setAmountPaidSoFar] = useState(0);
  const [cancellationFeeTotal, setCancellationFeeTotal] = useState(0);
  const [refundTotal, setRefundTotal] = useState(0);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelComment, setCancelComment] = useState('');
  
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [isOrderAmtOpen, setIsOrderAmtOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [orderTotal, setOrderTotal] = useState('');
  const [refundReference, setRefundReference] = useState('');
  const [refundStatusLabel, setRefundStatusLabel] = useState('Refund Initiated');
  const [cardLastFour, setCardLastFour] = useState('');
  const [cardBrand, setCardBrand] = useState('');

  useEffect(() => {
    const initDetails = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push(`/login?redirect=/orders/${orderId}/cancel/summary`);
        return;
      }

      // Try loading details from localStorage for Cancel Flow (Step 2)
      const saved = localStorage.getItem('temp_cancel_details');
      if (saved) {
        try {
          const details = JSON.parse(saved);
          if (details.orderId === orderId) {
            setAmountPaidSoFar(details.amountPaidSoFar || 0);
            setCancellationFeeTotal(details.cancellationFeeTotal || 0);
            setRefundTotal(details.refundTotal || 0);
            setCancelReason(details.reason || 'Not specified');
            setCancelComment(details.comment || '');
            
            interface SavedCancelledPackage {
              name: string;
              vendor?: string;
              img?: string;
              meta?: string;
              deliveryDate?: string;
              amount?: number;
            }
            const mapped: CancelledPackage[] = details.cancelledPackages.map((p: SavedCancelledPackage) => {
              const rawAmount = p.amount || 0;
              const paid = Math.round(rawAmount * 0.30);
              const fee = Math.round(paid * 0.10);
              return {
                name: p.name,
                vendor: p.vendor || 'Vendor',
                img: p.img || 'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?auto=format&fit=crop&w=120&h=120&q=80',
                meta: p.meta || 'Confirmed',
                date: p.deliveryDate || 'Scheduled Delivery',
                refund: paid - fee,
                fee: fee
              };
            });
            setCancelledPackages(mapped);
            setIsReadOnly(false);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing saved cancellation details', e);
        }
      }

      // If no temp_cancel_details, we are viewing an ALREADY CANCELED order (Read-Only Mode)
      setIsReadOnly(true);
      try {
        const listRes = await api.get<{ status: boolean; data: any[] }>('/api/v1/order/list?limit=50&page=1');
        if (listRes.status && listRes.data) {
          let found: any = null;
          for (const section of listRes.data) {
            const bodyList = section.body || [];
            const match = bodyList.find((ord: any) => ord.order_id === orderId);
            if (match) {
              found = match;
              break;
            }
          }

          if (found) {
            const detailRes = await api.get<{status: boolean, data: any}>(`/api/v1/order/items/${found.order_package_line_id}/detail/${found.order_id}?is_full=1`);
            if (detailRes.status && detailRes.data) {
              const o = detailRes.data.order_detail;
              if (o) {
                setOrderNumber(o.order_number || String(orderId));
                setOrderDate(o.order_date || '');
                setOrderTotal(o.order_total || '');
              }

              const c = detailRes.data.cancellation_details;
              if (c) {
                setRefundReference(c.refund_reference || `#${orderId}-RF`);
                setRefundStatusLabel(c.refund_status_label || 'Refund Initiated');
                if (c.payment_method) {
                  setCardLastFour(c.payment_method.card_last_four || '');
                  setCardBrand(c.payment_method.card_brand || '');
                }

                let sumPaid = 0;
                let sumFee = 0;
                let sumRefund = 0;
                
                const mapped: CancelledPackage[] = (c.canceled_packages || []).map((p: any) => {
                  sumPaid += p.paid_so_far || 0;
                  sumFee += p.cancellation_fee_amount || 0;
                  sumRefund += p.refund_amount || 0;
                  return {
                    name: p.package_name || 'Package',
                    vendor: p.vendor_name || 'Vendor',
                    img: p.image_url || 'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?auto=format&fit=crop&w=120&h=120&q=80',
                    meta: '',
                    date: '',
                    refund: p.refund_amount || 0,
                    fee: p.cancellation_fee_amount || 0
                  };
                });
                
                setAmountPaidSoFar(sumPaid);
                setCancellationFeeTotal(sumFee);
                setRefundTotal(c.refund_amount || sumRefund);
                setCancelledPackages(mapped);
                
                let reason = '';
                let comment = '';
                for (const p of (c.canceled_packages || [])) {
                  if (p.cancellation_reason) {
                    reason = p.cancellation_reason;
                    break;
                  }
                }
                setCancelReason(reason || 'Not specified');
                setCancelComment(comment || '');

                setIsLoading(false);
                return;
              }
            }
          }
        }
        
        // No details found
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching cancellation details:', err);
        setIsLoading(false);
      }
    };

    initDetails();
  }, [orderId, router]);

  const formatAmount = (num: number) => {
    return num.toLocaleString('en-PK');
  };

  const handleConfirmCancellation = async () => {
    try {
      setIsConfirming(true);
      const itemsPayload = cancelledPackages.map(pkg => ({
        packageName: pkg.name,
      }));

      const res = await api.post<{ status: boolean; message?: string }>(`/api/v1/order/cancel/${orderId}`, {
        items: itemsPayload,
        reason: cancelReason,
        comment: cancelComment
      }).catch((e) => ({ status: false, message: e?.message || 'Cancellation request failed.' }));

      if (res.status) {
        router.push(`/orders/${orderId}/cancelled`);
      }
    } catch (e) {
      console.error(e);
      alert('Error confirming cancellation request. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  if (isLoading) {
    return (
      <>
      <Header />
      <main className={styles.page}>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
          <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>Loading details...</p>
        </div>
      </main>
      <Footer />
    </>
    );
  }

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.pageHead}>
          <div>
            <h2 className={styles.pageTitle}>{isReadOnly ? 'Cancellation Details' : 'Review Your Cancellation'}</h2>
            <p className={styles.pageSub}>
              {isReadOnly ? 'Review the summary and refund status of your cancelled order.' : 'Please review what\'s being cancelled and your refund before confirming. This is the last step.'}
            </p>
          </div>
          <Link href={`/orders/${orderId}${!isReadOnly ? '/cancel' : ''}`} className={styles.backLink}>
            <i className="bx bx-arrow-back"></i> Back
          </Link>
        </div>

        {/* Warning Review Banner */}
        {!isReadOnly && (
          <div className={styles.warnBanner}>
            <i className="bx bx-error-circle"></i>
            <div>
              <h4 className={styles.warnTitle}>This is your final review</h4>
              <p className={styles.warnBody}>Once you confirm, these packages will be cancelled immediately, the vendors will be notified, and your refund will be initiated to your original payment method. This can&apos;t be undone.</p>
            </div>
          </div>
        )}

        <div className={styles.layout}>
          {isReadOnly ? (
              <div className={styles.singleColumnLayout}>
                {/* 1. Refund Header Card */}
                <div className={styles.card}>
                  <div className={styles.cardInner}>
                    <div className={styles.rhRow}>
                      <span className={styles.rhLabel}>Refund Reference</span>
                      <span className={styles.rhValue}>{refundReference}</span>
                    </div>
                    <hr className={styles.rhDivider} />
                    <div className={styles.rhRow}>
                      <span className={styles.rhLabel}>Refund To</span>
                      <span className={styles.rhValue}><i className="bx bx-credit-card"></i> {cardBrand ? `${cardBrand} •••• ${cardLastFour}` : 'Original Payment Method'}</span>
                    </div>
                    <hr className={styles.rhDivider} />
                    <div className={`${styles.rhRow} ${styles.rhAmountRow}`}>
                      <div>
                        <span className={styles.rhLabel}>Refund Amount</span>
                        <div className={styles.refundStatusChip}>{refundStatusLabel}</div>
                      </div>
                      <span className={styles.rhAmount}>PKR {formatAmount(refundTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Order Details Card */}
                <div className={styles.card}>
                  <div className={styles.cardInner}>
                    <div className={styles.cardTitle}>Order Details</div>
                    <div className={styles.rhRow}>
                      <span className={styles.rhLabel}>Order Number</span>
                      <span className={styles.rhValue}>#{orderNumber}</span>
                    </div>
                    <hr className={styles.rhDivider} />
                    <div className={styles.rhRow}>
                      <span className={styles.rhLabel}>Order Date</span>
                      <span className={styles.rhValue}>{orderDate}</span>
                    </div>
                    <hr className={styles.rhDivider} />
                    <div className={styles.rhRow}>
                      <span className={styles.rhLabel}>Order Total</span>
                      <span className={styles.rhValue}>{orderTotal}</span>
                    </div>
                    <hr className={styles.rhDivider} />
                    <div className={styles.rhRow}>
                      <span className={styles.rhLabel}>Paid Amount</span>
                      <span className={styles.rhValue}>PKR {formatAmount(amountPaidSoFar)}</span>
                    </div>
                  </div>
                </div>

              {/* 3. Packages */}
              {cancelledPackages.map((pkg, idx) => (
                <div key={idx} className={styles.card}>
                  <div className={styles.cardInner} style={{ padding: 0 }}>
                    <div className={styles.pkgAccordionHeader}>
                      <img className={styles.pkgAccordionImg} src={pkg.img} alt={pkg.name} />
                      <div className={styles.pkgAccordionInfo}>
                        <div className={styles.pkgAccordionName}>{pkg.name}</div>
                        <div className={styles.pkgAccordionVendor}><i className="bx bx-store"></i> {pkg.vendor}</div>
                        <div className={styles.pkgAccordionStatus}>Cancellation Under Review</div>
                      </div>
                      <i className="bx bx-chevron-down" style={{ fontSize: '20px', color: 'var(--text-muted)' }}></i>
                    </div>
                  </div>
                </div>
              ))}

              {/* 3b. Cancellation Reason */}
              <div className={styles.card}>
                <div className={styles.cardInner}>
                  <div className={styles.cardTitle}>Cancellation Reason</div>
                  <div className={styles.roReasonText}>{cancelReason}</div>
                  {cancelComment && (
                    <>
                      <hr className={styles.rhDivider} />
                      <div className={styles.roReasonText}><b>Your Note:</b> {cancelComment}</div>
                    </>
                  )}
                </div>
              </div>

              {/* 4. Aggregate Refund Summary */}
              <div className={styles.card}>
                <div className={styles.cardInner}>
                  <div className={styles.cardTitle}>Refund Summary</div>
                  <div className={styles.rhRow}>
                    <span className={styles.rhLabel}>Paid so far</span>
                    <span className={styles.rhValue}>PKR {formatAmount(amountPaidSoFar)}</span>
                  </div>
                  <div className={styles.rhRow}>
                    <span className={styles.rhLabel}>Cancellation fee (10%)</span>
                    <span className={styles.rhValue} style={{ color: 'var(--primary)' }}>− PKR {formatAmount(cancellationFeeTotal)}</span>
                  </div>
                  <hr className={styles.rhDivider} />
                  <div className={styles.rhRow}>
                    <span className={styles.rhLabel} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total Refund</span>
                    <span className={styles.rhValue} style={{ fontWeight: 800 }}>PKR {formatAmount(refundTotal)}</span>
                  </div>
                </div>
              </div>

              {/* 5. Refund Destination */}
              <div className={styles.card}>
                <div className={styles.cardInner}>
                  <div className={styles.cardTitle}>Refund Destination</div>
                  <div className={styles.destCard} style={{ margin: 0, border: 'none', background: 'transparent', padding: 0 }}>
                    <span className={`${styles.payLogo} ${styles.visa}`}>VISA</span>
                    <div className={styles.destInfo}>
                      <h4 className={styles.destNum}>Visa •••• 4242</h4>
                      <p className={styles.destSub}>Refunded to your original payment method · Expires 09/27</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Policy Notice */}
              <div className={styles.card}>
                <div className={styles.cardInner}>
                  <div className={styles.cardTitle}>Cancellation Policy</div>
                  <p className={styles.policyText}>
                    Cancellation fees follow the policy in effect at the time the order was placed. Refunds reach your original payment method within 3–5 business days of the refund being initiated.
                  </p>
                </div>
              </div>

              {/* 7. Want to track your refund? */}
              <div className={styles.card}>
                <div className={styles.cardInner} style={{ padding: 0 }}>
                  <div style={{ padding: '20px', fontWeight: 700, fontSize: '14px', borderBottom: '1px solid var(--border)' }}>
                    Want to track your refund?
                  </div>
                  <div className={styles.menuList}>
                    <button className={styles.menuRow}>
                      <div className={styles.menuIconBox}><i className="bx bx-hourglass"></i></div>
                      <div className={styles.menuTitle}>View Refund Status</div>
                      <i className="bx bx-chevron-right"></i>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <>
              {/* LEFT COLUMN: Items and reasons review details */}
              <div>
                {/* Packages listing */}
                <div className={styles.card}>
                  <div className={styles.cardInner}>
                    <div className={styles.cardTitle}>
                      <i className="bx bx-x-circle"></i>Packages Being Cancelled
                      <span className={styles.count}>{cancelledPackages.length} packages</span>
                    </div>
                    <p className={styles.cardSubtitle}>
                      Delivered and in-transit packages are not included — they can no longer be cancelled.
                    </p>

                    {cancelledPackages.map((pkg, idx) => (
                      <div key={idx} className={styles.revRow}>
                        <img className={styles.revImg} src={pkg.img} alt={pkg.name} />
                        <div className={styles.revInfo}>
                          <h4 className={styles.revName}>{pkg.name}</h4>
                          <div className={styles.revVendor}>
                            <i className="bx bx-store"></i> {pkg.vendor}
                          </div>
                          {pkg.meta && (
                            <div className={styles.revMeta}>
                              <span><i className="bx bx-group"></i>{pkg.meta}</span>
                            </div>
                          )}
                        </div>
                        <div className={styles.revRight}>
                          <div className={styles.revRefund}>PKR {formatAmount(pkg.refund)}</div>
                          <div className={styles.revRefundLbl}>refund</div>
                          <div className={styles.revFee}>− PKR {formatAmount(pkg.fee)} fee</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reason details */}
                <div className={styles.card}>
                  <div className={styles.cardInner}>
                    <div className={styles.cardTitle}>
                      <i className="bx bx-message-square-detail"></i>Cancellation Reason
                    </div>
                    <div className={styles.roReason}>
                      <div className={styles.roReasonIc}>
                        <i className="bx bx-calendar-x"></i>
                      </div>
                      <div>
                        <span className={styles.roReasonLbl}>Selected reason</span>
                        <h5 className={styles.roReasonVal}>{cancelReason}</h5>
                      </div>
                    </div>
                    {cancelComment && (
                      <div className={styles.roComment}>
                        <b>Your note:</b> {cancelComment}
                      </div>
                    )}
                  </div>
                </div>

                {/* Refund destination details card */}
                <div className={styles.card}>
                  <div className={styles.cardInner}>
                    <div className={styles.cardTitle}>
                      <i className="bx bx-credit-card"></i>Refund Destination
                    </div>
                    <div className={styles.destCard}>
                      <span className={`${styles.payLogo} ${styles.visa}`}>VISA</span>
                      <div className={styles.destInfo}>
                        <h4 className={styles.destNum}>Visa •••• 4242</h4>
                        <p className={styles.destSub}>Refunded to your original payment method · Expires 09/27</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Sidebar Summary & Final confirmation buttons */}
              <aside>
                <div className={styles.sidebarSticky}>
                  <div className={styles.bookingCard}>
                    <div className={styles.sidebarHead}>
                      <div className={styles.shTop}>
                        <span className={styles.shEyebrow}>Cancellation Summary</span>
                        <span className={styles.shStatus}>
                          <i className="bx bx-x-circle"></i>Cancelling
                        </span>
                      </div>
                      <h3 className={styles.shTitle}>#{orderId}</h3>
                      <div className={styles.shOrderdate}>
                        <i className="bx bx-calendar"></i>Ordered 10 March 2025
                      </div>
                      <div className={styles.shSub}>
                        {cancelledPackages.length} packages · Event March 15, 2025
                      </div>
                    </div>

                    <div className={styles.refundBlock}>
                      <h4 className={styles.refundTitle}>
                        <i className="bx bx-wallet"></i>Your Refund
                      </h4>
                      <div className={styles.refundRow}>
                        Paid so far <span className={styles.v}>PKR {formatAmount(amountPaidSoFar)}</span>
                      </div>
                      <div className={styles.refundRow}>
                        Cancellation fee (10%){' '}
                        <span className={`${styles.v} ${styles.fee}`}>
                          − PKR {formatAmount(cancellationFeeTotal)}
                        </span>
                      </div>
                      <hr className={styles.refundDashed} />
                      <div className={styles.refundTotal}>
                        <span className={styles.refundTotalLbl}>Total Refund</span>
                        <span className={styles.refundTotalVal}>
                          PKR {formatAmount(refundTotal)}
                        </span>
                      </div>
                    </div>

                    <div className={styles.policyNote}>
                      <i className="bx bx-time-five"></i>
                      <div className={styles.policyNoteTxt}>
                        Refund credited within <b>3–5 business days</b> after confirmation.
                      </div>
                    </div>

                    <div className={styles.actionsBlock}>
                      <button
                        disabled={isConfirming}
                        onClick={handleConfirmCancellation}
                        className={styles.btnDanger}
                      >
                        {isConfirming ? (
                          <>
                            <i className="bx bx-loader-alt bx-spin"></i> Cancelling...
                          </>
                        ) : (
                          <>
                            <i className="bx bx-check"></i>Confirm Cancellation
                          </>
                        )}
                      </button>
                      <Link href={`/orders/${orderId}/cancel`} className={styles.btnOutline}>
                        Keep Order
                      </Link>
                    </div>
                    <div className={styles.undoneNote}>
                      <i className="bx bx-lock-alt"></i>This action cannot be undone
                    </div>
                  </div>

                  {/* Order total amount breakdowns */}
                  <div className={`${styles.orderAmtBlock} ${isOrderAmtOpen ? styles.open : ''}`}>
                    <button
                      className={styles.oaHead}
                      onClick={() => setIsOrderAmtOpen(!isOrderAmtOpen)}
                    >
                      <div>
                        <div className={styles.oaLbl}>Order Total</div>
                        <div className={styles.oaNote}>At time of order · 5 packages</div>
                      </div>
                      <div className={styles.oaHeadRight}>
                        <span className={styles.oaTotal}>PKR 4,25,125</span>
                        <i className="bx bx-chevron-down oaChev"></i>
                      </div>
                    </button>
                    <div className={styles.oaBody}>
                      <div className={styles.oaInner}>
                        <div className={styles.oaRow}>
                          Packages (5)<span>PKR 3,84,750</span>
                        </div>
                        <div className={styles.oaRow}>
                          Shipping<span>PKR 15,000</span>
                        </div>
                        <div className={styles.oaRow}>
                          Taxes &amp; Fees<span>PKR 25,375</span>
                        </div>
                        <hr className={styles.oaDashed} />
                        <div className={`${styles.oaRow} ${styles.total}`}>
                          Order Total<span>PKR 4,25,125</span>
                        </div>
                        <div className={`${styles.oaRow} ${styles.sub}`}>
                          Paid at Checkout<span>PKR 2,29,300</span>
                        </div>
                        <div className={`${styles.oaRow} ${styles.sub}`}>
                          Future Payments<span>PKR 1,95,825</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible cancellation workflow summary */}
                  <div className={styles.cancelSteps}>
                    <div className={styles.csTitle}>
                      <i className="bx bx-list-ol"></i>How Cancellation Works
                    </div>
                    <div className={styles.csStep}>
                      <div className={styles.csG}>
                        <div className={styles.csNum}>1</div>
                        <div className={styles.csConn}></div>
                      </div>
                      <div className={styles.csBody}>
                        <h5 className={styles.csStepTitle}>Refund Calculated</h5>
                        <p className={styles.csStepSub}>
                          A 10% cancellation fee is deducted from the amount you&apos;ve paid.
                        </p>
                      </div>
                    </div>
                    <div className={styles.csStep}>
                      <div className={styles.csG}>
                        <div className={styles.csNum}>2</div>
                        <div className={styles.csConn}></div>
                      </div>
                      <div className={styles.csBody}>
                        <h5 className={styles.csStepTitle}>Vendors Notified</h5>
                        <p className={styles.csStepSub}>
                          Your booking slots are released and vendors are informed right away.
                        </p>
                      </div>
                    </div>
                    <div className={styles.csStep}>
                      <div className={styles.csG}>
                        <div className={styles.csNum}>3</div>
                      </div>
                      <div className={styles.csBody}>
                        <h5 className={styles.csStepTitle}>Refund to Your Card</h5>
                        <p className={styles.csStepSub}>
                          Credited to Visa •••• 4242 within 3–5 business days.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </>
          )}
        </div>      </main>
      <Footer />
    </>
  );
}
