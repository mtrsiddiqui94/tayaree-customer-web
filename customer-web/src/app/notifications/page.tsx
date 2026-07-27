'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import styles from './notifications.module.css';

interface NotificationBodyItem {
  id: number;
  title: string;
  body: string;
  isRead: number;
  createdAt: string;
  iconUrl?: string;
  clickAction?: string;
  orderId?: number;
  orderItemId?: number;
  navigationUrl?: string;
  type: 'orders' | 'promotions' | 'events' | 'payments' | 'system';
}

interface NotificationGroup {
  heading: string;
  body: NotificationBodyItem[];
}

export default function NotificationsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'orders' | 'promotions' | 'events' | 'payments'>('all');
  
  const [selectedNotif, setSelectedNotif] = useState<NotificationBodyItem | null>(null);
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

  function determineCategory(item: any): 'orders' | 'promotions' | 'events' | 'payments' | 'system' {
    const clickAction = (item.clickAction || item.data?.data_click_action || item.data?.click_action || item.type || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const body = (item.body || '').toLowerCase();

    if (item.orderId || item.data?.order?.id || item.data?.order_id || clickAction.includes('order') || title.includes('order') || body.includes('order #') || title.includes('booking')) {
      return 'orders';
    }
    if (clickAction.includes('event') || title.includes('event') || title.includes('walima') || title.includes('nikkah') || title.includes('mehndi')) {
      return 'events';
    }
    if (clickAction.includes('payment') || title.includes('payment') || body.includes('pkr ') || title.includes('due') || title.includes('received')) {
      return 'payments';
    }
    if (clickAction.includes('promo') || clickAction.includes('offer') || title.includes('sale') || title.includes('offer') || title.includes('discount')) {
      return 'promotions';
    }
    return 'system';
  }

  async function loadUnreadCount() {
    try {
      const res = await api.get<any>('/api/v1/notification/unread-count').catch(() => null);
      if (res) {
        let count = 0;
        if (typeof res === 'number') count = res;
        else if (typeof res?.data === 'number') count = res.data;
        else if (res?.data?.unread_count !== undefined) count = Number(res.data.unread_count) || 0;
        else if (res?.data?.count !== undefined) count = Number(res.data.count) || 0;
        else if (res?.count !== undefined) count = Number(res.count) || 0;
        setUnreadCount(count);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadNotifications() {
    try {
      setIsLoading(true);
      const res = await api.get<any>('/api/v1/notification/list?limit=30&page=1')
        .catch(() => null);

      if (res && res.status && res.data) {
        const rawGroups = Array.isArray(res.data) ? res.data : (res.data.notificationGroups || res.data);
        let total = 0;
        const parsedGroups: NotificationGroup[] = (rawGroups || []).map((g: any) => {
          const bodyItems = (g.body || []).map((b: any) => {
            total++;
            const extractedOrderId = b.orderId || b.order_id || b.data?.order?.id || b.data?.order_id || b.data?.orderId;
            const extractedOrderItemId = b.orderItemId || b.order_item_id || b.data?.order?.order_item_id || b.data?.order_item_id;

            const item: NotificationBodyItem = {
              id: b.id || 0,
              title: b.title || 'unset',
              body: b.body || 'unset',
              isRead: b.isRead !== undefined ? b.isRead : (b.is_read !== undefined ? b.is_read : 0),
              createdAt: b.createdAt || b.created_at || 'unset',
              iconUrl: b.iconUrl || b.icon_url || '',
              clickAction: b.clickAction || b.data?.data_click_action || b.data?.click_action || '',
              orderId: extractedOrderId,
              orderItemId: extractedOrderItemId,
              navigationUrl: b.navigationUrl || b.navigation_url || '',
              type: 'system'
            };
            item.type = determineCategory(item);
            return item;
          });

          return {
            heading: g.heading || 'Recent Updates',
            body: bodyItems
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
  }

  async function handleMarkAllRead() {
    try {
      await api.post('/api/v1/notification/mark-all-read', {}).catch(() => null);
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
      showToast('Marked as read.', 'info');
    }
  }

  async function handleSelectNotif(notif: NotificationBodyItem) {
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
        const d = res.data;
        const extractedOrderId = d.orderId || d.order_id || d.data?.order_id || d.data?.order?.id || notif.orderId;
        const itemDetail: NotificationBodyItem = {
          id: d.id || notif.id,
          title: d.title || notif.title,
          body: d.body || notif.body,
          createdAt: d.createdAt || d.created_at || notif.createdAt,
          isRead: 1,
          type: determineCategory({ ...d, clickAction: d.data?.data_click_action || notif.clickAction }),
          orderId: extractedOrderId,
          navigationUrl: d.navigationUrl || d.navigation_url || notif.navigationUrl,
          clickAction: d.clickAction || d.data?.data_click_action || notif.clickAction
        };
        setSelectedNotif(itemDetail);
      } else {
        setSelectedNotif(notif);
      }
    } catch (e) {
      setSelectedNotif(notif);
    } finally {
      setIsDetailLoading(false);
    }
  }

  function getTypeStyle(type: string) {
    switch (type) {
      case 'orders':
        return { icon: 'bx-package', pillClass: styles.pillOrder, bgClass: styles.pillBgOrder, iconClass: styles.iconOrder, label: 'Order Update' };
      case 'events':
        return { icon: 'bx-calendar-event', pillClass: styles.pillEvent, bgClass: styles.pillBgEvent, iconClass: styles.iconEvent, label: 'Event Reminder' };
      case 'payments':
        return { icon: 'bx-credit-card', pillClass: styles.pillPayment, bgClass: styles.pillBgPayment, iconClass: styles.iconPayment, label: 'Payment' };
      case 'promotions':
        return { icon: 'bx-purchase-tag', pillClass: styles.pillOffer, bgClass: styles.pillBgOffer, iconClass: styles.iconOffer, label: 'Special Offer' };
      default:
        return { icon: 'bx-info-circle', pillClass: styles.pillSystem, bgClass: styles.pillBgSystem, iconClass: styles.iconSystem, label: 'System' };
    }
  }

  // Calculate stats and counts per tab
  const allItems = groups.flatMap(g => g.body);
  const unreadItemsCount = allItems.filter(i => i.isRead === 0).length;
  const ordersCount = allItems.filter(i => i.type === 'orders').length;
  const promotionsCount = allItems.filter(i => i.type === 'promotions').length;
  const eventsCount = allItems.filter(i => i.type === 'events').length;
  const paymentsCount = allItems.filter(i => i.type === 'payments').length;
  const todayGroupItems = (groups.find(g => g.heading.toLowerCase().includes('today')) || groups[0])?.body || [];

  const filterItemByTab = (item: NotificationBodyItem) => {
    if (activeTab === 'unread') return item.isRead === 0;
    if (activeTab === 'orders') return item.type === 'orders';
    if (activeTab === 'promotions') return item.type === 'promotions';
    if (activeTab === 'events') return item.type === 'events';
    if (activeTab === 'payments') return item.type === 'payments';
    return true;
  };

  const filteredGroups = groups.map(g => ({
    heading: g.heading,
    body: g.body.filter(filterItemByTab)
  })).filter(g => g.body.length > 0);

  const totalFilteredCount = filteredGroups.reduce((acc, g) => acc + g.body.length, 0);

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
              <div className={styles.statVal}>{Math.max(0, totalCount - unreadCount)}</div>
              <div className={styles.statLbl}>Read</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(255,168,0,0.10)' }}>
              <i className="bx bx-time" style={{ color: 'var(--warning)' }}></i>
            </div>
            <div>
              <div className={styles.statVal}>{todayGroupItems.length}</div>
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
            <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>You have no notifications right now.</p>
          </div>
        ) : (
          <div className={styles.notifSplit}>
            <div className={styles.listPanelCard}>
              {/* FILTER TABS */}
              <div className={styles.filterTabs}>
                <button
                  className={`${styles.filterTab} ${activeTab === 'all' ? styles.active : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All <span className={styles.tabCount}>{totalCount}</span>
                </button>
                <button
                  className={`${styles.filterTab} ${activeTab === 'unread' ? styles.active : ''}`}
                  onClick={() => setActiveTab('unread')}
                >
                  Unread <span className={styles.tabCount}>{unreadItemsCount}</span>
                </button>
                <button
                  className={`${styles.filterTab} ${activeTab === 'orders' ? styles.active : ''}`}
                  onClick={() => setActiveTab('orders')}
                >
                  Orders <span className={styles.tabCount}>{ordersCount}</span>
                </button>
                <button
                  className={`${styles.filterTab} ${activeTab === 'promotions' ? styles.active : ''}`}
                  onClick={() => setActiveTab('promotions')}
                >
                  Promotions <span className={styles.tabCount}>{promotionsCount}</span>
                </button>
                <button
                  className={`${styles.filterTab} ${activeTab === 'events' ? styles.active : ''}`}
                  onClick={() => setActiveTab('events')}
                >
                  Events <span className={styles.tabCount}>{eventsCount}</span>
                </button>
                <button
                  className={`${styles.filterTab} ${activeTab === 'payments' ? styles.active : ''}`}
                  onClick={() => setActiveTab('payments')}
                >
                  Payments <span className={styles.tabCount}>{paymentsCount}</span>
                </button>
              </div>

              {/* LIST HEADER */}
              <div className={styles.listHeader}>
                <span className={styles.listHeaderTitle}>
                  Showing {totalFilteredCount} notification{totalFilteredCount === 1 ? '' : 's'}
                </span>
                <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
                  <i className="bx bx-check-double"></i> Mark all as read
                </button>
              </div>

              {/* NOTIFICATION LIST */}
              {filteredGroups.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                  No notifications match the selected category.
                </div>
              ) : (
                <div>
                  {filteredGroups.map((g, idx) => (
                    <div key={idx}>
                      <div className={styles.dateGroupLabel}>{g.heading}</div>
                      {g.body.map((item, iIdx) => {
                        const typeStyles = getTypeStyle(item.type);
                        const isSelected = selectedNotif?.id === item.id;
                        
                        return (
                          <div
                            key={iIdx}
                            className={`${styles.notifRow} ${item.isRead === 0 ? styles.unread : styles.read} ${isSelected ? styles.selected : ''}`}
                            onClick={() => handleSelectNotif(item)}
                          >
                            <div className={`${styles.notifIcon} ${typeStyles.iconClass}`}>
                              {item.iconUrl ? (
                                <img src={item.iconUrl} alt="icon" style={{ width: '24px', height: '24px' }} />
                              ) : (
                                <i className={`bx ${typeStyles.icon}`}></i>
                              )}
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
              )}
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
              ) : selectedNotif && (
                <div className={styles.detailCard}>
                  <div className={styles.detailHd}>
                    <div className={`${styles.detailTypePill} ${getTypeStyle(selectedNotif.type).bgClass}`}>
                      <i className={`bx ${getTypeStyle(selectedNotif.type).icon}`}></i>
                      {getTypeStyle(selectedNotif.type).label}
                    </div>
                    <div className={styles.detailTitle}>{selectedNotif.title}</div>
                    <div className={styles.detailTs}>
                      <i className="bx bx-time"></i> {selectedNotif.createdAt}
                    </div>
                  </div>
                  
                  <div className={styles.detailBd}>
                    <div className={styles.detailDivider}>
                      <div className={styles.detailDividerLine}></div>
                      <i className="bx bx-envelope-open"></i>
                      <div className={styles.detailDividerLine}></div>
                    </div>
                    
                    <div className={styles.detailContentCard} dangerouslySetInnerHTML={{ __html: selectedNotif.body.startsWith('<') ? selectedNotif.body : `<p>${selectedNotif.body}</p>` }} />

                    {selectedNotif.orderId && (
                      <div>
                        <div className={styles.relatedOrderLabel}>Related Order</div>
                        <Link href={`/orders?id=${selectedNotif.orderId}`} className={styles.relatedOrderCard}>
                          <div className={`${styles.relatedOrderIcon} ${styles.iconOrder}`}>
                            <i className="bx bx-package"></i>
                          </div>
                          <div className={styles.relatedOrderInfo}>
                            <div className={styles.relatedOrderId}>Order #{selectedNotif.orderId}</div>
                            <div className={styles.relatedOrderSub}>Tap to view order details and status</div>
                          </div>
                          <i className="bx bx-chevron-right" style={{ fontSize: '20px', color: 'var(--text-secondary)' }}></i>
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className={styles.detailCta}>
                    <span className={styles.detailCtaLabel}>Action available</span>
                    <Link
                      href={
                        selectedNotif.orderId
                          ? `/orders?id=${selectedNotif.orderId}`
                          : selectedNotif.type === 'orders'
                          ? '/orders'
                          : selectedNotif.type === 'events'
                          ? '/events'
                          : selectedNotif.type === 'payments'
                          ? '/payments'
                          : selectedNotif.type === 'promotions'
                          ? '/services'
                          : '#'
                      }
                      className={styles.btnPrimary}
                      style={{ height: '36px', fontSize: '13px', padding: '0 16px' }}
                    >
                      {selectedNotif.type === 'orders' ? 'Track Order' : selectedNotif.type === 'events' ? 'View Event' : selectedNotif.type === 'payments' ? 'View Payments' : selectedNotif.type === 'promotions' ? 'Browse Offers' : 'View Details'} <i className="bx bx-right-arrow-alt"></i>
                    </Link>
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
