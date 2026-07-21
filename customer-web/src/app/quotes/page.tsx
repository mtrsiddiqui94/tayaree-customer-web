'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { ENDPOINTS, PAGINATION } from '@/lib/constants';
import { formatPrice } from '@/lib/formatPrice';
import styles from './quotes.module.css';
import { useToast } from '@/context/ToastContext';

interface QuotePackage {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  minimum_guests: number | null;
}

export default function QuotesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [packages, setPackages] = useState<QuotePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Default slug, could be made dynamic later
  const storeTypeSlug = 'catering';

  useEffect(() => {
    // Client-side hydration wrapper for localStorage
    const timeout = setTimeout(() => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login?redirect=/quotes');
        return;
      }
      fetchPackages(1);
    }, 0);
    return () => clearTimeout(timeout);
  }, [router]);

  async function fetchPackages(pageNum: number) {
    try {
      setLoading(true);
      setError(null);
      const limit = PAGINATION.QUOTES_LIMIT || 20;
      
      const response = await api.get(`${ENDPOINTS.QUOTE_CATALOG_PACKAGES(storeTypeSlug)}?page=${pageNum}&limit=${limit}`);
      
      if (response.success && response.data) {
        // Handle varying envelope shapes based on backend implementation
        const body = response.data.data ? response.data : { data: response.data };
        const rows = body.data;
        
        const items = Array.isArray(rows) ? rows : [];
        const currentPage = body.current_page || pageNum;
        const lastPage = body.last_page || 1;
        
        if (pageNum === 1) {
          setPackages(items);
        } else {
          setPackages(prev => [...prev, ...items]);
        }
        
        setPage(currentPage);
        setHasMore(currentPage < lastPage);
        setTotal(body.total || items.length);
      } else {
        setError(response.message || 'Failed to load quotes');
        showToast(response.message || 'Failed to load quotes', 'error');
      }
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError('An unexpected error occurred while loading quotes.');
      showToast('Error loading quotes', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleLoadMore() {
    if (!loading && hasMore) {
      fetchPackages(page + 1);
    }
  }

  return (
    <DashboardLayout breadcrumbTitle="Quotes Dashboard">
      <div className={styles.dashContent}>
            <div className={styles.pageHead}>
              <h1 className={styles.pageTitle}>Quotes</h1>
              <p className={styles.pageSub}>Anonymous bids from Tayaree-verified vendors for your events.</p>
            </div>

            <div className={styles.anonNote}>
              <i className='bx bxs-shield-alt-2'></i>
              <div>
                <div className={styles.anonNoteT}>Your quotes are anonymous</div>
                <div className={styles.anonNoteS}>
                  Vendors bid on your requirements without seeing your name or contact details. Compare freely — a vendor's identity is only revealed once you accept their quote.
                </div>
              </div>
            </div>

            <div className={styles.qevent}>
              <div className={styles.qeventHead}>
                <h3 className={styles.qeventTitle}>Available Packages ({total})</h3>
              </div>

              {loading && page === 1 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '24px' }}></i>
                  <div style={{ marginTop: '10px' }}>Loading packages...</div>
                </div>
              ) : error && page === 1 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--primary)' }}>
                  <i className="bx bx-error-circle" style={{ fontSize: '24px' }}></i>
                  <div style={{ marginTop: '10px' }}>{error}</div>
                  <button onClick={() => fetchPackages(1)} className={styles.qbtn} style={{ marginTop: '16px' }}>Retry</button>
                </div>
              ) : packages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px', fontSize: '13px', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  No packages available at the moment.
                </div>
              ) : (
                <>
                  {packages.map((pkg) => (
                    <Link key={pkg.id} href={`/quotes/${pkg.id}`} className={styles.qcard}>
                      <div className={styles.qcardIc}>
                        {pkg.image_url ? (
                          <img src={pkg.image_url} alt={pkg.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                        ) : (
                          <i className="bx bx-package"></i>
                        )}
                      </div>
                      <div className={styles.qcardMain}>
                        <div className={styles.qcardName}>{pkg.name || 'Unnamed Package'}</div>
                        <div className={styles.qcardMeta}>
                          <span className={`${styles.qbadge} ${styles.qbadgeNew}`}>Package</span>
                          <span>·</span>
                          <span>{pkg.minimum_guests ? `Min ${pkg.minimum_guests} guests` : 'Flexible guests'}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {pkg.description || 'No description provided'}
                        </div>
                      </div>
                      <div className={styles.qcardBest}>
                        <div className={styles.qcardBestLbl}>Base Price</div>
                        <div className={styles.qcardBestAmt}>{formatPrice(pkg.price)}</div>
                        <span className={styles.qcardCta} style={{ marginTop: '8px' }}>
                          <i className="bx bx-right-arrow-alt"></i> View Details
                        </span>
                      </div>
                    </Link>
                  ))}
                  
                  {hasMore && (
                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                      <button 
                        onClick={handleLoadMore} 
                        disabled={loading}
                        className={styles.qbtn}
                        style={{ padding: '10px 24px', height: 'auto' }}
                      >
                        {loading ? 'Loading...' : 'Load More'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
      </div>
    </DashboardLayout>
  );
}
