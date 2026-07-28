'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';
import { formatPrice } from '@/lib/formatPrice';
import styles from '../../quotes.module.css';

interface ReviewPackageItem {
  id: number;
  name: string;
  tag: string;
  price: string;
  img: string;
  status: 'agreed' | 'suggested' | 'requested';
  replacedItem?: string;
}

interface QuotePackage {
  id: string;
  name: string;
  itemsCount: number;
  price: number;
  items: ReviewPackageItem[];
}

interface ReviewConfig {
  vendorName: string;
  packages: QuotePackage[];
  additionalItems: ReviewPackageItem[];
}

const CATEGORY_REVIEW_REGISTRY: Record<string, ReviewConfig> = {
  catering: {
    vendorName: 'Al-Haj Bundu Khan Caterers',
    packages: [
      {
        id: 'pkg1',
        name: 'Al-Haj Royal Buffet Package',
        itemsCount: 5,
        price: 180000,
        items: [
          { id: 1, name: 'Chicken Biryani', tag: 'Main', price: 'PKR 1,200/head', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80', status: 'agreed' },
          { id: 2, name: 'Mutton Karahi', tag: 'Main', price: 'PKR 1,500/head', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80', status: 'agreed' },
          { id: 3, name: 'Seekh Kabab', tag: 'Starter', price: 'PKR 650/head', img: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&q=80', status: 'agreed' },
          { id: 4, name: 'Chicken Tikka', tag: 'Starter', price: 'PKR 550/head', img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&q=80', status: 'agreed' },
          { id: 5, name: 'Naan', tag: 'Bread', price: 'PKR 60/head', img: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500&q=80', status: 'agreed' }
        ]
      },
      {
        id: 'pkg2',
        name: 'Sweet Endings Dessert Bar',
        itemsCount: 3,
        price: 60000,
        items: [
          { id: 6, name: 'Gulab Jamun', tag: 'Sweet', price: 'PKR 250/head', img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80', status: 'agreed' },
          { id: 7, name: 'Kulfi Falooda', tag: 'Sweet', price: 'PKR 350/head', img: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=500&q=80', status: 'suggested', replacedItem: 'Kheer' },
          { id: 8, name: 'Fruit Custard', tag: 'Sweet', price: 'PKR 200/head', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&q=80', status: 'agreed' }
        ]
      }
    ],
    additionalItems: [
      { id: 9, name: 'Fresh Juice Bar', tag: 'Drink', price: 'PKR 18,000 fixed', img: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80', status: 'requested' }
    ]
  },
  decor: {
    vendorName: 'Grand Flora Studio',
    packages: [
      {
        id: 'pkg_d1',
        name: 'Floral Stage & Backdrop Package',
        itemsCount: 2,
        price: 75000,
        items: [
          { id: 201, name: 'Floral Stage & Backdrop', tag: 'Stage', price: 'PKR 60,000', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&q=80', status: 'agreed' },
          { id: 202, name: 'Grand Entrance Arch', tag: 'Entrance', price: 'PKR 15,000', img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=500&q=80', status: 'agreed' }
        ]
      },
      {
        id: 'pkg_d2',
        name: 'Table Ambient Setup',
        itemsCount: 1,
        price: 23000,
        items: [
          { id: 203, name: 'Table Centerpieces & Candle Setup', tag: 'Tables', price: 'PKR 23,000', img: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=500&q=80', status: 'agreed' }
        ]
      }
    ],
    additionalItems: []
  },
  venue: {
    vendorName: 'Royal Marquee & Lawn',
    packages: [
      {
        id: 'pkg_v1',
        name: 'Grand AC Banquet Package',
        itemsCount: 2,
        price: 250000,
        items: [
          { id: 301, name: 'Grand AC Banquet Hall', tag: 'Hall', price: 'PKR 200,000', img: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=500&q=80', status: 'agreed' },
          { id: 302, name: 'Lawn & Outdoor Garden Marquee', tag: 'Lawn', price: 'PKR 50,000', img: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=500&q=80', status: 'agreed' }
        ]
      }
    ],
    additionalItems: []
  },
  photo: {
    vendorName: 'Cinematic Memories Studio',
    packages: [
      {
        id: 'pkg_p1',
        name: 'Cinematic Wedding Coverage',
        itemsCount: 2,
        price: 90000,
        items: [
          { id: 401, name: 'Full Day Event Photography', tag: 'Photo', price: 'PKR 55,000', img: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=500&q=80', status: 'agreed' },
          { id: 402, name: 'Pre-Wedding & Couple Shoot', tag: 'Shoot', price: 'PKR 35,000', img: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=500&q=80', status: 'agreed' }
        ]
      }
    ],
    additionalItems: []
  }
};

export default function QuoteReviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawParam = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const quoteId = rawParam ? String(rawParam).toLowerCase() : 'catering';
  const displayTitle = quoteId.charAt(0).toUpperCase() + quoteId.slice(1);

  // Read search params
  const urlVendorLabel = searchParams ? searchParams.get('vendorLabel') : null;
  const urlPrice = searchParams ? searchParams.get('price') : null;
  const urlOrig = searchParams ? searchParams.get('orig') : null;

  const initialConfig = CATEGORY_REVIEW_REGISTRY[quoteId] || CATEGORY_REVIEW_REGISTRY.catering;

  const [loading, setLoading] = useState(true);
  const [isAccepted, setIsAccepted] = useState(false);
  const [discountRequested, setDiscountRequested] = useState(false);

  const [vendorName, setVendorName] = useState(initialConfig.vendorName);
  const [packages, setPackages] = useState<QuotePackage[]>(initialConfig.packages);
  const [additionalItems, setAdditionalItems] = useState<ReviewPackageItem[]>(initialConfig.additionalItems);

  useEffect(() => {
    try {
      const acceptedKeys = JSON.parse(localStorage.getItem('accepted_quotes') || '[]');
      if (Array.isArray(acceptedKeys) && acceptedKeys.includes(quoteId)) {
        setIsAccepted(true);
      }
    } catch (e) {}

    async function loadItems() {
      setLoading(true);
      const categoryConfig = CATEGORY_REVIEW_REGISTRY[quoteId] || CATEGORY_REVIEW_REGISTRY.catering;
      
      let targetVendorName = urlVendorLabel || categoryConfig.vendorName;
      let targetPrice = urlPrice ? Number(urlPrice) : 0;

      // Check localStorage for specifically selected bid
      try {
        const savedBidStr = localStorage.getItem(`selected_bid_${quoteId}`);
        if (savedBidStr) {
          const savedBid = JSON.parse(savedBidStr);
          if (savedBid && savedBid.label) {
            if (!urlVendorLabel) targetVendorName = savedBid.label;
            if (!urlPrice) targetPrice = savedBid.price;
          }
        }
      } catch (e) {}

      setVendorName(targetVendorName);

      let currentPackages = categoryConfig.packages;
      let currentAddons = categoryConfig.additionalItems;

      const res = await api.safeCall(() =>
        api.get<any>(`${ENDPOINTS.QUOTE_CATALOG_ITEMS(quoteId)}?page=1&limit=20`)
      );

      if (res.success && res.data) {
        const body = res.data.data ? res.data : { data: res.data };
        const rows = Array.isArray(body.data) ? body.data : (Array.isArray(res.data) ? res.data : []);
        
        if (rows.length > 0) {
          const allMapped: ReviewPackageItem[] = rows.map((r: any, idx: number) => ({
            id: r.id || idx + 1,
            name: r.name || 'Package Item',
            tag: r.category_name || displayTitle,
            price: formatPrice(r.price || 1000),
            img: r.image_url || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80',
            status: 'agreed'
          }));

          const pkg1Items = allMapped.slice(0, 4);
          const pkg2Items = allMapped.slice(4, 7);
          const addonItems = allMapped.slice(7);

          currentPackages = [
            {
              id: 'pkg1',
              name: `${targetVendorName} Main Package`,
              itemsCount: pkg1Items.length,
              price: targetPrice ? Math.round(targetPrice * 0.75) : 140000,
              items: pkg1Items
            },
            ...(pkg2Items.length > 0 ? [{
              id: 'pkg2',
              name: `${displayTitle} Selection Bar`,
              itemsCount: pkg2Items.length,
              price: targetPrice ? Math.round(targetPrice * 0.25) : 45000,
              items: pkg2Items
            }] : [])
          ];

          if (addonItems.length > 0) {
            currentAddons = addonItems;
          }
        }
      }

      // Re-calculate package prices if using category fallbacks or vendor price
      const updatedPackages = currentPackages.map(pkg => {
        if (targetPrice) {
          return {
            ...pkg,
            name: pkg.id === 'pkg1' ? `${targetVendorName} Main Package` : pkg.name,
            price: pkg.id === 'pkg1' ? Math.round(targetPrice * 0.75) : Math.round(targetPrice * 0.25)
          };
        }
        const calculatedPrice = pkg.items.reduce((sum, item) => {
          const num = parseInt(item.price.replace(/[^0-9]/g, '')) || 1000;
          return sum + (quoteId === 'catering' ? num * 35 : num);
        }, 0);
        return {
          ...pkg,
          price: calculatedPrice || pkg.price
        };
      });

      setPackages(updatedPackages);
      setAdditionalItems(currentAddons);
      setLoading(false);
    }

    loadItems();
  }, [quoteId, urlVendorLabel, urlPrice]);

  function handleAcceptSuggested(itemId: number) {
    setPackages(prev => prev.map(pkg => ({
      ...pkg,
      items: pkg.items.map(item => item.id === itemId ? { ...item, status: 'agreed' } : item)
    })));
  }

  function handleRemoveItem(pkgId: string, itemId: number) {
    setPackages(prev => prev.map(pkg => pkg.id === pkgId ? {
      ...pkg,
      items: pkg.items.filter(item => item.id !== itemId)
    } : pkg));
  }

  const pkgTotal = packages.reduce((sum, p) => sum + p.price, 0);
  const additionalTotal = additionalItems.reduce((sum, item) => {
    const num = parseInt(item.price.replace(/[^0-9]/g, '')) || 18000;
    return sum + num;
  }, 0);
  const grandTotal = pkgTotal + additionalTotal;
  const totalItemsCount = packages.reduce((sum, p) => sum + p.items.length, 0) + additionalItems.length;

  const depositAmt = Math.round(grandTotal * 0.25);

  return (
    <DashboardLayout breadcrumbTitle="Review Quote">
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
        <Link href={`/quotes/${quoteId}`} className={styles.backLink}>
          <i className="bx bx-chevron-left"></i> Back to compare quotes
        </Link>
        
        <div className={styles.rvLayout}>
          {/* LEFT MAIN COLUMN MATCHING IMAGE 3 & 4 */}
          <div className={styles.rvMain}>
            {/* Vendor Header Card */}
            <div className={styles.vhCard}>
              <div className={styles.vhTop}>
                <div className={styles.vhAv} style={{ background: 'rgba(215,25,33,0.1)', color: 'var(--primary)' }}>
                  <i className="bx bxs-shield"></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.vhName}>{vendorName}</div>
                  <div className={styles.vhMeta}>
                    <span style={{ color: 'var(--amber)', fontWeight: 700 }}><i className="bx bxs-star"></i> 4.9 · 210 events</span>
                    <span>·</span>
                    <span>{displayTitle} · Ahmed's Wedding · 200 guests</span>
                  </div>
                </div>
                <Link href={`/quotes/${quoteId}`} className={styles.pkgBtn}>
                  <i className="bx bx-x-circle"></i> Not Interested
                </Link>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                <div className={styles.qtabs} style={{ marginBottom: 0 }}>
                  <span className={styles.qtab}>V1</span>
                  <span className={`${styles.qtab} ${styles.qtabActive}`}>V2 · Latest</span>
                </div>
                <button className={styles.pkgBtn} style={{ marginLeft: 'auto', background: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                  <i className="bx bx-plus"></i> Add Package
                </button>
              </div>
            </div>

            {/* Action Hint Notice */}
            <div className={styles.anonNote} style={{ background: 'rgba(200,146,10,0.07)', borderColor: 'rgba(200,146,10,0.28)' }}>
              <i className="bx bx-error-circle" style={{ color: 'var(--amber)' }}></i>
              <div className={styles.anonNoteS} style={{ color: 'var(--text-primary)' }}>
                This quote has <b>{packages.length} package{packages.length > 1 ? 's' : ''}</b>. Swap, add or remove a whole package, or edit its items — then request a revision or accept.
              </div>
            </div>

            {/* Packages List */}
            {packages.map(pkg => (
              <div key={pkg.id} className={styles.pkgSec}>
                <div className={styles.pkgSecHead}>
                  <div className={styles.pkgSecTitle}>
                    <i className="bx bx-package"></i> {pkg.name}
                  </div>
                  <span className={styles.pkgSecCnt}>{pkg.items.length} items</span>
                  <div className={styles.pkgSecPrice}>{formatPrice(pkg.price)}</div>
                </div>

                <div className={styles.pkgSecActions}>
                  <button className={styles.pkgBtn}>
                    <i className="bx bx-transfer"></i> Swap Package
                  </button>
                  <button className={styles.pkgBtn}>
                    <i className="bx bx-trash"></i> Remove Package
                  </button>
                  <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <i className="bx bx-info-circle"></i> or edit items below
                  </span>
                </div>

                {/* Items List Inside Package */}
                <div className={styles.qdItems} style={{ border: 'none', borderRadius: 0, margin: 0 }}>
                  {pkg.items.map(item => (
                    <div key={item.id} className={styles.qdItem}>
                      <img src={item.img} alt={item.name} className={styles.qdItemImg} />
                      
                      <div className={styles.qdItemMain}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={styles.qdItemName}>{item.name}</span>
                          {item.status === 'agreed' && (
                            <span className={`${styles.qdItemSt} ${styles.qdItemStAgreed}`}>Agreed</span>
                          )}
                          {item.status === 'suggested' && (
                            <span className={`${styles.qdItemSt} ${styles.stSuggested}`}>Store Suggested</span>
                          )}
                          {item.status === 'requested' && (
                            <span className={`${styles.qdItemSt} ${styles.stRequested}`}>You Requested</span>
                          )}
                        </div>
                        <div className={styles.qdItemTag}>
                          {item.tag} {item.replacedItem && `· In place of ${item.replacedItem}`}
                        </div>
                      </div>

                      {item.status === 'suggested' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className={styles.pkgBtn} style={{ fontSize: '11px' }}>
                            Keep {item.replacedItem}
                          </button>
                          <button 
                            onClick={() => handleAcceptSuggested(item.id)} 
                            className={styles.pkgBtn} 
                            style={{ background: 'var(--success)', color: '#fff', borderColor: 'var(--success)', fontSize: '11px' }}
                          >
                            <i className="bx bx-check"></i> Accept
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button className={styles.btnSwap}>
                            <i className="bx bx-transfer"></i> Swap
                          </button>
                          <button onClick={() => handleRemoveItem(pkg.id, item.id)} className={styles.btnDel}>
                            <i className="bx bx-trash"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Additional Items Card */}
            {additionalItems.length > 0 && (
              <div className={styles.pkgSec} style={{ borderColor: 'var(--border)' }}>
                <div className={styles.pkgSecHead} style={{ background: 'var(--surface)' }}>
                  <div className={styles.pkgSecTitle}>
                    <i className="bx bx-plus-circle"></i> Additional Items
                  </div>
                  <span className={styles.pkgSecCnt}>{additionalItems.length} item</span>
                </div>

                <div className={styles.qdItems} style={{ border: 'none', borderRadius: 0, margin: 0 }}>
                  {additionalItems.map(item => (
                    <div key={item.id} className={styles.qdItem}>
                      <img src={item.img} alt={item.name} className={styles.qdItemImg} />
                      <div className={styles.qdItemMain}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={styles.qdItemName}>{item.name}</span>
                          <span className={`${styles.qdItemSt} ${styles.stRequested}`}>You Requested</span>
                        </div>
                        <div className={styles.qdItemTag}>{item.tag} · {item.price}</div>
                      </div>
                      <button className={styles.btnSwap}>
                        <i className="bx bx-transfer"></i> Swap
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '12px 18px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
                  <button className={styles.pkgBtn} style={{ background: 'var(--card)' }}>
                    <i className="bx bx-plus"></i> Add Item
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT STICKY SUMMARY COLUMN MATCHING IMAGE 3 & 4 */}
          <div className={styles.rvSide}>
            <div className={styles.sumCard}>
              <div className={styles.sumHead}>
                <div className={styles.sumLbl}>New quote total · Rev. 2</div>
                <div className={styles.sumAmt}>{formatPrice(grandTotal)}</div>
                <div className={styles.sumSave} style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  {formatPrice(Math.round(grandTotal * 1.15))}
                </div>
              </div>

              <div className={styles.sumIns}>
                <div className={styles.sumInsLine}>
                  🤝 <span>You negotiated <b>{formatPrice(Math.round(grandTotal * 0.15))}</b> off</span>
                </div>
                <div className={styles.sumInsLine} style={{ color: 'var(--success)' }}>
                  🔒 <span>Strong deal · <b>consider locking soon</b></span>
                </div>
              </div>

              {/* Packages Summary Breakdown */}
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                {packages.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', padding: '4px 0' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{p.name}</span>
                    <span style={{ fontWeight: 800 }}>{formatPrice(p.price)}</span>
                  </div>
                ))}
                {additionalItems.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', padding: '4px 0' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{a.name}</span>
                    <span style={{ fontWeight: 800 }}>{a.price}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: 800 }}>
                <span>Total items</span>
                <span>{totalItemsCount} items</span>
              </div>

              {/* Discount Box */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="bx bx-purchase-tag" style={{ color: 'var(--primary)' }}></i> Discount
                </div>
                <div style={{ background: 'rgba(26,122,54,0.08)', border: '1px solid rgba(26,122,54,0.25)', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--success)' }}>10% discount accepted</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    You saved {formatPrice(Math.round(grandTotal * 0.1))} · new total {formatPrice(Math.round(grandTotal * 0.9))}
                  </div>
                </div>

                {!discountRequested ? (
                  <button onClick={() => setDiscountRequested(true)} className={styles.pkgBtn} style={{ width: '100%', justifyContent: 'center', borderStyle: 'dashed' }}>
                    <i className="bx bx-plus"></i> Request Additional Discount
                  </button>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 700, marginTop: '8px' }}>
                    <i className="bx bx-check-circle"></i> Discount request submitted to vendor
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className={styles.sumActs}>
                {isAccepted ? (
                  <div className={styles.sumBtn} style={{ background: 'rgba(26,122,54,0.12)', color: 'var(--success)', borderColor: 'rgba(26,122,54,0.3)', cursor: 'default' }}>
                    <i className="bx bx-check-circle" style={{ fontSize: '18px' }}></i> Quote Accepted
                  </div>
                ) : (
                  <>
                    <Link href={`/quotes/${quoteId}/accept`} className={`${styles.sumBtn} ${styles.sumBtnAccept}`}>
                      <i className="bx bx-check-shield"></i> Accept Quote
                    </Link>
                    <Link href={`/quotes/${quoteId}/revision`} className={`${styles.sumBtn} ${styles.sumBtnRevision}`}>
                      <i className="bx bx-edit-alt"></i> Revise Quote
                    </Link>
                    <button className={styles.sumBtn} style={{ background: 'var(--surface)' }}>
                      <i className="bx bx-list-ul"></i> Preview Final List
                    </button>
                  </>
                )}
              </div>

              <div className={styles.sumAnon}>
                <i className="bx bxs-shield-alt-2"></i>
                <span>Anonymous — the vendor's name is revealed only when you accept.</span>
              </div>
            </div>

            {/* Installment Payment Schedule Card matching Image 4 */}
            <div className={styles.sumCard} style={{ marginTop: '16px', padding: '18px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="bx bx-calendar-check" style={{ color: 'var(--primary)', fontSize: '18px' }}></i> Payment schedule
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                4 installments · nothing charged now
              </div>

              <div className={styles.pinst}>
                <div className={styles.pinstGutter}>
                  <div className={`${styles.pinstDot} ${styles.pinstDotToday}`}></div>
                  <div className={styles.pinstConn}></div>
                </div>
                <div className={styles.pinstBody}>
                  <div>
                    <div className={styles.pinstLabel}>Booking deposit</div>
                    <div className={styles.pinstDate}>On order confirmation (25%)</div>
                  </div>
                  <div className={styles.pinstAmt} style={{ color: 'var(--primary)' }}>{formatPrice(depositAmt)}</div>
                </div>
              </div>

              <div className={styles.pinst}>
                <div className={styles.pinstGutter}>
                  <div className={`${styles.pinstDot} ${styles.pinstDotFuture}`}></div>
                  <div className={styles.pinstConn}></div>
                </div>
                <div className={styles.pinstBody}>
                  <div>
                    <div className={styles.pinstLabel}>2nd installment</div>
                    <div className={styles.pinstDate}>30 days before event (25%)</div>
                  </div>
                  <div className={styles.pinstAmt}>{formatPrice(depositAmt)}</div>
                </div>
              </div>

              <div className={styles.pinst}>
                <div className={styles.pinstGutter}>
                  <div className={`${styles.pinstDot} ${styles.pinstDotFuture}`}></div>
                  <div className={styles.pinstConn}></div>
                </div>
                <div className={styles.pinstBody}>
                  <div>
                    <div className={styles.pinstLabel}>3rd installment</div>
                    <div className={styles.pinstDate}>14 days before event (25%)</div>
                  </div>
                  <div className={styles.pinstAmt}>{formatPrice(depositAmt)}</div>
                </div>
              </div>

              <div className={styles.pinst}>
                <div className={styles.pinstGutter}>
                  <div className={`${styles.pinstDot} ${styles.pinstDotFuture}`}></div>
                </div>
                <div className={styles.pinstBody}>
                  <div>
                    <div className={styles.pinstLabel}>Final balance</div>
                    <div className={styles.pinstDate}>On event day (25%)</div>
                  </div>
                  <div className={styles.pinstAmt}>{formatPrice(depositAmt)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
