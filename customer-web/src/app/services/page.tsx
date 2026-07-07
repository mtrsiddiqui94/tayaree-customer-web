'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from './services.module.css';

interface StoreType {
  id: number;
  name: string;
  slug: string;
  endpointUri: string;
  imageUrl?: string;
}

export default function ServicesIndexPage() {
  const [categories, setCategories] = useState<StoreType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ status: boolean; data: any[] }>('/api/v1/store-types/list')
        .catch(() => ({ status: false, data: [] }));

      const parsed: StoreType[] = (res.data || []).map((c: any) => ({
        id: c.id,
        name: c.name || 'unset',
        slug: c.slug || 'unset',
        endpointUri: c.endpoint_uri || c.endpointUri || 'unset',
        imageUrl: c.image_url || c.imageUrl || '',
      }));

      if (parsed.length === 0) {
        // Fallback default categories
        const defaults: StoreType[] = [
          { id: 1, name: 'Venue Bookings', slug: 'venue', endpointUri: 'services/venue' },
          { id: 2, name: 'Catering Services', slug: 'catering', endpointUri: 'services/catering' },
          { id: 3, name: 'Stage Decoration', slug: 'decor', endpointUri: 'services/decor' },
          { id: 4, name: 'Mehndi Artists', slug: 'mehndi', endpointUri: 'services/mehndi' },
          { id: 5, name: 'Photography & Media', slug: 'photography', endpointUri: 'services/photography' },
          { id: 6, name: 'Mithai & Desserts', slug: 'mithai-walay', endpointUri: 'services/mithai-walay' },
          { id: 7, name: 'Tour Operators', slug: 'tour-operators', endpointUri: 'services/tour-operators' }
        ];
        setCategories(defaults);
      } else {
        setCategories(parsed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIconClass = (slug: string) => {
    switch (slug) {
      case 'venue': return 'bx-building-house';
      case 'catering': return 'bx-dish';
      case 'decor': return 'bx-palette';
      case 'mehndi': return 'bx-spa';
      case 'photography': return 'bx-camera';
      case 'mithai-walay': return 'bx-cookie';
      case 'tour-operators': return 'bx-map-alt';
      default: return 'bx-grid-alt';
    }
  };

  return (
    <>
      <Header />

      <main className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Services Catalog</span>
        </div>

        <div className={styles.pageHead}>
          <div>
            <h1 className={styles.pageTitle}>Explore Event Service Categories</h1>
            <p className={styles.pageSub}>Find verified vendors and comparison package tools across Pakistan.</p>
          </div>
        </div>

        {/* Search filter */}
        <div className={styles.searchBarContainer}>
          <i className="bx bx-search searchIcon"></i>
          <input
            type="text"
            placeholder="Search service categories (e.g. catering, venues...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredCategories.map((cat) => {
              const icon = getIconClass(cat.slug);
              return (
                <Link
                  key={cat.id}
                  href={`/services/${cat.slug}`}
                  className={styles.card}
                >
                  <div className={styles.iconWrap}>
                    <i className={`bx ${icon}`}></i>
                  </div>
                  <div className={styles.cardInner}>
                    <h3 className={styles.cardTitle}>{cat.name}</h3>
                    <span className={styles.cardCta}>
                      Explore Packages <i className="bx bx-chevron-right"></i>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
