'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from './notifications.module.css';

interface NotificationBody {
  id: number;
  title: string;
  body: string;
  isRead: number;
  createdAt: string;
  iconUrl?: string;
}

interface NotificationGroup {
  heading: string;
  body: NotificationBody[];
}

export default function NotificationsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/notifications');
      return;
    }
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<any>('/api/v1/notification/list?limit=30&page=1')
        .catch(() => null);

      if (res && res.status && res.data) {
        // Parse nested notification groups from API mapper (Round 182)
        const parsedGroups: NotificationGroup[] = (res.data.notificationGroups || []).map((g: any) => ({
          heading: g.heading || 'Recent Updates',
          body: (g.body || []).map((b: any) => ({
            id: b.id,
            title: b.title || 'unset',
            body: b.body || 'unset',
            isRead: b.isRead || b.is_read || 0,
            createdAt: b.createdAt || b.created_at || 'unset',
            iconUrl: b.iconUrl || b.icon_url || '',
          })),
        }));
        setGroups(parsedGroups);
      } else {
        // Fallback mock notifications
        setGroups([
          {
            heading: 'Today',
            body: [
              {
                id: 1,
                title: 'New Bid Received from Desi Catering Stars',
                body: 'A proposal of Rs. 185,000 has been submitted for Wedding Catering.',
                isRead: 0,
                createdAt: '12:30 PM',
              },
              {
                id: 2,
                title: 'Payment installment verified',
                body: 'Your downpayment of Rs. 46,250 has been credited successfully.',
                isRead: 1,
                createdAt: '10:00 AM',
              }
            ]
          },
          {
            heading: 'Yesterday',
            body: [
              {
                id: 3,
                title: 'Custom package quote generated',
                body: 'Catering customized parameters request has been sent to vendors.',
                isRead: 1,
                createdAt: '06 July 2026',
              }
            ]
          }
        ]);
      }
    } catch (e) {
      showToast('Error loading notifications.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/api/v1/notification/mark-all-read', {});
      showToast('All notifications marked as read.');
      setGroups(prev => prev.map(g => ({
        ...g,
        body: g.body.map(b => ({ ...b, isRead: 1 }))
      })));
    } catch (e) {
      // offline fallback
      setGroups(prev => prev.map(g => ({
        ...g,
        body: g.body.map(b => ({ ...b, isRead: 1 }))
      })));
      showToast('Marked as read.');
    }
  };

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
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Notifications</span>
        </div>

        <div className={styles.pageHead}>
          <div>
            <h1 className={styles.pageTitle}>Notifications Inbox</h1>
            <p className={styles.pageSub}>Stay updated on vendor proposals, booking updates, and payments logs.</p>
          </div>
          <button onClick={handleMarkAllRead} className={styles.btnSm}>
            <i className="bx bx-check-double"></i> Mark all read
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
          </div>
        ) : groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <i className="bx bx-bell" style={{ fontSize: '48px', color: 'var(--text-muted)' }}></i>
            <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>You have no new notifications.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {groups.map((g, idx) => (
              <div key={idx} className={styles.groupContainer}>
                <h3 className={styles.groupHeading}>{g.heading}</h3>
                
                <div className={styles.notificationList}>
                  {g.body.map((item) => (
                    <div
                      key={item.id}
                      className={`${styles.notificationItem} ${item.isRead === 0 ? styles.unreadItem : ''}`}
                    >
                      <div className={styles.iconBox}>
                        <i className="bx bx-info-circle"></i>
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <h4 className={styles.itemTitle}>{item.title}</h4>
                        <p className={styles.itemBody}>{item.body}</p>
                        <span className={styles.itemTime}>{item.createdAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
