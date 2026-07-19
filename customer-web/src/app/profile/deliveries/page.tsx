'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import styles from './page.module.css';

// Mock images utility
const II = (s: string) => `https://images.unsplash.com/photo-${s}?auto=format&fit=crop&w=160&h=160&q=80`;

// Mock package options
const PKG_OPTIONS = [
  { key: "all", name: "All Packages", img: "" },
  { key: "sound", name: "Sound & Lighting", img: II("1470225620780-dba8ba36b745") },
  { key: "catering", name: "Royal Biryani Catering", img: II("1585937421612-70a008356fbe") },
  { key: "florals", name: "Floral Decoration", img: II("1558618666-fcd25c85cd64") },
  { key: "photography", name: "Premium Photography", img: II("1519741347686-c1e0aadf4611") },
  { key: "couture", name: "Bride & Groom Couture", img: II("1594938298603-c8148c4dae35") }
];

// Mock delivery entries matching designs/all-deliveries.html
const MOCK_DELIVERIES = [
  {
    key: "sound",
    status: "arriving",
    statusLabel: "Out for Delivery",
    statusClass: "amber",
    name: "Sound & Lighting Setup",
    vendor: "SoundWave Productions",
    img: II("1470225620780-dba8ba36b745"),
    date: "Mar 14, 2025",
    meta: "5 items",
    together: true,
    note: "All 5 items arriving together",
    addr: { name: "Grand Marquee Hall", line: "Main Boulevard, Gulberg III, Lahore · +92 300 1234567" },
    items: [
      { img: II("1470225620780-dba8ba36b745"), name: "Line Array Speakers", v: "×4" },
      { img: II("1545454675-3531b543be5d"), name: "Subwoofers", v: "×2" },
      { img: II("1598488035139-bdbb2231ce04"), name: "Wireless Mics", v: "×6" },
      { img: II("1504509546545-e000b4a62425"), name: "LED Par Lights", v: "×12" },
      { img: II("1571266028243-e4733b0f0bb0"), name: "DJ Console", v: "Standard" }
    ]
  },
  {
    key: "catering",
    status: "arriving",
    statusLabel: "Preparing",
    statusClass: "amber",
    name: "Royal Biryani Catering",
    vendor: "Amber's Kitchen",
    img: II("1585937421612-70a008356fbe"),
    date: "Mar 15, 2025",
    meta: "4 items · 150 guests",
    together: true,
    note: "All 4 items arriving together",
    addr: { name: "Grand Marquee Hall", line: "Main Boulevard, Gulberg III, Lahore · +92 300 1234567" },
    items: [
      { img: II("1585937421612-70a008356fbe"), name: "Chicken Biryani", v: "Standard" },
      { img: II("1547592180-85f173990554"), name: "Beef Pulao", v: "Standard" },
      { img: II("1512621776951-a57141f2eefd"), name: "Raita & Salad", v: "Standard" },
      { img: II("1578985545062-69928b1d9587"), name: "Kheer", v: "Standard" }
    ]
  },
  {
    key: "florals",
    status: "arriving",
    statusLabel: "Scheduled",
    statusClass: "blue",
    name: "Floral Decoration — Grand Hall",
    vendor: "Rose Garden Events",
    img: II("1558618666-fcd25c85cd64"),
    date: "Mar 15, 2025",
    meta: "3 items",
    together: true,
    note: "All 3 items arriving together",
    addr: { name: "Grand Marquee Hall", line: "Main Boulevard, Gulberg III, Lahore · +92 300 1234567" },
    items: [
      { img: II("1519225421980-715cb0215aed"), name: "Stage Backdrop", v: "Red & White" },
      { img: II("1478146896981-b80fe463b330"), name: "Entrance Arch", v: "Standard" },
      { img: II("1561181286-d3fee7d55364"), name: "Table Centerpieces", v: "×15" }
    ]
  },
  {
    key: "photography",
    status: "arriving",
    statusLabel: "Scheduled",
    statusClass: "blue",
    name: "Premium Photography & Videography",
    vendor: "Lens & Light Studio",
    img: II("1519741347686-c1e0aadf4611"),
    date: "Mar 17 – 29, 2025",
    meta: "4 items",
    together: false,
    note: "Items arriving on different dates",
    addr: { name: "Adnan Siddiqui (Home)", line: "House 12, Street 4, DHA Phase 5, Lahore · +92 300 1234567" },
    items: [
      { img: II("1516035069371-29a1b244cc32"), name: "DSLR Cameras Setup", v: "×2 Photographers" },
      { img: II("1453060113865-968ceab6733f"), name: "4K Drone Camera", v: "1 Operator" },
      { img: II("1519741406604-58a2d1d575c3"), name: "Gimbal Video Rig", v: "1 Videographer" },
      { img: II("1542038784456-1ea8e935640e"), name: "Photo Albums", v: "×2 Premium Leather" }
    ]
  },
  {
    key: "couture",
    status: "delivered",
    statusLabel: "Delivered",
    statusClass: "green",
    name: "Bride & Groom Couture",
    vendor: "Royal Attire Boutique",
    img: II("1594938298603-c8148c4dae35"),
    date: "Delivered on Mar 10, 2025",
    meta: "2 items",
    together: true,
    note: "All 2 items delivered",
    addr: { name: "Adnan Siddiqui (Home)", line: "House 12, Street 4, DHA Phase 5, Lahore · +92 300 1234567" },
    items: [
      { img: II("1594938298603-c8148c4dae35"), name: "Handcrafted Sherwani", v: "Maroon / Custom" },
      { img: II("1583391733956-3750e0ff4809"), name: "Premium Bridal Lehenga", v: "Crimson Red" }
    ]
  }
];

interface DeliveryAddress {
  name: string;
  line: string;
}

interface DeliverySubItem {
  img: string;
  name: string;
  v: string;
}

interface DeliveryItem {
  key: string;
  status: string;
  statusLabel: string;
  statusClass: string;
  name: string;
  vendor: string;
  img: string;
  date: string;
  meta: string;
  together?: boolean;
  note?: string;
  addr?: DeliveryAddress;
  items: DeliverySubItem[];
  instruction?: string;
}

export default function DeliveriesPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>(MOCK_DELIVERIES);
  const [activeTab, setActiveTab] = useState<'arriving' | 'delivered'>('arriving');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('All');
  
  // Package Selector states
  const [isPkgSelectOpen, setIsPkgSelectOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(PKG_OPTIONS[0]);
  const [pkgSearchQuery, setPkgSearchQuery] = useState('');

  // Drawer overlays states
  const [openDrawerType, setOpenDrawerType] = useState<'track' | 'instr' | 'rate' | 'review' | 'seller' | null>(null);
  const [selectedItem, setSelectedItem] = useState<DeliveryItem | null>(null);
  const [instructionText, setInstructionText] = useState('');
  const [ratingStars, setRatingStars] = useState(5);
  const [reviewText, setReviewText] = useState('');

  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/profile/deliveries');
      return;
    }
    // Attempt dynamic fetch from API, fail-safe to mock data if endpoint is not built yet
    async function fetchDeliveries() {
      try {
        const res = await api.get<{ status: boolean; data: DeliveryItem[] }>('/api/v1/deliveries');
        if (res.status && res.data && res.data.length > 0) {
          // Parse API data if available
          setDeliveries(res.data);
        }
      } catch (e) {
        console.log('Using mockup deliveries fallback.');
      }
    }
    fetchDeliveries();
  }, []);

  const openDrawer = (type: 'track' | 'instr' | 'rate' | 'review' | 'seller', item: DeliveryItem) => {
    setSelectedItem(item);
    setOpenDrawerType(type);
    if (type === 'instr') {
      setInstructionText(item.instruction || '');
    } else {
      setRatingStars(5);
      setReviewText('');
    }
  };

  const handleSaveInstructions = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem) {
      setDeliveries(prev => prev.map(item => {
        if (item.key === selectedItem.key) {
          return { ...item, instruction: instructionText };
        }
        return item;
      }));
      showToast('Delivery instructions updated successfully.', 'success');
      setOpenDrawerType(null);
    }
  };


  const handleSubmitRating = () => {
    showToast(`Thank you! Rating of ${ratingStars} stars submitted.`, 'success');
    setOpenDrawerType(null);
  };

  const filteredPkgOptions = PKG_OPTIONS.filter(pkg => 
    pkg.name.toLowerCase().includes(pkgSearchQuery.toLowerCase())
  );

  // Filter deliveries based on active tab, package search, and dropdown selector
  const filteredDeliveries = deliveries.filter((deliv) => {
    const matchesTab = deliv.status === activeTab;
    const matchesPkg = selectedPkg.key === 'all' || deliv.key === selectedPkg.key;
    const matchesSearch = searchQuery.trim() === '' || 
      deliv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deliv.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesPkg && matchesSearch;
  });

  const arrivingCount = deliveries.filter(d => d.status === 'arriving').length;
  const deliveredCount = deliveries.filter(d => d.status === 'delivered').length;

  return (
    <>
      {toast && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          backgroundColor: toast.type === 'success' ? 'var(--success)' : toast.type === 'error' ? 'var(--primary)' : '#0277bd',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '8px',
          zIndex: 10000,
          boxShadow: 'var(--shadow-md)',
          fontFamily: 'Poppins, sans-serif',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <i className={toast.type === 'success' ? 'bx bx-check-circle' : toast.type === 'error' ? 'bx bx-error-circle' : 'bx bx-info-circle'} style={{ fontSize: '18px' }}></i>
          {toast.message}
        </div>
      )}

      <div>
        <div className={styles.pageHead}>
          <h2 className={styles.pageTitle}>All Deliveries</h2>
          <p className={styles.pageSub}>Track every package across your orders — what&apos;s arriving and what&apos;s been delivered.</p>
        </div>

        {/* Tab Selection */}
        <div className={styles.payTabs}>
          <button
            className={`${styles.payTab} ${activeTab === 'arriving' ? styles.active : ''}`}
            onClick={() => setActiveTab('arriving')}
          >
            Arriving <span className={styles.payTabCount}>{arrivingCount}</span>
          </button>
          <button
            className={`${styles.payTab} ${activeTab === 'delivered' ? styles.active : ''}`}
            onClick={() => setActiveTab('delivered')}
          >
            Delivered <span className={styles.payTabCount}>{deliveredCount}</span>
          </button>
        </div>

        {/* Search & Package filters */}
        <div className={styles.filterbar}>
          <div className={styles.filterSearch}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Search by package or vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            className={`${styles.periodChip} ${selectedPeriod === 'All' ? styles.active : ''}`}
            onClick={() => setSelectedPeriod('All')}
          >
            All
          </button>
          <button
            className={`${styles.periodChip} ${selectedPeriod === '3 Months' ? styles.active : ''}`}
            onClick={() => setSelectedPeriod('3 Months')}
          >
            3 Months
          </button>
          <button
            className={`${styles.periodChip} ${selectedPeriod === '6 Months' ? styles.active : ''}`}
            onClick={() => setSelectedPeriod('6 Months')}
          >
            6 Months
          </button>
          <button
            className={`${styles.periodChip} ${selectedPeriod === '12 Months' ? styles.active : ''}`}
            onClick={() => setSelectedPeriod('12 Months')}
          >
            12 Months
          </button>
        </div>

        {/* Package Dropdown Selector */}
        <div className={`${styles.pkgSelect} ${isPkgSelectOpen ? styles.open : ''}`}>
          <div
            className={styles.pkgSelectTrigger}
            onClick={() => setIsPkgSelectOpen(!isPkgSelectOpen)}
          >
            <div className={styles.pkgSelectCurrent}>
              {selectedPkg.img ? (
                <img src={selectedPkg.img} alt={selectedPkg.name} />
              ) : (
                <i className="bx bx-package"></i>
              )}
              <span>{selectedPkg.name}</span>
            </div>
            <i className={`bx bx-chevron-down ${styles.pkgSelectChev}`}></i>
          </div>

          {isPkgSelectOpen && (
            <div className={styles.pkgSelectMenu}>
              <div className={styles.pkgSearch}>
                <i className="bx bx-search"></i>
                <input
                  type="text"
                  placeholder="Filter packages..."
                  value={pkgSearchQuery}
                  onChange={(e) => setPkgSearchQuery(e.target.value)}
                />
              </div>
              <div className={styles.pkgOptions}>
                {filteredPkgOptions.length > 0 ? (
                  filteredPkgOptions.map((pkg) => (
                    <button
                      key={pkg.key}
                      className={`${styles.pkgOption} ${selectedPkg.key === pkg.key ? styles.active : ''}`}
                      onClick={() => {
                        setSelectedPkg(pkg);
                        setIsPkgSelectOpen(false);
                        setPkgSearchQuery('');
                      }}
                    >
                      {pkg.img ? (
                        <img src={pkg.img} alt={pkg.name} />
                      ) : (
                        <i className={`bx bx-package ${styles.lead}`}></i>
                      )}
                      <span>{pkg.name}</span>
                      <i className={`bx bx-check ${styles.chk}`}></i>
                    </button>
                  ))
                ) : (
                  <div className={styles.pkgNoopt}>No packages found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Deliveries list container */}
        <div style={{ marginTop: '20px' }}>
          {filteredDeliveries.length > 0 ? (
            filteredDeliveries.map((deliv, idx) => (
              <div key={idx} className={styles.dlvCard}>
                <div className={styles.ddPkgHead}>
                  <img src={deliv.img} alt={deliv.name} className={styles.ddPkgImg} />
                  <div className={styles.ddPkgInfo}>
                    <h4 className={styles.ddPkgName}>{deliv.name}</h4>
                    <div className={styles.ddPkgVendor}>
                      <i className="bx bx-store"></i> Sold by {deliv.vendor}
                    </div>
                    <div className={styles.ddPkgMeta}>
                      <i className="bx bx-calendar"></i> Estimated: {deliv.date} · {deliv.meta}
                    </div>
                  </div>
                  <span className={`${styles.ddStatus} ${styles[deliv.statusClass]}`}>
                    {deliv.statusLabel}
                  </span>
                </div>

                {/* Delivery location address */}
                <div className={styles.addrCard} style={{ marginTop: '14px', borderStyle: 'dashed' }}>
                  <div className={styles.addrIc}>
                    <i className="bx bx-map"></i>
                  </div>
                  {deliv.addr && (
                    <div>
                      <span className={styles.addrEyebrow}>Delivery Location</span>
                      <h5 className={styles.addrName}>{deliv.addr.name}</h5>
                      <p className={styles.addrLine}>{deliv.addr.line}</p>
                    </div>
                  )}
                </div>

                {/* Delivery Items Scroller */}
                <div className={`${styles.ddNote} ${deliv.together ? styles.together : styles.partial}`}>
                  <i className={deliv.together ? 'bx bx-check-circle' : 'bx bx-info-circle'}></i>
                  <span>{deliv.note}</span>
                </div>

                <div className={styles.ddItems}>
                  {deliv.items.map((item, itemIdx) => (
                    <div key={itemIdx} className={styles.ddItem}>
                      <img src={item.img} alt={item.name} />
                      <span className={styles.ddItemName}>{item.name}</span>
                      <span className={styles.ddItemVar}>{item.v}</span>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className={styles.dlvActions}>
                  {deliv.status === 'arriving' ? (
                    <>
                      <button onClick={() => openDrawer('track', deliv)} className={styles.dlvPill}>
                        <i className="bx bx-map"></i> Track Package
                      </button>
                      <button onClick={() => openDrawer('instr', deliv)} className={styles.dlvPill}>
                        <i className="bx bx-edit"></i> Add Instructions
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => openDrawer('rate', deliv)} className={`${styles.dlvPill} ${styles.green}`}>
                        <i className="bx bx-star"></i> Rate Package
                      </button>
                      <button onClick={() => openDrawer('seller', deliv)} className={styles.dlvPill}>
                        <i className="bx bx-store-alt"></i> Rate Seller
                      </button>
                      <button onClick={() => openDrawer('review', deliv)} className={styles.dlvPill}>
                        <i className="bx bx-message-square-detail"></i> Review Products
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              No matching deliveries found.
            </div>
          )}
        </div>
      </div>

      {/* Drawer Overlay for Sliding Panels */}
      <div className={`${styles.drawerOverlay} ${openDrawerType ? styles.open : ''}`} onClick={() => setOpenDrawerType(null)}>
        {openDrawerType && selectedItem && (
          <div className={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dwHead}>
              <div>
                <span className={styles.dwEyebrow}>
                  {openDrawerType === 'track' && 'Track Delivery'}
                  {openDrawerType === 'instr' && 'Delivery Instructions'}
                  {openDrawerType === 'rate' && 'Rate Package'}
                  {openDrawerType === 'review' && 'Product Review'}
                  {openDrawerType === 'seller' && 'Seller Feedback'}
                </span>
                <h3 className={styles.dwTitle}>{selectedItem.name}</h3>
                <p className={styles.dwSub}>Sold by {selectedItem.vendor}</p>
              </div>
              <button onClick={() => setOpenDrawerType(null)} className={styles.dwClose}>
                <i className="bx bx-x"></i>
              </button>
            </div>

            <div className={styles.dwBody}>
              {/* TRACKING PATH */}
              {openDrawerType === 'track' && (
                <div>
                  <div className={styles.rateHeader}>
                    <img src={selectedItem.img} alt={selectedItem.name} />
                    <div>
                      <div className={styles.rateTitleText}>Delivery tracking number</div>
                      <div className={styles.rateVendorText} style={{ fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.4px', marginTop: '3px' }}>
                        TYR-{selectedItem.key.toUpperCase()}-84938
                      </div>
                    </div>
                  </div>

                  <div className={styles.trackStatusList}>
                    <div className={`${styles.trackStatusStep} ${styles.done}`}>
                      <div className={styles.trackStatusName}>Order Confirmed</div>
                      <div className={styles.trackStatusDate}>Mar 08, 2025 · 02:44 PM</div>
                    </div>
                    <div className={`${styles.trackStatusStep} ${styles.done}`}>
                      <div className={styles.trackStatusName}>Prepared &amp; Dispatched</div>
                      <div className={styles.trackStatusDate}>Mar 11, 2025 · 11:30 AM</div>
                    </div>
                    <div className={`${styles.trackStatusStep} ${selectedItem.statusLabel === 'Out for Delivery' ? styles.done : styles.active}`}>
                      <div className={styles.trackStatusName}>In Transit</div>
                      <div className={styles.trackStatusDate}>Mar 13, 2025 · 09:00 AM</div>
                    </div>
                    <div className={`${styles.trackStatusStep} ${selectedItem.statusLabel === 'Out for Delivery' ? styles.active : ''}`}>
                      <div className={styles.trackStatusName}>Out for Delivery</div>
                      <div className={styles.trackStatusDate}>
                        {selectedItem.statusLabel === 'Out for Delivery' ? 'Arriving Today' : 'Pending'}
                      </div>
                    </div>
                    <div className={styles.trackStatusStep}>
                      <div className={styles.trackStatusName}>Delivered</div>
                      <div className={styles.trackStatusDate}>Scheduled</div>
                    </div>
                  </div>
                </div>
              )}

              {/* WRITE INSTRUCTIONS */}
              {openDrawerType === 'instr' && (
                <form onSubmit={handleSaveInstructions}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '14px' }}>
                    Leave special instructions for the vendor driver (e.g. entry codes, drop-off location, timing restrictions).
                  </p>
                  <textarea
                    className={styles.instTextarea}
                    placeholder="Enter delivery instructions here..."
                    value={instructionText}
                    onChange={(e) => setInstructionText(e.target.value)}
                  />
                  <div style={{ marginTop: '20px' }}>
                    <button type="submit" className={styles.instrSave}>
                      <i className="bx bx-check"></i> Save Delivery Instructions
                    </button>
                  </div>
                </form>
              )}

              {/* RATING DRAWER */}
              {openDrawerType === 'rate' && (
                <div>
                  <div className={styles.rateHeader}>
                    <img src={selectedItem.img} alt={selectedItem.name} />
                    <div>
                      <div className={styles.rateTitleText}>{selectedItem.name}</div>
                      <div className={styles.rateVendorText}>{selectedItem.vendor}</div>
                    </div>
                  </div>
                  
                  <label className={styles.fldLbl}>How would you rate this service package?</label>
                  <div className={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`bx ${star <= ratingStars ? 'bxs-star active' : 'bx-star'}`}
                        onClick={() => setRatingStars(star)}
                      ></i>
                    ))}
                  </div>

                  <label className={styles.fldLbl}>Share your feedback (Optional)</label>
                  <textarea
                    className={styles.instTextarea}
                    placeholder="Tell us about the quality of the package..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  />
                  
                  <div style={{ marginTop: '20px' }}>
                    <button onClick={handleSubmitRating} className={styles.instrSave}>
                      <i className="bx bx-check"></i> Submit Rating Feedback
                    </button>
                  </div>
                </div>
              )}

              {/* SELLER FEEDBACK */}
              {openDrawerType === 'seller' && (
                <div>
                  <label className={styles.fldLbl}>Rate the vendor ({selectedItem.vendor})</label>
                  <div className={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`bx ${star <= ratingStars ? 'bxs-star active' : 'bx-star'}`}
                        onClick={() => setRatingStars(star)}
                      ></i>
                    ))}
                  </div>

                  <label className={styles.fldLbl}>Write your feedback (Optional)</label>
                  <textarea
                    className={styles.instTextarea}
                    placeholder="How was your communication and scheduling experience with this vendor?..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  />

                  <div style={{ marginTop: '20px' }}>
                    <button onClick={handleSubmitRating} className={styles.instrSave}>
                      <i className="bx bx-check"></i> Submit Seller Review
                    </button>
                  </div>
                </div>
              )}

              {/* PRODUCT REVIEWS */}
              {openDrawerType === 'review' && (
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '14px' }}>
                    Write product-specific reviews for items included in this delivery.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {selectedItem?.items.map((sub, sIdx) => (
                      <div key={sIdx} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <img src={sub.img} alt={sub.name} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{sub.name}</span>
                        </div>
                        <div className={styles.starRow} style={{ fontSize: '20px', margin: '8px 0' }}>
                          <i className="bx bxs-star active"></i>
                          <i className="bx bxs-star active"></i>
                          <i className="bx bxs-star active"></i>
                          <i className="bx bxs-star active"></i>
                          <i className="bx bxs-star active"></i>
                        </div>
                        <input type="text" className={styles.fldInput} style={{ height: '36px', fontSize: '12px' }} placeholder="Review comment..." />
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <button onClick={handleSubmitRating} className={styles.instrSave}>
                      <i className="bx bx-check"></i> Submit Product Reviews
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
