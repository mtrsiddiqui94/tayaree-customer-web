'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import styles from './search.module.css';

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

interface StoreType {
  id: number;
  name: string;
  slug: string;
  endpoint_uri: string;
  image_url: string;
  [key: string]: any;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  const queryParam = searchParams.get('q') || '';

  // Inputs
  const [searchInputValue, setSearchInputValue] = useState(queryParam);
  const [activeQuery, setActiveQuery] = useState(queryParam);

  // Data States
  const [services, setServices] = useState<Service[]>([]);
  const [storeTypes, setStoreTypes] = useState<StoreType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter States
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([]);
  const [maxPriceLimit, setMaxPriceLimit] = useState(300000); // 3 Lacs Default max
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // History states
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const trendingChips = ['Catering', 'Banquets', 'Decorators', 'Mehndi', 'Portraits'];

  // Load Store Types
  useEffect(() => {
    async function loadStoreTypes() {
      try {
        const res = await api.get<{ status: boolean; data: StoreType[] }>(
          '/api/v1/store-types/list'
        );
        if (res.status && res.data) {
          setStoreTypes(res.data);
        }
      } catch (e) {
        console.error('Error fetching store types:', e);
      }
    }
    loadStoreTypes();

    // Load recent searches from localStorage
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Update query state on URL change
  useEffect(() => {
    setSearchInputValue(queryParam);
    setActiveQuery(queryParam);
    if (queryParam) {
      performSearch(queryParam);
      saveSearchQuery(queryParam);
    } else {
      setServices([]);
    }
  }, [queryParam]);

  // API search call
  const performSearch = async (searchVal: string) => {
    setIsLoading(true);
    try {
      const res = await api.get<{ status: boolean; data: Service[] }>(
        `/api/v1/services/search?limit=30&page=1&search=${encodeURIComponent(
          searchVal
        )}`
      );
      if (res.status && res.data) {
        setServices(res.data);
      } else {
        setServices([]);
      }
    } catch (e) {
      console.error('Search error:', e);
      showToast('Failed to fetch search results.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSearchQuery = (val: string) => {
    if (!val.trim()) return;
    const clean = val.trim();
    setRecentSearches((prev) => {
      const updated = [clean, ...prev.filter((s) => s !== clean)].slice(0, 5);
      localStorage.setItem('recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentSearches = () => {
    localStorage.removeItem('recent_searches');
    setRecentSearches([]);
    showToast('Recent searches cleared.', 'info');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInputValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInputValue.trim())}`);
    }
  };

  const handleRecentClick = (text: string) => {
    router.push(`/search?q=${encodeURIComponent(text)}`);
  };

  const toggleEndpointFilter = (endpoint: string) => {
    setSelectedEndpoints((prev) =>
      prev.includes(endpoint)
        ? prev.filter((item) => item !== endpoint)
        : [...prev, endpoint]
    );
  };

  const clearAllFilters = () => {
    setSelectedEndpoints([]);
    setMaxPriceLimit(300000);
    setSelectedRating(null);
    showToast('Filters cleared.', 'info');
  };

  // Helper to extract numbers from price strings
  const getNumericPrice = (priceStr: string): number => {
    if (!priceStr) return 0;
    const cleaned = priceStr.replace(/[^0-9]/g, '');
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // Local filtering logic
  const filteredServices = services
    .filter((svc) => {
      // 1. Endpoint category filter
      if (selectedEndpoints.length > 0) {
        // e.g. svc.endpoint is "services/venue", matching storeType.endpoint_uri "services/venue"
        const matches = selectedEndpoints.some((ep) => svc.endpoint === ep);
        if (!matches) return false;
      }

      // 2. Price filter
      const svcPrice = getNumericPrice(svc.package_discounted_price || svc.discounted_price || svc.price);
      if (svcPrice > maxPriceLimit) {
        return false;
      }

      // 3. Rating filter
      if (selectedRating !== null) {
        if (svc.rating < selectedRating) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Sorting
      if (sortOption === 'price_asc') {
        return getNumericPrice(a.package_discounted_price || a.discounted_price || a.price) - getNumericPrice(b.package_discounted_price || b.discounted_price || b.price);
      }
      if (sortOption === 'price_desc') {
        return getNumericPrice(b.package_discounted_price || b.discounted_price || b.price) - getNumericPrice(a.package_discounted_price || a.discounted_price || a.price);
      }
      if (sortOption === 'rating') {
        return b.rating - a.rating;
      }
      // default: 'popular' by reviews count
      return (b.reviews_count || 0) - (a.reviews_count || 0);
    });

  return (
    <>
      <Header />

      {/* HERO SEARCH BAR */}
      <div className={styles.heroSearchSection}>
        <div className={styles.heroInner}>
          <div className={styles.heroHeading}>
            <h1>Find Wedding Services &amp; Vendors</h1>
            <p>Search catering, venues, decor, photography and more across Pakistan</p>
          </div>
          <form onSubmit={handleSearchSubmit} className={styles.heroBar}>
            <div className={styles.heroBarIcon}>
              <i className="bx bx-search"></i>
            </div>
            <input
              type="text"
              placeholder="Search services, venues, vendors..."
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
            />
            <div className={styles.heroBarDivider}></div>
            <div className={styles.heroBarMic}>
              <i className="bx bx-microphone"></i>
            </div>
            <button type="submit" className={styles.heroBarBtn}>
              <i className="bx bx-search"></i>Search
            </button>
          </form>
        </div>
      </div>

      <main style={{ minHeight: '60vh' }}>
        {/* STATE A — EMPTY (before any search or field is empty) */}
        {!activeQuery ? (
          <div className={styles.emptyStateWrap}>
            <aside className={styles.esSidebar}>
              {recentSearches.length > 0 && (
                <div className={styles.esSidebarCard}>
                  <div className={styles.esSidebarHead}>
                    <span className={styles.esSidebarTitle}>Recent Searches</span>
                    <button
                      onClick={clearRecentSearches}
                      className={styles.esSidebarClear}
                    >
                      Clear All
                    </button>
                  </div>
                  {recentSearches.map((search, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleRecentClick(search)}
                      className={styles.esRecentRow}
                    >
                      <i className="bx bx-history esRecentIcon"></i>
                      <span className={styles.esRecentText}>{search}</span>
                      <button
                        className={styles.esRecentClose}
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecentSearches((prev) => {
                            const updated = prev.filter((s) => s !== search);
                            localStorage.setItem(
                              'recent_searches',
                              JSON.stringify(updated)
                            );
                            return updated;
                          });
                        }}
                      >
                        <i className="bx bx-x"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.esSidebarCard}>
                <div className={styles.esSidebarHead}>
                  <span className={styles.esSidebarTitle}>Trending Tags</span>
                </div>
                <div className={styles.esSidebarChips}>
                  {trendingChips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRecentClick(chip)}
                      className={styles.esChip}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <section className={styles.esMain}>
              <div className={styles.sectionHead}>
                <span className={styles.sectionLabel}>Popular Categories</span>
              </div>
              <div className={styles.popCatsGrid}>
                {storeTypes.slice(0, 3).map((st, idx) => {
                  let catIcon = 'bx-building-house';
                  let catColor = styles.venue;
                  if (st.endpoint_uri.includes('cater')) {
                    catIcon = 'bx-dish';
                    catColor = styles.cater;
                  } else if (st.endpoint_uri.includes('decor')) {
                    catIcon = 'bx-palette';
                    catColor = styles.decor;
                  }

                  return (
                    <Link
                      href={`/services/${st.slug}`}
                      key={idx}
                      className={styles.popCatCard}
                    >
                      <div className={`${styles.popCatIcon} ${catColor}`}>
                        <i className={`bx ${catIcon}`}></i>
                      </div>
                      <span className={styles.popCatName}>{st.name}</span>
                      <span className={styles.popCatCount}>Explore Packages</span>
                    </Link>
                  );
                })}
              </div>

              <div className={styles.sectionHead}>
                <span className={styles.sectionLabel}>Trending In Pakistan</span>
              </div>
              <div className={styles.trendingList}>
                {trendingChips.map((chip, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleRecentClick(chip)}
                    className={styles.trendRow}
                  >
                    <span className={styles.trendNum}>0{idx + 1}</span>
                    <span className={styles.trendText}>{chip} Services</span>
                    <span className={styles.trendCount}>1.2k searches</span>
                    <i className="bx bx-trending-up trendIcon"></i>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          /* STATE B — RESULTS (active query results) */
          <div className={styles.resultsWrap}>
            {/* Filter Sidebar */}
            <aside className={styles.filterSidebar}>
              <div className={styles.filterCard}>
                <div className={styles.filterTitleRow}>
                  <span className={styles.filterTitle}>Filters</span>
                  <button onClick={clearAllFilters} className={styles.filterClear}>
                    Clear All
                  </button>
                </div>

                {/* Categories Checkboxes */}
                {storeTypes.length > 0 && (
                  <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Service Type</span>
                    {storeTypes.map((st, idx) => {
                      const isActive = selectedEndpoints.includes(st.endpoint_uri);
                      return (
                        <button
                          key={idx}
                          onClick={() => toggleEndpointFilter(st.endpoint_uri)}
                          className={`${styles.filterOption} ${
                            isActive ? styles.filterOptionActive : ''
                          }`}
                        >
                          <div
                            className={`${styles.fCheckbox} ${
                              isActive ? styles.fCheckboxOn : ''
                            }`}
                          >
                            {isActive && <i className="bx bx-check"></i>}
                          </div>
                          <span>{st.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Price Slider */}
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
                    <div
                      className={`${styles.sliderThumb} ${styles.l}`}
                      style={{ left: '0%' }}
                    ></div>
                    <div
                      className={`${styles.sliderThumb} ${styles.r}`}
                      style={{ left: `${(maxPriceLimit / 300000) * 100}%` }}
                    ></div>
                  </div>
                  <input
                    type="range"
                    min="1000"
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

                {/* Rating Filter */}
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

            {/* Results main list */}
            <section className={styles.resultsMain}>
              <div className={styles.resultsTopbar}>
                <div className={styles.resultsQueryLabel}>
                  {isLoading ? (
                    'Searching database...'
                  ) : (
                    <>
                      Showing <strong>{filteredServices.length}</strong> results for{' '}
                      <strong>"{activeQuery}"</strong>
                    </>
                  )}
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

                  <div className={styles.viewToggle}>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`${styles.viewBtn} ${
                        viewMode === 'grid' ? styles.active : ''
                      }`}
                    >
                      <i className="bx bx-grid-alt"></i>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`${styles.viewBtn} ${
                        viewMode === 'list' ? styles.active : ''
                      }`}
                    >
                      <i className="bx bx-list-ul"></i>
                    </button>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className={styles.loadingText} style={{ textAlign: 'center', padding: '80px 0' }}>
                  <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '32px', color: 'var(--primary)', marginBottom: '10px', display: 'block' }}></i>
                  Searching wedding packages...
                </div>
              ) : (
                <>
                  <div
                    className={
                      viewMode === 'grid' ? styles.svcGrid : styles.svcGridList
                    }
                  >
                    {filteredServices.length > 0 ? (
                      filteredServices.map((svc, idx) => {
                        const discount = Number(svc.discount_percentage || svc.price_discount || 0);
                        const isVerified = svc.is_verified || svc.verified;
                        const displayLocation = svc.location || svc.vendor_location || svc.area;
                        const displayPrice = svc.package_discounted_price || svc.discounted_price || svc.price || 'unset';
                        const isList = viewMode === 'list';

                        return (
                          <Link
                            href={`/${svc.endpoint}/${svc.slug}`}
                            key={idx}
                            className={`${styles.svcCard} ${
                              isList ? styles.svcCardList : ''
                            }`}
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
                                  {displayLocation ? ` · ${displayLocation}` : ' · unset'}
                                </span>
                              </div>

                              <div className={styles.svcFooter}>
                                <div className={styles.svcPriceRow}>
                                  <div className={styles.svcPrice}>
                                    {displayPrice}
                                  </div>
                                  {discount > 0 && svc.original_price && (
                                    <div className={styles.svcMrkt}>
                                      {svc.original_price}
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
                      <div className={styles.emptyText} style={{ textAlign: 'center', padding: '60px 0', gridColumn: 'span 3', color: 'var(--text-secondary)' }}>
                        No wedding services match your filter criteria. Try clearing filters.
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
        )}
      </main>

      <Footer />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'var(--font-poppins)', color: 'var(--text-secondary)' }}>Loading search panel...</div>}>
      <SearchContent />
    </Suspense>
  );
}
