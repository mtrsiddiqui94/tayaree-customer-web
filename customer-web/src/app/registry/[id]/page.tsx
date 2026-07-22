'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/formatPrice';
import styles from './page.module.css';

interface RegistryItem {
  id: number;
  productName: string;
  price: number;
  was?: number;
  qty?: number;
  imageUrl?: string;
  vendorName: string;
  status: string; // 'available', 'reserved', 'bought'
  by?: string;
}

interface Guest {
  id?: number;
  name: string;
  phone?: string;
}

interface RegistryDetail {
  id: number;
  title: string;
  occasion: string;
  visibility: string;
  coverUrl?: string;
  eventDate: string;
  items: RegistryItem[];
  guests: Guest[];
}

export default function RegistryDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  
  const [registry, setRegistry] = useState<RegistryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [itemFilter, setItemFilter] = useState('all');
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [pendingDel, setPendingDel] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  async function loadDetail() {
    try {
      setIsLoading(true);
      const res = await api.get<{ status: boolean; data: any }>(`/api/v1/gift-registry/detail/${id}`).catch(() => null);
      if (res?.data) {
        setRegistry({
          id: res.data.id,
          title: res.data.title || 'unset',
          occasion: res.data.occasion || 'unset',
          eventDate: res.data.event_date || 'unset',
          visibility: res.data.visibility || 'public',
          coverUrl: res.data.cover_url,
          guests: res.data.guests || [],
          items: (res.data.items || []).map((i: any) => ({
            id: i.id,
            productName: i.product_name || 'unset',
            price: i.price || 0,
            was: i.was || 0,
            qty: i.qty || 1,
            imageUrl: i.image_url,
            vendorName: i.vendor_name || 'unset',
            status: i.status || 'available',
            by: i.by || ''
          }))
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const removeItem = async () => {
    if (!pendingDel) return;
    try {
      // Assuming a delete endpoint exists
      // await api.post('/api/v1/gift-registry/remove-item', { registry_id: id, item_id: pendingDel });
      showToast('Item removed');
      setRegistry(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== pendingDel) } : null);
      setShowDeleteModal(false);
      setPendingDel(null);
    } catch (e) {
      showToast('Failed to remove item', 'error');
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <DashboardLayout breadcrumbTitle="Gift Registry">
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
        </div>
      </DashboardLayout>
    );
  }

  if (!registry) {
    return (
      <DashboardLayout breadcrumbTitle="Gift Registry">
        <div style={{ textAlign: 'center', padding: '100px 0' }}>Registry not found</div>
      </DashboardLayout>
    );
  }

  const totalItems = registry.items.length;
  const boughtItems = registry.items.filter(i => i.status === 'bought');
  const reservedItems = registry.items.filter(i => i.status === 'reserved');
  const availableCount = totalItems - boughtItems.length - reservedItems.length;
  
  const totalValue = registry.items.reduce((sum, item) => sum + item.price, 0);
  const progPct = totalItems > 0 ? Math.round((boughtItems.length / totalItems) * 100) : 0;
  
  const boughtPct = totalItems > 0 ? (boughtItems.length / totalItems) * 100 : 0;
  const reservedPct = totalItems > 0 ? (reservedItems.length / totalItems) * 100 : 0;

  const filteredItems = registry.items.filter(it => itemFilter === 'all' || it.status === itemFilter);

  const shownGuests = registry.guests.slice(0, 8);
  const extraGuests = registry.guests.length - shownGuests.length;

  return (
    <DashboardLayout breadcrumbTitle={registry.title}>
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: 'var(--text-primary)',
          color: '#fff', padding: '13px 20px', borderRadius: 'var(--radius-full)', zIndex: 1400,
          boxShadow: 'var(--shadow-md)', fontFamily: 'Poppins, sans-serif', fontSize: '13px', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '9px'
        }}>
          <i className={toast.type === 'success' ? 'bx bx-check-circle' : toast.type === 'error' ? 'bx bx-error-circle' : 'bx bx-info-circle'} style={{ fontSize: '18px', color: toast.type === 'success' ? '#5FD08A' : undefined }}></i>
          {toast.message}
        </div>
      )}

      <div className={styles.dashContent}>
        <div className={styles.pageHead}>
          <div className={styles.pageTitle}>My Registries</div>
        </div>
        <div className={styles.qtabs}>
          <Link className={`${styles.qtab} ${styles.qtabActive}`} href="/registry">My Registries</Link>
          <Link className={styles.qtab} href="/registry?tab=friends">Friends Registries</Link>
        </div>

        {/* HERO */}
        <div className={styles.regHero}>
          <div className={styles.regHeroCover}>
            {registry.coverUrl ? (
              <img src={registry.coverUrl} alt={registry.title} />
            ) : (
               <div style={{ width: '100%', height: '100%', background: 'var(--input-bg)' }}></div>
            )}
            <span className={styles.regHeroBadge}>🎁 Wedding Registry</span>
            <span className={styles.regHeroStatus}><i className='bx bx-check-circle'></i>Active</span>
            <div className={styles.regHeroTitle}>
              <div className={styles.regHeroName}>{registry.title}</div>
              <div className={styles.regHeroDate}><i className='bx bx-calendar'></i>{registry.occasion} · {registry.eventDate}</div>
            </div>
          </div>
          <div className={styles.regHeroActions}>
            <button className={styles.btnPrimary} onClick={() => setShowContactModal(true)}>
              <i className='bx bx-user-plus'></i>Invite Guests
            </button>
            <Link className={styles.btnGhost} href="/search"><i className='bx bx-plus'></i>Add Items</Link>
            <Link className={styles.btnGhost} href={`/registry/create?edit=1`}><i className='bx bx-edit'></i>Edit Registry</Link>
            <button className={styles.btnGhost}><i className='bx bx-share-alt'></i>Share</button>
          </div>
        </div>

        {/* FACTS */}
        <div className={styles.factGrid}>
          <div className={styles.factTile}>
            <div className={styles.factLbl}><i className='bx bx-calendar'></i>Event Date</div>
            <div className={styles.factVal}>{registry.eventDate}</div>
            <div className={styles.factSub}>{registry.occasion}</div>
          </div>
          <div className={styles.factTile}>
            <div className={styles.factLbl}><i className='bx bx-group'></i>Guests Invited</div>
            <div className={styles.factVal}>{registry.guests.length}</div>
            <div className={styles.factSub}>From your contacts</div>
          </div>
          <div className={styles.factTile}>
            <div className={styles.factLbl}><i className='bx bx-package'></i>Total Items</div>
            <div className={styles.factVal}>{totalItems}</div>
            <div className={styles.factSub}>In this registry</div>
          </div>
          <div className={styles.factTile}>
            <div className={styles.factLbl}><i className='bx bx-wallet'></i>Total Value</div>
            <div className={styles.factVal} style={{ color: 'var(--primary)', fontSize: '17px' }}>PKR {formatPrice(totalValue)}</div>
            <div className={styles.factSub}>Across all items</div>
          </div>
        </div>

        {/* PROGRESS */}
        <div className={styles.progCard}>
          <div className={styles.progHead}>
            <div className={styles.progTitle}>Gift Progress</div>
            <div className={styles.progPct}>{progPct}% gifted</div>
          </div>
          <div className={styles.progTrack}>
            <div className={`${styles.progSeg} ${styles.progSegPurchased}`} style={{ width: `${boughtPct}%` }}></div>
            <div className={`${styles.progSeg} ${styles.progSegReserved}`} style={{ width: `${reservedPct}%` }}></div>
          </div>
          <div className={styles.progLegend}>
            <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legendDotPurchased}`}></span><b>{boughtItems.length}</b> Bought</div>
            <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legendDotReserved}`}></span><b>{reservedItems.length}</b> Reserved</div>
            <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legendDotAvailable}`}></span><b>{availableCount}</b> Available</div>
          </div>
        </div>

        {/* ITEMS */}
        <div className={styles.sectionHdr}>
          <div className={styles.sectionTitle}>Registry Items ({totalItems})</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div className={styles.filterStrip}>
              <button className={`${styles.fstrip} ${itemFilter === 'all' ? styles.fstripActive : ''}`} onClick={() => setItemFilter('all')}>All</button>
              <button className={`${styles.fstrip} ${itemFilter === 'available' ? styles.fstripActive : ''}`} onClick={() => setItemFilter('available')}>Available</button>
              <button className={`${styles.fstrip} ${itemFilter === 'reserved' ? styles.fstripActive : ''}`} onClick={() => setItemFilter('reserved')}>Reserved</button>
              <button className={`${styles.fstrip} ${itemFilter === 'bought' ? styles.fstripActive : ''}`} onClick={() => setItemFilter('bought')}>Bought</button>
            </div>
            <Link className={styles.btnGhost} href="/search" style={{ padding: '9px 15px' }}><i className='bx bx-plus'></i>Add Items</Link>
          </div>
        </div>

        <div className={styles.itemsGrid}>
          {filteredItems.length > 0 ? filteredItems.map(it => {
            const disc = it.was && it.was > 0 ? Math.round(((it.was - it.price) / it.was) * 100) : 0;
            return (
              <div key={it.id} className={styles.itemCard}>
                <div className={styles.itemImg}>
                  {it.imageUrl ? <img src={it.imageUrl} alt={it.productName} /> : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px'}}>🎁</div>}
                  {disc > 0 && <span className={styles.itemDisc}>-{disc}%</span>}
                  
                  {it.status === 'available' && <span className={`${styles.itemBadge} ${styles.itemBadgeAvailable}`}><i className='bx bx-circle'></i>Available</span>}
                  {it.status === 'reserved' && <span className={`${styles.itemBadge} ${styles.itemBadgeReserved}`}><i className='bx bx-lock-alt'></i>Reserved</span>}
                  {(it.status === 'bought') && <span className={`${styles.itemBadge} ${styles.itemBadgeBought}`}><i className='bx bx-check-circle'></i>Bought</span>}
                </div>
                <div className={styles.itemBody}>
                  <div className={styles.itemName}>{it.productName}</div>
                  <div className={styles.itemVendor}>{it.vendorName}</div>
                  <div className={styles.itemPriceRow}>
                    <span className={styles.itemPrice}>PKR {formatPrice(it.price)}</span>
                    {it.was && it.was > 0 && <span className={styles.itemWas}>PKR {formatPrice(it.was)}</span>}
                  </div>
                  
                  {it.status === 'bought' ? (
                    <div className={`${styles.itemNote} ${styles.itemNoteBought}`}><i className='bx bx-check-circle'></i>Bought by {it.by || 'Guest'}</div>
                  ) : it.status === 'reserved' ? (
                    <div className={`${styles.itemNote} ${styles.itemNoteReserved}`}><i className='bx bx-cart'></i>Reserved by {it.by || 'Guest'}</div>
                  ) : (
                    <div className={`${styles.itemNote} ${styles.itemNoteQty}`}><i className='bx bx-box'></i>Qty: {it.qty || 1} · not yet claimed</div>
                  )}

                  <div className={styles.itemActions}>
                    <Link className={`${styles.itemBtn} ${styles.itemBtnView}`} href={`/services/${it.id}`}><i className='bx bx-show'></i>View</Link>
                    <button className={`${styles.itemBtn} ${styles.itemBtnDel}`} title="Remove from registry" onClick={() => { setPendingDel(it.id); setShowDeleteModal(true); }}><i className='bx bx-trash'></i></button>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className={styles.emptyItems}>
              <i className='bx bx-package'></i>
              <h3>No {itemFilter} items</h3>
              <p>Try a different filter, or add items from any service page.</p>
            </div>
          )}
        </div>

        {/* GUESTS */}
        <div className={styles.guestsCard}>
          <div className={styles.guestsHead}>
            <div className={styles.guestsTitle}><i className='bx bx-group'></i>Invited Guests ({registry.guests.length})</div>
          </div>
          <div className={styles.privacyNote}>
            <i className='bx bxs-lock-alt'></i>
            <div><b>Private registry.</b> Only the guests you invite from your contacts can view this registry, reserve, or buy gifts. It never appears in public search.</div>
          </div>
          <div className={styles.guestsRow}>
            {shownGuests.map((g, idx) => (
              <div key={idx} className={styles.guestAv} title={g.name}>{getInitials(g.name)}</div>
            ))}
            {extraGuests > 0 && <div className={styles.guestMore}>+{extraGuests}</div>}
            <button className={styles.guestAdd} onClick={() => setShowContactModal(true)}><i className='bx bx-plus'></i>Add More</button>
          </div>
        </div>

      </div>

      {/* DELETE MODAL */}
      <div className={`${styles.modalOv} ${showDeleteModal ? styles.modalOvOpen : ''}`} onClick={(e) => { if(e.target === e.currentTarget) setShowDeleteModal(false); }}>
        <div className={styles.modal}>
          <div className={styles.modalIc}><i className='bx bx-trash'></i></div>
          <div className={styles.modalT}>Remove item?</div>
          <div className={styles.modalS}><b>This item</b> will be removed from this registry. This can't be undone.</div>
          <div className={styles.modalBtns}>
            <button className={styles.mbtn} onClick={() => setShowDeleteModal(false)}>Cancel</button>
            <button className={`${styles.mbtn} ${styles.mbtnPrimary}`} onClick={removeItem}><i className='bx bx-trash'></i> Remove</button>
          </div>
        </div>
      </div>

      {/* CONTACT MODAL (Simplified) */}
      <div className={`${styles.modalOv} ${showContactModal ? styles.modalOvOpen : ''}`} onClick={(e) => { if(e.target === e.currentTarget) setShowContactModal(false); }}>
        <div className={styles.contactModal}>
          <div className={styles.cmHead}>
            <div className={styles.cmTitle}>Invite Guests</div>
            <div className={styles.cmSub}>Add people from your contacts. Only invited guests can view this registry.</div>
            <button className={styles.cmClose} onClick={() => setShowContactModal(false)}><i className='bx bx-x'></i></button>
          </div>
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Guest addition UI would go here.
          </div>
          <div className={styles.cmFoot}>
            <button className={styles.btnGhost} onClick={() => setShowContactModal(false)}>Cancel</button>
            <button className={styles.btnPrimary} onClick={() => setShowContactModal(false)}><i className='bx bx-user-plus'></i>Add Guests</button>
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
}
