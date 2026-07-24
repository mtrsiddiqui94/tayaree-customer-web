'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { ENDPOINTS, PAGINATION } from '@/lib/constants';
import { formatPrice } from '@/lib/formatPrice';
import styles from '../quotes.module.css';
import { useToast } from '@/context/ToastContext';

interface QuoteItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number | null;
  image_url: string | null;
}

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Default slug
  const storeTypeSlug = 'catering';

  useEffect(() => {
    const timeout = setTimeout(() => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login?redirect=/quotes');
        return;
      }
      fetchItems(1);
    }, 0);
    return () => clearTimeout(timeout);
  }, [router]);

  async function fetchItems(pageNum: number) {
    try {
      setLoading(true);
      setError(null);
      const limit = PAGINATION.QUOTES_LIMIT || 20;
      
      const response = await api.get<any>(`${ENDPOINTS.QUOTE_CATALOG_ITEMS(storeTypeSlug)}?page=${pageNum}&limit=${limit}`);
      
      if (response.success && response.data) {
        const body = response.data.data ? response.data : { data: response.data };
        const rows = body.data;
        
        const fetchedItems = Array.isArray(rows) ? rows : [];
        const currentPage = body.current_page || pageNum;
        const lastPage = body.last_page || 1;
        
        if (pageNum === 1) {
          setItems(fetchedItems);
        } else {
          setItems(prev => [...prev, ...fetchedItems]);
        }
        
        setPage(currentPage);
        setHasMore(currentPage < lastPage);
        setTotal(body.total || fetchedItems.length);
      } else {
        setError(response.message || 'Failed to load items');
        showToast(response.message || 'Failed to load items', 'error');
      }
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('An unexpected error occurred while loading items.');
      showToast('Error loading items', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleLoadMore() {
    if (!loading && hasMore) {
      fetchItems(page + 1);
    }
  }

  return (
    <>
      <Header />

      <main className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <Link href="/quotes">Quotes</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Package {params.id} Details</span>
        </div>

        <div className={styles.dashLayout}>
          <aside className={styles.dashSidebar}>
            <div className={styles.sidebarCard}>
              <nav className={styles.sidebarNav}>
                <div className={styles.sidebarNavLabel}>Activities</div>
                <Link href="/orders" className={styles.sidebarNavItem}><i className='bx bx-receipt'></i>Orders</Link>
                <Link href="/quotes" className={`${styles.sidebarNavItem} ${styles.active}`}><i className='bx bx-file-blank'></i>Quotes</Link>
                <Link href="/events" className={styles.sidebarNavItem}><i className='bx bx-calendar'></i>Events</Link>
                <Link href="/wishlist" className={styles.sidebarNavItem}><i className='bx bx-heart'></i>Wish List</Link>
              </nav>
            </div>
          </aside>

          <div className={styles.dashContent}>
            <Link href="/quotes" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '14px' }}>
              <i className='bx bx-chevron-left'></i>Back to Quotes
            </Link>
            
            <div className={styles.pageHead}>
              <h1 className={styles.pageTitle}>Package Items</h1>
              <div className={styles.pageSub} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span>{total} items available</span>
              </div>
            </div>

            <div className={styles.anonNote}>
              <i className='bx bxs-shield-alt-2'></i>
              <div className={styles.anonNoteS}>
                Vendors are <b>Tayaree-verified but anonymous</b>. Compare quotes and request revisions through Tayaree — a vendor's name and contact are revealed <b>only when you accept</b> their quote.
              </div>
            </div>

            {loading && page === 1 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '24px' }}></i>
                <div style={{ marginTop: '10px' }}>Loading items...</div>
              </div>
            ) : error && page === 1 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--primary)' }}>
                <i className="bx bx-error-circle" style={{ fontSize: '24px' }}></i>
                <div style={{ marginTop: '10px' }}>{error}</div>
                <button onClick={() => fetchItems(1)} className={styles.qbtn} style={{ marginTop: '16px' }}>Retry</button>
              </div>
            ) : items.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '44px 20px', fontSize: '13px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                No items found for this package.
              </div>
            ) : (
              <div>
                {items.map((item) => (
                  <div key={item.id} className={styles.qbCard}>
                    <div className={styles.qbTag}>Item</div>
                    <div className={styles.qbLabelRow}>
                      <div className={styles.qbAv}>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                        ) : (
                          <i className="bx bx-dish"></i>
                        )}
                      </div>
                      <div className={styles.qbLabel}>{item.name || 'Unnamed Item'}</div>
                    </div>
                    
                    <div className={styles.qbPrice}>
                      <div className={styles.qbPriceMain}>
                        <span className={styles.qbPriceLbl}>Item Price</span>
                        <span className={styles.qbPriceAmt}>{formatPrice(item.price)}</span>
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '12px' }}>
                      {item.description || 'No description available for this item.'}
                    </div>

                    <div className={styles.qbFoot}>
                      <Link href={`/quotes/${params.id}/review`} className={`${styles.qbtn} ${styles.qbtnPrimary}`} style={{ marginLeft: 'auto' }}>
                        <i className="bx bx-detail"></i> Review Quote
                      </Link>
                    </div>
                  </div>
                ))}
                
                {hasMore && (
                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button 
                      onClick={handleLoadMore} 
                      disabled={loading}
                      className={styles.qbtn}
                      style={{ padding: '10px 24px', height: 'auto' }}
                    >
                      {loading ? 'Loading...' : 'Load More Items'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
