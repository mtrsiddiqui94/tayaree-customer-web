'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';
import styles from './page.module.css';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');

  useEffect(() => {
    setMounted(true);
    if (user) {
      setFullName(user.name !== 'unset' ? user.name : '');
      setEmail(user.email !== 'unset' ? user.email : '');
      const rawPhone = user.phone !== 'unset' ? user.phone : '';
      setPhone(rawPhone);
      setGender(user.gender || 'Male');
      setDob(user.dob || '');
    }
  }, [user]);

  if (!mounted) return null;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      // We use string directly in case ENDPOINTS doesn't have it explicitly
      const endpoint = ENDPOINTS.PROFILE_IMAGE_UPDATE || '/api/v1/profile/image-update';
      const res = await api.upload<{ status: boolean; message?: string }>(endpoint, formData);
      
      if (res.status !== false) {
        showToast('Profile image updated successfully', 'success');
        await refreshProfile();
      } else {
        showToast(res.message || 'Failed to update image', 'error');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error uploading image';
      showToast(errorMsg, 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      showToast('Name and phone are required', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const endpoint = ENDPOINTS.PROFILE_UPDATE || '/api/v1/profile/update';
      const res = await api.put<{ status: boolean; message?: string }>(endpoint, {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.replace(/\D/g, ''),
        phone_country: user?.phone_country || '92',
        gender: gender,
        date_of_birth: dob || '01-01-2000'
      });

      if (res.status !== false) {
        showToast('Profile updated successfully', 'success');
        await refreshProfile();
      } else {
        showToast(res.message || 'Failed to update profile', 'error');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error updating profile';
      showToast(errorMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  }

  const isEmailChanged = user?.email && user.email !== 'unset' && email !== user.email;

  return (
    <>
      <Header />
      <main className={styles.page}>
      <div className={styles.pageHead}>
        <div className={styles.pageTitle}>Profile</div>
        <div className={styles.pageSub}>Manage your personal information and account details.</div>
      </div>

      {/* Avatar Hero */}
      <div className={styles.profHero}>
        <div className={styles.avatarXl}>
          {user?.image ? (
            <img src={user.image} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <i className="bx bx-user" style={{ fontSize: '40px' }}></i>
          )}
          <div className={styles.avatarCam} onClick={() => fileInputRef.current?.click()}>
            <i className={isUploading ? 'bx bx-loader-alt bx-spin' : 'bx bx-camera'}></i>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
        </div>
        <div className={styles.profHi}>
          <div className={styles.profName}>{user?.name || 'unset'}</div>
          <div className={styles.profEmail}>
            {user?.email !== 'unset' ? user?.email : 'No email'} &middot; +{user?.phone_country || '92'} {user?.phone !== 'unset' ? user?.phone : ''}
          </div>
          <button className={styles.changePhoto} onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            <i className="bx bx-image-add"></i> {isUploading ? 'Uploading...' : 'Change Photo'}
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave}>
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <div className={styles.cardTitle}>
              <i className="bx bx-id-card"></i> Personal Info
            </div>
            <div className={styles.cardSub}>Keep your details up to date so vendors can reach you.</div>

            <div className={styles.fld}>
              <label className={styles.fldLbl}>
                <i className="bx bx-user"></i> Full Name
              </label>
              <input 
                className={styles.fldInput} 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                placeholder="Enter your full name" 
              />
            </div>

            <div className={styles.fld}>
              <label className={styles.fldLbl}>
                <i className="bx bx-envelope"></i> Email Address <span className={styles.opt}>(optional)</span>
              </label>
              <input 
                className={styles.fldInput} 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Enter your email address" 
              />
              <div className={styles.verifyRow}>
                {isEmailChanged ? (
                  <>
                    <span className={`${styles.verifyStatus} ${styles.no}`}>
                      <i className="bx bx-error-circle"></i> Email needs verification
                    </span>
                    <Link href="/profile/phone" className={styles.sendOtp}>Send OTP</Link>
                  </>
                ) : user?.is_verified ? (
                  <span className={`${styles.verifyStatus} ${styles.ok}`}>
                    <i className="bx bx-check-circle"></i> Email Verified
                  </span>
                ) : email ? (
                  <>
                    <span className={`${styles.verifyStatus} ${styles.no}`}>
                      <i className="bx bx-error-circle"></i> Unverified
                    </span>
                    <Link href="/profile/phone" className={styles.sendOtp}>Verify</Link>
                  </>
                ) : null}
              </div>
            </div>

            <div className={styles.fld}>
              <label className={styles.fldLbl}>
                <i className="bx bx-cake"></i> Date of Birth <span className={styles.opt}>(optional)</span>
              </label>
              <div className={styles.fldIcon}>
                <input 
                  className={styles.fldInput} 
                  value={dob} 
                  onChange={(e) => setDob(e.target.value)} 
                  placeholder="DD-MM-YYYY" 
                />
                <i className="bx bx-calendar"></i>
              </div>
            </div>

            <div className={styles.fld}>
              <label className={styles.fldLbl}>
                <i className="bx bx-male-female"></i> Gender <span className={styles.opt}>(optional)</span>
              </label>
              <select className={styles.fldInput} value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div className={styles.fld}>
              <label className={styles.fldLbl}>
                <i className="bx bx-phone"></i> Phone Number
              </label>
              <div className={styles.phoneRo}>
                <span className={styles.phoneRoVal}>+{user?.phone_country || '92'} {phone}</span>
                <Link href="/profile/phone" className={styles.changeLink}>Change</Link>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className={styles.btnSave} disabled={isSaving}>
          <i className="bx bx-check"></i> {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
      </main>
      <Footer />
    </>
  );
}
