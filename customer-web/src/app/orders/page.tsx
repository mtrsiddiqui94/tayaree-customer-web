'use client';

import React, { useState, useEffect } from 'react';
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
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [buyAgainItems, setBuyAgainItems] = useState<OrderBuyAgain[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'transit' | 'delivered' | 'cancelled'>('all');
  
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
    loadData();
  }, []);

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
        })));
      }

      // Fetch Orders
      const res = await api.get<{ status: boolean; data: any[] }>('/api/v1/order/list?limit=20&page=1');
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
              variantName: itm.variant_name || 'Standard'
            }));

            parsedOrders.push({
              id: ord.order_id,
              order_number: ord.order_number || ord.order_package_line_id?.toString() || `ORD-${ord.order_id}`,
              order_date: ord.booking_date || ord.delivery_date || 'unset',
              total_amount: formatPrice(ord.rate_per_head || ord.per_head_amount || ord.total_amount),
              status: String(ord.package_status || 'unset'),
              status_id: 1, // Fallback
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

  // Filter orders matching active Tab selection
  const filteredOrders = orders.filter((ord) => {
    const s = ord.status.toLowerCase();
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return s.includes('pending') || s.includes('placed') || ord.status_id === 1;
    if (activeTab === 'transit') return s.includes('transit');
    if (activeTab === 'delivered') return s.includes('complete') || s.includes('delivered') || ord.status_id === 4;
    if (activeTab === 'cancelled') return s.includes('cancel') || ord.status_id === 5;
    return true;
  });

  const getStatusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('complete') || s.includes('delivered')) return styles.confirmed;
    if (s.includes('transit')) return styles.transit;
    if (s.includes('cancel')) return styles.cancelled;
    return styles.pending; // Default for pending/active
  };

  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('complete') || s.includes('delivered')) return 'bx bx-check-circle';
    if (s.includes('transit')) return 'bx bx-truck';
    if (s.includes('cancel')) return 'bx bx-x-circle';
    return 'bx bx-time-five';
  };

  return (
    <DashboardLayout breadcrumbTitle="My Orders">
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

      {/* DASHBOARD CONTENT (replaces old embedded sidebar) */}
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
                    <Link href="/service-listing" className={styles.seeAll}>See all <i className='bx bx-chevron-right'></i></Link>
                  </div>
                  <div className={styles.buyAgainScroll}>
                    {buyAgainItems.map((ba, i) => (
                      <Link href={ba.endpointUri} className={styles.baCard} key={i}>
                        <img className={styles.baImg} src={ba.imageUrl} alt={ba.itemName} />
                        <div className={styles.baInfo}>
                          <div className={styles.baName}>{ba.itemName}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Tabs */}
              <div className={styles.statusTabs}>
                <button onClick={() => setActiveTab('all')} className={`${styles.statusTab} ${activeTab === 'all' ? styles.active : ''}`}>
                  All <span className={styles.tabCount}>{orders.length}</span>
                </button>
                <button onClick={() => setActiveTab('active')} className={`${styles.statusTab} ${activeTab === 'active' ? styles.active : ''}`}>
                  Active <span className={styles.tabCount}>{orders.filter(o => o.status.toLowerCase().includes('pending') || o.status.toLowerCase().includes('placed') || o.status_id === 1).length}</span>
                </button>
                <button onClick={() => setActiveTab('transit')} className={`${styles.statusTab} ${activeTab === 'transit' ? styles.active : ''}`}>
                  In Transit <span className={styles.tabCount}>{orders.filter(o => o.status.toLowerCase().includes('transit')).length}</span>
                </button>
                <button onClick={() => setActiveTab('delivered')} className={`${styles.statusTab} ${activeTab === 'delivered' ? styles.active : ''}`}>
                  Delivered <span className={styles.tabCount}>{orders.filter(o => o.status.toLowerCase().includes('complete') || o.status.toLowerCase().includes('delivered') || o.status_id === 4).length}</span>
                </button>
                <button onClick={() => setActiveTab('cancelled')} className={`${styles.statusTab} ${activeTab === 'cancelled' ? styles.active : ''}`}>
                  Cancelled <span className={styles.tabCount}>{orders.filter(o => o.status.toLowerCase().includes('cancel') || o.status_id === 5).length}</span>
                </button>
              </div>

              {/* Filter Row */}
              <div className={styles.filterRow}>
                <div className={styles.filterSearch}>
                  <i className='bx bx-search'></i>
                  <input type="text" placeholder="Search orders by name or #..." />
                </div>
                <div className={`${styles.filterChip} ${styles.active}`}>All</div>
                <div className={styles.filterChip}>3 Months</div>
                <div className={styles.filterChip}>6 Months</div>
                <div className={styles.filterChip}>12 Months</div>
                <div className={styles.filterChip}><i className='bx bx-calendar'></i> Custom</div>
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
                  <Link href="/" className={styles.btnSm} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: '16px', background: 'var(--primary)', color: '#fff', padding: '0 20px', height: '36px', borderRadius: '18px', textDecoration: 'none', fontWeight: 600 }}>
                    Explore Services
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredOrders.map((ord, index) => {
                    return (
                      <div key={`${ord.id}-${index}`} className={styles.orderCard} onClick={() => router.push(`/orders/${ord.id}`)}>
                        <div className={styles.ocPad}>
                          <div className={styles.ciHeader}>
                            {ord.imageUrl ? (
                              <img className={styles.ciImg} src={ord.imageUrl} alt={ord.packageName} />
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
                                {ord.noOfGuests > 0 && <span className={styles.ciMeta}><i className='bx bx-group'></i>{ord.noOfGuests} Guests</span>}
                                {ord.timeOfDayLabel && <span className={styles.ciMeta}><i className='bx bx-sun'></i>{ord.timeOfDayLabel}</span>}
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
                          
                          <div className={styles.ciContent}>
                            <div className={styles.ciCarouselWrap}>
                              <div className={styles.ciPhotoCarousel}>
                                {ord.items.map((itm, idx) => (
                                  <div className={styles.ciPhotoCard} key={idx}>
                                    {itm.image_url ? (
                                      <img src={itm.image_url} alt={itm.item_name} />
                                    ) : (
                                      <div style={{width: '104px', height: '84px', background: 'var(--input-bg)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px'}}>
                                        <i className='bx bx-image' style={{fontSize: '24px', color: 'var(--text-muted)'}}></i>
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
                      </div>
                    );
                  })}
                </div>
              )}
      </div>
      {/* END DASHBOARD CONTENT */}
    </DashboardLayout>
  );
}
