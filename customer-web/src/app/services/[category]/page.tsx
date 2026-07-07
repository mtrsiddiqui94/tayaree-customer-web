'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import styles from './service-listing.module.css';

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
  [key: string]: any;
}

interface PageProps {
  params: Promise<{ category: string }>;
}

export default function CategoryListingPage({ params }: PageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { category } = React.use(params);

  // States
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [maxPriceLimit, setMaxPriceLimit] = useState(300000);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState('popular');

  // Format Page Title
  const categoryTitle = category
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : 'Services';

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
    async function loadCategoryServices() {
      if (!category) return;
      setIsLoading(true);
      try {
        // Fetch services using dynamic category endpoint
        const res = await api.get<{ status: boolean; data: Service[] }>(
          `/api/v1/services/${category}?limit=30&page=1`
        );
        if (res.status && res.data) {
          setServices(res.data);
        } else {
          setServices([]);
        }
      } catch (e) {
        console.error('Error loading category catalog:', e);
        showToast(`Failed to load ${categoryTitle} services.`, 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadCategoryServices();
  }, [category]);

  const clearAllFilters = () => {
    setMaxPriceLimit(300000);
    setSelectedRating(null);
    showToast('Filters reset.', 'info');
  };

  const getNumericPrice = (priceStr: string | number | undefined | null): number => {
    if (priceStr === undefined || priceStr === null || priceStr === '') return 0;
    if (typeof priceStr === 'number') return priceStr;
    const cleaned = priceStr.toString().replace(/[^0-9]/g, '');
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // Dynamic filter application
  const filteredServices = services
    .filter((svc) => {
      // Price Check
      const price = getNumericPrice(svc.package_discounted_price || svc.discounted_price || svc.price);
      if (price > maxPriceLimit) return false;

      // Rating Check
      if (selectedRating !== null && svc.rating < selectedRating) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOption === 'price_asc') {
        return getNumericPrice(a.package_discounted_price || a.discounted_price || a.price) - getNumericPrice(b.package_discounted_price || b.discounted_price || b.price);
      }
      if (sortOption === 'price_desc') {
        return getNumericPrice(b.package_discounted_price || b.discounted_price || b.price) - getNumericPrice(a.package_discounted_price || a.discounted_price || a.price);
      }
      if (sortOption === 'rating') {
        return b.rating - a.rating;
      }
      return (b.reviews_count || 0) - (a.reviews_count || 0); // popular
    });

  return (
    <>
      <Header />

      <main className={styles.main}>
        {/* BREADCRUMB */}
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <Link href="/services">Services</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>{categoryTitle}</span>
        </div>

        {/* PAGE HEADER */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{categoryTitle} Packages</h1>
          <p className={styles.pageDesc}>
            Browse top-rated vetted {categoryTitle.toLowerCase()} services and packages.
          </p>
        </div>

        <div className={styles.layout}>
          {/* Sidebar Filters */}
          <aside className={styles.sidebar}>
            <div className={styles.filterCard}>
              <div className={styles.filterTitleRow}>
                <span className={styles.filterTitle}>Filters</span>
                <button onClick={clearAllFilters} className={styles.filterClear}>
                  Clear All
                </button>
              </div>

              {/* Price range */}
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Max Price (PKR)</span>
                <div className={styles.rangeLabels}>
                  <span>Rs. 0</span>
                  <span>Rs. {maxPriceLimit.toLocaleString()}</span>
                </div>
                <div className={styles.sliderTrack}>
                  <div
                    className={styles.sliderFill}
                    style={{ right: `${100 - (maxPriceLimit / 300000) * 100}%` }}
                  ></div>
                  <div className={`${styles.sliderThumb} ${styles.l}`}></div>
                  <div
                    className={`${styles.sliderThumb} ${styles.r}`}
                    style={{ left: `${(maxPriceLimit / 300000) * 100}%` }}
                  ></div>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="300000"
                  step="5000"
                  value={maxPriceLimit}
                  onChange={(e) => setMaxPriceLimit(Number(e.target.value))}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    accentColor: 'var(--primary)',
                    cursor: 'pointer',
                  }}
                />
              </div>

              {/* Ratings filter */}
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Minimum Rating</span>
                {[5, 4, 3].map((stars) => {
                  const isActive = selectedRating === stars;
                  return (
                    <button
                      key={stars}
                      onClick={() =>
                        setSelectedRating(selectedRating === stars ? null : stars)
                      }
                      className={`${styles.ratingRow} ${
                        isActive ? styles.ratingRowActive : ''
                      }`}
                    >
                      <div className={styles.starsD}>
                        {Array(5)
                          .fill(0)
                          .map((_, i) => (
                            <i
                              key={i}
                              className={`bx bxs-star ${
                                i >= stars ? styles.starE : ''
                              }`}
                            ></i>
                          ))}
                      </div>
                      <span className={styles.ratingVal}>{stars}.0 &amp; Up</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main listings grid */}
          <section className={styles.catalogMain}>
            <div className={styles.catalogTopbar}>
              <div className={styles.statsLabel}>
                Showing <strong>{filteredServices.length}</strong> standard pack
                listings
              </div>
              <div className={styles.sortControls}>
                <select
                  className={styles.sortSel}
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="popular">Sort by: Popularity</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Rating: High to Low</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className={styles.loadingText}>
                <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '28px', color: 'var(--primary)', marginBottom: '10px', display: 'block' }}></i>
                Loading {categoryTitle.toLowerCase()} services...
              </div>
            ) : (
              <>
                <div className={styles.serviceGrid}>
                  {filteredServices.length > 0 ? (
                    filteredServices.map((svc, idx) => {
                      const discount = Number(svc.discount_percentage || svc.price_discount || 0);
                      const isVerified = svc.is_verified || svc.verified;
                      const displayLocation = svc.location || svc.vendor_location || svc.area;
                      const displayPrice = svc.package_discounted_price || svc.discounted_price || svc.price || 'unset';

                      return (
                        <Link
                          href={`/${svc.endpoint}/${svc.slug}`}
                          key={idx}
                          className={styles.svcCard}
                        >
                          <div className={styles.svcImg}>
                            <img
                              src={svc.image_url}
                              alt={svc.name}
                              onError={(e) => {
                                e.currentTarget.src =
                                  'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=400&q=80';
                              }}
                            />
                            {discount > 0 && (
                              <span className={styles.svcBadge}>
                                {discount.toFixed(0)}% OFF
                              </span>
                            )}
                            <button
                              className={styles.svcHeart}
                              onClick={(e) => {
                                e.preventDefault();
                                showToast(`${svc.name} added to wishlist!`, 'success');
                              }}
                            >
                              <i className="bx bx-heart"></i>
                            </button>
                            {isVerified && (
                              <span className={styles.svcVerifiedTag}>
                                <i className="bx bxs-badge-check"></i>Verified
                              </span>
                            )}
                          </div>
                          <div className={styles.svcInfo}>
                            <div>
                              <h3 className={styles.svcName}>{svc.name || 'unset'}</h3>
                              <span className={styles.svcVendor}>
                                {svc.item_name || 'unset'}
                                {displayLocation ? ` · ${displayLocation}` : ''}
                              </span>
                            </div>
                            <div className={styles.svcFooter}>
                              <div className={styles.svcPriceRow}>
                                <div className={styles.svcPrice}>
                                  {formatPrice(displayPrice)}
                                </div>
                                {discount > 0 && svc.original_price && (
                                  <div className={styles.svcMrkt}>
                                    <s>{formatPrice(svc.original_price)}</s>
                                  </div>
                                )}
                              </div>
                              <div className={styles.svcStars}>
                                <i className="bx bxs-star star"></i>
                                <span>
                                  {svc.rating !== undefined && svc.rating !== null ? Number(svc.rating).toFixed(1) : 'unset'}
                                </span>
                                <span style={{ color: 'var(--text-muted)' }}>
                                  ({svc.reviews_count || 0})
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className={styles.emptyText}>
                      No services match your filters in this category.
                    </div>
                  )}
                </div>

                {filteredServices.length > 0 && (
                  <div className={styles.pagination}>
                    <button className={`${styles.pgBtn} ${styles.pgBtnDisabled}`}>
                      <i className="bx bx-chevron-left"></i>
                    </button>
                    <button className={`${styles.pgBtn} ${styles.pgBtnActive}`}>
                      1
                    </button>
                    <button className={styles.pgBtn}>2</button>
                    <button className={styles.pgBtn}>
                      <i className="bx bx-chevron-right"></i>
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
