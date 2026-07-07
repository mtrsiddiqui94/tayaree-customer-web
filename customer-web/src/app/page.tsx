'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
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
  [key: string]: any;
}

interface Category {
  heading: string;
  endpoint_uri: string;
  image_url?: string;
  body: Service[];
  [key: string]: any;
}

interface PromoBanner {
  id: number;
  store_type_id: number;
  endpoint_uri: string;
  badge_text: string;
  promo_text: string;
  image_url: string;
  [key: string]: any;
}

export default function HomePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);
  const [promotions, setPromotions] = useState<PromoBanner[]>([]);
  const [heroSearch, setHeroSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
    async function loadHomeData() {
      try {
        setIsLoading(true);

        // Fetch home categories and services
        const homeResponse = await api.get<{ status: boolean; data: Category[] }>(
          '/api/v1/home'
        );
        if (homeResponse.status && homeResponse.data) {
          setCategories(homeResponse.data);
        }

        // Fetch promotions/banners
        const promoResponse = await api.get<{ status: boolean; data: PromoBanner[] }>(
          '/api/v1/home/promotions'
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
  }, []);

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      router.push(`/search?q=${encodeURIComponent(heroSearch.trim())}`);
    }
  };

  // Get currently active services
  const activeServices = categories[activeCategoryIdx]?.body || [];

  return (
    <>
      <Header />

      {/* HERO SECTION */}
      <section className={styles.hero}>
        <div className={styles.heroBg}></div>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            <i className="bx bx-award"></i>Pakistan's #1 Event Booking Portal
          </div>
          <h1 className={styles.heroH1}>Pakistan's Premier</h1>
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
            <>
              {/* Category Pills/Tabs */}
              <div className={styles.catPills}>
                {categories.map((cat, idx) => (
                  <button
                    key={idx}
                    className={`${styles.catPill} ${
                      activeCategoryIdx === idx ? styles.catPillActive : ''
                    }`}
                    onClick={() => setActiveCategoryIdx(idx)}
                  >
                    <span>{cat.heading}</span>
                  </button>
                ))}
              </div>

              {/* Service Cards Grid */}
              <div className={styles.serviceGrid} style={{ marginTop: '24px' }}>
                {activeServices.length > 0 ? (
                  activeServices.map((service, idx) => {
                    const discount = Number(service.discount_percentage || service.price_discount || 0);
                    const isVerified = service.is_verified || service.verified;
                    const displayLocation = service.location || service.vendor_location || service.area;
                    const displayPrice = formatPrice(service.price_label || service.package_discounted_price || service.discounted_price || service.price || 'unset');
                    const displayName = service.name || service.info1_label || 'unset';
                    const displaySubtitle = service.item_name || service.info2_label || 'unset';

                    return (
                      <Link
                        href={`/${service.endpoint}/${service.slug}`}
                        key={idx}
                        className={styles.serviceCard}
                      >
                        <div className={styles.scImgWrap}>
                          <img
                            src={service.image_url}
                            alt={displayName}
                            onError={(e) => {
                              // Fallback image if source fails
                              e.currentTarget.src =
                                'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=400&q=80';
                            }}
                          />
                          {discount > 0 && (
                            <span className={styles.scBadge}>
                              {discount.toFixed(0)}% OFF
                            </span>
                          )}
                          <span className={styles.scHeart}>
                            <i className="bx bx-heart"></i>
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
                          <div className={styles.scStars}>
                            <i className="bx bxs-star"></i>
                            <span>
                              {service.rating !== undefined && service.rating !== null ? Number(service.rating).toFixed(1) : 'unset'}
                            </span>
                            <span className={styles.count}>
                              ({service.reviews_count || 0})
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className={styles.emptyText}>
                    No recommendation items found for this category.
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* PROMO BANNER SECTION */}
        {promotions.length > 0 && (
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
