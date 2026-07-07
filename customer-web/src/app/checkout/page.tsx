'use client';

import React, { useState, useEffect } from 'react';
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
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  
  // Checkout selections states
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'cod'>('cod');
  
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

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/checkout');
      return;
    }

    const email = localStorage.getItem('userEmail') || '';
    setContactEmail(email);

    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      // 1. Get checkout delivery items
      const checkoutRes = await api.get<{ status: boolean; data: any[] }>('/api/v1/checkout/items')
        .catch(() => ({ status: false, data: [] }));
      
      let items = checkoutRes.data || [];
      // Fallback to active cart list if checkout/items is empty
      if (items.length === 0) {
        const cartListRes = await api.get<{ status: boolean; data: any[] }>('/api/v1/cart/items/list')
          .catch(() => ({ status: false, data: [] }));
        items = cartListRes.data || [];
      }
      setCheckoutItems(items);

      if (items.length === 0) {
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
        setSummary({
          originalPrice: {
            totalAmount: summaryRes.original_price?.total_amount || summaryRes.original_price?.totalAmount || '0',
          },
          summary: (summaryRes.summary || []).map((s: any) => ({
            labelInfo: s.label_info || s.labelInfo || 'unset',
            labelValue: s.label_value || s.labelValue || '0',
          })),
          cartId: summaryRes.cart_id || summaryRes.cartId || 0,
        });
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load checkout details.', 'error');
    }
  };

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

    try {
      setIsSubmitting(true);
      
      const paymentMethodId = selectedPaymentMethod === 'card' ? '1' : '2'; // 1 for card, 2 for COD
      const cardId = selectedPaymentMethod === 'card' ? '1' : '0'; // MasterCard mock

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
                        <span className={styles.revDue}>{displayPrice}</span>
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
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
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
      </main>

      <Footer />
    </>
  );
}
