'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import styles from './page.module.css';

export default function PhoneSettingsPage() {
  const router = useRouter();
  const { updateUser } = useAuth();

  // Data States
  const [currentPhone, setCurrentPhone] = useState('unset');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Request, Step 2: Verify

  // Form Fields
  const [password, setPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [errors, setErrors] = useState<{ password?: string; newPhone?: string; otpCode?: string }>({});

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function loadProfile() {
    try {
      setIsLoading(true);
      const res = await api.get<{ status: boolean; data: Record<string, unknown> }>('/api/v1/profile/me');
      if (res.status && res.data) {
        const raw = res.data as { phone?: string };
        let formatted = raw.phone || 'unset';
        if (formatted !== 'unset' && formatted.length >= 10) {
          // Format as +92 3XX XXXXXXX
          const cleaned = formatted.replace(/[^0-9]/g, '');
          const prefix = cleaned.startsWith('92') ? '+92' : '+92';
          const localNum = cleaned.startsWith('92') ? cleaned.slice(2) : cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
          if (localNum.length >= 10) {
            formatted = `${prefix} ${localNum.slice(0, 3)} ${localNum.slice(3)}`;
          } else {
            formatted = `${prefix} ${localNum}`;
          }
        }
        setCurrentPhone(formatted);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load profile details.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/profile/phone');
      return;
    }
    const timer = setTimeout(() => {
      loadProfile();
    }, 0);
    return () => clearTimeout(timer);
  }, [router]);

  const validatePassword = (val: string) => {
    if (!val) {
      setErrors((prev) => ({ ...prev, password: 'Please enter your current password.' }));
      return false;
    }
    setErrors((prev) => ({ ...prev, password: undefined }));
    return true;
  };

  const validatePhone = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    let finalPhone = cleaned;
    if (cleaned.startsWith('92')) {
      finalPhone = cleaned.slice(2);
    } else if (cleaned.startsWith('0')) {
      finalPhone = cleaned.slice(1);
    }

    if (finalPhone.length < 10) {
      setErrors((prev) => ({ ...prev, newPhone: 'Please enter a valid 10-digit mobile number.' }));
      return false;
    }
    setErrors((prev) => ({ ...prev, newPhone: undefined }));
    return true;
  };

  const validateOtpCode = (val: string) => {
    if (!val) {
      setErrors((prev) => ({ ...prev, otpCode: 'Please enter the OTP verification code.' }));
      return false;
    }
    setErrors((prev) => ({ ...prev, otpCode: undefined }));
    return true;
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const isPassValid = validatePassword(password);
    const isPhoneValid = validatePhone(newPhone);

    if (!isPassValid || !isPhoneValid) {
      return;
    }

    const cleanedPhone = newPhone.replace(/[^0-9]/g, '');
    let finalPhone = cleanedPhone;
    if (cleanedPhone.startsWith('92')) {
      finalPhone = cleanedPhone.slice(2);
    } else if (cleanedPhone.startsWith('0')) {
      finalPhone = cleanedPhone.slice(1);
    }

    try {
      setIsSaving(true);
      const res = await api.post<{ status: boolean; message?: string }>(
        '/api/v1/profile/phone-number/change/request',
        {
          current_password: password,
          phone: finalPhone,
          phone_country: 'PK',
          is_resend: '0',
        }
      );

      if (res.status) {
        showToast(res.message || 'Verification code sent to new number!');
        setStep(2);
      } else {
        showToast(res.message || 'Request failed. Please check your credentials.', 'error');
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Request failed.';
      showToast(errMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const isOtpValid = validateOtpCode(otpCode);
    if (!isOtpValid) {
      return;
    }

    const cleanedPhone = newPhone.replace(/[^0-9]/g, '');
    let finalPhone = cleanedPhone;
    if (cleanedPhone.startsWith('92')) {
      finalPhone = cleanedPhone.slice(2);
    } else if (cleanedPhone.startsWith('0')) {
      finalPhone = cleanedPhone.slice(1);
    }

    try {
      setIsSaving(true);
      const res = await api.post<{ status: boolean; message?: string }>(
        '/api/v1/profile/phone-number/change/verify',
        {
          otp_code: otpCode,
          phone: finalPhone,
          phone_country: 'PK',
          current_password: password,
        }
      );

      if (res.status) {
        showToast(res.message || 'Phone number updated successfully!');
        setStep(1);
        setPassword('');
        setNewPhone('');
        setOtpCode('');
        setErrors({});
        if (updateUser) {
          updateUser({ phone: finalPhone, phone_country: '92' });
        }
        loadProfile();
      } else {
        showToast(res.message || 'Verification failed. Incorrect OTP.', 'error');
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Verification failed.';
      showToast(errMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    setNewPhone(rawVal.slice(0, 10));
  };

  return (
    <DashboardLayout breadcrumbTitle="Phone & Email">
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
          <div className="page-head" style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.7px' }}>Phone Number</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '4px' }}>
              Manage the mobile number used for order updates and verification.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardInner}>
              <div className={styles.cardTitle}>
                <i className="bx bx-phone"></i>Current Number
              </div>
              <div className={styles.cardSub}>
                We use this number to send order updates and delivery alerts.
              </div>

              <div className={styles.phoneCurrent}>
                <div className={styles.phoneIc}>
                  <i className="bx bx-phone"></i>
                </div>
                <div>
                  <div className={styles.phoneNum}>{currentPhone}</div>
                  {currentPhone !== 'unset' && (
                    <div className={styles.phoneVerified}>
                      <i className="bx bx-check-circle"></i>Verified
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.divider}></div>

              {step === 1 ? (
                <form onSubmit={handleRequestOtp} noValidate>
                  <div className={styles.cardTitle}>
                    <i className="bx bx-edit"></i>Change Number
                  </div>
                  <div className={styles.cardSub}>
                    Enter a new number — we&apos;ll send a one-time code to verify it.
                  </div>

                  <div className={styles.fld}>
                    <label className={styles.fldLbl}>Current Account Password*</label>
                    <div className={`${styles.fldWrap} ${errors.password ? styles.fldWrapError : ''}`}>
                      <i className="bx bx-lock-alt"></i>
                      <input
                        type="password"
                        placeholder="Enter password to confirm identity"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) validatePassword(e.target.value);
                        }}
                        onBlur={(e) => validatePassword(e.target.value)}
                        required
                      />
                    </div>
                    {errors.password && (
                      <span className={styles.fldErrorMsg}>{errors.password}</span>
                    )}
                  </div>

                  <div className={styles.fld}>
                    <label className={styles.fldLbl}>New Mobile Number*</label>
                    <div className={`${styles.fldWrap} ${errors.newPhone ? styles.fldWrapError : ''}`}>
                      <span className={styles.fldPrefix}>+92</span>
                      <input
                        type="tel"
                        placeholder="3XX XXXXXXX"
                        value={newPhone}
                        onChange={(e) => {
                          handlePhoneInputChange(e);
                          if (errors.newPhone) validatePhone(e.target.value);
                        }}
                        onBlur={(e) => validatePhone(e.target.value)}
                        required
                      />
                    </div>
                    {errors.newPhone && (
                      <span className={styles.fldErrorMsg}>{errors.newPhone}</span>
                    )}
                  </div>

                  <button type="submit" disabled={isSaving} className={styles.btnSave}>
                    <i className="bx bx-message-rounded-check"></i>
                    {isSaving ? 'Sending OTP...' : 'Send Verification Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} noValidate>
                  <div className={styles.cardTitle}>
                    <i className="bx bx-shield-quarter"></i>Verify Phone Number
                  </div>
                  <div className={styles.cardSub}>
                    Enter the one-time code sent to +92 {newPhone}.
                  </div>

                  <div className={styles.fld}>
                    <label className={styles.fldLbl}>One-Time Verification OTP*</label>
                    <div className={`${styles.fldWrap} ${errors.otpCode ? styles.fldWrapError : ''}`}>
                      <i className="bx bx-key"></i>
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP code"
                        value={otpCode}
                        onChange={(e) => {
                          setOtpCode(e.target.value);
                          if (errors.otpCode) validateOtpCode(e.target.value);
                        }}
                        onBlur={(e) => validateOtpCode(e.target.value)}
                        required
                      />
                    </div>
                    {errors.otpCode && (
                      <span className={styles.fldErrorMsg}>{errors.otpCode}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" disabled={isSaving} className={styles.btnSave}>
                      <i className="bx bx-check"></i>
                      {isSaving ? 'Verifying...' : 'Verify & Update Number'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className={styles.btnSave}
                      style={{ background: 'transparent', border: '1.5px solid var(--border)', color: 'var(--text-secondary)', boxShadow: 'none' }}
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  </DashboardLayout>
  );
}
