'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import styles from './page.module.css';

interface RegistryItem {
  id: number | string;
  name: string;
  vendor: string;
  price: number;
  was?: number;
  qty?: number;
  img?: string;
  status: 'available' | 'reserved' | 'bought';
  by?: string;
  category?: string;
  slug?: string;
}

const CATALOG_PACKAGES: Omit<RegistryItem, 'id' | 'status'>[] = [
  { name: "Silverspoon Gold Package", vendor: "Silver Spoon Catering", price: 2000, was: 2500, qty: 1, img: "https://images.unsplash.com/photo-1555244162-803834f70033?w=400&h=240&fit=crop", category: "catering", slug: "silverspoon-gold-package" },
  { name: "Wedding Photography", vendor: "Pixel Perfect Studios", price: 85000, was: 95000, qty: 1, img: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400&h=240&fit=crop", category: "photography", slug: "premium-photography-video" },
  { name: "Mehndi Decor Package", vendor: "Rang Barangi Events", price: 45000, was: 52000, qty: 1, img: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&h=240&fit=crop", category: "mehndi", slug: "bridal-mehndi-artist-package" },
  { name: "Floral Arrangements", vendor: "Bloom & Bliss LHR", price: 28000, was: 0, qty: 2, img: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=240&fit=crop", category: "decor", slug: "floral-stage-hall-decor" },
  { name: "Live Music Band", vendor: "Lahore Beats Co.", price: 60000, was: 0, qty: 1, img: "https://images.unsplash.com/photo-1571266028234-7dc0e9ea5e24?w=400&h=240&fit=crop", category: "music", slug: "live-sound-dj-lighting" },
  { name: "Bridal Makeup & Hair", vendor: "Glam by Sana K.", price: 35000, was: 40000, qty: 1, img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=240&fit=crop", category: "beauty", slug: "bridal-hd-makeup-hair-styling" },
  { name: "Grand Palace Hall Booking", vendor: "Grand Palace Banquet", price: 400000, was: 0, qty: 1, img: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=240&fit=crop", category: "venue", slug: "grand-palace-hall-booking" }
];

function fmt(n: number): string {
  return (n || 0).toLocaleString('en-IN');
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function RegistryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const regId = params?.id as string;

  const [registry, setRegistry] = useState<any | null>(null);
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [guests, setGuests] = useState<string[]>([]);
  
  const [filter, setFilter] = useState<'all' | 'available' | 'reserved' | 'bought'>('all');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [pendingDelItem, setPendingDelItem] = useState<RegistryItem | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [viewingPackage, setViewingPackage] = useState<RegistryItem | null>(null);

  useEffect(() => {
    let currentReg: any = null;

    // 1. Try local storage first
    try {
      const stored = JSON.parse(localStorage.getItem('local_registries') || '[]');
      currentReg = stored.find((r: any) => String(r.id) === String(regId));
    } catch (e) {}

    // 2. Fallback default registry if not found
    if (!currentReg) {
      currentReg = {
        id: regId || 'reg-1',
        name: "Zara & Ahmed's Wedding Registry",
        emoji: '🎁',
        img: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&h=360&fit=crop',
        date: 'Saturday, 15 March 2025',
        occasion: 'Nikah Ceremony',
        status: 'active',
        guests: 4,
        invitedGuests: ["Fatima Ahmed", "Ali Raza", "Hassan Malik", "Amna Bashir"]
      };
    }

    setRegistry(currentReg);

    // 3. Load dynamic guests list
    if (currentReg.invitedGuests && Array.isArray(currentReg.invitedGuests) && currentReg.invitedGuests.length > 0) {
      setGuests(currentReg.invitedGuests);
    } else if (currentReg.guests && typeof currentReg.guests === 'number' && currentReg.guests > 0) {
      setGuests(Array.from({ length: currentReg.guests }, (_, i) => `Guest ${i + 1}`));
    } else {
      setGuests(["Fatima Ahmed"]);
    }

    // 4. Load items specific to registry
    const itemsKey = `reg_items_${regId}`;
    try {
      const rawStored = localStorage.getItem(itemsKey);
      if (rawStored !== null) {
        const parsed = JSON.parse(rawStored);
        // Clean leftover old seed items if user registry was saved as empty
        if (currentReg && currentReg.id && currentReg.id.startsWith('reg-') && currentReg.id !== 'reg-1' && Array.isArray(currentReg.itemsList) && currentReg.itemsList.length === 0 && parsed.length === 4 && parsed[0]?.name === "Wedding Photography" && parsed[2]?.name === "Walima Catering (200 pax)") {
          setItems([]);
          localStorage.setItem(itemsKey, JSON.stringify([]));
        } else {
          setItems(parsed);
        }
      } else if (currentReg.itemsList && Array.isArray(currentReg.itemsList)) {
        setItems(currentReg.itemsList);
        localStorage.setItem(itemsKey, JSON.stringify(currentReg.itemsList));
      } else if (currentReg.id === 'zara-ahmed' || currentReg.id === 'reg-1') {
        // Seed default demo items ONLY for fallback demo registry zara-ahmed
        const seeded: RegistryItem[] = CATALOG_PACKAGES.slice(0, 4).map((p, idx) => ({
          ...p,
          id: `item-${idx + 1}`,
          status: idx === 1 ? 'reserved' : idx === 2 ? 'bought' : 'available',
          by: idx === 1 ? 'Fatima A.' : idx === 2 ? 'Ali R.' : ''
        }));
        setItems(seeded);
        localStorage.setItem(itemsKey, JSON.stringify(seeded));
      } else {
        // User created registries start empty!
        setItems([]);
        localStorage.setItem(itemsKey, JSON.stringify([]));
      }
    } catch (e) {
      setItems([]);
    }
  }, [regId]);

  const saveItemsState = (updated: RegistryItem[], updatedGuests?: string[]) => {
    setItems(updated);
    const guestList = updatedGuests || guests;
    if (regId) {
      try {
        localStorage.setItem(`reg_items_${regId}`, JSON.stringify(updated));
        
        const stored = JSON.parse(localStorage.getItem('local_registries') || '[]');
        if (Array.isArray(stored)) {
          const itemVal = updated.reduce((acc, i) => acc + (i.price * (i.qty || 1)), 0);
          const itemPurchased = updated.filter(i => i.status === 'bought').length;
          
          const updatedRegs = stored.map((r: any) => {
            if (String(r.id) === String(regId)) {
              return {
                ...r,
                items: updated.length,
                purchased: itemPurchased,
                value: itemVal,
                guests: guestList.length
              };
            }
            return r;
          });
          localStorage.setItem('local_registries', JSON.stringify(updatedRegs));
        }
      } catch (e) {}
    }
  };

  const handleAddItemToRegistry = (pkg: Omit<RegistryItem, 'id' | 'status'>) => {
    const newItem: RegistryItem = {
      ...pkg,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      status: 'available',
      by: ''
    };
    const updated = [newItem, ...items];
    saveItemsState(updated);
    setShowAddItemModal(false);
  };

  const handleRemoveItem = () => {
    if (!pendingDelItem) return;
    const updated = items.filter(i => i.id !== pendingDelItem.id);
    saveItemsState(updated);
    setPendingDelItem(null);
  };

  if (!registry) {
    return (
      <DashboardLayout breadcrumbTitle="Gift Registry">
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '36px', color: 'var(--primary)' }}></i>
        </div>
      </DashboardLayout>
    );
  }

  // Fact calculations
  const totalValue = items.reduce((acc, i) => acc + (i.price * (i.qty || 1)), 0);
  const boughtCount = items.filter(i => i.status === 'bought').length;
  const reservedCount = items.filter(i => i.status === 'reserved').length;
  const availableCount = items.filter(i => i.status === 'available').length;
  const totalCount = items.length;
  const boughtPct = totalCount > 0 ? Math.round((boughtCount / totalCount) * 100) : 0;

  const filteredItems = items.filter(i => {
    if (filter === 'all') return true;
    return i.status === filter;
  });

  return (
    <DashboardLayout breadcrumbTitle={registry.name}>
      <div>
        <div className={styles.pageHead}>
          <div className={styles.pageTitle}>My Registries</div>
        </div>
        <div className={styles.qtabs}>
          <Link className={`${styles.qtab} ${styles.qtabActive}`} href="/registry">
            My Registries
          </Link>
          <Link className={styles.qtab} href="/registry?tab=friends">
            Friends Registries
          </Link>
        </div>

        {/* HERO */}
        <div className={styles.regHero}>
          <div className={styles.regHeroCover}>
            <img
              src={registry.img || "https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&h=360&fit=crop"}
              alt={registry.name}
            />
            <span className={styles.regHeroBadge}>🎁 Wedding Registry</span>
            <span className={styles.regHeroStatus}><i className="bx bx-check-circle"></i>Active</span>
            <div className={styles.regHeroTitle}>
              <div className={styles.regHeroName}>{registry.name}</div>
              <div className={styles.regHeroDate}>
                <i className="bx bx-calendar"></i>
                {registry.occasion || 'Event'} · {registry.date || '15 Mar 2025'}
              </div>
            </div>
          </div>
          <div className={styles.regHeroActions}>
            <button className={styles.btnPrimary} onClick={() => setShowInviteModal(true)}>
              <i className="bx bx-user-plus"></i>Invite Guests
            </button>
            <button className={styles.btnGhost} onClick={() => setShowAddItemModal(true)}>
              <i className="bx bx-plus"></i>Add Items
            </button>
            <Link className={styles.btnGhost} href={`/registry/create?edit=${registry.id}`}>
              <i className="bx bx-edit"></i>Edit Registry
            </Link>
            <button className={styles.btnGhost} onClick={() => alert('Link copied to clipboard!')}>
              <i className="bx bx-share-alt"></i>Share
            </button>
          </div>
        </div>

        {/* FACTS */}
        <div className={styles.factGrid}>
          <div className={styles.factTile}>
            <div className={styles.factLbl}><i className="bx bx-calendar"></i>Event Date</div>
            <div className={styles.factVal}>{registry.date ? registry.date.split(', ')[1] || registry.date : '15 Mar 2025'}</div>
            <div className={styles.factSub}>{registry.occasion || 'Occasion'}</div>
          </div>
          <div className={styles.factTile}>
            <div className={styles.factLbl}><i className="bx bx-group"></i>Guests Invited</div>
            <div className={styles.factVal}>{guests.length}</div>
            <div className={styles.factSub}>From your contacts</div>
          </div>
          <div className={styles.factTile}>
            <div className={styles.factLbl}><i className="bx bx-package"></i>Total Items</div>
            <div className={styles.factVal}>{totalCount}</div>
            <div className={styles.factSub}>In this registry</div>
          </div>
          <div className={styles.factTile}>
            <div className={styles.factLbl}><i className="bx bx-wallet"></i>Total Value</div>
            <div className={styles.factVal} style={{ color: 'var(--primary)', fontSize: '17px' }}>
              PKR {fmt(totalValue)}
            </div>
            <div className={styles.factSub}>Across all items</div>
          </div>
        </div>

        {/* PROGRESS */}
        <div className={styles.progCard}>
          <div className={styles.progHead}>
            <div className={styles.progTitle}>Gift Progress</div>
            <div className={styles.progPct}>{boughtPct}% Purchased</div>
          </div>
          <div className={styles.progTrack}>
            <div className={styles.progSegPurchased} style={{ width: `${totalCount > 0 ? (boughtCount / totalCount) * 100 : 0}%` }}></div>
            <div className={styles.progSegReserved} style={{ width: `${totalCount > 0 ? (reservedCount / totalCount) * 100 : 0}%` }}></div>
          </div>
          <div className={styles.progLegend}>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.legendDotPurchased}`}></span>
              <b>{boughtCount}</b> Bought
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.legendDotReserved}`}></span>
              <b>{reservedCount}</b> Reserved
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.legendDotAvailable}`}></span>
              <b>{availableCount}</b> Available
            </div>
          </div>
        </div>

        {/* ITEMS SECTION */}
        <div className={styles.sectionHdr}>
          <div className={styles.sectionTitle}>Registry Items ({totalCount})</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div className={styles.filterStrip}>
              <button
                className={`${styles.fstrip} ${filter === 'all' ? styles.fstripActive : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`${styles.fstrip} ${filter === 'available' ? styles.fstripActive : ''}`}
                onClick={() => setFilter('available')}
              >
                Available
              </button>
              <button
                className={`${styles.fstrip} ${filter === 'reserved' ? styles.fstripActive : ''}`}
                onClick={() => setFilter('reserved')}
              >
                Reserved
              </button>
              <button
                className={`${styles.fstrip} ${filter === 'bought' ? styles.fstripActive : ''}`}
                onClick={() => setFilter('bought')}
              >
                Bought
              </button>
            </div>
            <button className={styles.btnPrimary} onClick={() => setShowAddItemModal(true)} style={{ padding: '9px 16px' }}>
              <i className="bx bx-plus"></i>Add Items
            </button>
          </div>
        </div>

        {/* ITEMS GRID */}
        <div className={styles.itemsGrid}>
          {filteredItems.length === 0 ? (
            <div className={styles.emptyItems}>
              <i className="bx bx-package"></i>
              <h3>No items added to this registry yet</h3>
              <p>Click "+ Add Items" below to browse service packages and add gifts to your registry.</p>
              <button className={styles.btnPrimary} onClick={() => setShowAddItemModal(true)} style={{ marginTop: '16px' }}>
                <i className="bx bx-plus"></i>Browse &amp; Add Items
              </button>
            </div>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className={styles.itemCard}>
                <div className={styles.itemImg}>
                  <img src={item.img || "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=240&fit=crop"} alt={item.name} />
                  {item.status === 'available' && <span className={`${styles.itemBadge} ${styles.itemBadgeAvailable}`}>Available</span>}
                  {item.status === 'reserved' && <span className={`${styles.itemBadge} ${styles.itemBadgeReserved}`}>Reserved by {item.by}</span>}
                  {item.status === 'bought' && <span className={`${styles.itemBadge} ${styles.itemBadgeBought}`}>Bought by {item.by}</span>}
                </div>
                <div className={styles.itemBody}>
                  <div className={styles.itemName}>{item.name}</div>
                  <div className={styles.itemVendor}>{item.vendor}</div>
                  <div className={styles.itemPriceRow}>
                    <div className={styles.itemPrice}>PKR {fmt(item.price)}</div>
                    {item.was && item.was > item.price && <div className={styles.itemWas}>PKR {fmt(item.was)}</div>}
                  </div>
                  <div className={styles.itemActions}>
                    <Link className={styles.itemBtn} href={item.category && item.slug ? `/services/${item.category}/${item.slug}` : "/services/catering/royal-biryani-catering"}>
                      <i className="bx bx-show"></i>View Package
                    </Link>
                    <button className={`${styles.itemBtn} ${styles.itemBtnDel}`} onClick={() => setPendingDelItem(item)}>
                      <i className="bx bx-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* GUESTS SECTION */}
        <div className={styles.guestsCard}>
          <div className={styles.guestsHead}>
            <div className={styles.guestsTitle}>
              <i className="bx bx-group"></i>Invited Guests ({guests.length})
            </div>
            <button className={styles.btnGhost} onClick={() => setShowInviteModal(true)} style={{ padding: '7px 14px', fontSize: '12px' }}>
              <i className="bx bx-user-plus"></i>Manage Guests
            </button>
          </div>
          <div className={styles.privacyNote}>
            <i className="bx bxs-lock-alt"></i>
            <div>
              <b>Private registry.</b> Only the guests you invite from your contacts can view this registry, reserve, or buy gifts.
            </div>
          </div>
          <div className={styles.guestsRow}>
            {guests.map(g => (
              <div key={g} className={styles.guestAv} title={g}>
                {initials(g)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD ITEMS TO REGISTRY */}
      {showAddItemModal && (
        <div className={styles.modalOv} onClick={() => setShowAddItemModal(false)}>
          <div className={styles.modal} style={{ width: '640px', maxWidth: '95vw', textAlign: 'left', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Add Items to Registry</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Select service packages your guests can gift to you.</p>
              </div>
              <button onClick={() => setShowAddItemModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>
                <i className="bx bx-x"></i>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
              {CATALOG_PACKAGES.map((pkg, idx) => (
                <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <img src={pkg.img} alt={pkg.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pkg.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{pkg.vendor}</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>PKR {fmt(pkg.price)}</div>
                  </div>
                  <button
                    onClick={() => handleAddItemToRegistry(pkg)}
                    style={{
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      border: '1px solid var(--primary)',
                      borderRadius: '999px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DELETE CONFIRMATION */}
      {pendingDelItem && (
        <div className={styles.modalOv} onClick={() => setPendingDelItem(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIc}><i className="bx bx-trash"></i></div>
            <div className={styles.modalT}>Remove item?</div>
            <div className={styles.modalS}>
              <b>{pendingDelItem.name}</b> will be removed from this registry.
            </div>
            <div className={styles.modalBtns}>
              <button className={styles.mbtn} onClick={() => setPendingDelItem(null)}>Cancel</button>
              <button className={`${styles.mbtn} ${styles.mbtnPrimary}`} onClick={handleRemoveItem}>
                <i className="bx bx-trash"></i> Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: INVITE GUESTS */}
      {showInviteModal && (
        <div className={styles.modalOv} onClick={() => setShowInviteModal(false)}>
          <div className={styles.modal} style={{ textAlign: 'left' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Invite Guests</h3>
              <button onClick={() => setShowInviteModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>
                <i className="bx bx-x"></i>
              </button>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Add guest names separated by commas:
            </p>
            <input
              type="text"
              placeholder="e.g. Usman Tariq, Hina Qureshi"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value;
                  if (val.trim()) {
                    const parsedNew = val.split(',').map(s => s.trim()).filter(Boolean);
                    const updatedG = [...guests, ...parsedNew];
                    setGuests(updatedG);
                    saveItemsState(items, updatedG);
                    setShowInviteModal(false);
                  }
                }
              }}
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                padding: '0 14px',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: '13.5px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button className={styles.mbtn} onClick={() => setShowInviteModal(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: VIEW PACKAGE DETAILS */}
      {viewingPackage && (
        <div className={styles.modalOv} onClick={() => setViewingPackage(null)}>
          <div className={styles.modal} style={{ width: '500px', maxWidth: '95vw', textAlign: 'left', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{viewingPackage.name}</h3>
              <button onClick={() => setViewingPackage(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>
                <i className="bx bx-x"></i>
              </button>
            </div>

            <div style={{ borderRadius: '12px', overflow: 'hidden', height: '180px', marginBottom: '16px' }}>
              <img src={viewingPackage.img || "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=300&fit=crop"} alt={viewingPackage.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Provided by <b style={{ color: 'var(--text-primary)' }}>{viewingPackage.vendor}</b>
            </div>

            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)', marginBottom: '16px' }}>
              PKR {fmt(viewingPackage.price)}
              {viewingPackage.was && viewingPackage.was > viewingPackage.price && (
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: '10px', fontWeight: 500 }}>
                  PKR {fmt(viewingPackage.was)}
                </span>
              )}
            </div>

            <div style={{ background: 'var(--surface)', padding: '14px', borderRadius: '10px', fontSize: '12.5px', lineHeight: 1.6, marginBottom: '20px' }}>
              <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>Package Highlights:</div>
              <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)' }}>
                <li>Complete setup and professional coordination</li>
                <li>Premium quality equipment and decorations</li>
                <li>Dedicated vendor manager on event day</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className={styles.btnGhost} onClick={() => { setViewingPackage(null); router.push('/services'); }} style={{ flex: 1, justifyContent: 'center' }}>
                Explore Services
              </button>
              <button className={styles.btnPrimary} onClick={() => setViewingPackage(null)} style={{ flex: 1, justifyContent: 'center' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
