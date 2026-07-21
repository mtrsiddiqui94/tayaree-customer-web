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

export default function MegaOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push(`/login?redirect=/orders/${orderId}/mega`);
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

  if (isLoading) {
    return (
      <>
        <Header />
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
          <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>Loading order details...</p>
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
            <i className="bx bx-error-circle" style={{ fontSize: '48px', color: 'var(--text-muted)' }}></i>
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
  const savings = Math.round(orderTotal * 0.40); // 40% mockup for mega savings
  const paid = Math.round(orderTotal * 0.30);
  const future = orderTotal - paid;

  return (
    <>
      <Header />

      <main className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <Link href="/orders">My Orders</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Mega Order Details</span>
        </div>

        <div className={styles.pageHead}>
          <div>
            <div className={styles.pageTitle}>Order Details</div>
            <div className={styles.pageSub}>
              Order #{order.order_id} · Ordered {order.order_date || 'N/A'} · {items.length} items
            </div>
          </div>
          <Link href="/orders" className={styles.backLink}>
            <i className="bx bx-arrow-back"></i> Back to Orders
          </Link>
        </div>

        <div className={styles.layout}>
          <div>
            <div className={styles.savingsBanner}>
              <div className={styles.sbIc}>₨</div>
              <div>
                <div className={styles.savingsText}>You saved PKR {formatPrice(savings)} on this order</div>
                <div className={styles.savingsSub}>Mega Deal bundle saved 40% on standard packages</div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.cardTitle}>
                  <i className="bx bx-package"></i>Order Items <span className={styles.count}>{items.length} items</span>
                </div>

                <div className={styles.oitem}>
                  <div className={styles.ciHeader}>
                    <img className={styles.ciImg} src={order.image_url || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=220&h=220&q=80'} alt="Mega Deal" />
                    <div className={styles.ciHeadInfo}>
                      <div className={styles.ciHeadTop}>
                        <div>
                          <div className={styles.ciName}>{order.package_name || 'Mega Booking'} <span className={styles.ciMSq}>M</span></div>
                          <div className={styles.ciVendor}><i className="bx bx-store" style={{fontSize:'13px'}}></i> Curated by Tayaree</div>
                        </div>
                        <div className={styles.ciBadges}>
                          <span className={styles.ciMegaDeal}>Mega Deal</span>
                          <span className={`${styles.ciStatus} ${styles.confirmed}`}><i className="bx bx-check-circle"></i>{order.package_status || 'Confirmed'}</span>
                        </div>
                      </div>
                      <div className={styles.ciMetaRow}>
                        <span className={styles.ciMeta}><i className="bx bx-collection"></i>{items.length} packages</span>
                        <span className={styles.ciMeta}><i className="bx bx-calendar-event"></i>{items.length} events</span>
                        <span className={styles.ciMeta}><i className="bx bx-package"></i>Book-together bundle</span>
                      </div>
                      <div className={styles.ciDd}>
                        <span className={styles.ciDdText}><i className="bx bxs-truck"></i>Delivery: {order.delivery_date || 'Multiple dates'}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.ciContent}>
                    <div className={styles.megaPkgHead}>Packages in this bundle ({items.length})</div>
                    
                    {items.map((pkg, idx) => (
                      <div key={idx} className={styles.megaPkgCard}>
                        <div className={styles.mpHeader}>
                          <img className={styles.mpImg} src={pkg.image_url || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=150&h=150&q=80'} alt={pkg.item_name} />
                          <div className={styles.mpInfo}>
                            <div className={styles.mpTop}>
                              <div>
                                <div className={styles.mpName}>{pkg.item_name}</div>
                                <div className={styles.mpVendor}>{pkg.vendor_name}</div>
                              </div>
                              <i className="bx bx-chevron-right mpChev"></i>
                            </div>
                            <div className={styles.mpMeta}>
                              <span className={styles.m}><i className="bx bx-sun"></i>{pkg.time_of_day || 'Evening'}</span>
                              <span className={styles.m}><i className="bx bx-group"></i>{pkg.quantity || 1} items</span>
                            </div>
                            <div className={styles.megaPkgDate}><i className="bx bx-calendar"></i>{pkg.delivery_date || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className={styles.ciDelivNote}>
                      <i className="bx bx-check-circle"></i>Booked as one order · each package delivered on its own event date
                    </div>

                    <div className={styles.ciPriceBlock}>
                      <div className={styles.ciPbRow}>
                        <span className={styles.ciPbLbl}>Original Amount</span>
                        <span className={styles.ciPbVal}>PKR {formatPrice(orderTotal + savings)}</span>
                      </div>
                      <div className={styles.ciPbRow}>
                        <span className={styles.ciPbLbl}>Mega Deal Discount (40%)</span>
                        <span className={`${styles.ciPbVal} ${styles.green}`}>− PKR {formatPrice(savings)}</span>
                      </div>
                      <div className={styles.ciPbRow}>
                        <span className={styles.ciPbLbl}>Amount Paid (30%)</span>
                        <span className={`${styles.ciPbVal} ${styles.red}`}>PKR {formatPrice(paid)}</span>
                      </div>
                      <div className={styles.ciPbRow}>
                        <span className={styles.ciPbLbl}>Future Payments</span>
                        <span className={`${styles.ciPbVal} ${styles.muted}`}>PKR {formatPrice(future)}</span>
                      </div>
                    </div>

                    <div className={styles.oitemActions}>
                      <Link className={`${styles.oiLink} ${styles.danger}`} href={`/orders/${orderId}/cancel/mega`}>
                        <i className="bx bx-x-circle"></i>Cancel Mega Deal
                      </Link>
                      <Link className={styles.oiLink} href={`/orders/${orderId}/track/${order.order_package_line_id}`}>
                        <i className="bx bx-map"></i>Track
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className={styles.sidebarSticky}>
              <div className={styles.bookingCard}>
                <div className={styles.sidebarHead}>
                  <div className={styles.shTop}>
                    <div className={styles.shEyebrow}>Order Summary</div>
                    <span className={styles.shStatus}><i className="bx bx-check-circle"></i>Confirmed</span>
                  </div>
                  <div className={styles.shTitle}>#{order.order_id}</div>
                  <div className={styles.shOrderdate}><i className="bx bx-calendar"></i>Ordered {order.order_date || 'N/A'}</div>
                  <div className={styles.shSub}>{items.length} packages included</div>
                  <div className={styles.shTotalRow}>
                    <span className={styles.shTotalLbl}>Order Total</span>
                    <span className={styles.shTotalVal}>PKR {formatPrice(orderTotal)}</span>
                  </div>
                </div>

                <div className={styles.sdbLbl}>Items in this order</div>
                <div className={styles.sdbItems}>
                  <div className={styles.sdbItemRow}>
                    <div className={`${styles.sdbIc} ${styles.m}`}>M</div>
                    <div className={styles.sdbInfo}>
                      <div className={styles.sdbName}>{order.package_name || 'Mega Booking'}</div>
                      <div className={styles.sdbPkg}>Mega Deal · {items.length} packages</div>
                    </div>
                    <div className={styles.sdbPrice}>PKR {formatPrice(orderTotal)}</div>
                  </div>
                </div>

                <div className={styles.priceBreakdown}>
                  <div className={styles.priceRow}>
                    <span>Items Total</span>
                    <span className={styles.priceVal}>PKR {formatPrice(orderTotal + savings)}</span>
                  </div>
                  <div className={styles.priceRow}>
                    <span>You saved</span>
                    <span className={`${styles.priceVal} ${styles.green}`}>− PKR {formatPrice(savings)}</span>
                  </div>
                  <hr className={styles.priceDashed} />
                  <div className={`${styles.priceRow} ${styles.total}`}>
                    <span>Order Total</span>
                    <span className={`${styles.priceVal} ${styles.total}`}>PKR {formatPrice(orderTotal)}</span>
                  </div>
                </div>

                <div className={styles.amountDueBlock}>
                  <div>
                    <div className={styles.adtLbl}>Paid at Checkout (30%)</div>
                    <div className={styles.adtNote}>Deposit for mega deal</div>
                  </div>
                  <div className={styles.adtVal}>PKR {formatPrice(paid)}</div>
                </div>
                
                <div className={styles.futurePayBlock}>
                  <div>
                    <div className={styles.fpLbl}>Future Payments</div>
                    <div className={styles.fpDue}>Installments before event</div>
                  </div>
                  <div className={styles.fpVal}>PKR {formatPrice(future)}</div>
                </div>
                
                <div className={styles.actionsBlock}>
                  <Link href={`/orders/${orderId}/track/${order.order_package_line_id}`} className={styles.btnPrimary}>
                    <i className="bx bx-map"></i> Track Order
                  </Link>
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
