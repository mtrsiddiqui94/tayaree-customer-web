'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Container } from '@/components/layout/Container';
import { api } from '@/lib/api';
import styles from './track.module.css';

interface PackageItemData {
  img: string;
  name: string;
  v: string;
}

interface TimelineStep {
  label: string;
  chip: string;
  cc: string;
  state: 'done' | 'active' | 'pending';
  date: string;
  notes?: string;
}

interface PackageTrackData {
  id: string | number;
  name: string;
  vendor: string;
  img: string;
  sideChip: string;
  sideChipClass: 'green' | 'amber' | 'red' | 'blue' | 'grey';
  eta: {
    ic: string;
    lbl: string;
    val: string;
    sub: string;
    badge: string;
    badgeShow: boolean;
  };
  map: boolean;
  dist?: string;
  dur?: string;
  driver: {
    mode: 'driver' | 'update';
    av: string;
    name: string;
    meta: string;
    rating?: string;
    phone?: string;
  };
  contents: {
    heading: string;
    items: string;
  };
  together: boolean;
  items: PackageItemData[];
  timeline: TimelineStep[];
}

function mapStatus(status: string) {
  const s = (status || '').toLowerCase();
  if (s.includes('deliver') || s.includes('complete') || s.includes('done')) {
    return { chip: 'Delivered', cc: 'green' as const, sideChipClass: 'green' as const };
  }
  if (s.includes('out') || s.includes('dispatch') || s.includes('transit')) {
    return { chip: 'Out for Delivery', cc: 'amber' as const, sideChipClass: 'amber' as const };
  }
  if (s.includes('prepar') || s.includes('process') || s.includes('confirm')) {
    return { chip: 'Preparing', cc: 'blue' as const, sideChipClass: 'blue' as const };
  }
  if (s.includes('cancel') || s.includes('fail')) {
    return { chip: 'Cancelled', cc: 'red' as const, sideChipClass: 'red' as const };
  }
  return { chip: status || 'Processing', cc: 'grey' as const, sideChipClass: 'grey' as const };
}

function buildTimeline(trackingData: any, status: string, orderDate: string, deliveryDate: string): TimelineStep[] {
  if (trackingData?.tracking_events && Array.isArray(trackingData.tracking_events) && trackingData.tracking_events.length > 0) {
    return trackingData.tracking_events.map((ev: any, idx: number, arr: any[]) => {
      const isDone = ev.is_completed || ev.status === 'done';
      const isActive = !isDone && idx === arr.findIndex((e: any) => !e.is_completed);
      return {
        label: ev.title || ev.label || ev.status_label || 'Update',
        chip: isDone ? 'Done' : isActive ? 'Active' : 'Pending',
        cc: isDone ? 'green' : isActive ? 'amber' : 'grey',
        state: (isDone ? 'done' : isActive ? 'active' : 'pending') as 'done' | 'active' | 'pending',
        date: ev.date || ev.created_at || '',
        notes: ev.description || ev.notes,
      };
    });
  }

  const s = (status || '').toLowerCase();
  const base: TimelineStep[] = [
    { label: 'Order Placed', chip: 'Done', cc: 'green', state: 'done', date: orderDate || '' },
    { label: 'Vendor Confirmed', chip: 'Accepted', cc: 'green', state: 'done', date: '' },
  ];

  if (s.includes('cancel')) {
    base.push({ label: 'Cancelled', chip: 'Cancelled', cc: 'red', state: 'active', date: '' });
    return base;
  }
  if (s.includes('deliver') || s.includes('complete') || s.includes('done')) {
    base.push({ label: 'Preparing', chip: 'Prepared', cc: 'green', state: 'done', date: '' });
    base.push({ label: 'Out for Delivery', chip: 'Dispatched', cc: 'green', state: 'done', date: '' });
    base.push({ label: 'Delivered', chip: 'Delivered', cc: 'green', state: 'done', date: deliveryDate });
    return base;
  }
  if (s.includes('out') || s.includes('dispatch') || s.includes('transit')) {
    base.push({ label: 'Preparing', chip: 'Prepared', cc: 'green', state: 'done', date: '' });
    base.push({ label: 'Out for Delivery', chip: 'Delivering', cc: 'amber', state: 'active', date: '', notes: 'Your package is on its way.' });
    base.push({ label: 'Delivered', chip: 'Pending', cc: 'grey', state: 'pending', date: deliveryDate || 'Pending' });
    return base;
  }
  if (s.includes('prepar') || s.includes('process')) {
    base.push({ label: 'Preparing', chip: 'Preparing', cc: 'amber', state: 'active', date: '', notes: 'Your vendor is currently preparing your order.' });
    base.push({ label: 'Out for Delivery', chip: 'Pending', cc: 'grey', state: 'pending', date: '' });
    base.push({ label: 'Delivered', chip: 'Pending', cc: 'grey', state: 'pending', date: '' });
    return base;
  }
  base.push({ label: 'Preparing', chip: 'Upcoming', cc: 'grey', state: 'pending', date: '' });
  base.push({ label: 'Out for Delivery', chip: 'Pending', cc: 'grey', state: 'pending', date: '' });
  base.push({ label: 'Delivered', chip: 'Pending', cc: 'grey', state: 'pending', date: deliveryDate || '' });
  return base;
}

function buildPackageTrackData(pkg: any, trackingData: any): PackageTrackData {
  const status = pkg.package_status || pkg.status || '';
  const { chip, sideChipClass } = mapStatus(status);

  const rawItems = pkg.service_items || pkg.items || pkg.line_item || [];
  const serviceItems: PackageItemData[] = (Array.isArray(rawItems) ? rawItems : []).map((si: any) => ({
    img: si.image_url || si.imageUrl || pkg.image_url || '',
    name: si.item_name || si.name || 'Item',
    v: si.variant_name || (si.quantity ? `Qty ${si.quantity}` : ''),
  }));

  const driver = trackingData?.driver;
  const hasDriver = driver && (driver.name || driver.driver_name);
  const initials = (str: string) =>
    (str || '??')
      .split(' ')
      .map((w: string) => w[0] || '')
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const driverAv = hasDriver ? initials(driver.name || driver.driver_name) : 'update';
  const s = status.toLowerCase();
  const isOut = s.includes('out') || s.includes('dispatch') || s.includes('transit');
  const isDel = s.includes('deliver') || s.includes('complete') || s.includes('done');

  const etaVal = trackingData?.estimated_arrival || trackingData?.eta || pkg.delivery_date || pkg.event_date || 'Date pending';
  const etaSub = trackingData?.location_description || (isDel ? 'Package has been delivered' : isOut ? 'Driver is on the way' : 'Vendor is preparing your order');

  const realName = pkg.package_name || pkg.item_name || pkg.name || pkg.title || pkg.package_title || 'Package Details';
  const realVendor = pkg.vendor_name || pkg.store_name || pkg.vendor || pkg.seller_name || '';

  return {
    id: pkg.order_package_line_id || pkg.order_item_id || pkg.id || Math.random(),
    name: realName,
    vendor: realVendor,
    img: pkg.image_url || '',
    sideChip: chip,
    sideChipClass,
    eta: {
      ic: isDel ? 'bxs-check-circle' : isOut ? 'bxs-truck' : 'bxs-time',
      lbl: isDel ? 'Delivered' : isOut ? 'Estimated arrival' : 'Scheduled delivery',
      val: etaVal,
      sub: etaSub,
      badge: isDel ? 'Completed' : isOut ? 'Live' : 'On schedule',
      badgeShow: true,
    },
    map: isOut && !!hasDriver && !!trackingData?.distance,
    dist: trackingData?.distance,
    dur: trackingData?.duration,
    driver: hasDriver
      ? {
          mode: 'driver',
          av: driverAv,
          name: driver.name || driver.driver_name || 'Driver',
          meta: [driver.vehicle, driver.vehicle_number ? '· ' + driver.vehicle_number : ''].filter(Boolean).join(' '),
          rating: driver.rating ? `${driver.rating}${driver.total_deliveries ? ' · ' + driver.total_deliveries + ' deliveries' : ''}` : undefined,
          phone: driver.phone || driver.contact_number,
        }
      : {
          mode: 'update',
          av: 'update',
          name: 'Order Update',
          meta: isDel
            ? 'Your package has been delivered successfully.'
            : `${pkg.vendor_name || 'Vendor'} is preparing your order. A driver will be assigned on event day.`,
        },
    contents: {
      heading: serviceItems.length > 0 ? `All ${serviceItems.length} item${serviceItems.length !== 1 ? 's' : ''} arriving together` : 'Package details',
      items: serviceItems.length > 0 ? `${serviceItems.length} items` : '1 package',
    },
    together: true,
    items: serviceItems,
    timeline: buildTimeline(trackingData, status, pkg.booking_date || pkg.order_date || '', pkg.delivery_date || ''),
  };
}

export default function ItemTrackingPage({ params }: { params: Promise<{ id: string; itemId: string }> }) {
  const unwrappedParams = React.use(params);
  const orderId = unwrappedParams.id;
  const itemId = unwrappedParams.itemId;

  const [packages, setPackages] = useState<PackageTrackData[]>([]);
  const [activePkgIndex, setActivePkgIndex] = useState(0);
  const [orderMeta, setOrderMeta] = useState({ orderNumber: `#TAY-${orderId}`, orderDate: '', totalPackages: 0 });
  const [shippingAddress, setShippingAddress] = useState({ name: '', line: '', phone: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      let detailData: any = null;
      try {
        const detailRes = await api.get<{ status: boolean; data: any }>(
          `/api/v1/order/items/${itemId}/detail/${orderId}?is_full=1`
        );
        if (detailRes && detailRes.status && detailRes.data) {
          detailData = detailRes.data;
        }
      } catch {
        // Non-critical, fallback to order list
      }

      let allPkgs: any[] = [];
      if (detailData?.line_item && Array.isArray(detailData.line_item) && detailData.line_item.length > 0) {
        allPkgs = detailData.line_item;
      } else if (detailData) {
        allPkgs = [detailData];
      } else {
        const orderRes = await api.get<{ status: boolean; data: any }>(`/api/v1/order/list?order_id=${orderId}`).catch(() => null);
        const rawData = orderRes?.data;
        allPkgs = rawData?.order_list || rawData?.packages || (Array.isArray(rawData) ? rawData : []);
      }

      if (!allPkgs || allPkgs.length === 0) {
        setError('No packages found for this order.');
        setIsLoading(false);
        return;
      }

      const first = allPkgs[0] || detailData || {};
      const rawOrdNum =
        detailData?.order_detail?.order_number ||
        detailData?.order_number ||
        first.order_package_line_id ||
        first.order_number ||
        orderId;

      const formattedOrdNum = String(rawOrdNum).startsWith('#')
        ? String(rawOrdNum)
        : (String(rawOrdNum).includes('-') ? `#${rawOrdNum}` : `#SXE-224-${String(rawOrdNum).padStart(6, '0')}`);

      setOrderMeta({
        orderNumber: formattedOrdNum,
        orderDate: detailData?.event_date ? `Event ${detailData.event_date}` : first.event_date ? `Event ${first.event_date}` : first.booking_date ? `Placed ${first.booking_date}` : '',
        totalPackages: allPkgs.length,
      });

      const addr = detailData?.shipping_address || first.shipping_address;
      if (addr) {
        setShippingAddress({
          name: detailData?.shipping_name || first.shipping_name || first.contact_name || '',
          line: typeof addr === 'string' ? addr : addr.address || '',
          phone: detailData?.shipping_phone || first.shipping_phone || '',
        });
      }

      const trackingResults = await Promise.all(
        allPkgs.map((pkg: any) =>
          api
            .get<{ status: boolean; data: any }>(`/api/v1/order/items/${pkg.order_package_line_id || pkg.id || itemId}/tracking`)
            .catch(() => null)
        )
      );

      const built: PackageTrackData[] = allPkgs.map((pkg: any, idx: number) => {
        const tRes = trackingResults[idx] as any;
        const tData = tRes?.status ? tRes.data : null;
        if (idx === 0 && tData?.shipping_address) {
          setShippingAddress({
            name: tData.shipping_name || tData.contact_name || '',
            line: tData.shipping_address || '',
            phone: tData.shipping_phone || tData.contact_phone || '',
          });
        }
        return buildPackageTrackData(pkg, tData);
      });

      setPackages(built);

      const matchIdx = built.findIndex((p) => String(p.id) === String(itemId));
      setActivePkgIndex(matchIdx >= 0 ? matchIdx : 0);
    } catch {
      setError('Failed to load tracking information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, itemId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectPkg = (idx: number) => {
    setActivePkgIndex(idx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activePkg = packages[activePkgIndex];

  return (
    <>
      <Header />
      <Container style={{ paddingBottom: '100px' }}>
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <Link href="/orders">My Orders</Link>
          <span className={styles.sep}>/</span>
          <Link href={`/orders/${orderId}`}>Order Details</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Track Order</span>
        </nav>

        <div className={styles.pageHead}>
          <div>
            <h1 className={styles.pageTitle}>Track Order</h1>
            <p className={styles.pageSub}>
              Live delivery status for each package in order {orderMeta.orderNumber}.
            </p>
          </div>
          <Link href={`/orders/${orderId}`} className={styles.backLink}>
            <i className="bx bx-arrow-back"></i> Back to Order
          </Link>
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '36px', color: 'var(--primary)' }}></i>
            <p style={{ marginTop: '16px', fontFamily: 'Poppins, sans-serif', fontSize: '14px', color: 'var(--text-muted)' }}>
              Loading tracking details…
            </p>
          </div>
        )}

        {!isLoading && error && (
          <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: 'Poppins, sans-serif', color: 'var(--text-muted)' }}>
            <i className="bx bx-error-circle" style={{ fontSize: '40px', color: 'var(--primary)', display: 'block', marginBottom: '12px' }}></i>
            <p>{error}</p>
            <button
              onClick={loadData}
              style={{
                marginTop: '16px',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && activePkg && (
          <div className={styles.layout}>
            {/* LEFT COLUMN */}
            <div>
              {/* ETA Hero Card */}
              <div className={styles.etaCard}>
                <div className={styles.etaIc}>
                  <i className={`bx ${activePkg.eta.ic}`}></i>
                </div>
                <div className={styles.etaInfo}>
                  <div className={styles.etaLbl}>{activePkg.eta.lbl}</div>
                  <div className={styles.etaVal}>{activePkg.eta.val}</div>
                  <div className={styles.etaSub}>
                    <i className="bx bx-map"></i>
                    {activePkg.eta.sub}
                  </div>
                </div>
                {activePkg.eta.badgeShow && (
                  <span className={`${styles.etaBadge} ${activePkg.map ? styles.live : ''}`}>
                    {activePkg.eta.badge}
                  </span>
                )}
              </div>

              {/* Map Card (Only shown if real distance/live driver data exists) */}
              {activePkg.map && (
                <div className={styles.mapCard}>
                  <svg className={styles.mapSvg} viewBox="0 0 760 300" preserveAspectRatio="xMidYMid slice">
                    <defs>
                      <linearGradient id="mapbg" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#EEF2F6" />
                        <stop offset="1" stopColor="#E2E8F0" />
                      </linearGradient>
                    </defs>
                    <rect width="760" height="300" fill="url(#mapbg)" />
                    <g stroke="#D4DBE3" strokeWidth="14" fill="none" strokeLinecap="round">
                      <path d="M-20 80 H780" />
                      <path d="M-20 210 H780" />
                      <path d="M150 -20 V320" />
                      <path d="M470 -20 V320" />
                      <path d="M640 -20 V320" />
                    </g>
                    <g stroke="#FFFFFF" strokeWidth="2" strokeDasharray="8 10" fill="none">
                      <path d="M-20 80 H780" />
                      <path d="M-20 210 H780" />
                      <path d="M150 -20 V320" />
                      <path d="M470 -20 V320" />
                    </g>
                    <g fill="#DFE6EE">
                      <rect x="180" y="100" width="120" height="90" rx="6" />
                      <rect x="320" y="100" width="120" height="90" rx="6" />
                      <rect x="500" y="100" width="110" height="90" rx="6" />
                      <rect x="180" y="20" width="120" height="40" rx="6" />
                    </g>
                    <path d="M210 175 C 300 150, 360 120, 470 95 S 600 70, 660 60" stroke="#D71921" strokeWidth="4" fill="none" strokeLinecap="round" />
                    <circle cx="210" cy="175" r="9" fill="#fff" stroke="#666" strokeWidth="3" />
                    <g transform="translate(470 95)">
                      <circle r="16" fill="#D71921" opacity="0.18" />
                      <circle r="10" fill="#D71921" />
                      <text x="0" y="4" fontSize="11" fill="#fff" textAnchor="middle" fontFamily="Arial">🚚</text>
                    </g>
                    <g transform="translate(660 60)">
                      <path d="M0 -22 C -10 -22 -16 -14 -16 -6 C -16 4 0 16 0 16 C 0 16 16 4 16 -6 C 16 -14 10 -22 0 -22 Z" fill="#1A7A36" />
                      <circle cx="0" cy="-6" r="5" fill="#fff" />
                    </g>
                  </svg>
                  <div className={styles.mapNote}>Illustrative map</div>
                  <div className={styles.mapLiveBadge}>Live</div>
                  {(activePkg.dist || activePkg.dur) && (
                    <div className={styles.mapOverlay}>
                      {activePkg.dist && (
                        <div>
                          <div className={styles.mapStatLbl}>Distance</div>
                          <div className={styles.mapStatVal}>{activePkg.dist}</div>
                        </div>
                      )}
                      {activePkg.dist && activePkg.dur && <div className={styles.mapDivider}></div>}
                      {activePkg.dur && (
                        <div>
                          <div className={styles.mapStatLbl}>ETA</div>
                          <div className={`${styles.mapStatVal} ${styles.red}`}>{activePkg.dur}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Driver / Order Update Card */}
              <div className={styles.drvCard}>
                {activePkg.driver.mode === 'driver' ? (
                  <>
                    <div className={styles.drvAv}>{activePkg.driver.av}</div>
                    <div className={styles.drvInfo}>
                      <div className={styles.drvName}>{activePkg.driver.name}</div>
                      <div className={styles.drvMeta}>{activePkg.driver.meta}</div>
                      {activePkg.driver.rating && (
                        <div className={styles.drvRating}>
                          <i className="bx bxs-star"></i> {activePkg.driver.rating}
                        </div>
                      )}
                    </div>
                    <div className={styles.drvActions}>
                      {activePkg.driver.phone && (
                        <a href={`tel:${activePkg.driver.phone}`} className={styles.drvBtn} title="Call driver">
                          <i className="bx bx-phone"></i>
                        </a>
                      )}
                      <Link href="/chat" className={styles.drvBtn} title="Chat with driver">
                        <i className="bx bx-chat"></i>
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.drvAv}>
                      <i className="bx bx-bullhorn"></i>
                    </div>
                    <div className={styles.drvInfo}>
                      <div className={styles.drvName}>{activePkg.driver.name}</div>
                      <div className={styles.drvMeta}>{activePkg.driver.meta}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Delivery Address (Shown if shipping address exists in API) */}
              {(shippingAddress.name || shippingAddress.line) && (
                <div className={styles.card}>
                  <div className={styles.cardInner}>
                    <div className={styles.cardTitle}>
                      <i className="bx bx-map"></i> Delivery Address
                    </div>
                    <div className={styles.addrRow}>
                      <div className={styles.addrIc}>
                        <i className="bx bx-home-heart"></i>
                      </div>
                      <div>
                        {shippingAddress.name && (
                          <div className={styles.addrName}>
                            {shippingAddress.name} <span className={styles.addrBadge}>Default</span>
                          </div>
                        )}
                        {shippingAddress.line && <div className={styles.addrLine}>{shippingAddress.line}</div>}
                        {shippingAddress.phone && (
                          <div className={styles.addrPhone}>
                            <i className="bx bx-phone"></i> {shippingAddress.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* What's Being Delivered — Lists ONLY real packages in this order */}
              <div className={styles.card}>
                <div className={styles.cardInner}>
                  <div className={styles.cardTitle}>
                    <i className="bx bx-package"></i> What&apos;s Being Delivered{' '}
                    <span className={styles.count}>{packages.length} package{packages.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div>
                    {packages.map((p, pIdx) => (
                      <div key={String(p.id || pIdx)} className={styles.ddPkg}>
                        <div className={styles.ddPkgHead}>
                          {p.img ? (
                            <img
                              src={p.img}
                              alt={p.name}
                              className={styles.ddPkgImg}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div
                              className={styles.ddPkgImg}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                color: 'var(--text-muted)',
                              }}
                            >
                              <i className="bx bx-box"></i>
                            </div>
                          )}
                          <div className={styles.ddPkgInfo}>
                            <div className={styles.ddPkgName}>{p.name}</div>
                            {p.vendor && <div className={styles.ddPkgVendor}>{p.vendor}</div>}
                            <div className={styles.ddPkgMeta}>
                              <i className="bx bx-box"></i> {p.contents.items}
                            </div>
                          </div>
                          <span className={`${styles.ddStatus} ${styles[p.sideChipClass]}`}>
                            {p.sideChip}
                          </span>
                        </div>
                        <div className={`${styles.ddNote} ${styles.together}`}>
                          <i className="bx bx-check-circle"></i>
                          {p.contents.heading}
                        </div>
                        {p.items.length > 0 && (
                          <div className={styles.ddItems}>
                            {p.items.map((it, idx) => (
                              <div key={idx} className={styles.ddItem}>
                                {it.img && (
                                  <img
                                    src={it.img}
                                    alt={it.name}
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                )}
                                <div className={styles.ddItemName}>{it.name}</div>
                                {it.v && <div className={styles.ddItemVar}>{it.v}</div>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline (for Active Package) */}
              <div className={styles.card}>
                <div className={styles.cardInner}>
                  <div className={styles.cardTitle}>
                    <i className="bx bx-list-check"></i> Live Tracking
                  </div>
                  <div>
                    {activePkg.timeline.map((step, idx) => {
                      const isLast = idx === activePkg.timeline.length - 1;
                      const iconClass =
                        step.state === 'done'
                          ? 'bx-check'
                          : step.state === 'active'
                          ? 'bx-loader-alt'
                          : 'bx-dots-horizontal-rounded';

                      return (
                        <div key={idx} className={styles.tlRow}>
                          <div className={styles.tlG}>
                            <div className={`${styles.tlDot} ${styles[step.state]}`}>
                              <i className={`bx ${iconClass}`}></i>
                            </div>
                            {!isLast && (
                              <div className={`${styles.tlConn} ${step.state === 'done' ? styles.done : ''}`}></div>
                            )}
                          </div>
                          <div className={styles.tlBody}>
                            <div className={styles.tlTop}>
                              <span className={`${styles.tlLabel} ${step.state === 'pending' ? styles.pending : ''}`}>
                                {step.label}
                              </span>
                              <span className={`${styles.tlChip} ${styles[step.cc]}`}>{step.chip}</span>
                            </div>
                            {step.date && <div className={styles.tlDate}>{step.date}</div>}
                            {step.notes && <div className={styles.tlNotes}>{step.notes}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <aside>
              <div className={styles.sidebarSticky}>
                <div className={styles.bookingCard}>
                  <div className={styles.sidebarHead}>
                    <div className={styles.shEyebrow}>Tracking Order</div>
                    <div className={styles.shTitle}>{orderMeta.orderNumber}</div>
                    <div className={styles.shSub}>
                      {packages.length} package{packages.length !== 1 ? 's' : ''}
                      {orderMeta.orderDate ? ` · ${orderMeta.orderDate}` : ''}
                    </div>
                  </div>

                  <div className={styles.pkListTitle}>Packages in this Order</div>

                  <div>
                    {packages.map((pkg, idx) => {
                      const isActive = idx === activePkgIndex;
                      return (
                        <button
                          key={String(pkg.id || idx)}
                          type="button"
                          className={`${styles.pkItem} ${isActive ? styles.active : ''}`}
                          onClick={() => selectPkg(idx)}
                        >
                          {pkg.img ? (
                            <img
                              src={pkg.img}
                              alt={pkg.name}
                              className={styles.pkImg}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div
                              className={styles.pkImg}
                              style={{
                                background: 'var(--surface-2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '8px',
                                fontSize: '18px',
                                color: 'var(--text-muted)',
                              }}
                            >
                              <i className="bx bx-box"></i>
                            </div>
                          )}
                          <div className={styles.pkInfo}>
                            <div className={styles.pkName}>{pkg.name}</div>
                            {pkg.vendor && <div className={styles.pkVendor}>{pkg.vendor}</div>}
                            <span className={`${styles.pkChip} ${styles[pkg.sideChipClass]}`}>
                              {pkg.sideChip}
                            </span>
                          </div>
                          <i className={`bx bx-chevron-right ${styles.pkChev}`}></i>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Support Card */}
                <div className={styles.supportCard}>
                  <div className={styles.scTitle}>
                    <i className="bx bx-support"></i> Need help with delivery?
                  </div>
                  <div className={styles.scSub}>
                    Running late or something missing? Our support team is here for your event day.
                  </div>
                  <Link href="/chat" className={styles.scBtn}>
                    <i className="bx bx-message-rounded-dots"></i> Contact Support
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        )}

        {!isLoading && !error && packages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}>
            <i className="bx bx-package" style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}></i>
            <p>No packages found for this order.</p>
            <Link href={`/orders/${orderId}`} style={{ display: 'inline-block', marginTop: '16px', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              ← Back to Order Details
            </Link>
          </div>
        )}
      </Container>
      <Footer />
    </>
  );
}