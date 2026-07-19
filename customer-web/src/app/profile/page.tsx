'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // Profile editing fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('male');
  const [dateOfBirth, setDateOfBirth] = useState('');

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
        };
        setProfile(parsedProfile);
        
        setFullName(parsedProfile.fullName === 'unset' ? '' : parsedProfile.fullName);
        setEmail(parsedProfile.email === 'unset' ? '' : parsedProfile.email);
        setGender(parsedProfile.gender);
        setDateOfBirth(parsedProfile.dateOfBirth);
        
        const rawPhone = parsedProfile.phone.replace(/[^0-9]/g, '');
        if (rawPhone.length > 4) {
          setPhone(`${rawPhone.slice(0, 4)}-${rawPhone.slice(4, 11)}`);
        } else {
          setPhone(rawPhone);
        }
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load profile settings.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    let formatted = rawVal;
    if (rawVal.length > 4) {
      formatted = `${rawVal.slice(0, 4)}-${rawVal.slice(4, 11)}`;
    }
    setPhone(formatted.slice(0, 12));
  };

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
        date_of_birth: dateOfBirth || '01-01-2000',
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

  return (
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
          <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>Loading settings...</p>
        </div>
      ) : (
        <div>
          <h2 className={styles.contentTitle}>
            <i className="bx bx-cog"></i> Profile Settings
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
    </>
  );
}
