'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from '../../../orders.module.css';

interface TrackingDetails {
  orderItemId: number;
  orderId: number;
  orderDate: string;
  isDelivered: number;
  info1Label: string; // e.g. "Estimated Delivery"
  info2Label: string; // e.g. "24 June 2026"
  itemName: string;
  vendorName: string;
  itemImage: string;
  shippingAddress: string;
  statusId: number;
  createdAt: string;
}

interface TrackingStatus {
  id: number;
  statusName: string; // e.g. "Booked", "Preparing", "Shipped"
  statusDescription: string;
  createdAt: string;
  isCompleted: boolean;
  isActive: boolean;
}

export default function ItemTrackingPage({ params }: { params: Promise<{ id: string; itemId: string }> }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const orderId = parseInt(unwrappedParams.id, 10);
  const itemId = parseInt(unwrappedParams.itemId, 10);

  const [details, setDetails] = useState<TrackingDetails | null>(null);
  const [statuses, setStatuses] = useState<TrackingStatus[]>([]);
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
    loadTrackingData();
  }, [itemId]);

  const loadTrackingData = async () => {
    try {
      setIsLoading(true);

      // 1. Fetch item general tracking details
      const detailRes = await api.get<{ status: boolean; data: any }>(`/api/v1/order/items/${itemId}/tracking`);
      if (detailRes.status && detailRes.data) {
        const d = detailRes.data;
        setDetails({
          orderItemId: d.order_item_id || d.orderItemId || itemId,
          orderId: d.order_id || d.orderId || orderId,
          orderDate: d.order_date || d.orderDate || 'unset',
          isDelivered: d.is_delivered || d.isDelivered || 0,
          info1Label: d.info1_label || d.info1Label || 'Delivery Slot',
          info2Label: d.info2_label || d.info2Label || 'unset',
          itemName: d.item_name || d.itemName || 'unset',
          vendorName: d.vendor_name || d.vendorName || 'unset',
          itemImage: d.item_image || d.itemImage || '',
          shippingAddress: d.shipping_address || d.shippingAddress || 'unset',
          statusId: d.status_id || d.statusId || 1,
          createdAt: d.created_at || d.createdAt || 'unset',
        });
      }

      // 2. Fetch tracking milestones status history list
      const statusRes = await api.get<{ status: boolean; data: any[] }>(`/api/v1/order/items/${itemId}/tracking/status`)
        .catch(() => ({ status: false, data: [] }));
      
      const parsedStatuses: TrackingStatus[] = (statusRes.data || []).map((s: any) => ({
        id: s.id || 0,
        statusName: s.status_name || s.statusName || 'unset',
        statusDescription: s.status_description || s.statusDescription || 'unset',
        createdAt: s.created_at || s.createdAt || '',
        isCompleted: s.is_completed === 1 || s.isCompleted === true,
        isActive: s.is_active === 1 || s.isActive === true,
      }));

      // Fallback: If status list is empty, generate matching standard milestones
      if (parsedStatuses.length === 0) {
        const milestones = ['Booking Placed', 'Slot Confirmed', 'Decor / Setup Preparation', 'Transit / Delivery', 'Finalized & Verified'];
        const activeStatusId = details?.statusId || 1;
        setStatuses(milestones.map((m, idx) => ({
          id: idx + 1,
          statusName: m,
          statusDescription: `Booking milestone status tracking updates.`,
          createdAt: idx === 0 ? (details?.orderDate || '') : '',
          isCompleted: (idx + 1) < activeStatusId,
          isActive: (idx + 1) === activeStatusId,
        })));
      } else {
        setStatuses(parsedStatuses);
      }

    } catch (e) {
      console.error(e);
      showToast('Failed to load live tracking details.', 'error');
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
          <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>Loading tracking timeline...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      {/* Toast Alert */}
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
          <Link href="/orders">My Bookings</Link>
          <span className={styles.sep}>/</span>
          <Link href={`/orders/${orderId}`}>Details</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Live Tracking</span>
        </div>

        <div className={styles.pageHead} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className={styles.pageTitle}>Live Tracking Details</h1>
            <p className={styles.pageSub}>
              Checking booking reference: <strong>#{details?.orderId}</strong>
            </p>
          </div>
          <Link href={`/orders/${orderId}`} className={styles.btnSm} style={{ background: 'none', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
            <i className="bx bx-left-arrow-alt"></i> Back to Invoice
          </Link>
        </div>

        {/* ETA Header block */}
        <div className={styles.etaCard}>
          <div className={styles.etaIc}>
            <i className="bx bx-time"></i>
          </div>
          <div className={styles.etaInfo}>
            <span className={styles.etaLbl}>{details?.info1Label || 'Slot Schedule'}</span>
            <h2 className={styles.etaVal}>{details?.info2Label || 'unset'}</h2>
          </div>
          <span className={styles.etaBadge}>
            <i className="bx bx-git-commit bx-spin"></i> Active tracking
          </span>
        </div>

        <div className={styles.tlLayout}>
          {/* Timeline steps card */}
          <div className={styles.card}>
            <div className={styles.cardInner}>
              <h3 className={styles.cardTitle}>
                <i className="bx bx-git-commit"></i> Service Milestones Timeline
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '20px' }}>
                {statuses.map((step, idx) => {
                  const isDone = step.isCompleted;
                  const isActive = step.isActive;

                  return (
                    <div key={idx} className={styles.tlRow}>
                      <div className={styles.tlG}>
                        <div className={`${styles.tlDot} ${isDone ? styles.tlDotDone : isActive ? styles.tlDotActive : styles.tlDotPending}`}>
                          {isDone ? (
                            <i className="bx bx-check"></i>
                          ) : isActive ? (
                            <i className="bx bx-target-lock"></i>
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>
                        {idx < statuses.length - 1 && (
                          <div className={`${styles.tlConn} ${isDone ? styles.tlConnDone : ''}`}></div>
                        )}
                      </div>
                      
                      <div className={styles.tlBody}>
                        <div className={styles.tlTop}>
                          <h4 className={styles.tlLabel}>{step.statusName}</h4>
                          {isActive && (
                            <span className={`${styles.tlChip} ${styles.tlChipGreen}`}>Active Step</span>
                          )}
                        </div>
                        <span className={styles.tlDate}>
                          {step.createdAt ? step.createdAt : 'Awaiting status verification'}
                        </span>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                          {step.statusDescription}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Package details sidebar */}
          <div className={styles.card}>
            <div className={styles.cardInner}>
              <h3 className={styles.cardTitle}>
                <i className="bx bx-package"></i> Package Description
              </h3>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <img
                  src={details?.itemImage}
                  alt={details?.itemName}
                  style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', background: 'var(--input-bg)' }}
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=150&q=80';
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {details?.itemName}
                  </h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Vendor: {details?.vendorName}
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <span className={styles.orderInfoLabel}>Delivery Location</span>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                  {details?.shippingAddress}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
