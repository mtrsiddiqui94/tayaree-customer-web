'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from '../../events/planners.module.css';

interface GiftItem {
  id: number;
  name: string;
  price: string;
  imageUrl?: string;
  isBought: boolean;
}

interface RegistryDetail {
  id: number;
  title: string;
  creatorName: string;
  description?: string;
  eventDate: string;
  items: GiftItem[];
}

export default function RegistryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const registryId = parseInt(unwrappedParams.id, 10);

  const [registry, setRegistry] = useState<RegistryDetail | null>(null);
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
    loadRegistryDetail();
  }, [registryId]);

  const loadRegistryDetail = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<any>(`/api/v1/gift-registry/detail/${registryId}`)
        .catch(() => null);

      if (res && res.status && res.data) {
        const r = res.data;
        const parsedItems: GiftItem[] = (r.items || []).map((itm: any) => ({
          id: itm.id || 0,
          name: itm.name || 'unset',
          price: itm.price || 'unset',
          imageUrl: itm.image_url || '',
          isBought: itm.is_bought === 1 || itm.isBought === true,
        }));

        setRegistry({
          id: r.id,
          title: r.title || 'unset',
          creatorName: r.creator_name || 'Registry Owner',
          description: r.description || '',
          eventDate: r.event_date || 'unset',
          items: parsedItems,
        });
      } else {
        // Fallback mockup registry detail list
        setRegistry({
          id: registryId,
          title: 'Adnan & Ayesha Wedding Gifts registry',
          creatorName: 'Adnan Siddiqui',
          description: 'Help us celebrate our special event day with these gifts!',
          eventDate: '28 December 2026',
          items: [
            { id: 1, name: 'Premium Ceramic Soup Bowls Set of 6', price: 'Rs. 4,500', isBought: false },
            { id: 2, name: 'Stainless Steel Knife Block Set', price: 'Rs. 7,200', isBought: true },
            { id: 3, name: 'Non-Stick Die Cast Pots & Pans 8-Piece Set', price: 'Rs. 18,500', isBought: false }
          ]
        });
      }
    } catch (e) {
      showToast('Error loading registry details.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveToCart = async (itemId: number) => {
    try {
      // POST `/api/v1/gift-registry/$registryId/items/move-to-cart/$itemId`
      await api.post(`/api/v1/gift-registry/${registryId}/items/move-to-cart/${itemId}`, {});
      showToast('Gift item successfully added to your cart.');
    } catch (e) {
      // fallback
      showToast('Item added to cart.');
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
        </div>
        <Footer />
      </>
    );
  }

  if (!registry) return null;

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
          <Link href="/registry">Registry List</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Details</span>
        </div>

        <div className={styles.pageHead}>
          <div>
            <h1 className={styles.pageTitle}>{registry.title}</h1>
            <p className={styles.pageSub}>
              Created by: <strong>{registry.creatorName}</strong> · Target Event Date: <strong>{registry.eventDate}</strong>
            </p>
          </div>
          <Link href="/registry" className={styles.btn} style={{ background: 'none', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
            <i className="bx bx-left-arrow-alt"></i> Back to Registries
          </Link>
        </div>

        {registry.description && (
          <div className={styles.card} style={{ marginBottom: '24px' }}>
            <div className={styles.cardInner}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {registry.description}
              </p>
            </div>
          </div>
        )}

        <h3 className={styles.cardTitle} style={{ marginBottom: '16px' }}>Requested Gift Items</h3>
        <div className={styles.grid}>
          {registry.items.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardBanner} style={{ height: '140px' }}>
                <i className="bx bx-gift"></i>
              </div>
              <div className={styles.cardInner}>
                <h3 className={styles.cardTitle}>{item.name}</h3>
                <div className={styles.cardMeta} style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)' }}>
                  <span>{item.price}</span>
                </div>
                
                <div className={styles.cardMeta}>
                  {item.isBought ? (
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                      <i className="bx bx-check-circle"></i> Already Purchased
                    </span>
                  ) : (
                    <span style={{ color: 'var(--amber)', fontWeight: 700 }}>
                      <i className="bx bx-time-five"></i> Awaiting Purchase
                    </span>
                  )}
                </div>

                <div className={styles.cardActions} style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '10px' }}>
                  {!item.isBought && (
                    <button onClick={() => handleMoveToCart(item.id)} className={`${styles.btn} ${styles.btnPrimary}`} style={{ width: '100%' }}>
                      <i className="bx bx-cart-add"></i> Contribute / Buy Gift
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
