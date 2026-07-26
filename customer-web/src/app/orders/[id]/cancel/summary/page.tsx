'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Container, TwoColumnLayout } from '@/components/layout/Container';
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
  const [hasVoiceNote, setHasVoiceNote] = useState(false);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const togglePlayAudio = () => {
    if (isPlayingAudio) {
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      setTimeout(() => {
        setIsPlayingAudio(false);
      }, (recordedDuration || 3) * 1000);
    }
  };

  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [isOrderAmtOpen, setIsOrderAmtOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const [orderNumber, setOrderNumber] = useState(`#TAY-${orderId}`);
  const [orderDate, setOrderDate] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [orderTotal, setOrderTotal] = useState(0);
  const [packagesTotal, setPackagesTotal] = useState(0);
  const [shippingTotal, setShippingTotal] = useState(0);
  const [taxesTotal, setTaxesTotal] = useState(0);
  const [paidAtCheckout, setPaidAtCheckout] = useState(0);
  const [futurePayments, setFuturePayments] = useState(0);

  const [cardLastFour, setCardLastFour] = useState('6411');
  const [cardBrand, setCardBrand] = useState('Visa');
  const [refundReference, setRefundReference] = useState('');

  const formatAmount = (num: number) => `PKR ${num.toLocaleString('en-US')}`;

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
          const rawOrd = details.orderNumber || orderId;
            const formattedOrd = String(rawOrd).startsWith('#')
              ? String(rawOrd)
              : (String(rawOrd).includes('-') ? `#${rawOrd}` : `#SXE-224-${String(rawOrd).padStart(6, '0')}`);
            setOrderNumber(formattedOrd);
            setAmountPaidSoFar(details.amountPaidSoFar || 0);
            setCancellationFeeTotal(details.cancellationFeeTotal || 0);
            setRefundTotal(details.refundTotal || 0);
            setCancelReason(details.reason || 'Not specified');
            setCancelComment(details.comment || '');
            if (details.hasVoiceNote) {
              setHasVoiceNote(true);
              setRecordedDuration(details.recordedDuration || 0);
            }

            interface SavedCancelledPackage {
              name: string;
              vendor?: string;
              img?: string;
              meta?: string;
              deliveryDate?: string;
              amount?: number;
              paid?: number;
            }

            let pkgSum = 0;
            let paidSum = 0;
            const mapped: CancelledPackage[] = (details.cancelledPackages || []).map((p: SavedCancelledPackage) => {
              const rawAmount = p.amount || 0;
              const paid = p.paid || Math.round(rawAmount * 0.30);
              const fee = Math.round(paid * 0.10);
              pkgSum += rawAmount;
              paidSum += paid;
              return {
                name: p.name,
                vendor: p.vendor || 'Vendor',
                img: p.img || '',
                meta: p.meta || 'Confirmed',
                date: p.deliveryDate || 'Scheduled Delivery',
                refund: Math.max(0, paid - fee),
                fee: fee,
              };
            });

            setPackagesTotal(pkgSum);
            setOrderTotal(pkgSum);
            setPaidAtCheckout(paidSum);
            setFuturePayments(Math.max(0, pkgSum - paidSum));

            setCancelledPackages(mapped);
            setIsReadOnly(false);
            setIsLoading(false);
            return;
        } catch (e) {
          console.error('Error parsing saved cancellation details', e);
        }
      }

      // If no temp_cancel_details, we are viewing an ALREADY CANCELLED order (Read-Only Mode)
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
            const detailRes = await api.get<{ status: boolean; data: any }>(
              `/api/v1/order/items/${found.order_package_line_id || orderId}/detail/${found.order_id || orderId}?is_full=1`
            );
            if (detailRes?.status && detailRes.data) {
              const o = detailRes.data.order_detail || {};
              setOrderNumber(o.order_number || `#TAY-${orderId}`);
              setOrderDate(o.order_date || found.booking_date || '');
              setEventDate(o.event_date || found.delivery_date || '');

              const c = detailRes.data.cancellation_details || {};
              setRefundReference(c.refund_reference || `#RF-${orderId}`);
              if (c.payment_method) {
                setCardLastFour(c.payment_method.card_last_four || '6411');
                setCardBrand(c.payment_method.card_brand || 'Visa');
              }

              let sumPaid = 0;
              let sumFee = 0;
              let sumRefund = 0;

              const mapped: CancelledPackage[] = (c.canceled_packages || detailRes.data.line_item || []).map((p: any) => {
                const paid = p.paid_so_far || p.amount_paid || 10000;
                const fee = p.cancellation_fee_amount || Math.round(paid * 0.1);
                const ref = p.refund_amount || Math.max(0, paid - fee);
                sumPaid += paid;
                sumFee += fee;
                sumRefund += ref;
                return {
                  name: p.package_name || p.item_name || 'Package',
                  vendor: p.vendor_name || 'Vendor',
                  img: p.image_url || '',
                  meta: p.package_status || 'Cancelled',
                  date: p.delivery_date || 'Scheduled Date',
                  refund: ref,
                  fee: fee,
                };
              });

              setAmountPaidSoFar(sumPaid);
              setCancellationFeeTotal(sumFee);
              setRefundTotal(sumRefund);
              setCancelledPackages(mapped);
              setCancelReason(c.cancellation_reason || 'Customer requested cancellation');
              setIsLoading(false);
              return;
            }
          }
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching cancellation details:', err);
        setIsLoading(false);
      }
    };

    initDetails();
  }, [orderId, router]);

  const handleConfirmCancellation = async () => {
    try {
      setIsConfirming(true);
      const itemsPayload = cancelledPackages.map((pkg) => ({
        packageName: pkg.name,
      }));

      await api
        .post<{ status: boolean; message?: string }>(`/api/v1/order/cancel/${orderId}`, {
          items: itemsPayload,
          reason: cancelReason,
          comment: cancelComment,
        })
        .catch(() => null);

      localStorage.setItem(
        'confirmed_cancellation',
        JSON.stringify({
          orderId,
          orderNumber,
          cancelledPackages,
          refundTotal,
          cancellationFeeTotal,
          amountPaidSoFar,
          refundReference: refundReference || `#RF-${orderId}-${Date.now().toString().slice(-4)}`,
          paymentMethod: `${cardBrand} ending in •••• ${cardLastFour}`,
        })
      );

      localStorage.removeItem('temp_cancel_details');
      router.push(`/orders/${orderId}/cancelled`);
    } catch (e) {
      console.error(e);
      alert('Error confirming cancellation request. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

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
            <Link href={`/orders/${orderId}/cancel`}>Cancel Order</Link>
            <span className={styles.sep}>/</span>
            <span className={styles.current}>Review &amp; Confirm</span>
          </nav>

          <div className={styles.pageHead}>
            <div>
              <h1 className={styles.pageTitle}>
                {isReadOnly ? 'Cancellation Details' : 'Review Your Cancellation'}
              </h1>
              <p className={styles.pageSub}>
                {isReadOnly
                  ? 'Review the summary and refund status of your cancelled order.'
                  : "Please review what's being cancelled and your refund before confirming. This is the last step."}
              </p>
            </div>
            <Link href={`/orders/${orderId}/cancel`} className={styles.backLink}>
              <i className="bx bx-arrow-back"></i> Back
            </Link>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
              <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Loading cancellation summary…</p>
            </div>
          ) : (
            <>
              {!isReadOnly && (
                <div className={styles.warnBanner}>
                  <i className="bx bx-error-circle"></i>
                  <div>
                    <div className={styles.warnTitle}>This is your final review</div>
                    <div className={styles.warnBody}>
                      Once you confirm, these packages will be cancelled immediately, the vendors will be notified, and your refund will be initiated to your original payment method. This cannot be undone.
                    </div>
                  </div>
                </div>
              )}

              <TwoColumnLayout>
                {/* LEFT COLUMN */}
                <div>
                  {/* Cancelled Items Card */}
                  <div className={styles.card}>
                    <div className={styles.cardInner}>
                      <div className={styles.cardTitle}>
                        <i className="bx bx-x-circle"></i> Packages Being Cancelled
                        <span className={styles.count}>
                          {cancelledPackages.length} package{cancelledPackages.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className={styles.cardSubtitle}>
                        These packages will be removed from your order and vendor bookings will be released.
                      </div>

                      {cancelledPackages.map((pkg, idx) => (
                        <div key={idx} className={styles.revRow}>
                          {pkg.img ? (
                            <img src={pkg.img} alt={pkg.name} className={styles.revImg} />
                          ) : (
                            <div
                              className={styles.revImg}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                color: 'var(--text-muted)',
                              }}
                            >
                              <i className="bx bx-box"></i>
                            </div>
                          )}

                          <div className={styles.revInfo}>
                            <div className={styles.revName}>{pkg.name}</div>
                            <div className={styles.revVendor}>
                              <i className="bx bx-store"></i> {pkg.vendor}
                            </div>
                            <div className={styles.revMeta}>
                              <span>
                                <i className="bx bx-calendar"></i> {pkg.date}
                              </span>
                            </div>
                          </div>

                          <div className={styles.revRight}>
                            <div className={styles.revRefund}>{formatAmount(pkg.refund)}</div>
                            <div className={styles.revRefundLbl}>refund</div>
                            {pkg.fee > 0 && (
                              <div className={styles.revFee}>- {formatAmount(pkg.fee)} fee</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cancellation Reason Card */}
                  <div className={styles.card}>
                    <div className={styles.cardInner}>
                      <div className={styles.cardTitle}>
                        <i className="bx bx-message-square-detail"></i> Cancellation Reason
                      </div>

                      <div className={styles.roReason}>
                        <div className={styles.roReasonIc}>
                          <i className="bx bx-calendar-x"></i>
                        </div>
                        <div>
                          <div className={styles.roReasonLbl}>Selected reason</div>
                          <div className={styles.roReasonVal}>{cancelReason || 'Event date changed'}</div>
                        </div>
                      </div>

                      {cancelComment && (
                        <div className={styles.roComment}>
                          <b>Your note:</b> {cancelComment}
                        </div>
                      )}

                      {hasVoiceNote && (
                        <div className={styles.policyNote} style={{ marginTop: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="bx bx-microphone" style={{ fontSize: '18px', color: 'var(--primary)' }}></i>
                            <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--primary)' }}>
                              Voice Note Attached ({recordedDuration}s audio feedback)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={togglePlayAudio}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: isPlayingAudio ? 'var(--primary)' : 'var(--card)',
                              color: isPlayingAudio ? '#fff' : 'var(--primary)',
                              border: '1px solid var(--primary)',
                              borderRadius: 'var(--radius-full)',
                              padding: '4px 12px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            <i className={`bx ${isPlayingAudio ? 'bx-pause' : 'bx-play'}`} style={{ fontSize: '15px' }}></i>
                            {isPlayingAudio ? 'Playing…' : 'Play Audio'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Refund Destination Card */}
                  <div className={styles.card}>
                    <div className={styles.cardInner}>
                      <div className={styles.cardTitle}>
                        <i className="bx bx-credit-card"></i> Refund Destination
                      </div>
                      <div className={styles.destCard}>
                        <span className={styles.payLogo}>{cardBrand.toUpperCase() || 'VISA'}</span>
                        <div className={styles.destInfo}>
                          <div className={styles.destNum}>
                            {cardBrand || 'Visa'} •••• {cardLastFour || '6411'}
                          </div>
                          <div className={styles.destSub}>
                            Refunded to your original payment method · Processed within 3–5 days
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDEBAR */}
                <aside>
                  <div className={styles.sidebarSticky}>
                    {/* MAIN BOOKING CARD */}
                    <div className={styles.bookingCard}>
                      <div className={styles.sidebarHead}>
                        <div className={styles.shTop}>
                          <div className={styles.shEyebrow}>CANCELLATION SUMMARY</div>
                          <span className={styles.shStatus}>
                            <i className="bx bx-x-circle"></i> {isReadOnly ? 'Cancelled' : 'Cancelling'}
                          </span>
                        </div>
                        <div className={styles.shTitle}>{orderNumber}</div>
                        {orderDate && (
                          <div className={styles.shOrderdate}>
                            <i className="bx bx-calendar"></i> Ordered {orderDate}
                          </div>
                        )}
                        <div className={styles.shSub}>
                          {cancelledPackages.length} package{cancelledPackages.length !== 1 ? 's' : ''}
                          {eventDate ? ` · Event ${eventDate}` : ''}
                        </div>
                      </div>

                      <div className={styles.refundBlock}>
                        <div className={styles.refundTitle}>
                          <i className="bx bx-wallet"></i> Your Refund
                        </div>
                        <div className={styles.refundRow}>
                          <span>Paid so far</span>
                          <span className={styles.refundRowVal}>{formatAmount(amountPaidSoFar)}</span>
                        </div>
                        <div className={styles.refundRow}>
                          <span>Cancellation fee</span>
                          <span className={`${styles.refundRowVal} ${styles.amber}`}>
                            - {formatAmount(cancellationFeeTotal)}
                          </span>
                        </div>
                        <hr className={styles.refundDashed} />
                        <div className={styles.refundTotal}>
                          <span className={styles.refundTotalLbl}>Total Refund</span>
                          <span className={styles.refundTotalVal}>{formatAmount(refundTotal)}</span>
                        </div>
                      </div>

                      <div className={styles.policyNote}>
                        <i className="bx bx-time-five"></i>
                        <div className={styles.policyNoteTxt}>
                          Refund credited within <b>3–5 business days</b> after confirmation.
                        </div>
                      </div>

                      <div className={styles.actionsBlock}>
                        {!isReadOnly && (
                          <button
                            type="button"
                            className={styles.btnDanger}
                            disabled={isConfirming || cancelledPackages.length === 0}
                            onClick={handleConfirmCancellation}
                          >
                            {isConfirming ? (
                              <>
                                <i className="bx bx-loader-alt bx-spin"></i> Processing…
                              </>
                            ) : (
                              <>
                                <i className="bx bx-check"></i> Confirm Cancellation
                              </>
                            )}
                          </button>
                        )}
                        <Link href={`/orders/${orderId}`} className={styles.btnOutline}>
                          Keep Order
                        </Link>
                      </div>
                      <div className={styles.undoneNote}>
                        <i className="bx bx-lock-alt"></i> This action cannot be undone
                      </div>
                    </div>

                    {/* EXPANDABLE ORDER TOTAL CARD */}
                    <div className={`${styles.orderAmtBlock} ${isOrderAmtOpen ? styles.open : ''}`}>
                      <button
                        type="button"
                        className={styles.oaHead}
                        onClick={() => setIsOrderAmtOpen(!isOrderAmtOpen)}
                      >
                        <div>
                          <div className={styles.oaLbl}>Order Total</div>
                          <div className={styles.oaNote}>
                            At time of order · {cancelledPackages.length} package{cancelledPackages.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className={styles.oaHeadRight}>
                          <span className={styles.oaTotal}>{formatAmount(orderTotal)}</span>
                          <i className={`bx bx-chevron-down ${styles.oaChev}`}></i>
                        </div>
                      </button>

                      <div className={styles.oaBody}>
                        <div className={styles.oaInner}>
                          <div className={styles.oaRow}>
                            Packages ({cancelledPackages.length})<span>{formatAmount(packagesTotal)}</span>
                          </div>
                          {shippingTotal > 0 && (
                            <div className={styles.oaRow}>
                              Shipping<span>{formatAmount(shippingTotal)}</span>
                            </div>
                          )}
                          {taxesTotal > 0 && (
                            <div className={styles.oaRow}>
                              Taxes &amp; Fees<span>{formatAmount(taxesTotal)}</span>
                            </div>
                          )}
                          <hr className={styles.oaDashed} />
                          <div className={`${styles.oaRow} ${styles.total}`}>
                            Order Total<span>{formatAmount(orderTotal)}</span>
                          </div>
                          <div className={`${styles.oaRow} ${styles.sub}`}>
                            Paid at Checkout<span>{formatAmount(paidAtCheckout)}</span>
                          </div>
                          <div className={`${styles.oaRow} ${styles.sub}`}>
                            Future Payments<span>{formatAmount(futurePayments)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* HOW CANCELLATION WORKS CARD */}
                    <div className={styles.cancelSteps}>
                      <div className={styles.csTitle}>
                        <i className="bx bx-list-ol"></i> HOW CANCELLATION WORKS
                      </div>
                      <div className={styles.csStep}>
                        <div className={styles.csG}>
                          <div className={styles.csNum}>1</div>
                          <div className={styles.csConn}></div>
                        </div>
                        <div className={styles.csBody}>
                          <div className={styles.csStepTitle}>Refund Calculated</div>
                          <div className={styles.csStepSub}>
                            Applicable cancellation fee is deducted from the amount you&apos;ve paid.
                          </div>
                        </div>
                      </div>
                      <div className={styles.csStep}>
                        <div className={styles.csG}>
                          <div className={styles.csNum}>2</div>
                          <div className={styles.csConn}></div>
                        </div>
                        <div className={styles.csBody}>
                          <div className={styles.csStepTitle}>Vendors Notified</div>
                          <div className={styles.csStepSub}>
                            Your booking slots are released and vendors are informed right away.
                          </div>
                        </div>
                      </div>
                      <div className={styles.csStep}>
                        <div className={styles.csG}>
                          <div className={styles.csNum}>3</div>
                        </div>
                        <div className={styles.csBody}>
                          <div className={styles.csStepTitle}>Refund to Your Card</div>
                          <div className={styles.csStepSub}>
                            Credited to {cardBrand} •••• {cardLastFour} within 3–5 business days.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </TwoColumnLayout>
            </>
          )}
        </Container>
      </div>
      <Footer />
    </>
  );
}
