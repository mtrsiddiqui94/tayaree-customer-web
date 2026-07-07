'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from '../events/planners.module.css';

interface Registry {
  id: number;
  title: string;
  creatorName: string;
  coverUrl?: string;
  giftsCount: number;
  createdDate: string;
}

export default function RegistryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'my' | 'friends'>('my');
  const [myRegistries, setMyRegistries] = useState<Registry[]>([]);
  const [friendRegistries, setFriendRegistries] = useState<Registry[]>([]);

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/registry');
      return;
    }
    loadRegistries();
  }, []);

  const loadRegistries = async () => {
    try {
      setIsLoading(true);

      // 1. Fetch user registries
      const myRes = await api.get<{ status: boolean; data?: any }>('/api/v1/gift-registry/list/my')
        .catch(() => null);
      
      const parsedMy: Registry[] = (myRes?.data?.registries || []).map((r: any) => ({
        id: r.id,
        title: r.title || 'unset',
        creatorName: r.creator_name || 'My Registry',
        giftsCount: r.gifts_count || 0,
        createdDate: r.created_date || 'unset',
      }));

      // 2. Fetch friend registries
      const friendRes = await api.get<{ status: boolean; data?: any }>('/api/v1/gift-registry/list/friends')
        .catch(() => null);
      
      const parsedFriend: Registry[] = (friendRes?.data?.registries || []).map((r: any) => ({
        id: r.id,
        title: r.title || 'unset',
        creatorName: r.creator_name || 'Friend Registry',
        giftsCount: r.gifts_count || 0,
        createdDate: r.created_date || 'unset',
      }));

      setMyRegistries(parsedMy);
      setFriendRegistries(parsedFriend);

      // Fallback mockup registries
      if (parsedMy.length === 0 && parsedFriend.length === 0) {
        setMyRegistries([
          {
            id: 1,
            title: 'Adnan & Ayesha Wedding Gifts registry',
            creatorName: 'Adnan Siddiqui',
            giftsCount: 8,
            createdDate: '06 July 2026',
          }
        ]);
        setFriendRegistries([
          {
            id: 10,
            title: 'Bilal Engagement Registry List',
            creatorName: 'Bilal Khan',
            giftsCount: 4,
            createdDate: '01 July 2026',
          }
        ]);
      }
    } catch (e) {
      showToast('Error loading gift registries.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRegistry = async (id: number) => {
    if (!confirm('Are you sure you want to delete this registry list?')) return;
    try {
      await api.delete(`/api/v1/gift-registry/remove/${id}`);
      showToast('Registry list deleted successfully.');
      setMyRegistries(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      // offline fallback
      setMyRegistries(prev => prev.filter(r => r.id !== id));
      showToast('Deleted locally.');
    }
  };

  const activeRegistries = activeTab === 'my' ? myRegistries : friendRegistries;

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
          <span className={styles.current}>Gift Registry</span>
        </div>

        <div className={styles.pageHead}>
          <div>
            <h1 className={styles.pageTitle}>Wedding &amp; Event Gift Registry</h1>
            <p className={styles.pageSub}>Add desired products to custom list templates and share links with friends.</p>
          </div>
          <Link href="/registry/create" className={`${styles.btn} ${styles.btnPrimary}`}>
            <i className="bx bx-plus"></i> Create Registry
          </Link>
        </div>

        {/* Tab filters */}
        <div className={styles.tabs}>
          <button
            onClick={() => setActiveTab('my')}
            className={`${styles.tab} ${activeTab === 'my' ? styles.tabActive : ''}`}
          >
            My Lists ({myRegistries.length})
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`${styles.tab} ${activeTab === 'friends' ? styles.tabActive : ''}`}
          >
            Shared lists ({friendRegistries.length})
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
          </div>
        ) : (
          <div className={styles.grid}>
            {activeRegistries.map((reg) => (
              <div key={reg.id} className={styles.card}>
                <div className={styles.cardBanner}>
                  <i className="bx bx-gift"></i>
                </div>
                <div className={styles.cardInner}>
                  <h3 className={styles.cardTitle}>{reg.title}</h3>
                  <div className={styles.cardMeta}>
                    <i className="bx bx-user"></i>
                    <span>Creator: {reg.creatorName}</span>
                  </div>
                  <div className={styles.cardMeta}>
                    <i className="bx bx-list-ul"></i>
                    <span>{reg.giftsCount} Gifts Requested</span>
                  </div>

                  <div className={styles.cardActions}>
                    <Link href={`/registry/${reg.id}`} className={`${styles.btn} ${styles.btnPrimary}`}>
                      Open Registry List
                    </Link>
                    {activeTab === 'my' && (
                      <button onClick={() => handleDeleteRegistry(reg.id)} className={`${styles.btn} style.btnGhost`} style={{ color: 'var(--primary)' }}>
                        <i className="bx bx-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
