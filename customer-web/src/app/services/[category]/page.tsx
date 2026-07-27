'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from './service-listing.module.css';

interface Service {
  service_id: number;
  slug: string;
  category: string;
  name: string;
  item_name: string;
  rating: number;
  reviews_count: number;
  image_url: string;
  original_price?: string;
  discount_percentage?: number;
  badge?: string;
  price: string;
  is_verified?: boolean;
  vendor_name: string;
  location: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'catering', label: 'Catering' },
  { id: 'bridal', label: 'Bridal Wear' },
  { id: 'photography', label: 'Photography' },
  { id: 'decor', label: 'Decor' },
  { id: 'venues', label: 'Venues' },
  { id: 'cakes', label: 'Cakes' },
  { id: 'music', label: 'DJ / Music' },
  { id: 'mehndi', label: 'Mehndi' }
];

const getCategoryDefaultImage = (catName: string) => {
  const cat = (catName || '').toLowerCase();
  if (cat.includes('beauty') || cat.includes('makeup') || cat.includes('salon')) {
    return 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('bridal') || cat.includes('clothing') || cat.includes('wear') || cat.includes('dress')) {
    return 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('photo') || cat.includes('cinema') || cat.includes('video')) {
    return 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('decor') || cat.includes('floral') || cat.includes('stage')) {
    return 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('venue') || cat.includes('lawn') || cat.includes('banquet') || cat.includes('hall')) {
    return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('cake') || cat.includes('bakery') || cat.includes('dessert')) {
    return 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('dj') || cat.includes('music') || cat.includes('sound')) {
    return 'https://images.unsplash.com/photo-1571266028234-7dc0e9ea5e24?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('mehndi') || cat.includes('henna')) {
    return 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('bedding') || cat.includes('bed')) {
    return 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('furniture')) {
    return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('invitation') || cat.includes('card')) {
    return 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('transport') || cat.includes('car')) {
    return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('tent') || cat.includes('marquee')) {
    return 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80';
};

const DEFAULT_PACKAGES: Service[] = [
  {
    service_id: 1,
    slug: 'royal-biryani-catering',
    category: 'catering',
    name: 'Royal Biryani Catering',
    item_name: 'CATERING',
    rating: 4.8,
    reviews_count: 124,
    image_url: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80',
    badge: 'TRENDING',
    price: 'PKR 850 / head',
    is_verified: true,
    vendor_name: "Amber's Kitchen",
    location: 'Karachi'
  },
  {
    service_id: 2,
    slug: 'zara-noor-bridal-collection',
    category: 'bridal',
    name: 'Zara Noor Bridal Collection',
    item_name: 'BRIDAL WEAR',
    rating: 4.9,
    reviews_count: 88,
    image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
    badge: '21% OFF',
    discount_percentage: 21,
    price: 'PKR 1,85,000',
    is_verified: true,
    vendor_name: 'Zara Noor',
    location: 'DHA Karachi'
  },
  {
    service_id: 3,
    slug: 'premium-photography-video',
    category: 'photography',
    name: 'Premium Photography & Video',
    item_name: 'PHOTOGRAPHY',
    rating: 4.7,
    reviews_count: 95,
    image_url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=600&q=80',
    price: 'PKR 85,000',
    is_verified: true,
    vendor_name: 'Lens & Light Studio',
    location: 'Lahore'
  },
  {
    service_id: 4,
    slug: 'floral-stage-hall-decor',
    category: 'decor',
    name: 'Floral Stage & Hall Decor',
    item_name: 'DECOR',
    rating: 4.9,
    reviews_count: 67,
    image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
    price: 'PKR 1,20,000',
    is_verified: true,
    vendor_name: 'Rose Garden Events',
    location: 'Lahore'
  },
  {
    service_id: 5,
    slug: 'grand-palace-hall-booking',
    category: 'venues',
    name: 'Grand Palace Hall & Lawn',
    item_name: 'VENUES',
    rating: 4.8,
    reviews_count: 140,
    image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80',
    badge: 'POPULAR',
    price: 'PKR 3,50,000',
    is_verified: true,
    vendor_name: 'Pearl Continental',
    location: 'Lahore'
  },
  {
    service_id: 6,
    slug: 'custom-tiered-wedding-cake',
    category: 'cakes',
    name: 'Custom Tiered Wedding Cake',
    item_name: 'CAKES',
    rating: 4.9,
    reviews_count: 52,
    image_url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80',
    price: 'PKR 25,000',
    is_verified: true,
    vendor_name: 'The Cake Studio',
    location: 'Karachi'
  },
  {
    service_id: 7,
    slug: 'live-sound-dj-lighting',
    category: 'music',
    name: 'Live Sound & DJ Setup',
    item_name: 'DJ / MUSIC',
    rating: 4.6,
    reviews_count: 41,
    image_url: 'https://images.unsplash.com/photo-1571266028234-7dc0e9ea5e24?auto=format&fit=crop&w=600&q=80',
    price: 'PKR 45,000',
    is_verified: true,
    vendor_name: 'Beats & Bass Co.',
    location: 'Islamabad'
  },
  {
    service_id: 8,
    slug: 'bridal-hd-makeup-hair-styling',
    category: 'beauty',
    name: 'Bridal HD Makeup & Hair Styling',
    item_name: 'BEAUTY',
    rating: 4.9,
    reviews_count: 198,
    image_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80',
    price: 'PKR 45,000',
    is_verified: true,
    vendor_name: 'Glamour by Sana',
    location: 'Clifton, Karachi'
  },
  {
    service_id: 9,
    slug: 'bridal-mehndi-artist-package',
    category: 'mehndi',
    name: 'Bridal Mehndi Artist Package',
    item_name: 'MEHNDI',
    rating: 4.9,
    reviews_count: 110,
    image_url: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=600&q=80',
    badge: '15% OFF',
    price: 'PKR 15,000',
    is_verified: true,
    vendor_name: 'Henna Artistry by Sana',
    location: 'Karachi'
  }
];

interface PageProps {
  params: Promise<{ category: string }>;
}

export default function CategoryListingPage({ params }: PageProps) {
  const { category } = React.use(params);
  const activeCategory = category || 'all';

  const [packages, setPackages] = useState<Service[]>(DEFAULT_PACKAGES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Karachi');

  useEffect(() => {
    async function loadPackages() {
      try {
        const res = await api.get<any>(`/api/v1/services/${activeCategory}`).catch(() => null);
        if (res && res.status && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((item: any, idx: number) => {
            const cat = activeCategory !== 'all' ? activeCategory : (item.category || 'catering');
            const defaultImg = getCategoryDefaultImage(cat);
            const isBiryaniImg = item.image_url && item.image_url.includes('555244162-803834f70033');
            return {
              service_id: item.service_id || idx + 1,
              slug: item.slug || `${cat}-package-${idx + 1}`,
              category: cat,
              name: item.name || `${cat.charAt(0).toUpperCase() + cat.slice(1)} Package`,
              item_name: cat.toUpperCase(),
              rating: item.rating || 4.8,
              reviews_count: item.reviews_count || 50,
              image_url: (!item.image_url || (isBiryaniImg && cat !== 'catering')) ? defaultImg : item.image_url,
              price: item.price ? `PKR ${item.price}` : 'PKR 85,000',
              is_verified: true,
              vendor_name: item.vendor_location || 'Tayaree Vendor',
              location: selectedCity
            };
          });
          setPackages(mapped);
        } else {
          setPackages(DEFAULT_PACKAGES);
        }
      } catch (e) {
        setPackages(DEFAULT_PACKAGES);
      }
    }

    loadPackages();
  }, [activeCategory, selectedCity]);

  const filteredPackages = packages.filter(p => {
    if (activeCategory !== 'all') {
      const catLower = activeCategory.toLowerCase();
      const pCatLower = (p.category || '').toLowerCase();
      if (catLower === 'bridal' || catLower === 'clothing') {
        if (!pCatLower.includes('bridal') && !pCatLower.includes('clothing')) return false;
      } else if (catLower === 'music' || catLower === 'dj') {
        if (!pCatLower.includes('music') && !pCatLower.includes('dj')) return false;
      } else if (catLower === 'venues' || catLower === 'venue') {
        if (!pCatLower.includes('venue') && !pCatLower.includes('venues')) return false;
      } else if (catLower === 'cakes' || catLower === 'cake') {
        if (!pCatLower.includes('cake')) return false;
      } else if (catLower === 'beauty' || catLower === 'salon' || catLower === 'makeup') {
        if (!pCatLower.includes('beauty') && !pCatLower.includes('salon') && !pCatLower.includes('makeup')) return false;
      } else if (catLower === 'photography' || catLower === 'photo') {
        if (!pCatLower.includes('photo')) return false;
      } else if (pCatLower !== catLower && !pCatLower.includes(catLower)) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      return p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             p.vendor_name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>All Packages</h1>
          <p className={styles.pageSub}>
            Browse verified event packages across every category — filter, compare, and book.
          </p>
        </div>

        {/* SEARCH BAR MATCHING DESIGN HTML 1:1 */}
        <div className={styles.searchBarRow}>
          <div className={styles.locationPicker}>
            <i className="bx bx-map-pin"></i>
            <span>{selectedCity}</span>
            <i className="bx bx-chevron-down"></i>
          </div>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search packages, vendors, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className={styles.searchBtn}>
            <i className="bx bx-search"></i>
            <span>Search</span>
          </button>
        </div>

        {/* CATEGORY PILL TABS */}
        <div className={styles.catPills}>
          {CATEGORIES.map(cat => (
            <Link
              key={cat.id}
              className={`${styles.catPill} ${activeCategory === cat.id ? styles.catPillActive : ''}`}
              href={`/services/${cat.id}`}
            >
              {cat.label}
            </Link>
          ))}
        </div>

        <div className={styles.countRow}>
          {filteredPackages.length} packages
        </div>

        {/* 4-COLUMN CARD GRID MATCHING DESIGN HTML 1:1 */}
        <div className={styles.serviceGrid}>
          {filteredPackages.map((svc) => (
            <Link
              key={svc.service_id}
              className={styles.serviceCard}
              href={`/services/${svc.category || 'catering'}/${svc.slug}`}
            >
              <div className={styles.imgWrap}>
                <img src={svc.image_url} alt={svc.name} />
                {svc.badge && <span className={styles.badge}>{svc.badge}</span>}
                <div className={styles.heartBtn}>
                  <i className="bx bx-heart"></i>
                </div>
                <div className={styles.verifiedBadge}>
                  <i className="bx bx-check-circle"></i> Verified
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.catTag}>{svc.item_name}</div>
                <div className={styles.cardName}>{svc.name}</div>
                <div className={styles.vendorRow}>
                  <i className="bx bx-store-alt"></i>
                  <span>{svc.vendor_name} · {svc.location}</span>
                </div>
                <div className={styles.priceRow}>
                  <div className={styles.price}>{svc.price}</div>
                  <div className={styles.stars}>
                    ★ {svc.rating} ({svc.reviews_count})
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
