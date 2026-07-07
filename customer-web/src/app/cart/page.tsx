'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from './cart.module.css';

interface CartItem {
  cart_item_id: number;
  service_id: number;
  name: string;
  item_name: string;
  image_url: string;
  price: string;
  discounted_price?: string;
  package_discounted_price?: string;
  quantity: number;
  delivery_date?: string;
  event_date?: string;
  location?: string;
  vendor_location?: string;
  area?: string;
  [key: string]: any;
}

interface SaveLaterItem {
  save_for_later_id: number;
  service_id: number;
  name: string;
  item_name: string;
  image_url: string;
  price: string;
  quantity: number;
  location?: string;
  [key: string]: any;
}

interface CartSummary {
  originalPrice: {
    totalAmount: string;
  };
  summary: Array<{
    labelInfo: string;
    labelValue: string;
  }>;
  cartId: number;
  shippingMethodId?: number;
  promo?: {
    id: number;
    code: string;
  } | null;
  discount?: {
    discountPercentage: number;
    discountAmount: number;
    discountAmountText: string;
  } | null;
}

interface InstallmentTerm {
  paymentDate: string;
  termAmount: string;
  amountPercentage: number;
}

export default function CartPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'cart' | 'saved'>('cart');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<SaveLaterItem[]>([]);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Installment Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerItemName, setDrawerItemName] = useState('');
  const [installments, setInstallments] = useState<InstallmentTerm[]>([]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatPrice = (val: any, label?: string) => {
    if (val === undefined || val === null || val === '') return 'unset';
    const lblLower = (label || '').toLowerCase();
    if (lblLower.includes('guests') || lblLower === 'quantity' || lblLower === 'items count') {
      return val.toString();
    }
    if (lblLower.includes('reservation %') || lblLower.includes('percent')) {
      const numericPart = val.toString().replace(/%/g, '').trim();
      return `${numericPart}%`;
    }
    const valStr = val.toString();
    if (valStr.includes('PKR') || valStr === 'unset') return valStr;
    if (/^\d+(\.\d+)?$/.test(valStr)) {
      const parsedNum = parseFloat(valStr);
      return `PKR ${parsedNum.toLocaleString('en-US')}`;
    }
    return `PKR ${valStr}`;
  };

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/cart');
      return;
    }

    loadCartData();
  }, []);

  const loadCartData = async () => {
    try {
      setIsLoading(true);

      // 1. Get cart items
      const cartRes = await api.get<{ status: boolean; data: any[] }>('/api/v1/cart/items/list')
        .catch(() => ({ status: false, data: [] }));
      if (cartRes.status && cartRes.data) {
        setCartItems(cartRes.data);
      }

      // 2. Get saved list
      const savedRes = await api.get<{ status: boolean; data: any[] }>('/api/v1/save-for-later/list')
        .catch(() => ({ status: false, data: [] }));
      if (savedRes.status && savedRes.data) {
        setSavedItems(savedRes.data);
      }

      // 3. Get Summary totals
      await fetchSummary();

    } catch (e) {
      console.error('Error fetching cart data:', e);
      showToast('Failed to load cart elements.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const summaryRes = await api.get<any>('/api/v1/cart/summary').catch(() => null);
      if (summaryRes) {
        // Parse mapping according to CartSummaryDto structure
        const discountObj = summaryRes.discount
          ? {
              discountPercentage: Number(summaryRes.discount.discount_percentage || 0),
              discountAmount: Number(summaryRes.discount.discount_amount || 0),
              discountAmountText: summaryRes.discount.discount_amount_text || '',
            }
          : null;

        const promoObj = summaryRes.promo
          ? {
              id: Number(summaryRes.promo.id),
              code: summaryRes.promo.code || '',
            }
          : null;

        setSummary({
          originalPrice: {
            totalAmount: summaryRes.original_price?.total_amount || summaryRes.original_price?.totalAmount || '0',
          },
          summary: (summaryRes.summary || []).map((s: any) => ({
            labelInfo: s.label_info || s.labelInfo || 'unset',
            labelValue: s.label_value || s.labelValue || '0',
          })),
          cartId: summaryRes.cart_id || summaryRes.cartId || 0,
          promo: promoObj,
          discount: discountObj,
        });
      }
    } catch (e) {
      console.error('Error fetching summary:', e);
    }
  };

  // Update quantity stepper handler
  const handleQuantityChange = async (item: CartItem, newQty: number) => {
    if (newQty < 1) return;
    try {
      // Optimistic state update
      setCartItems(prev =>
        prev.map(i => (i.cart_item_id === item.cart_item_id ? { ...i, quantity: newQty } : i))
      );

      const res = await api.post<{ status: boolean; message: string }>('/api/v1/cart/items/quantity/update', {
        quantity: newQty.toString(),
        cart_item_id: item.cart_item_id.toString(),
      });

      if (res.status) {
        showToast(res.message || 'Quantity updated successfully.');
        await fetchSummary();
      } else {
        throw new Error(res.message);
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to update item quantity.', 'error');
      // Rollback on failure
      loadCartData();
    }
  };

  // Remove Item
  const handleRemoveItem = async (itemId: number) => {
    try {
      const res = await api.delete<{ status: boolean; message: string }>('/api/v1/cart/items/remove', {
        cart_item_id: itemId.toString(),
      });
      if (res.status) {
        showToast('Item removed from cart.');
        setCartItems(prev => prev.filter(i => i.cart_item_id !== itemId));
        await fetchSummary();
      }
    } catch (e) {
      showToast('Failed to remove item.', 'error');
    }
  };

  // Save for Later
  const handleSaveForLater = async (item: CartItem) => {
    try {
      const res = await api.post<{ status: boolean; message: string }>('/api/v1/save-for-later/add', {
        cart_item_id: item.cart_item_id.toString(),
      });
      if (res.status) {
        showToast('Saved for later bookmark added.');
        // Refresh grids
        loadCartData();
      }
    } catch (e) {
      showToast('Could not save item for later.', 'error');
    }
  };

  // Move saved item back to Cart
  const handleMoveToCart = async (saveForLaterId: number) => {
    try {
      const res = await api.post<{ status: boolean; message: string }>('/api/v1/save-for-later/move-to-cart', {
        save_for_later_id: saveForLaterId.toString(),
      });
      if (res.status) {
        showToast('Item moved back to cart.');
        loadCartData();
      }
    } catch (e) {
      showToast('Failed to move item to cart.', 'error');
    }
  };

  // Remove saved item
  const handleRemoveSaved = async (saveForLaterId: number) => {
    try {
      const res = await api.delete<{ status: boolean; message: string }>('/api/v1/save-for-later/remove', {
        save_for_later_id: saveForLaterId.toString(),
      });
      if (res.status) {
        showToast('Item removed from saved list.');
        setSavedItems(prev => prev.filter(i => i.save_for_later_id !== saveForLaterId));
      }
    } catch (e) {
      showToast('Failed to delete saved item.', 'error');
    }
  };

  // Apply Coupon code
  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    try {
      const res = await api.post<{ status: boolean; message: string }>('/api/v1/cart/promo-code/add', {
        promo_code: promoCode.trim(),
      });
      if (res.status) {
        showToast(res.message || 'Promo coupon applied!', 'success');
        setPromoCode('');
        await fetchSummary();
      } else {
        showToast(res.message || 'Invalid promotion coupon code.', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to apply promo code.', 'error');
    }
  };

  // Delete Coupon code
  const handleRemovePromo = async (promoId: number) => {
    try {
      const res = await api.delete<{ status: boolean; message: string }>('/api/v1/cart/promo-code/remove', {
        cart_promo_code_id: promoId.toString(),
      });
      if (res.status) {
        showToast('Coupon code removed.');
        await fetchSummary();
      }
    } catch (e) {
      showToast('Failed to delete promo code.', 'error');
    }
  };

  // Open installments Drawer preview
  const openInstallmentsDrawer = async (id: number, name: string, isSaved = false) => {
    setDrawerItemName(name);
    setDrawerOpen(true);
    setDrawerLoading(true);
    setInstallments([]);
    try {
      const endpoint = isSaved
        ? `/api/v1/save-for-later/payment-term?save_for_later_id=${id}`
        : `/api/v1/cart/items/payment-term?cart_item_id=${id}`;

      const res = await api.get<{ status: boolean; data: any }>(endpoint);
      if (res.status && res.data) {
        // Parse list from payments installment DTO keys
        const rawTerms = res.data.payment_terms || res.data.paymentTerms || [];
        const parsed = rawTerms.map((term: any) => ({
          paymentDate: term.payment_date || term.paymentDate || 'unset',
          termAmount: term.term_amount || term.termAmount || 'unset',
          amountPercentage: Number(term.amount_percentage || term.amountPercentage || 0),
        }));
        setInstallments(parsed);
      }
    } catch (e) {
      console.error(e);
      showToast('Could not fetch installments preview details.', 'error');
    } finally {
      setDrawerLoading(false);
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
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Cart &amp; Summary</span>
        </div>

        <h1 className={styles.pageTitle}>Cart &amp; Checkout Summary</h1>

        {/* Page tabs */}
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
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
            <p style={{ marginTop: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>Loading cart data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'cart' ? (
              cartItems.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className={`bx bx-cart ${styles.emptyIcon}`}></i>
                  <p className={styles.emptyText}>Your shopping cart is currently empty.</p>
                  <Link href="/" className={styles.emptyBtn}>
                    Go Shopping
                  </Link>
                </div>
              ) : (
                <div className={styles.cartLayout}>
                  {/* Cart items list */}
                  <div className={styles.card}>
                    <div className={styles.cardInner}>
                      {cartItems.map((item, idx) => {
                        const displayLocation = item.location || item.vendor_location || item.area;
                        const displayPrice = item.package_discounted_price || item.discounted_price || item.price || 'unset';
                        return (
                          <div key={idx} className={styles.cartItem}>
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
                              <div className={styles.ciHeader}>
                                <div>
                                  <h3 className={styles.ciName}>{item.name || 'unset'}</h3>
                                  <span className={styles.ciVendor}>{item.item_name || 'unset'}</span>
                                </div>
                                <div className={styles.ciActions}>
                                  <button
                                    onClick={() => handleSaveForLater(item)}
                                    className={styles.saveLaterBtn}
                                    title="Save for Later"
                                  >
                                    <i className="bx bx-bookmark"></i> Save
                                  </button>
                                  <button
                                    onClick={() => handleRemoveItem(item.cart_item_id)}
                                    className={`${styles.iconActionBtn} ${styles.iconActionBtnDanger}`}
                                    title="Delete item"
                                  >
                                    <i className="bx bx-trash"></i>
                                  </button>
                                </div>
                              </div>

                              <div className={styles.ciMetaRow}>
                                {displayLocation && (
                                  <span className={styles.ciMeta}>
                                    <i className="bx bx-map"></i>
                                    {displayLocation}
                                  </span>
                                )}
                                {(item.delivery_date || item.event_date) && (
                                  <span className={styles.ciMeta}>
                                    <i className="bx bx-calendar"></i>
                                    {item.delivery_date || item.event_date}
                                  </span>
                                )}
                              </div>

                              <div className={styles.ciBottom}>
                                <div className={styles.ciPriceBlock}>
                                  <span className={styles.ciPriceLabel}>Base price</span>
                                  <span className={styles.ciPriceVal}>{formatPrice(displayPrice)}</span>
                                </div>

                                <div className={styles.ciActions}>
                                  <button
                                    onClick={() => openInstallmentsDrawer(item.cart_item_id, item.name)}
                                    className={styles.saveLaterBtn}
                                    style={{ color: 'var(--primary)', marginRight: '10px' }}
                                  >
                                    <i className="bx bx-time-five"></i> View Installments
                                  </button>

                                  <div className={styles.stepper}>
                                    <button
                                      onClick={() => handleQuantityChange(item, item.quantity - 1)}
                                      className={styles.stepperBtn}
                                      disabled={item.quantity <= 1}
                                    >
                                      -
                                    </button>
                                    <span className={styles.stepperVal}>{item.quantity}</span>
                                    <button
                                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                      className={styles.stepperBtn}
                                    >
                                      +
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

                  {/* Summary Sidebar */}
                  <div className={styles.sidebarSticky}>
                    <div className={styles.bookingCard}>
                      <div className={styles.sidebarHead}>
                        <span className={styles.shEyebrow}>Cart Summary</span>
                        <h2 className={styles.shTitle}>Order Estimate</h2>
                        {summary && (
                          <div className={styles.shTotalRow}>
                            <span className={styles.shTotalLbl}>Estimated Net:</span>
                             <span className={styles.shTotalVal}>
                               {formatPrice(summary.summary.find(s => s.labelInfo.toLowerCase().includes('net') || s.labelInfo.toLowerCase().includes('total'))?.labelValue || summary.originalPrice.totalAmount)}
                             </span>
                          </div>
                        )}
                      </div>

                      {/* Promo section */}
                      <div className={styles.promoSection}>
                        <h4 className={styles.promoTitle}>
                          <i className="bx bxs-coupon"></i> Promo Coupon
                        </h4>
                        {summary?.promo ? (
                          <div className={styles.promoApplied}>
                            <span>
                              Code <strong>{summary.promo.code}</strong> Applied!
                            </span>
                            <button
                              onClick={() => handleRemovePromo(summary.promo!.id)}
                              className={styles.promoRemoveBtn}
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <form onSubmit={handleApplyPromo} className={styles.promoRow}>
                            <input
                              type="text"
                              placeholder="Enter Promo Code"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value)}
                              className={styles.promoInput}
                            />
                            <button type="submit" className={styles.promoApplyBtn}>
                              Apply
                            </button>
                          </form>
                        )}
                      </div>

                      {/* Breakdown summary */}
                      <div className={styles.priceBreakdown}>
                        {summary?.summary.map((row, idx) => {
                          const isTotal = row.labelInfo.toLowerCase().includes('net') || row.labelInfo.toLowerCase().includes('total');
                          return (
                            <div key={idx} className={`${styles.priceRow} ${isTotal ? styles.priceRowTotal : ''}`}>
                              <span>{row.labelInfo}</span>
                              <span className={`${styles.priceVal} ${isTotal ? styles.priceValTotal : ''}`}>
                                {formatPrice(row.labelValue, row.labelInfo)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className={styles.ctaSection}>
                        <button
                          onClick={() => router.push('/checkout')}
                          className={styles.btnConfirm}
                        >
                          Proceed to Checkout <i className="bx bx-right-arrow-alt"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              savedItems.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className={`bx bx-bookmark-minus ${styles.emptyIcon}`}></i>
                  <p className={styles.emptyText}>You haven't saved any items for later.</p>
                </div>
              ) : (
                <div style={{ maxWidth: '800px' }} className={styles.card}>
                  <div className={styles.cardInner}>
                    {savedItems.map((item, idx) => {
                      return (
                        <div key={idx} className={styles.savedItem}>
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
                            <div className={styles.ciHeader}>
                              <div>
                                <h3 className={styles.ciName}>{item.name || 'unset'}</h3>
                                <span className={styles.ciVendor}>{item.item_name || 'unset'}</span>
                              </div>
                              <button
                                onClick={() => handleRemoveSaved(item.save_for_later_id)}
                                className={`${styles.iconActionBtn} ${styles.iconActionBtnDanger}`}
                                title="Remove bookmark"
                              >
                                <i className="bx bx-trash"></i>
                              </button>
                            </div>

                            <div className={styles.ciBottom}>
                              <div className={styles.ciPriceBlock}>
                                <span className={styles.ciPriceLabel}>Price</span>
                                <span className={styles.ciPriceVal}>{item.price || 'unset'}</span>
                              </div>

                              <div className={styles.savedActions}>
                                <button
                                  onClick={() => openInstallmentsDrawer(item.save_for_later_id, item.name, true)}
                                  className={styles.saveLaterBtn}
                                  style={{ color: 'var(--primary)', marginRight: '15px' }}
                                >
                                  <i className="bx bx-time-five"></i> View Installments
                                </button>

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
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </>
        )}
      </main>

      {/* Slide-over Installments Drawer Overlay */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={`${styles.drawerOverlay} ${drawerOpen ? styles.drawerOverlayOpen : ''}`}
      ></div>

      {/* Drawer Panel */}
      <div className={`${styles.drawerPanel} ${drawerOpen ? styles.drawerPanelOpen : ''}`}>
        <div className={styles.drawerHeader}>
          <h3 className={styles.drawerTitle}>Future Payments Schedule</h3>
          <button onClick={() => setDrawerOpen(false)} className={styles.drawerClose}>
            <i className="bx bx-x"></i>
          </button>
        </div>
        <div className={styles.drawerBody}>
          <div className={styles.drawerHero}>
            <h4 className={styles.drawerHeroTitle}>{drawerItemName || 'unset'}</h4>
            <p className={styles.drawerHeroSub}>
              Installment payment structures mapped by vendor terms.
            </p>
          </div>

          {drawerLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '30px', color: 'var(--primary)' }}></i>
            </div>
          ) : installments.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              No installment terms found for this item. Full payment due at booking.
            </div>
          ) : (
            <div className={styles.dwTl}>
              {installments.map((term, idx) => {
                const isToday = idx === 0;
                return (
                  <div key={idx} className={styles.dwTlItem}>
                    <div className={styles.dwTlGutter}>
                      <div className={`${styles.dwTlDot} ${isToday ? styles.dwTlDotToday : styles.dwTlDotFuture}`}></div>
                      {idx < installments.length - 1 && <div className={styles.dwTlConn}></div>}
                    </div>
                    <div className={`${styles.dwTlCard} ${isToday ? styles.dwTlCardToday : ''}`}>
                      <div className={styles.dwTlTop}>
                        <span className={styles.dwTlDate}>
                          {term.paymentDate}
                        </span>
                        {isToday && (
                          <span style={{
                            backgroundColor: 'var(--primary)',
                            color: '#fff',
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '12px'
                          }}>
                            Due Today
                          </span>
                        )}
                      </div>
                      <div className={styles.dwTlAmt}>{term.termAmount}</div>
                      <p className={styles.dwTlDesc}>
                        Installment installment amount representing <strong>{term.amountPercentage}%</strong> of the service total.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
