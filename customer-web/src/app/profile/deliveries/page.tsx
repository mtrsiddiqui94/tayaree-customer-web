'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
const MOCK_DELIVERIES: DeliveryGroup[] = [
  {
    dateHeading: "Arriving Mar 14th, 2025",
    status: "arriving",
    packages: [
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
          { img: II("1470225620780-dba8ba36b745"), name: "Line Array Speakers", v: ["×4"], date: "Mar 14th, 2025", status: "Pending" },
          { img: II("1545454675-3531b543be5d"), name: "Subwoofers", v: ["×2"], date: "Mar 14th, 2025", status: "Pending" },
          { img: II("1598488035139-bdbb2231ce04"), name: "Wireless Mics", v: ["×6"], date: "Mar 14th, 2025", status: "Pending" },
          { img: II("1504509546545-e000b4a62425"), name: "LED Par Lights", v: ["×12"], date: "Mar 14th, 2025", status: "Pending" },
          { img: II("1571266028243-e4733b0f0bb0"), name: "DJ Console", v: ["Standard"], date: "Mar 14th, 2025", status: "Pending" }
        ]
      }
    ]
  },
  {
    dateHeading: "Arriving Mar 15th, 2025",
    status: "arriving",
    packages: [
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
          { img: II("1585937421612-70a008356fbe"), name: "Chicken Biryani", v: ["Standard"], date: "Mar 15th, 2025", status: "Preparing" },
          { img: II("1547592180-85f173990554"), name: "Beef Pulao", v: ["Standard"], date: "Mar 15th, 2025", status: "Preparing" },
          { img: II("1512621776951-a57141f2eefd"), name: "Raita & Salad", v: ["Standard"], date: "Mar 15th, 2025", status: "Preparing" },
          { img: II("1578985545062-69928b1d9587"), name: "Kheer", v: ["Standard"], date: "Mar 15th, 2025", status: "Preparing" }
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
          { img: II("1519225421980-715cb0215aed"), name: "Stage Backdrop", v: ["Red & White"], date: "Mar 15th, 2025", status: "Scheduled" },
          { img: II("1478146896981-b80fe463b330"), name: "Entrance Arch", v: ["Standard"], date: "Mar 15th, 2025", status: "Scheduled" },
          { img: II("1561181286-d3fee7d55364"), name: "Table Centerpieces", v: ["×15"], date: "Mar 15th, 2025", status: "Scheduled" }
        ]
      }
    ]
  },
  {
    dateHeading: "Arriving Mar 17 – 29, 2025",
    status: "arriving",
    packages: [
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
          { img: II("1516035069371-29a1b244cc32"), name: "DSLR Cameras Setup", v: ["×2 Photographers"], date: "Mar 17th, 2025", status: "Confirmed" },
          { img: II("1453060113865-968ceab6733f"), name: "4K Drone Camera", v: ["1 Operator"], date: "Mar 17th, 2025", status: "Confirmed" },
          { img: II("1519741406604-58a2d1d575c3"), name: "Gimbal Video Rig", v: ["1 Videographer"], date: "Mar 19th, 2025", status: "Pending" },
          { img: II("1542038784456-1ea8e935640e"), name: "Photo Albums", v: ["×2 Premium Leather"], date: "Mar 29th, 2025", status: "Pending" }
        ]
      }
    ]
  },
  {
    dateHeading: "Delivered on Mar 10, 2025",
    status: "delivered",
    packages: [
      {
        key: "couture",
        status: "delivered",
        statusLabel: "Delivered",
        statusClass: "green",
        name: "Bride & Groom Couture",
        vendor: "Royal Attire Boutique",
        img: II("1594938298603-c8148c4dae35"),
        date: "Mar 10, 2025",
        meta: "2 items",
        together: true,
        note: "All 2 items delivered",
        addr: { name: "Adnan Siddiqui (Home)", line: "House 12, Street 4, DHA Phase 5, Lahore · +92 300 1234567" },
        items: [
          { img: II("1594938298603-c8148c4dae35"), name: "Handcrafted Sherwani", v: ["Maroon", "Custom"], date: "Mar 10th, 2025", status: "Delivered" },
          { img: II("1583391733956-3750e0ff4809"), name: "Premium Bridal Lehenga", v: ["Crimson Red"], date: "Mar 10th, 2025", status: "Delivered" }
        ]
      }
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
  v: string[];
  date?: string;
  status?: string;
}

interface DeliveryPackage {
  key: string;
  packageId: number;
  itemId: number;
  status: 'arriving' | 'delivered';
  statusLabel: string;
  statusClass: string;
  name: string;
  vendor: string;
  deliverAs: string;
  img: string;
  date: string;
  meta: string;
  together?: boolean;
  note?: string;
  addr?: DeliveryAddress;
  items: DeliverySubItem[];
  instruction?: string;
  trackingId?: string;
  timeline?: any[];
}

interface DeliveryGroup {
  dateHeading: string;
  status: string;
  packages: DeliveryPackage[];
}

export default function DeliveriesPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<DeliveryGroup[]>(MOCK_DELIVERIES);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'arriving' | 'delivered'>('arriving');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('All');
  
  // Package Selector states
  const [isPkgSelectOpen, setIsPkgSelectOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(PKG_OPTIONS[0]);
  const [pkgSearchQuery, setPkgSearchQuery] = useState('');

  const [openDrawerType, setOpenDrawerType] = useState<'track' | 'instr' | 'rate' | 'review' | 'seller' | null>(null);
  const [selectedItem, setSelectedItem] = useState<DeliveryPackage | null>(null);
  
  // Instruction Drawer States
  const [instructionText, setInstructionText] = useState('');
  const [instrTimePref, setInstrTimePref] = useState<'morning' | 'afternoon' | 'evening' | ''>('');
  const [instrContact, setInstrContact] = useState('');
  const [instrQuickOption, setInstrQuickOption] = useState('');
  const [instrApplyAll, setInstrApplyAll] = useState(false);
  const [isSavingInstr, setIsSavingInstr] = useState(false);

  // Review Drawer States
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
    // Dynamic fetch from Arriving and Delivered endpoints
    async function fetchDeliveries() {
      setIsLoading(true);
      try {
        const [arrivingRes, deliveredRes] = await Promise.all([
          api.get<{ status: boolean; data: any[] }>('/api/v1/profile/order/arriving?page=1&limit=25'),
          api.get<{ status: boolean; data: any[] }>('/api/v1/profile/order/delivered?page=1&limit=25')
        ]);
        
        const parseGroup = (group: any, tabStatus: 'arriving' | 'delivered'): DeliveryGroup => {
          return {
            dateHeading: group.heading || (tabStatus === 'arriving' ? 'Arriving Soon' : 'Delivered'),
            status: tabStatus,
            packages: (group.items || []).map((pkg: any) => {
              return {
                key: pkg.id?.toString() || Math.random().toString(),
                packageId: pkg.id || 0,
                itemId: pkg.item_id || pkg.itemId || 0,
                status: tabStatus,
                statusLabel: pkg.status || (tabStatus === 'arriving' ? 'Arriving' : 'Delivered'),
                statusClass: tabStatus === 'arriving' ? 'amber' : 'green',
                name: pkg.item_name || pkg.itemName || '',
                vendor: pkg.vendor_name || pkg.vendorName || '',
                deliverAs: pkg.deliver_as || pkg.deliverAs || 'package',
                img: pkg.item_image || pkg.itemImage || '',
                date: pkg.delivery_date || pkg.deliver_date || pkg.delivered_date || '',
                meta: pkg.quantity ? `Qty ${pkg.quantity}` : '',
                together: true, 
                note: pkg.note_line?.text || pkg.noteLine?.text || '',
                addr: { name: 'Delivery Location', line: pkg.shipping_address || pkg.address || group.shipping_address || group.address || '' },
                trackingId: pkg.tracking_id || pkg.trackingId || '',
                timeline: pkg.timeline || [],
                items: (pkg.images || pkg.items || []).map((sub: any) => {
                  const variantProps = [sub.color, sub.size, sub.duration, sub.timeslot, sub.days].filter(Boolean);
                  if (variantProps.length === 0 && (sub.variant_name || sub.variantName)) {
                    variantProps.push(sub.variant_name || sub.variantName);
                  }
                  if (variantProps.length === 0) {
                    variantProps.push('Standard');
                  }
                  return {
                    img: sub.image || sub.item_image || pkg.item_image || pkg.itemImage || '',
                    name: sub.item_name || sub.itemName || pkg.item_name || pkg.itemName || '',
                    v: variantProps,
                    date: sub.delivery_date || sub.deliver_date || sub.delivered_date || pkg.delivery_date || pkg.deliver_date || pkg.delivered_date || '',
                    status: sub.delivery_status || sub.status || pkg.delivery_status || pkg.status || ''
                  };
                })
              };
            })
          };
        };

        const getGroupList = (res: any) => {
          if (Array.isArray(res)) return res;
          if (res?.data && Array.isArray(res.data)) return res.data;
          if (res?.data?.items && Array.isArray(res.data.items)) return res.data.items;
          if (res?.items && Array.isArray(res.items)) return res.items;
          return [];
        };

        const arriving = getGroupList(arrivingRes).map((g: any) => parseGroup(g, 'arriving'));
        const delivered = getGroupList(deliveredRes).map((g: any) => parseGroup(g, 'delivered'));
        
        if (arriving.length > 0 || delivered.length > 0) {
          setDeliveries([...arriving, ...delivered]);
        }
      } catch (e) {
        console.log('Using mockup deliveries fallback as API failed.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchDeliveries();
  }, []);

  const openDrawer = (type: 'track' | 'instr' | 'rate' | 'review' | 'seller', item: DeliveryPackage) => {
    setSelectedItem(item);
    setOpenDrawerType(type);
    if (type === 'instr') {
      setInstructionText(item.instruction || '');
      setInstrTimePref('');
      setInstrContact('');
      setInstrQuickOption('');
      setInstrApplyAll(false);
    } else {
      setRatingStars(5);
      setReviewText('');
    }
  };

  const handleSaveInstructions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !selectedItem.packageId) return;

    if (!instructionText.trim() && !instrQuickOption) {
      showToast('Please enter instructions or select a quick option.', 'error');
      return;
    }

    setIsSavingInstr(true);
    try {
      // Backend validation requires delivery_instructions to not be empty when there is no media_id.
      const finalInstrText = instructionText.trim() ? instructionText : (instrQuickOption || 'N/A');

      const res = await api.post<{ status: boolean; message?: string }>(`/api/v1/order/items/${selectedItem.packageId}/delivery-instructions`, {
        item_id: selectedItem.itemId,
        deliver_as: selectedItem.deliverAs,
        time_preference: instrTimePref,
        contact_preference: instrContact,
        delivery_instructions: finalInstrText,
        apply_all_item: instrApplyAll ? 1 : 0,
        quick_option: instrQuickOption
      });

      if (res.status !== false) {
        setDeliveries(prev => prev.map(item => {
          if (item.key === selectedItem.key) {
            return { ...item, instruction: instructionText };
          }
          return item;
        }));
        showToast(res.message || 'Delivery instructions updated successfully.', 'success');
        setOpenDrawerType(null);
      } else {
        showToast(res.message || 'Failed to update instructions.', 'error');
      }
    } catch (err) {
      showToast('An error occurred while saving instructions.', 'error');
    } finally {
      setIsSavingInstr(false);
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
  const filteredDeliveries = deliveries
    .filter(group => group.status === activeTab)
    .map(group => {
      const filteredPkgs = group.packages.filter(pkg => {
        const matchesPkg = selectedPkg.key === 'all' || pkg.key === selectedPkg.key;
        const matchesSearch = searchQuery.trim() === '' || 
          pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pkg.vendor.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesPkg && matchesSearch;
      });
      return { ...group, packages: filteredPkgs };
    })
    .filter(group => group.packages.length > 0);

  const arrivingCount = deliveries.filter(d => d.status === 'arriving').reduce((acc, g) => acc + g.packages.length, 0);
  const deliveredCount = deliveries.filter(d => d.status === 'delivered').reduce((acc, g) => acc + g.packages.length, 0);

  return (
    <DashboardLayout breadcrumbTitle="My Deliveries">
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
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
              <p style={{ marginTop: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>Loading deliveries...</p>
            </div>
          ) : filteredDeliveries.length > 0 ? (
            filteredDeliveries.map((group, gIdx) => (
              <div key={gIdx} className={styles.dlvGroupCard}>
                <div className={styles.dlvGroupHead}>
                  <i className="bx bx-calendar"></i>
                  <span>{group.dateHeading}</span>
                </div>
                
                {group.packages.map((pkg, pIdx) => (
                  <div key={pIdx} className={`${styles.dlvPkgRow} ${pIdx < group.packages.length - 1 ? styles.borderBottom : ''}`}>
                    <div className={styles.ddPkgHead}>
                      <img src={pkg.img} alt={pkg.name} className={styles.ddPkgImg} />
                      <div className={styles.ddPkgInfo}>
                        <h4 className={styles.ddPkgName}>{pkg.name}</h4>
                        <div className={styles.ddPkgVendor}>
                          <i className="bx bx-store"></i> Sold by {pkg.vendor}
                        </div>
                        <div className={styles.ddPkgMeta}>
                          <i className="bx bx-package"></i> {pkg.meta}
                        </div>
                      </div>
                      <span className={`${styles.ddStatus} ${styles[pkg.statusClass]}`}>
                        {pkg.statusLabel}
                      </span>
                    </div>

                    {/* Delivery location address */}
                    <div className={styles.addrCard} style={{ marginTop: '14px', borderStyle: 'dashed' }}>
                      <div className={styles.addrIc}>
                        <i className="bx bx-map"></i>
                      </div>
                      {pkg.addr && (
                        <div>
                          <span className={styles.addrEyebrow}>Delivery Location</span>
                          <h5 className={styles.addrName}>{pkg.addr.name}</h5>
                          <p className={styles.addrLine}>{pkg.addr.line}</p>
                        </div>
                      )}
                    </div>

                    {/* Delivery Items Scroller */}
                    <div className={`${styles.ddNote} ${pkg.together ? styles.together : styles.partial}`}>
                      <i className={pkg.together ? 'bx bx-check-circle' : 'bx bx-info-circle'}></i>
                      <span>{pkg.note}</span>
                    </div>

                    <div className={styles.ddItems}>
                      {pkg.items.map((item, itemIdx) => (
                        <div key={itemIdx} className={styles.ddItem}>
                          <img src={item.img} alt={item.name} />
                          <span className={styles.ddItemName}>{item.name}</span>
                          <div className={styles.ddItemVarList}>
                            {item.v.map((variant, vIdx) => (
                              <span key={vIdx} className={styles.ddItemVarChip}>{variant}</span>
                            ))}
                          </div>
                          {item.date && <span className={styles.ddItemDate}>{item.date}</span>}
                          {item.status && <span className={styles.ddItemStatus}>{item.status}</span>}
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className={styles.dlvActions}>
                      {pkg.status === 'arriving' ? (
                        <>
                          <button onClick={() => openDrawer('track', pkg)} className={styles.dlvPill}>
                            <i className="bx bx-map"></i> Track Package
                          </button>
                          <button onClick={() => openDrawer('instr', pkg)} className={styles.dlvPill}>
                            <i className="bx bx-edit"></i> Add Instructions
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => openDrawer('rate', pkg)} className={`${styles.dlvPill} ${styles.green}`}>
                            <i className="bx bx-star"></i> Rate Package
                          </button>
                          <button onClick={() => openDrawer('seller', pkg)} className={styles.dlvPill}>
                            <i className="bx bx-store-alt"></i> Rate Seller
                          </button>
                          <button onClick={() => openDrawer('review', pkg)} className={styles.dlvPill}>
                            <i className="bx bx-message-square-detail"></i> Review Products
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
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
                        {selectedItem.trackingId || `TYR-${selectedItem.key.toUpperCase()}-84938`}
                      </div>
                    </div>
                  </div>

                  <div className={styles.trackStatusList}>
                    {selectedItem.timeline && selectedItem.timeline.length > 0 ? (
                      selectedItem.timeline.map((step, stepIdx) => (
                        <div key={stepIdx} className={`${styles.trackStatusStep} ${step.state === 'done' ? styles.done : step.state === 'active' ? styles.active : ''}`}>
                          <div className={styles.trackStatusName}>{step.label}</div>
                          <div className={styles.trackStatusDate}>{step.date || step.message}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No tracking timeline available yet.</div>
                    )}
                  </div>
                </div>
              )}

              {/* WRITE INSTRUCTIONS */}
              {openDrawerType === 'instr' && (
                <form onSubmit={handleSaveInstructions} className={styles.instrForm}>
                  
                  {/* Time Preferences */}
                  <label className={styles.fldLbl}>Time Preferences</label>
                  <div className={styles.instrTimeRow}>
                    {[
                      { id: 'morning', label: 'Morning', sub: '9 AM - 1 PM', icon: 'bx-sun' },
                      { id: 'afternoon', label: 'Afternoon', sub: '1 PM - 6 PM', icon: 'bx-cloud-light-rain' },
                      { id: 'evening', label: 'Evening', sub: '6 PM - 10 PM', icon: 'bx-moon' }
                    ].map((opt) => (
                      <div 
                        key={opt.id}
                        className={`${styles.instrTimeCard} ${instrTimePref === opt.id ? styles.active : ''}`}
                        onClick={() => setInstrTimePref(opt.id as any)}
                      >
                        <i className={`bx ${opt.icon}`}></i>
                        <span className={styles.timeLbl}>{opt.label}</span>
                        <span className={styles.timeSub}>{opt.sub}</span>
                      </div>
                    ))}
                  </div>

                  {/* Alter Delivery to contact */}
                  <div style={{ marginTop: '24px' }}>
                    <label className={styles.fldLbl}>Alter Delivery to contact</label>
                    <div className={styles.instrContactWrap}>
                      <i className="bx bx-phone"></i>
                      <input 
                        type="tel"
                        placeholder="e.g. 03001234567"
                        value={instrContact}
                        onChange={(e) => setInstrContact(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Delivery Instructions */}
                  <div style={{ marginTop: '24px' }}>
                    <label className={styles.fldLbl}>Delivery Instructions</label>
                    <textarea
                      className={styles.instTextarea}
                      placeholder="Enter delivery instructions here..."
                      value={instructionText}
                      onChange={(e) => setInstructionText(e.target.value)}
                      disabled={isSavingInstr}
                    />
                  </div>

                  {/* Quick Options */}
                  <div className={styles.instrChipsWrap}>
                    {['Call upon arrival', 'Ring doorbell', 'Hand over to guard', "Don't ring bell"].map(opt => (
                      <div 
                        key={opt}
                        className={`${styles.instrChip} ${instrQuickOption === opt ? styles.active : ''}`}
                        onClick={() => setInstrQuickOption(opt === instrQuickOption ? '' : opt)}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>

                  {/* Apply to all item */}
                  <label className={styles.instrCheckboxLabel}>
                    <input 
                      type="checkbox"
                      checked={instrApplyAll}
                      onChange={(e) => setInstrApplyAll(e.target.checked)}
                    />
                    Apply to all item
                  </label>

                  <div style={{ marginTop: '24px' }}>
                    <button type="submit" className={styles.instrSave} disabled={isSavingInstr}>
                      {isSavingInstr ? <i className="bx bx-loader-alt bx-spin"></i> : <i className="bx bx-check"></i>}
                      {isSavingInstr ? ' Updating...' : ' Update Instructions'}
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
  </DashboardLayout>
  );
}
