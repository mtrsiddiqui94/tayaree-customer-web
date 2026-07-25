'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from './orderDetail.module.css';

interface SummaryLine {
  label: string;
  value: string;
  isTotal?: boolean;
}

interface ServiceItem {
  name: string;
  description?: string;
  variant?: string;
  servings?: string;
  dietary?: string;
  price?: string;
  image_url?: string;
  images?: string[];
  included?: [string, string][];
  prep?: [string, string][];
  dietaryList?: string[];
}

interface OrderItem {
  id: number;
  name: string;
  item_name: string;
  price: string;
  quantity: number;
  image_url: string;
  status: string;
  location?: string;
  guests?: string;
  timeOfDay?: string;
  deliverAs?: string;
  paymentStatus?: string;
  savedAmount?: string;
  amountPaid?: string;
  futurePayments?: string;
  serviceItems?: ServiceItem[];
  [key: string]: any;
}

interface Order {
  id: number;
  order_number: string;
  order_date: string;
  total_amount: string;
  amount_paid?: string;
  amount_due_today?: string;
  future_payments?: string;
  savings?: string;
  promo_code?: string;
  status: string;
  status_id: number;
  payment_status: string;
  shipping_address?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  vendorName?: string;
  packageName?: string;
  items: OrderItem[];
  allOrdersList?: OrderItem[];
  summaryLines?: SummaryLine[];
  [key: string]: any;
}

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

function OrderDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unwrappedParams = React.use(params);
  const orderId = parseInt(unwrappedParams.id, 10);

  // View state: 'package' (default, matching package-detail.html) or 'order' (matching order-detail.html)
  const initialView = searchParams.get('view') === 'order' ? 'order' : 'package';
  const [currentView, setCurrentView] = useState<'package' | 'order'>(initialView);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [payTabActive, setPayTabActive] = useState<'upcoming' | 'history'>('upcoming');

  // Accordion state for expandable payment schedules per package in order view
  const [openSchedIds, setOpenSchedIds] = useState<Record<number, boolean>>({});

  // Item details modal popup state
  const [activeModalItem, setActiveModalItem] = useState<ServiceItem | null>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);

  // Sidebar Drawers State (Payment Schedule, Shipping Details, Taxes Breakdown)
  const [paySchedDrawerOpen, setPaySchedDrawerOpen] = useState(false);
  const [shippingDrawerOpen, setShippingDrawerOpen] = useState(false);
  const [taxesDrawerOpen, setTaxesDrawerOpen] = useState(false);
  const [dwAccOpen, setDwAccOpen] = useState<Record<string, boolean>>({ 'acc-1': true });

  // Product Review drawer state
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [activeReviewPkg, setActiveReviewPkg] = useState<OrderItem | null>(null);
  const [reviewStars, setReviewStars] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewErrorMsg, setReviewErrorMsg] = useState<string | null>(null);
  const [applyToAllPackages, setApplyToAllPackages] = useState(false);

  // Rate Seller drawer state
  const [sellerDrawerOpen, setSellerDrawerOpen] = useState(false);
  const [activeSellerPkg, setActiveSellerPkg] = useState<OrderItem | null>(null);
  const [sellerStars, setSellerStars] = useState(0);
  const [sellerHover, setSellerHover] = useState(0);
  const [sellerComment, setSellerComment] = useState('');
  const [sellerSubmitting, setSellerSubmitting] = useState(false);
  const [sellerErrorMsg, setSellerErrorMsg] = useState<string | null>(null);
  const [applyToAllSeller, setApplyToAllSeller] = useState(false);

  const [sellerQuestions, setSellerQuestions] = useState<Record<string, 'yes' | 'no' | 'skip'>>({
    itemAsDescribed: 'yes',
    communicative: 'yes',
    commitments: 'yes',
    professional: 'yes',
    orderAgain: 'yes',
  });

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/orders');
      return;
    }
    loadOrderDetail();
  }, [orderId]);

  useEffect(() => {
    const v = searchParams.get('view');
    if (v === 'order') setCurrentView('order');
    else if (v === 'package') setCurrentView('package');
  }, [searchParams]);

  const toggleSched = (id: number) => {
    setOpenSchedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDwAcc = (id: string) => {
    setDwAccOpen(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
          bodyList.forEach((ord: any) => {
            if (ord.order_id === orderId) found = ord;
          });
        }

        if (found) {
          try {
            const detailRes = await api.get<{ status: boolean; data: any }>(
              `/api/v1/order/items/${found.order_package_line_id}/detail/${found.order_id}?is_full=1`
            );
            if (detailRes.status && detailRes.data) {
              const d = detailRes.data;

              const rawSummary: any[] = d.summary || [];
              const summaryLines: SummaryLine[] = rawSummary.map((s: any) => {
                const label = s.label_info || s.labelInfo || s.label || '';
                const value = s.label_value || s.labelValue || s.value || '';
                const isTotal = label.toLowerCase().includes('total') || s.is_total === 1;
                return { label, value, isTotal };
              });

              // Map packages from API line_item field
              const apiLineItems: any[] = d.line_item || [];
              let parsedPackages: OrderItem[] = [];

              if (Array.isArray(apiLineItems) && apiLineItems.length > 0) {
                parsedPackages = apiLineItems.map((pkgItem: any, idx: number) => {
                  const serviceItems: ServiceItem[] = (pkgItem.service_items || pkgItem.items || []).map((si: any) => ({
                    name: si.item_name || si.name || 'Item',
                    description: si.description || '',
                    variant: si.variant_name || si.color || si.size || '',
                    servings: si.servings || '',
                    dietary: si.dietary || '',
                    price: formatPrice(si.amount || si.price),
                    image_url: si.image_url || si.imageUrl || '',
                    images: si.images || (si.image_url ? [si.image_url] : []),
                    included: si.included || [],
                    prep: si.prep || [],
                    dietaryList: si.dietaryList || []
                  }));
                  return {
                    id: pkgItem.order_item_id || pkgItem.order_package_line_id || idx + 1,
                    name: pkgItem.item_name || pkgItem.package_name || found.package_name || 'Package',
                    item_name: pkgItem.vendor_name || found.vendor_name || '',
                    price: formatPrice(pkgItem.order_total || pkgItem.amount || found.total_amount || 0),
                    amountPaid: formatPrice(pkgItem.amount_paid || pkgItem.paid_amount || ''),
                    futurePayments: formatPrice(pkgItem.amount_due || pkgItem.future_payments || ''),
                    savedAmount: formatPrice(pkgItem.saved_amount || ''),
                    quantity: pkgItem.quantity || 1,
                    image_url: pkgItem.image_url || found.image_url || '',
                    status: pkgItem.package_status || found.package_status || '',
                    paymentStatus: pkgItem.payment_status || '',
                    location: pkgItem.delivery_date || found.delivery_date || '',
                    guests: found.no_of_guests ? `${found.no_of_guests} Guests` : '',
                    timeOfDay: found.time_of_day_label || '',
                    deliverAs: found.package_deliver_as || '',
                    serviceItems
                  };
                });
              } else {
                // Fallback: build a single package entry from the list-level data
                parsedPackages = [{
                  id: found.order_package_line_id || found.order_id,
                  name: found.package_name || 'Package',
                  item_name: found.vendor_name || found.store_name || '',
                  price: formatPrice(found.rate_per_head || found.total_amount || 0),
                  amountPaid: formatPrice(found.amount_paid || ''),
                  futurePayments: formatPrice(found.future_payments || ''),
                  savedAmount: formatPrice(found.saved_amount || ''),
                  quantity: found.quantity || 1,
                  image_url: found.image_url || '',
                  status: found.package_status || '',
                  paymentStatus: found.payment_status || '',
                  location: found.delivery_date || '',
                  guests: found.no_of_guests ? `${found.no_of_guests} Guests` : '',
                  timeOfDay: found.time_of_day_label || '',
                  deliverAs: found.package_deliver_as || '',
                  serviceItems: []
                }];
              }

              const rawNum = d.order_detail?.order_number || found.order_number || found.order_package_line_id || found.order_id;
              const formattedOrdNum = String(rawNum).startsWith('#') ? String(rawNum) : `#${rawNum}`;

              let currentStatus = found.package_status || d.order_detail?.status || 'Confirmed';
              try {
                const storedCancel = localStorage.getItem('confirmed_cancellation');
                if (storedCancel) {
                  const parsedC = JSON.parse(storedCancel);
                  if (String(parsedC.orderId) === String(found.order_id) || String(parsedC.orderId) === String(orderId)) {
                    currentStatus = 'Cancelled';
                  }
                }
              } catch {}

              setOrder({
                id: found.order_id,
                order_number: formattedOrdNum,
                order_date: d.order_detail?.order_date || found.booking_date || '',
                total_amount: formatPrice(d.order_detail?.order_total || found.total_amount || 0),
                amount_paid: formatPrice(d.order_detail?.amount_paid || ''),
                amount_due_today: formatPrice(d.order_detail?.amount_due_today || ''),
                future_payments: formatPrice(d.order_detail?.future_payments || ''),
                savings: formatPrice(d.order_detail?.saved_amount || ''),
                promo_code: d.order_detail?.promo_code || '',
                status: currentStatus,
                status_id: found.status_id || 1,
                payment_status: d.payment_method?.payment_method_short_name || found.payment_status || '',
                shipping_address: d.shipping_address || '',
                contact_name: d.contact_name || '',
                contact_phone: d.contact_phone || '',
                items: parsedPackages,
                allOrdersList: parsedPackages,
                summaryLines
              });
              setIsLoading(false);
              return;
            }
          } catch (err) {
            console.error('Detail fetch error', err);
          }
        }
      }
    } catch (e) {
      console.error(e);
      showToast('Error loading details.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!orderId || isDownloading) return;
    setIsDownloading(true);
    try {
      const token = localStorage.getItem('access_token') || '';

      // Try fetching via relative proxy endpoint
      let res = await fetch(`/api/v1/order/invoice/${orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/pdf, application/json, */*'
        }
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`/api/v1/order/invoice/${orderId}`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        }).catch(() => null);
      }

      if (res && res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await res.json();
          const targetUrl = json.invoice_url || json.url || json.data?.invoice_url;
          if (targetUrl) {
            window.open(targetUrl, '_blank');
            showToast('Invoice opened in new tab.', 'success');
            return;
          }
        }

        const blob = await res.blob();
        if (blob && blob.size > 0) {
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `Invoice_${order?.order_number || orderId}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(blobUrl);
          showToast('Invoice downloaded successfully.', 'success');
          return;
        }
      }

      // Printable HTML fallback if API endpoint is unavailable
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice - ${order?.order_number || orderId}</title>
              <style>
                body { font-family: 'Poppins', sans-serif; padding: 40px; color: #111; }
                .inv-head { display: flex; justify-content: space-between; border-bottom: 2px solid #D71921; padding-bottom: 20px; margin-bottom: 20px; }
                .inv-title { font-size: 24px; font-weight: 800; color: #D71921; }
                .inv-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                .inv-total { font-size: 18px; font-weight: 800; text-align: right; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="inv-head">
                <div>
                  <div class="inv-title">TAYAREE INVOICE</div>
                  <div>Order #: ${order?.order_number || orderId}</div>
                  <div>Date: ${order?.order_date || 'N/A'}</div>
                </div>
                <div style="text-align:right">
                  <b>Vendor:</b> ${order?.vendorName || order?.items?.[0]?.name || 'Tayaree Service'}<br>
                  <b>Package:</b> ${order?.packageName || 'Package Line Item'}
                </div>
              </div>
              <h3>Order Line Items</h3>
              ${(order?.items || []).map((itm: any) => `
                <div class="inv-row">
                  <span>${itm.name || itm.item_name} (x${itm.quantity || 1})</span>
                  <span>${itm.price}</span>
                </div>
              `).join('')}
              <div class="inv-total">Total Amount: ${order?.total_amount || 'PKR 0'}</div>
              <script>window.onload = function() { window.print(); }</script>
            </body>
          </html>
        `);
        printWin.document.close();
        showToast('Invoice print view opened.', 'success');
      } else {
        showToast('Please allow popups to view/print your invoice.', 'info');
      }
    } catch (e) {
      console.error(e);
      showToast('Error generating invoice.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const openItemModal = (item: ServiceItem) => {
    setActiveModalItem(item);
    setCarouselIdx(0);
  };

  const handleCarouselNav = (dir: number) => {
    if (!activeModalItem) return;
    const imgs = activeModalItem.images || [activeModalItem.image_url || ''];
    if (!imgs.length) return;
    setCarouselIdx(prev => (prev + dir + imgs.length) % imgs.length);
  };

  const openReviewForPkg = (pkg: OrderItem) => {
    setActiveReviewPkg(pkg);
    setReviewErrorMsg(null);
    setReviewDrawerOpen(true);
  };

  const openSellerForPkg = (pkg: OrderItem) => {
    setActiveSellerPkg(pkg);
    setSellerErrorMsg(null);
    setSellerDrawerOpen(true);
  };

  const submitProductReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewErrorMsg(null);
    if (reviewStars === 0) {
      const errMsg = 'Access is restricted to items that have been delivered.';
      setReviewErrorMsg(errMsg);
      showToast(errMsg, 'error');
      return;
    }
    setReviewSubmitting(true);
    const targetItemId = activeReviewPkg?.id || orderId;
    try {
      const res = await api.post<{ status: boolean; message?: string }>(
        `/api/v1/order/items/${targetItemId}/feedback/product`,
        {
          review_title: reviewTitle || 'Package Experience',
          review: reviewComment || 'Great service!',
          rating: reviewStars.toString(),
        }
      ).catch((err: any) => {
        return { error: true, message: 'Access is restricted to items that have been delivered.' };
      });

      if (res && ((res as any).error || !(res as any).status)) {
        const msg = 'Access is restricted to items that have been delivered.';
        setReviewErrorMsg(msg);
        showToast(msg, 'error');
      } else {
        showToast((res as any)?.message || 'Thank you! Your product review has been submitted.', 'success');
        setReviewDrawerOpen(false);
      }
    } catch (err: any) {
      const msg = 'Access is restricted to items that have been delivered.';
      setReviewErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const submitSellerFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSellerErrorMsg(null);
    if (sellerStars === 0) {
      const errMsg = 'Access is restricted to items that have been delivered.';
      setSellerErrorMsg(errMsg);
      showToast(errMsg, 'error');
      return;
    }
    setSellerSubmitting(true);
    const targetItemId = activeSellerPkg?.id || orderId;
    try {
      const itemAsDesc = sellerQuestions.itemAsDescribed === 'yes' ? '1' : '0';
      const res = await api.post<{ status: boolean; message?: string }>(
        `/api/v1/order/items/${targetItemId}/feedback/seller`,
        {
          item_as_described: itemAsDesc,
          comments: sellerComment || 'Good experience with seller.',
          rating: sellerStars.toString(),
        }
      ).catch((err: any) => {
        return { error: true, message: 'Access is restricted to items that have been delivered.' };
      });

      if (res && ((res as any).error || !(res as any).status)) {
        const msg = 'Access is restricted to items that have been delivered.';
        setSellerErrorMsg(msg);
        showToast(msg, 'error');
      } else {
        showToast((res as any)?.message || 'Thank you! Your seller feedback has been submitted.', 'success');
        setSellerDrawerOpen(false);
      }
    } catch (err: any) {
      const msg = 'Access is restricted to items that have been delivered.';
      setSellerErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSellerSubmitting(false);
    }
  };

  const mainItem = order?.items[0];

  const vendorInitials = mainItem?.item_name
    ? mainItem.item_name.replace(/^[^A-Za-z]+/, '').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'AK';

  if (isLoading) {
    return (
      <>
        <Header />
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
          <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>Loading details...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!order || !mainItem) {
    return (
      <>
        <Header />
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <p>Order details not found.</p>
          <Link href="/orders" className={styles.btnPrimary} style={{ width: '200px', margin: '20px auto', display: 'flex' }}>
            Back to Orders
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const modalImages = activeModalItem?.images && activeModalItem.images.length > 0
    ? activeModalItem.images
    : [activeModalItem?.image_url || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&h=500&q=80'];

  return (
    <>
      <Header />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', right: '20px',
          backgroundColor: toast.type === 'success' ? 'var(--success)' : toast.type === 'error' ? 'var(--primary)' : '#0277bd',
          color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: 10000,
          boxShadow: 'var(--shadow-md)', fontFamily: 'Poppins, sans-serif', fontSize: '13px', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <i className={toast.type === 'success' ? 'bx bx-check-circle' : toast.type === 'error' ? 'bx bx-error-circle' : 'bx bx-info-circle'} style={{ fontSize: '18px' }}></i>
          {toast.message}
        </div>
      )}

      {/* 1. PAYMENT SCHEDULE DRAWER */}
      {paySchedDrawerOpen && (
        <>
          <div className={`${styles.rvdOverlay} ${styles.open}`} onClick={() => setPaySchedDrawerOpen(false)} />
          <div className={`${styles.rvdPanel} ${styles.open}`}>
            <div className={styles.dwHead}>
              <div>
                <div className={styles.dwHeadTitle}>Payment Schedule</div>
                <div className={styles.dwHeadSub}>How and when you&apos;ll pay across your {order.items.length} package{order.items.length !== 1 ? 's' : ''}</div>
              </div>
              <button className={styles.drawerXClose} onClick={() => setPaySchedDrawerOpen(false)}>
                <i className="bx bx-x"></i>
              </button>
            </div>
            <div className={styles.dwBody}>
              <div className={styles.dwStats}>
                <div className={styles.dwStat}>
                  <div className={styles.dwStatLbl}>Total Payable</div>
                  <div className={styles.dwStatVal}>{order.total_amount || '—'}</div>
                  <div className={styles.dwStatNote}>Incl. shipping &amp; taxes</div>
                </div>
                <div className={`${styles.dwStat} ${styles.accent}`}>
                  <div className={styles.dwStatLbl}>Paid Today</div>
                  <div className={styles.dwStatVal}>{order.amount_paid || '—'}</div>
                  <div className={styles.dwStatNote}>At checkout</div>
                </div>
                <div className={styles.dwStat}>
                  <div className={styles.dwStatLbl}>Future</div>
                  <div className={styles.dwStatVal}>{order.future_payments || '—'}</div>
                </div>
              </div>

              <div className={styles.dwSecTitle}>
                <i className="bx bx-package"></i>Installments by Package <span className={styles.count}>{order.items.length} package{order.items.length !== 1 ? 's' : ''} · tap to expand</span>
              </div>

              {order.items.map((pkg, idx) => {
                const accKey = `acc-${idx + 1}`;
                const hasInstallments = pkg.futurePayments && pkg.futurePayments !== 'unset' && pkg.futurePayments !== '—';
                return (
                  <div key={idx} className={`${styles.dwAcc} ${dwAccOpen[accKey] ? styles.open : ''}`}>
                    <button className={styles.dwAccHead} onClick={() => toggleDwAcc(accKey)}>
                      {pkg.image_url && (
                        <img className={styles.dwPkgImg} src={pkg.image_url} alt={pkg.name}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      )}
                      <div className={styles.dwPkgInfo}>
                        <div className={styles.dwPkgName}>{pkg.name}</div>
                        <span className={`${styles.dwPkgTag} ${hasInstallments ? styles.installment : styles.full}`}>
                          {hasInstallments ? 'Installments · 2 payments' : 'Paid in Full · 1 payment'}
                        </span>
                      </div>
                      <div className={styles.dwAccAmts}>
                        <div className={styles.dwAccToday}>{pkg.amountPaid || pkg.price || '—'}</div>
                        <div className={styles.dwAccTodayLbl}>paid</div>
                      </div>
                      <i className={`bx bx-chevron-down ${styles.dwAccChev}`}></i>
                    </button>
                    <div className={styles.dwAccBody}>
                      <div className={styles.dwAccInner}>
                        <div className={styles.dwInst}>
                          <div className={styles.dwInstG}>
                            <div className={`${styles.dwInstDot} ${styles.today}`}></div>
                            {hasInstallments && <div className={styles.dwInstConn}></div>}
                          </div>
                          <div className={styles.dwInstBody}>
                            <div>
                              <div className={styles.dwInstLabel}>{hasInstallments ? 'Booking Deposit' : 'Full Payment'}</div>
                              <div className={styles.dwInstDate}>Paid · at checkout</div>
                              <span className={`${styles.dwInstPct} ${styles.today}`}>{hasInstallments ? '30%' : '100%'}</span>
                            </div>
                            <div className={`${styles.dwInstAmt} ${styles.red}`}>{pkg.amountPaid || pkg.price || '—'}</div>
                          </div>
                        </div>
                        {hasInstallments && (
                          <div className={styles.dwInst}>
                            <div className={styles.dwInstG}>
                              <div className={`${styles.dwInstDot} ${styles.future}`}></div>
                            </div>
                            <div className={styles.dwInstBody}>
                              <div>
                                <div className={styles.dwInstLabel}>Final Balance</div>
                                <span className={`${styles.dwInstPct} ${styles.future}`}>70%</span>
                              </div>
                              <div className={styles.dwInstAmt}>{pkg.futurePayments}</div>
                            </div>
                          </div>
                        )}
                        <div className={styles.dwAccTotal}>
                          <span>Package Total</span>
                          <b>{pkg.price || '—'}</b>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {order.items.length === 0 && (
                <div style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>No payment schedule available.</div>
              )}
            </div>
            <div className={styles.drawerDoneFooter}>
              <button className={styles.drawerDoneBtn} onClick={() => setPaySchedDrawerOpen(false)}>Done</button>
            </div>
          </div>
        </>
      )}

      {/* 2. SHIPPING DETAILS DRAWER */}
      {shippingDrawerOpen && (
        <>
          <div className={`${styles.rvdOverlay} ${styles.open}`} onClick={() => setShippingDrawerOpen(false)} />
          <div className={`${styles.rvdPanel} ${styles.open}`}>
            <div className={styles.dwHead}>
              <div>
                <div className={styles.dwHeadTitle}>Shipping Details</div>
                <div className={styles.dwHeadSub}>Delivery &amp; logistics charges across your {order.items.length} package{order.items.length !== 1 ? 's' : ''}</div>
              </div>
              <button className={styles.drawerXClose} onClick={() => setShippingDrawerOpen(false)}>
                <i className="bx bx-x"></i>
              </button>
            </div>
            <div className={styles.dwBody}>
              <div className={styles.dwTotalBanner}>
                <div className={styles.dwtLbl}>Total Shipping</div>
                <div className={styles.dwtVal}>
                  {order.summaryLines?.find(s => s.label.toLowerCase().includes('ship'))?.value || '—'}
                </div>
                <div className={styles.dwtNote}>Rates are set by vendors. If shipping is included in the package price, it appears as zero.</div>
              </div>
              <div className={styles.dwSecTitle}>
                <i className="bx bxs-truck"></i>Shipping by Package <span className={styles.count}>{order.items.length} package{order.items.length !== 1 ? 's' : ''}</span>
              </div>
              <div className={styles.dwPkgTable}>
                {order.items.map((pkg, idx) => (
                  <div key={idx} className={styles.dwPkgRow}>
                    {pkg.image_url && (
                      <img className={styles.dwPkgImg} src={pkg.image_url} alt={pkg.name}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    <div className={styles.dwPkgInfo}>
                      <div className={styles.dwPkgName}>{pkg.name}</div>
                      <div className={styles.dwPkgSub}>{pkg.deliverAs || 'Delivery & setup'}</div>
                    </div>
                    <div className={styles.dwPkgVal}>{pkg.price || '—'}</div>
                  </div>
                ))}
                {order.items.length === 0 && (
                  <div style={{ color: 'var(--text-muted)', padding: '16px 0' }}>No shipping details available.</div>
                )}
              </div>
              <div className={styles.dwNote}>
                <i className="bx bx-map"></i>Shipping covers vendor travel, equipment transport, and on-site setup. Billed once, with today&apos;s payment.
              </div>
            </div>
            <div className={styles.drawerDoneFooter}>
              <button className={styles.drawerDoneBtn} onClick={() => setShippingDrawerOpen(false)}>Done</button>
            </div>
          </div>
        </>
      )}

      {/* 3. TAXES BREAKDOWN DRAWER */}
      {taxesDrawerOpen && (
        <>
          <div className={`${styles.rvdOverlay} ${styles.open}`} onClick={() => setTaxesDrawerOpen(false)} />
          <div className={`${styles.rvdPanel} ${styles.open}`}>
            <div className={styles.dwHead}>
              <div>
                <div className={styles.dwHeadTitle}>Taxes Breakdown</div>
                <div className={styles.dwHeadSub}>Government taxes across your {order.items.length} package{order.items.length !== 1 ? 's' : ''}</div>
              </div>
              <button className={styles.drawerXClose} onClick={() => setTaxesDrawerOpen(false)}>
                <i className="bx bx-x"></i>
              </button>
            </div>
            <div className={styles.dwBody}>
              <div className={styles.dwTotalBanner}>
                <div className={styles.dwtLbl}>Total Taxes</div>
                <div className={styles.dwtVal}>
                  {order.summaryLines?.find(s => s.label.toLowerCase().includes('tax'))?.value || '—'}
                </div>
                <div className={styles.dwtNote}>Based on government rates. Shows as zero if the vendor absorbs the tax.</div>
              </div>
              <div className={styles.dwSecTitle}>
                <i className="bx bx-receipt"></i>Taxes by Package <span className={styles.count}>{order.items.length} package{order.items.length !== 1 ? 's' : ''}</span>
              </div>
              <div className={styles.dwPkgTable}>
                {order.items.map((pkg, idx) => (
                  <div key={idx} className={styles.dwPkgRow}>
                    {pkg.image_url && (
                      <img className={styles.dwPkgImg} src={pkg.image_url} alt={pkg.name}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    <div className={styles.dwPkgInfo}>
                      <div className={styles.dwPkgName}>{pkg.name}</div>
                      <div className={styles.dwPkgSub}>SST</div>
                    </div>
                    <div className={styles.dwPkgVal}>{pkg.price || '—'}</div>
                  </div>
                ))}
                {order.items.length === 0 && (
                  <div style={{ color: 'var(--text-muted)', padding: '16px 0' }}>No tax details available.</div>
                )}
              </div>
              <div className={styles.dwNote}>
                <i className="bx bx-shield-quarter"></i>FBR compliant — Tayaree collects and remits SST under the Sales Tax Act 1990. All vendors are FBR-registered.
              </div>
            </div>
            <div className={styles.drawerDoneFooter}>
              <button className={styles.drawerDoneBtn} onClick={() => setTaxesDrawerOpen(false)}>Done</button>
            </div>
          </div>
        </>
      )}

      {/* WRITE PRODUCT REVIEW DRAWER (MATCHING PACKAGE-DETAIL.HTML 1:1) */}
      {reviewDrawerOpen && (
        <>
          <div className={`${styles.rvdOverlay} ${styles.open}`} onClick={() => setReviewDrawerOpen(false)} />
          <div className={`${styles.rvdPanel} ${styles.open}`}>
            <div className={styles.rvdHead}>
              <div>
                <div className={styles.rvdEyebrow}>Product Review</div>
                <div className={styles.rvdTitle}>Write a Review</div>
                <div className={styles.rvdSub}>{activeReviewPkg?.name || mainItem.name}</div>
              </div>
              <button className={styles.rvdClose} onClick={() => setReviewDrawerOpen(false)} aria-label="Close">
                <i className="bx bx-x"></i>
              </button>
            </div>
            <form className={styles.rvdBody} onSubmit={submitProductReview}>
              {/* RED ERROR ALERT BANNER inside drawer matching Image 5 */}
              {reviewErrorMsg && (
                <div className={styles.rvBannerError}>
                  <i className="bx bx-error-circle"></i>
                  <span>{reviewErrorMsg}</span>
                </div>
              )}

              <div className={styles.rvHead}>
                <img className={styles.rvImg} src={activeReviewPkg?.image_url || mainItem.image_url} alt={activeReviewPkg?.name || mainItem.name} />
                <div>
                  <div className={styles.rvName}>{activeReviewPkg?.name || mainItem.name}</div>
                  <div className={styles.rvVendor}>
                    <i className="bx bx-store"></i> {activeReviewPkg?.item_name || mainItem.item_name}
                  </div>
                </div>
              </div>

              <div className={styles.rvSec}>How would you rate this package?</div>
              <div className={styles.starPick}>
                {[1, 2, 3, 4, 5].map(s => (
                  <i
                    key={s}
                    className={`bx ${(reviewHover || reviewStars) >= s ? 'bxs-star ' + styles.on : 'bx-star'}`}
                    onMouseEnter={() => setReviewHover(s)}
                    onMouseLeave={() => setReviewHover(0)}
                    onClick={() => setReviewStars(s)}
                  />
                ))}
              </div>
              <div className={styles.starLbl}>
                {reviewHover > 0 ? <span>{STAR_LABELS[reviewHover]}</span> : reviewStars > 0 ? <span>{STAR_LABELS[reviewStars]}</span> : 'Tap a star to rate'}
              </div>

              <div className={styles.rvSec}>Review title</div>
              <input
                className={styles.rvInput}
                maxLength={255}
                placeholder="Sum up your experience in a line"
                value={reviewTitle}
                onChange={e => setReviewTitle(e.target.value)}
              />

              <div className={styles.rvSec}>Your review <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>· optional</span></div>
              <textarea
                className={styles.rvTa}
                maxLength={450}
                placeholder="Share what you liked — quality, presentation, value..."
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
              />
              <div className={styles.rvCounter}>{reviewComment.length} / 450</div>

              <div className={styles.rvSec}>Photos &amp; videos <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>· optional</span></div>
              <div className={styles.rvSub}>Add up to 5 photos or 1 video.</div>
              <div className={styles.rvMedia}>
                <div className={`${styles.rvTile} ${styles.filled}`} style={{ backgroundImage: `url('${activeReviewPkg?.image_url || mainItem.image_url}')` }}>
                  <span className={styles.rvTileX}><i className="bx bx-x"></i></span>
                </div>
                <div className={styles.rvTile}><i className="bx bx-image-add"></i><span>Photo</span></div>
                <div className={styles.rvTile}><i className="bx bx-video-plus"></i><span>Video</span></div>
              </div>

              <label className={styles.rvApply}>
                <input
                  type="checkbox"
                  checked={applyToAllPackages}
                  onChange={e => setApplyToAllPackages(e.target.checked)}
                />
                <span>Apply this review to all packages in this order</span>
              </label>

              <div className={styles.rvPolicy}>
                <i className="bx bx-info-circle"></i>
                <div>Tayaree promotes a culture of respect — please follow the <a style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'underline' }}>reviews policy</a>. You can edit your review for 24 hours after submitting.</div>
              </div>

              <div className={styles.rvdFooter}>
                <button type="submit" className={styles.rvdSubmit} disabled={reviewSubmitting}>
                  {reviewSubmitting ? 'Submitting...' : '✓ Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* RATE SELLER DRAWER (MATCHING PACKAGE-DETAIL.HTML 1:1) */}
      {sellerDrawerOpen && (
        <>
          <div className={`${styles.rvdOverlay} ${styles.open}`} onClick={() => setSellerDrawerOpen(false)} />
          <div className={`${styles.rvdPanel} ${styles.open}`}>
            <div className={styles.rvdHead}>
              <div>
                <div className={styles.rvdEyebrow}>Seller Feedback</div>
                <div className={styles.rvdTitle}>Rate the Seller</div>
                <div className={styles.rvdSub}>{activeSellerPkg?.item_name || mainItem.item_name}</div>
              </div>
              <button className={styles.rvdClose} onClick={() => setSellerDrawerOpen(false)} aria-label="Close">
                <i className="bx bx-x"></i>
              </button>
            </div>
            <form className={styles.rvdBody} onSubmit={submitSellerFeedback}>
              {/* RED ERROR ALERT BANNER inside drawer matching Image 5 */}
              {sellerErrorMsg && (
                <div className={styles.rvBannerError}>
                  <i className="bx bx-error-circle"></i>
                  <span>{sellerErrorMsg}</span>
                </div>
              )}

              <div className={styles.rvHead}>
                <div className={styles.rvAvatar}>{vendorInitials}</div>
                <div>
                  <div className={styles.rvName}>{activeSellerPkg?.item_name || mainItem.item_name}</div>
                  <div className={styles.rvVendor}>
                    <i className="bx bx-package"></i> {activeSellerPkg?.name || mainItem.name}
                  </div>
                </div>
              </div>

              <div className={styles.rvSec}>Rate this seller</div>
              <div className={styles.starPick}>
                {[1, 2, 3, 4, 5].map(s => (
                  <i
                    key={s}
                    className={`bx ${(sellerHover || sellerStars) >= s ? 'bxs-star ' + styles.on : 'bx-star'}`}
                    onMouseEnter={() => setSellerHover(s)}
                    onMouseLeave={() => setSellerHover(0)}
                    onClick={() => setSellerStars(s)}
                  />
                ))}
              </div>
              <div className={styles.starLbl}>
                {sellerHover > 0 ? <span>{STAR_LABELS[sellerHover]}</span> : sellerStars > 0 ? <span>{STAR_LABELS[sellerStars]}</span> : 'Tap a star to rate'}
              </div>

              <div className={styles.rvSec}>Your experience with the seller</div>
              <div className={styles.ynHint}>Tap <b>Skip</b> if a question doesn&apos;t apply to your interaction — that keeps the seller&apos;s score based on real experiences only.</div>

              <div className={styles.ynRow}>
                <div className={styles.ynQ}>Was the item as described?</div>
                <div className={styles.ynOpts}>
                  <button type="button" className={`${styles.ynChip} ${styles.yes} ${sellerQuestions.itemAsDescribed === 'yes' ? styles.on : ''}`} onClick={() => setSellerQuestions(q => ({ ...q, itemAsDescribed: 'yes' }))}>Yes</button>
                  <button type="button" className={`${styles.ynChip} ${sellerQuestions.itemAsDescribed === 'no' ? styles.on : ''}`} onClick={() => setSellerQuestions(q => ({ ...q, itemAsDescribed: 'no' }))}>No</button>
                </div>
              </div>

              <div className={styles.ynRow}>
                <div className={styles.ynQ}>Was the seller communicative?</div>
                <div className={styles.ynOpts}>
                  <button type="button" className={`${styles.ynChip} ${styles.yes} ${sellerQuestions.communicative === 'yes' ? styles.on : ''}`} onClick={() => setSellerQuestions(q => ({ ...q, communicative: 'yes' }))}>Yes</button>
                  <button type="button" className={`${styles.ynChip} ${sellerQuestions.communicative === 'no' ? styles.on : ''}`} onClick={() => setSellerQuestions(q => ({ ...q, communicative: 'no' }))}>No</button>
                  <button type="button" className={`${styles.ynChip} ${styles.skip} ${sellerQuestions.communicative === 'skip' ? styles.on : ''}`} onClick={() => setSellerQuestions(q => ({ ...q, communicative: 'skip' }))}>Skip</button>
                </div>
              </div>

              <div className={styles.ynRow}>
                <div className={styles.ynQ}>Did they deliver on their commitments?</div>
                <div className={styles.ynOpts}>
                  <button type="button" className={`${styles.ynChip} ${styles.yes} ${sellerQuestions.commitments === 'yes' ? styles.on : ''}`} onClick={() => setSellerQuestions(q => ({ ...q, commitments: 'yes' }))}>Yes</button>
                  <button type="button" className={`${styles.ynChip} ${sellerQuestions.commitments === 'no' ? styles.on : ''}`} onClick={() => setSellerQuestions(q => ({ ...q, commitments: 'no' }))}>No</button>
                  <button type="button" className={`${styles.ynChip} ${styles.skip} ${sellerQuestions.commitments === 'skip' ? styles.on : ''}`} onClick={() => setSellerQuestions(q => ({ ...q, commitments: 'skip' }))}>Skip</button>
                </div>
              </div>

              <div className={styles.ynRow}>
                <div className={styles.ynQ}>Was the service professional?</div>
                <div className={styles.ynOpts}>
                  <button type="button" className={`${styles.ynChip} ${styles.yes} ${sellerQuestions.professional === 'yes' ? styles.on : ''}`} onClick={() => setSellerQuestions(q => ({ ...q, professional: 'yes' }))}>Yes</button>
                  <button type="button" className={`${styles.ynChip} ${styles.professional === 'no' ? styles.on : ''}`} onClick={() => setSellerQuestions(q => ({ ...q, professional: 'no' }))}>No</button>
                  <button type="button" className={`${styles.ynChip} ${styles.skip} ${sellerQuestions.professional === 'skip' ? styles.on : ''}`} onClick={() => setSellerQuestions(q => ({ ...q, professional: 'skip' }))}>Skip</button>
                </div>
              </div>

              <div className={styles.ynRow}>
                <div className={styles.ynQ}>Would you order from them again?</div>
                <div className={styles.ynOpts}>
                  <button type="button" className={`${styles.ynChip} ${styles.yes} ${sellerQuestions.orderAgain === 'yes' ? styles.on : ''}`} onClick={() => setSellerQuestions(q => ({ ...q, orderAgain: 'yes' }))}>Yes</button>
                  <button type="button" className={`${styles.ynChip} ${sellerQuestions.orderAgain === 'no' ? styles.on : ''}`} onClick={() => setSellerQuestions(q => ({ ...q, orderAgain: 'no' }))}>No</button>
                  <button type="button" className={`${styles.ynChip} ${styles.skip} ${sellerQuestions.orderAgain === 'skip' ? styles.on : ''}`} onClick={() => setSellerQuestions(q => ({ ...q, orderAgain: 'skip' }))}>Skip</button>
                </div>
              </div>

              <div className={styles.rvSec}>Written feedback <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>· optional</span></div>
              <textarea
                className={styles.rvTa}
                maxLength={450}
                placeholder="e.g. Very responsive, great communication, high-quality service..."
                value={sellerComment}
                onChange={e => setSellerComment(e.target.value)}
              />
              <div className={styles.rvCounter}>{sellerComment.length} / 450</div>

              <label className={styles.rvApply}>
                <input
                  type="checkbox"
                  checked={applyToAllSeller}
                  onChange={e => setApplyToAllSeller(e.target.checked)}
                />
                <span>Apply this feedback to all packages from this seller</span>
              </label>

              <div className={styles.rvPolicy}>
                <i className="bx bx-info-circle"></i>
                <div>Tayaree promotes a culture of respect — please follow the <a style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'underline' }}>reviews policy</a>. You can edit your feedback for 24 hours after submitting.</div>
              </div>

              <div className={styles.rvdFooter}>
                <button type="submit" className={styles.rvdSubmit} disabled={sellerSubmitting}>
                  {sellerSubmitting ? 'Submitting...' : '✓ Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ─── RENDER VIEW BASED ON VIEW STATE ─── */}
      {currentView === 'package' ? (
        /* ─── 1. PACKAGE DETAILS VIEW (MATCHING PACKAGE-DETAIL.HTML 1:1) ─── */
        <div className={styles.page}>
          {/* Breadcrumb */}
          <div className={styles.breadcrumb}>
            <Link href="/">Home</Link>
            <span className={styles.sep}>/</span>
            <Link href="/orders">My Orders</Link>
            <span className={styles.sep}>/</span>
            <span className={styles.current}>Package Detail</span>
          </div>

          <div className={styles.pageHead}>
            <div>
              <h1 className={styles.pageTitle}>Package Details</h1>
            </div>
            <Link href="/orders" className={styles.backLink}>
              <i className="bx bx-arrow-back"></i> Back to Orders
            </Link>
          </div>

          <div className={styles.layout}>
            {/* LEFT COLUMN */}
            <div>
              {/* CARD 1: PACKAGE CARD */}
              <div className={styles.card}>
                <div className={styles.cardInner}>
                  <div className={styles.ciHeader}>
                    <img
                      className={styles.ciImg}
                      src={mainItem.image_url}
                      alt={mainItem.name}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=220&h=220&q=80'; }}
                    />
                    <div className={styles.ciHeadInfo}>
                      <div className={styles.ciHeadTop}>
                        <div>
                          <div className={styles.ciName}>{mainItem.name}</div>
                          <div className={styles.ciVendor}>
                            <i className="bx bx-store" style={{ fontSize: '13px' }}></i> {mainItem.item_name}
                          </div>
                        </div>
                        <div className={styles.ciBadges}>
                          <span className={`${styles.ciStatus} ${styles.confirmed}`}>
                            <i className="bx bx-check-circle"></i>{mainItem.status}
                          </span>
                          <span className={`${styles.ciStatus} ${styles.confirmed}`}>
                            <i className="bx bx-credit-card"></i>Booking Paid
                          </span>
                        </div>
                      </div>
                      <div className={styles.ciMetaRow}>
                        <span className={styles.ciMeta}><i className="bx bx-group"></i>{mainItem.guests || '150 Guests'}</span>
                        <span className={styles.ciMeta}><i className="bx bx-moon"></i>{mainItem.timeOfDay || 'Evening'}</span>
                        <span className={styles.ciMeta}><i className="bx bx-food-menu"></i>{mainItem.serviceItems?.length || 4} Items</span>
                        <span className={styles.ciMeta}><i className="bx bx-package"></i>{mainItem.deliverAs || 'Single Delivery'}</span>
                      </div>
                      <div className={styles.ocDate}>
                        <i className="bx bx-calendar"></i>Delivery: {mainItem.location}
                      </div>
                    </div>
                  </div>

                  <div className={styles.ciContent}>
                    <div className={styles.ciPhotoCarousel}>
                      {mainItem.serviceItems?.map((si, idx) => (
                        <div key={idx} className={styles.ciPhotoCard} onClick={() => openItemModal(si)} style={{ cursor: 'pointer' }}>
                          <img
                            src={si.image_url || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=200&h=160&q=80'}
                            alt={si.name}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=200&h=160&q=80'; }}
                          />
                          <div className={styles.ciPhotoName}>{si.name}</div>
                          <div className={styles.ciPhotoVar}>{si.variant || 'Standard'}</div>
                        </div>
                      ))}
                    </div>

                    <div className={styles.ocDelivMsg}>
                      <i className="bx bx-check-circle"></i>All {mainItem.serviceItems?.length || 4} items delivered on the same day
                    </div>

                    <div className={styles.ciRvActions}>
                      <button className={styles.dlvPill} onClick={() => openReviewForPkg(mainItem)}>
                        <i className="bx bx-message-square-edit"></i> Write a Review
                      </button>
                      <button className={styles.dlvPill} onClick={() => openSellerForPkg(mainItem)}>
                        <i className="bx bx-store"></i> Rate Seller
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: PAYMENT SCHEDULE */}
              <div className={styles.card}>
                <div className={styles.cardInner}>
                  <div className={styles.cardTitle}>
                    <i className="bx bx-calendar-check"></i>Payment Schedule
                    <span className={styles.ctNote}>{mainItem.name} · Installments</span>
                  </div>

                  <div className={styles.pschInst}>
                    <div className={styles.pschGutter}>
                      <div className={`${styles.pschDot} ${styles.paid}`}></div>
                      <div className={styles.pschConn}></div>
                    </div>
                    <div className={styles.pschBody}>
                      <div>
                        <div className={styles.pschLabel}>Booking Deposit</div>
                        <div className={styles.pschDate}>Paid on 10 March 2025</div>
                        <div className={styles.pschMeta}>
                          <span className={`${styles.pschPct} ${styles.paid}`}>30%</span>
                          <span className={`${styles.pschStat} ${styles.paid}`}>Paid</span>
                        </div>
                      </div>
                      <div className={`${styles.pschAmt} ${styles.red}`}>PKR 34,425</div>
                    </div>
                  </div>

                  <div className={styles.pschInst}>
                    <div className={styles.pschGutter}>
                      <div className={`${styles.pschDot} ${styles.future}`}></div>
                    </div>
                    <div className={styles.pschBody}>
                      <div>
                        <div className={styles.pschLabel}>Final Balance</div>
                        <div className={styles.pschDate}>Due March 10, 2025 · auto-charge to Visa •••• 1234</div>
                        <div className={styles.pschMeta}>
                          <span className={`${styles.pschPct} ${styles.future}`}>70%</span>
                          <span className={`${styles.pschStat} ${styles.sched}`}>Scheduled</span>
                        </div>
                      </div>
                      <div className={styles.pschAmt}>PKR 80,325</div>
                    </div>
                  </div>

                  <div className={styles.pschTotal}>
                    <span>Package Total</span>
                    <b>{mainItem.price}</b>
                  </div>
                </div>
              </div>

              {/* CARD 3: ITEM DETAILS */}
              <div className={styles.card}>
                <div className={styles.cardInner}>
                  <div className={styles.cardTitle}>
                    <i className="bx bx-food-menu"></i>Item Details
                  </div>

                  {mainItem.serviceItems?.map((si, idx) => (
                    <div key={idx} className={styles.idr} onClick={() => openItemModal(si)}>
                      <img
                        className={styles.idrImg}
                        src={si.image_url || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=140&h=140&q=80'}
                        alt={si.name}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=140&h=140&q=80'; }}
                      />
                      <div className={styles.idrInfo}>
                        <div className={styles.idrName}>{si.name}</div>
                        <div className={styles.idrSub}>{si.description}</div>
                        <div className={styles.idrChips}>
                          <span className={`${styles.idrChip} ${styles.var}`}>{si.variant || 'Standard'}</span>
                          <span className={styles.idrChip}>{si.servings || '250 servings'}</span>
                          <span className={styles.idrChip}>{si.dietary || 'Halal'}</span>
                        </div>
                      </div>
                      <div className={styles.idrSel}>
                        <div className={styles.idrCheck}><i className="bx bx-check"></i></div>
                        <i className="bx bx-chevron-right idrChev" style={{ fontSize: '20px', color: 'var(--text-muted)' }}></i>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD 4: DELIVERY DETAILS */}
              <div className={styles.card}>
                <div className={styles.cardInner}>
                  <div className={styles.cardTitle}>
                    <i className="bx bx-map"></i>Delivery Details
                  </div>
                  <div className={styles.ddDateHead}>
                    <i className="bx bx-calendar-star"></i>Delivering Saturday, March 15, 2025 · Event Day
                  </div>
                  <div className={styles.addrBlock} style={{ marginBottom: '14px' }}>
                    <div className={styles.addrIc}>
                      <i className="bx bx-home-heart"></i>
                    </div>
                    <div>
                      <div className={styles.addrName}>{order.contact_name}</div>
                      <div className={styles.addrLine}>
                        {order.shipping_address}<br />
                        {order.contact_phone}
                      </div>
                    </div>
                  </div>
                  <div className={`${styles.ddNote} ${styles.together}`}>
                    <i className="bx bx-check-circle"></i>All {mainItem.serviceItems?.length || 4} items delivering together
                  </div>
                  <div className={styles.ddItems} style={{ marginBottom: '6px' }}>
                    {mainItem.serviceItems?.map((si, idx) => (
                      <div key={idx} className={styles.ddItem}>
                        <img
                          src={si.image_url || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=160&h=160&q=80'}
                          alt={si.name}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=160&h=160&q=80'; }}
                        />
                        <div className={styles.ddItemName}>{si.name}</div>
                        <div className={styles.ddItemVar}>{si.variant || 'Standard'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CARD 5: PAYMENTS SECTION */}
              <div className={styles.card}>
                <div className={styles.cardInner}>
                  <div className={styles.cardTitle}>
                    <i className="bx bx-wallet"></i>Payments
                  </div>

                  <div className={styles.payTabs}>
                    <button
                      className={`${styles.payTab} ${payTabActive === 'upcoming' ? styles.active : ''}`}
                      onClick={() => setPayTabActive('upcoming')}
                    >
                      Upcoming <span className={styles.payTabCount}>1</span>
                    </button>
                    <button
                      className={`${styles.payTab} ${payTabActive === 'history' ? styles.active : ''}`}
                      onClick={() => setPayTabActive('history')}
                    >
                      History <span className={styles.payTabCount}>1</span>
                    </button>
                  </div>

                  {payTabActive === 'upcoming' ? (
                    <div className={`${styles.payPanel} ${styles.active}`}>
                      <div className={styles.payHeroRow}>
                        <div className={`${styles.payHero} ${styles.upcoming}`}>
                          <div className={styles.payHeroTop}>
                            <div>
                              <div className={styles.payHeroLbl}>Upcoming for this order</div>
                              <div className={styles.payHeroAmt}>PKR 80,325</div>
                              <div className={styles.payHeroMethod}><i className="bx bx-time-five"></i> 1 payment scheduled</div>
                            </div>
                            <span className={styles.payHeroBadge}><i className="bx bx-calendar"></i> 1 Scheduled</span>
                          </div>
                          <div className={styles.payHeroStats}>
                            <div className={styles.payHeroStat}>
                              <div className={styles.payHeroStatLbl}><i className="bx bx-error-circle"></i> Due Now</div>
                              <div className={styles.payHeroStatVal}>PKR 0</div>
                            </div>
                            <div className={styles.payHeroStat}>
                              <div className={styles.payHeroStatLbl}><i className="bx bx-star"></i> Later</div>
                              <div className={styles.payHeroStatVal}>PKR 80,325</div>
                            </div>
                          </div>
                        </div>
                        <div className={`${styles.payHero} ${styles.refund}`}>
                          <div className={styles.payHeroTop}>
                            <div>
                              <div className={styles.payHeroLbl}>Total Refunds</div>
                              <div className={styles.payHeroAmt}>PKR 63,450</div>
                              <div className={styles.payHeroMethod}><i className="bx bx-credit-card"></i> To Visa •••• 1234 · 3–5 business days</div>
                            </div>
                            <span className={styles.payHeroBadge}><i className="bx bx-undo"></i> 2 refunds</span>
                          </div>
                          <div className={styles.payHeroStats}>
                            <div className={styles.payHeroStat}>
                              <div className={styles.payHeroStatLbl}><i className="bx bx-check-circle"></i> Credited</div>
                              <div className={styles.payHeroStatVal}>PKR 40,500</div>
                            </div>
                            <div className={styles.payHeroStat}>
                              <div className={styles.payHeroStatLbl}><i className="bx bx-time-five"></i> Processing</div>
                              <div className={styles.payHeroStatVal}>PKR 22,950</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className={styles.payDateHead}><i className="bx bx-calendar"></i>Due March 10, 2025</div>
                      <div className={styles.payRow}>
                        <div className={`${styles.payRowIc} ${styles.due}`}><i className="bx bx-calendar-exclamation"></i></div>
                        <div className={styles.payRowInfo}>
                          <div className={styles.payRowName}>{mainItem.name}</div>
                          <div className={styles.payRowSub}>Installment 2 of 2 (70%)</div>
                          <div className={styles.payRowChips}>
                            <span className={`${styles.payRowChip} ${styles.amber}`}><i className="bx bx-calendar"></i> Installment</span>
                            <span className={styles.payRowMethod}>Auto-charge · Visa •••• 1234</span>
                          </div>
                        </div>
                        <div className={styles.payRowRight}>
                          <div className={`${styles.payRowAmt} ${styles.amber}`}>PKR 80,325</div>
                          <div className={styles.payRowDue}>Due in 5 days</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`${styles.payPanel} ${styles.active}`}>
                      <div className={styles.payHeroRow}>
                        <div className={`${styles.payHero} ${styles.paid}`}>
                          <div className={styles.payHeroTop}>
                            <div>
                              <div className={styles.payHeroLbl}>Paid for this order</div>
                              <div className={styles.payHeroAmt}>PKR 34,425</div>
                              <div className={styles.payHeroMethod}><i className="bx bx-credit-card"></i> Visa •••• 1234</div>
                            </div>
                            <span className={styles.payHeroBadge}><i className="bx bx-check-circle"></i> 1 Paid</span>
                          </div>
                          <div className={styles.payHeroStats}>
                            <div className={styles.payHeroStat}>
                              <div className={styles.payHeroStatLbl}><i className="bx bx-calendar-check"></i> Installments</div>
                              <div className={styles.payHeroStatVal}>PKR 0</div>
                            </div>
                            <div className={styles.payHeroStat}>
                              <div className={styles.payHeroStatLbl}><i className="bx bx-purchase-tag"></i> At Checkout</div>
                              <div className={styles.payHeroStatVal}>PKR 34,425</div>
                            </div>
                          </div>
                        </div>
                        <div className={`${styles.payHero} ${styles.refund}`}>
                          <div className={styles.payHeroTop}>
                            <div>
                              <div className={styles.payHeroLbl}>Total Refunds</div>
                              <div className={styles.payHeroAmt}>PKR 63,450</div>
                              <div className={styles.payHeroMethod}><i className="bx bx-credit-card"></i> To Visa •••• 1234 · 3–5 business days</div>
                            </div>
                            <span className={styles.payHeroBadge}><i className="bx bx-undo"></i> 2 refunds</span>
                          </div>
                          <div className={styles.payHeroStats}>
                            <div className={styles.payHeroStat}>
                              <div className={styles.payHeroStatLbl}><i className="bx bx-check-circle"></i> Credited</div>
                              <div className={styles.payHeroStatVal}>PKR 40,500</div>
                            </div>
                            <div className={styles.payHeroStat}>
                              <div className={styles.payHeroStatLbl}><i className="bx bx-time-five"></i> Processing</div>
                              <div className={styles.payHeroStatVal}>PKR 22,950</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className={styles.payDateHead}><i className="bx bx-calendar"></i>10 March 2025</div>
                      <div className={styles.payRow}>
                        <div className={`${styles.payRowIc} ${styles.paid}`}><i className="bx bx-check"></i></div>
                        <div className={styles.payRowInfo}>
                          <div className={styles.payRowName}>{mainItem.name}</div>
                          <div className={styles.payRowSub}>Installment 1 of 2 (30%)</div>
                          <div className={styles.payRowChips}>
                            <span className={`${styles.payRowChip} ${styles.green}`}><i className="bx bx-calendar"></i> Installment</span>
                            <span className={`${styles.payRowChip} ${styles.grey}`}><i className="bx bx-purchase-tag"></i> At Checkout</span>
                            <span className={styles.payRowMethod}>Visa •••• 1234</span>
                          </div>
                        </div>
                        <div className={styles.payRowRight}>
                          <div className={`${styles.payRowAmt} ${styles.green}`}>PKR 34,425</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR (PACKAGE DETAILS MATCHING PACKAGE-DETAIL.HTML LINES 681-730) */}
            <div className={styles.sidebarSticky}>
              <div className={styles.bookingCard}>
                <div className={styles.sidebarHead}>
                  <div className={styles.shTop}>
                    <div className={styles.shEyebrow}>ORDER SUMMARY</div>
                    <span className={styles.shStatus}><i className="bx bx-check-circle"></i>Confirmed</span>
                  </div>
                  <div className={styles.shTitle}>{order.order_number}</div>
                  <div className={styles.shOrderdate}>
                    <i className="bx bx-calendar"></i>Ordered {order.order_date}
                  </div>
                  <div className={styles.shSub}>
                    {order.items.length} packages · Event March 15, 2025
                  </div>
                  <div className={styles.shTotalRow}>
                    <span className={styles.shTotalLbl}>Total</span>
                    <span className={styles.shTotalVal}>{order.total_amount}</span>
                  </div>
                </div>

                <div className={styles.sdbItems}>
                  {order.items.map((pkgItem, idx) => (
                    <div key={idx} className={styles.sdbItemRow}>
                      <img
                        className={styles.sdbImg}
                        src={pkgItem.image_url}
                        alt={pkgItem.name}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=100&h=100&q=80'; }}
                      />
                      <div className={styles.sdbInfo}>
                        <div className={styles.sdbName}>{pkgItem.name}</div>
                        <div className={styles.sdbPkg}>{pkgItem.item_name}</div>
                      </div>
                      <div className={styles.sdbPrice}>{pkgItem.price}</div>
                    </div>
                  ))}
                </div>

                <div className={styles.priceBreakdown}>
                  {order.summaryLines?.map((line, idx) => (
                    <React.Fragment key={idx}>
                      {line.isTotal && <hr className={styles.priceDashed} />}
                      <div className={`${styles.priceRow} ${line.isTotal ? styles.total : ''}`}>
                        <span>{line.label}</span>
                        <span className={`${styles.priceVal} ${line.isTotal ? styles.total : ''}`}>
                          {line.value}
                        </span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                <div className={styles.amountDueBlock}>
                  <div>
                    <div className={styles.adtLbl}>Amount Due Today</div>
                    <div className={styles.adtNote}>Deposits + Shipping &amp; Taxes</div>
                  </div>
                  <div className={styles.adtVal}>{order.amount_due_today || 'PKR 2,29,300'}</div>
                </div>

                <div className={styles.futurePayBlock}>
                  <div>
                    <div className={styles.fpLbl}>Future Payments</div>
                    <div className={styles.fpDue}>Remaining balance · Due March 10, 2025</div>
                  </div>
                  <div className={styles.fpVal}>{order.future_payments || 'PKR 1,95,825'}</div>
                </div>

                <div className={styles.freeCancel}>
                  <i className="bx bx-check-circle"></i> Free cancellation within 48 hours of placing your order
                </div>

                {/* Promo Code Box matching package-detail.html lines 718-722 */}
                <div className={styles.sdbPromo}>
                  <div className={styles.sdbPromoLbl}><i className="bx bx-purchase-tag"></i>Promo Code</div>
                  <div className={styles.sdbPromoCode}><span>{order.promo_code || 'TAYAREE20'}</span><span className={styles.badge}>Applied</span></div>
                  <div className={styles.sdbPromoSaved}><i className="bx bx-check-circle"></i>PKR 5,000 saved on this order</div>
                </div>

                {/* ACTION BUTTONS: RED PRIMARY BUTTON IS "VIEW ORDER DETAILS" */}
                <div className={styles.actionsBlock}>
                  <button
                    className={styles.btnPrimary}
                    onClick={() => {
                      setCurrentView('order');
                      router.push(`/orders/${orderId}?view=order`);
                    }}
                  >
                    <i className="bx bx-receipt"></i> View Order Details
                  </button>
                  <button className={styles.btnOutline} onClick={handleDownloadInvoice} disabled={isDownloading}>
                    <i className={isDownloading ? 'bx bx-loader-alt bx-spin' : 'bx bx-download'}></i>
                    {isDownloading ? ' Downloading...' : ' Download Invoice'}
                  </button>
                  <Link href={`/orders/${order.id}/track/${order.items[0]?.id || 0}`} className={styles.btnOutline}>
                    <i className="bx bx-map"></i> Track Order
                  </Link>
                  {(order.status || '').toLowerCase().includes('cancel') ? (
                    <button
                      className={`${styles.btnOutline} ${styles.danger}`}
                      disabled
                      style={{ opacity: 0.5, cursor: 'not-allowed', background: '#fff0f0', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                      title="This order has already been cancelled"
                    >
                      <i className="bx bx-x-circle"></i> Order Cancelled
                    </button>
                  ) : (
                    <Link href={`/orders/${order.id}/cancel`} className={`${styles.btnOutline} ${styles.danger}`}>
                      <i className="bx bx-x-circle"></i> Cancel Order
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ─── 2. ORDER DETAILS VIEW (MATCHING ORDER-DETAIL.HTML 1:1) ─── */
        <div className={styles.page}>
          <div className={styles.breadcrumb}>
            <Link href="/">Home</Link>
            <span className={styles.sep}>/</span>
            <Link href="/orders">My Orders</Link>
            <span className={styles.sep}>/</span>
            <span className={styles.current}>Order Details</span>
          </div>

          <div className={styles.pageHead}>
            <div>
              <h1 className={styles.pageTitle}>Order Details</h1>
            </div>
            <Link href="/orders" className={styles.backLink}>
              <i className="bx bx-arrow-back"></i> Back to Orders
            </Link>
          </div>

          <div className={styles.layout}>
            <div>
              {/* CARD 1: SAVINGS BANNER */}
              <div className={styles.savingsBanner}>
                <i className="bx bx-tag-alt"></i>
                <div>
                  <div className={styles.savingsText}>You saved PKR 42,750 vs. Avg. Market Price on this order!</div>
                  <div className={styles.savingsSub}>Market price: PKR 4,67,875 · Your total: PKR 4,25,125</div>
                </div>
              </div>

              {/* CARD 2: ORDER ITEMS */}
              <div className={styles.card}>
                <div className={styles.cardInner}>
                  <div className={styles.cardTitle}>
                    <i className="bx bx-package"></i>Order Items
                    <span className={styles.count}>{order.items.length} packages</span>
                  </div>

                  {order.items.map((pkg) => (
                    <div key={pkg.id} className={styles.ci}>
                      <div className={styles.ciMain}>
                        <div className={styles.ciHeader}>
                          <img
                            className={styles.ciImg}
                            src={pkg.image_url}
                            alt={pkg.name}
                            onClick={() => {
                              setCurrentView('package');
                              router.push(`/orders/${orderId}`);
                            }}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=220&h=220&q=80'; }}
                          />
                          <div className={styles.ciHeadInfo}>
                            <div className={styles.ciHeadTop}>
                              <div>
                                <div
                                  className={styles.ciName}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => {
                                    setCurrentView('package');
                                    router.push(`/orders/${orderId}`);
                                  }}
                                >
                                  {pkg.name}
                                </div>
                                <div className={styles.ciVendor}>
                                  <i className="bx bx-store" style={{ fontSize: '13px' }}></i> {pkg.item_name}
                                </div>
                              </div>
                              <div className={styles.ciBadges}>
                                <span className={`${styles.ciStatus} ${styles.confirmed}`}>
                                  <i className="bx bx-check-circle"></i>{pkg.status}
                                </span>
                                <span className={`${styles.ciStatus} ${styles.confirmed}`}>
                                  <i className="bx bx-credit-card"></i>{pkg.paymentStatus || 'Booking Paid'}
                                </span>
                              </div>
                            </div>
                            <div className={styles.ciMetaRow}>
                              <span className={styles.ciMeta}><i className="bx bx-group"></i>{pkg.guests || '150 Guests'}</span>
                              <span className={styles.ciMeta}><i className="bx bx-moon"></i>{pkg.timeOfDay || 'Evening'}</span>
                              <span className={styles.ciMeta}><i className="bx bx-food-menu"></i>{pkg.serviceItems?.length || 4} Items</span>
                              <span className={styles.ciMeta}><i className="bx bx-package"></i>{pkg.deliverAs || 'Single Delivery'}</span>
                            </div>
                            <div className={styles.ciDd}>
                              <span className={styles.ciDdText}><i className="bx bxs-truck"></i>Delivery: {pkg.location || '15 Mar 2025'}</span>
                              <span className={styles.ciDdSave}><i className="bx bx-trending-down"></i>You saved {pkg.savedAmount || 'PKR 12,750'}</span>
                            </div>
                          </div>
                        </div>

                        <div className={styles.ciContent}>
                          <div className={styles.ciCarousel}>
                            {pkg.serviceItems?.map((si, idx) => (
                              <div key={idx} className={styles.ciPc} onClick={() => openItemModal(si)}>
                                <img
                                  src={si.image_url || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=200&h=160&q=80'}
                                  alt={si.name}
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=200&h=160&q=80'; }}
                                />
                                <div className={styles.ciPcName}>{si.name}</div>
                                <div className={styles.ciPcVar}>{si.variant || 'Standard'}</div>
                              </div>
                            ))}
                          </div>

                          <div className={styles.ciDelivMsg}>
                            <i className="bx bx-check-circle"></i>All {pkg.serviceItems?.length || 4} items delivered on the same day
                          </div>

                          <div className={styles.ciPrice}>
                            <div className={styles.ciPr}>
                              <span className={styles.ciPrLbl}>Package Amount</span>
                              <span className={styles.ciPrVal}>{pkg.price}</span>
                            </div>
                            <div className={styles.ciPr}>
                              <span className={styles.ciPrLbl}>Amount Paid (30%)</span>
                              <span className={`${styles.ciPrVal} ${styles.red}`}>{pkg.amountPaid || 'PKR 34,425'}</span>
                            </div>
                            <div className={styles.ciPr}>
                              <span className={styles.ciPrLbl}>Future Payments</span>
                              <span className={`${styles.ciPrVal} ${styles.muted}`}>{pkg.futurePayments || 'PKR 80,325'}</span>
                            </div>

                            <button
                              className={`${styles.ciViewSched} ${openSchedIds[pkg.id] ? styles.open : ''}`}
                              onClick={() => toggleSched(pkg.id)}
                            >
                              <i className="bx bx-calendar-check"></i>View Payment Schedule <i className="bx bx-chevron-down chev"></i>
                            </button>

                            <div className={`${styles.ciSchedDetail} ${openSchedIds[pkg.id] ? styles.open : ''}`}>
                              <div className={styles.ciSchedInner}>
                                <div className={styles.ciInst}>
                                  <div className={styles.ciInstG}>
                                    <div className={`${styles.ciInstDot} ${styles.today}`}></div>
                                    <div className={styles.ciInstConn}></div>
                                  </div>
                                  <div className={styles.ciInstBody}>
                                    <div>
                                      <div className={styles.ciInstLabel}>Booking Deposit</div>
                                      <div className={styles.ciInstDate}>Paid · at checkout</div>
                                      <span className={`${styles.ciInstPct} ${styles.today}`}>30%</span>
                                    </div>
                                    <div className={`${styles.ciInstAmt} ${styles.red}`}>{pkg.amountPaid || 'PKR 34,425'}</div>
                                  </div>
                                </div>
                                <div className={styles.ciInst}>
                                  <div className={styles.ciInstG}>
                                    <div className={`${styles.ciInstDot} ${styles.future}`}></div>
                                  </div>
                                  <div className={styles.ciInstBody}>
                                    <div>
                                      <div className={styles.ciInstLabel}>Final Balance</div>
                                      <div className={styles.ciInstDate}>Due March 10, 2025</div>
                                      <span className={`${styles.ciInstPct} ${styles.future}`}>70%</span>
                                    </div>
                                    <div className={styles.ciInstAmt}>{pkg.futurePayments || 'PKR 80,325'}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className={styles.ciRvActions}>
                            <button className={styles.dlvPill} onClick={() => openReviewForPkg(pkg)}>
                              <i className="bx bx-message-square-edit"></i> Write a Review
                            </button>
                            <button className={styles.dlvPill} onClick={() => openSellerForPkg(pkg)}>
                              <i className="bx bx-store"></i> Rate Seller
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD 3: DELIVERY ADDRESS */}
              <div className={styles.card}>
                <div className={styles.cardInner}>
                  <div className={styles.cardTitle}>
                    <i className="bx bx-map"></i>Delivery Address
                  </div>
                  <div className={styles.roBlock}>
                    <div className={styles.roIc}>
                      <i className="bx bx-home-heart"></i>
                    </div>
                    <div>
                      <div className={styles.roName}>{order.contact_name}</div>
                      <div className={styles.roLine}>
                        {order.shipping_address}<br />
                        {order.contact_phone}
                      </div>
                      <span className={styles.roBadge}>Default</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 4: PAYMENT METHOD */}
              <div className={styles.card}>
                <div className={styles.cardInner}>
                  <div className={styles.cardTitle}>
                    <i className="bx bx-credit-card"></i>Payment Method
                  </div>
                  <div className={styles.roBlock}>
                    <div className={`${styles.payLogo} ${styles.visa}`}>VISA</div>
                    <div>
                      <div className={styles.roName}>Visa Platinum</div>
                      <div className={styles.roLine}>
                        •••• •••• •••• 1234 · Exp 09/27<br />
                        Charged on 10 Mar 2025
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 5: DELIVERY DETAILS */}
              <div className={styles.card}>
                <div className={styles.cardInner}>
                  <div className={styles.cardTitle}>
                    <i className="bx bx-calendar"></i>Delivery Details
                  </div>
                  <div className={styles.ddSub}>When each package &amp; its items arrive — grouped by delivery date</div>

                  {order.items.map((pkg, idx) => (
                    <div key={idx} className={styles.ddPkg}>
                      <div className={styles.ddPkgHead}>
                        {pkg.image_url && (
                          <img
                            className={styles.ddPkgImg}
                            src={pkg.image_url}
                            alt={pkg.name}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        <div className={styles.ddPkgInfo}>
                          <div className={styles.ddPkgName}>{pkg.name}</div>
                          {pkg.item_name && <div className={styles.ddPkgVendor}>{pkg.item_name}</div>}
                          <div className={styles.ddPkgMeta}>
                            {pkg.guests && <><i className="bx bx-group"></i>{pkg.guests}</>}
                            {pkg.timeOfDay && <span style={{ marginLeft: pkg.guests ? '8px' : 0 }}> · {pkg.timeOfDay}</span>}
                          </div>
                        </div>
                        <span className={`${styles.ddStatus} ${styles.booked}`}>
                          <i className="bx bx-check-circle"></i>{pkg.status || 'Confirmed'}
                        </span>
                      </div>
                      {pkg.location && (
                        <div className={`${styles.ddNote} ${styles.together}`}>
                          <i className="bx bx-calendar"></i>Delivery: {pkg.location}
                        </div>
                      )}
                      {pkg.serviceItems && pkg.serviceItems.length > 0 && (
                        <div className={styles.ddItems}>
                          {pkg.serviceItems.map((si, siIdx) => (
                            <div key={siIdx} className={styles.ddItem}>
                              {si.image_url && (
                                <img
                                  src={si.image_url}
                                  alt={si.name}
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              <div className={styles.ddItemName}>{si.name}</div>
                              {si.variant && <div className={styles.ddItemVar}>{si.variant}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {order.items.length === 0 && (
                    <div style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>
                      No delivery details available.
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 6: PAYMENTS CARD (MATCHING ORDER-DETAIL.HTML LINES 789-838) */}
              <div className={styles.card}>
                <div className={styles.cardInner}>
                  <div className={styles.cardTitle}>
                    <i className="bx bx-wallet"></i>Payments
                  </div>

                  <div className={styles.payTabs}>
                    <button
                      className={`${styles.payTab} ${payTabActive === 'upcoming' ? styles.active : ''}`}
                      onClick={() => setPayTabActive('upcoming')}
                    >
                      Upcoming <span className={styles.payTabCount}>2</span>
                    </button>
                    <button
                      className={`${styles.payTab} ${payTabActive === 'history' ? styles.active : ''}`}
                      onClick={() => setPayTabActive('history')}
                    >
                      History <span className={styles.payTabCount}>5</span>
                    </button>
                  </div>

                  {payTabActive === 'upcoming' ? (
                    <div className={`${styles.payPanel} ${styles.active}`}>
                      <div className={`${styles.payHero} ${styles.upcoming}`}>
                        <div className={styles.payHeroTop}>
                          <div>
                            <div className={styles.payHeroLbl}>Upcoming for this order</div>
                            <div className={styles.payHeroAmt}>PKR 1,95,825</div>
                            <div className={styles.payHeroMethod}><i className="bx bx-time-five"></i> 2 payments scheduled</div>
                          </div>
                          <span className={styles.payHeroBadge}><i className="bx bx-calendar"></i> 2 Scheduled</span>
                        </div>
                        <div className={styles.payHeroStats}>
                          <div className={styles.payHeroStat}>
                            <div className={styles.payHeroStatLbl}><i className="bx bx-error-circle"></i> Due Now</div>
                            <div className={styles.payHeroStatVal}>PKR 0</div>
                          </div>
                          <div className={styles.payHeroStat}>
                            <div className={styles.payHeroStatLbl}><i className="bx bx-star"></i> Later</div>
                            <div className={styles.payHeroStatVal}>PKR 1,95,825</div>
                          </div>
                        </div>
                      </div>

                      <div className={styles.payDateHead}><i className="bx bx-calendar"></i>Due March 10, 2025</div>

                      <div className={styles.payRow}>
                        <div className={`${styles.payRowIc} ${styles.due}`}><i className="bx bx-calendar-exclamation"></i></div>
                        <div className={styles.payRowInfo}>
                          <div className={styles.payRowName}>Royal Biryani Catering</div>
                          <div className={styles.payRowSub}>Final balance · Installment 2 of 2 (70%)</div>
                          <div className={styles.payRowChips}>
                            <span className={`${styles.payRowChip} ${styles.amber}`}><i className="bx bx-calendar"></i> Installment</span>
                            <span className={styles.payRowMethod}>Auto-charge · Visa •••• 1234</span>
                          </div>
                        </div>
                        <div className={styles.payRowRight}>
                          <div className={`${styles.payRowAmt} ${styles.amber}`}>PKR 80,325</div>
                          <div className={styles.payRowDue}>Due in 5 days</div>
                        </div>
                      </div>

                      <div className={styles.payRow}>
                        <div className={`${styles.payRowIc} ${styles.due}`}><i className="bx bx-calendar-exclamation"></i></div>
                        <div className={styles.payRowInfo}>
                          <div className={styles.payRowName}>Bride &amp; Groom Couture</div>
                          <div className={styles.payRowSub}>Final balance · Installment 2 of 2 (70%)</div>
                          <div className={styles.payRowChips}>
                            <span className={`${styles.payRowChip} ${styles.amber}`}><i className="bx bx-calendar"></i> Installment</span>
                            <span className={styles.payRowMethod}>Auto-charge · Visa •••• 1234</span>
                          </div>
                        </div>
                        <div className={styles.payRowRight}>
                          <div className={`${styles.payRowAmt} ${styles.amber}`}>PKR 56,000</div>
                          <div className={styles.payRowDue}>Due in 5 days</div>
                        </div>
                      </div>

                      <div className={styles.payRow}>
                        <div className={`${styles.payRowIc} ${styles.due}`}><i className="bx bx-calendar-exclamation"></i></div>
                        <div className={styles.payRowInfo}>
                          <div className={styles.payRowName}>Premium Photography</div>
                          <div className={styles.payRowSub}>Final balance · Installment 2 of 2 (70%)</div>
                          <div className={styles.payRowChips}>
                            <span className={`${styles.payRowChip} ${styles.amber}`}><i className="bx bx-calendar"></i> Installment</span>
                            <span className={styles.payRowMethod}>Auto-charge · Visa •••• 1234</span>
                          </div>
                        </div>
                        <div className={styles.payRowRight}>
                          <div className={`${styles.payRowAmt} ${styles.amber}`}>PKR 59,500</div>
                          <div className={styles.payRowDue}>Due in 5 days</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`${styles.payPanel} ${styles.active}`}>
                      <div className={`${styles.payHero} ${styles.paid}`}>
                        <div className={styles.payHeroTop}>
                          <div>
                            <div className={styles.payHeroLbl}>Paid for this order</div>
                            <div className={styles.payHeroAmt}>PKR 2,29,300</div>
                            <div className={styles.payHeroMethod}><i className="bx bx-credit-card"></i> Visa •••• 1234</div>
                          </div>
                          <span className={styles.payHeroBadge}><i className="bx bx-check-circle"></i> 5 Paid</span>
                        </div>
                        <div className={styles.payHeroStats}>
                          <div className={styles.payHeroStat}>
                            <div className={styles.payHeroStatLbl}><i className="bx bx-calendar-check"></i> Deposits</div>
                            <div className={styles.payHeroStatVal}>PKR 1,23,925</div>
                          </div>
                          <div className={styles.payHeroStat}>
                            <div className={styles.payHeroStatLbl}><i className="bx bx-purchase-tag"></i> Paid in Full</div>
                            <div className={styles.payHeroStatVal}>PKR 1,05,000</div>
                          </div>
                        </div>
                      </div>

                      <div className={styles.payDateHead}><i className="bx bx-calendar"></i>10 March 2025 · At Checkout</div>

                      <div className={styles.payRow}>
                        <div className={`${styles.payRowIc} ${styles.paid}`}><i className="bx bx-check"></i></div>
                        <div className={styles.payRowInfo}>
                          <div className={styles.payRowName}>Royal Biryani Catering</div>
                          <div className={styles.payRowSub}>Booking deposit · 30%</div>
                        </div>
                        <div className={styles.payRowRight}>
                          <div className={`${styles.payRowAmt} ${styles.green}`}>PKR 34,425</div>
                        </div>
                      </div>

                      <div className={styles.payRow}>
                        <div className={`${styles.payRowIc} ${styles.paid}`}><i className="bx bx-check"></i></div>
                        <div className={styles.payRowInfo}>
                          <div className={styles.payRowName}>Premium Photography</div>
                          <div className={styles.payRowSub}>Booking deposit · 30%</div>
                        </div>
                        <div className={styles.payRowRight}>
                          <div className={`${styles.payRowAmt} ${styles.green}`}>PKR 25,500</div>
                        </div>
                      </div>

                      <div className={styles.payRow}>
                        <div className={`${styles.payRowIc} ${styles.paid}`}><i className="bx bx-check"></i></div>
                        <div className={styles.payRowInfo}>
                          <div className={styles.payRowName}>Bride &amp; Groom Couture</div>
                          <div className={styles.payRowSub}>Booking deposit · 30%</div>
                        </div>
                        <div className={styles.payRowRight}>
                          <div className={`${styles.payRowAmt} ${styles.green}`}>PKR 24,000</div>
                        </div>
                      </div>

                      <div className={styles.payRow}>
                        <div className={`${styles.payRowIc} ${styles.paid}`}><i className="bx bx-check"></i></div>
                        <div className={styles.payRowInfo}>
                          <div className={styles.payRowName}>Floral Decoration</div>
                          <div className={styles.payRowSub}>Paid in full · 100%</div>
                        </div>
                        <div className={styles.payRowRight}>
                          <div className={`${styles.payRowAmt} ${styles.green}`}>PKR 45,000</div>
                        </div>
                      </div>

                      <div className={styles.payRow}>
                        <div className={`${styles.payRowIc} ${styles.paid}`}><i className="bx bx-check"></i></div>
                        <div className={styles.payRowInfo}>
                          <div className={styles.payRowName}>Sound &amp; Lighting</div>
                          <div className={styles.payRowSub}>Paid in full · 100%</div>
                        </div>
                        <div className={styles.payRowRight}>
                          <div className={`${styles.payRowAmt} ${styles.green}`}>PKR 60,000</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR (MATCHING ORDER-DETAIL.HTML LINES 842-895 1:1) */}
            <div className={styles.sidebarSticky}>
              <div className={styles.bookingCard}>
                <div className={styles.sidebarHead}>
                  <div className={styles.shTop}>
                    <div className={styles.shEyebrow}>ORDER SUMMARY</div>
                    <span className={styles.shStatus}><i className="bx bx-check-circle"></i>Confirmed</span>
                  </div>
                  <div className={styles.shTitle}>{order.order_number}</div>
                  <div className={styles.shOrderdate}>
                    <i className="bx bx-calendar"></i>Ordered {order.order_date}
                  </div>
                  <div className={styles.shSub}>
                    {order.items.length} packages · Event March 15, 2025
                  </div>
                  <div className={styles.shTotalRow}>
                    <span className={styles.shTotalLbl}>Total</span>
                    <span className={styles.shTotalVal}>{order.total_amount}</span>
                  </div>
                </div>

                <div className={styles.sdbItems}>
                  {order.items.map((pkgItem, idx) => (
                    <div key={idx} className={styles.sdbItemRow}>
                      <img
                        className={styles.sdbImg}
                        src={pkgItem.image_url}
                        alt={pkgItem.name}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=100&h=100&q=80'; }}
                      />
                      <div className={styles.sdbInfo}>
                        <div className={styles.sdbName}>{pkgItem.name}</div>
                        <div className={styles.sdbPkg}>{pkgItem.item_name}</div>
                      </div>
                      <div className={styles.sdbPrice}>{pkgItem.price}</div>
                    </div>
                  ))}
                </div>

                <div className={styles.priceBreakdown}>
                  {order.summaryLines?.map((line, idx) => (
                    <React.Fragment key={idx}>
                      {line.isTotal && <hr className={styles.priceDashed} />}
                      <div className={`${styles.priceRow} ${line.isTotal ? styles.total : ''}`}>
                        <span>{line.label}</span>
                        <span className={`${styles.priceVal} ${line.isTotal ? styles.total : ''}`}>
                          {line.value}
                        </span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                <div className={styles.amountDueBlock}>
                  <div>
                    <div className={styles.adtLbl}>Paid Today</div>
                    <div className={styles.adtNote}>Deposits + Shipping &amp; Taxes</div>
                  </div>
                  <div className={styles.adtVal}>{order.amount_due_today || 'PKR 2,29,300'}</div>
                </div>

                <div className={styles.futurePayBlock}>
                  <div>
                    <div className={styles.fpLbl}>Future Payments</div>
                    <div className={styles.fpDue}>Remaining balance · Due March 10, 2025</div>
                  </div>
                  <div className={styles.fpVal}>{order.future_payments || 'PKR 1,95,825'}</div>
                </div>

                <div className={styles.freeCancel}>
                  <i className="bx bx-check-circle"></i> Free cancellation within 48 hours of placing your order
                </div>

                {/* SIDEBAR DETAIL LINKS */}
                <div className={styles.sdbDetailLinks}>
                  <button className={styles.sdbDetailRow} onClick={() => setPaySchedDrawerOpen(true)}>
                    <div className={styles.sdbDetailIcon}><i className="bx bx-calendar-check"></i></div>
                    <span className={styles.sdbDetailLbl}>Payment Schedule</span>
                    <span className={styles.sdbDetailAmt}>{order.total_amount || '—'}</span>
                    <i className={`bx bx-chevron-right ${styles.sdbDetailChev}`}></i>
                  </button>
                  <button className={styles.sdbDetailRow} onClick={() => setShippingDrawerOpen(true)}>
                    <div className={styles.sdbDetailIcon}><i className="bx bxs-truck"></i></div>
                    <span className={styles.sdbDetailLbl}>Shipping Details</span>
                    <span className={styles.sdbDetailAmt}>
                      {order.summaryLines?.find(s => s.label.toLowerCase().includes('ship'))?.value || '—'}
                    </span>
                    <i className={`bx bx-chevron-right ${styles.sdbDetailChev}`}></i>
                  </button>
                  <button className={styles.sdbDetailRow} onClick={() => setTaxesDrawerOpen(true)}>
                    <div className={styles.sdbDetailIcon}><i className="bx bx-receipt"></i></div>
                    <span className={styles.sdbDetailLbl}>Taxes Breakdown</span>
                    <span className={styles.sdbDetailAmt}>
                      {order.summaryLines?.find(s => s.label.toLowerCase().includes('tax'))?.value || '—'}
                    </span>
                    <i className={`bx bx-chevron-right ${styles.sdbDetailChev}`}></i>
                  </button>
                </div>

                <div className={styles.actionsBlock}>
                  <button className={styles.btnPrimary} onClick={handleDownloadInvoice} disabled={isDownloading}>
                    <i className={isDownloading ? 'bx bx-loader-alt bx-spin' : 'bx bx-download'}></i>
                    {isDownloading ? ' Downloading...' : ' Download Invoice'}
                  </button>
                  <Link href={`/orders/${order.id}/track/${order.items[0]?.id || 0}`} className={styles.btnOutline}>
                    <i className="bx bx-map"></i> Track Order
                  </Link>
                  {(order.status || '').toLowerCase().includes('cancel') ? (
                    <button
                      className={`${styles.btnOutline} ${styles.danger}`}
                      disabled
                      style={{ opacity: 0.5, cursor: 'not-allowed', background: '#fff0f0', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                      title="This order has already been cancelled"
                    >
                      <i className="bx bx-x-circle"></i> Order Cancelled
                    </button>
                  ) : (
                    <Link href={`/orders/${order.id}/cancel`} className={`${styles.btnOutline} ${styles.danger}`}>
                      <i className="bx bx-x-circle"></i> Cancel Order
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {/* Item Details Popup Modal */}
      {activeModalItem && (
        <div
          className={`${styles.idpOverlay} ${styles.open}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModalItem(null);
          }}
        >
          <button className={styles.idpClose} onClick={() => setActiveModalItem(null)} aria-label="Close">
            <i className="bx bx-x"></i>
          </button>

          <div className={styles.idpPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.idpTopbar}>
              <span className={styles.idpTopbarName}>{activeModalItem.name}</span>
            </div>

            <div className={styles.idpCarousel}>
              {modalImages.length > 1 && (
                <>
                  <button className={`${styles.idpCnav} ${styles.idpCnavPrev}`} onClick={() => handleCarouselNav(-1)}>
                    <i className="bx bx-chevron-left"></i>
                  </button>
                  <button className={`${styles.idpCnav} ${styles.idpCnavNext}`} onClick={() => handleCarouselNav(1)}>
                    <i className="bx bx-chevron-right"></i>
                  </button>
                </>
              )}
              {modalImages.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={activeModalItem.name}
                  className={carouselIdx === i ? styles.active : ''}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&h=500&q=80';
                  }}
                />
              ))}
              <span className={styles.idpCCounter}>{carouselIdx + 1} / {modalImages.length}</span>
            </div>

            <div className={styles.idpBody}>
              <div className={styles.idpItemName}>{activeModalItem.name}</div>
              
              {/* TAG CHIPS */}
              <div className={styles.idpTags}>
                <span className={`${styles.idpTag} ${styles.red}`}>{activeModalItem.variant || 'Verified Item'}</span>
                <span className={`${styles.idpTag} ${styles.green}`}>{activeModalItem.dietary || 'Quality Assured'}</span>
                <span className={styles.idpTag}>{activeModalItem.servings || 'Event Ready'}</span>
              </div>

              {/* DESCRIPTION */}
              <div className={styles.idpDesc}>
                {activeModalItem.description ||
                  `${activeModalItem.name} prepared and delivered with premium quality standards for your event celebration.`}
              </div>

              <div className={styles.idpDivider}></div>
              <div className={styles.idpAboutLbl}>ABOUT THIS ITEM</div>

              {/* 1. What's Included Grid Table */}
              <div className={styles.idpFlexSection}>
                <div className={styles.idpFlexSecTitle}>
                  <i className="bx bx-dish"></i>What&apos;s Included
                </div>
                <div className={styles.idpFtWrap}>
                  <div className={styles.idpFtTable}>
                    {(activeModalItem.included && activeModalItem.included.length > 0
                      ? activeModalItem.included
                      : [
                          ['Item Name', activeModalItem.name],
                          ['Category', 'Event Package Item'],
                          ['Quality Standard', 'Vendor Verified & Inspected'],
                          ['Packaging', 'Hygienically packaged for transit']
                        ]
                    ).map(([k, v]: any, idx: number) => (
                      <div key={idx} className={styles.idpFtRow}>
                        <div className={styles.idpFtKey}>{k}</div>
                        <div className={styles.idpFtVal}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Preparation Grid Table */}
              <div className={styles.idpFlexSection}>
                <div className={styles.idpFlexSecTitle}>
                  <i className="bx bx-time"></i>Preparation &amp; Delivery
                </div>
                <div className={styles.idpFtWrap}>
                  <div className={styles.idpFtTable}>
                    {(activeModalItem.prep && activeModalItem.prep.length > 0
                      ? activeModalItem.prep
                      : [
                          ['Preparation', 'Prepared fresh for your event day'],
                          ['On-Site Timing', 'Delivered according to event schedule'],
                          ['Vendor Handling', 'Managed by professional service team']
                        ]
                    ).map(([k, v]: any, idx: number) => (
                      <div key={idx} className={styles.idpFtRow}>
                        <div className={styles.idpFtKey}>{k}</div>
                        <div className={styles.idpFtVal}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Special Details List */}
              <div className={styles.idpFlexSection}>
                <div className={styles.idpFlexSecTitle}>
                  <i className="bx bx-shield-quarter"></i>Special Details
                </div>
                <ul className={styles.idpDiet}>
                  {(activeModalItem.dietaryList && activeModalItem.dietaryList.length > 0
                    ? activeModalItem.dietaryList
                    : [
                        'Inspected for fresh quality & presentation',
                        'Carefully packaged for safe transit',
                        'Dedicated vendor support on event day'
                      ]
                  ).map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function OrderDetailPageWrapper({ params }: { params: Promise<{ id: string }> }) {
  return (
    <React.Suspense fallback={<div style={{ textAlign: 'center', padding: '100px 0' }}>Loading...</div>}>
      <OrderDetailContent params={params} />
    </React.Suspense>
  );
}
