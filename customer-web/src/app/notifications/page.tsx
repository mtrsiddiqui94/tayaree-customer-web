'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import styles from './notifications.module.css';

interface NotificationBody {
  id: number;
  title: string;
  body: string;
  isRead: number;
  createdAt: string;
  iconUrl?: string;
  type?: string;
}

interface NotificationGroup {
  heading: string;
  body: NotificationBody[];
}

export default function NotificationsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setTimeout(() => router.push('/login?redirect=/notifications'), 0);
      return;
    }
    loadNotifications();
    loadUnreadCount();
  }, []);

  const loadUnreadCount = async () => {
    try {
      const res = await api.get<any>('/api/v1/notification/unread-count').catch(() => null);
      if (res && res.status) {
        setUnreadCount(res.data?.count || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<any>('/api/v1/notification/list?limit=30&page=1')
        .catch(() => null);

      if (res && res.status && res.data) {
        let total = 0;
        const parsedGroups: NotificationGroup[] = (res.data.notificationGroups || []).map((g: any) => {
          total += (g.body || []).length;
          return {
            heading: g.heading || 'Recent Updates',
            body: (g.body || []).map((b: any) => ({
              id: b.id,
              title: b.title || 'unset',
              body: b.body || 'unset',
              isRead: b.isRead || b.is_read || 0,
              createdAt: b.createdAt || b.created_at || 'unset',
              iconUrl: b.iconUrl || b.icon_url || '',
              type: b.type || 'system'
            })),
          };
        });
        setGroups(parsedGroups);
        setTotalCount(total);
      } else {
        setGroups([]);
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
      setUnreadCount(0);
      setGroups(prev => prev.map(g => ({
        ...g,
        body: g.body.map(b => ({ ...b, isRead: 1 }))
      })));
    } catch (e) {
      setGroups(prev => prev.map(g => ({
        ...g,
        body: g.body.map(b => ({ ...b, isRead: 1 }))
      })));
      setUnreadCount(0);
      showToast('Marked as read.');
    }
  };

  const handleSelectNotif = async (notif: NotificationBody) => {
    // Mark locally as read
    if (notif.isRead === 0) {
      setGroups(prev => prev.map(g => ({
        ...g,
        body: g.body.map(b => b.id === notif.id ? { ...b, isRead: 1 } : b)
      })));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      setIsDetailLoading(true);
      setSelectedNotif(null);
      const res = await api.get<any>(`/api/v1/notification/${notif.id}`).catch(() => null);
      if (res && res.status && res.data) {
        setSelectedNotif(res.data);
      } else {
        // Fallback to basic info from list
        setSelectedNotif({
          title: notif.title,
          body: `<p>${notif.body}</p>`,
          created_at: notif.createdAt,
          type: notif.type || 'system'
        });
      }
    } catch (e) {
      setSelectedNotif({
        title: notif.title,
        body: `<p>${notif.body}</p>`,
        created_at: notif.createdAt,
        type: notif.type || 'system'
      });
    } finally {
      setIsDetailLoading(false);
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case 'orders':
      case 'order': return { icon: 'bx-package', pillClass: styles.pillOrder, bgClass: styles.pillBgOrder, iconClass: styles.iconOrder, label: 'Order Update' };
      case 'events':
      case 'event': return { icon: 'bx-calendar-event', pillClass: styles.pillEvent, bgClass: styles.pillBgEvent, iconClass: styles.iconEvent, label: 'Event Reminder' };
      case 'payments':
      case 'payment': return { icon: 'bx-credit-card', pillClass: styles.pillPayment, bgClass: styles.pillBgPayment, iconClass: styles.iconPayment, label: 'Payment' };
      case 'promotions':
      case 'offer': return { icon: 'bx-purchase-tag', pillClass: styles.pillOffer, bgClass: styles.pillBgOffer, iconClass: styles.iconOffer, label: 'Special Offer' };
      default: return { icon: 'bx-info-circle', pillClass: styles.pillSystem, bgClass: styles.pillBgSystem, iconClass: styles.iconSystem, label: 'System' };
    }
  };

  return (
    <DashboardLayout breadcrumbTitle="Notifications">
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', right: '20px',
          backgroundColor: toast.type === 'success' ? 'var(--success)' : toast.type === 'error' ? 'var(--primary)' : '#0277bd',
          color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: 10000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)', fontFamily: 'Poppins, sans-serif', fontSize: '13px',
          fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <i className={toast.type === 'success' ? 'bx bx-check-circle' : toast.type === 'error' ? 'bx bx-error-circle' : 'bx bx-info-circle'} style={{ fontSize: '18px' }}></i>
          {toast.message}
        </div>
      )}
      <div className={styles.dashContent}>

        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Your Notifications</h1>
            <p className={styles.pageSub}>You have <strong>{unreadCount} unread</strong> notifications across all categories</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
              <i className="bx bx-check-double"></i> Mark all as read
            </button>
            <button className={styles.btnGhost}>
              <i className="bx bx-cog"></i> Preferences
            </button>
          </div>
        </div>

        <div className={styles.statsStrip}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(215,25,33,0.10)' }}>
              <i className="bx bx-bell" style={{ color: 'var(--primary)' }}></i>
            </div>
            <div>
              <div className={styles.statVal}>{totalCount}</div>
              <div className={styles.statLbl}>Total Notifications</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(215,25,33,0.10)' }}>
              <i className="bx bx-envelope" style={{ color: 'var(--primary)' }}></i>
            </div>
            <div>
              <div className={styles.statVal} style={{ color: 'var(--primary)' }}>{unreadCount}</div>
              <div className={styles.statLbl}>Unread</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(40,167,69,0.10)' }}>
              <i className="bx bx-check-double" style={{ color: 'var(--success)' }}></i>
            </div>
            <div>
              <div className={styles.statVal}>{totalCount - unreadCount}</div>
              <div className={styles.statLbl}>Read</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(255,168,0,0.10)' }}>
              <i className="bx bx-time" style={{ color: 'var(--warning)' }}></i>
            </div>
            <div>
              <div className={styles.statVal}>{groups[0]?.body.length || 0}</div>
              <div className={styles.statLbl}>Today</div>
            </div>
          </div>
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
          <div className={styles.notifSplit}>
            <div className={styles.listPanelCard}>
              <div className={styles.filterTabs}>
                <button className={`${styles.filterTab} ${styles.active}`}>
                  All <span className={styles.tabCount}>{totalCount}</span>
                </button>
                <button className={styles.filterTab}>
                  Unread <span className={styles.tabCount}>{unreadCount}</span>
                </button>
              </div>

              <div className={styles.listHeader}>
                <span className={styles.listHeaderTitle}>Showing all {totalCount} notifications</span>
                <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
                  <i className="bx bx-check-double"></i> Mark all as read
                </button>
              </div>

              <div>
                {groups.map((g, idx) => (
                  <div key={idx}>
                    <div className={styles.dateGroupLabel}>{g.heading}</div>
                    {g.body.map((item, iIdx) => {
                      const typeStyles = getTypeStyle(item.type || 'system');
                      const isSelected = selectedNotif?.id === item.id;
                      
                      return (
                        <div
                          key={iIdx}
                          className={`${styles.notifRow} ${item.isRead === 0 ? styles.unread : styles.read} ${isSelected ? styles.selected : ''}`}
                          onClick={() => handleSelectNotif(item)}
                        >
                          <div className={`${styles.notifIcon} ${typeStyles.iconClass}`}>
                            <i className={`bx ${typeStyles.icon}`}></i>
                          </div>
                          <div className={styles.notifRowBody}>
                            <div className={styles.notifRowTitle}>{item.title}</div>
                            <div className={styles.notifRowDesc}>{item.body}</div>
                            <div className={styles.notifRowMeta}>
                              <span className={styles.notifRowTime}>{item.createdAt}</span>
                              <span className={`${styles.typePill} ${typeStyles.pillClass}`}>{typeStyles.label}</span>
                            </div>
                          </div>
                          <div className={styles.notifRowRight}>
                            {item.isRead === 0 && <div className={styles.unreadDot}></div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* DETAIL PANEL */}
            <div className={styles.detailPanel}>
              {!selectedNotif && !isDetailLoading ? (
                <div className={styles.detailCard}>
                  <div className={styles.detailEmpty}>
                    <div className={styles.detailEmptyIcon}><i className="bx bx-bell"></i></div>
                    <div className={styles.detailEmptyTitle}>Select a notification</div>
                    <div className={styles.detailEmptySub}>Click any notification on the left to view its full details here.</div>
                  </div>
                </div>
              ) : isDetailLoading ? (
                <div className={styles.detailCard} style={{ padding: '60px', textAlign: 'center' }}>
                  <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '32px', color: 'var(--primary)' }}></i>
                </div>
              ) : (
                <div className={styles.detailCard}>
                  <div className={styles.detailHd}>
                    <div className={`${styles.detailTypePill} ${getTypeStyle(selectedNotif.type).bgClass}`}>
                      <i className={`bx ${getTypeStyle(selectedNotif.type).icon}`}></i>
                      {getTypeStyle(selectedNotif.type).label}
                    </div>
                    <div className={styles.detailTitle}>{selectedNotif.title}</div>
                    <div className={styles.detailTs}>
                      <i className="bx bx-time"></i> {selectedNotif.created_at || selectedNotif.createdAt}
                    </div>
                  </div>
                  
                  <div className={styles.detailBd}>
                    <div className={styles.detailDivider}>
                      <div className={styles.detailDividerLine}></div>
                      <i className="bx bx-envelope-open"></i>
                      <div className={styles.detailDividerLine}></div>
                    </div>
                    
                    <div className={styles.detailContentCard} dangerouslySetInnerHTML={{ __html: selectedNotif.body }} />
                  </div>
                </div>
              )}

              <div className={styles.supportCard}>
                <div className={styles.supportCardInner}>
                  <div className={styles.supportAvatar}><i className="bx bx-support"></i></div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Need Help?</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Our team is available 24/7</div>
                  </div>
                </div>
                <Link href="/chat" className={styles.btnPrimary} style={{ width: '100%', height: '40px', fontSize: '14px' }}>
                  <i className="bx bx-chat"></i> Contact Support
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
