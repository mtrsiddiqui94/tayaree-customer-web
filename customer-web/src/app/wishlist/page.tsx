'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from './wishlist.module.css';

interface Service {
  id: number;
  name: string;
  item_name: string;
  price: string;
  package_discounted_price?: string;
  image_url: string;
  endpoint?: string;
  endpoint_like_uri?: string;
  slug?: string;
}

export default function WishlistPage() {
  const router = useRouter();
  const [likes, setLikes] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatPrice = (val: any) => {
    if (val === undefined || val === null || val === '') return 'unset';
    const valStr = val.toString();
    if (valStr.includes('PKR') || valStr === 'unset') return valStr;
    if (/^\d+(\.\d+)?$/.test(valStr)) {
      const parsedNum = parseFloat(valStr);
      return `PKR ${parsedNum.toLocaleString('en-US')}`;
    }
    return `PKR ${valStr}`;
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/wishlist');
      return;
    }
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setIsLoading(true);
      // Fetch wishlist items
      const res = await api.get<any>('/api/v1/profile/likes/list?limit=30&page=1')
        .catch(() => null);

      // Resolve structure mapping Dart Mapper (Round 180)
      const rawData = res?.data?.data || res?.data || [];
      const parsed: Service[] = rawData.map((itm: any) => ({
        id: itm.id || 0,
        name: itm.name || 'unset',
        item_name: itm.item_name || 'unset',
        price: itm.price || 'unset',
        package_discounted_price: itm.package_discounted_price || itm.discounted_price || undefined,
        image_url: itm.image_url || itm.imageUrl || '',
        endpoint: itm.endpoint || itm.endpoint_uri || 'services/venue',
        endpoint_like_uri: itm.endpoint_like_uri || itm.endpointLikeUri || '',
        slug: itm.slug || '',
      }));

      setLikes(parsed);
    } catch (e) {
      showToast('Error loading wishlist.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLike = async (item: Service) => {
    try {
      const endpoint = item.endpoint_like_uri || (item.endpoint ? `${item.endpoint.replace(/\/\d+$/, '')}/like/${item.id}` : `services/venue/like/${item.id}`);
      // Delete request to `/api/v1/$endpoint`
      await api.delete(`/api/v1/${endpoint}`);
      showToast('Service removed from wishlist.');
      setLikes(prev => prev.filter(l => l.id !== item.id));
    } catch (e) {
      // offline fallback
      setLikes(prev => prev.filter(l => l.id !== item.id));
      showToast('Removed from wishlist.');
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
          <span className={styles.current}>Wishlist</span>
        </div>

        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>My Liked Services Portfolio</h1>
          <p className={styles.pageSub}>Quickly review services saved from categories listings.</p>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
          </div>
        ) : likes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <i className="bx bx-heart" style={{ fontSize: '48px', color: 'var(--text-muted)' }}></i>
            <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>Your liked items portfolio is currently empty.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {likes.map((item, idx) => {
              const detailLink = `/${item.endpoint}/${item.slug}`;
              return (
                <div key={idx} className={styles.card}>
                  <div className={styles.cardImgWrap}>
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className={styles.cardImg}
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=350&q=80';
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveLike(item);
                      }}
                      className={styles.wlHeart}
                      title="Remove from wishlist"
                    >
                      <i className="bx bxs-heart"></i>
                    </button>
                  </div>
                  <div className={styles.cardInner}>
                    <h3 className={styles.cardTitle}>{item.name}</h3>
                    <span className={styles.cardVendor}>{item.item_name}</span>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '10px' }}>
                      <span className={styles.cardPrice}>
                        {formatPrice(item.package_discounted_price || item.price)}
                      </span>
                    </div>

                    <div className={styles.cardActions}>
                      <Link href={detailLink} className={styles.btnPrimary}>
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
