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
import styles from '../page.module.css';

interface RegistryItem {
  id: number;
  productName: string;
  price: number;
  imageUrl?: string;
  vendorName: string;
  status: string;
}

interface RegistryDetail {
  id: number;
  title: string;
  occasion: string;
  visibility: string;
  coverUrl?: string;
  items: RegistryItem[];
}

export default function RegistryDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { fetchCartCount } = useCart();
  
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
      const res = await api.get<{ status: boolean; data: any }>(ENDPOINTS.GIFT_REGISTRY_DETAIL(id as string));
      if (res.data) {
        setRegistry({
          id: res.data.id,
          title: res.data.title || 'unset',
          occasion: res.data.occasion || 'unset',
          visibility: res.data.visibility || 'public',
          coverUrl: res.data.cover_url,
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

  const removeItem = async (itemId: number) => {
    try {
      await api.post(ENDPOINTS.GIFT_REGISTRY_REMOVE_ITEM, { registry_id: id, item_id: itemId });
      showToast('Item removed');
      loadDetail();
    } catch (e) {
      showToast('Failed to remove item', 'error');
    }
  };

  const moveToCart = async (itemId: number) => {
    try {
      await api.post(ENDPOINTS.GIFT_REGISTRY_MOVE_TO_CART, { registry_id: id, item_id: itemId });
      showToast('Item moved to cart');
      fetchCartCount();
      loadDetail();
    } catch (e) {
      showToast('Failed to move to cart', 'error');
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
          <Link href="/registry">Gift Registry</Link><span className={styles.sep}>/</span>
          <span className={styles.current}>{registry.title}</span>
        </div>

        <div className={styles.dashContent}>
            <div className={styles.heroBlock} style={{ backgroundImage: registry.coverUrl ? `url(${registry.coverUrl})` : 'none', background: !registry.coverUrl ? 'var(--primary-light)' : undefined, height: '180px', borderRadius: 'var(--radius-m)', position: 'relative', overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6))' }}></div>
              <div style={{ position: 'absolute', left: '20px', bottom: '16px', color: '#fff' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 800 }}>{registry.title}</h1>
                <p style={{ fontSize: '13px', fontWeight: 600, opacity: 0.9 }}>{registry.occasion} · {registry.visibility} registry</p>
              </div>
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Registry Items</h2>
            
            <div className={styles.grid}>
              {registry.items.length > 0 ? registry.items.map(item => (
                <div key={item.id} className={styles.itemCard} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', padding: '16px', display: 'flex', gap: '16px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: 'var(--surface)', flexShrink: 0, overflow: 'hidden' }}>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎁</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 700 }}>{item.productName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>by {item.vendorName}</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)', marginTop: '8px' }}>PKR {formatPrice(item.price)}</div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button onClick={() => moveToCart(item.id)} className={styles.btnPrimary} style={{ padding: '6px 12px', fontSize: '12px' }}>Move to Cart</button>
                      <button onClick={() => removeItem(item.id)} className={styles.btnOutline} style={{ padding: '6px 12px', fontSize: '12px' }}>Remove</button>
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
