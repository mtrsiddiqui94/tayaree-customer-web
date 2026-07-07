'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from '../orders.module.css';

interface OrderItem {
  id: number;
  name: string;
  item_name: string;
  price: string;
  quantity: number;
  image_url: string;
  status: string;
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

  const loadOrderDetail = async () => {
    try {
      setIsLoading(true);
      // Fetch user orders list
      const res = await api.get<{ status: boolean; data: any[] }>('/api/v1/order/list?limit=50&page=1');
      if (res.status && res.data) {
        const found = res.data.find((ord: any) => ord.id === orderId);
        if (found) {
          const ordItems: OrderItem[] = (found.items || found.packages || []).map((itm: any) => ({
            id: itm.id || itm.order_item_id || 0,
            name: itm.name || itm.service_name || 'unset',
            item_name: itm.item_name || 'unset',
            price: itm.price || itm.item_price || 'unset',
            quantity: itm.quantity || 1,
            image_url: itm.image_url || itm.imageUrl || '',
            status: itm.status || itm.status_name || 'Booked',
            location: itm.location || itm.vendor_location || itm.area || 'unset',
          }));

          setOrder({
            id: found.id,
            order_number: found.order_number || found.orderNumber || 'unset',
            order_date: found.order_date || found.orderDate || 'unset',
            total_amount: found.total_amount || found.totalAmount || 'unset',
            status: found.status || found.status_name || 'unset',
            status_id: found.status_id || 1,
            payment_status: found.payment_status || found.paymentStatus || 'unset',
            shipping_address: found.shipping_address || found.address || 'unset',
            contact_email: found.contact_email || found.email || 'unset',
            contact_phone: found.contact_phone || found.phone || 'unset',
            items: ordItems,
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
          <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>Fetching invoice details...</p>
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
          <Link href="/orders" className={styles.btnSm} style={{ background: 'var(--primary)', color: '#fff' }}>
            Back to Bookings
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
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <Link href="/orders">My Bookings</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Details</span>
        </div>

        <div className={styles.pageHead} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className={styles.pageTitle}>Invoice Reference #{order.order_number}</h1>
            <p className={styles.pageSub}>Placed on: <strong>{order.order_date}</strong></p>
          </div>
          <Link href="/orders" className={styles.btnSm} style={{ background: 'none', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
            <i className="bx bx-left-arrow-alt"></i> Back to Portfolio
          </Link>
        </div>

        <div className={styles.tlLayout}>
          <div>
            {/* Packages List */}
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <h3 className={styles.cardTitle}>
                  <i className="bx bx-receipt"></i> Items in Booking
                </h3>
                {order.items.map((item, idx) => (
                  <div key={idx} className={styles.ci}>
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className={styles.ciImg}
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=150&q=80';
                      }}
                    />
                    <div className={styles.ciMain}>
                      <h4 className={styles.ciName}>{item.name}</h4>
                      <span className={styles.ciVendor}>{item.item_name}</span>
                      <p className={styles.ciMeta}>
                        Location: {item.location} · Qty: {item.quantity}
                      </p>
                      <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                        <span className={`${styles.badge} ${styles.badgeNeutral}`}>
                          {item.status}
                        </span>
                        <Link href={`/orders/${order.id}/track/${item.id}`} className={styles.actionLink} style={{ fontSize: '11px' }}>
                          Track Service Timeline
                        </Link>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)' }}>
                        {item.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing / Shipping Addresses details */}
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <h3 className={styles.cardTitle}>
                  <i className="bx bx-map-pin"></i> Delivery Address &amp; Contacts
                </h3>
                <div className={styles.roBlock}>
                  <div className={styles.roIc}>
                    <i className="bx bx-home"></i>
                  </div>
                  <div className={styles.roInfo}>
                    <h4 className={styles.roName}>Shipping Address</h4>
                    <p className={styles.roLine}>{order.shipping_address}</p>
                    <p className={styles.roLine} style={{ marginTop: '6px' }}>
                      <i className="bx bx-envelope" style={{ marginRight: '6px' }}></i>
                      {order.contact_email}
                      <span style={{ margin: '0 8px' }}>·</span>
                      <i className="bx bx-phone" style={{ marginRight: '6px' }}></i>
                      {order.contact_phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking payment details */}
          <div>
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <h3 className={styles.cardTitle}>
                  <i className="bx bx-credit-card"></i> Order Value Details
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                    <span style={{ fontWeight: 700, color: 'var(--amber)' }}>{order.status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Payment Status:</span>
                    <span style={{ fontWeight: 700, color: 'var(--success)' }}>{order.payment_status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Billing Mode:</span>
                    <span style={{ fontWeight: 700 }}>Cash on Delivery</span>
                  </div>

                  <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }}></div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800 }}>
                    <span>Total Invoiced:</span>
                    <span style={{ color: 'var(--primary)' }}>{order.total_amount}</span>
                  </div>
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
