'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import styles from './page.module.css';

interface RegistryItem {
  id: string;
  name: string;
  emoji?: string;
  img?: string;
  date: string;
  occasion: string;
  status: 'active' | 'closed';
  bucket: 'current' | 'past';
  guests: number;
  items: number;
  purchased: number;
  value: number;
  host?: string;
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Number(n).toLocaleString('en-IN');
}

const DEFAULT_MY_REGISTRIES: RegistryItem[] = [
  {
    id: "zara-ahmed",
    name: "Zara & Ahmed's Wedding Registry",
    emoji: "🎁",
    img: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=200&fit=crop",
    date: "15 Mar 2025",
    occasion: "Nikah Ceremony",
    status: "active",
    bucket: "current",
    guests: 48,
    items: 32,
    purchased: 18,
    value: 423000
  },
  {
    id: "fatima-bridal",
    name: "Fatima's Bridal Shower Wishlist",
    emoji: "💍",
    img: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=600&h=200&fit=crop",
    date: "28 Apr 2025",
    occasion: "Bridal Shower",
    status: "active",
    bucket: "current",
    guests: 22,
    items: 15,
    purchased: 5,
    value: 186000
  },
  {
    id: "hassan-sana",
    name: "Hassan & Sana's Mehndi Night",
    emoji: "🌸",
    img: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=600&h=200&fit=crop",
    date: "12 Nov 2024",
    occasion: "Mehndi",
    status: "closed",
    bucket: "past",
    guests: 60,
    items: 25,
    purchased: 25,
    value: 512000
  }
];

const DEFAULT_FRIEND_REGISTRIES: RegistryItem[] = [
  {
    id: "zara-ahmed-friend",
    name: "Zara & Ahmed's Wedding Registry",
    emoji: "🎁",
    img: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=200&fit=crop",
    date: "15 Mar 2025",
    occasion: "Nikah Ceremony",
    status: "active",
    bucket: "current",
    host: "Ahmed Khan",
    guests: 48,
    items: 8,
    purchased: 3,
    value: 693000
  }
];

export default function RegistryPage() {
  const [activeTab, setActiveTab] = useState<'mine' | 'shared'>('mine');
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [myRegistries, setMyRegistries] = useState<RegistryItem[]>(DEFAULT_MY_REGISTRIES);
  const [friendRegistries, setFriendRegistries] = useState<RegistryItem[]>(DEFAULT_FRIEND_REGISTRIES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const stored = JSON.parse(localStorage.getItem('local_registries') || '[]');
        const merged = Array.isArray(stored) && stored.length > 0 ? [...stored, ...DEFAULT_MY_REGISTRIES] : DEFAULT_MY_REGISTRIES;
        
        const syncedMerged = merged.map((r: any) => {
          try {
            const itemsKey = `reg_items_${r.id}`;
            const rawStored = localStorage.getItem(itemsKey);
            if (rawStored !== null) {
              const savedItems = JSON.parse(rawStored);
              if (Array.isArray(savedItems)) {
                const items = savedItems.length;
                const purchased = savedItems.filter((i: any) => i.status === 'bought').length;
                const value = savedItems.reduce((acc: number, i: any) => acc + ((i.price || 0) * (i.qty || 1)), 0);
                return { ...r, items, purchased, value };
              }
            }
          } catch (e) {}
          return r;
        });

        setMyRegistries(syncedMerged);
      } catch (e) {}

      const resMine = await api.safeCall(() => api.get<any>('/api/v1/gift-registry/list/my'));
      if (resMine.success && resMine.data) {
        const list = Array.isArray(resMine.data) ? resMine.data : (resMine.data.data || []);
        if (list.length > 0) {
          const mapped: RegistryItem[] = list.map((item: any) => ({
            id: String(item.id || item._id),
            name: item.title || item.name || "My Registry",
            emoji: "🎁",
            img: item.cover_url || item.image || DEFAULT_MY_REGISTRIES[0].img,
            date: item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '15 Mar 2025',
            occasion: item.occasion || 'Wedding',
            status: item.status === 'closed' ? 'closed' : 'active',
            bucket: item.status === 'closed' ? 'past' : 'current',
            guests: item.guests_count || 30,
            items: item.items_count || 10,
            purchased: item.purchased_count || 0,
            value: item.total_value || 150000
          }));
          setMyRegistries(mapped);
        }
      }

      setIsLoading(false);
    }

    loadData();
  }, []);

  // Filter My Registries
  const filteredMine = myRegistries.filter(r => {
    const matchFilter = filter === 'all' || r.status === filter;
    const matchSearch = (r.name + ' ' + r.occasion).toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const currentList = filteredMine.filter(r => r.bucket === 'current');
  const pastList = filteredMine.filter(r => r.bucket === 'past');

  return (
    <DashboardLayout breadcrumbTitle="Gift Registry">
      <div>
        {/* PAGE HEAD */}
        <div className={styles.pageHead}>
          <div>
            <h1 className={styles.pageTitle}>Your Registries</h1>
            <p className={styles.pageSub}>
              Build wishlists of services for your events and share them with guests to reserve or gift.
            </p>
          </div>
          <Link className={styles.btnPrimary} href="/registry/create">
            <i className="bx bx-plus"></i>Add Gift Registry
          </Link>
        </div>

        {/* SEGMENTED TABS */}
        <div className={styles.qtabs}>
          <button
            className={`${styles.qtab} ${activeTab === 'mine' ? styles.qtabActive : ''}`}
            onClick={() => setActiveTab('mine')}
          >
            My Registries
          </button>
          <button
            className={`${styles.qtab} ${activeTab === 'shared' ? styles.qtabActive : ''}`}
            onClick={() => setActiveTab('shared')}
          >
            Friends Registries
          </button>
        </div>

        {/* FILTER & SEARCH BAR */}
        <div className={styles.filterbar}>
          <div className={styles.filterSearch}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Search your registries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className={`${styles.fchip} ${filter === 'all' ? styles.fchipActive : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`${styles.fchip} ${filter === 'active' ? styles.fchipActive : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={`${styles.fchip} ${filter === 'closed' ? styles.fchipActive : ''}`}
            onClick={() => setFilter('closed')}
          >
            Closed
          </button>
        </div>

        {/* TAB 1: MY REGISTRIES */}
        {activeTab === 'mine' && (
          <div>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
                <p>Loading your registries...</p>
              </div>
            ) : filteredMine.length === 0 ? (
              <div className={styles.emptyState}>
                <i className="bx bx-gift"></i>
                <h3>No registries found</h3>
                <p>Create a gift registry to let guests reserve or purchase services for your event.</p>
                <Link className={styles.btnPrimary} href="/registry/create" style={{ margin: '0 auto' }}>
                  <i className="bx bx-plus"></i>Add Gift Registry
                </Link>
              </div>
            ) : (
              <div>
                {currentList.length > 0 && (
                  <div>
                    <div className={styles.bucketLabel}>Current</div>
                    <div className={styles.regGrid}>
                      {currentList.map(r => {
                        const pct = Math.round((r.purchased / (r.items || 1)) * 100);
                        const isDone = r.purchased >= r.items;

                        return (
                          <Link key={r.id} href={`/registry/${r.id}`} className={styles.regCard}>
                            <div className={styles.regCover}>
                              {r.img ? (
                                <img src={r.img} alt={r.name} />
                              ) : (
                                <div className={styles.regCoverEmoji}>{r.emoji || '🎁'}</div>
                              )}
                              <span
                                className={`${styles.regStatusBadge} ${
                                  r.status === 'active'
                                    ? styles.regStatusBadgeActive
                                    : styles.regStatusBadgeClosed
                                }`}
                              >
                                <i className={`bx ${r.status === 'active' ? 'bx-check-circle' : 'bx-lock-alt'}`}></i>
                                {r.status === 'active' ? 'Active' : 'Closed'}
                              </span>
                            </div>

                            <div className={styles.regBody}>
                              <div className={styles.regTitle}>{r.name}</div>
                              <div className={styles.regMeta}>
                                <i className="bx bx-calendar"></i>{r.date} · {r.occasion}
                              </div>

                              <div className={styles.regChips}>
                                <span className={styles.chip}>
                                  <i className="bx bx-group"></i>{r.guests} guests
                                </span>
                                <span className={styles.chip}>
                                  <i className="bx bx-package"></i>{r.items} items
                                </span>
                              </div>

                              <div className={styles.progWrap}>
                                <div className={styles.progTop}>
                                  <span><b>{r.purchased}</b> of {r.items} purchased</span>
                                  <span>{pct}%</span>
                                </div>
                                <div className={styles.progBar}>
                                  <div
                                    className={`${styles.progBarFill} ${isDone ? styles.progBarFillDone : ''}`}
                                    style={{ width: `${pct}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div className={styles.regFoot}>
                                <span className={styles.regValue}>
                                  Total value<b>PKR {fmt(r.value)}</b>
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {pastList.length > 0 && (
                  <div>
                    <div className={styles.bucketLabel} style={{ marginTop: '26px' }}>Past</div>
                    <div className={styles.regGrid}>
                      {pastList.map(r => {
                        const pct = Math.round((r.purchased / (r.items || 1)) * 100);
                        const isDone = r.purchased >= r.items;

                        return (
                          <Link key={r.id} href={`/registry/${r.id}`} className={styles.regCard}>
                            <div className={styles.regCover}>
                              {r.img ? (
                                <img src={r.img} alt={r.name} />
                              ) : (
                                <div className={styles.regCoverEmoji}>{r.emoji || '🎁'}</div>
                              )}
                              <span
                                className={`${styles.regStatusBadge} ${
                                  r.status === 'active'
                                    ? styles.regStatusBadgeActive
                                    : styles.regStatusBadgeClosed
                                }`}
                              >
                                <i className={`bx ${r.status === 'active' ? 'bx-check-circle' : 'bx-lock-alt'}`}></i>
                                {r.status === 'active' ? 'Active' : 'Closed'}
                              </span>
                            </div>

                            <div className={styles.regBody}>
                              <div className={styles.regTitle}>{r.name}</div>
                              <div className={styles.regMeta}>
                                <i className="bx bx-calendar"></i>{r.date} · {r.occasion}
                              </div>

                              <div className={styles.regChips}>
                                <span className={styles.chip}>
                                  <i className="bx bx-group"></i>{r.guests} guests
                                </span>
                                <span className={styles.chip}>
                                  <i className="bx bx-package"></i>{r.items} items
                                </span>
                              </div>

                              <div className={styles.progWrap}>
                                <div className={styles.progTop}>
                                  <span><b>{r.purchased}</b> of {r.items} purchased</span>
                                  <span>{pct}%</span>
                                </div>
                                <div className={styles.progBar}>
                                  <div
                                    className={`${styles.progBarFill} ${isDone ? styles.progBarFillDone : ''}`}
                                    style={{ width: `${pct}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div className={styles.regFoot}>
                                <span className={styles.regValue}>
                                  Total value<b>PKR {fmt(r.value)}</b>
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FRIENDS REGISTRIES */}
        {activeTab === 'shared' && (
          <div>
            <div className={styles.bucketLabel}>Invited to</div>
            <div className={styles.regGrid}>
              {friendRegistries.map(r => {
                const pct = Math.round((r.purchased / (r.items || 1)) * 100);

                return (
                  <Link key={r.id} href={`/registry/friend/${r.id}`} className={styles.regCard}>
                    <div className={styles.regCover}>
                      {r.img ? (
                        <img src={r.img} alt={r.name} />
                      ) : (
                        <div className={styles.regCoverEmoji}>{r.emoji || '🎁'}</div>
                      )}
                      <span className={`${styles.regStatusBadge} ${styles.regStatusBadgeActive}`}>
                        <i className="bx bx-user"></i>Guest
                      </span>
                    </div>

                    <div className={styles.regBody}>
                      <div className={styles.regTitle}>{r.name}</div>
                      <div className={styles.regMeta}>
                        <i className="bx bx-calendar"></i>{r.date} · {r.occasion}
                      </div>

                      <div className={styles.regChips}>
                        <span className={styles.chip}>
                          <i className="bx bx-user-circle"></i>Hosted by {r.host || 'Friend'}
                        </span>
                        <span className={styles.chip}>
                          <i className="bx bx-package"></i>{r.items} gifts
                        </span>
                      </div>

                      <div className={styles.progWrap}>
                        <div className={styles.progTop}>
                          <span><b>{r.purchased}</b> of {r.items} gifted</span>
                          <span>{pct}%</span>
                        </div>
                        <div className={styles.progBar}>
                          <div className={styles.progBarFill} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>

                      <div className={styles.regFoot}>
                        <span className={styles.regValue}>
                          You're a guest<b>Reserve or buy a gift</b>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
