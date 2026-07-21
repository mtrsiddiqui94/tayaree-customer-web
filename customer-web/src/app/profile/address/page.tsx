'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import styles from './page.module.css';

interface Address {
  id: number;
  title: string;
  address: string;
  address2?: string;
  isDefault: number;
  isActive: number;
  city: string;
  province?: string;
  postalCode?: string;
  country: string;
  lat?: string;
  lng?: string;
}

export default function AddressBookPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Drawer modal states
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('add');
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  
  // Drawer form fields
  const [addrTitle, setAddrTitle] = useState('');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrProvince, setAddrProvince] = useState('');
  const [addrPostal, setAddrPostal] = useState('');
  const [addrCountry, setAddrCountry] = useState('Pakistan');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [addrType, setAddrType] = useState<'Home' | 'Office' | 'Other'>('Home');

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  interface AddressResponse {
    id: number;
    title?: string;
    address?: string;
    address_2?: string;
    address2?: string;
    is_default?: number;
    isDefault?: number;
    is_active?: number;
    isActive?: number;
    city?: string;
    province?: string;
    postal_code?: string;
    postalCode?: string;
    country?: string;
    lat?: string;
    lng?: string;
  }

  const loadAddresses = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ status: boolean; data: AddressResponse[] }>('/api/v1/address/list');
      if (res.status && res.data) {
        const parsed: Address[] = res.data.map((addr) => ({
          id: addr.id,
          title: addr.title || 'unset',
          address: addr.address || 'unset',
          address2: addr.address_2 || addr.address2 || '',
          isDefault: addr.is_default || addr.isDefault || 0,
          isActive: addr.is_active || addr.isActive || 1,
          city: addr.city || 'unset',
          province: addr.province || '',
          postalCode: addr.postal_code || addr.postalCode || '',
          country: addr.country || 'Pakistan',
          lat: addr.lat || '33.6844',
          lng: addr.lng || '73.0479',
        }));
        setAddresses(parsed);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load addresses.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/profile/address');
      return;
    }

    const timer = setTimeout(() => {
      loadAddresses();
    }, 0);
    return () => clearTimeout(timer);
  }, [router]);



  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await api.delete<{ status: boolean; message?: string }>(`/api/v1/address/${id}`);
      if (res.status) {
        showToast(res.message || 'Address deleted successfully.');
        setAddresses(prev => prev.filter(a => a.id !== id));
      }
    } catch (e) {
      showToast('Failed to delete address.', 'error');
    }
  };

  const handleSetDefault = async (addr: Address) => {
    try {
      showToast('Updating default address...', 'info');
      const res = await api.put<{ status: boolean; message?: string }>('/api/v1/address/update', {
        id: addr.id.toString(),
        title: addr.title,
        address: addr.address,
        address_2: addr.address2 || '',
        lat: addr.lat || '33.6844',
        lng: addr.lng || '73.0479',
        is_default: '1',
        is_active: addr.isActive.toString(),
        street: addr.address,
        city: addr.city,
        province: addr.province || '',
        province_short_code: (addr.province || '').slice(0, 2).toUpperCase(),
        postal_code: addr.postalCode || '',
        country: addr.country,
      });

      if (res.status) {
        showToast('Default address updated.');
        loadAddresses();
      }
    } catch (e) {
      showToast('Failed to set default address.', 'error');
    }
  };

  const openDrawerPanel = (mode: 'add' | 'edit', addr?: Address) => {
    setDrawerMode(mode);
    if (mode === 'edit' && addr) {
      setEditingAddressId(addr.id);
      setAddrTitle(addr.title);
      setAddrLine1(addr.address);
      setAddrLine2(addr.address2 || '');
      setAddrCity(addr.city);
      setAddrProvince(addr.province || '');
      setAddrPostal(addr.postalCode || '');
      setAddrCountry(addr.country);
      setAddrIsDefault(addr.isDefault === 1);
      
      const titleLower = addr.title.toLowerCase();
      if (titleLower.includes('home')) setAddrType('Home');
      else if (titleLower.includes('office') || titleLower.includes('work')) setAddrType('Office');
      else setAddrType('Other');
    } else {
      setEditingAddressId(null);
      setAddrTitle('Home');
      setAddrLine1('');
      setAddrLine2('');
      setAddrCity('');
      setAddrProvince('');
      setAddrPostal('');
      setAddrCountry('Pakistan');
      setAddrIsDefault(addresses.length === 0);
      setAddrType('Home');
    }
    setShowDrawer(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrTitle || !addrLine1 || !addrCity) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        title: addrTitle,
        address: addrLine1,
        address_2: addrLine2,
        lat: '33.6844',
        lng: '73.0479',
        is_default: addrIsDefault ? '1' : '0',
        is_active: '1',
        street: addrLine1,
        city: addrCity,
        province: addrProvince,
        province_short_code: addrProvince.slice(0, 2).toUpperCase(),
        postal_code: addrPostal,
        country: addrCountry,
      };

      let res;
      if (drawerMode === 'edit' && editingAddressId) {
        res = await api.put<{ status: boolean; message?: string }>('/api/v1/address/update', {
          id: editingAddressId.toString(),
          ...payload,
        });
      } else {
        res = await api.post<{ status: boolean; message?: string }>('/api/v1/address/store', payload);
      }

      if (res.status) {
        showToast(res.message || 'Address saved successfully.');
        setShowDrawer(false);
        loadAddresses();
      } else {
        showToast(res.message || 'Failed to save address details.', 'error');
      }
    } catch (e) {
      showToast('Error saving address details.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout breadcrumbTitle="Address Book">
      <>
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

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '32px', color: 'var(--primary)' }}></i>
          <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>Loading address book...</p>
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}>
                <i className="bx bx-map"></i>Saved Addresses
              </h3>
              <button onClick={() => openDrawerPanel('add')} className={styles.addLink}>
                <i className="bx bx-plus"></i>Add New Address
              </button>
            </div>

            <div className={styles.addrList}>
              {addresses.length === 0 ? (
                <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  No saved addresses found. Add a shipping address to get started.
                </div>
              ) : (
                addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`${styles.addrItem} ${addr.isDefault === 1 ? styles.default : ''}`}
                  >
                    <div className={styles.addrIc}>
                      <i className={addr.title.toLowerCase().includes('office') ? 'bx bx-briefcase' : 'bx bx-home-alt'}></i>
                    </div>
                    <div className={styles.addrBody}>
                      <div className={styles.addrTop}>
                        <div className={styles.addrName}>
                          {addr.title}
                          {addr.isDefault === 1 && (
                            <span className={styles.addrBadge}>Default</span>
                          )}
                          <span className={styles.addrStatus + ' ' + styles.verified}>
                            <i className="bx bxs-check-circle"></i> Vetted
                          </span>
                        </div>
                        <div className={styles.addrActions}>
                          <button onClick={() => openDrawerPanel('edit', addr)} className={styles.addrAct}>
                            <i className="bx bx-edit"></i> Edit
                          </button>
                          <button onClick={() => handleDeleteAddress(addr.id)} className={`${styles.addrAct} ${styles.danger}`}>
                            <i className="bx bx-trash"></i> Delete
                          </button>
                        </div>
                      </div>
                      <div className={styles.addrLine}>
                        {addr.address}
                        {addr.address2 && `, ${addr.address2}`}
                        <br />
                        {addr.city}
                        {addr.province && `, ${addr.province}`}
                        {addr.postalCode && ` ${addr.postalCode}`}
                        {`, ${addr.country}`}
                      </div>
                      {addr.isDefault !== 1 && (
                        <div className={styles.addrFoot}>
                          <button onClick={() => handleSetDefault(addr)} className={styles.setDefault}>
                            <i className="bx bx-check-square"></i> Set as Default Address
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Drawer Overlay & Panel */}
      <div className={`${styles.drawerOverlay} ${showDrawer ? styles.open : ''}`}>
        <div className={styles.drawerPanel}>
          <div className={styles.dwHead}>
            <div>
              <span className={styles.dwEyebrow}>Address Manager</span>
              <h3 className={styles.dwTitle}>
                {drawerMode === 'add' ? 'Add New Address' : 'Edit Address Details'}
              </h3>
            </div>
            <button onClick={() => setShowDrawer(false)} className={styles.dwClose}>
              <i className="bx bx-x"></i>
            </button>
          </div>

          <div className={styles.dwBody}>
            <form onSubmit={handleSaveAddress} noValidate>
              <div className={styles.fld}>
                <label className={styles.fldLbl}>Address Tag (e.g. Home, Work)*</label>
                <div className={styles.typeChips}>
                  <button
                    type="button"
                    className={`${styles.typeChip} ${addrType === 'Home' ? styles.active : ''}`}
                    onClick={() => {
                      setAddrType('Home');
                      setAddrTitle('Home');
                    }}
                  >
                    <i className="bx bx-home-alt"></i> Home
                  </button>
                  <button
                    type="button"
                    className={`${styles.typeChip} ${addrType === 'Office' ? styles.active : ''}`}
                    onClick={() => {
                      setAddrType('Office');
                      setAddrTitle('Office');
                    }}
                  >
                    <i className="bx bx-briefcase"></i> Office
                  </button>
                  <button
                    type="button"
                    className={`${styles.typeChip} ${addrType === 'Other' ? styles.active : ''}`}
                    onClick={() => {
                      setAddrType('Other');
                      setAddrTitle('');
                    }}
                  >
                    <i className="bx bx-map-pin"></i> Other
                  </button>
                </div>
              </div>

              {addrType === 'Other' && (
                <div className={styles.fld}>
                  <label className={styles.fldLbl}>Custom Label Name*</label>
                  <input
                    type="text"
                    value={addrTitle}
                    onChange={(e) => setAddrTitle(e.target.value)}
                    className={styles.fldInput}
                    placeholder="e.g. Guest House"
                    required
                  />
                </div>
              )}

              {/* Map visual mock */}
              <div className={styles.addrMap}>
                <div className={styles.mapHint}>
                  <i className="bx bx-info-circle"></i> Drag map to set location
                </div>
                <div className={styles.addrMapPin}>
                  <i className="bx bxs-map"></i>
                </div>
                {/* Visual grid bg replicating static HTML mockup */}
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(#f0ede5 50%, #e5e2d9 50%)', backgroundSize: '20px 20px', opacity: 0.8 }}></div>
              </div>

              <div className={styles.fld}>
                <label className={styles.fldLbl}>Street Address / Line 1*</label>
                <input
                  type="text"
                  value={addrLine1}
                  onChange={(e) => setAddrLine1(e.target.value)}
                  className={styles.fldInput}
                  placeholder="e.g. Street 4, Sector F-6"
                  required
                />
              </div>

              <div className={styles.fld}>
                <label className={styles.fldLbl}>Apartment, Suite, Unit # (Optional)</label>
                <input
                  type="text"
                  value={addrLine2}
                  onChange={(e) => setAddrLine2(e.target.value)}
                  className={styles.fldInput}
                  placeholder="e.g. House 12-A"
                />
              </div>

              <div className={styles.fld + ' ' + styles.row2}>
                <div>
                  <label className={styles.fldLbl}>City*</label>
                  <input
                    type="text"
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    className={styles.fldInput}
                    placeholder="Islamabad"
                    required
                  />
                </div>
                <div>
                  <label className={styles.fldLbl}>State / Province</label>
                  <input
                    type="text"
                    value={addrProvince}
                    onChange={(e) => setAddrProvince(e.target.value)}
                    className={styles.fldInput}
                    placeholder="Federal Capital"
                  />
                </div>
              </div>

              <div className={styles.fld + ' ' + styles.row2}>
                <div>
                  <label className={styles.fldLbl}>Postal Code</label>
                  <input
                    type="text"
                    value={addrPostal}
                    onChange={(e) => setAddrPostal(e.target.value)}
                    className={styles.fldInput}
                    placeholder="44000"
                  />
                </div>
                <div>
                  <label className={styles.fldLbl}>Country*</label>
                  <input
                    type="text"
                    value={addrCountry}
                    onChange={(e) => setAddrCountry(e.target.value)}
                    className={styles.fldInput}
                    required
                  />
                </div>
              </div>

              <div className={styles.fld}>
                <label className={styles.setDefRow}>
                  <input
                    type="checkbox"
                    checked={addrIsDefault}
                    onChange={(e) => setAddrIsDefault(e.target.checked)}
                  />
                  <span>Set as default shipping address</span>
                </label>
              </div>

              <button type="submit" disabled={isSaving} className={styles.dwSave}>
                {isSaving ? (
                  <>
                    <i className="bx bx-loader-alt bx-spin"></i> Saving Address...
                  </>
                ) : (
                  <>
                    <i className="bx bx-check"></i> Save Address Details
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className={styles.btnOutline2}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  </DashboardLayout>
  );
}
