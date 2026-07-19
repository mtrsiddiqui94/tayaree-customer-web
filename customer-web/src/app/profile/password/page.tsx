'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import styles from './page.module.css';

export default function ChangePasswordPage() {
  const router = useRouter();
  
  // Fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password visible toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Two Factor Authentication Toggle
  const [isTfaOn, setIsTfaOn] = useState(false);

  // States
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/profile/password');
    }
  }, [router]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill out all fields.', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Confirm password does not match new password.', 'error');
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
        showToast(res.message || 'Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(res.message || 'Failed to update password.', 'error');
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to update password. Please check your current password.';
      showToast(errMsg, 'error');
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

      <div>
        <div className="page-head" style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.7px' }}>Password &amp; Security</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '4px' }}>
            Update your password and manage account security.
          </p>
        </div>

        {/* Change password card */}
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <div className={styles.cardTitle}>
              <i className="bx bx-lock-alt"></i>Change Password
            </div>
            <div className={styles.cardSub}>
              Use at least 8 characters with a mix of letters, numbers, and symbols.
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className={styles.fld}>
                <label className={styles.fldLbl}>Current Password</label>
                <div className={styles.fldWrap}>
                  <i className="bx bx-key"></i>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                  <i
                    className={`bx ${showCurrent ? 'bx-show' : 'bx-hide'} ${styles.fldEye}`}
                    onClick={() => setShowCurrent(!showCurrent)}
                  ></i>
                </div>
              </div>

              <div className={styles.fld}>
                <label className={styles.fldLbl}>New Password</label>
                <div className={styles.fldWrap}>
                  <i className="bx bx-lock"></i>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                  />
                  <i
                    className={`bx ${showNew ? 'bx-show' : 'bx-hide'} ${styles.fldEye}`}
                    onClick={() => setShowNew(!showNew)}
                  ></i>
                </div>
              </div>

              <div className={styles.fld}>
                <label className={styles.fldLbl}>Confirm New Password</label>
                <div className={styles.fldWrap}>
                  <i className="bx bx-lock"></i>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                  />
                  <i
                    className={`bx ${showConfirm ? 'bx-show' : 'bx-hide'} ${styles.fldEye}`}
                    onClick={() => setShowConfirm(!showConfirm)}
                  ></i>
                </div>
                <div className={styles.pwTips}>
                  Passwords must match and contain at least 8 characters.
                </div>
              </div>

              <button type="submit" disabled={isSaving} className={styles.btnSave}>
                <i className="bx bx-check"></i>
                {isSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* 2-Factor Authentication card */}
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <div className={styles.cardTitle}>
              <i className="bx bx-shield-quarter"></i>Two-Factor Authentication
            </div>
            <div className={styles.cardSub}>
              Add an extra layer of security with a one-time code sent to your phone.
            </div>
            
            <div className={styles.tglRow}>
              <div className={styles.tglInfo}>
                <div className={styles.tglName}>SMS Verification</div>
                <div className={styles.tglDesc}>
                  Require a code sent to your mobile number when signing in on a new device.
                </div>
              </div>
              <button
                type="button"
                className={`${styles.tgl} ${isTfaOn ? styles.tglOn : ''}`}
                onClick={() => {
                  setIsTfaOn(!isTfaOn);
                  showToast(isTfaOn ? 'Two-Factor Authentication turned off.' : 'Two-Factor Authentication turned on.', 'info');
                }}
              ></button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
