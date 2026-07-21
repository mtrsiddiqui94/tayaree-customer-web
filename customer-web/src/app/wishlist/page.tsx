'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
  cat?: string;
  vendor?: string;
  rating?: string;
  count?: string;
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
      setTimeout(() => {
        router.push('/login?redirect=/wishlist');
      }, 0);
      return;
    }
    loadWishlist();
  }, []);

  async function loadWishlist() {
    try {
      setIsLoading(true);
      const res = await api.get<any>('/api/v1/profile/likes/list?limit=30&page=1').catch(() => null);

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
        cat: itm.cat || 'Service',
        vendor: itm.vendor || 'Tayaree Verified Vendor',
        rating: itm.rating || '4.8',
        count: itm.count || '124'
      }));

      setLikes(parsed);
    } catch (e) {
      showToast('Error loading wishlist.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  const handleRemoveLike = async (item: Service) => {
    try {
      const endpoint = item.endpoint_like_uri || (item.endpoint ? `${item.endpoint.replace(/\/\d+$/, '')}/like/${item.id}` : `services/venue/like/${item.id}`);
      
      // Send status: 0 for unlike as per Flutter repo POST implementation
      await api.post(`/api/v1/${endpoint}`, { status: 0 });
      
      showToast('Service removed from wishlist.');
      setLikes(prev => prev.filter(l => l.id !== item.id));
    } catch (e) {
      setLikes(prev => prev.filter(l => l.id !== item.id));
      showToast('Removed from wishlist.');
    }
  };

  return (
    <DashboardLayout breadcrumbTitle="Wish List">
          <div className={styles.dashContent}>
            <div className={styles.pageHead}>
              <div className={styles.pageTitle}>My Wish List</div>
              <div className={styles.pageSub}>Packages you've liked — revisit, compare, and book when you're ready.</div>
            </div>

            <div className={styles.wlFilters}>
              <button className={`${styles.wlFchip} ${styles.active}`}>All</button>
              <button className={styles.wlFchip}>Available soon</button>
              <button className={styles.wlFchip}>Price drop</button>
            </div>
            
            <div className={styles.wlCountRow}>
              <div className={styles.wlCount}><b>{likes.length}</b> saved packages</div>
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
              </div>
            ) : likes.length === 0 ? (
              <div className={styles.wlEmpty}>
                <i className="bx bx-heart"></i>
                <div className={styles.wlEmptyT}>Your wish list is empty</div>
              </div>
            ) : (
              <div className={styles.wlGrid}>
                {likes.map((item, idx) => {
                  const detailLink = `/${item.endpoint}/${item.slug}`;
                  const isTrending = idx === 0;
                  return (
                    <Link href={detailLink} key={idx} className={styles.wlCard} style={{ textDecoration: 'none' }}>
                      <div className={styles.wlImg}>
                        <img
                          src={item.image_url}
                          alt={item.name}
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=350&q=80';
                          }}
                        />
                        {isTrending && <div className={styles.wlBadge}>TRENDING</div>}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveLike(item);
                          }}
                          className={styles.wlHeart}
                          title="Remove from wish list"
                        >
                          <i className="bx bxs-heart"></i>
                        </button>
                        <div className={styles.wlVerified}>
                          <i className="bx bx-check-shield"></i>Verified
                        </div>
                      </div>
                      
                      <div className={styles.wlBody}>
                        <div className={styles.wlCat}>{item.cat}</div>
                        <div className={styles.wlName}>{item.name}</div>
                        <div className={styles.wlVendor}>
                          <i className="bx bx-store"></i>{item.vendor}
                        </div>
                        
                        <div className={styles.wlMeta}>
                          <span className={styles.wlChip}><i className="bx bx-group"></i>Serves 150+</span>
                          <span className={styles.wlChip}><i className="bx bxs-truck"></i>Same-day</span>
                        </div>
                        
                        <div className={styles.wlStars}>
                          <span className={styles.st}>★</span>{item.rating} <span className={styles.ct}>({item.count})</span>
                        </div>
                        
                        <div className={styles.wlPriceRow}>
                          <span className={styles.wlPrice}>{formatPrice(item.package_discounted_price || item.price)}</span>
                          {item.package_discounted_price && (
                            <span className={styles.wlOld}>{formatPrice(item.price)}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
        </div>
    </DashboardLayout>
  );
}
