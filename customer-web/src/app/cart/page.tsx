'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/context/CartContext';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';
import styles from './cart.module.css';

interface ServiceItem {
  item_name: string;
  image_url: string;
  color?: string;
  size?: string;
}

interface SummaryItem {
  label_info: string;
  label_value: string;
}

interface CartSummary {
  original_price?: {
    total_amount?: string;
  };
  summary?: SummaryItem[];
  cart_id?: number;
  shipping_method_id?: number;
  promo?: {
    id: number;
    code: string;
  } | null;
  discount?: {
    discount_percentage: number;
    discount_amount: number;
    discount_amount_text: string;
  } | null;
}

interface CartItem {
  cart_item_id: number;
  service_id: number;
  item_name: string;
  vendor_name: string;
  image_url: string;
  price: number;
  discounted_price?: number;
  quantity: number;
  delivery_date?: string;
  event_date?: string;
  location?: string;
  is_quote?: boolean;
  is_group_deal?: boolean;
  is_mega_deal?: boolean;
  sub_packages?: Array<{ name: string; cost: number }>;
  service_items?: ServiceItem[];
  savings?: number;
  installments?: Array<{ label: string; date: string; pct: number; amount: number }>;
  payment?: {
    amount: number;
    amount_due_today: number;
    remaining_balance: number;
    reservation_percentage: number;
    original_price: number;
  };
  no_of_guests?: number;
  per_head_amount?: number;
  time_of_day_label?: string;
  deliver_as?: string;
}

interface SaveLaterItem {
  save_for_later_id: number;
  service_id: number;
  item_name: string;
  vendor_name: string;
  image_url: string;
  price: number;
  quantity: number;
}



export default function CartPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'cart' | 'saved'>('cart');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<SaveLaterItem[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const { refreshCartCount } = useCart();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = React.useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const getDeliveryStatus = React.useCallback((item: CartItem) => {
    const isBooking = (item.delivery_date || '').toLowerCase().includes('booking');
    const deliverAs = (item.deliver_as || '').trim().toLowerCase();
    const isPackageMode = deliverAs === 'package' || deliverAs === '';
    
    const subItems = item.service_items || [];
    const n = subItems.length;
    
    const dates = subItems
      .map((s: any) => s.delivery_date || s.deliveryDate || s.event_date || s.eventDate)
      .filter((d: any) => d !== undefined && d !== null && d !== '');
    const uniqueDates = Array.from(new Set(dates));
    const isStaggered = uniqueDates.length > 1;
    const sameDate = isPackageMode || !isStaggered;
    
    if (n === 0) {
      return {
        label: isBooking ? 'Booking will be confirmed' : 'Items will arrive',
        color: 'var(--success)',
        icon: 'bx-check-circle'
      };
    }
    
    if (isBooking) {
      return sameDate
        ? {
            label: n === 1 ? '1 item will be booked' : `All ${n} items will be booked for the same day`,
            color: 'var(--success)',
            icon: 'bx-check-circle'
          }
        : {
            label: 'Items will be booked on different days',
            color: 'var(--text-primary)',
            icon: 'bx-calendar'
          };
    } else {
      return sameDate
        ? {
            label: n === 1 ? '1 item will arrive' : `All ${n} items will arrive on the same date`,
            color: 'var(--success)',
            icon: 'bx-check-circle'
          }
        : {
            label: 'Items will arrive on different dates',
            color: 'var(--text-primary)',
            icon: 'bx-calendar'
          };
    }
  }, []);

  const getSummaryValue = React.useCallback((key: string, fallbackVal: number) => {
    if (!summary || !summary.summary) return formatPrice(fallbackVal);
    const searchKey = key.toLowerCase();
    const found = summary.summary.find((item) => {
      const label = (item.label_info || '').toLowerCase();
      if (searchKey === 'subtotal') {
        return label.includes('subtotal') || label.includes('packages total') || label.includes('item total');
      }
      return label.includes(searchKey);
    });
    return found ? found.label_value : formatPrice(fallbackVal);
  }, [summary]);

  // Accordion toggle map
  const [expandedSchedules, setExpandedSchedules] = useState<Record<number, boolean>>({});

  const [selectedItems, setSelectedItems] = useState<Record<number, boolean>>({});

  const formatPrice = (val: any) => {
    if (val === undefined || val === null || val === '') return 'unset';
    const num = Number(val);
    if (isNaN(num)) return 'unset';
    return `PKR ${num.toLocaleString('en-PK')}`;
  };

  const parseNumericPrice = (val: any) => {
    if (val === undefined || val === null || val === '') return 0;
    const cleaned = val.toString().replace(/[^\d.]/g, '');
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Fetch cart list from API
      interface CartItemResponse {
        cart_item_id?: number;
        service_id?: number;
        item_name?: string;
        name?: string;
        vendor_name?: string;
        image_url?: string;
        price?: any;
        cart_item_price?: any;
        quantity?: number;
        delivery_date?: string;
        event_date?: string;
        service_date?: string;
        delivery_title?: string;
        location?: string;
        vendor_location?: string;
        is_quote?: boolean;
        is_group_deal?: boolean;
        savings?: any;
        service_items?: ServiceItem[];
        payment?: any;
        installments?: Array<{ label: string; date: string; pct: number; amount: number }>;
        no_of_guests?: any;
        numberOfGuest?: any;
        per_head_amount?: any;
        perHeadAmount?: any;
        time_of_day_label?: string;
        timeOfDayLabel?: string;
        deliver_as?: string;
        deliverAs?: string;
      }
      const cartRes = await api.get<{ status: boolean; data: CartItemResponse[] }>('/api/v1/cart/items/list')
        .catch(() => ({ status: false, data: [] }));

      // Fetch saved items list
      const savedRes = await api.get<{ status: boolean; data: SaveLaterItem[] }>('/api/v1/save-for-later/list')
        .catch(() => ({ status: false, data: [] }));

      // Fetch dynamic cart summary
      const summaryRes = await api.get<{ status: boolean; data: any }>('/api/v1/cart/summary')
        .catch(() => ({ status: false, data: null }));

      if (summaryRes && summaryRes.status && summaryRes.data) {
        const rawSummary = summaryRes.data;
        const mappedSummary: CartSummary = {
          original_price: rawSummary.original_price || rawSummary.originalPrice,
          summary: (rawSummary.summary || []).map((e: any) => ({
            label_info: e.label_info || e.labelInfo || '',
            label_value: e.label_value || e.labelValue || '0',
          })),
          cart_id: rawSummary.cart_id || rawSummary.cartId,
          shipping_method_id: rawSummary.shipping_method_id || rawSummary.shippingMethodId,
          promo: rawSummary.promo ? {
            id: rawSummary.promo.id,
            code: rawSummary.promo.code,
          } : null,
          discount: rawSummary.discount ? {
            discount_percentage: rawSummary.discount.discount_percentage || rawSummary.discount.discountPercentage || 0,
            discount_amount: rawSummary.discount.discount_amount || rawSummary.discount.discountAmount || 0,
            discount_amount_text: rawSummary.discount.discount_amount_text || rawSummary.discount.discountAmountText || '',
          } : null,
        };
        setSummary(mappedSummary);
      } else {
        setSummary(null);
      }

      if (cartRes.status && cartRes.data && cartRes.data.length > 0) {
        // Map dynamic cart items with fallbacks for UI layout rules
        const mapped = cartRes.data.map((item, idx) => {
          const itemPrice = parseNumericPrice(item.price || item.cart_item_price || 50000);
          const itemSavings = parseNumericPrice(item.savings);
          
          const reservationPercentage = item.payment ? parseNumericPrice(item.payment.reservation_percentage || item.payment.reservationPercentage) : 30;
          const amountDueToday = item.payment ? parseNumericPrice(item.payment.amount_due_today || item.payment.amountDueToday) : Math.round(itemPrice * (reservationPercentage / 100));
          const remainingBalance = item.payment ? parseNumericPrice(item.payment.remaining_balance || item.payment.remainingBalance) : Math.round(itemPrice * ((100 - reservationPercentage) / 100));

          const noOfGuests = item.no_of_guests || item.numberOfGuest;
          const perHeadAmount = item.per_head_amount || item.perHeadAmount;
          const timeOfDayLabel = item.time_of_day_label || item.timeOfDayLabel;
          const deliverAs = item.deliver_as || item.deliverAs || '';

          return {
            cart_item_id: item.cart_item_id || idx + 1,
            service_id: item.service_id || 100 + idx,
            item_name: item.item_name || item.name || 'Service Package',
            vendor_name: item.vendor_name || 'Premium Vendor',
            image_url: item.image_url || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=200&h=200&q=80',
            price: itemPrice,
            quantity: Number(item.quantity || 1),
            delivery_date: item.delivery_title || item.service_date || item.delivery_date || item.event_date || 'Scheduled Date',
            location: item.location || item.vendor_location || 'Lahore',
            is_quote: item.is_quote || false,
            is_group_deal: item.is_group_deal || false,
            savings: itemSavings,
            service_items: item.service_items || [],
            payment: item.payment ? {
              amount: parseNumericPrice(item.payment.amount),
              amount_due_today: amountDueToday,
              remaining_balance: remainingBalance,
              reservation_percentage: reservationPercentage,
              original_price: parseNumericPrice(item.payment.original_price || item.payment.originalPrice || item.payment.orignalPrice),
            } : undefined,
            installments: item.installments || [
              { label: "Booking Deposit", date: "Today", pct: reservationPercentage || 30, amount: amountDueToday },
              { label: "Final Balance", date: "5 days before event", pct: (100 - reservationPercentage) || 70, amount: remainingBalance }
            ],
            no_of_guests: noOfGuests ? Number(noOfGuests) : undefined,
            per_head_amount: perHeadAmount ? parseNumericPrice(perHeadAmount) : undefined,
            time_of_day_label: timeOfDayLabel || undefined,
            deliver_as: deliverAs,
          };
        });
        setCartItems(mapped);

        // Pre-select all items
        const sel: Record<number, boolean> = {};
        mapped.forEach((item) => {
          sel[item.cart_item_id] = true;
        });
        setSelectedItems(sel);
      } else {
        setCartItems([]);
        setSelectedItems({});
      }

      if (savedRes.status && savedRes.data) {
        setSavedItems(savedRes.data);
      } else {
        setSavedItems([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/cart');
      return;
    }
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [router]);



  const handleQuantityChange = async (item: CartItem, newQty: number) => {
    if (newQty < 1) return;
    setCartItems(prev =>
      prev.map(i => (i.cart_item_id === item.cart_item_id ? { ...i, quantity: newQty } : i))
    );
    await api.post('/api/v1/cart/items/quantity/update', {
      quantity: newQty.toString(),
      cart_item_id: item.cart_item_id.toString(),
    }).catch(() => {});
  };

  const handleRemoveItem = async (itemId: number) => {
    setCartItems(prev => prev.filter(i => i.cart_item_id !== itemId));
    await api.delete(ENDPOINTS.CART_REMOVE, {
      cart_item_id: itemId.toString(),
    }).catch(() => {});
    refreshCartCount();
  };

  const handleSaveForLater = async (item: CartItem) => {
    setCartItems(prev => prev.filter(i => i.cart_item_id !== item.cart_item_id));
    await api.post(ENDPOINTS.SAVE_FOR_LATER_ADD, {
      cart_item_id: item.cart_item_id.toString(),
    }).catch(() => {});
    refreshCartCount();
    loadData();
  };

  const handleMoveToCart = async (saveForLaterId: number) => {
    await api.post(ENDPOINTS.SAVE_FOR_LATER_MOVE_TO_CART, {
      save_for_later_id: saveForLaterId.toString(),
    }).catch(() => {});
    refreshCartCount();
    loadData();
  };

  const handleRemoveSaved = async (saveForLaterId: number) => {
    setSavedItems(prev => prev.filter(i => i.save_for_later_id !== saveForLaterId));
    await api.delete(ENDPOINTS.SAVE_FOR_LATER_REMOVE, {
      save_for_later_id: saveForLaterId.toString(),
    }).catch(() => {});
  };

  const toggleSelectAll = (checked: boolean) => {
    const nextSelected: Record<number, boolean> = {};
    if (checked) {
      cartItems.forEach(i => {
        nextSelected[i.cart_item_id] = true;
      });
    }
    setSelectedItems(nextSelected);
  };

  const toggleItemSelect = (id: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleScheduleDetail = (id: number) => {
    setExpandedSchedules(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getActiveCartSelectedItems = () => {
    return cartItems.filter(i => selectedItems[i.cart_item_id]);
  };

  // Calculations totals
  const subtotal = getActiveCartSelectedItems().reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalSavings = getActiveCartSelectedItems().reduce((acc, item) => acc + ((item.savings || 0) * item.quantity), 0);
  const dueToday = getActiveCartSelectedItems().reduce((acc, item) => {
    const todayInst = item.installments?.find(inst => inst.label.toLowerCase().includes('today') || inst.label.toLowerCase().includes('deposit') || inst.label.toLowerCase().includes('full'));
    if (todayInst) {
      return acc + (todayInst.amount * item.quantity);
    }
    return acc + (item.price * item.quantity);
  }, 0);

  const futurePayments = subtotal - dueToday;
  const promoDiscount = promoApplied ? Math.round(subtotal * 0.05) : 0; // 5% coupon discount
  const finalDueToday = Math.max(0, dueToday - promoDiscount);

  const handleProceedCheckout = () => {
    if (getActiveCartSelectedItems().length === 0) {
      alert('Please select at least one item to proceed.');
      return;
    }
    // Store temporarily in localStorage to fetch on next checkout step
    localStorage.setItem('checkout_subtotal', subtotal.toString());
    localStorage.setItem('checkout_due_today', finalDueToday.toString());
    localStorage.setItem('checkout_future', futurePayments.toString());
    router.push('/checkout');
  };

  return (
    <>
      <Header />

      <main className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Cart &amp; Summary</span>
        </div>

        <h1 className={styles.pageTitle}>Cart &amp; Checkout Summary</h1>

        {/* Tab Selection */}
        <div className={styles.pageTabs}>
          <button
            onClick={() => setActiveTab('cart')}
            className={`${styles.pageTab} ${activeTab === 'cart' ? styles.pageTabActive : ''}`}
          >
            <span>Active Cart Items</span>
            <span className={`${styles.tabCount} ${activeTab !== 'cart' ? styles.tabCountGrey : ''}`}>
              {cartItems.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`${styles.pageTab} ${activeTab === 'saved' ? styles.pageTabActive : ''}`}
          >
            <span>Saved for Later</span>
            <span className={`${styles.tabCount} ${activeTab !== 'saved' ? styles.tabCountGrey : ''}`}>
              {savedItems.length}
            </span>
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
            <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>Loading cart data...</p>
          </div>
        ) : activeTab === 'cart' ? (
          cartItems.length === 0 ? (
            <div className={styles.emptyState}>
              <i className={`bx bx-cart ${styles.emptyIcon}`}></i>
              <p className={styles.emptyText}>Your shopping cart is currently empty.</p>
              <Link href="/" className={styles.emptyBtn}>
                Go Shopping
              </Link>
            </div>
          ) : (
            <>
              {/* Total Savings Green Banner */}
              {(() => {
                const discount = summary?.discount;
                const hasBackendDiscount = !!(discount && discount.discount_amount > 0);
                if (!hasBackendDiscount && totalSavings <= 0) return null;
                
                const savingsText = (hasBackendDiscount && discount)
                  ? (discount.discount_amount_text || formatPrice(discount.discount_amount)) 
                  : formatPrice(totalSavings);
                
                const baseMarketPrice = parseNumericPrice(summary?.original_price?.total_amount || (subtotal + totalSavings));
                const shippingText = getSummaryValue('shipping', 0);
                const shippingVal = parseNumericPrice(shippingText);
                const taxText = getSummaryValue('taxes', 0);
                const taxVal = parseNumericPrice(taxText);
                const marketPriceText = formatPrice(baseMarketPrice + shippingVal + taxVal);

                return (
                  <div className={styles.savingsBanner}>
                    <i className="bx bx-purchase-tag"></i>
                    <div>
                      <div className={styles.savingsText}>You&apos;re saving {savingsText}</div>
                      <div className={styles.savingsSub}>vs. Avg. Market Price {marketPriceText}</div>
                    </div>
                  </div>
                );
              })()}

              <div className={styles.cartLayout}>
                {/* LEFT COLUMN: Items List Card */}
                <div className={styles.cartMainColumn}>
                  <div className={styles.card}>
                    <div className={styles.cardInner}>
                      {/* Select All Row */}
                      <div className={styles.selectAllRow}>
                        <label>
                          <input
                            type="checkbox"
                            checked={getActiveCartSelectedItems().length === cartItems.length}
                            onChange={(e) => toggleSelectAll(e.target.checked)}
                            className={styles.cartCheckbox}
                          />
                          <span>Select All</span>
                        </label>
                        <span className={styles.selectCount}>
                          {getActiveCartSelectedItems().length} of {cartItems.length} selected
                        </span>
                      </div>

                      {/* Cart Items Loop */}
                      {cartItems.map((item, idx) => {
                        const isSelected = !!selectedItems[item.cart_item_id];
                        return (
                          <div key={idx} className={styles.cartItem}>
                            <div className={styles.cartItemCheck}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleItemSelect(item.cart_item_id)}
                                className={styles.cartCheckbox}
                              />
                            </div>
                            
                            <div className={styles.ciMain}>
                              {/* Header info layout */}
                              <div className={styles.ciHeader}>
                                <img
                                  className={styles.ciImg}
                                  src={item.image_url}
                                  alt={item.item_name}
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=200&h=200&q=80';
                                  }}
                                />
                                <div className={styles.ciHeadInfo}>
                                  <div className={styles.ciHeadTop}>
                                    <div className={styles.ciTitleBlock}>
                                      <h3 className={styles.ciName}>{item.item_name}</h3>
                                      <span className={styles.ciVendor}>{item.vendor_name}</span>
                                    </div>
                                    <div className={styles.ciHeadBadges}>
                                      {item.is_quote && (
                                        <span className={styles.ciFromQuote}>
                                          <i className="bx bx-receipt"></i> Quote
                                        </span>
                                      )}
                                      {item.is_group_deal && (
                                        <span className={styles.ciStatus} style={{ background: 'rgba(26,122,54,0.09)', color: 'var(--success)' }}>
                                          <i className="bx bx-group"></i> Group Deal
                                        </span>
                                      )}
                                      <span className={`${styles.ciStatus} ${styles.confirmed}`}>
                                        <i className="bx bx-check-circle"></i> Confirmed
                                      </span>
                                    </div>
                                  </div>

                                  <div className={styles.ciMetaRow}>
                                    <span className={styles.ciMeta}>
                                      <i className="bx bx-map"></i> {item.location}
                                    </span>
                                    {item.no_of_guests !== undefined && item.no_of_guests > 0 && (
                                      <span className={styles.ciMeta}>
                                        <i className="bx bx-group"></i> {item.no_of_guests} Guests
                                      </span>
                                    )}
                                    {item.per_head_amount !== undefined && item.per_head_amount > 0 && (
                                      <span className={styles.ciMeta}>
                                        <i className="bx bx-purchase-tag"></i> {formatPrice(item.per_head_amount)}/head
                                      </span>
                                    )}
                                    {item.time_of_day_label && (
                                      <span className={styles.ciMeta}>
                                        <i className="bx bx-time-five"></i> {item.time_of_day_label}
                                      </span>
                                    )}
                                    <span className={styles.ciMeta}>
                                      <i className="bx bx-package"></i> {(() => {
                                        const isBooking = (item.delivery_date || '').toLowerCase().includes('booking');
                                        const subItems = item.service_items || [];
                                        const dates = subItems
                                          .map((s: any) => s.delivery_date || s.deliveryDate || s.event_date || s.eventDate)
                                          .filter((d: any) => d !== undefined && d !== null && d !== '');
                                        const uniqueDates = Array.from(new Set(dates));
                                        const isStaggered = uniqueDates.length > 1;
                                        const deliverAsPackage = (item.deliver_as || '').toLowerCase() === 'package';
                                        if (isBooking) {
                                          return (isStaggered && !deliverAsPackage) ? 'Multi-Day' : 'Single-Day';
                                        } else {
                                          return (isStaggered && !deliverAsPackage) ? 'Multiple Deliveries' : 'Single Delivery';
                                        }
                                      })()}
                                    </span>
                                  </div>

                                  <div className={styles.ciDeliveryDate}>
                                    <span className={styles.ciDdText}>
                                      {(() => {
                                        const displayDate = item.delivery_date || '';
                                        const hasPrefix = /^(delivery|booking)(\s+date)?\s*:/i.test(displayDate);
                                        const isBooking = displayDate.toLowerCase().includes('booking');
                                        return (
                                          <>
                                            <i className={isBooking ? "bx bx-calendar" : "bx bxs-truck"}></i>{' '}
                                            {hasPrefix ? (
                                              <b>{displayDate}</b>
                                            ) : (
                                              <>
                                                {isBooking ? 'Booking date: ' : 'Delivery date: '}
                                                <b>{displayDate}</b>
                                              </>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Content Details (Photo carousels & inline accordion payment schedules) */}
                              <div className={styles.ciContent}>
                                {/* Sub package photo carousel */}
                                {item.service_items && item.service_items.length > 0 && (
                                  <div className={styles.ciCarouselWrap}>
                                    <div className={styles.ciPhotoCarousel}>
                                      {item.service_items.map((sub, sidx) => (
                                        <div key={sidx} className={styles.ciPhotoCard}>
                                          <img
                                            src={sub.image_url}
                                            alt={sub.item_name}
                                            onError={(e) => {
                                              e.currentTarget.src = 'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?auto=format&fit=crop&w=120&h=120&q=80';
                                            }}
                                          />
                                          <div className={styles.ciPhotoName}>{sub.item_name}</div>
                                          <div className={styles.ciPhotoVar}>{sub.color || 'Standard'}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Delivery note status line */}
                                {(() => {
                                  const status = getDeliveryStatus(item);
                                  return (
                                    <div className={styles.ciDeliveryStatusLine} style={{ color: status.color }}>
                                      <i className={`bx ${status.icon}`}></i>
                                      <span>{status.label}</span>
                                    </div>
                                  );
                                })()}

                                {/* Price breakdown summary */}
                                <div className={styles.ciPriceBlockInner}>
                                  <div className={styles.ciPbRow}>
                                    <span>Package Price Amount</span>
                                    <span className={styles.ciPbVal}>{formatPrice(item.price)}</span>
                                  </div>
                                  <div className={styles.ciPbRow}>
                                    <span>Amount Due Today</span>
                                    <span className={`${styles.ciPbVal} ${styles.red}`}>
                                      {formatPrice(item.payment?.amount_due_today ?? Math.round(item.price * 0.3))}
                                    </span>
                                  </div>
                                  <div className={styles.ciPbRow}>
                                    <span>Future Payments Balance</span>
                                    <span className={styles.ciPbVal} style={{ color: 'var(--text-muted)' }}>
                                      {formatPrice(item.payment?.remaining_balance ?? Math.round(item.price * 0.7))}
                                    </span>
                                  </div>

                                  <button
                                    onClick={() => toggleScheduleDetail(item.cart_item_id)}
                                    className={styles.ciViewSched}
                                  >
                                    <span>
                                      <i className="bx bx-calendar-check"></i> View Installment Schedule
                                    </span>
                                    <i className={`bx ${expandedSchedules[item.cart_item_id] ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
                                  </button>

                                  {/* Accordion payment schedule details list */}
                                  {expandedSchedules[item.cart_item_id] && (
                                    <div className={styles.ciSchedDetail}>
                                      {item.installments?.map((inst, idx) => (
                                        <div key={idx} className={styles.ciInst}>
                                          <div className={styles.ciInstGutter}>
                                            <div className={`${styles.ciInstDot} ${idx === 0 ? styles.ciInstDotToday : styles.ciInstDotFuture}`}></div>
                                            {idx < (item.installments?.length || 0) - 1 && <div className={styles.ciInstConn}></div>}
                                          </div>
                                          <div className={styles.ciInstBody}>
                                            <div>
                                              <div className={styles.ciInstLabel}>{inst.label}</div>
                                              <div className={styles.ciInstDate}>{inst.date}</div>
                                              <span className={`${styles.ciInstPct} ${idx === 0 ? styles.ciInstPctToday : styles.ciInstPctFuture}`}>
                                                {inst.pct}%
                                              </span>
                                            </div>
                                            <div className={`${styles.ciInstAmt} ${idx === 0 ? styles.red : ''}`}>
                                              {formatPrice(inst.amount)}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {item.savings && item.savings > 0 ? (
                                    <div className={styles.ciSavingsRibbon}>
                                      <i className="bx bx-trending-down"></i>
                                      <span>You saved {formatPrice(item.savings)} on this package</span>
                                    </div>
                                  ) : null}
                                </div>

                                {/* Steppers & Actions row */}
                                <div className={styles.ciBottom}>
                                  <div className={styles.stepper}>
                                    <button
                                      onClick={() => handleQuantityChange(item, item.quantity - 1)}
                                      className={styles.stepperBtn}
                                      disabled={item.quantity <= 1}
                                    >
                                      −
                                    </button>
                                    <span className={styles.stepperVal}>{item.quantity}</span>
                                    <button
                                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                      className={styles.stepperBtn}
                                    >
                                      +
                                    </button>
                                  </div>
                                  <div className={styles.ciActions}>
                                    <button onClick={() => handleRemoveItem(item.cart_item_id)} className={styles.btnCiDelete}>
                                      <i className="bx bx-trash"></i> Delete
                                    </button>
                                    <button onClick={() => handleSaveForLater(item)} className={styles.btnCiSave}>
                                      <i className="bx bx-bookmark"></i> Save
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Sidebar Order Estimate totals */}
                <aside className={styles.sidebarColumn}>
                  <div className={styles.sidebarSticky}>
                    <div className={styles.bookingCard}>
                      <div className={styles.sidebarHead}>
                        <span className={styles.shEyebrow}>Checkout Total</span>
                        <h2 className={styles.shTitle}>Order Summary</h2>
                        <p className={styles.shSub}>{getActiveCartSelectedItems().length} services selected</p>
                      </div>

                      {/* Promo voucher input */}
                      <div className={styles.promoSection}>
                        <h4 className={styles.promoTitle}>
                          <i className="bx bxs-coupon"></i> Promo Coupon
                        </h4>
                        {summary?.promo ? (
                          <div className={styles.promoApplied}>
                            <span>
                              Voucher <strong>{summary.promo.code}</strong> applied!
                            </span>
                            <button
                              onClick={async () => {
                                try {
                                  await api.delete(ENDPOINTS.CART_PROMO_REMOVE, {
                                    data: { cart_promo_code_id: summary.promo!.id.toString() }
                                  });
                                  showToast('Promo code removed successfully.', 'success');
                                  loadData();
                                } catch (err) {
                                  console.error('Error removing promo code:', err);
                                  showToast('Failed to remove promo code.', 'error');
                                }
                              }}
                              className={styles.promoRemoveBtn}
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className={styles.promoRow}>
                            <input
                              type="text"
                              placeholder="Enter Promo Code"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value)}
                              className={styles.promoInput}
                            />
                            <button
                              onClick={async () => {
                                if (!promoCode.trim()) return;
                                try {
                                  await api.post(ENDPOINTS.CART_PROMO_ADD, {
                                    promo_code: promoCode
                                  });
                                  showToast('Promo code applied successfully!', 'success');
                                  setPromoCode('');
                                  loadData();
                                } catch (err: any) {
                                  console.error('Error applying promo code:', err);
                                  showToast(err.response?.data?.message || 'Invalid promo code.', 'error');
                                }
                              }}
                              className={styles.promoApplyBtn}
                            >
                              Apply
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Price breakdown summary */}
                      <div className={styles.priceBreakdown}>
                        <div className={styles.priceRow}>
                          <span>Total Items price</span>
                          <span className={styles.priceVal}>{getSummaryValue('subtotal', subtotal)}</span>
                        </div>
                        {summary?.discount && (
                          <div className={styles.priceRow}>
                            <span>Coupon Discount</span>
                            <span className={`${styles.priceVal} ${styles.green}`}>
                              − {summary.discount.discount_amount_text || formatPrice(summary.discount.discount_amount)}
                            </span>
                          </div>
                        )}
                        <div className={styles.priceRow}>
                          <span>Taxes</span>
                          <span className={styles.priceVal}>{getSummaryValue('taxes', 0)}</span>
                        </div>
                        <div className={styles.priceRow}>
                          <span>Delivery &amp; Shipping</span>
                          <span className={`${styles.priceVal} ${styles.green}`}>{getSummaryValue('shipping', 0)}</span>
                        </div>
                        <hr className={styles.priceDashed} />
                        <div className={`${styles.priceRow} ${styles.priceRowTotal}`}>
                          <span>Estimated Net Total</span>
                          <span className={styles.priceValTotal}>{getSummaryValue('order total', subtotal - promoDiscount)}</span>
                        </div>
                      </div>

                      {/* Due today breakdown matching designs/cart-checkout.html layout */}
                      <div style={{ background: 'rgba(215,25,33,0.05)', padding: '14px 22px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>Amount Due Today</span>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Reservation downpayment</div>
                          </div>
                          <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>
                            {getSummaryValue('amount due today', finalDueToday)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 22px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Future installment balance</span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {getSummaryValue('future payments', futurePayments)}
                        </span>
                      </div>

                      <div className={styles.freeCancel}>
                        <i className="bx bx-shield-check"></i> Free cancellation within 24 hours of booking
                      </div>

                      <div className={styles.ctaSection}>
                        <button onClick={handleProceedCheckout} className={styles.btnConfirm}>
                          Proceed to Checkout <i className="bx bx-right-arrow-alt"></i>
                        </button>
                        <div className={styles.confirmSub}>
                          <i className="bx bx-lock-alt"></i> 256-bit Secure TLS Encryption
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </>
          )
        ) : (
          /* SAVED FOR LATER TAB VIEW */
          savedItems.length === 0 ? (
            <div className={styles.emptyState}>
              <i className={`bx bx-bookmark-minus ${styles.emptyIcon}`}></i>
              <p className={styles.emptyText}>You haven&apos;t saved any items for later.</p>
            </div>
          ) : (
            <div style={{ maxWidth: '800px' }} className={styles.card}>
              <div className={styles.cardInner}>
                {savedItems.map((item, idx) => (
                  <div key={idx} className={styles.savedItem}>
                    <img
                      src={item.image_url}
                      alt={item.item_name}
                      className={styles.ciImg}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?auto=format&fit=crop&w=150&q=80';
                      }}
                    />
                    <div className={styles.ciMain}>
                      <div className={styles.ciHeader}>
                        <div>
                          <h3 className={styles.ciName}>{item.item_name}</h3>
                          <span className={styles.ciVendor}>{item.vendor_name || 'Premium Vendor'}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveSaved(item.save_for_later_id)}
                          className={styles.btnCiDelete}
                          title="Remove bookmark"
                        >
                          <i className="bx bx-trash"></i> Remove
                        </button>
                      </div>

                      <div className={styles.ciBottom}>
                        <div className={styles.ciPriceBlock}>
                          <span className={styles.ciPriceLabel}>Price</span>
                          <span className={styles.ciPriceVal}>{formatPrice(item.price)}</span>
                        </div>

                        <div className={styles.savedActions}>
                          <button
                            onClick={() => handleMoveToCart(item.save_for_later_id)}
                            className={styles.btnMoveCart}
                          >
                            <i className="bx bx-cart-add"></i> Move to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </main>

      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
          background: toast.type === 'error' ? 'var(--primary)' : 'var(--success)',
          color: '#fff', padding: '12px 24px', borderRadius: '8px',
          boxShadow: 'var(--shadow-lg)', fontWeight: 600, fontSize: '13.5px'
        }}>
          {toast.message}
        </div>
      )}
      <Footer />
    </>
  );
}
