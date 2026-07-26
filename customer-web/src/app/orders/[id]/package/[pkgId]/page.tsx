'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from '../../orderDetail.module.css';

interface SummaryLine {
  label: string;
  value: string;
  isTotal?: boolean;
}

interface ServiceItem {
  name: string;
  description?: string;
  variant?: string;
  servings?: string;
  dietary?: string;
  price?: string;
  image_url?: string;
  images?: string[];
}

interface OrderItem {
  id: number;
  name: string;
  item_name: string;
  price: string;
  quantity: number;
  image_url: string;
  status: string;
  location?: string;
  guests?: string;
  timeOfDay?: string;
  deliverAs?: string;
  serviceItems?: ServiceItem[];
  [key: string]: any;
}

interface Order {
  id: number;
  order_number: string;
  order_date: string;
  total_amount: string;
  amount_paid?: string;
  amount_due_today?: string;
  future_payments?: string;
  savings?: string;
  promo_code?: string;
  status: string;
  status_id: number;
  payment_status: string;
  shipping_address?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  items: OrderItem[];
  allOrdersList?: OrderItem[];
  packageName?: string;
  vendorName?: string;
  imageUrl?: string;
  orderPackageLineId?: number;
  summaryLines?: SummaryLine[];
}

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function PackageDetailPage({ params }: { params: Promise<{ id: string; pkgId: string }> }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const orderId = parseInt(unwrappedParams.id, 10);
  const pkgId = parseInt(unwrappedParams.pkgId, 10);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [payTabActive, setPayTabActive] = useState<'upcoming' | 'history'>('upcoming');

  const [activeModalItem, setActiveModalItem] = useState<ServiceItem | null>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);

  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [reviewStars, setReviewStars] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [applyToAllPackages, setApplyToAllPackages] = useState(false);

  const [sellerDrawerOpen, setSellerDrawerOpen] = useState(false);
  const [sellerStars, setSellerStars] = useState(0);
  const [sellerHover, setSellerHover] = useState(0);
  const [sellerComment, setSellerComment] = useState('');
  const [sellerSubmitting, setSellerSubmitting] = useState(false);
  const [applyToAllSeller, setApplyToAllSeller] = useState(false);

  const [sellerQuestions, setSellerQuestions] = useState<Record<string, 'yes' | 'no' | 'skip'>>({
    itemAsDescribed: 'yes',
    communicative: 'yes',
    commitments: 'yes',
    professional: 'yes',
    orderAgain: 'yes',
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
    loadOrderDetail();
  }, [orderId, pkgId]);

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

  const loadOrderDetail = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ status: boolean; data: any[] }>('/api/v1/order/list?limit=50&page=1');
      if (res.status && res.data) {
        let found: any = null;
        const allPackages: OrderItem[] = [];

        for (const section of res.data) {
          const bodyList = section.body || [];
          bodyList.forEach((ord: any) => {
            allPackages.push({
              id: ord.order_id,
              name: ord.package_name || 'Package',
              item_name: ord.vendor_name || ord.store_name || 'Vendor',
              price: formatPrice(ord.rate_per_head || ord.total_amount),
              quantity: ord.quantity || 1,
              image_url: ord.image_url || '',
              status: ord.package_status || 'Confirmed',
              guests: ord.no_of_guests ? `${ord.no_of_guests} Guests` : undefined,
            });
            if (ord.order_id === orderId) found = ord;
          });
        }

        if (found) {
          try {
            const detailRes = await api.get<{ status: boolean; data: any }>(
              `/api/v1/order/items/${found.order_package_line_id}/detail/${found.order_id}?is_full=1`
            );
            if (detailRes.status && detailRes.data) {
              const d = detailRes.data;

              const rawSummary: any[] = d.summary || [];
              const summaryLines: SummaryLine[] = rawSummary.map((s: any) => {
                const label = s.label_info || s.labelInfo || s.label || '';
                const value = s.label_value || s.labelValue || s.value || '';
                const isTotal = label.toLowerCase().includes('total') || s.is_total === 1;
                return { label, value, isTotal };
              });

              const ordItems: OrderItem[] = (d.line_item || []).map((pkg: any) => {
                const serviceItems: ServiceItem[] = (pkg.service_items || pkg.items || []).map((si: any) => {
                  const mainImg = si.image_url || si.imageUrl || '';
                  return {
                    name: si.item_name || si.name || 'Item',
                    description: si.description || '',
                    variant: si.variant_name || si.color || si.size || '',
                    servings: si.servings || '',
                    dietary: si.dietary || '',
                    price: formatPrice(si.amount || si.price),
                    image_url: mainImg,
                    images: si.images || (mainImg ? [mainImg] : [])
                  };
                });

                return {
                  id: pkg.order_item_id || 0,
                  name: pkg.item_name || found.package_name || 'Package',
                  item_name: pkg.vendor_name || found.vendor_name || '',
                  price: formatPrice(pkg.order_total || pkg.amount || found.total_amount),
                  quantity: pkg.quantity || 1,
                  image_url: pkg.image_url || found.image_url || '',
                  status: pkg.package_status || found.package_status || '',
                  location: pkg.delivery_date || found.delivery_date || '',
                  guests: found.no_of_guests ? `${found.no_of_guests} Guests` : '',
                  timeOfDay: found.time_of_day_label || '',
                  deliverAs: found.package_deliver_as || '',
                  serviceItems
                };
              });

              setOrder({
                id: found.order_id,
                order_number: d.order_detail?.order_number || found.order_number || '',
                order_date: d.order_detail?.order_date || found.booking_date || '',
                total_amount: formatPrice(d.order_detail?.order_total || found.total_amount || 0),
                amount_paid: formatPrice(d.order_detail?.amount_paid || ''),
                amount_due_today: formatPrice(d.order_detail?.amount_due_today || ''),
                future_payments: formatPrice(d.order_detail?.future_payments || ''),
                savings: formatPrice(d.order_detail?.saved_amount || ''),
                promo_code: d.order_detail?.promo_code || '',
                status: found.package_status || '',
                status_id: found.status_id || 1,
                payment_status: d.payment_method?.payment_method_short_name || found.payment_status || '',
                shipping_address: d.shipping_address || '',
                contact_name: d.contact_name || '',
                contact_phone: d.contact_phone || '',
                items: ordItems.length ? ordItems : [{
                  id: found.order_id,
                  name: found.package_name || 'Package',
                  item_name: found.vendor_name || found.store_name || '',
                  price: formatPrice(found.rate_per_head || found.total_amount || 0),
                  quantity: found.quantity || 1,
                  image_url: found.image_url || '',
                  status: found.package_status || '',
                  location: found.delivery_date || '',
                  guests: found.no_of_guests ? `${found.no_of_guests} Guests` : '',
                  timeOfDay: found.time_of_day_label || '',
                  deliverAs: found.package_deliver_as || '',
                  serviceItems: []
                }],
                allOrdersList: allPackages,
                packageName: found.package_name || '',
                vendorName: found.vendor_name || '',
                imageUrl: found.image_url || '',
                orderPackageLineId: found.order_package_line_id || 0,
                summaryLines
              });
              setIsLoading(false);
              return;
            }
          } catch (err) {
            console.error('Detail fetch error', err);
          }
        }
      }
    } catch (e) {
      console.error(e);
      showToast('Error loading package details.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const openItemModal = (item: ServiceItem) => {
    setActiveModalItem(item);
    setCarouselIdx(0);
  };

  const handleCarouselNav = (dir: number) => {
    if (!activeModalItem) return;
    const imgs = activeModalItem.images || [activeModalItem.image_url || ''];
    if (!imgs.length) return;
    setCarouselIdx(prev => (prev + dir + imgs.length) % imgs.length);
  };

  const mainItem = order?.items[0];

  if (isLoading) {
    return (
      <>
        <Header />
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
          <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>Loading package details...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!order || !mainItem) {
    return (
      <>
        <Header />
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <p>Package details not found.</p>
          <Link href={`/orders/${orderId}`} className={styles.btnPrimary} style={{ width: '200px', margin: '20px auto', display: 'flex' }}>
            Back to Order
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const modalImages = activeModalItem?.images && activeModalItem.images.length > 0
    ? activeModalItem.images
    : [activeModalItem?.image_url || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&h=500&q=80'];

  return (
    <>
      <Header />

      <div className={styles.page}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <Link href="/orders">My Orders</Link>
          <span className={styles.sep}>/</span>
          <Link href={`/orders/${orderId}`}>Order Details</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Package Detail</span>
        </div>

        <div className={styles.pageHead}>
          <div>
            <h1 className={styles.pageTitle}>Package Details</h1>
          </div>
          <Link href={`/orders/${orderId}`} className={styles.backLink}>
            <i className="bx bx-arrow-back"></i> Back to Order
          </Link>
        </div>

        <div className={styles.layout}>
          {/* LEFT COLUMN (5 CARDS FROM PACKAGE-DETAIL.HTML) */}
          <div>
            {/* CARD 1: PACKAGE CARD */}
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.ciHeader}>
                  <img
                    className={styles.ciImg}
                    src={mainItem.image_url}
                    alt={mainItem.name}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=220&h=220&q=80'; }}
                  />
                  <div className={styles.ciHeadInfo}>
                    <div className={styles.ciHeadTop}>
                      <div>
                        <div className={styles.ciName}>{mainItem.name}</div>
                        <div className={styles.ciVendor}>
                          <i className="bx bx-store" style={{ fontSize: '13px' }}></i> {mainItem.item_name}
                        </div>
                      </div>
                      <div className={styles.ciBadges}>
                        <span className={`${styles.ciStatus} ${styles.confirmed}`}>
                          <i className="bx bx-check-circle"></i>{mainItem.status}
                        </span>
                        <span className={`${styles.ciStatus} ${styles.confirmed}`}>
                          <i className="bx bx-credit-card"></i>{order.payment_status}
                        </span>
                      </div>
                    </div>
                    <div className={styles.ciMetaRow}>
                      <span className={styles.ciMeta}><i className="bx bx-group"></i>{mainItem.guests || '150 Guests'}</span>
                      <span className={styles.ciMeta}><i className="bx bx-moon"></i>{mainItem.timeOfDay || 'Evening'}</span>
                      <span className={styles.ciMeta}><i className="bx bx-food-menu"></i>{mainItem.serviceItems?.length || 4} Items</span>
                      <span className={styles.ciMeta}><i className="bx bx-package"></i>{mainItem.deliverAs || 'Single Delivery'}</span>
                    </div>
                    <div className={styles.ocDate}>
                      <i className="bx bx-calendar"></i>Delivery: {mainItem.location}
                    </div>
                  </div>
                </div>

                <div className={styles.ciContent}>
                  <div className={styles.ciPhotoCarousel}>
                    {mainItem.serviceItems?.map((si, idx) => (
                      <div key={idx} className={styles.ciPhotoCard} onClick={() => openItemModal(si)} style={{ cursor: 'pointer' }}>
                        <img
                          src={si.image_url || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=200&h=160&q=80'}
                          alt={si.name}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=200&h=160&q=80'; }}
                        />
                        <div className={styles.ciPhotoName}>{si.name}</div>
                        <div className={styles.ciPhotoVar}>{si.variant || 'Standard'}</div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.ocDelivMsg}>
                    <i className="bx bx-check-circle"></i>All {mainItem.serviceItems?.length || 4} items delivered on the same day
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: PAYMENT SCHEDULE */}
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.cardTitle}>
                  <i className="bx bx-calendar-check"></i>Payment Schedule
                  <span className={styles.ctNote}>{mainItem.name} · Installments</span>
                </div>

                <div className={styles.pschInst}>
                  <div className={styles.pschGutter}>
                    <div className={`${styles.pschDot} ${styles.paid}`}></div>
                    <div className={styles.pschConn}></div>
                  </div>
                  <div className={styles.pschBody}>
                    <div>
                      <div className={styles.pschLabel}>Booking Deposit</div>
                      <div className={styles.pschDate}>Paid on 10 March 2025</div>
                      <div className={styles.pschMeta}>
                        <span className={`${styles.pschPct} ${styles.paid}`}>30%</span>
                        <span className={`${styles.pschStat} ${styles.paid}`}>Paid</span>
                      </div>
                    </div>
                    <div className={`${styles.pschAmt} ${styles.red}`}>PKR 34,425</div>
                  </div>
                </div>

                <div className={styles.pschInst}>
                  <div className={styles.pschGutter}>
                    <div className={`${styles.pschDot} ${styles.future}`}></div>
                  </div>
                  <div className={styles.pschBody}>
                    <div>
                      <div className={styles.pschLabel}>Final Balance</div>
                      <div className={styles.pschDate}>Due March 10, 2025 · auto-charge to Visa •••• 1234</div>
                      <div className={styles.pschMeta}>
                        <span className={`${styles.pschPct} ${styles.future}`}>70%</span>
                        <span className={`${styles.pschStat} ${styles.sched}`}>Scheduled</span>
                      </div>
                    </div>
                    <div className={styles.pschAmt}>PKR 80,325</div>
                  </div>
                </div>

                <div className={styles.pschTotal}>
                  <span>Package Total</span>
                  <b>{mainItem.price}</b>
                </div>
              </div>
            </div>

            {/* CARD 3: ITEM DETAILS */}
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.cardTitle}>
                  <i className="bx bx-food-menu"></i>Item Details
                </div>

                {mainItem.serviceItems?.map((si, idx) => (
                  <div key={idx} className={styles.idr} onClick={() => openItemModal(si)}>
                    <img
                      className={styles.idrImg}
                      src={si.image_url || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=140&h=140&q=80'}
                      alt={si.name}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=140&h=140&q=80'; }}
                    />
                    <div className={styles.idrInfo}>
                      <div className={styles.idrName}>{si.name}</div>
                      <div className={styles.idrSub}>{si.description}</div>
                      <div className={styles.idrChips}>
                        <span className={`${styles.idrChip} ${styles.var}`}>{si.variant || 'Standard'}</span>
                        <span className={styles.idrChip}>{si.servings || '250 servings'}</span>
                        <span className={styles.idrChip}>{si.dietary || 'Halal'}</span>
                      </div>
                    </div>
                    <div className={styles.idrSel}>
                      <div className={styles.idrCheck}><i className="bx bx-check"></i></div>
                      <i className="bx bx-chevron-right idrChev" style={{ fontSize: '20px', color: 'var(--text-muted)' }}></i>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 4: DELIVERY DETAILS */}
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.cardTitle}>
                  <i className="bx bx-map"></i>Delivery Details
                </div>
                <div className={styles.ddDateHead}>
                  <i className="bx bx-calendar-star"></i>Delivering Saturday, March 15, 2025 · Event Day
                </div>
                <div className={styles.addrBlock}>
                  <div className={styles.addrIc}>
                    <i className="bx bx-home-heart"></i>
                  </div>
                  <div>
                    <div className={styles.addrName}>{order.contact_name}</div>
                    <div className={styles.addrLine}>
                      {order.shipping_address}<br />
                      {order.contact_phone}
                    </div>
                  </div>
                </div>
                <div className={styles.ddNote}>
                  <i className="bx bx-check-circle"></i>All {mainItem.serviceItems?.length || 4} items delivering together
                </div>
                <div className={styles.ddItems}>
                  {mainItem.serviceItems?.map((si, idx) => (
                    <div key={idx} className={styles.ddItem}>
                      <img
                        src={si.image_url || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=160&h=160&q=80'}
                        alt={si.name}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=160&h=160&q=80'; }}
                      />
                      <div className={styles.ddItemName}>{si.name}</div>
                      <div className={styles.ddItemVar}>{si.variant || 'Standard'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CARD 5: PAYMENTS SECTION */}
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.cardTitle}>
                  <i className="bx bx-wallet"></i>Payments
                </div>

                <div className={styles.payTabs}>
                  <button
                    className={`${styles.payTab} ${payTabActive === 'upcoming' ? styles.active : ''}`}
                    onClick={() => setPayTabActive('upcoming')}
                  >
                    Upcoming <span className={styles.payTabCount}>1</span>
                  </button>
                  <button
                    className={`${styles.payTab} ${payTabActive === 'history' ? styles.active : ''}`}
                    onClick={() => setPayTabActive('history')}
                  >
                    History <span className={styles.payTabCount}>1</span>
                  </button>
                </div>

                {payTabActive === 'upcoming' ? (
                  <div className={`${styles.payPanel} ${styles.active}`}>
                    <div className={styles.payHeroRow}>
                      <div className={`${styles.payHero} ${styles.upcoming}`}>
                        <div className={styles.payHeroTop}>
                          <div>
                            <div className={styles.payHeroLbl}>Upcoming for this order</div>
                            <div className={styles.payHeroAmt}>PKR 80,325</div>
                            <div className={styles.payHeroMethod}><i className="bx bx-time-five"></i> 1 payment scheduled</div>
                          </div>
                          <span className={styles.payHeroBadge}><i className="bx bx-calendar"></i> 1 Scheduled</span>
                        </div>
                        <div className={styles.payHeroStats}>
                          <div className={styles.payHeroStat}>
                            <div className={styles.payHeroStatLbl}><i className="bx bx-error-circle"></i> Due Now</div>
                            <div className={styles.payHeroStatVal}>PKR 0</div>
                          </div>
                          <div className={styles.payHeroStat}>
                            <div className={styles.payHeroStatLbl}><i className="bx bx-star"></i> Later</div>
                            <div className={styles.payHeroStatVal}>PKR 80,325</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`${styles.payPanel} ${styles.active}`}>
                    <div className={styles.payHeroRow}>
                      <div className={`${styles.payHero} ${styles.paid}`}>
                        <div className={styles.payHeroTop}>
                          <div>
                            <div className={styles.payHeroLbl}>Paid for this order</div>
                            <div className={styles.payHeroAmt}>PKR 34,425</div>
                            <div className={styles.payHeroMethod}><i className="bx bx-credit-card"></i> Visa •••• 1234</div>
                          </div>
                          <span className={styles.payHeroBadge}><i className="bx bx-check-circle"></i> 1 Paid</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className={styles.sidebarSticky}>
            <div className={styles.bookingCard}>
              <div className={styles.sidebarHead}>
                <div className={styles.shTop}>
                  <div className={styles.shEyebrow}>ORDER SUMMARY</div>
                  <span className={styles.shStatus}><i className="bx bx-check-circle"></i>Confirmed</span>
                </div>
                <div className={styles.shTitle}>{order.order_number}</div>
                <div className={styles.shOrderdate}>
                  <i className="bx bx-calendar"></i>Ordered {order.order_date}
                </div>
                <div className={styles.shSub}>
                  {order.allOrdersList?.length || 5} packages · Event March 15, 2025
                </div>
                <div className={styles.shTotalRow}>
                  <span className={styles.shTotalLbl}>Total</span>
                  <span className={styles.shTotalVal}>{order.total_amount}</span>
                </div>
              </div>

              {/* ACTION BUTTONS: "View Order Details" navigates to /orders/[id] */}
              <div className={styles.actionsBlock}>
                <Link href={`/orders/${orderId}`} className={styles.btnPrimary}>
                  <i className="bx bx-receipt"></i> View Order Details
                </Link>
                <button className={styles.btnOutline} onClick={() => {}} disabled={isDownloading}>
                  <i className="bx bx-download"></i> Download Invoice
                </button>
                <Link href={`/orders/${order.id}/track/${order.items[0]?.id || 0}`} className={styles.btnOutline}>
                  <i className="bx bx-map"></i> Track Order
                </Link>
                <Link href={`/orders/${order.id}/cancel`} className={`${styles.btnOutline} ${styles.danger}`}>
                  <i className="bx bx-x-circle"></i> Cancel Order
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Item Details Popup Modal */}
      {activeModalItem && (
        <div
          className={`${styles.idpOverlay} ${styles.open}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModalItem(null);
          }}
        >
          <button className={styles.idpClose} onClick={() => setActiveModalItem(null)} aria-label="Close">
            <i className="bx bx-x"></i>
          </button>

          <div className={styles.idpPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.idpTopbar}>
              <span className={styles.idpTopbarName}>{activeModalItem.name}</span>
            </div>

            <div className={styles.idpCarousel}>
              {modalImages.length > 1 && (
                <>
                  <button className={`${styles.idpCnav} ${styles.idpCnavPrev}`} onClick={() => handleCarouselNav(-1)}>
                    <i className="bx bx-chevron-left"></i>
                  </button>
                  <button className={`${styles.idpCnav} ${styles.idpCnavNext}`} onClick={() => handleCarouselNav(1)}>
                    <i className="bx bx-chevron-right"></i>
                  </button>
                </>
              )}
              {modalImages.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={activeModalItem.name}
                  className={carouselIdx === i ? styles.active : ''}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&h=500&q=80';
                  }}
                />
              ))}
              <span className={styles.idpCCounter}>{carouselIdx + 1} / {modalImages.length}</span>
            </div>

            <div className={styles.idpBody}>
              <div className={styles.idpItemName}>{activeModalItem.name}</div>
              <div className={styles.idpTags}>
                <span className={`${styles.idpTag} ${styles.red}`}>{activeModalItem.variant || 'Standard'}</span>
                <span className={`${styles.idpTag} ${styles.green}`}>{activeModalItem.dietary || 'Halal certified'}</span>
                <span className={styles.idpTag}>Signature dish</span>
                <span className={styles.idpTag}>Dum-cooked</span>
              </div>
              <div className={styles.idpDesc}>
                {activeModalItem.description ||
                  `Our signature ${activeModalItem.name} is slow dum-cooked for 4 hours in a traditional deg using premium aged Basmati rice from Punjab.`}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
