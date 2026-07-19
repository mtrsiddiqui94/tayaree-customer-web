'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from './checkout.module.css';

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

interface Address {
  id: number;
  title: string;
  address: string;
  address2?: string;
  isDefault: number;
  isActive: number;
  lat?: string;
  lng?: string;
  street?: string;
  city: string;
  province?: string;
  provinceShortCode?: string;
  postalCode?: string;
  country: string;
  phone?: string;
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
  discount?: any;
  promo?: any;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [deliveryGroups, setDeliveryGroups] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [summary, setSummary] = useState<CartSummary | null>(null);

  const parseNumericPrice = (val: any) => {
    if (val === undefined || val === null || val === '') return 0;
    const cleaned = val.toString().replace(/[^\d.]/g, '');
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const formatPrice = (val: any) => {
    if (val === undefined || val === null || val === '') return 'unset';
    const num = Number(val);
    if (isNaN(num)) return 'unset';
    return `PKR ${num.toLocaleString('en-PK')}`;
  };
  
  // Checkout selections states
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'cod'>('cod');
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  
  // Form input fields
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Address form toggle state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddressTitle, setNewAddressTitle] = useState('');
  const [newAddressLine1, setNewAddressLine1] = useState('');
  const [newAddressLine2, setNewAddressLine2] = useState('');
  const [newAddressCity, setNewAddressCity] = useState('');
  const [newAddressProvince, setNewAddressProvince] = useState('');
  const [newAddressPostal, setNewAddressPostal] = useState('');
  const [newAddressCountry, setNewAddressCountry] = useState('Pakistan');
  
  // Loader and messages
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Shipping, Taxes breakdown states
  const [isShippingDrawerOpen, setIsShippingDrawerOpen] = useState(false);
  const [isTaxesDrawerOpen, setIsTaxesDrawerOpen] = useState(false);
  
  const [shippingDetails, setShippingDetails] = useState<{
    packages: Array<{ id: number; name: string; image: string; date: string }>;
    items: Array<{ name: string; packageName: string; shipping: number }>;
    total_shipping: number;
  } | null>(null);
  
  const [taxesDetails, setTaxesDetails] = useState<{
    packages: Array<{ id: number; name: string; image: string; date: string }>;
    items: Array<{ name: string; packageName: string; taxes: number; percentage: number }>;
    total_taxes: number;
  } | null>(null);

  const [selectedShippingPackageIds, setSelectedShippingPackageIds] = useState<number[]>([]);
  const [selectedTaxesPackageIds, setSelectedTaxesPackageIds] = useState<number[]>([]);

  const handleShippingSelectionChange = async (selectedIds: number[]) => {
    try {
      let url = '/api/v1/cart/items/shipment/list?is_init=0';
      selectedIds.forEach((id) => {
        url += `&cart_package_ids[]=${id}`;
      });
      const res = await api.get<{ status: boolean; data: any }>(url);
      if (res && res.data) {
        const raw = res.data;
        setShippingDetails(prev => {
          if (!prev) return null;
          return {
            packages: prev.packages,
            items: (raw.items || []).map((i: any) => ({
              name: i.item_name || i.name || '',
              packageName: i.package_name || '',
              shipping: parseNumericPrice(i.shipping_charges || i.shipping || 0),
            })),
            total_shipping: parseNumericPrice(raw.total_shipping || 0),
          };
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTaxesSelectionChange = async (selectedIds: number[]) => {
    try {
      let url = '/api/v1/cart/taxes/details?is_init=0';
      selectedIds.forEach((id) => {
        url += `&cart_package_ids[]=${id}`;
      });
      const res = await api.get<{ status: boolean; data: any }>(url);
      if (res && res.data) {
        const raw = res.data;
        setTaxesDetails(prev => {
          if (!prev) return null;
          return {
            packages: prev.packages,
            items: (raw.items || []).map((i: any) => ({
              name: i.item_name || i.name || '',
              packageName: i.package_name || '',
              taxes: parseNumericPrice(i.tax_amount || i.tax || i.taxes || 0),
              percentage: parseNumericPrice(i.tax_percentage || i.percentage || 0),
            })),
            total_taxes: parseNumericPrice(raw.total_taxes || 0),
          };
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getPackageTotalItemsCount = useCallback((packageName: string) => {
    let total = 0;
    deliveryGroups.forEach((group) => {
      group.body?.forEach((p: any) => {
        if ((p.packageName || p.itemName || '').trim().toLowerCase() === packageName.trim().toLowerCase()) {
          total += p.images ? p.images.length : 0;
        }
      });
    });
    return total;
  }, [deliveryGroups]);

  const getSummaryValue = useCallback((key: string, fallbackVal: number) => {
    if (!summary || !summary.summary) return formatPrice(fallbackVal);
    const searchKey = key.toLowerCase();
    const found = summary.summary.find((item) => {
      const label = (item.labelInfo || '').toLowerCase();
      if (searchKey === 'subtotal') {
        return label.includes('subtotal') || label.includes('packages total') || label.includes('item total');
      }
      return label.includes(searchKey);
    });
    return found ? found.labelValue : formatPrice(fallbackVal);
  }, [summary]);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadCheckoutData = useCallback(async () => {
    try {
      // 1. Get flat checkout items list from cart
      const cartListRes = await api.get<{ status: boolean; data: any[] }>('/api/v1/cart/items/list')
        .catch(() => ({ status: false, data: [] }));
      const flatItems = (cartListRes.data || []).map((itm, idx) => ({
        cart_item_id: itm.cart_item_id || idx + 1,
        service_id: itm.service_id || 100 + idx,
        name: itm.item_name || itm.name || 'Service Package',
        item_name: itm.item_name || itm.name || 'Service Package',
        image_url: itm.image_url || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=150&q=80',
        price: itm.price || itm.cart_item_price || 50000,
        quantity: Number(itm.quantity || 1),
        location: itm.location || itm.vendor_location || 'Lahore',
      }));
      setCheckoutItems(flatItems);

      // Get grouped delivery details list
      const checkoutRes = await api.get<{ status: boolean; data: any[] }>('/api/v1/checkout/items')
        .catch(() => ({ status: false, data: [] }));
      setDeliveryGroups(checkoutRes.data || []);

      if (flatItems.length === 0) {
        showToast('Your checkout queue is empty.', 'info');
        router.push('/cart');
        return;
      }

      // 2. Get saved addresses
      const addrRes = await api.get<{ status: boolean; data: any[] }>('/api/v1/address/list')
        .catch(() => ({ status: false, data: [] }));
      
      const parsedAddresses: Address[] = (addrRes.data || []).map((addr: any) => ({
        id: addr.id,
        title: addr.title || 'unset',
        address: addr.address || 'unset',
        address2: addr.address_2 || addr.address2 || '',
        isDefault: addr.is_default || addr.isDefault || 0,
        isActive: addr.is_active || addr.isActive || 1,
        city: addr.city || 'unset',
        country: addr.country || 'Pakistan',
        province: addr.province || '',
        postalCode: addr.postal_code || addr.postalCode || '',
        phone: addr.phone || addr.phone_number || addr.phoneNumber || addr.contact || '',
      }));
      setAddresses(parsedAddresses);

      // Select default address if exists
      const defaultAddr = parsedAddresses.find(a => a.isDefault === 1);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (parsedAddresses.length > 0) {
        setSelectedAddressId(parsedAddresses[0].id);
      }

      // 3. Get Cart Summary
      const summaryRes = await api.get<any>('/api/v1/cart/summary').catch(() => null);
      if (summaryRes) {
        const rawSummary = summaryRes.data || summaryRes;
        setSummary({
          originalPrice: {
            totalAmount: rawSummary.original_price?.total_amount || rawSummary.original_price?.totalAmount || rawSummary.originalPrice?.totalAmount || '0',
          },
          summary: (rawSummary.summary || []).map((s: any) => ({
            labelInfo: s.label_info || s.labelInfo || 'unset',
            labelValue: s.label_value || s.labelValue || '0',
          })),
          cartId: rawSummary.cart_id || rawSummary.cartId || 0,
          discount: rawSummary.discount ? {
            discount_percentage: rawSummary.discount.discount_percentage || rawSummary.discount.discountPercentage || 0,
            discount_amount: rawSummary.discount.discount_amount || rawSummary.discount.discountAmount || 0,
            discount_amount_text: rawSummary.discount.discount_amount_text || rawSummary.discount.discountAmountText || '',
          } : null,
          promo: rawSummary.promo ? {
            id: rawSummary.promo.id,
            code: rawSummary.promo.code,
          } : null,
        });
      }

      // Get shipping charges details
      const shipListRes = await api.get<{ status: boolean; data: any }>('/api/v1/cart/items/shipment/list?is_init=1').catch(() => null);
      if (shipListRes && shipListRes.data) {
        const raw = shipListRes.data;
        const pkgs = (raw.packages || []).map((p: any) => ({
          id: p.id,
          name: p.item_name || p.name || '',
          image: p.item_image || p.image || '',
          date: p.delivery_title || p.date || '',
        }));
        setShippingDetails({
          packages: pkgs,
          items: (raw.items || []).map((i: any) => ({
            name: i.item_name || i.name || '',
            packageName: i.package_name || '',
            shipping: parseNumericPrice(i.shipping_charges || i.shipping || 0),
          })),
          total_shipping: parseNumericPrice(raw.total_shipping || 0),
        });
        setSelectedShippingPackageIds(pkgs.map((p: any) => p.id));
      }

      // Get taxes details
      const taxListRes = await api.get<{ status: boolean; data: any }>('/api/v1/cart/taxes/details?is_init=1').catch(() => null);
      if (taxListRes && taxListRes.data) {
        const raw = taxListRes.data;
        const pkgs = (raw.packages || []).map((p: any) => ({
          id: p.id,
          name: p.item_name || p.name || '',
          image: p.item_image || p.image || '',
          date: p.delivery_title || p.date || '',
        }));
        setTaxesDetails({
          packages: pkgs,
          items: (raw.items || []).map((i: any) => ({
            name: i.item_name || i.name || '',
            packageName: i.package_name || '',
            taxes: parseNumericPrice(i.tax_amount || i.tax || i.taxes || 0),
            percentage: parseNumericPrice(i.tax_percentage || i.percentage || 0),
          })),
          total_taxes: parseNumericPrice(raw.total_taxes || 0),
        });
        setSelectedTaxesPackageIds(pkgs.map((p: any) => p.id));
      }

      // 4. Get saved credit cards
      const cardsRes = await api.get<{ status: boolean; data: any[] }>('/api/v1/payment/credit-cards/list')
        .catch(() => ({ status: false, data: [] }));
      const parsedCards = cardsRes.data || [];
      setCreditCards(parsedCards);
      
      const defaultCard = parsedCards.find((c: any) => c.is_default === 1 || c.isDefault === 1);
      if (defaultCard) {
        setSelectedCardId(defaultCard.id);
      } else if (parsedCards.length > 0) {
        setSelectedCardId(parsedCards[0].id);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load checkout details.', 'error');
    }
  }, [router, showToast]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/checkout');
      return;
    }

    const email = localStorage.getItem('userEmail') || '';
    const timer = setTimeout(() => {
      setContactEmail(email);
      loadCheckoutData();
    }, 0);
    return () => clearTimeout(timer);
  }, [router, loadCheckoutData]);

  // Mask Phone input to match Pakistan format (03xx-xxxxxxx)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    let formatted = rawVal;
    if (rawVal.length > 4) {
      formatted = `${rawVal.slice(0, 4)}-${rawVal.slice(4, 11)}`;
    }
    setContactPhone(formatted.slice(0, 12)); // Max 12 characters (03xx-xxxxxxx)
  };

  // Add new address inline
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressTitle || !newAddressLine1 || !newAddressCity) {
      showToast('Please fill out all required address fields.', 'error');
      return;
    }

    try {
      const payload = {
        title: newAddressTitle,
        address: newAddressLine1,
        address_2: newAddressLine2,
        lat: '33.6844', // default coordinates
        lng: '73.0479',
        is_default: addresses.length === 0 ? '1' : '0',
        is_active: '1',
        street: newAddressLine1,
        city: newAddressCity,
        province: newAddressProvince,
        province_short_code: newAddressProvince.slice(0, 2).toUpperCase(),
        postal_code: newAddressPostal,
        country: newAddressCountry,
      };

      const res = await api.post<{ status: boolean; message: string }>('/api/v1/address/store', payload);
      if (res.status) {
        showToast(res.message || 'Address saved successfully.');
        setShowAddressForm(false);
        // Reset inputs
        setNewAddressTitle('');
        setNewAddressLine1('');
        setNewAddressLine2('');
        setNewAddressCity('');
        setNewAddressProvince('');
        setNewAddressPostal('');
        // Reload listings
        loadCheckoutData();
      }
    } catch (e) {
      showToast('Failed to save address.', 'error');
    }
  };

  // Submit placing order
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showToast('Please select a delivery address.', 'error');
      return;
    }
    if (!contactEmail.trim() || !contactPhone.trim()) {
      showToast('Please enter your email and phone details.', 'error');
      return;
    }
    if (contactPhone.replace('-', '').length < 11) {
      showToast('Please enter a valid 11-digit mobile number (e.g. 03xx-xxxxxxx).', 'error');
      return;
    }
    if (!termsAccepted) {
      showToast('Please read and accept the terms and conditions.', 'error');
      return;
    }
    if (!summary || !summary.cartId) {
      showToast('Invalid cart estimate summary.', 'error');
      return;
    }

    if (selectedPaymentMethod === 'card' && creditCards.length > 0 && !selectedCardId) {
      showToast('Please select a saved card to continue.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const paymentMethodId = selectedPaymentMethod === 'card' ? '1' : '2'; // 1 for card, 2 for COD
      const cardId = selectedPaymentMethod === 'card' ? (selectedCardId ? selectedCardId.toString() : '0') : '0';

      const payload = {
        payment_method_id: paymentMethodId,
        card_id: cardId,
        address_id: selectedAddressId.toString(),
        cart_id: summary.cartId.toString(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.replace('-', ''), // pass pure digit format
        delivery_instructions: deliveryInstructions.trim(),
      };

      const res = await api.post<{ status: boolean; data: any; message?: string }>('/api/v1/checkout', payload);
      
      if (res.status && res.data) {
        // Save success properties returned by DTO
        sessionStorage.setItem('orderConfirmed', JSON.stringify({
          orderId: res.data.order_id,
          orderNumber: res.data.order_number,
          confirmationMessage: res.data.confirmation_message || 'Order placed successfully!',
          paymentId: res.data.payment_id,
        }));
        
        router.push('/checkout/confirmed');
      } else {
        showToast(res.message || 'Order processing failed.', 'error');
      }
    } catch (e: any) {
      console.error(e);
      showToast(e.message || 'Failed to place your order.', 'error');
    } finally {
      setIsSubmitting(false);
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
          <Link href="/cart">Cart</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Checkout</span>
        </div>

        {/* Page title */}
        <div className={styles.pageHead}>
          <div>
            <h1 className={styles.pageTitle}>Confirm Order Details</h1>
          </div>
          <Link href="/cart" className={styles.backCart}>
            <i className="bx bx-left-arrow-alt"></i> Back to Cart
          </Link>
        </div>

        {/* Total Savings Green Banner */}
        {(() => {
          const discount = summary?.discount;
          const hasBackendDiscount = !!(discount && discount.discount_amount > 0);
          if (!hasBackendDiscount) return null;
          
          const savingsText = discount.discount_amount_text || formatPrice(discount.discount_amount);
          const baseMarketPrice = parseNumericPrice(summary?.originalPrice?.totalAmount || 0);
          const shippingText = getSummaryValue('shipping', 0);
          const shippingVal = parseNumericPrice(shippingText);
          const taxText = getSummaryValue('taxes', 0);
          const taxVal = parseNumericPrice(taxText);
          const marketPriceText = formatPrice(baseMarketPrice + shippingVal + taxVal);

          return (
            <div className={styles.savingsBanner} style={{ marginBottom: '24px' }}>
              <i className="bx bx-purchase-tag"></i>
              <div>
                <div className={styles.savingsText}>You&apos;re saving {savingsText}</div>
                <div className={styles.savingsSub}>vs. Avg. Market Price {marketPriceText}</div>
              </div>
            </div>
          );
        })()}

        <div className={styles.checkoutLayout}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Order Review List */}
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <i className="bx bx-receipt"></i> Review Checkout Items
                  </h3>
                </div>
                {checkoutItems.map((item, idx) => {
                  const displayLocation = item.location || item.vendor_location || item.area;
                  const displayPrice = item.package_discounted_price || item.discounted_price || item.price || 'unset';
                  return (
                    <div key={idx} className={styles.revRow}>
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className={styles.revImg}
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=150&q=80';
                        }}
                      />
                      <div className={styles.revInfo}>
                        <h4 className={styles.revName}>{item.name || 'unset'}</h4>
                        <span className={styles.revVendor}>{item.item_name || 'unset'}</span>
                        <div className={styles.revMeta}>
                          {displayLocation && `Location: ${displayLocation} · `}
                          Qty: <strong>{item.quantity}</strong>
                        </div>
                      </div>
                      <div className={styles.revRight}>
                        <span className={styles.revDue}>{formatPrice(parseNumericPrice(displayPrice))}</span>
                        <span className={styles.revDueLbl}>Due today</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Address Selector */}
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <i className="bx bx-map-pin"></i> Select Delivery Address
                  </h3>
                </div>

                <div className={styles.addressList}>
                  {addresses.length === 0 ? (
                    <p style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      No address saved yet. Please add a new delivery address below.
                    </p>
                  ) : (
                    addresses.map((addr) => {
                      const isSelected = selectedAddressId !== null && Number(selectedAddressId) === Number(addr.id);
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(Number(addr.id))}
                          className={`${styles.addressItem} ${isSelected ? styles.addressItemActive : ''}`}
                        >
                          <div className={styles.addrIcon}>
                            <i className="bx bx-home"></i>
                          </div>
                          <div className={styles.addrInfo}>
                            <h4 className={styles.addrName}>{addr.title}</h4>
                            <p className={styles.addrLine}>
                              {addr.address}
                              {addr.address2 && `, ${addr.address2}`}
                              {`, ${addr.city}`}
                            </p>
                            {addr.phone && (
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <i className="bx bx-phone" style={{ fontSize: '12px' }}></i>
                                <span>{addr.phone}</span>
                              </div>
                            )}
                            {addr.isDefault === 1 && (
                              <span className={styles.addrBadge}>Default Address</span>
                            )}
                          </div>
                          <div className={`${styles.addrRadio} ${isSelected ? styles.addrRadioActive : ''}`}>
                            {isSelected && <div className={styles.addrRadioDot}></div>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {!showAddressForm ? (
                  <button onClick={() => setShowAddressForm(true)} className={styles.addAddrBtn}>
                    <i className="bx bx-plus"></i> Add New Address
                  </button>
                ) : (
                  <form onSubmit={handleAddAddress} className={styles.addressForm}>
                    <h4 style={{ fontSize: '13px', fontWeight: 800 }}>Create New Address</h4>
                    
                    <div className={styles.formGroup}>
                      <label>Address Title (e.g. Home, Office)*</label>
                      <input
                        type="text"
                        placeholder="Home"
                        value={newAddressTitle}
                        onChange={(e) => setNewAddressTitle(e.target.value)}
                        className={styles.inputField}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Address Line 1*</label>
                      <input
                        type="text"
                        placeholder="Street, house number, area details"
                        value={newAddressLine1}
                        onChange={(e) => setNewAddressLine1(e.target.value)}
                        className={styles.inputField}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Address Line 2 (Optional)</label>
                      <input
                        type="text"
                        placeholder="Apartment, suite, unit etc."
                        value={newAddressLine2}
                        onChange={(e) => setNewAddressLine2(e.target.value)}
                        className={styles.inputField}
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>City*</label>
                        <input
                          type="text"
                          placeholder="Karachi"
                          value={newAddressCity}
                          onChange={(e) => setNewAddressCity(e.target.value)}
                          className={styles.inputField}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>State / Province</label>
                        <input
                          type="text"
                          placeholder="Sindh"
                          value={newAddressProvince}
                          onChange={(e) => setNewAddressProvince(e.target.value)}
                          className={styles.inputField}
                        />
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Postal Code</label>
                        <input
                          type="text"
                          placeholder="74200"
                          value={newAddressPostal}
                          onChange={(e) => setNewAddressPostal(e.target.value)}
                          className={styles.inputField}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Country*</label>
                        <input
                          type="text"
                          value={newAddressCountry}
                          onChange={(e) => setNewAddressCountry(e.target.value)}
                          className={styles.inputField}
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.formActions}>
                      <button type="button" onClick={() => setShowAddressForm(false)} className={styles.btnCancel}>
                        Cancel
                      </button>
                      <button type="submit" className={styles.btnSave}>
                        Save Address
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Contact Details Form */}
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <i className="bx bx-envelope"></i> Contact Information
                  </h3>
                </div>

                <div className={styles.addressForm} style={{ background: 'none', border: 'none', padding: 0 }}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Contact Email*</label>
                      <input
                        type="email"
                        placeholder="email@example.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className={styles.inputField}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Contact Phone (Format: 03xx-xxxxxxx)*</label>
                      <input
                        type="text"
                        placeholder="0300-1234567"
                        value={contactPhone}
                        onChange={handlePhoneChange}
                        className={styles.inputField}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Options Selector */}
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <i className="bx bx-credit-card"></i> Payment Method
                  </h3>
                </div>

                <div className={styles.paymentList}>
                  {/* MasterCard option */}
                  <div
                    onClick={() => setSelectedPaymentMethod('card')}
                    className={`${styles.payOptionRow} ${selectedPaymentMethod === 'card' ? styles.payOptionRowActive : ''}`}
                  >
                    <div className={`${styles.payLogo} ${styles.payLogoMaster}`}>Card</div>
                    <div className={styles.payOptionInfo}>
                      <h4 className={styles.payOptionName}>Mastercard / Visa Credit Card</h4>
                      <p className={styles.payOptionSub}>Pay securely with card credit lines</p>
                    </div>
                    <div className={`${styles.radioCircle} ${selectedPaymentMethod === 'card' ? styles.radioCircleSelected : ''}`}>
                      {selectedPaymentMethod === 'card' && <div className={styles.radioDot}></div>}
                    </div>
                  </div>

                  {selectedPaymentMethod === 'card' && (
                    <div className={styles.cardListSection} style={{ marginTop: '4px', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '2px', color: 'var(--text-secondary)' }}>Saved Cards</h4>
                      {creditCards.length === 0 ? (
                        <p style={{ fontStyle: 'italic', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          No saved credit cards found.
                        </p>
                      ) : (
                        creditCards.map((card) => {
                          const isCardSelected = selectedCardId !== null && Number(selectedCardId) === Number(card.id);
                          const isVisa = card.credit_card_type?.toLowerCase().includes('visa');
                          return (
                            <div
                              key={card.id}
                              onClick={() => setSelectedCardId(Number(card.id))}
                              className={`${styles.payOptionRow} ${isCardSelected ? styles.payOptionRowActive : ''}`}
                              style={{ padding: '12px', borderRadius: '8px' }}
                            >
                              <div className={`${styles.payLogo} ${isVisa ? styles.payLogoVisa : styles.payLogoMaster}`} style={{ fontSize: '9px', width: '38px', height: '24px' }}>
                                {isVisa ? 'Visa' : 'MC'}
                              </div>
                              <div className={styles.payOptionInfo}>
                                <h4 className={styles.payOptionName} style={{ fontSize: '12px' }}>{card.card_name || 'Credit Card'}</h4>
                                <p className={styles.payOptionSub} style={{ fontSize: '10px' }}>
                                  •••• •••• •••• {card.last_digits || 'xxxx'}
                                </p>
                              </div>
                              {card.is_default === 1 && (
                                <span className={styles.payDefaultBadge} style={{ marginRight: '10px', fontSize: '9px', padding: '1px 6px' }}>Default</span>
                              )}
                              <div className={`${styles.radioCircle} ${isCardSelected ? styles.radioCircleSelected : ''}`} style={{ width: '16px', height: '16px' }}>
                                {isCardSelected && <div className={styles.radioDot} style={{ width: '7px', height: '7px' }}></div>}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Cash on Delivery option */}
                  <div
                    onClick={() => setSelectedPaymentMethod('cod')}
                    className={`${styles.payOptionRow} ${selectedPaymentMethod === 'cod' ? styles.payOptionRowActive : ''}`}
                  >
                    <div className={`${styles.payLogo} ${styles.payLogoCod}`}>
                      <i className="bx bx-money"></i>
                    </div>
                    <div className={styles.payOptionInfo}>
                      <h4 className={styles.payOptionName}>Cash on Delivery (COD)</h4>
                      <p className={styles.payOptionSub}>Pay cash at the event date confirmation</p>
                    </div>
                    <div className={`${styles.radioCircle} ${selectedPaymentMethod === 'cod' ? styles.radioCircleSelected : ''}`}>
                      {selectedPaymentMethod === 'cod' && <div className={styles.radioDot}></div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <i className="bx bx-message-detail"></i> Special Instructions (Optional)
                  </h3>
                </div>
                <textarea
                  placeholder="E.g., Event starting times, delivery instructions, color details, etc."
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  className={styles.textareaField}
                />
                
                {/* Terms Acceptance check */}
                <label className={styles.termsRow}>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <span>
                    I confirm that the event specifics are correct and I accept the{' '}
                    <Link href="/terms" target="_blank">Terms &amp; Booking Policies</Link> of Tayaree.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Checkout Sticky Sidebar */}
          <div className={styles.sidebarSticky}>
            <div className={styles.bookingCard}>
              <div className={styles.sidebarHead}>
                <span className={styles.shEyebrow}>Checkout Summary</span>
                <h2 className={styles.shTitle}>Order Total</h2>
                {summary && (
                  <div className={styles.shTotalRow}>
                    <span className={styles.shTotalLbl}>Final Net Due:</span>
                    <span className={styles.shTotalVal}>
                      {summary.summary.find(s => s.labelInfo.toLowerCase().includes('net') || s.labelInfo.toLowerCase().includes('total'))?.labelValue || summary.originalPrice.totalAmount}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.priceBreakdown}>
                {summary?.summary.map((row, idx) => {
                  const isTotal = row.labelInfo.toLowerCase().includes('net') || row.labelInfo.toLowerCase().includes('total');
                  return (
                    <div key={idx} className={`${styles.priceRow} ${isTotal ? styles.priceRowTotal : ''}`}>
                      <span>{row.labelInfo}</span>
                      <span className={`${styles.priceVal} ${isTotal ? styles.priceValTotal : ''}`}>
                        {row.labelValue}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Interactive Breakdown Menus */}
              <div className={styles.checkoutMenuRows}>
                <button
                  type="button"
                  onClick={() => setIsShippingDrawerOpen(true)}
                  className={styles.checkoutMenuRow}
                >
                  <div className={styles.menuRowIcon}><i className="bx bx-package"></i></div>
                  <span className={styles.menuRowLabel}>View Shipping Charges</span>
                  <i className="bx bx-chevron-right menuRowChev"></i>
                </button>
                <button
                  type="button"
                  onClick={() => setIsTaxesDrawerOpen(true)}
                  className={styles.checkoutMenuRow}
                >
                  <div className={styles.menuRowIcon}><i className="bx bx-receipt"></i></div>
                  <span className={styles.menuRowLabel}>View Taxes (SST 16%)</span>
                  <i className="bx bx-chevron-right menuRowChev"></i>
                </button>
              </div>

              <div className={styles.ctaSection}>
                <button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting || !termsAccepted || !selectedAddressId}
                  className={styles.btnConfirm}
                >
                  {isSubmitting ? (
                    <>
                      <i className="bx bx-loader-alt bx-spin"></i> Processing...
                    </>
                  ) : (
                    <>
                      Place Order <i className="bx bx-check-shield"></i>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ══ DELIVERY DETAILS (grouped by date) ══ */}
        {deliveryGroups.length > 0 && (
          <div className={styles.sectionBlock} style={{ maxWidth: 'calc(100% - 404px)' }}>
            <div className={styles.sectionBlockTitle}>
              <i className="bx bx-map"></i>
              <span>Delivery Details</span>
            </div>
            <div className={styles.sectionBlockSub}>
              When each package &amp; its items arrive — grouped by delivery date
            </div>

            {deliveryGroups.map((group, gIdx) => (
              <React.Fragment key={gIdx}>
                <div className={styles.ddDateHead}>
                  <i className="bx bx-calendar"></i>
                  <span>
                    {(() => {
                      const heading = group.heading || '';
                      const clean = heading.replace(/^(delivery|booking)(\s+date)?\s*:\s*/i, '').replace(/^(delivery|booking)(\s+date)?\s*:\s*/i, '').trim();
                      const isBooking = heading.toLowerCase().includes('booking');
                      return `${isBooking ? 'Booking Date' : 'Delivery Date'}: ${clean}`;
                    })()}
                  </span>
                </div>
                {group.body?.map((pkg: any, pIdx: any) => (
                  <div key={pIdx} className={styles.ddPkgCard}>
                    <div className={styles.ddPkgHead}>
                      <img
                        className={styles.ddPkgImg}
                        src={pkg.imageUrl || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=120&h=120&q=80'}
                        alt={pkg.packageName || pkg.itemName}
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=120&h=120&q=80';
                        }}
                      />
                      <div className={styles.ddPkgInfo}>
                        <div className={styles.ddPkgName}>{pkg.packageName || pkg.itemName || 'unset'}</div>
                        <div className={styles.ddPkgVendor}>{pkg.vendorName || 'unset'}</div>
                        <div className={styles.ddPkgMeta}>
                          <i className="bx bx-package"></i>
                          <span>{pkg.quantity} items &middot; {pkg.itemDescription || 'unset'}</span>
                        </div>
                      </div>
                      <span className={`${styles.ddStatus} ${pkg.status?.toLowerCase().includes('pending') ? styles.ddStatusPending : styles.ddStatusBooked}`}>
                        <i className={pkg.status?.toLowerCase().includes('pending') ? 'bx bx-time-five' : 'bx bx-check-circle'}></i>
                        {pkg.status || 'Booked'}
                      </span>
                    </div>

                    {(() => {
                      const itemsInThisGroup = pkg.images ? pkg.images.length : 0;
                      const totalItems = getPackageTotalItemsCount(pkg.packageName || pkg.itemName || '');
                      const isPartial = totalItems > itemsInThisGroup;
                      const isAllTogether = !isPartial && itemsInThisGroup > 1 && (pkg.deliverAs || '').toLowerCase() === 'package';
                      
                      const isBooking = (pkg.packageName || pkg.itemName || '').toLowerCase().includes('booking') || (pkg.itemType || '').toLowerCase().includes('book');

                      if (isAllTogether) {
                        return (
                          <div className={`${styles.ddNote} ${styles.ddNoteTogether}`}>
                            <i className="bx bx-check-circle"></i>
                            <span>
                              {isBooking
                                ? `All ${itemsInThisGroup} items will be booked for the same day`
                                : `All ${itemsInThisGroup} items will arrive on the same date`}
                            </span>
                          </div>
                        );
                      } else if (isPartial) {
                        const separate = totalItems - itemsInThisGroup;
                        const shipsCopy = separate === 1 ? '1 item ships separately' : `${separate} items ship separately`;
                        const bookedCopy = separate === 1 ? '1 item booked separately' : `${separate} items booked separately`;
                        return (
                          <div className={`${styles.ddNote} ${styles.ddNotePartial}`}>
                            <i className="bx bx-info-circle"></i>
                            <span>
                              {isBooking
                                ? `${itemsInThisGroup} of ${totalItems} items booked · ${bookedCopy}`
                                : `${itemsInThisGroup} of ${totalItems} items arriving · ${shipsCopy}`}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {pkg.images && pkg.images.length > 0 && (
                      <div className={styles.ddItems}>
                        {pkg.images.map((sub: any, sIdx: number) => (
                          <div key={sIdx} className={`${styles.ddItem} ${sub.duration?.toLowerCase().includes('later') ? styles.ddItemLater : ''}`}>
                            <img
                              src={sub.image || 'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?auto=format&fit=crop&w=120&h=120&q=80'}
                              alt={sub.name}
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?auto=format&fit=crop&w=120&h=120&q=80';
                              }}
                            />
                            <div className={styles.ddItemName}>{sub.name || 'unset'}</div>
                            <div className={`${styles.ddItemVar} ${sub.duration?.toLowerCase().includes('later') ? styles.ddItemVarMuted : ''}`}>
                              {sub.color || sub.size || sub.duration || 'Standard'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        )}
      </main>

      {/* Shipping Details Drawer */}
      {isShippingDrawerOpen && (
        <>
          <div className={styles.drawerOverlay} onClick={() => setIsShippingDrawerOpen(false)} />
          <div className={`${styles.drawerPanel} ${isShippingDrawerOpen ? styles.drawerPanelOpen : ''}`}>
            <div className={styles.dwHead}>
              <div>
                <h3 className={styles.dwHeadTitle}>Shipping Details</h3>
                <p className={styles.dwHeadSub}>Delivery &amp; logistics charges across your event cart</p>
              </div>
              <button className={styles.drawerXClose} onClick={() => setIsShippingDrawerOpen(false)}>
                <i className="bx bx-x"></i>
              </button>
            </div>
            <div className={styles.dwBody}>
              {shippingDetails ? (
                <>
                  {/* Package Selection Horizontal circle list */}
                  {shippingDetails.packages.length > 0 && (
                    <div className={styles.pkgSelectionCard}>
                      <div className={styles.pkgCarousel}>
                        {shippingDetails.packages.map((pkg) => {
                          const isSelected = selectedShippingPackageIds.includes(pkg.id);
                          return (
                            <div
                              key={pkg.id}
                              className={`${styles.pkgItem} ${isSelected ? styles.pkgItemActive : ''}`}
                              onClick={() => {
                                let newIds = [...selectedShippingPackageIds];
                                if (newIds.includes(pkg.id)) {
                                  if (newIds.length > 1) {
                                    newIds = newIds.filter(id => id !== pkg.id);
                                  }
                                } else {
                                  newIds.push(pkg.id);
                                }
                                setSelectedShippingPackageIds(newIds);
                                handleShippingSelectionChange(newIds);
                              }}
                            >
                              <div className={styles.pkgImgWrapper}>
                                <img
                                  src={pkg.image || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=120&h=120&q=80'}
                                  alt={pkg.name}
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=120&h=120&q=80';
                                  }}
                                />
                                {isSelected && (
                                  <div className={styles.pkgCheckBadge}>
                                    <i className="bx bx-check"></i>
                                  </div>
                                )}
                              </div>
                              <span className={styles.pkgCellName}>{pkg.name || 'unset'}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className={styles.pkgSelectAllRow}>
                        <span>Select All Packages</span>
                        <label className={styles.pkgSwitch}>
                          <input
                            type="checkbox"
                            checked={selectedShippingPackageIds.length === shippingDetails.packages.length}
                            onChange={(e) => {
                              let newIds: number[] = [];
                              if (e.target.checked) {
                                newIds = shippingDetails.packages.map(p => p.id);
                              } else {
                                newIds = shippingDetails.packages.length > 0 ? [shippingDetails.packages[0].id] : [];
                              }
                              setSelectedShippingPackageIds(newIds);
                              handleShippingSelectionChange(newIds);
                            }}
                          />
                          <span className={styles.pkgSlider}></span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className={styles.dwTotalBanner}>
                    <div className={styles.dwtLbl}>Total Shipping</div>
                    <div className={styles.dwtVal}>{formatPrice(shippingDetails.total_shipping)}</div>
                    <p className={styles.dwtNote}>Rates are set by vendors. If shipping is included in the package price, it appears as zero.</p>
                  </div>

                  <div className={styles.dwSecTitle}>
                    <i className="bx bx-package"></i> Shipping Charges by Item 
                    <span className={styles.count}> {shippingDetails.items.length} items</span>
                  </div>

                  <div className={styles.dwPkgTable}>
                    {shippingDetails.items.map((item, idx) => {
                      const parentPkg = shippingDetails.packages.find(
                        (p) => p.name.trim().toLowerCase() === item.packageName.trim().toLowerCase()
                      );
                      return (
                        <div key={idx} className={styles.dwPkgRow}>
                          <img 
                            className={styles.dwPkgImg} 
                            src={parentPkg?.image || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=120&h=120&q=80'} 
                            alt={item.name} 
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=120&h=120&q=80';
                            }}
                          />
                          <div className={styles.dwPkgInfo}>
                            <div className={styles.dwPkgName}>{item.name || 'unset'}</div>
                            <div className={styles.dwPkgSub}>{item.packageName || 'unset'}</div>
                          </div>
                          <div className={styles.dwPkgVal}>
                            {item.shipping > 0 ? formatPrice(item.shipping) : 'FREE'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '30px', color: 'var(--primary)' }}></i>
                  <p style={{ marginTop: '10px' }}>Loading shipping details...</p>
                </div>
              )}
            </div>
            <div className={styles.drawerDoneFooter}>
              <button className={styles.drawerDoneBtn} onClick={() => setIsShippingDrawerOpen(false)}>Done</button>
            </div>
          </div>
        </>
      )}

      {/* Taxes Breakdown Drawer */}
      {isTaxesDrawerOpen && (
        <>
          <div className={styles.drawerOverlay} onClick={() => setIsTaxesDrawerOpen(false)} />
          <div className={`${styles.drawerPanel} ${isTaxesDrawerOpen ? styles.drawerPanelOpen : ''}`}>
            <div className={styles.dwHead}>
              <div>
                <h3 className={styles.dwHeadTitle}>Taxes Breakdown</h3>
                <p className={styles.dwHeadSub}>Government taxes (SST 16%) across your event cart</p>
              </div>
              <button className={styles.drawerXClose} onClick={() => setIsTaxesDrawerOpen(false)}>
                <i className="bx bx-x"></i>
              </button>
            </div>
            <div className={styles.dwBody}>
              {taxesDetails ? (
                <>
                  {/* Package Selection Horizontal circle list */}
                  {taxesDetails.packages.length > 0 && (
                    <div className={styles.pkgSelectionCard}>
                      <div className={styles.pkgCarousel}>
                        {taxesDetails.packages.map((pkg) => {
                          const isSelected = selectedTaxesPackageIds.includes(pkg.id);
                          return (
                            <div
                              key={pkg.id}
                              className={`${styles.pkgItem} ${isSelected ? styles.pkgItemActive : ''}`}
                              onClick={() => {
                                let newIds = [...selectedTaxesPackageIds];
                                if (newIds.includes(pkg.id)) {
                                  if (newIds.length > 1) {
                                    newIds = newIds.filter(id => id !== pkg.id);
                                  }
                                } else {
                                  newIds.push(pkg.id);
                                }
                                setSelectedTaxesPackageIds(newIds);
                                handleTaxesSelectionChange(newIds);
                              }}
                            >
                              <div className={styles.pkgImgWrapper}>
                                <img
                                  src={pkg.image || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=120&h=120&q=80'}
                                  alt={pkg.name}
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=120&h=120&q=80';
                                  }}
                                />
                                {isSelected && (
                                  <div className={styles.pkgCheckBadge}>
                                    <i className="bx bx-check"></i>
                                  </div>
                                )}
                              </div>
                              <span className={styles.pkgCellName}>{pkg.name || 'unset'}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className={styles.pkgSelectAllRow}>
                        <span>Select All Packages</span>
                        <label className={styles.pkgSwitch}>
                          <input
                            type="checkbox"
                            checked={selectedTaxesPackageIds.length === taxesDetails.packages.length}
                            onChange={(e) => {
                              let newIds: number[] = [];
                              if (e.target.checked) {
                                newIds = taxesDetails.packages.map(p => p.id);
                              } else {
                                newIds = taxesDetails.packages.length > 0 ? [taxesDetails.packages[0].id] : [];
                              }
                              setSelectedTaxesPackageIds(newIds);
                              handleTaxesSelectionChange(newIds);
                            }}
                          />
                          <span className={styles.pkgSlider}></span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className={styles.dwTotalBanner}>
                    <div className={styles.dwtLbl}>Total Taxes</div>
                    <div className={styles.dwtVal}>{formatPrice(taxesDetails.total_taxes)}</div>
                    <p className={styles.dwtNote}>Based on government rates (SST 16%). Shows as zero if the vendor absorbs the tax.</p>
                  </div>

                  <div className={styles.dwSecTitle}>
                    <i className="bx bx-receipt"></i> Taxes by Item 
                    <span className={styles.count}> {taxesDetails.items.length} items</span>
                  </div>

                  <div className={styles.dwPkgTable}>
                    {taxesDetails.items.map((item, idx) => {
                      const parentPkg = taxesDetails.packages.find(
                        (p) => p.name.trim().toLowerCase() === item.packageName.trim().toLowerCase()
                      );
                      return (
                        <div key={idx} className={styles.dwPkgRow}>
                          <img 
                            className={styles.dwPkgImg} 
                            src={parentPkg?.image || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=120&h=120&q=80'} 
                            alt={item.name} 
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=120&h=120&q=80';
                            }}
                          />
                          <div className={styles.dwPkgInfo}>
                            <div className={styles.dwPkgName}>{item.name || 'unset'}</div>
                            <div className={styles.dwPkgSub}>
                              {item.packageName ? `${item.packageName} · ` : ''}SST {item.percentage ? `${item.percentage}%` : '16%'}
                            </div>
                          </div>
                          <div className={styles.dwPkgVal}>
                            {item.taxes > 0 ? formatPrice(item.taxes) : '0% (Absorbed)'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '30px', color: 'var(--primary)' }}></i>
                  <p style={{ marginTop: '10px' }}>Loading taxes breakdown...</p>
                </div>
              )}
            </div>
            <div className={styles.drawerDoneFooter}>
              <button className={styles.drawerDoneBtn} onClick={() => setIsTaxesDrawerOpen(false)}>Done</button>
            </div>
          </div>
        </>
      )}

      <Footer />
    </>
  );
}
