'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from './profile.module.css';

interface Profile {
  fullName: string;
  email: string;
  phone: string;
  phoneCountry: string;
  gender: string;
  imageUrl: string;
  dateOfBirth: string;
  isEmailVerified: boolean;
  isNotification: boolean;
}

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
}

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'password'>('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  
  // Profile editing fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('male');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // Password editing fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Address modal states
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addrTitle, setAddrTitle] = useState('');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrProvince, setAddrProvince] = useState('');
  const [addrPostal, setAddrPostal] = useState('');
  const [addrCountry, setAddrCountry] = useState('Pakistan');
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/profile');
      return;
    }

    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);

      // 1. Fetch profile info
      const profRes = await api.get<{ status: boolean; data: any }>('/api/v1/profile/me');
      if (profRes.status && profRes.data) {
        const raw = profRes.data;
        const parsedProfile: Profile = {
          fullName: raw.full_name || 'unset',
          email: raw.email || 'unset',
          phone: raw.phone || 'unset',
          phoneCountry: raw.phone_country || 'PK',
          gender: raw.gender || 'male',
          imageUrl: raw.image_url || '',
          dateOfBirth: raw.date_of_birth || '',
          isEmailVerified: raw.is_email_verified === 1 || raw.isEmailVerified === true,
          isNotification: raw.is_notification === 1 || raw.isNotification === true,
        };
        setProfile(parsedProfile);
        
        // Populate inputs
        setFullName(parsedProfile.fullName === 'unset' ? '' : parsedProfile.fullName);
        setEmail(parsedProfile.email === 'unset' ? '' : parsedProfile.email);
        setGender(parsedProfile.gender);
        setDateOfBirth(parsedProfile.dateOfBirth);
        
        // format phone mask
        const rawPhone = parsedProfile.phone.replace(/[^0-9]/g, '');
        if (rawPhone.length > 4) {
          setPhone(`${rawPhone.slice(0, 4)}-${rawPhone.slice(4, 11)}`);
        } else {
          setPhone(rawPhone);
        }
      }

      // 2. Fetch address book
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

    } catch (e) {
      console.error(e);
      showToast('Failed to load profile settings.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Phone number mask formatter (03xx-xxxxxxx)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    let formatted = rawVal;
    if (rawVal.length > 4) {
      formatted = `${rawVal.slice(0, 4)}-${rawVal.slice(4, 11)}`;
    }
    setPhone(formatted.slice(0, 12));
  };

  // Update profile handler
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      showToast('Please fill out all fields.', 'error');
      return;
    }
    if (phone.replace('-', '').length < 11) {
      showToast('Please enter a valid 11-digit mobile number.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const res = await api.put<{ status: boolean; data: any; message?: string }>('/api/v1/profile/update', {
        full_name: fullName.trim(),
        phone: phone.replace('-', ''),
        phone_country: profile?.phoneCountry || 'PK',
        email: email.trim(),
        gender: gender.toLowerCase(),
        date_of_birth: dateOfBirth || '01-01-2000', // default fallback dateOfBirth parameter
      });

      if (res.status) {
        showToast(res.message || 'Profile settings updated successfully!');
        loadProfileData();
      } else {
        showToast(res.message || 'Profile update failed.', 'error');
      }
    } catch (e) {
      showToast('Error updating profile settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Profile Picture Upload Handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error');
      return;
    }

    try {
      showToast('Uploading profile image...', 'info');
      const formData = new FormData();
      formData.append('profile_picture', file);

      // Fetch dynamic bearer token
      const token = localStorage.getItem('access_token') || '';

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://tayaree.pk'}/api/v1/profile/image-update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const res = await response.json();
      if (res.status) {
        showToast('Profile image updated successfully.');
        loadProfileData();
      } else {
        showToast(res.message || 'Upload failed.', 'error');
      }
    } catch (e) {
      showToast('Error uploading avatar image.', 'error');
    }
  };

  // Change Password submit handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill out all password fields.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const res = await api.post<{ status: boolean; message?: string }>('/api/v1/profile/password-update', {
        current_password: currentPassword,
        new_password: newPassword,
        password_confirmation: confirmPassword,
      });

      if (res.status) {
        showToast(res.message || 'Security password changed successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(res.message || 'Verification failed.', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Could not update security credentials.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await api.delete<{ status: boolean; message?: string }>(`/api/v1/address/${id}`);
      if (res.status) {
        showToast('Address deleted successfully.');
        setAddresses(prev => prev.filter(a => a.id !== id));
      }
    } catch (e) {
      showToast('Failed to delete address.', 'error');
    }
  };

  // Open address edit modal
  const openAddressModal = (mode: 'add' | 'edit', addr?: Address) => {
    setModalMode(mode);
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
    } else {
      setEditingAddressId(null);
      setAddrTitle('');
      setAddrLine1('');
      setAddrLine2('');
      setAddrCity('');
      setAddrProvince('');
      setAddrPostal('');
      setAddrCountry('Pakistan');
      setAddrIsDefault(addresses.length === 0);
    }
    setShowAddressModal(true);
  };

  // Save Address form handler
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
      if (modalMode === 'edit' && editingAddressId) {
        res = await api.put<{ status: boolean; message?: string }>('/api/v1/address/update', {
          id: editingAddressId.toString(),
          ...payload,
        });
      } else {
        res = await api.post<{ status: boolean; message?: string }>('/api/v1/address/store', payload);
      }

      if (res.status) {
        showToast(res.message || 'Address entries saved successfully.');
        setShowAddressModal(false);
        loadProfileData();
      } else {
        showToast(res.message || 'Failed to save address details.', 'error');
      }
    } catch (e) {
      showToast('Failed to save address.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    showToast('Signed out successfully.');
    router.push('/login');
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
          <span className={styles.current}>My Dashboard</span>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
            <p style={{ marginTop: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>Loading profile data...</p>
          </div>
        ) : (
          <div className={styles.dashLayout}>
            {/* LEFT SIDEBAR PANEL */}
            <aside className={styles.sidebar}>
              <div className={styles.userCard}>
                <div className={styles.userAvatar}>
                  {profile?.imageUrl ? (
                    <img src={profile.imageUrl} alt={profile.fullName} />
                  ) : (
                    <i className="bx bx-user"></i>
                  )}
                  <label htmlFor="avatarInput" className={styles.userAvatarBadge}>
                    <i className="bx bx-camera"></i>
                  </label>
                  <input
                    type="file"
                    id="avatarInput"
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </div>
                <h3 className={styles.userName}>{profile?.fullName || 'unset'}</h3>
                <p className={styles.userEmail}>{profile?.email || 'unset'}</p>
                <p className={styles.userPhone}>{phone ? `+92 ${phone}` : 'unset'}</p>
                <div className={styles.userBadgeRow}>
                  <span className={styles.userBadge}>
                    <i className="bx bx-check-shield"></i>
                    {profile?.isEmailVerified ? 'Verified Account' : 'Standard Account'}
                  </span>
                </div>
                <button onClick={handleSignOut} className={styles.logoutBtn}>
                  <i className="bx bx-log-out"></i> Sign Out
                </button>
              </div>

              {/* Quick links navigation */}
              <div className={styles.sidebarNav}>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`${styles.sidebarNavItem} ${activeTab === 'profile' ? styles.sidebarNavItemActive : ''}`}
                >
                  <i className="bx bx-cog"></i> Profile Settings
                  <i className={`bx bx-chevron-right ${styles.chev}`}></i>
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`${styles.sidebarNavItem} ${activeTab === 'addresses' ? styles.sidebarNavItemActive : ''}`}
                >
                  <i className="bx bx-map"></i> Address Book
                  <i className={`bx bx-chevron-right ${styles.chev}`}></i>
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`${styles.sidebarNavItem} ${activeTab === 'password' ? styles.sidebarNavItemActive : ''}`}
                >
                  <i className="bx bx-lock-alt"></i> Password &amp; Security
                  <i className={`bx bx-chevron-right ${styles.chev}`}></i>
                </button>
              </div>
            </aside>

            {/* RIGHT WORKSPACE CONTENT */}
            <section className={styles.mainContent}>
              {activeTab === 'profile' && (
                <div>
                  <h2 className={styles.contentTitle}>
                    <i className="bx bx-cog"></i> Edit Profile Settings
                  </h2>
                  <form onSubmit={handleProfileSubmit}>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Full Name*</label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={styles.inputField}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Email Address*</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={styles.inputField}
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Mobile Number (Format: 03xx-xxxxxxx)*</label>
                        <input
                          type="text"
                          value={phone}
                          onChange={handlePhoneChange}
                          className={styles.inputField}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Gender</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className={styles.selectField}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Date of Birth (MM-DD-YYYY)</label>
                      <input
                        type="text"
                        placeholder="MM-DD-YYYY"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className={styles.inputField}
                      />
                    </div>

                    <button type="submit" disabled={isSaving} className={styles.btnSubmit}>
                      {isSaving ? 'Saving...' : 'Update Profile'}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'addresses' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 className={styles.contentTitle} style={{ margin: 0, border: 'none', padding: 0 }}>
                      <i className="bx bx-map"></i> Manage Address Book
                    </h2>
                    <button onClick={() => openAddressModal('add')} className={styles.btnSubmit} style={{ height: '36px' }}>
                      <i className="bx bx-plus"></i> Add Address
                    </button>
                  </div>

                  <div className={styles.addressGrid}>
                    {addresses.length === 0 ? (
                      <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        No address stored. Get started by adding a shipping address.
                      </p>
                    ) : (
                      addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`${styles.addressCard} ${addr.isDefault === 1 ? styles.addressCardDefault : ''}`}
                        >
                          <h4 className={styles.addrTitle}>
                            {addr.title}
                            {addr.isDefault === 1 && ' (Default)'}
                          </h4>
                          <p className={styles.addrBody}>
                            {addr.address}
                            {addr.address2 && `, ${addr.address2}`}
                            {`, ${addr.city}`}
                            {addr.province && `, ${addr.province}`}
                            {addr.postalCode && `, ${addr.postalCode}`}
                            {`, ${addr.country}`}
                          </p>
                          <div className={styles.addrActions}>
                            <button onClick={() => openAddressModal('edit', addr)} className={styles.actionLink}>
                              Edit
                            </button>
                            <button onClick={() => handleDeleteAddress(addr.id)} className={`${styles.actionLink} ${styles.actionLinkDanger}`}>
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'password' && (
                <div>
                  <h2 className={styles.contentTitle}>
                    <i className="bx bx-lock-alt"></i> Password &amp; Credentials Security
                  </h2>
                  <form onSubmit={handlePasswordSubmit}>
                    <div className={styles.formGroup}>
                      <label>Current Account Password*</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={styles.inputField}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>New Password*</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={styles.inputField}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Confirm New Password*</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={styles.inputField}
                        required
                      />
                    </div>

                    <button type="submit" disabled={isSaving} className={styles.btnSubmit}>
                      {isSaving ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Address Form Modal */}
      {showAddressModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalMode === 'add' ? 'Add New Address Entry' : 'Edit Address details'}
              </h3>
              <button onClick={() => setShowAddressModal(false)} className={styles.modalClose}>
                <i className="bx bx-x"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <form onSubmit={handleSaveAddress} className={styles.addressForm} style={{ background: 'none', border: 'none', padding: 0 }}>
                <div className={styles.formGroup}>
                  <label>Title (e.g. Home, Office)*</label>
                  <input
                    type="text"
                    value={addrTitle}
                    onChange={(e) => setAddrTitle(e.target.value)}
                    className={styles.inputField}
                    placeholder="Home"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Address line 1*</label>
                  <input
                    type="text"
                    value={addrLine1}
                    onChange={(e) => setAddrLine1(e.target.value)}
                    className={styles.inputField}
                    placeholder="Street/house number, sector details"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Address line 2 (Optional)</label>
                  <input
                    type="text"
                    value={addrLine2}
                    onChange={(e) => setAddrLine2(e.target.value)}
                    className={styles.inputField}
                    placeholder="Suite, appt, unit number"
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>City*</label>
                    <input
                      type="text"
                      value={addrCity}
                      onChange={(e) => setAddrCity(e.target.value)}
                      className={styles.inputField}
                      placeholder="Karachi"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>State / Province</label>
                    <input
                      type="text"
                      value={addrProvince}
                      onChange={(e) => setAddrProvince(e.target.value)}
                      className={styles.inputField}
                      placeholder="Sindh"
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Postal Code</label>
                    <input
                      type="text"
                      value={addrPostal}
                      onChange={(e) => setAddrPostal(e.target.value)}
                      className={styles.inputField}
                      placeholder="74200"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Country*</label>
                    <input
                      type="text"
                      value={addrCountry}
                      onChange={(e) => setAddrCountry(e.target.value)}
                      className={styles.inputField}
                      required
                    />
                  </div>
                </div>

                <label className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '10px' }}>
                  <input
                    type="checkbox"
                    checked={addrIsDefault}
                    onChange={(e) => setAddrIsDefault(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  <span>Set as default shipping address</span>
                </label>

                <div className={styles.formActions} style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', marginTop: '15px' }}>
                  <button type="button" onClick={() => setShowAddressModal(false)} className={styles.btnCancel}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.btnSave}>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
