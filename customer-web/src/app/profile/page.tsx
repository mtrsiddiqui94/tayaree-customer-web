'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, updateUser } = useAuth();
  
  // States
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [savedFullName, setSavedFullName] = useState('');
  const [email, setEmail] = useState('');
  const [savedEmail, setSavedEmail] = useState('');
  const [errors, setErrors] = useState({ fullName: '', email: '' });
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('male');
  const [phoneDisplay, setPhoneDisplay] = useState('unset');
  const [imageUrl, setImageUrl] = useState('');

  // Hidden states for API payload
  const [phoneRaw, setPhoneRaw] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('92');

  // Email Verification States
  const [originalEmail, setOriginalEmail] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  
  // File Input Ref for Image Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ status: boolean; data: any }>('/api/v1/profile/me');
      if (res.status && res.data) {
        const p = res.data;
        setFullName(p.full_name || '');
        setSavedFullName(p.full_name || '');
        setEmail(p.email || '');
        setSavedEmail(p.email || '');
        setOriginalEmail(p.email || '');
        setDateOfBirth(p.date_of_birth || '');
        setGender(p.gender ? p.gender.toLowerCase() : 'male');
        setImageUrl(p.image_url || '');
        setIsEmailVerified(p.is_email_verified || false);
        
        setPhoneRaw(p.phone || '');
        setPhoneCountry(p.phone_country || '92');

        if (p.phone && p.phone !== 'unset') {
          const cleaned = p.phone.replace(/[^0-9]/g, '');
          setPhoneDisplay(`+${p.phone_country || '92'} ${cleaned.slice(0, 3)} ${cleaned.slice(3)}`);
        } else {
          setPhoneDisplay('unset');
        }
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load profile details.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/profile');
      return;
    }
    const timer = setTimeout(() => {
      loadProfile();
    }, 0);
    return () => clearTimeout(timer);
  }, [router]);

  const validateFullName = (val: string) => {
    if (!val.trim()) {
      setErrors(prev => ({ ...prev, fullName: 'Full Name is required.' }));
      return false;
    }
    setErrors(prev => ({ ...prev, fullName: '' }));
    return true;
  };

  const validateEmail = (val: string) => {
    const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!val.trim()) {
      setErrors(prev => ({ ...prev, email: 'Email Address is required.' }));
      return false;
    } else if (!re.test(val)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address.' }));
      return false;
    }
    setErrors(prev => ({ ...prev, email: '' }));
    return true;
  };

  const handleSaveChanges = async () => {
    const isNameValid = validateFullName(fullName);
    const isEmailValid = validateEmail(email);
    if (!isNameValid || !isEmailValid) return;

    try {
      setIsSaving(true);
      const res = await api.put<{ status: boolean; message?: string }>('/api/v1/profile/update', {
        full_name: fullName,
        email: email,
        gender: gender,
        date_of_birth: dateOfBirth,
        phone: phoneRaw,
        phone_country: phoneCountry
      });

      if (res.status) {
        showToast(res.message || 'Profile updated successfully!');
        setOriginalEmail(email);
        setSavedFullName(fullName);
        setSavedEmail(email);
        
        if (updateUser) {
          updateUser({
            full_name: fullName,
            first_name: fullName.split(' ')[0],
            email: email
          });
        }
      } else {
        showToast(res.message || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to update profile.';
      showToast(errMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      showToast('Uploading image...', 'info');
      const formData = new FormData();
      formData.append('profile_picture', file);

      // We need to use native fetch or a specialized multipart method if `api.post` doesn't handle FormData natively
      // Assuming api.post doesn't automatically set multipart headers correctly, we'll use a fetch block:
      const token = localStorage.getItem('access_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/v1/profile/image-update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const res = await response.json();
      if (res.status) {
        showToast(res.message || 'Profile picture updated successfully!');
        if (res.data && res.data.image_url) {
          setImageUrl(res.data.image_url);
          if (updateAuthUser) {
            updateAuthUser({ image: res.data.image_url });
          }
        } else {
          loadProfile(); // Reload to get new URL
        }
      } else {
        showToast(res.message || 'Failed to upload image.', 'error');
      }
    } catch (err) {
      showToast('Image upload failed.', 'error');
    }
  };

  const handleSendOtp = async () => {
    try {
      setIsSendingOtp(true);
      const res = await api.post<{ status: boolean; message?: string; data?: any }>('/api/v1/profile/email/change/request', {
        email: email,
        is_resend: '0'
      });
      if (res.status) {
        if (res.data && res.data.already_verified) {
          setIsEmailVerified(true);
          setOriginalEmail(email);
          showToast('Email was already verified on this account.', 'success');
        } else {
          setIsOtpSent(true);
          showToast(res.message || 'Verification code sent to your new email.');
        }
      } else {
        showToast(res.message || 'Failed to send OTP.', 'error');
      }
    } catch (err) {
      showToast('Failed to request OTP.', 'error');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) {
      showToast('Please enter the OTP code.', 'error');
      return;
    }
    try {
      setIsSendingOtp(true);
      const res = await api.post<{ status: boolean; message?: string }>('/api/v1/profile/email/change/verify', {
        email: email,
        otp_code: otpCode
      });
      if (res.status) {
        showToast(res.message || 'Email verified successfully!');
        setIsEmailVerified(true);
        setOriginalEmail(email);
        setIsOtpSent(false);
        setOtpCode('');
      } else {
        showToast(res.message || 'Invalid OTP code.', 'error');
      }
    } catch (err) {
      showToast('Verification failed.', 'error');
    } finally {
      setIsSendingOtp(false);
    }
  };

  if (!mounted) return null;

  // Profile Avatar Logic
  const getAvatarLetter = () => {
    const name = savedFullName || authUser?.full_name || authUser?.name || authUser?.first_name;
    if (name && name.trim().length > 0) return name.trim().charAt(0).toUpperCase();
    if (authUser?.phone && authUser.phone.trim().length > 0) return authUser.phone.replace(/[^0-9a-zA-Z]/g, '').charAt(0).toUpperCase();
    return 'U';
  };
  const avatarLetter = getAvatarLetter();
  const hasImage = imageUrl && imageUrl.trim().length > 0 && imageUrl !== 'null';

  return (
    <DashboardLayout breadcrumbTitle="Profile">
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
            <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>Loading profile...</p>
          </div>
        ) : (
          <div>
            <div className="page-head" style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.7px' }}>Profile</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, margin: '4px 0 0 0' }}>
                Manage your personal information and account details.
              </p>
            </div>

            {/* Avatar Hero */}
            <div className={styles.profHero}>
              <div className={styles.avatarXl}>
                {hasImage ? (
                  <img src={imageUrl} alt="Profile" />
                ) : (
                  avatarLetter
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/jpeg, image/png, image/jpg"
                  onChange={handleImageUpload}
                />
                <div className={styles.avatarCam} onClick={() => fileInputRef.current?.click()}>
                  <i className="bx bx-camera"></i>
                </div>
              </div>
              <div className={styles.profHi}>
                <div className={styles.profName}>{savedFullName || 'unset'}</div>
                <div className={styles.profEmail}>{savedEmail || 'unset'} &middot; {phoneDisplay}</div>
                <button className={styles.changePhoto} onClick={() => fileInputRef.current?.click()}>
                  <i className="bx bx-image-add"></i>Change Photo
                </button>
              </div>
            </div>

            {/* Personal Info Form */}
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.cardTitle}>
                  <i className="bx bx-id-card"></i>Personal Info
                </div>
                <div className={styles.cardSub}>
                  Keep your details up to date so vendors can reach you.
                </div>

                <div className={`${styles.fld} ${errors.fullName ? styles.fldWrapError : ''}`}>
                  <label className={styles.fldLbl}>
                    <i className="bx bx-user"></i>Full Name
                  </label>
                  <input 
                    className={styles.fldInput} 
                    value={fullName ?? ''} 
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors(p => ({ ...p, fullName: '' }));
                    }} 
                    onBlur={(e) => validateFullName(e.target.value)}
                    placeholder="Enter your full name" 
                  />
                  {errors.fullName && <span className={styles.fldErrorMsg}>{errors.fullName}</span>}
                </div>

                <div className={`${styles.fld} ${errors.email ? styles.fldWrapError : ''}`}>
                  <label className={styles.fldLbl}>
                    <i className="bx bx-envelope"></i>Email Address <span className={styles.opt}>(optional)</span>
                  </label>
                  <input 
                    className={styles.fldInput} 
                    value={email ?? ''} 
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setIsOtpSent(false); // reset OTP state if they keep typing
                      if (errors.email) setErrors(p => ({ ...p, email: '' }));
                    }} 
                    onBlur={(e) => validateEmail(e.target.value)}
                    placeholder="Enter your email address" 
                  />
                  {errors.email && <span className={styles.fldErrorMsg}>{errors.email}</span>}
                  
                  {email && email !== originalEmail ? (
                    <div className={styles.verifyRow}>
                      <span className={`${styles.verifyStatus} ${styles.verifyStatusNo}`}>
                        <i className="bx bx-error-circle"></i>Email needs verification
                      </span>
                      {isOtpSent ? (
                        <div className={styles.otpInputGroup}>
                          <input 
                            type="text" 
                            className={styles.otpInput} 
                            placeholder="OTP Code" 
                            value={otpCode ?? ''}
                            onChange={(e) => setOtpCode(e.target.value)}
                          />
                          <button className={styles.sendOtp} onClick={handleVerifyOtp} disabled={isSendingOtp}>
                            Verify
                          </button>
                        </div>
                      ) : (
                        <button className={styles.sendOtp} onClick={handleSendOtp} disabled={isSendingOtp}>
                          {isSendingOtp ? 'Sending...' : 'Send OTP'}
                        </button>
                      )}
                    </div>
                  ) : email === originalEmail && isEmailVerified ? (
                    <div className={styles.verifyRow}>
                      <span className={`${styles.verifyStatus} ${styles.verifyStatusOk}`}>
                        <i className="bx bx-check-circle"></i>Email Verified
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className={styles.fld}>
                  <label className={styles.fldLbl}>
                    <i className="bx bx-cake"></i>Date of Birth <span className={styles.opt}>(optional)</span>
                  </label>
                  <div className={styles.fldIcon}>
                    <input 
                      className={styles.fldInput} 
                      value={dateOfBirth ?? ''} 
                      onChange={(e) => setDateOfBirth(e.target.value)} 
                      placeholder="MM/DD/YYYY" 
                    />
                    <i className="bx bx-calendar"></i>
                  </div>
                </div>

                <div className={styles.fld}>
                  <label className={styles.fldLbl}>
                    <i className="bx bx-male-female"></i>Gender <span className={styles.opt}>(optional)</span>
                  </label>
                  <select 
                    className={styles.fldInput} 
                    value={gender ?? 'male'} 
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                <div className={styles.fld}>
                  <label className={styles.fldLbl}>
                    <i className="bx bx-phone"></i>Phone Number
                  </label>
                  <div className={styles.phoneRo}>
                    <span className={styles.phoneRoVal}>{phoneDisplay}</span>
                    <Link href="/profile/phone">Change</Link>
                  </div>
                </div>
              </div>
            </div>

            <button className={styles.btnSave} onClick={handleSaveChanges} disabled={isSaving}>
              <i className="bx bx-check"></i>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </>
    </DashboardLayout>
  );
}
