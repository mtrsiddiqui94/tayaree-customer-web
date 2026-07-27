'use client';

/* eslint-disable @next/next/no-img-element, react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import styles from './packages.module.css';

interface Service {
  service_id: number;
  endpoint: string;
  slug: string;
  name: string;
  item_name: string;
  rating: number;
  reviews_count: number;
  image_url: string;
  original_price: string;
  discount_percentage: number;
  price_discount?: number;
  price: string;
  package_discounted_price?: string;
  discounted_price?: string;
  is_verified?: boolean;
  verified?: boolean;
  location?: string;
  vendor_location?: string;
  area?: string;
}

interface PageProps {
  params: Promise<{ category: string }>;
}

export default function CategoryPackagesPage({ params }: PageProps) {
  const { showToast } = useToast();
  const { category } = React.use(params);

  const [packages, setPackages] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const categoryTitle = category
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : 'Packages';

  const formatPrice = (val: string | number | undefined | null) => {
    if (val === undefined || val === null || val === '') return 'unset';
    const valStr = val.toString().trim();
    if (valStr === 'unset') return valStr;
    let formatted = valStr.replace(/,/g, '').replace(/\b\d+\b/g, (match: string) => {
      const num = parseInt(match, 10);
      return num.toLocaleString('en-US');
    });
    if (!formatted.includes('PKR') && !formatted.includes('%') && !formatted.startsWith('/') && !formatted.includes('per')) {
      if (formatted.toLowerCase().includes('starts from')) {
        formatted = formatted.replace(/(starts from\s*)/i, '$1PKR ');
      } else {
        formatted = `PKR ${formatted}`;
      }
    }
    return formatted;
  };

  async function loadPackages() {
    if (!category) return;
    setIsLoading(true);
    try {
      const res = await api.get<{ status: boolean; data: Service[] }>(
        `/api/v1/services/${category}?limit=30&page=1`
      );
      if (res.status && res.data) {
        setPackages(res.data);
      } else {
        setPackages([]);
      }
    } catch (e) {
      console.error('Error loading packages:', e);
      showToast(`Failed to load ${categoryTitle} packages.`, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPackages();
    }, 0);
    return () => clearTimeout(timer);
  }, [category]);

  const filteredPackages = packages.filter(p =>
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.item_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />

      <main className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <Link href="/services">Services</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>{categoryTitle} Packages</span>
        </div>

        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>{categoryTitle} Packages</h1>
            <p className={styles.pageSub}>
              Discover premium {categoryTitle.toLowerCase()} packages and customize details.
            </p>
          </div>

          <div className={styles.searchBox}>
            <i className={`bx bx-search ${styles.searchIcon}`}></i>
            <input
              type="text"
              placeholder="Search packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loaderWrap}>
            <div className={styles.spinner}></div>
            <p>Loading catalog packages...</p>
          </div>
        ) : filteredPackages.length > 0 ? (
          <div className={styles.grid}>
            {filteredPackages.map((p) => {
              const displayPrice = p.package_discounted_price || p.discounted_price || p.price;
              const hasDiscount = p.discount_percentage > 0;
              const isVerified = p.is_verified || p.verified;

              return (
                <div key={p.service_id} className={styles.card}>
                  <div className={styles.imgWrap}>
                    <img
                      src={p.image_url || '/placeholder.png'}
                      alt={p.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=600&h=338&q=80';
                      }}
                    />
                    {hasDiscount && (
                      <div className={styles.badge}>{p.discount_percentage}% OFF</div>
                    )}
                    {isVerified && (
                      <div className={styles.verified}>
                        <i className="bx bxs-check-shield"></i> Verified
                      </div>
                    )}
                  </div>

                  <div className={styles.cardBody}>
                    <h3 className={styles.name}>{p.name || 'unset'}</h3>
                    <div className={styles.vendor}>
                      <i className="bx bx-store"></i>
                      <span>{p.item_name || 'unset'}</span>
                    </div>

                    <div className={styles.priceRow}>
                      <span className={styles.price}>{formatPrice(displayPrice)}</span>
                      {hasDiscount && p.original_price && (
                        <span className={styles.oldPrice}>{formatPrice(p.original_price)}</span>
                      )}
                    </div>

                    <div className={styles.metaRow}>
                      <div className={styles.rating}>
                        <i className="bx bxs-star"></i>
                        <span>{p.rating ? p.rating.toFixed(1) : 'unset'}</span>
                        {p.reviews_count !== undefined && (
                          <span className={styles.reviewsCount}>({p.reviews_count})</span>
                        )}
                      </div>
                      {p.location || p.vendor_location ? (
                        <div className={styles.location}>
                          <i className="bx bx-map"></i> {p.location || p.vendor_location || 'unset'}
                        </div>
                      ) : (
                        <div className={styles.location}>unset</div>
                      )}
                    </div>

                    <Link
                      href={`/services/${category}/${p.slug}`}
                      style={{
                        marginTop: '16px',
                        background: '#D71921',
                        color: '#fff',
                        textAlign: 'center',
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'block',
                      }}
                    >
                      View Package Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.noResults}>
            <i className="bx bx-package"></i>
            <h3>No Packages Found</h3>
            <p>We could not find any active packages matching your filters.</p>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
