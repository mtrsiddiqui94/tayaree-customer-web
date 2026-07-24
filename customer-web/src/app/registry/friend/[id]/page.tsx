'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/formatPrice';
import { ENDPOINTS } from '@/lib/constants';
import { useCart } from '@/context/CartContext';
import styles from '../../page.module.css';

interface RegistryItem {
  id: number;
  productName: string;
  price: number;
  imageUrl?: string;
  vendorName: string;
  status: 'available' | 'reserved' | 'purchased';
}

interface RegistryDetail {
  id: number;
  title: string;
  occasion: string;
  creatorName: string;
  coverUrl?: string;
  message?: string;
  items: RegistryItem[];
}

export default function RegistryFriendPage() {
  const router = useRouter();
  const { id } = useParams();
  const { refreshCartCount } = useCart();
  
  const [registry, setRegistry] = useState<RegistryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  async function loadDetail() {
    try {
      setIsLoading(true);
      // Wait, is there a specific friend detail endpoint? The flutter app uses /api/v1/gift-registry/friends/{id} or similar
      // The user instructions gave ENDPOINTS.GIFT_REGISTRY_DETAIL but said "registry friend view".
      // Let's assume we use the same detail endpoint but in "guest" mode based on token or a guest specific endpoint
      // We will just use the standard endpoint as it probably returns guest data if we don't own it.
      const res = await api.get<{ status: boolean; data: any }>(`/api/v1/gift-registry/friend/${id}`).catch(() => null) 
                    || await api.get<{ status: boolean; data: any }>(ENDPOINTS.GIFT_REGISTRY_DETAIL(id as string));
      
      if (res.data) {
        setRegistry({
          id: res.data.id,
          title: res.data.title || 'unset',
          occasion: res.data.occasion || 'unset',
          creatorName: res.data.creator_name || 'Your Friend',
          coverUrl: res.data.cover_url,
          message: res.data.message || 'Thank you for being part of our special day!',
          items: (res.data.items || []).map((i: any) => ({
            id: i.id,
            productName: i.product_name || 'unset',
            price: i.price || 0,
            imageUrl: i.image_url,
            vendorName: i.vendor_name || 'unset',
            status: i.status || 'available'
          }))
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const handleBuy = async (itemId: number) => {
    try {
      // Assuming a friend can add it to their cart
      await api.post(ENDPOINTS.CART_ADD, { product_id: itemId, is_registry_gift: true, registry_id: id });
      showToast('Added to your cart as a gift');
      refreshCartCount();
      loadDetail();
    } catch (e) {
      showToast('Failed to add to cart', 'error');
    }
  };

  if (isLoading) {
    return <><Header /><div style={{ textAlign: 'center', padding: '100px 0' }}><i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i></div><Footer /></>;
  }

  if (!registry) {
    return <><Header /><div style={{ textAlign: 'center', padding: '100px 0' }}>Registry not found</div><Footer /></>;
  }

  return (
    <>
      <Header />
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', right: '20px',
          backgroundColor: toast.type === 'success' ? 'var(--success)' : toast.type === 'error' ? 'var(--primary)' : '#0277bd',
          color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: 10000,
          boxShadow: 'var(--shadow-md)', fontFamily: 'Poppins, sans-serif', fontSize: '13px', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <i className={toast.type === 'success' ? 'bx bx-check-circle' : toast.type === 'error' ? 'bx bx-error-circle' : 'bx bx-info-circle'} style={{ fontSize: '18px' }}></i>
          {toast.message}
        </div>
      )}

      <main className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link><span className={styles.sep}>/</span>
          <span className={styles.current}>{registry.creatorName}'s Registry</span>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ backgroundImage: registry.coverUrl ? `url(${registry.coverUrl})` : 'none', background: !registry.coverUrl ? 'var(--primary-light)' : undefined, height: '220px', borderRadius: 'var(--radius-m)', position: 'relative', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6))' }}></div>
            <div style={{ position: 'absolute', left: '20px', bottom: '20px', color: '#fff' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 'var(--radius-full)', display: 'inline-block', marginBottom: '8px' }}>{registry.occasion}</div>
              <h1 style={{ fontSize: '28px', fontWeight: 800 }}>{registry.title}</h1>
              <p style={{ fontSize: '14px', fontWeight: 600, opacity: 0.9 }}>Hosted by {registry.creatorName}</p>
            </div>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', padding: '24px', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>A message from {registry.creatorName}</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>"{registry.message}"</p>
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Gift Wishlist</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {registry.items.length > 0 ? registry.items.map(item => (
              <div key={item.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', padding: '16px', display: 'flex', gap: '16px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: 'var(--surface)', flexShrink: 0, overflow: 'hidden' }}>
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎁</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700 }}>{item.productName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>by {item.vendorName}</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)', marginTop: '8px' }}>PKR {formatPrice(item.price)}</div>
                  
                  <div style={{ marginTop: '12px' }}>
                    {item.status === 'available' ? (
                      <button onClick={() => handleBuy(item.id)} className={styles.btnPrimary} style={{ padding: '6px 16px', fontSize: '12px', width: '100%', justifyContent: 'center' }}>Buy Gift</button>
                    ) : item.status === 'reserved' ? (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--amber)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><i className='bx bx-time'></i> Reserved</span>
                    ) : (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><i className='bx bx-check-circle'></i> Purchased</span>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No items in this registry yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
