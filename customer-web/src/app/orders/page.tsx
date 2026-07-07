'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
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
  [key: string]: any;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  
  // Cancel modal states
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [cancellingItems, setCancellingItems] = useState<OrderItem[]>([]);

  // States
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
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ status: boolean; data: any[] }>('/api/v1/order/list?limit=20&page=1');
      if (res.status && res.data) {
        // Parse orders and package lists
        const parsedOrders: Order[] = res.data.map((ord: any) => {
          const ordItems: OrderItem[] = (ord.items || ord.packages || []).map((itm: any) => ({
            id: itm.id || itm.order_item_id || 0,
            order_id: itm.order_id || ord.id,
            service_id: itm.service_id || 0,
            name: itm.name || itm.service_name || 'unset',
            item_name: itm.item_name || 'unset',
            price: itm.price || itm.item_price || 'unset',
            quantity: itm.quantity || 1,
            image_url: itm.image_url || itm.imageUrl || '',
            status: itm.status || itm.status_name || 'Booked',
          }));

          return {
            id: ord.id,
            order_number: ord.order_number || ord.orderNumber || 'unset',
            order_date: ord.order_date || ord.orderDate || 'unset',
            total_amount: ord.total_amount || ord.totalAmount || 'unset',
            status: ord.status || ord.status_name || 'unset',
            status_id: ord.status_id || 1,
            payment_status: ord.payment_status || ord.paymentStatus || 'unset',
            items: ordItems,
          };
        });

        setOrders(parsedOrders);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load orders history.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter orders matching active Tab selection
  const filteredOrders = orders.filter((ord) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') {
      return ord.status.toLowerCase().includes('pending') || ord.status.toLowerCase().includes('placed') || ord.status_id === 1;
    }
    if (activeTab === 'completed') {
      return ord.status.toLowerCase().includes('completed') || ord.status.toLowerCase().includes('delivered') || ord.status_id === 4;
    }
    if (activeTab === 'cancelled') {
      return ord.status.toLowerCase().includes('cancel') || ord.status_id === 5;
    }
    return true;
  });

  // Open Cancel Request Dialog
  const openCancelModal = (ord: Order) => {
    setCancellingOrderId(ord.id);
    setCancellingItems(ord.items);
    setCancelModalOpen(true);
  };

  // POST Cancellation Request
  const handleCancelSubmit = async () => {
    if (!cancellingOrderId) return;
    try {
      // Map cancellation list payload matching MyOrderRepositoryImpl
      const itemsPayload = cancellingItems.map(itm => ({
        orderItemId: itm.id,
        quantity: itm.quantity
      }));

      // In MyOrderRepositoryImpl: cancelOrder POST request to `/api/v1/order/cancel/$orderId`
      const res = await api.post<{ status: boolean; message?: string }>(`/api/v1/order/cancel/${cancellingOrderId}`, itemsPayload);
      
      showToast(res.message || 'Booking cancellation request submitted successfully.');
      setCancelModalOpen(false);
      loadOrders();
    } catch (e: any) {
      showToast(e.message || 'Failed to cancel order booking.', 'error');
    }
  };

  return (
    <>
      <Header />

      {/* Toast alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          backgroundColor: toast.type === 'success' ? 'var(--success)' : toast.type === 'error' ? 'var(--primary)' : '#0277bd',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '8px',
          zIndex: 10000,
          boxShadow: 'var(--shadow-md)',
          fontFamily: 'Poppins, sans-serif',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <i className={toast.type === 'success' ? 'bx bx-check-circle' : toast.type === 'error' ? 'bx bx-error-circle' : 'bx bx-info-circle'} style={{ fontSize: '18px' }}></i>
          {toast.message}
        </div>
      )}

      <main className={styles.page}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>My Bookings</span>
        </div>

        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>My Bookings Portfolio</h1>
          <p className={styles.pageSub}>Track your event service quotes and delivery updates in one central panel.</p>
        </div>

        {/* Tab Filters */}
        <div className={styles.statusTabs}>
          <button
            onClick={() => setActiveTab('all')}
            className={`${styles.statusTab} ${activeTab === 'all' ? styles.statusTabActive : ''}`}
          >
            All Bookings <span className={styles.tabCount}>{orders.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`${styles.statusTab} ${activeTab === 'pending' ? styles.statusTabActive : ''}`}
          >
            Pending / Active{' '}
            <span className={styles.tabCount}>
              {orders.filter(o => o.status.toLowerCase().includes('pending') || o.status.toLowerCase().includes('placed') || o.status_id === 1).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`${styles.statusTab} ${activeTab === 'completed' ? styles.statusTabActive : ''}`}
          >
            Finalized{' '}
            <span className={styles.tabCount}>
              {orders.filter(o => o.status.toLowerCase().includes('completed') || o.status.toLowerCase().includes('delivered')).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`${styles.statusTab} ${activeTab === 'cancelled' ? styles.statusTabActive : ''}`}
          >
            Cancelled{' '}
            <span className={styles.tabCount}>
              {orders.filter(o => o.status.toLowerCase().includes('cancel')).length}
            </span>
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
            <p style={{ marginTop: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>Loading orders portfolio...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <i className="bx bx-calendar-x" style={{ fontSize: '48px', color: 'var(--text-muted)' }}></i>
            <p style={{ marginTop: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>No bookings found matching filters.</p>
            <Link href="/" className={styles.btnSm} style={{ marginTop: '16px', background: 'var(--primary)', color: '#fff', padding: '0 20px', height: '36px' }}>
              Explore Services
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredOrders.map((ord) => {
              const mainItem = ord.items[0];
              const isCancelled = ord.status.toLowerCase().includes('cancel') || ord.status_id === 5;
              const isPending = ord.status.toLowerCase().includes('pending') || ord.status.toLowerCase().includes('placed') || ord.status_id === 1;

              return (
                <div key={ord.id} className={styles.orderCard}>
                  <div className={styles.orderCardHeader}>
                    <div className={styles.orderMeta}>
                      <span className={styles.orderNumber}>
                        Booking Reference: <strong>#{ord.order_number}</strong>
                      </span>
                      <h3 className={styles.orderTitle}>
                        {mainItem?.name || 'unset'}
                        {ord.items.length > 1 && ` + ${ord.items.length - 1} other packages`}
                      </h3>
                      <div className={styles.orderBadges}>
                        <span className={`${styles.badge} ${
                          isCancelled ? styles.badgeError : ord.status.toLowerCase().includes('complete') ? styles.badgeSuccess : styles.badgeWarning
                        }`}>
                          {ord.status}
                        </span>
                        <span className={`${styles.badge} ${styles.badgeNeutral}`}>
                          {ord.payment_status}
                        </span>
                      </div>
                    </div>
                    <div className={styles.orderPriceBlock}>
                      <span className={styles.orderTotal}>{ord.total_amount}</span>
                    </div>
                  </div>

                  <div className={styles.orderCardBody}>
                    <div className={styles.orderInfoGrid}>
                      <div>
                        <span className={styles.orderInfoLabel}>Booking Date</span>
                        <span className={styles.orderInfoValue}>{ord.order_date}</span>
                      </div>
                      <div>
                        <span className={styles.orderInfoLabel}>Event Packages</span>
                        <span className={styles.orderInfoValue}>{ord.items.length} services</span>
                      </div>
                      <div>
                        <span className={styles.orderInfoLabel}>Payment Mode</span>
                        <span className={styles.orderInfoValue}>COD / Installments</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.orderCardFooter}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Manage event slot updates via the coordinators support channel.
                    </span>

                    <div className={styles.orderFooterActions}>
                      <Link href={`/orders/${ord.id}`} className={`${styles.btnSm} ${styles.btnSmGhost}`}>
                        <i className="bx bx-receipt"></i> Details Invoice
                      </Link>
                      
                      {mainItem && !isCancelled && (
                        <Link href={`/orders/${ord.id}/track/${mainItem.id}`} className={`${styles.btnSm} ${styles.btnSmPrimary}`}>
                          <i className="bx bx-git-commit"></i> Live Track
                        </Link>
                      )}

                      {isPending && (
                        <button onClick={() => openCancelModal(ord)} className={`${styles.btnSm} ${styles.btnSmGhost} ${styles.btnSmGhostDanger}`}>
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Booking Cancellation Request Modal */}
      {cancelModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Cancel Booking Request</h3>
              <button onClick={() => setCancelModalOpen(false)} className={styles.modalClose}>
                <i className="bx bx-x"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to request cancellation for booking Reference <strong>#{orders.find(o => o.id === cancellingOrderId)?.order_number}</strong>?
              </p>
              <p style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, background: 'var(--primary-light)', padding: '8px', borderRadius: '4px' }}>
                Note: Cancellation policies are dependent on vendor terms and booking timelines.
              </p>
              <button onClick={handleCancelSubmit} className={styles.btnCancelSubmit}>
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
