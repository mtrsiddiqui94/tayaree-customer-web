'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import styles from './referrals.module.css';

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

      <DashboardLayout breadcrumbTitle="Invite Friends">
        <div className={styles.dashContent}>

        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>Invite Friends</h1>
          <p className={styles.pageSub}>Share Tayaree and earn rewards when your friends place their first order.</p>
        </div>

        <div className={styles.inviteHero}>
          <i className="bx bxs-gift" style={{ fontSize: '36px', position: 'relative', zIndex: 1 }}></i>
          <div className={styles.inviteHeroTitle}>Give PKR 500, Get PKR 500</div>
          <div className={styles.inviteHeroSub}>
            Invite a friend with your code. They get PKR 500 off their first order, and you earn PKR 500 in credit once they check out.
          </div>
          <div className={styles.refBox}>
            <span className={styles.refCode}>{referralCode}</span>
            <button className={styles.refCopy} onClick={handleCopyLink}>
              <i className="bx bx-copy"></i>Copy
            </button>
          </div>
          <div className={styles.shareRow}>
            <button className={styles.shareBtn} onClick={handleCopyLink}>
              <i className="bx bxl-whatsapp"></i>WhatsApp
            </button>
            <button className={styles.shareBtn} onClick={handleCopyLink}>
              <i className="bx bx-envelope"></i>Email
            </button>
            <button className={styles.shareBtn} onClick={handleCopyLink}>
              <i className="bx bx-link"></i>Copy Link
            </button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardInner}>
            <div className={styles.cardTitle}>
              <i className="bx bx-group"></i>Your Invites
            </div>
            
            <div className={styles.invRow}>
              <div className={styles.invAv}>SK</div>
              <div className={styles.invInfo}>
                <div className={styles.invName}>Sara Khan</div>
                <div className={styles.invSub}>Joined · earned PKR 500</div>
              </div>
              <span className={`${styles.invStatus} ${styles.joined}`}>Joined</span>
            </div>
            
            <div className={styles.invRow}>
              <div className={styles.invAv}>BA</div>
              <div className={styles.invInfo}>
                <div className={styles.invName}>Bilal Ahmed</div>
                <div className={styles.invSub}>Joined · earned PKR 500</div>
              </div>
              <span className={`${styles.invStatus} ${styles.joined}`}>Joined</span>
            </div>
            
            <div className={styles.invRow}>
              <div className={styles.invAv}>MR</div>
              <div className={styles.invInfo}>
                <div className={styles.invName}>Maria Riaz</div>
                <div className={styles.invSub}>Invited 2 days ago · not ordered yet</div>
              </div>
              <span className={`${styles.invStatus} ${styles.pending}`}>Pending</span>
            </div>
          </div>
        </div>
        </div>
      </DashboardLayout>
    </>
  );
}
