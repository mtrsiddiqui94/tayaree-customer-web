'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import styles from './orders.module.css';

interface OrderItem {
  id: number;
  order_id: number;
  service_id: number;
  name: string;
  item_name: string;
  price: string;
  quantity: number;
  image_url: string;
  status: string;
  timeOfDayLabel?: string;
  variantName?: string;
  [key: string]: any;
}

interface Order {
  id: number;
  order_number: string;
  order_date: string;
  total_amount: string;
  status: string;
  status_id: number;
  payment_status: string;
  items: OrderItem[];
  packageName: string;
  vendorName: string;
  imageUrl: string;
  quantity: number;
  deliveryDate: string;
  timeOfDayLabel: string;
  itemsCount: number;
  deliverAs: string;
  noOfGuests: number;
  [key: string]: any;
}

interface OrderBuyAgain {
  endpointUri: string;
  itemName: string;
  imageUrl: string;
  price?: string;
}

// Review Drawer state
interface ReviewState {
  open: boolean;
  orderId: number | null;
  orderName: string;
  imageUrl: string;
  stars: number;
  hoverStar: number;
  comment: string;
  submitting: boolean;
}

type TabKey = 'all' | 'active' | 'transit' | 'delivered' | 'cancelled';
type DateFilter = 'all' | '3m' | '6m' | '12m';

const STAR_LABELS = ['', 'Terrible', 'Bad', 'OK', 'Good', 'Excellent'];

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [buyAgainItems, setBuyAgainItems] = useState<OrderBuyAgain[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [review, setReview] = useState<ReviewState>({
    open: false,
    orderId: null,
    orderName: '',
    imageUrl: '',
    stars: 0,
    hoverStar: 0,
    comment: '',
    submitting: false,
  });

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/orders');
      return;
    }
    loadData();
  }, []);

  // Close review drawer on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && review.open) closeReview();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [review.open]);

  const formatPrice = (val: any) => {
    if (val === undefined || val === null || val === '') return 'unset';
    const valStr = val.toString();
    if (valStr.includes('PKR') || valStr === 'unset') return valStr;
    if (/^\d+(\.\d+)?$/.test(valStr)) {
      const parsedNum = parseFloat(valStr);
      return `PKR ${parsedNum.toLocaleString('en-US')}`;
    }
    return `PKR ${valStr}`;
  };

  async function loadData() {
    try {
      setIsLoading(true);

      // Fetch Buy Again Items
      const buyAgainRes = await api.get<{ status: boolean; data: any[] }>('/api/v1/order/buy-again').catch(() => null);
      if (buyAgainRes?.status && buyAgainRes.data) {
        setBuyAgainItems(buyAgainRes.data.map(e => ({
          endpointUri: e.endpoint_uri || e.endpointUri || '#',
          itemName: e.item_name || e.itemName || 'unset',
          imageUrl: e.image_url || e.imageUrl || '',
          price: e.price || e.rate_per_head || '',
        })));
      }

      // Fetch Orders
      const res = await api.get<{ status: boolean; data: any[] }>('/api/v1/order/list?limit=50&page=1');
      if (res.status && res.data) {
        const parsedOrders: Order[] = [];

        res.data.forEach((section: any) => {
          const bodyList = section.body || [];
          bodyList.forEach((ord: any) => {
            const ordItems: OrderItem[] = (ord.items || []).map((itm: any) => ({
              id: itm.item_id || 0,
              order_id: ord.order_id || 0,
              service_id: itm.item_id || 0,
              name: itm.item_name || 'unset',
              item_name: itm.item_name || 'unset',
              price: itm.price || 'unset',
              quantity: ord.quantity || 1,
              image_url: itm.image_url || '',
              status: itm.item_status || 'Booked',
              variantName: itm.variant_name || (() => {
                const explicitVariants = [itm.color, itm.size, itm.duration, itm.timeslot, itm.days]
                  .filter(v => v && typeof v === 'string' && v.toLowerCase() !== 'unset' && v.trim() !== '');
                if (explicitVariants.length > 0) return explicitVariants.join(' - ');
                const infos = [itm.info1_label, itm.info2_label, itm.info3_label, itm.info4_label, itm.info1Label, itm.info2Label, itm.info3Label, itm.info4Label]
                  .filter(v => v && typeof v === 'string' && v.toLowerCase() !== 'unset' && v.trim() !== '');
                const variants = infos.filter(v => !v.toLowerCase().includes('delivery') && !v.toLowerCase().includes('date'));
                return variants.length > 0 ? variants.join(' - ') : '';
              })()
            }));

            const rawNum = ord.order_number || ord.order_package_line_id || ord.order_id;
            const formattedNum = String(rawNum).startsWith('#') ? String(rawNum) : `#${rawNum}`;

            // Check if order was cancelled
            let finalStatus = String(ord.package_status || ord.status || 'Confirmed');
            try {
              const confirmedCancel = localStorage.getItem('confirmed_cancellation');
              if (confirmedCancel) {
                const parsedC = JSON.parse(confirmedCancel);
                if (
                  String(parsedC.orderId) === String(ord.order_id) ||
                  String(parsedC.orderId) === String(ord.order_package_line_id)
                ) {
                  finalStatus = 'Cancelled';
                }
              }
            } catch {}

            parsedOrders.push({
              id: ord.order_id,
              order_number: formattedNum,
              order_date: ord.booking_date || ord.delivery_date || 'unset',
              total_amount: formatPrice(ord.rate_per_head || ord.per_head_amount || ord.total_amount),
              status: finalStatus,
              status_id: 1,
              payment_status: String(ord.payment_status || ord.payment_status_text || 'unset'),
              items: ordItems,
              packageName: ord.package_name || 'unset',
              vendorName: ord.vendor_name || ord.store_name || (ord.vendor && ord.vendor.name) || 'unset',
              imageUrl: ord.image_url || '',
              quantity: ord.quantity || 1,
              deliveryDate: ord.delivery_date || 'unset',
              timeOfDayLabel: ord.time_of_day_label || '',
              itemsCount: ord.items_count || ordItems.length,
              deliverAs: ord.package_deliver_as || 'package',
              noOfGuests: ord.no_of_guests || 0,
            });
          });
        });

        setOrders(parsedOrders);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load orders history.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Date filter helper ──────────────────────────────────────────────
  const isWithinMonths = useCallback((dateStr: string, months: number) => {
    if (!dateStr || dateStr === 'unset') return true;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return true;
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);
      return date >= cutoff;
    } catch {
      return true;
    }
  }, []);

  // ── Status helpers ──────────────────────────────────────────────────
  const isDelivered = (status: string) =>
    status.toLowerCase().includes('complete') || status.toLowerCase().includes('delivered');

  const matchesTab = (ord: Order, tab: TabKey) => {
    const s = ord.status.toLowerCase();
    if (tab === 'all') return true;
    if (tab === 'active') return s.includes('pending') || s.includes('placed') || s.includes('booked') || s.includes('confirmed');
    if (tab === 'transit') return s.includes('transit');
    if (tab === 'delivered') return isDelivered(ord.status);
    if (tab === 'cancelled') return s.includes('cancel');
    return true;
  };

  // ── Filtered orders ─────────────────────────────────────────────────
  const filteredOrders = orders.filter(ord => {
    if (!matchesTab(ord, activeTab)) return false;
    if (dateFilter !== 'all') {
      const months = dateFilter === '3m' ? 3 : dateFilter === '6m' ? 6 : 12;
      if (!isWithinMonths(ord.order_date, months)) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !ord.packageName.toLowerCase().includes(q) &&
        !ord.order_number.toLowerCase().includes(q) &&
        !ord.vendorName.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  // ── Tab counts ──────────────────────────────────────────────────────
  const tabCounts = {
    all: orders.length,
    active: orders.filter(o => matchesTab(o, 'active')).length,
    transit: orders.filter(o => matchesTab(o, 'transit')).length,
    delivered: orders.filter(o => matchesTab(o, 'delivered')).length,
    cancelled: orders.filter(o => matchesTab(o, 'cancelled')).length,
  };

  // ── Status style helpers ────────────────────────────────────────────
  const getStatusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('complete') || s.includes('delivered')) return styles.confirmed;
    if (s.includes('transit')) return styles.transit;
    if (s.includes('cancel')) return styles.cancelled;
    return styles.pending;
  };

  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('complete') || s.includes('delivered')) return 'bx bx-check-circle';
    if (s.includes('transit')) return 'bx bx-truck';
    if (s.includes('cancel')) return 'bx bx-x-circle';
    return 'bx bx-time-five';
  };

  // ── Review drawer helpers ───────────────────────────────────────────
  const openReview = (ord: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setReview(prev => ({
      ...prev,
      open: true,
      orderId: ord.id,
      orderName: ord.packageName,
      imageUrl: ord.imageUrl,
      stars: 0,
      hoverStar: 0,
      comment: '',
    }));
  };

  const closeReview = () => setReview(prev => ({ ...prev, open: false }));

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (review.stars === 0) {
      showToast('Please select a star rating.', 'info');
      return;
    }
    setReview(prev => ({ ...prev, submitting: true }));
    try {
      await api.post('/api/v1/order/review', {
        order_id: review.orderId,
        rating: review.stars,
        comment: review.comment,
      });
      showToast('Thank you! Your review has been submitted.', 'success');
      closeReview();
    } catch {
      showToast('Failed to submit review. Please try again.', 'error');
    } finally {
      setReview(prev => ({ ...prev, submitting: false }));
    }
  };

  return (
    <DashboardLayout breadcrumbTitle="My Orders">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', right: '20px',
          backgroundColor: toast.type === 'success' ? 'var(--success)' : toast.type === 'error' ? 'var(--primary)' : '#0277bd',
          color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: 10000,
          boxShadow: 'var(--shadow-md)', fontFamily: 'Poppins, sans-serif', fontSize: '13px',
          fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <i className={toast.type === 'success' ? 'bx bx-check-circle' : toast.type === 'error' ? 'bx bx-error-circle' : 'bx bx-info-circle'} style={{ fontSize: '18px' }}></i>
          {toast.message}
        </div>
      )}

      {/* Review Drawer */}
      {review.open && (
        <>
          <div className={`${styles.drawerOverlay} ${styles.open}`} onClick={closeReview} />
          <div className={`${styles.rvdPanel} ${styles.open}`} role="dialog" aria-modal="true" aria-label="Rate your order">
            <div className={styles.rvdHead}>
              <div>
                <div className={styles.rvdEyebrow}>Rate Your Experience</div>
                <div className={styles.rvdTitle}>How did it go?</div>
                <div className={styles.rvdSub}>{review.orderName}</div>
              </div>
              <button className={styles.rvdClose} onClick={closeReview} aria-label="Close">
                <i className="bx bx-x"></i>
              </button>
            </div>
            <form className={styles.rvdBody} onSubmit={submitReview}>
              {review.imageUrl && (
                <img
                  src={review.imageUrl}
                  alt={review.orderName}
                  className={styles.rvdImg}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <div className={styles.rvdStarLabel}>{review.hoverStar > 0 ? STAR_LABELS[review.hoverStar] : review.stars > 0 ? STAR_LABELS[review.stars] : 'Tap to rate'}</div>
              <div className={styles.starPick}>
                {[1, 2, 3, 4, 5].map(s => (
                  <i
                    key={s}
                    className={`bx bxs-star${(review.hoverStar || review.stars) >= s ? ' ' + styles.on : ''}`}
                    onMouseEnter={() => setReview(p => ({ ...p, hoverStar: s }))}
                    onMouseLeave={() => setReview(p => ({ ...p, hoverStar: 0 }))}
                    onClick={() => setReview(p => ({ ...p, stars: s }))}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </div>
              <div className={styles.rvdSec}>Tell us more (optional)</div>
              <textarea
                className={styles.rvdTextarea}
                rows={4}
                placeholder="Share your experience with this order..."
                value={review.comment}
                onChange={e => setReview(p => ({ ...p, comment: e.target.value }))}
                maxLength={500}
              />
              <div className={styles.rvdFooter}>
                <button type="button" className={styles.rvdSkip} onClick={closeReview}>
                  <i className="bx bx-x"></i> Skip
                </button>
                <button type="submit" className={styles.rvdSubmit} disabled={review.submitting}>
                  {review.submitting
                    ? <><i className="bx bx-loader-alt bx-spin"></i> Submitting...</>
                    : <><i className="bx bx-send"></i> Submit Review</>}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      <div className={styles.dashContent}>
        <div className={styles.pageHead}>
          <div className={styles.pageTitle}>My Orders</div>
          <div className={styles.pageSub}>View and manage all your orders, deliveries and payments.</div>
        </div>

        {/* Buy Again */}
        {!isLoading && buyAgainItems.length > 0 && (
          <div className={styles.buyAgainSection}>
            <div className={styles.buyAgainHeader}>
              <div className={styles.buyAgainTitle}>Buy Again</div>
              <Link href="/service-listing" className={styles.seeAll}>
                See all <i className='bx bx-chevron-right'></i>
              </Link>
            </div>
            <div className={styles.buyAgainScroll}>
              {buyAgainItems.map((ba, i) => (
                <Link href={ba.endpointUri} className={styles.baCard} key={i}>
                  <img
                    className={styles.baImg}
                    src={ba.imageUrl || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=260&h=180&q=80'}
                    alt={ba.itemName}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=260&h=180&q=80'; }}
                  />
                  <div className={styles.baInfo}>
                    <div className={styles.baName}>{ba.itemName}</div>
                    {ba.price && <div className={styles.baPrice}>{formatPrice(ba.price)}</div>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Status Tabs */}
        <div className={styles.statusTabs}>
          {(['all', 'active', 'transit', 'delivered', 'cancelled'] as TabKey[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${styles.statusTab} ${activeTab === tab ? styles.active : ''}`}
            >
              {tab === 'all' ? 'All' : tab === 'active' ? 'Active' : tab === 'transit' ? 'In Transit' : tab === 'delivered' ? 'Delivered' : 'Cancelled'}
              <span className={styles.tabCount}>{tabCounts[tab]}</span>
            </button>
          ))}
        </div>

        {/* Filter Row */}
        <div className={styles.filterRow}>
          <div className={styles.filterSearch}>
            <i className='bx bx-search'></i>
            <input
              type="text"
              placeholder="Search orders by name or #..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {([['all', 'All'], ['3m', '3 Months'], ['6m', '6 Months'], ['12m', '12 Months']] as [DateFilter, string][]).map(([val, label]) => (
            <button
              key={val}
              className={`${styles.filterChip} ${dateFilter === val ? styles.active : ''}`}
              onClick={() => setDateFilter(val)}
            >
              {label}
            </button>
          ))}
          <button className={styles.filterChip}>
            <i className='bx bx-calendar'></i> Custom
          </button>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
            <p style={{ marginTop: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>Loading orders portfolio...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIc}><i className="bx bx-calendar-x"></i></div>
            <div className={styles.emptyStateTitle}>No orders found</div>
            <div className={styles.emptyStateSub}>
              {searchQuery ? `No orders matching "${searchQuery}"` : 'No bookings found for the selected filters.'}
            </div>
            <Link href="/" className={styles.emptyStateBtn}>
              <i className="bx bx-compass"></i> Explore Services
            </Link>
          </div>
        ) : (
          <div>
            {filteredOrders.map((ord, index) => {
              const delivered = isDelivered(ord.status);
              return (
                <div
                  key={`${ord.id}-${index}`}
                  className={styles.orderCard}
                  onClick={() => {
                    const isMega = ord.deliverAs === 'mega' || ord.packageName.toLowerCase().includes('mega') || (ord.endpoint && ord.endpoint.includes('mega'));
                    router.push(isMega ? `/orders/${ord.id}/mega` : `/orders/${ord.id}`);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const isMega = ord.deliverAs === 'mega' || ord.packageName.toLowerCase().includes('mega') || (ord.endpoint && ord.endpoint.includes('mega'));
                      router.push(isMega ? `/orders/${ord.id}/mega` : `/orders/${ord.id}`);
                    }
                  }}
                >
                  <div className={styles.ocPad}>
                    {/* Card Header */}
                    <div className={styles.ciHeader}>
                      {/* Package Image */}
                      {ord.imageUrl ? (
                        <img
                          className={styles.ciImg}
                          src={ord.imageUrl}
                          alt={ord.packageName}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=220&h=220&q=80'; }}
                        />
                      ) : (
                        <div className={styles.ciImg} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--input-bg)' }}>
                          <i className='bx bx-package' style={{ fontSize: '32px', color: 'var(--text-muted)' }}></i>
                        </div>
                      )}

                      <div className={styles.ciHeadInfo}>
                        <div className={styles.ciHeadTop}>
                          <div className={styles.ciTitleBlock}>
                            <div className={styles.ciName}>{ord.packageName}</div>
                            <div className={styles.ciVendor}>
                              <i className='bx bx-store' style={{ fontSize: '13px' }}></i> {ord.vendorName}
                            </div>
                          </div>
                          <div className={styles.ciHeadBadges}>
                            <span className={`${styles.ciStatus} ${getStatusClass(ord.status)}`}>
                              <i className={getStatusIcon(ord.status)}></i>{ord.status}
                            </span>
                            {(ord.payment_status || '').toString().toLowerCase().includes('paid') && (
                              <span className={`${styles.ciStatus} ${styles.confirmed}`}>
                                <i className='bx bx-credit-card'></i>Booking Paid
                              </span>
                            )}
                          </div>
                        </div>

                        <div className={styles.ciMetaRow}>
                          {ord.noOfGuests > 0 && (
                            <span className={styles.ciMeta}><i className='bx bx-group'></i>{ord.noOfGuests} Guests</span>
                          )}
                          {ord.timeOfDayLabel && (
                            <span className={styles.ciMeta}><i className='bx bx-sun'></i>{ord.timeOfDayLabel}</span>
                          )}
                          <span className={styles.ciMeta}><i className='bx bx-food-menu'></i>{ord.itemsCount} Items</span>
                          <span className={styles.ciMeta}>
                            <i className='bx bx-package'></i>
                            {ord.deliverAs === 'package' ? 'Single Delivery' : 'Partial Delivery'}
                          </span>
                        </div>

                        <div className={styles.ocDate}>
                          <i className='bx bx-calendar'></i>Delivery: {ord.deliveryDate}
                        </div>
                      </div>
                    </div>

                    {/* Items carousel + delivery message */}
                    <div className={styles.ciContent}>
                      <div className={styles.ciCarouselWrap}>
                        <div className={styles.ciPhotoCarousel}>
                          {ord.items.map((itm, idx) => (
                            <div className={styles.ciPhotoCard} key={idx}>
                              {itm.image_url ? (
                                <img
                                  src={itm.image_url}
                                  alt={itm.item_name}
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=200&h=160&q=80'; }}
                                />
                              ) : (
                                <div style={{ width: '104px', height: '84px', background: 'var(--input-bg)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                                  <i className='bx bx-image' style={{ fontSize: '24px', color: 'var(--text-muted)' }}></i>
                                </div>
                              )}
                              <div className={styles.ciPhotoName}>{itm.item_name}</div>
                              <div className={styles.ciPhotoVar}>{itm.variantName || 'Standard'}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={`${styles.ocDelivMsg} ${ord.deliverAs === 'package' ? styles.same : styles.diff}`}>
                        <i className={ord.deliverAs === 'package' ? 'bx bx-check-circle' : 'bx bx-info-circle'}></i>
                        {ord.deliverAs === 'package'
                          ? `All ${ord.itemsCount} items delivered on the same day`
                          : `Items will be delivered in multiple shipments`}
                      </div>
                    </div>
                  </div>

                  {/* Rate Prompt — only for delivered orders */}
                  {delivered && (
                    <div className={styles.ocRatePrompt} onClick={e => e.stopPropagation()}>
                      <div className={styles.ocRateIc}><i className="bx bxs-star"></i></div>
                      <div className={styles.ocRateTxt}>
                        <div className={styles.ocRateTitle}>How was your experience?</div>
                        <div className={styles.ocRateSub}>Rate &amp; review to help other customers</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button className={styles.ocRateBtn} onClick={e => openReview(ord, e)}>
                          <i className="bx bx-star"></i> Rate Experience
                        </button>
                        <Link
                          href={`/orders/${ord.id}`}
                          className={styles.ocRateBtnOutline}
                          onClick={e => e.stopPropagation()}
                        >
                          <i className="bx bx-detail"></i> View Order
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
