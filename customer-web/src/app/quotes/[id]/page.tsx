'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';
import { formatPrice } from '@/lib/formatPrice';
import styles from '../quotes.module.css';

interface QuoteItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
}

interface VendorBid {
  id: string;
  label: string;
  rating: number;
  events: number;
  rev: number;
  price: number;
  original: number;
  market: number;
  isFinal: boolean;
  agreed: number;
  requested: number;
  suggested: number;
  state: 'active' | 'accepted' | 'dismissed';
}

interface CategoryConfig {
  icon: string;
  marketAvg: number;
  items: QuoteItem[];
}

const CATEGORY_REGISTRY: Record<string, CategoryConfig> = {
  catering: {
    icon: 'bx-dish',
    marketAvg: 240000,
    items: [
      { id: 101, name: 'Chicken Biryani', description: 'Fragrant basmati rice with tender chicken.', price: 1200, image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80' },
      { id: 102, name: 'Mutton Karahi', description: 'Traditional wok cooked mutton gravy.', price: 1500, image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80' },
      { id: 103, name: 'Seekh Kabab', description: 'Grilled charcoal beef seekh kebabs.', price: 650, image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&q=80' },
      { id: 104, name: 'Chicken Tikka', description: 'Spiced grilled chicken leg piece.', price: 550, image_url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&q=80' },
      { id: 105, name: 'Naan', description: 'Freshly baked tandoori roghni naan.', price: 60, image_url: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500&q=80' },
      { id: 106, name: 'Gulab Jamun', description: 'Hot gulab jamun in cardamom syrup.', price: 250, image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80' },
      { id: 107, name: 'Kulfi Falooda', description: 'Traditional kulfi served with falooda noodles.', price: 350, image_url: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=500&q=80' }
    ]
  },
  decor: {
    icon: 'bx-palette',
    marketAvg: 120000,
    items: [
      { id: 201, name: 'Floral Stage & Backdrop', description: 'Custom floral stage decoration with fairy light backdrop.', price: 60000, image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&q=80' },
      { id: 202, name: 'Grand Entrance Arch', description: 'Fresh rose and lily welcome arch for guests entrance.', price: 20000, image_url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=500&q=80' },
      { id: 203, name: 'Table Centerpieces & Candle Setup', description: 'Elegant glass vase centerpieces with ambient candlelight.', price: 18000, image_url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=500&q=80' }
    ]
  },
  venue: {
    icon: 'bx-building-house',
    marketAvg: 280000,
    items: [
      { id: 301, name: 'Grand AC Banquet Hall', description: 'Seating for up to 300 guests with central air conditioning.', price: 200000, image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=500&q=80' },
      { id: 302, name: 'Lawn & Outdoor Garden Marquee', description: 'Spacious outdoor lawn venue with lighting and valet setup.', price: 65000, image_url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=500&q=80' }
    ]
  },
  photo: {
    icon: 'bx-camera',
    marketAvg: 110000,
    items: [
      { id: 401, name: 'Full Day Event Photography & Videography', description: '2 photographers, 1 cinematographer, 4K highlights video + raw files.', price: 60000, image_url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=500&q=80' },
      { id: 402, name: 'Pre-Wedding & Couple Shoot', description: 'Outdoor couple portrait session with 20 retouched prints.', price: 30000, image_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=500&q=80' }
    ]
  }
};

export default function QuoteDetailPage() {
  const params = useParams();
  
  const rawParam = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const storeTypeSlug = rawParam ? String(rawParam).toLowerCase() : 'catering';
  const displayTitle = storeTypeSlug.charAt(0).toUpperCase() + storeTypeSlug.slice(1);

  const categoryConfig = CATEGORY_REGISTRY[storeTypeSlug] || {
    icon: 'bx-package',
    marketAvg: 150000,
    items: [
      { id: 901, name: `${displayTitle} Package Item 1`, description: `Premium ${displayTitle} service item`, price: 50000, image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&q=80' },
      { id: 902, name: `${displayTitle} Package Item 2`, description: `Custom ${displayTitle} service item`, price: 45000, image_url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=500&q=80' }
    ]
  };

  const [items, setItems] = useState<QuoteItem[]>(categoryConfig.items);
  const [bids, setBids] = useState<VendorBid[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'accepted' | 'dismissed'>('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCatalogItems() {
      setLoading(true);
      const config = CATEGORY_REGISTRY[storeTypeSlug] || categoryConfig;

      let currentItems = config.items;

      const res = await api.safeCall(() =>
        api.get<any>(`${ENDPOINTS.QUOTE_CATALOG_ITEMS(storeTypeSlug)}?page=1&limit=20`)
      );

      if (res.success && res.data) {
        const body = res.data.data ? res.data : { data: res.data };
        const rows = Array.isArray(body.data) ? body.data : (Array.isArray(res.data) ? res.data : []);
        
        if (rows.length > 0) {
          currentItems = rows.map((r: any, idx: number) => ({
            id: r.id || idx + 1,
            name: r.name || 'Package Item',
            description: r.description || 'Verified package item.',
            price: Number(r.price) || 1000,
            image_url: r.image_url || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80'
          }));
        }
      }

      setItems(currentItems);

      // Dynamically calculate realistic Vendor Bids based on actual items and category
      const rawSum = currentItems.reduce((sum, item) => sum + (item.price || 0), 0);
      const baseTotal = storeTypeSlug === 'catering' ? (rawSum < 10000 ? Math.round(rawSum * 55) : rawSum) : (rawSum || config.marketAvg);
      const count = currentItems.length;

      const dynamicBids: VendorBid[] = [
        {
          id: 'A',
          label: storeTypeSlug === 'catering' ? 'Al-Haj Bundu Khan Caterers' : storeTypeSlug === 'decor' ? 'Grand Flora Studio' : storeTypeSlug === 'venue' ? 'Royal Marquee & Lawn' : storeTypeSlug === 'photo' ? 'Cinematic Memories Studio' : 'Vendor A',
          rating: 4.9,
          events: 210,
          rev: 2,
          price: Math.round(baseTotal * 0.85),
          original: Math.round(baseTotal * 1.02),
          market: config.marketAvg,
          isFinal: false,
          agreed: Math.max(1, count - 2),
          requested: 1,
          suggested: 1,
          state: 'active'
        },
        {
          id: 'C',
          label: storeTypeSlug === 'catering' ? 'Ahmed Executive Catering' : storeTypeSlug === 'decor' ? 'Velvet Backdrop Co.' : storeTypeSlug === 'venue' ? 'Crystal Hall Marquee' : 'Vendor C',
          rating: 4.6,
          events: 95,
          rev: 1,
          price: Math.round(baseTotal * 0.78),
          original: Math.round(baseTotal * 0.92),
          market: config.marketAvg,
          isFinal: false,
          agreed: count,
          requested: 0,
          suggested: 1,
          state: 'active'
        },
        {
          id: 'B',
          label: storeTypeSlug === 'catering' ? 'Silverspoon Catering & Events' : storeTypeSlug === 'decor' ? 'Elegance Events' : storeTypeSlug === 'venue' ? 'Imperial Marquee' : 'Vendor B',
          rating: 4.7,
          events: 180,
          rev: 3,
          price: Math.round(baseTotal * 0.94),
          original: Math.round(baseTotal * 1.12),
          market: config.marketAvg,
          isFinal: true,
          agreed: count,
          requested: 0,
          suggested: 0,
          state: 'active'
        }
      ];

      setBids(dynamicBids);
      setLoading(false);
    }

    loadCatalogItems();
  }, [storeTypeSlug]);

  const activeCount = bids.filter(b => b.state === 'active').length;
  const acceptedCount = bids.filter(b => b.state === 'accepted').length;
  const dismissedCount = bids.filter(b => b.state === 'dismissed').length;

  function setBidState(bidId: string, newState: 'active' | 'accepted' | 'dismissed') {
    setBids(prev => prev.map(b => b.id === bidId ? { ...b, state: newState } : b));
  }

  const displayedBids = bids.filter(b => b.state === activeTab);

  return (
    <DashboardLayout breadcrumbTitle={`${displayTitle} Quotes`}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
        <Link href="/quotes" className={styles.backLink}>
          <i className="bx bx-chevron-left"></i> Back to Quotes
        </Link>
        
        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>{displayTitle} — Ahmed's Wedding</h1>
          <div className={styles.pageSub}>
            <span>30 Jan 2026</span>
            <span>·</span>
            <span>200 guests</span>
            <span>·</span>
            <span>Market avg {formatPrice(categoryConfig.marketAvg)}</span>
          </div>
        </div>

        {/* Anonymity Shield Banner */}
        <div className={styles.anonNote}>
          <i className="bx bxs-shield-alt-2"></i>
          <div className={styles.anonNoteS}>
            Vendors are <b>Tayaree-verified but anonymous</b>. Compare quotes and request revisions through Tayaree — a vendor's name and contact are revealed <b>only when you accept</b> their quote.
          </div>
        </div>

        {/* Tab Buttons */}
        <div className={styles.qtabs}>
          <button 
            className={`${styles.qtab} ${activeTab === 'active' ? styles.qtabActive : ''}`} 
            onClick={() => setActiveTab('active')}
          >
            Active ({activeCount})
          </button>
          <button 
            className={`${styles.qtab} ${activeTab === 'accepted' ? styles.qtabActive : ''}`} 
            onClick={() => setActiveTab('accepted')}
          >
            Accepted ({acceptedCount})
          </button>
          <button 
            className={`${styles.qtab} ${activeTab === 'dismissed' ? styles.qtabActive : ''}`} 
            onClick={() => setActiveTab('dismissed')}
          >
            Not Interested ({dismissedCount})
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '50px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '28px', marginBottom: '8px' }}></i>
            <div>Loading vendor quotes...</div>
          </div>
        ) : displayedBids.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '44px 20px', fontSize: '13px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px' }}>
            {activeTab === 'accepted' ? 'No accepted quotes yet.' : activeTab === 'dismissed' ? 'No quotes passed on yet.' : 'No active quotes available.'}
          </div>
        ) : (
          <div>
            {displayedBids.map(bid => {
              const save = bid.market - bid.price;
              const nego = bid.original - bid.price;

              return (
                <div key={bid.id} className={`${styles.qbCard} ${bid.id === 'A' ? styles.qbCardBest : ''}`}>
                  <div className={styles.qbTag}>
                    <i className={`bx ${categoryConfig.icon}`}></i> {displayTitle}
                  </div>
                  
                  <div className={styles.qbLabelRow}>
                    <div className={styles.qbAv}>
                      <i className="bx bxs-shield"></i>
                    </div>
                    <div className={styles.qbLabel}>{bid.label}</div>
                    {bid.isFinal && <span className={styles.qbFinal}>FINAL</span>}
                  </div>
                  
                  <div className={styles.qbPrice}>
                    <div className={styles.qbPriceMain}>
                      <span className={styles.qbPriceLbl}>New Quote Price</span>
                      <span className={styles.qbPriceAmt}>{formatPrice(bid.price)}</span>
                    </div>
                    <div className={styles.qbChipsRow}>
                      <span className={styles.qbChip}>
                        <span style={{ color: 'var(--amber)' }}>★</span> {bid.rating} · {bid.events} events
                      </span>
                      <span className={styles.qbChip}>Quote: Rev. {bid.rev}</span>
                      {nego > 0 && <span className={styles.qbOld}>{formatPrice(bid.original)}</span>}
                    </div>
                  </div>

                  {/* Insights Block */}
                  <div className={styles.qbInsights}>
                    {nego > 0 && (
                      <div className={styles.qbIns}>
                        🤝 <span>You negotiated <b>{formatPrice(nego)}</b> off this quote</span>
                      </div>
                    )}
                    {bid.market > 0 && (
                      <div className={styles.qbIns}>
                        📊 <span>Market avg {formatPrice(bid.market)}{save > 0 && <> · saving <b>{formatPrice(save)}</b></>}</span>
                      </div>
                    )}
                    {save > 0 && (
                      <div className={`${styles.qbIns} ${styles.qbInsLock}`}>
                        🔒 <span><b>Strong deal · consider locking soon</b></span>
                      </div>
                    )}
                  </div>

                  {/* Horizontal Item Thumbnails Row matching Image 2 */}
                  <div className={styles.qbThumbsLbl}>{items.length} ITEMS IN THIS QUOTE</div>
                  <div className={styles.qbThumbs}>
                    {items.map(it => (
                      <div key={it.id} className={styles.qbMi}>
                        <img src={it.image_url || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80'} alt={it.name} className={styles.qbThumb} />
                        <div className={styles.qbMiName}>{it.name}</div>
                      </div>
                    ))}
                  </div>

                  {/* Count Status Badges matching Image 2 formatting */}
                  <div className={styles.qbMini} style={{ marginTop: '16px' }}>
                    <span className={`${styles.qbMiniC} ${styles.agreed}`}>
                      <i className="bx bx-check"></i> {bid.agreed} agreed
                    </span>
                    <span className={`${styles.qbMiniC} ${styles.requested}`}>
                      <i className="bx bx-edit-alt"></i> {bid.requested} requested
                    </span>
                    <span className={`${styles.qbMiniC} ${styles.suggested}`}>
                      <i className="bx bx-transfer"></i> {bid.suggested} store suggestion
                    </span>
                    <span className={`${styles.qbMiniC} ${styles.total}`}>
                      {items.length} items total
                    </span>
                  </div>

                  {/* Footer Actions */}
                  <div className={styles.qbFoot}>
                    <button 
                      onClick={() => setBidState(bid.id, 'dismissed')} 
                      className={`${styles.qbtn} ${styles.subtle}`}
                    >
                      <i className="bx bx-x-circle"></i> Not Interested
                    </button>
                    
                    <Link 
                      href={`/quotes/${storeTypeSlug}/review?vendorId=${bid.id}&vendorLabel=${encodeURIComponent(bid.label)}&price=${bid.price}&orig=${bid.original}`} 
                      onClick={() => {
                        try {
                          localStorage.setItem(`selected_bid_${storeTypeSlug}`, JSON.stringify(bid));
                        } catch (e) {}
                      }}
                      className={`${styles.qbtn} ${styles.qbtnPrimary}`} 
                      style={{ marginLeft: 'auto' }}
                    >
                      <i className="bx bx-detail"></i> Review Quote
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
