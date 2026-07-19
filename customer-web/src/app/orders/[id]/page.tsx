'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from './orderDetail.module.css';

interface OrderItem {
  id: number;
  name: string;
  item_name: string;
  price: string;
  quantity: number;
  image_url: string;
  status: string;
  location?: string;
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
  shipping_address?: string;
  contact_email?: string;
  contact_phone?: string;
  items: OrderItem[];
  packageName?: string;
  vendorName?: string;
  imageUrl?: string;
  orderPackageLineId?: number;
  category?: string;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const orderId = parseInt(unwrappedParams.id, 10);
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/orders');
      return;
    }
    loadOrderDetail();
  }, [orderId]);

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
        for (const section of res.data) {
          const bodyList = section.body || [];
          const match = bodyList.find((ord: any) => ord.order_id === orderId);
          if (match) {
            found = match;
            break;
          }
        }

        if (found) {
          try {
            // Fetch detailed data from the specific detail endpoint!
            const detailRes = await api.get<{status: boolean, data: any}>(`/api/v1/order/items/${found.order_package_line_id}/detail/${found.order_id}?is_full=1`);
            if (detailRes.status && detailRes.data) {
              const d = detailRes.data;
              const ordItems: OrderItem[] = (d.line_item || []).map((pkg: any) => ({
                id: pkg.order_item_id || 0,
                name: pkg.item_name || 'unset',
                item_name: pkg.vendor_name || 'unset',
                price: formatPrice(pkg.order_total || pkg.amount),
                quantity: pkg.quantity || 1,
                image_url: pkg.image_url || '',
                status: pkg.package_status || 'Booked',
                location: pkg.delivery_date || 'unset',
              }));

              setOrder({
                id: found.order_id,
                order_number: d.order_detail?.order_number || found.order_number || `ORD-${found.order_id}`,
                order_date: d.order_detail?.order_date || found.booking_date || 'unset',
                total_amount: formatPrice(d.order_detail?.order_total || found.total_amount),
                status: found.package_status || 'unset',
                status_id: 1,
                payment_status: d.payment_method?.payment_method_short_name || d.payment_method?.payment_method || found.payment_status || 'unset',
                shipping_address: d.shipping_address || 'unset',
                contact_email: found.contact_email || 'unset', // from list
                contact_phone: found.contact_phone || 'unset', // from list
                items: ordItems.length ? ordItems : [{
                  id: found.order_id,
                  name: found.package_name || 'Custom Package',
                  item_name: found.vendor_name || 'Vendor',
                  price: formatPrice(found.rate_per_head || found.total_amount),
                  quantity: found.quantity || 1,
                  image_url: found.image_url || '',
                  status: found.package_status || 'Booked',
                  location: found.delivery_date || 'unset'
                }],
                packageName: found.package_name || 'unset',
                vendorName: found.vendor_name || 'unset',
                imageUrl: found.image_url || '',
                orderPackageLineId: found.order_package_line_id || 0,
                category: found.endpoint?.split('/')[1] || 'catering',
              });
              setIsLoading(false);
              return;
            }
          } catch(err) {
            console.error('Detail fetch error', err);
          }

          // Fallback if detail fetch fails
          const ordItems: OrderItem[] = (found.items || []).map((itm: any) => ({
            id: itm.item_id || 0,
            name: itm.item_name || 'unset',
            item_name: itm.item_name || 'unset',
            price: itm.price || 'unset',
            quantity: found.quantity || 1,
            image_url: itm.image_url || '',
            status: itm.item_status || 'Booked',
            location: found.delivery_date || 'unset',
          }));

          setOrder({
            id: found.order_id,
            order_number: found.order_number || found.order_package_line_id?.toString() || `ORD-${found.order_id}`,
            order_date: found.booking_date || found.delivery_date || 'unset',
            total_amount: formatPrice(found.rate_per_head || found.per_head_amount || found.total_amount),
            status: found.package_status || 'unset',
            status_id: 1,
            payment_status: found.payment_status || found.payment_status_text || 'unset',
            shipping_address: found.shipping_address || 'unset',
            contact_email: found.contact_email || 'unset',
            contact_phone: found.contact_phone || 'unset',
            items: ordItems.length ? ordItems : [{
              id: found.order_id,
              name: found.package_name || 'Custom Package',
              item_name: found.vendor_name || 'Vendor',
              price: formatPrice(found.rate_per_head || found.total_amount),
              quantity: found.quantity || 1,
              image_url: found.image_url || '',
              status: found.package_status || 'Booked',
              location: found.delivery_date || 'unset'
            }],
            packageName: found.package_name || 'unset',
            vendorName: found.vendor_name || 'unset',
            imageUrl: found.image_url || '',
            orderPackageLineId: found.order_package_line_id || 0,
            category: found.endpoint?.split('/')[1] || 'catering',
          });
        } else {
          showToast('Order reference details not found.', 'error');
          router.push('/orders');
        }
      }
    } catch (e) {
      console.error(e);
      showToast('Error loading booking invoice.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
          <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>Fetching order details...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header />
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <p>Order not found.</p>
          <Link href="/orders" className={styles.btnPrimary} style={{ width: '200px', margin: '20px auto' }}>
            Back to Orders
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className={styles.page}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link><span className={styles.sep}>/</span>
          <Link href="/orders">My Orders</Link><span className={styles.sep}>/</span>
          <span className={styles.current}>Order Details</span>
        </nav>

        <div className={styles.pageHead}>
          <div>
            <div className={styles.pageTitle}>Order Details</div>
            <div className={styles.pageSub}>Placed on: <b>{order.order_date}</b></div>
          </div>
          <Link href="/orders" className={styles.backLink}>
            <i className='bx bx-arrow-back'></i> Back to Orders
          </Link>
        </div>

        <div className={styles.layout}>
          {/* LEFT */}
          <div>
            {/* Order Items */}
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.cardTitle}>
                  <i className='bx bx-package'></i>Order Items 
                  <span className={styles.count}>{order.items.length} packages</span>
                </div>

                {order.items.map((item, idx) => (
                  <div key={idx} className={styles.ci}>
                    <div className={styles.ciMain}>
                      <div className={styles.ciHeader}>
                        <img 
                          className={styles.ciImg} 
                          src={item.image_url || 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=150&q=80'} 
                          alt={item.name} 
                          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=150&q=80'; }} 
                        />
                        <div className={styles.ciHeadInfo}>
                          <div className={styles.ciHeadTop}>
                            <div>
                              <div className={styles.ciName}>{item.name}</div>
                              <div className={styles.ciVendor}>
                                <i className='bx bx-store' style={{fontSize:'13px'}}></i> {item.item_name}
                              </div>
                            </div>
                            <div className={styles.ciBadges}>
                              <span className={`${styles.ciStatus} ${styles.confirmed}`}>
                                <i className='bx bx-check-circle'></i>{item.status}
                              </span>
                            </div>
                          </div>
                          <div className={styles.ciMetaRow}>
                            <span className={styles.ciMeta}><i className='bx bx-map'></i>{item.location || 'Delivery'}</span>
                            <span className={styles.ciMeta}><i className='bx bx-box'></i>Qty: {item.quantity || 1}</span>
                          </div>
                          <div className={styles.ciDd}>
                            <span className={styles.ciDdText}>
                              <i className='bx bxs-truck'></i>Delivery: {order.order_date}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={styles.ciContent}>
                        <div className={styles.ciPrice}>
                          <div className={styles.ciPr}>
                            <span className={styles.ciPrLbl}>Package Amount</span>
                            <span className={styles.ciPrVal}>{item.price}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.cardTitle}>
                  <i className="bx bx-map-pin"></i> Delivery Address &amp; Contacts
                </div>
                <div className={styles.roBlock}>
                  <div className={styles.roIc}>
                    <i className="bx bx-home"></i>
                  </div>
                  <div className={styles.roInfo}>
                    <h4 className={styles.roName}>Shipping Address</h4>
                    <p className={styles.roLine}>{order.shipping_address || 'Unset'}</p>
                    <p className={styles.roLine} style={{ marginTop: '6px' }}>
                      <i className="bx bx-envelope" style={{ marginRight: '6px' }}></i>
                      {order.contact_email || 'Unset'}
                      <span style={{ margin: '0 8px' }}>·</span>
                      <i className="bx bx-phone" style={{ marginRight: '6px' }}></i>
                      {order.contact_phone || 'Unset'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT (Sidebar) */}
          <div className={styles.sidebarSticky}>
            <div className={styles.bookingCard}>
              <div className={styles.sidebarHead}>
                <div className={styles.shTop}>
                  <div className={styles.shEyebrow}>Order #{order.order_number}</div>
                  <div className={styles.shStatus}>{order.status}</div>
                </div>
                <div className={styles.shTitle}>Order Summary</div>
                <div className={styles.shOrderdate}>
                  <i className='bx bx-calendar'></i>{order.order_date}
                </div>
                <div className={styles.shTotalRow}>
                  <div className={styles.shTotalLbl}>Total</div>
                  <div className={styles.shTotalVal}>{order.total_amount}</div>
                </div>
              </div>

              <div className={styles.sdbItems}>
                {order.items.map((item, idx) => (
                  <div key={idx} className={styles.sdbItemRow}>
                    <img 
                      className={styles.sdbImg} 
                      src={item.image_url || 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=150&q=80'} 
                      alt={item.name} 
                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=150&q=80'; }}
                    />
                    <div className={styles.sdbInfo}>
                      <div className={styles.sdbName}>{item.name}</div>
                      <div className={styles.sdbPkg}>{item.item_name}</div>
                    </div>
                    <div className={styles.sdbPrice}>{item.price}</div>
                  </div>
                ))}
              </div>

              <div className={styles.priceBreakdown}>
                <div className={styles.priceRow}>
                  <span>Subtotal</span>
                  <span className={styles.priceVal}>{order.total_amount}</span>
                </div>
                <hr className={styles.priceDashed} />
                <div className={`${styles.priceRow} ${styles.total}`}>
                  <span>Total Due</span>
                  <span className={`${styles.priceVal} ${styles.total}`}>{order.total_amount}</span>
                </div>
              </div>

              <div className={styles.futurePayBlock}>
                <div>
                  <div className={styles.fpLbl}>Payment Method</div>
                  <div className={styles.fpDue}>{order.payment_status}</div>
                </div>
                <div className={styles.fpVal}>Cash on Delivery</div>
              </div>

              <div className={styles.actionsBlock}>
                <Link href={`/orders/${order.id}/track/${order.items[0]?.id || 0}`} className={styles.btnPrimary}>
                  <i className='bx bx-map-pin'></i> Track Service Timeline
                </Link>
                <button className={styles.btnOutline}>
                  <i className='bx bx-download'></i> Download Invoice
                </button>
                <button className={styles.btnOutline}>
                  <i className='bx bx-support'></i> Contact Support
                </button>
                <button className={`${styles.btnOutline} ${styles.danger}`}>
                  <i className='bx bx-x-circle'></i> Cancel Order
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
