'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Container, TwoColumnLayout } from '@/components/layout/Container';
import { api } from '@/lib/api';
import styles from './cancel.module.css';

interface OrderPackageToCancel {
  id: string | number;
  name: string;
  vendor: string;
  img: string;
  status: string;
  statusClass: 'green' | 'amber' | 'blue' | 'red';
  isCancellable: boolean;
  restrictionReason?: string;
  amountPaid: number;
  futureAmount: number;
  totalPrice: number;
  deliveryDate: string;
}

const REASONS = [
  'Event postponed / date change required',
  'Found an alternative vendor or package',
  'Financial or budget adjustments',
  'Order placed by mistake',
  'Other reason',
];

function calculateDaysUntilEvent(dateStr: string): number {
  if (!dateStr || dateStr === 'unset') return 30;
  try {
    const eventDate = new Date(dateStr);
    if (isNaN(eventDate.getTime())) return 30;
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 30;
  }
}

export default function CancelOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const orderId = unwrappedParams.id;

  const [packages, setPackages] = useState<OrderPackageToCancel[]>([]);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [selectedReason, setSelectedReason] = useState<string | null>(REASONS[0]);
  const [commentNote, setCommentNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
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

  const [isOrderAmtOpen, setIsOrderAmtOpen] = useState(false);

  const [orderMeta, setOrderMeta] = useState({
    orderNumber: `#TAY-${orderId}`,
    orderDate: '',
    eventDate: '',
    daysUntilEvent: 30,
    orderTotal: 0,
    packagesTotal: 0,
    shippingTotal: 0,
    taxesTotal: 0,
    paidAtCheckout: 0,
    futurePayments: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isAlreadyCancelled, setIsAlreadyCancelled] = useState(false);
  const [error, setError] = useState('');

  const formatPrice = (num: number) => `PKR ${num.toLocaleString('en-US')}`;

  const loadOrderData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      let detailData: any = null;
      try {
        const res = await api.get<{ status: boolean; data: any }>(
          `/api/v1/order/items/${orderId}/detail/${orderId}?is_full=1`
        );
        if (res?.status && res.data) detailData = res.data;
      } catch {
        // Fallback
      }

      let listData: any = null;
      try {
        const listRes = await api.get<{ status: boolean; data: any }>(`/api/v1/order/list?order_id=${orderId}`);
        if (listRes?.status && listRes.data) listData = listRes.data;
      } catch {
        // Fallback
      }

      const rawItems: any[] = detailData?.line_item || (listData?.body?.[0]?.items ? listData.body[0].items : []);
      const firstItem = rawItems[0] || detailData || {};

      const rawOrdNum =
        detailData?.order_detail?.order_number ||
        detailData?.order_number ||
        firstItem?.order_package_line_id ||
        firstItem?.order_number ||
        orderId;

      const formattedOrdNum = String(rawOrdNum).startsWith('#')
        ? String(rawOrdNum)
        : (String(rawOrdNum).includes('-') ? `#${rawOrdNum}` : `#SXE-224-${String(rawOrdNum).padStart(6, '0')}`);
      const evDate = detailData?.event_date || firstItem?.delivery_date || firstItem?.event_date || '';
      const daysLeft = calculateDaysUntilEvent(evDate);

      let pkgSum = 0;
      let paidSum = 0;

      function parsePriceNumber(val: any): number {
        if (val === undefined || val === null || val === '') return 0;
        if (typeof val === 'number') return val;
        const numStr = String(val).replace(/[^0-9.]/g, '');
        const parsed = parseFloat(numStr);
        return isNaN(parsed) ? 0 : parsed;
      }

      const parsedPkgs: OrderPackageToCancel[] = (rawItems.length > 0 ? rawItems : [firstItem]).map((itm: any, idx: number) => {
        const status = (itm.package_status || itm.status || 'Confirmed').toLowerCase();
        const isDelivered = status.includes('deliver') || status.includes('complete');
        const isTransit = status.includes('out') || status.includes('transit');
        const isCancellable = !isDelivered && !isTransit;

        const total =
          parsePriceNumber(itm.order_total) ||
          parsePriceNumber(itm.total_amount) ||
          parsePriceNumber(itm.amount) ||
          parsePriceNumber(itm.price) ||
          parsePriceNumber(itm.rate_per_head) ||
          parsePriceNumber(detailData?.order_detail?.order_total) ||
          parsePriceNumber(detailData?.order_detail?.total_amount) ||
          parsePriceNumber(listData?.body?.[0]?.rate_per_head) ||
          parsePriceNumber(listData?.body?.[0]?.total_amount) ||
          0;

        const paid =
          parsePriceNumber(itm.amount_paid) ||
          parsePriceNumber(itm.paid_amount) ||
          parsePriceNumber(detailData?.order_detail?.amount_paid) ||
          Math.round(total * 0.3);

        const future = Math.max(0, total - paid);

        pkgSum += total;
        paidSum += paid;

        return {
          id: itm.order_package_line_id || itm.id || idx + 1,
          name: itm.package_name || itm.item_name || itm.name || 'Package',
          vendor: itm.vendor_name || itm.store_name || 'Vendor',
          img: itm.image_url || '',
          status: isDelivered ? 'Delivered' : isTransit ? 'In Transit' : 'Confirmed',
          statusClass: isDelivered ? 'green' : isTransit ? 'amber' : 'blue',
          isCancellable,
          restrictionReason: !isCancellable ? (isDelivered ? 'Package has already been delivered.' : 'Package is currently out for delivery.') : undefined,
          amountPaid: paid,
          futureAmount: future,
          totalPrice: total,
          deliveryDate: itm.delivery_date || evDate || 'Scheduled Date',
        };
      });

      const shipping = detailData?.shipping_amount ? parseFloat(detailData.shipping_amount) : 0;
      const taxes = detailData?.tax_amount ? parseFloat(detailData.tax_amount) : 0;
      const grandTotal = pkgSum + shipping + taxes;

      setOrderMeta({
        orderNumber: formattedOrdNum,
        orderDate: detailData?.booking_date || firstItem?.booking_date || '',
        eventDate: evDate,
        daysUntilEvent: daysLeft,
        orderTotal: grandTotal,
        packagesTotal: pkgSum,
        shippingTotal: shipping,
        taxesTotal: taxes,
        paidAtCheckout: paidSum,
        futurePayments: Math.max(0, grandTotal - paidSum),
      });

      setPackages(parsedPkgs);
      const cancellable = parsedPkgs.filter((p) => p.isCancellable);
      if (cancellable.length > 0) {
        setSelectedIds([cancellable[0].id]);
      }

      try {
        const confirmedCancel = localStorage.getItem('confirmed_cancellation');
        if (confirmedCancel) {
          const parsedC = JSON.parse(confirmedCancel);
          if (String(parsedC.orderId) === String(orderId)) {
            setIsAlreadyCancelled(true);
          }
        }
      } catch {}
    } catch {
      setError('Failed to load order details for cancellation.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrderData();
  }, [loadOrderData]);

  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => setRecordSec((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      if (recordSec > 0) {
        setHasVoiceNote(true);
        setRecordedDuration(recordSec);
      }
    } else {
      setRecordSec(0);
      setIsRecording(true);
    }
  };

  const toggleSelectPkg = (pkg: OrderPackageToCancel) => {
    if (!pkg.isCancellable) return;
    setSelectedIds((prev) =>
      prev.includes(pkg.id) ? prev.filter((id) => id !== pkg.id) : [...prev, pkg.id]
    );
  };

  const feePercent = orderMeta.daysUntilEvent > 14 ? 10 : orderMeta.daysUntilEvent >= 7 ? 50 : 100;
  const selectedPkgs = packages.filter((p) => selectedIds.includes(p.id));
  const totalPaidForSelected = selectedPkgs.reduce((sum, p) => sum + p.amountPaid, 0);
  const cancellationFeeAmount = Math.round((totalPaidForSelected * feePercent) / 100);
  const estimatedRefundAmount = Math.max(0, totalPaidForSelected - cancellationFeeAmount);

  const canProceed = selectedIds.length > 0 && !!selectedReason;

  const handleProceed = () => {
    if (!canProceed) return;

    const cancelDetails = {
      orderId,
      orderNumber: orderMeta.orderNumber,
      reason: selectedReason,
      comment: commentNote,
      hasVoiceNote,
      recordedDuration,
      amountPaidSoFar: totalPaidForSelected,
      cancellationFeeTotal: cancellationFeeAmount,
      refundTotal: estimatedRefundAmount,
      cancelledPackages: selectedPkgs.map((p) => ({
        id: p.id,
        name: p.name,
        vendor: p.vendor,
        img: p.img,
        amount: p.totalPrice,
        paid: p.amountPaid,
        deliveryDate: p.deliveryDate,
      })),
    };

    localStorage.setItem('temp_cancel_details', JSON.stringify(cancelDetails));
    router.push(`/orders/${orderId}/cancel/summary`);
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
            <Link href={`/orders/${orderId}`}>Order Details</Link>
            <span className={styles.sep}>/</span>
            <span className={styles.current}>Cancel Order</span>
          </nav>

          <div className={styles.pageHead}>
            <div>
              <h1 className={styles.pageTitle}>Cancel Order</h1>
              <p className={styles.pageSub}>
                Select the package(s) you wish to cancel for order {orderMeta.orderNumber}.
              </p>
            </div>
            <Link href={`/orders/${orderId}`} className={styles.backLink}>
              <i className="bx bx-arrow-back"></i> Back to Order
            </Link>
          </div>

          {isLoading && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '36px', color: 'var(--primary)' }}></i>
              <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
                Loading cancellation options…
              </p>
            </div>
          )}

          {!isLoading && error && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <i className="bx bx-error-circle" style={{ fontSize: '40px', color: 'var(--primary)', display: 'block', marginBottom: '12px' }}></i>
              <p>{error}</p>
              <button
                onClick={loadOrderData}
                style={{
                  marginTop: '16px',
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && isAlreadyCancelled && (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card)', borderRadius: 'var(--radius-l)', border: '1px solid var(--border)', margin: '30px 0' }}>
              <i className="bx bx-x-circle" style={{ fontSize: '48px', color: 'var(--primary)', display: 'block', marginBottom: '12px' }}></i>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>Order Already Cancelled</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>This order has already been cancelled. Your refund is being processed to your payment method.</p>
              <Link href={`/orders/${orderId}/cancelled`} className={styles.proceedBtn} style={{ display: 'inline-flex', width: 'auto', padding: '12px 28px' }}>
                View Cancellation Receipt
              </Link>
            </div>
          )}

          {!isLoading && !isAlreadyCancelled && !error && (
            <TwoColumnLayout>
              {/* LEFT COLUMN */}
              <div>
                {/* Warning Banner */}
                <div className={styles.warnBanner}>
                  <i className="bx bx-error-circle"></i>
                  <div>
                    <div className={styles.warnTitle}>Cancellation Policy Notice</div>
                    <div className={styles.warnBody}>
                      {orderMeta.daysUntilEvent > 14
                        ? `Your event is in ${orderMeta.daysUntilEvent} days (more than 14 days lead time). You are eligible for a 90% refund of your paid amount (10% processing fee applies).`
                        : orderMeta.daysUntilEvent >= 7
                        ? `Your event is in ${orderMeta.daysUntilEvent} days (7 to 14 days lead time). A 50% cancellation fee applies.`
                        : `Your event is in ${orderMeta.daysUntilEvent} days (less than 7 days lead time). Vendor preparation is committed and fees are non-refundable.`}
                    </div>
                  </div>
                </div>

                {/* Package Selection Card */}
                <div className={styles.card}>
                  <div className={styles.cardInner}>
                    <div className={styles.cardTitle}>
                      <i className="bx bx-package"></i> Select Packages to Cancel
                      <span className={styles.count}>
                        {selectedIds.length} of {packages.length} selected
                      </span>
                    </div>
                    <div className={styles.cardSubTitle}>
                      Choose individual packages or select all items you want to cancel.
                    </div>

                    <div>
                      {packages.map((pkg) => {
                        const isSelected = selectedIds.includes(pkg.id);
                        const cpkgClass = `${styles.cpkg} ${
                          pkg.isCancellable ? styles.selectable : styles.restricted
                        } ${isSelected ? styles.selected : ''}`;

                        return (
                          <div
                            key={String(pkg.id)}
                            className={cpkgClass}
                            onClick={() => toggleSelectPkg(pkg)}
                          >
                            {pkg.isCancellable ? (
                              <div className={styles.cpkgBox}>
                                <i className="bx bx-check"></i>
                              </div>
                            ) : (
                              <div className={styles.cpkgLock}>
                                <i className="bx bx-lock-alt"></i>
                              </div>
                            )}

                            <div className={styles.cpkgBody}>
                              <div className={styles.ciHeader}>
                                {pkg.img ? (
                                  <img src={pkg.img} alt={pkg.name} className={styles.ciImg} />
                                ) : (
                                  <div className={styles.ciImg} />
                                )}

                                <div className={styles.ciHeadInfo}>
                                  <div className={styles.ciHeadTop}>
                                    <div>
                                      <div className={styles.ciName}>{pkg.name}</div>
                                      <div className={styles.ciVendor}>{pkg.vendor}</div>
                                    </div>
                                    <div className={styles.ciBadges}>
                                      <span className={`${styles.ciStatus} ${styles[pkg.statusClass]}`}>
                                        {pkg.status}
                                      </span>
                                    </div>
                                  </div>

                                  <div className={styles.ciPriceRow}>
                                    <div className={styles.ciPr}>
                                      <span className={styles.ciPrLbl}>Paid Amount</span>
                                      <span className={`${styles.ciPrVal} ${styles.green}`}>
                                        {formatPrice(pkg.amountPaid)}
                                      </span>
                                    </div>
                                    {pkg.futureAmount > 0 && (
                                      <div className={styles.ciPr}>
                                        <span className={styles.ciPrLbl}>Future Due (Waived)</span>
                                        <span className={styles.ciPrVal}>
                                          {formatPrice(pkg.futureAmount)}
                                        </span>
                                      </div>
                                    )}
                                    <div className={styles.ciPr}>
                                      <span className={styles.ciPrLbl}>Event Date</span>
                                      <span className={styles.ciPrVal}>{pkg.deliveryDate}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {!pkg.isCancellable && pkg.restrictionReason && (
                                <div className={styles.cpkgRestrictNote}>
                                  <i className="bx bx-info-circle"></i> {pkg.restrictionReason}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Reason Selection Card */}
                <div className={styles.card}>
                  <div className={styles.cardInner}>
                    <div className={styles.cardTitle}>
                      <i className="bx bx-help-circle"></i> Why are you cancelling?
                    </div>
                    <div className={styles.cardSubTitle}>
                      Please select a reason to help us improve our vendor services.
                    </div>

                    <div className={styles.reasonsList}>
                      {REASONS.map((r, idx) => {
                        const isSel = selectedReason === r;
                        const reasonClass = `${styles.reasonItem} ${isSel ? styles.selected : ''}`;
                        return (
                          <div
                            key={idx}
                            className={reasonClass}
                            onClick={() => setSelectedReason(r)}
                          >
                            <div className={styles.reasonRadio}>
                              {isSel && <div className={styles.reasonRadioDot} />}
                            </div>
                            <span className={styles.reasonText}>{r}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Note & Voice Area */}
                    <textarea
                      className={styles.commentBox}
                      placeholder="Add an optional comment or explanation for your cancellation..."
                      value={commentNote}
                      onChange={(e) => setCommentNote(e.target.value)}
                    />

                    <div className={styles.voiceBar}>
                      <button
                        type="button"
                        className={`${styles.voiceBtn} ${isRecording ? styles.recording : ''}`}
                        onClick={toggleRecording}
                      >
                        <i className={`bx ${isRecording ? 'bx-stop-circle' : 'bx-microphone'}`}></i>
                        {isRecording ? `Stop Recording (${recordSec}s)` : 'Record Voice Note'}
                      </button>
                      <span className={styles.voiceStatus}>
                        {isRecording
                          ? 'Recording live audio feedback… Click to finish'
                          : hasVoiceNote
                          ? `Voice note recorded (${recordedDuration}s)`
                          : 'Optional audio feedback for support team'}
                      </span>
                    </div>

                    {hasVoiceNote && (
                      <div className={styles.policyNote} style={{ marginTop: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <i className="bx bx-microphone" style={{ fontSize: '18px', color: 'var(--primary)' }}></i>
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Voice Note Attached ({recordedDuration}s)
                          </span>
                          <button
                            type="button"
                            onClick={togglePlayAudio}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              background: isPlayingAudio ? 'var(--primary)' : 'var(--card)',
                              color: isPlayingAudio ? '#fff' : 'var(--primary)',
                              border: '1px solid var(--primary)',
                              borderRadius: 'var(--radius-full)',
                              padding: '3px 10px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              marginLeft: '6px',
                            }}
                          >
                            <i className={`bx ${isPlayingAudio ? 'bx-pause' : 'bx-play'}`} style={{ fontSize: '15px' }}></i>
                            {isPlayingAudio ? 'Playing…' : 'Play Audio'}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setHasVoiceNote(false);
                            setRecordedDuration(0);
                            setRecordSec(0);
                            setIsPlayingAudio(false);
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT SIDEBAR */}
              <aside>
                <div className={styles.sidebarSticky}>
                  <div className={styles.summaryCard}>
                    <div className={styles.sidebarHead}>
                      <div className={styles.shEyebrow}>Cancellation Summary</div>
                      <div className={styles.shTitle}>{orderMeta.orderNumber}</div>
                      <div className={styles.shSub}>
                        {selectedIds.length} of {packages.length} package{packages.length !== 1 ? 's' : ''} selected
                      </div>
                    </div>

                    <div className={styles.sumBody}>
                      <div className={styles.sumRow}>
                        <span>Selected Items Paid</span>
                        <span className={styles.sumRowVal}>{formatPrice(totalPaidForSelected)}</span>
                      </div>

                      <div className={styles.sumRow}>
                        <span>Cancellation Fee ({feePercent}%)</span>
                        <span className={`${styles.sumRowVal} ${styles.amber}`}>
                          - {formatPrice(cancellationFeeAmount)}
                        </span>
                      </div>

                      <div className={`${styles.sumRow} ${styles.total}`}>
                        <span>Estimated Refund</span>
                        <span className={`${styles.sumRowVal} ${styles.green}`}>
                          {formatPrice(estimatedRefundAmount)}
                        </span>
                      </div>

                      <div className={styles.policyNote}>
                        <i className="bx bx-time-five"></i>
                        <div>
                          Refund credited to your original payment method within <b>3–5 business days</b>.{' '}
                          <Link href="/cancellation-policy">View cancellation policy</Link>
                        </div>
                      </div>

                      {!selectedReason && (
                        <div className={styles.needReason} style={{ marginTop: '12px' }}>
                          <i className="bx bx-error-circle"></i>
                          <span>Please select a cancellation reason above to continue.</span>
                        </div>
                      )}

                      <button
                        type="button"
                        className={styles.proceedBtn}
                        style={{ marginTop: '14px' }}
                        disabled={!canProceed}
                        onClick={handleProceed}
                      >
                        Proceed to Summary <i className="bx bx-right-arrow-alt"></i>
                      </button>
                    </div>
                  </div>

                  <div className={`${styles.orderAmtBlock} ${isOrderAmtOpen ? styles.open : ''}`}>
                    <button
                      type="button"
                      className={styles.oaHead}
                      onClick={() => setIsOrderAmtOpen(!isOrderAmtOpen)}
                    >
                      <div>
                        <div className={styles.oaLbl}>Order Total</div>
                        <div className={styles.oaNote}>
                          At time of order · {packages.length} package{packages.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className={styles.oaHeadRight}>
                        <span className={styles.oaTotal}>{formatPrice(orderMeta.orderTotal)}</span>
                        <i className={`bx bx-chevron-down ${styles.oaChev}`}></i>
                      </div>
                    </button>

                    <div className={styles.oaBody}>
                      <div className={styles.oaInner}>
                        <div className={styles.oaRow}>
                          Packages ({packages.length})<span>{formatPrice(orderMeta.packagesTotal)}</span>
                        </div>
                        {orderMeta.shippingTotal > 0 && (
                          <div className={styles.oaRow}>
                            Shipping<span>{formatPrice(orderMeta.shippingTotal)}</span>
                          </div>
                        )}
                        {orderMeta.taxesTotal > 0 && (
                          <div className={styles.oaRow}>
                            Taxes &amp; Fees<span>{formatPrice(orderMeta.taxesTotal)}</span>
                          </div>
                        )}
                        <hr className={styles.oaDashed} />
                        <div className={`${styles.oaRow} ${styles.total}`}>
                          Order Total<span>{formatPrice(orderMeta.orderTotal)}</span>
                        </div>
                        <div className={`${styles.oaRow} ${styles.sub}`}>
                          Paid at Checkout<span>{formatPrice(orderMeta.paidAtCheckout)}</span>
                        </div>
                        <div className={`${styles.oaRow} ${styles.sub}`}>
                          Future Payments<span>{formatPrice(orderMeta.futurePayments)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </TwoColumnLayout>
          )}
        </Container>
      </div>
      <Footer />
    </>
  );
}
