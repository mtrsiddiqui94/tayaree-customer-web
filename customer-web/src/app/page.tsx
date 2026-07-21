'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';
import styles from './page.module.css';

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
  price_label?: string;
  info1_label?: string;
  info2_label?: string;
  customer_liked?: number;
  customerLiked?: number;
  endpoint_like_uri?: string;
  endpointLikeUri?: string;
}

interface Category {
  heading: string;
  endpoint_uri: string;
  image_url?: string;
  body: Service[];
}

interface PromoBanner {
  id: number;
  store_type_id: number;
  endpoint_uri: string;
  badge_text: string;
  promo_text: string;
  image_url: string;
}

export default function HomePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<PromoBanner[]>([]);
  const [heroSearch, setHeroSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const getIconClass = (uri: string) => {
    const slug = uri.split('/').pop() || '';
    switch (slug) {
      case 'venue': return 'bx-building';
      case 'catering': return 'bx-dish';
      case 'decor': return 'bx-palette';
      case 'mehndi': return 'bx-spa';
      case 'photography': return 'bx-camera';
      case 'mithai-walay': return 'bx-cookie';
      case 'tour-operators': return 'bx-map-alt';
      case 'clothing': return 'bx-closet';
      case 'beauty': return 'bx-cut';
      case 'dj': return 'bx-music';
      case 'transport': return 'bx-car';
      case 'furniture': return 'bx-chair';
      case 'tent': return 'bx-home-heart';
      case 'bedding': return 'bx-bed';
      case 'invitations': return 'bx-envelope';
      default: return 'bx-grid-alt';
    }
  };

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

  const CategoryScrollRow = ({ services, catIdx }: any) => {
    const rowRef = React.useRef<HTMLDivElement>(null);
    const [atStart, setAtStart] = React.useState(true);
    const [atEnd, setAtEnd] = React.useState(false);
  
    const sync = () => {
      if (!rowRef.current) return;
      setAtStart(rowRef.current.scrollLeft < 8);
      setAtEnd(rowRef.current.scrollLeft + rowRef.current.clientWidth >= rowRef.current.scrollWidth - 8);
    };
  
    React.useEffect(() => {
      sync();
    }, [services]);
  
    const scrollBy = (dir: number) => {
      if (rowRef.current) {
        rowRef.current.scrollBy({ left: dir * 250 * 3, behavior: 'smooth' });
      }
    };
  
    return (
      <div className={styles.scrollWrap}>
        <button 
          className={`${styles.scrollArrow} ${styles.scrollArrowLeft} ${atStart ? styles.atEdge : ''}`}
          onClick={() => scrollBy(-1)}
        >
          <i className="bx bx-chevron-left"></i>
        </button>
        
        <div className={styles.scrollRow} ref={rowRef} onScroll={sync}>
          {services.map((service: any, svcIdx: number) => {
            const discount = Number(service.discount_percentage || service.price_discount || 0);
            const isVerified = service.is_verified || service.verified;
            const displayLocation = service.location || service.vendor_location || service.area;
            const displayPrice = formatPrice(service.price_label || service.package_discounted_price || service.discounted_price || service.price || 'unset');
            const displayName = service.name || service.info1_label || 'unset';
            const displaySubtitle = service.item_name || service.info2_label || 'unset';
            const isLiked = service.customer_liked === 1 || service.customerLiked === 1;
  
            return (
              <Link
                href={`/${service.endpoint}/${service.slug}`}
                key={svcIdx}
                className={styles.serviceCard}
              >
                <div className={styles.scImgWrap}>
                  <img
                    src={service.image_url}
                    alt={displayName}
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  {discount > 0 && (
                    <span className={styles.scBadge}>
                      {discount.toFixed(0)}% OFF
                    </span>
                  )}
                  <span
                    onClick={(e) => handleLikeClick(e, catIdx, svcIdx)}
                    className={`${styles.scHeart} ${isLiked ? styles.scHeartLiked : ''}`}
                  >
                    <i className={isLiked ? "bx bxs-heart" : "bx bx-heart"}></i>
                  </span>
                  {isVerified && (
                    <span className={styles.scVerified}>
                      <i className="bx bxs-badge-check"></i>Verified
                    </span>
                  )}
                </div>
                <div className={styles.scBody}>
                  <div className={styles.scName}>{displayName}</div>
                  <span className={styles.scVendor}>
                    {displaySubtitle}
                    {displayLocation ? ` · ${displayLocation}` : ''}
                  </span>
                  <div className={styles.scPriceRow}>
                    <div className={styles.scPrice}>
                      {displayPrice}
                    </div>
                    {discount > 0 && service.original_price && (
                      <div className={styles.scOld}>
                        <s>{formatPrice(service.original_price)}</s>
                      </div>
                    )}
                  </div>
                  {service.rating !== undefined && service.rating !== null && (
                    <div className={styles.scStars}>
                      <i className="bx bxs-star"></i>
                      <span>{Number(service.rating).toFixed(1)}</span>
                      <span className={styles.count}>
                        ({service.reviews_count || 0})
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        
        <button 
          className={`${styles.scrollArrow} ${styles.scrollArrowRight} ${atEnd ? styles.atEdge : ''}`}
          onClick={() => scrollBy(1)}
        >
          <i className="bx bx-chevron-right"></i>
        </button>
      </div>
    );
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const timer = setTimeout(() => {
      setIsLoggedIn(!!token);
    }, 0);

    async function loadHomeData() {
      try {
        setIsLoading(true);

        // Fetch home categories and services
        const homeResponse = await api.get<{ status: boolean; data: Category[] }>(
          ENDPOINTS.HOME
        );
        if (homeResponse.status && homeResponse.data) {
          setCategories(homeResponse.data);
        }

        // Fetch promotions/banners
        const promoResponse = await api.get<{ status: boolean; data: PromoBanner[] }>(
          `${ENDPOINTS.HOME}/promotions`
        ).catch(() => ({ status: false, data: [] })); // fail-safe if endpoint fails
        
        if (promoResponse.status && promoResponse.data) {
          setPromotions(promoResponse.data);
        }
      } catch (e) {
        console.error('Error fetching home data:', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadHomeData();
    return () => clearTimeout(timer);
  }, []);

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      router.push(`/search?q=${encodeURIComponent(heroSearch.trim())}`);
    }
  };

  const handleLikeClick = async (e: React.MouseEvent, categoryIndex: number, serviceIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/');
      return;
    }

    const cat = categories[categoryIndex];
    const svc = cat.body[serviceIndex];

    const currentLiked = svc.customer_liked === 1 || svc.customerLiked === 1;
    const newLikedStatus = currentLiked ? 0 : 1;

    // Optimistically update
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].body[serviceIndex] = {
      ...svc,
      customer_liked: newLikedStatus,
      customerLiked: newLikedStatus,
    };
    setCategories(updatedCategories);

    try {
      const endpoint = svc.endpoint_like_uri || svc.endpointLikeUri || `services/${svc.slug || 'venue'}/${svc.service_id}/options-like`;
      await api.post(`/api/v1/${endpoint}`, {
        status: newLikedStatus
      });
    } catch (err) {
      console.error('Error toggling like:', err);
      // Rollback
      const rollbackCategories = [...categories];
      rollbackCategories[categoryIndex].body[serviceIndex] = {
        ...svc,
        customer_liked: currentLiked ? 1 : 0,
        customerLiked: currentLiked ? 1 : 0,
      };
      setCategories(rollbackCategories);
    }
  };


  return (
    <>
      <Header />

      {/* HERO SECTION */}
      <section className={styles.hero}>
        <div className={styles.heroBg}></div>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            <i className="bx bx-award"></i>Pakistan&apos;s #1 Event Booking Portal
          </div>
          <h1 className={styles.heroH1}>Pakistan&apos;s Premier</h1>
          <h2 className={styles.heroH1Sub}>Event Marketplace</h2>
          <p className={styles.heroBody}>
            Find and book the top event venues, caterers, decorators, mehndi artists,
            and photographers across Karachi, Lahore, and Islamabad.
          </p>

          <form onSubmit={handleHeroSearchSubmit} className={styles.heroSearch}>
            <div className={styles.heroLoc}>
              <i className="bx bx-map pin"></i>
              <span>Pakistan</span>
              <i className="bx bx-chevron-down chev"></i>
            </div>
            <input
              className={styles.heroInput}
              type="text"
              placeholder="Search caterers, decorators, photographers, venues..."
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
            />
            <button type="submit" className={styles.heroSearchBtn}>
              <i className="bx bx-search"></i>
              <span>Search</span>
            </button>
          </form>

          {isLoggedIn && (
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <div className={styles.heroStatNum}>unset</div>
                <div className={styles.heroStatLabel}>Vetted Vendors</div>
              </div>
              <div className={styles.heroStat}>
                <div className={styles.heroStatNum}>unset</div>
                <div className={styles.heroStatLabel}>Successful Events</div>
              </div>
              <div className={styles.heroStat}>
                <div className={styles.heroStatNum}>unset</div>
                <div className={styles.heroStatLabel}>Customer Rating</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* MAIN BODY AREA */}
      <main className={styles.main}>
        {/* TRUST ROW */}
        <section className={styles.trustRow}>
          <div className={styles.trustCard}>
            <div className={`${styles.trustIcon} ${styles.green}`}>
              <i className="bx bx-check-shield"></i>
            </div>
            <div className={styles.trustInfo}>
              <h3 className={styles.trustTitle}>Verified Vendor Profiles</h3>
              <p className={styles.trustDesc}>
                Every decorator, photographer and caterer is thoroughly vetted.
              </p>
            </div>
          </div>
          <div className={styles.trustCard}>
            <div className={`${styles.trustIcon} ${styles.red}`}>
              <i className="bx bx-wallet"></i>
            </div>
            <div className={styles.trustInfo}>
              <h3 className={styles.trustTitle}>Anonymous Quote Matching</h3>
              <p className={styles.trustDesc}>
                Compare prices, customize package structures, and negotiate directly.
              </p>
            </div>
          </div>
          <div className={styles.trustCard}>
            <div className={`${styles.trustIcon} ${styles.green}`}>
              <i className="bx bx-calendar"></i>
            </div>
            <div className={styles.trustInfo}>
              <h3 className={styles.trustTitle}>End-to-End Coordination</h3>
              <p className={styles.trustDesc}>
                Manage your payment schedules, gift registries, and checklist.
              </p>
            </div>
          </div>
        </section>

        {/* SERVICE CATEGORIES SECTION */}
        {isLoggedIn && (
          <section className={styles.catSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Explore Event Services</h2>
              <Link href="/services" className={styles.sectionLink}>
                View All Services
              </Link>
            </div>

            {isLoading ? (
              <div className={styles.loadingText}>Loading services...</div>
            ) : (
              categories.map((cat, catIdx) => {
                const services = cat.body || [];
                if (services.length === 0) return null;

                return (
                  <div key={catIdx} className={styles.catRow}>
                    <div className={styles.catRowHead}>
                      <div className={styles.catRowMeta}>
                        <div className={styles.catRowIcon}>
                          <i className={`bx ${getIconClass(cat.endpoint_uri)}`}></i>
                        </div>
                        <div>
                          <h3 className={styles.catRowTitle}>{cat.heading}</h3>
                          <p className={styles.catRowSub}>
                            {services.length} vendors &middot; Lahore, Karachi &amp; Islamabad
                          </p>
                        </div>
                      </div>
                      <Link href={`/services/${cat.endpoint_uri}`} className={styles.catRowSeeAll}>
                        View all {services.length} vendors &rarr;
                      </Link>
                    </div>

                    <CategoryScrollRow services={services} catIdx={catIdx} />
                  </div>
                );
              })
            )}
          </section>
        )}

        {/* PROMO BANNER SECTION */}
        {isLoggedIn && promotions.length > 0 && (
          <section className={styles.promoBanner}>
            <div className={styles.promoLeft}>
              <div className={styles.promoPill}>
                {promotions[0].badge_text || 'Featured promotion'}
              </div>
              <h2 className={styles.promoTitle}>{promotions[0].promo_text || 'unset'}</h2>
              <p className={styles.promoSub}>
                Book verified event vendors on Tayaree and secure exclusive discounts.
              </p>
            </div>
            <button
              onClick={() => router.push(`/${promotions[0].endpoint_uri}`)}
              className={styles.promoBtn}
            >
              View Promotion
            </button>
          </section>
        )}

        {/* HOW IT WORKS SECTION */}
        <section className={styles.hiwSection}>
          <div className={styles.sectionHeader} style={{ justifyContent: 'center' }}>
            <h2 className={styles.sectionTitle} style={{ fontSize: '24px' }}>
              How Tayaree Works
            </h2>
          </div>

          <div className={styles.hiwSteps}>
            <div className={styles.hiwStep}>
              <span className={styles.hiwNum}>Step 1</span>
              <div className={styles.hiwIcon}>
                <i className="bx bx-edit-alt"></i>
              </div>
              <h4 className={styles.hiwTitle}>Create Your Event</h4>
              <p className={styles.hiwDesc}>
                Submit your guest count, budget targets, dates, and event specifications.
              </p>
            </div>
            <div className={styles.hiwStep}>
              <span className={styles.hiwNum}>Step 2</span>
              <div className={styles.hiwIcon}>
                <i className="bx bx-receipt"></i>
              </div>
              <h4 className={styles.hiwTitle}>Receive Quotes</h4>
              <p className={styles.hiwDesc}>
                Vetted vendors submit anonymous quotes fitting your checklist target.
              </p>
            </div>
            <div className={styles.hiwStep}>
              <span className={styles.hiwNum}>Step 3</span>
              <div className={styles.hiwIcon}>
                <i className="bx bx-message-detail"></i>
              </div>
              <h4 className={styles.hiwTitle}>Negotiate &amp; Book</h4>
              <p className={styles.hiwDesc}>
                Chat with vendors, finalize installments, and book your dream day.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
