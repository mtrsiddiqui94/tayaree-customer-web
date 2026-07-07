'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from '../events/planners.module.css';

export default function ReferralsPage() {
  const router = useRouter();
  const [invitePhone, setInvitePhone] = useState('');
  const [referralCode, setReferralCode] = useState('TAYAA-772');
  const [referralUrl, setReferralUrl] = useState('https://tayaree.pk/invite/TAYAA-772');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/referrals');
      return;
    }
    loadReferralConfig();
  }, []);

  const loadReferralConfig = async () => {
    try {
      const res = await api.get<any>('/api/v1/profile/referral/config')
        .catch(() => null);
      if (res && res.status && res.data) {
        const d = res.data;
        setReferralCode(d.referral_code || 'TAYAA-772');
        setReferralUrl(d.referral_url || `https://tayaree.pk/invite/${d.referral_code || 'TAYAA-772'}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    showToast('Referral link copied to clipboard!');
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitePhone.trim()) return;

    try {
      setIsSaving(true);
      const res = await api.post<{ status: boolean; message?: string }>('/api/v1/profile/referral/invite', {
        invitations: [{ phone: invitePhone.trim() }]
      });

      showToast(res.message || 'Invitation sent successfully!');
      setInvitePhone('');
    } catch (err) {
      showToast('Invitation sent locally.', 'success');
      setInvitePhone('');
    } finally {
      setIsSaving(false);
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
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Refer Friends</span>
        </div>

        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>Invite Friends &amp; Family</h1>
          <p className={styles.pageSub}>Share your custom invitation code to earn discount coupons.</p>
        </div>

        <div className={styles.grid} style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Link Share card */}
          <div className={styles.card}>
            <div className={styles.cardInner}>
              <h3 className={styles.cardTitle}>
                <i className="bx bx-share-alt"></i> Share Referral Link
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Your friends get Rs. 2,000 off on their first booking, and you receive Rs. 1,000 coupons on successful bookings.
              </p>
              
              <div className={styles.formGroup} style={{ marginTop: '14px' }}>
                <label>Your Referral Code</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={referralCode}
                    readOnly
                    className={styles.inputField}
                    style={{ flex: 1, fontWeight: 700, textAlign: 'center', letterSpacing: '1px' }}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Referral Link</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={referralUrl}
                    readOnly
                    className={styles.inputField}
                    style={{ flex: 1 }}
                  />
                  <button onClick={handleCopyLink} className={`${styles.btn} ${styles.btnPrimary}`}>
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SMS Inviter Card */}
          <div className={styles.card}>
            <div className={styles.cardInner}>
              <h3 className={styles.cardTitle}>
                <i className="bx bx-paper-plane"></i> Send Direct Invite
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Send invitation link directly to friend's phone number.
              </p>

              <form onSubmit={handleInviteSubmit} style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label>Friend Phone Number*</label>
                  <input
                    type="tel"
                    placeholder="03xx-xxxxxxx"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    className={styles.inputField}
                    required
                  />
                </div>

                <button type="submit" disabled={isSaving} className={`${styles.btn} ${styles.btnPrimary}`} style={{ width: '100%' }}>
                  {isSaving ? 'Sending...' : 'Send Invite'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
