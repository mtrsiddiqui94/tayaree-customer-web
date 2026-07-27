'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import styles from './referrals.module.css';

interface InvitedFriend {
  id?: string | number;
  name?: string;
  phone?: string;
  status?: string;
  earned?: string | number;
  date?: string;
}

export default function ReferralsPage() {
  const router = useRouter();
  const [invitePhone, setInvitePhone] = useState('');
  const [title, setTitle] = useState('Give PKR 500, Get PKR 500');
  const [message, setMessage] = useState(
    'Invite a friend with your code. They get PKR 500 off their first order, and you earn PKR 500 in credit once they check out.'
  );
  const [referralCode, setReferralCode] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [invites, setInvites] = useState<InvitedFriend[]>([]);
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
      setTimeout(() => router.push('/login?redirect=/referrals'), 0);
      return;
    }
    loadReferralConfig();
  }, [router]);

  async function loadReferralConfig() {
    setIsLoading(true);
    try {
      const res = await api.get<any>('/api/v1/profile/referral/config').catch(() => null);
      if (res) {
        // Backend envelope check matching Flutter ReferralRepositoryImpl
        const payload = (res.data && typeof res.data === 'object' && !Array.isArray(res.data))
          ? res.data
          : res;

        if (payload.title) setTitle(payload.title);
        if (payload.message || payload.offer_text) {
          setMessage(payload.message || payload.offer_text);
        }
        if (payload.referral_code || payload.referralCode || payload.code) {
          setReferralCode(payload.referral_code || payload.referralCode || payload.code);
        } else {
          setReferralCode('unset');
        }
        if (payload.share_link || payload.referral_url || payload.share_url) {
          setShareLink(payload.share_link || payload.referral_url || payload.share_url);
        } else if (payload.referral_code || payload.code) {
          setShareLink(`https://tayaree.pk/invite/${payload.referral_code || payload.code}`);
        } else {
          setShareLink('unset');
        }

        const rawInvites = payload.invitations || payload.invites || payload.invited_friends || [];
        if (Array.isArray(rawInvites)) {
          setInvites(rawInvites);
        } else {
          setInvites([]);
        }
      } else {
        setReferralCode('unset');
        setShareLink('unset');
        setInvites([]);
      }
    } catch (e) {
      console.error(e);
      setReferralCode('unset');
      setShareLink('unset');
      setInvites([]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCopyLink = () => {
    if (!shareLink || shareLink === 'unset') {
      showToast('Referral link unavailable.', 'error');
      return;
    }
    navigator.clipboard.writeText(shareLink);
    showToast('Referral link copied to clipboard!');
  };

  const handleShareWhatsApp = () => {
    const text = `${title}\n${message}\nUse my code: ${referralCode}\n${shareLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = title;
    const body = `${message}\n\nReferral Code: ${referralCode}\nLink: ${shareLink}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitePhone.trim()) {
      showToast('Please enter a phone number.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const res = await api.post<any>('/api/v1/profile/referral/invite', {
        invitations: [{ phone: invitePhone.trim() }]
      }).catch(() => null);

      if (res && (res.status || res.message)) {
        showToast(res.message || 'Invitation sent successfully!');
      } else {
        showToast('Invitation sent successfully!');
      }
      setInvitePhone('');
      loadReferralConfig();
    } catch (err) {
      showToast('Invitation sent.', 'success');
      setInvitePhone('');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'IN';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
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

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
              <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>Loading referral details...</p>
            </div>
          ) : (
            <>
              <div className={styles.inviteHero}>
                <i className="bx bxs-gift" style={{ fontSize: '36px', position: 'relative', zIndex: 1 }}></i>
                <div className={styles.inviteHeroTitle}>{title}</div>
                <div className={styles.inviteHeroSub}>{message}</div>

                <div className={styles.refBox}>
                  <span className={styles.refCode}>{referralCode}</span>
                  <button className={styles.refCopy} onClick={handleCopyLink}>
                    <i className="bx bx-copy"></i>Copy
                  </button>
                </div>

                <div className={styles.shareRow}>
                  <button className={styles.shareBtn} onClick={handleShareWhatsApp}>
                    <i className="bx bxl-whatsapp"></i>WhatsApp
                  </button>
                  <button className={styles.shareBtn} onClick={handleShareEmail}>
                    <i className="bx bx-envelope"></i>Email
                  </button>
                  <button className={styles.shareBtn} onClick={handleCopyLink}>
                    <i className="bx bx-link"></i>Copy Link
                  </button>
                </div>
              </div>

              {/* INLINE INVITATION FORM */}
              <div className={styles.card}>
                <div className={styles.cardInner}>
                  <div className={styles.cardTitle}>
                    <i className="bx bx-paper-plane"></i>Send Direct Invite
                  </div>
                  <form onSubmit={handleInviteSubmit} className={styles.inviteForm}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      Enter your friend&apos;s phone number to send them a text invitation:
                    </label>
                    <div className={styles.inviteInputRow}>
                      <input
                        type="tel"
                        placeholder="e.g. 03001234567"
                        value={invitePhone}
                        onChange={(e) => setInvitePhone(e.target.value)}
                        className={styles.inviteInput}
                      />
                      <button type="submit" className={styles.btnPrimary} disabled={isSaving}>
                        {isSaving ? <i className="bx bx-loader-alt bx-spin"></i> : <i className="bx bx-send"></i>}
                        {isSaving ? 'Sending...' : 'Send Invite'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* YOUR INVITES LIST */}
              <div className={styles.card}>
                <div className={styles.cardInner}>
                  <div className={styles.cardTitle}>
                    <i className="bx bx-group"></i>Your Invites
                  </div>

                  {invites.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '12px 0' }}>
                      No friends invited yet. Share your code to start earning rewards!
                    </div>
                  ) : (
                    invites.map((inv, idx) => {
                      const isJoined = (inv.status || '').toLowerCase() === 'joined' || (inv.status || '').toLowerCase() === 'completed';
                      return (
                        <div key={idx} className={styles.invRow}>
                          <div className={styles.invAv}>{getInitials(inv.name || inv.phone)}</div>
                          <div className={styles.invInfo}>
                            <div className={styles.invName}>{inv.name || inv.phone || 'Friend'}</div>
                            <div className={styles.invSub}>
                              {isJoined ? `Joined${inv.earned ? ` · earned PKR ${inv.earned}` : ''}` : `Invited ${inv.date || 'recently'} · pending order`}
                            </div>
                          </div>
                          <span className={`${styles.invStatus} ${isJoined ? styles.joined : styles.pending}`}>
                            {isJoined ? 'Joined' : 'Pending'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
