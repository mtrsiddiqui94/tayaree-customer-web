'use client';

/* eslint-disable @next/next/no-img-element, react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from './package-detail.module.css';

interface PageProps {
  params: Promise<{ category: string; id: string }>;
}

export default function PackageDetailPage({ params }: PageProps) {
  const { category, id } = React.use(params);
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

  // Dynamic States
  const [detail, setDetail] = useState<any>(null);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  // Format Helper
  const formatPrice = (val: string | number | undefined | null) => {
    if (val === undefined || val === null || val === '') return 'unset';
    const valStr = val.toString().trim();
    if (valStr === 'unset') return valStr;
    let formatted = valStr.replace(/,/g, '').replace(/\b\d+\b/g, (match: string) => {
      const num = parseInt(match, 10);
      return num.toLocaleString('en-US');
    });
    if (!formatted.includes('PKR') && !formatted.includes('%') && !formatted.startsWith('/') && !formatted.includes('per')) {
      formatted = `PKR ${formatted}`;
    }
    return formatted;
  };

  useEffect(() => {
    async function loadData() {
      if (!orderId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [detailRes, paymentRes] = await Promise.all([
          api.get<any>(`/api/v1/order/items/${id}/detail/${orderId}`),
          api.get<any>(`/api/v1/order/payments/${orderId}`)
        ]);

        if (detailRes.status && detailRes.data) {
          setDetail(detailRes.data);
        }
        if (paymentRes.status && paymentRes.data) {
          setPaymentInfo(paymentRes.data);
        }
      } catch (e) {
        console.error('Error fetching order package details:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id, orderId]);

  const categoryTitle = category
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : 'Services';

  if (isLoading) {
    return (
      <>
        <Header />
        <div className={styles.loaderWrap}>
          <div className={styles.spinner}></div>
          <p>Loading package specifications...</p>
        </div>
        <Footer />
      </>
    );
  }

  // Sourced Package Node
  const packageNode = detail?.lineItem?.[0];

  // Resolve Package Name
  const resolvedPackageName = packageNode?.itemName || 'Gold Event Package';
  const resolvedVendorName = packageNode?.vendorName || 'unset';
  const resolvedTotal = packageNode?.orderTotal || detail?.orderDetail?.orderTotal || '114750';

  // Build Included Items List
  const displayItems = packageNode?.serviceItems && packageNode.serviceItems.length > 0
    ? packageNode.serviceItems
    : [
        {
          id: 'mock-i1',
          itemName: 'Chicken Biryani',
          itemDescription: 'Aromatic basmati rice with tender chicken, saffron & whole spices.',
          imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=120&h=120&q=80',
          itemStatus: 'Standard',
          info2Label: '250 Servings',
          info3Label: 'Halal',
        },
        {
          id: 'mock-i2',
          itemName: 'Beef Pulao',
          itemDescription: 'Slow-cooked beef pulao in seasoned stock with caramelized onions.',
          imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=120&h=120&q=80',
          itemStatus: 'Standard',
          info2Label: '250 Servings',
          info3Label: 'Halal',
        },
        {
          id: 'mock-i3',
          itemName: 'Raita & Salad Bar',
          itemDescription: 'Fresh mint raita, kachumber salad and seasonal greens, refilled live.',
          imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=120&h=120&q=80',
          itemStatus: 'Standard',
          info2Label: 'Unlimited',
          info3Label: 'Vegetarian',
        }
      ];

  // Build Timeline Items
  const timelineItems: any[] = [];
  if (paymentInfo?.history && paymentInfo.history.length > 0) {
    paymentInfo.history.forEach((h: any) => {
      timelineItems.push({
        id: `h-${h.scheduleId || Math.random()}`,
        label: h.description || 'Advance / Installment',
        date: h.paymentDate ? `Paid on ${h.paymentDate}` : 'Paid',
        pct: h.percentage ? `${h.percentage}%` : '',
        status: 'Paid',
        statusClass: 'success',
        amount: h.amount,
        isPaid: true
      });
    });
  }

  if (paymentInfo?.upcoming && paymentInfo.upcoming.length > 0) {
    paymentInfo.upcoming.forEach((u: any) => {
      timelineItems.push({
        id: `u-${u.scheduleId || Math.random()}`,
        label: u.description || 'Remaining Balance',
        date: u.dueDate ? `Due ${u.dueDate}${u.cardLastFour ? ` · auto-charge ${u.cardType || 'Card'} ending in ${u.cardLastFour}` : ''}` : 'Scheduled',
        pct: u.percentage ? `${u.percentage}%` : '',
        status: u.daysUntilDue < 0 ? 'Overdue' : 'Scheduled',
        statusClass: u.daysUntilDue < 0 ? 'warning' : 'active',
        amount: u.amount,
        isPaid: false
      });
    });
  }

  // Fallback Timeline if empty
  const displayTimeline = timelineItems.length > 0
    ? timelineItems
    : [
        {
          id: 'mock-t1',
          label: 'Reservation Payment',
          date: 'Paid on 10 March 2025',
          pct: '30%',
          status: 'Paid',
          statusClass: 'success',
          amount: 34425,
          isPaid: true
        },
        {
          id: 'mock-t2',
          label: 'Final Balance',
          date: 'Due March 14, 2025 · auto-charge Visa',
          pct: '70%',
          status: 'Scheduled',
          statusClass: 'active',
          amount: 80325,
          isPaid: false
        }
      ];

  // Tab Stats
  const upcomingCount = paymentInfo?.summary?.upcoming?.dueCount || (displayTimeline.filter(t => !t.isPaid).length);
  const historyCount = paymentInfo?.summary?.history?.paidCount || (displayTimeline.filter(t => t.isPaid).length);

  const upcomingTotal = paymentInfo?.summary?.upcoming?.pastDueTotal || paymentInfo?.totalDue || 80325;
  const historyTotal = paymentInfo?.totalPaid || 34425;

  const cardLastFour = paymentInfo?.paymentMethod?.cardLastFour;
  const cardType = paymentInfo?.paymentMethod?.cardType;
  const resolvedPaymentMethodStr = cardLastFour
    ? `${cardType || 'Card'} ending in ${cardLastFour}`
    : (paymentInfo?.paymentMethod?.paymentMethod || 'Visa ending in 1234');

  // Shipping Address Card
  const resolvedAddress = detail?.shippingAddress || 'House 12, Street 4, DHA Phase 5, Lahore, Punjab 54000';
  const resolvedAddressTitle = detail?.shippingAddressTitle || 'Adnan Siddiqui';

  return (
    <>
      <Header />

      <main className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <Link href="/services">Services</Link>
          <span className={styles.sep}>/</span>
          <Link href={`/services/${category}/packages`}>{categoryTitle} Packages</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Package Details</span>
        </div>

        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{resolvedPackageName}</h1>
          {resolvedVendorName && resolvedVendorName !== 'unset' && (
            <div className={styles.pageSub} style={{ marginTop: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Provided by <strong>{resolvedVendorName}</strong>
            </div>
          )}
        </div>

        {/* Payment Schedule Card */}
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <div className={styles.cardTitle}>
              <i className="bx bx-calendar-event"></i>
              <span>Payment Schedule</span>
            </div>

            <div className={styles.scheduleList}>
              {displayTimeline.map((step, idx) => {
                const isLast = idx === displayTimeline.length - 1;
                return (
                  <div key={step.id} className={styles.scheduleItem}>
                    <div className={styles.timeline}>
                      <div className={`${styles.dot} ${styles[step.statusClass]}`}></div>
                      {!isLast && <div className={styles.line}></div>}
                    </div>
                    <div className={styles.scheduleContent}>
                      <div>
                        <div className={styles.scheduleLabel}>{step.label}</div>
                        <div className={styles.scheduleDate}>{step.date}</div>
                        <div className={styles.scheduleMeta}>
                          {step.pct && <span className={`${styles.pct} ${styles[step.statusClass]}`}>{step.pct}</span>}
                          <span className={`${styles.statusText} ${step.isPaid ? styles.paid : styles.pending}`}>
                            {step.status}
                          </span>
                        </div>
                      </div>
                      <div className={`${styles.amount} ${step.isPaid ? styles.highlight : ''}`}>
                        {formatPrice(step.amount)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Package Total</span>
              <span className={styles.totalVal}>{formatPrice(resolvedTotal)}</span>
            </div>
          </div>
        </div>

        {/* Item Details Card */}
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <div className={styles.cardTitle}>
              <i className="bx bx-food-menu"></i>
              <span>Included Items Details</span>
            </div>

            {displayItems.map((item: any, idx: number) => {
              const itemImg = item.imageUrl || 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=150&q=80';
              const name = item.itemName || 'unset';
              const desc = item.itemDescription || item.description || '';

              // Gather extra chips dynamically from the backend variation details
              const extraChips: string[] = [];
              if (item.itemStatus) extraChips.push(item.itemStatus);
              if (item.info2Label) extraChips.push(item.info2Label);
              if (item.info3Label) extraChips.push(item.info3Label);
              if (item.color) extraChips.push(item.color);
              if (item.size) extraChips.push(item.size);
              if (item.duration) extraChips.push(item.duration);
              if (item.timeslot) extraChips.push(item.timeslot);
              if (item.days) extraChips.push(item.days);

              return (
                <div key={item.id || idx} className={styles.itemRow}>
                  <img
                    src={itemImg}
                    alt={name}
                    className={styles.itemImg}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=150&q=80';
                    }}
                  />
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{name}</div>
                    {desc && <div className={styles.itemSub}>{desc}</div>}
                    {extraChips.length > 0 && (
                      <div className={styles.itemChips}>
                        {extraChips.map((chip, cIdx) => (
                          <span key={cIdx} className={`${styles.chip} ${cIdx === 0 ? styles.primary : ''}`}>
                            {chip}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Details */}
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <div className={styles.cardTitle}>
              <i className="bx bx-map-pin"></i>
              <span>Delivery Details</span>
            </div>

            <div className={styles.addrBlock}>
              <i className={`bx bx-buildings ${styles.addrIcon}`}></i>
              <div>
                <div className={styles.addrName}>{resolvedAddressTitle}</div>
                <div className={styles.addrLine}>
                  {resolvedAddress}
                </div>
                {detail?.deliveryInstructions && (
                  <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--primary)', fontStyle: 'italic' }}>
                    Note: &ldquo;{detail.deliveryInstructions}&rdquo;
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payments Summary Tab */}
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <div className={styles.cardTitle}>
              <i className="bx bx-wallet"></i>
              <span>Payments Overview</span>
            </div>

            <div className={styles.payTabs}>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`${styles.payTab} ${activeTab === 'upcoming' ? styles.active : ''}`}
              >
                Upcoming <span className={styles.payTabCount}>{upcomingCount}</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`${styles.payTab} ${activeTab === 'history' ? styles.active : ''}`}
              >
                History <span className={styles.payTabCount}>{historyCount}</span>
              </button>
            </div>

            {activeTab === 'upcoming' ? (
              <div className={styles.payHero}>
                <div className={styles.payHeroLabel}>Upcoming for this package</div>
                <div className={styles.payHeroAmt}>{formatPrice(upcomingTotal)}</div>
                <div className={styles.payHeroMethod}>Auto-charge scheduled</div>
              </div>
            ) : (
              <div className={styles.payHero}>
                <div className={styles.payHeroLabel}>Total Paid in History</div>
                <div className={styles.payHeroAmt}>{formatPrice(historyTotal)}</div>
                <div className={styles.payHeroMethod}>{resolvedPaymentMethodStr}</div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
