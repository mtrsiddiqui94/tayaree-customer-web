'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/formatPrice';
import styles from './page.module.css';

interface Registry {
  id: number;
  title: string;
  creatorName: string;
  coverUrl?: string;
  giftsCount: number;
  purchasedCount: number;
  totalValue: number;
  createdDate: string;
  status: string;
  bucket: string;
  occasion: string;
}

export default function RegistryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'my' | 'friends'>('my');
  const [myRegistries, setMyRegistries] = useState<Registry[]>([]);
  const [friendRegistries, setFriendRegistries] = useState<Registry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login?redirect=/registry');
        return;
      }
      loadRegistries();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  async function loadRegistries() {
    try {
      setIsLoading(true);
      const myRes = await api.get<{ status: boolean; data?: any }>('/api/v1/gift-registry/list/my').catch(() => null);
      const friendRes = await api.get<{ status: boolean; data?: any }>('/api/v1/gift-registry/list/friends').catch(() => null);

      const myData = myRes?.data || {};
      const friendData = friendRes?.data || {};

      const mapRegistry = (r: any, b: string): Registry => ({
        id: r.id,
        title: r.title || 'unset',
        creatorName: r.creator_name || 'My Registry',
        giftsCount: r.gifts_count || 0,
        purchasedCount: r.purchased_count || 0,
        totalValue: r.total_value || 0,
        createdDate: r.created_date || 'unset',
        status: r.status || 'active',
        bucket: b,
        occasion: r.occasion || 'Event',
        coverUrl: r.cover_url
      });

      const parsedMy = [
        ...(myData.current_registry || []).map((r: any) => mapRegistry(r, 'current')),
        ...(myData.past_registry || []).map((r: any) => mapRegistry(r, 'past'))
      ];

      const parsedFriend = [
        ...(friendData.current_registry || []).map((r: any) => ({ ...mapRegistry(r, 'current'), creatorName: r.creator_name || 'Friend Registry' })),
        ...(friendData.past_registry || []).map((r: any) => ({ ...mapRegistry(r, 'past'), creatorName: r.creator_name || 'Friend Registry' }))
      ];

      setMyRegistries(parsedMy);
      setFriendRegistries(parsedFriend);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const activeRegistries = activeTab === 'my' ? myRegistries : friendRegistries;
  
  const filteredRegistries = activeRegistries.filter(r => {
    if (filter !== 'all') {
      if (filter === 'active' && r.status !== 'active') return false;
      if (filter === 'closed' && r.status !== 'closed') return false;
    }
    if (searchQ) {
      return (r.title + ' ' + r.occasion).toLowerCase().includes(searchQ.toLowerCase());
    }
    return true;
  });

  const currentBucket = filteredRegistries.filter(r => r.bucket === 'current' || !r.bucket);
  const pastBucket = filteredRegistries.filter(r => r.bucket === 'past');

  const renderCard = (reg: Registry) => {
    const pct = reg.giftsCount > 0 ? Math.round((reg.purchasedCount / reg.giftsCount) * 100) : 0;
    const isDone = reg.purchasedCount >= reg.giftsCount && reg.giftsCount > 0;
    const isFriend = activeTab === 'friends';
    const linkHref = isFriend ? `/registry/friend/${reg.id}` : `/registry/${reg.id}`;

    return (
      <Link key={reg.id} href={linkHref} className={styles.regCard}>
        <div className={styles.regCover}>
          {reg.coverUrl ? <img src={reg.coverUrl} alt={reg.title} /> : <div className={styles.regCoverEmoji}>🎁</div>}
          {isFriend ? (
             <span className={`${styles.regStatusBadge} ${styles.active}`}><i className="bx bx-user"></i>Guest</span>
          ) : (
            reg.status === 'active' 
              ? <span className={`${styles.regStatusBadge} ${styles.active}`}><i className="bx bx-check-circle"></i>Active</span>
              : <span className={`${styles.regStatusBadge} ${styles.closed}`}><i className="bx bx-lock-alt"></i>Closed</span>
          )}
        </div>
        <div className={styles.regBody}>
          <div className={styles.regTitle}>{reg.title}</div>
          <div className={styles.regMeta}><i className="bx bx-calendar"></i>{reg.createdDate} · {reg.occasion}</div>
          
          <div className={styles.regChips}>
            {isFriend && <span className={`${styles.chip} ${styles.neutral}`}><i className="bx bx-user-circle"></i>Hosted by {reg.creatorName}</span>}
            {!isFriend && <span className={`${styles.chip} ${styles.neutral}`}><i className="bx bx-group"></i>{reg.creatorName}</span>}
            <span className={`${styles.chip} ${styles.neutral}`}><i className="bx bx-package"></i>{reg.giftsCount} items</span>
          </div>

          <div className={styles.progWrap}>
            <div className={styles.progTop}>
              <span><b>{reg.purchasedCount}</b> of {reg.giftsCount} {isFriend ? 'gifted' : 'purchased'}</span>
              <span>{pct}%</span>
            </div>
            <div className={styles.progBar}>
              <div className={`${styles.progBarFill} ${isDone ? styles.done : ''}`} style={{ width: `${pct}%` }}></div>
            </div>
          </div>

          <div className={styles.regFoot}>
            {isFriend ? (
              <span className={styles.regValue}>You're a guest<b>Reserve or buy a gift</b></span>
            ) : (
              <span className={styles.regValue}>Total value<b>PKR {formatPrice(reg.totalValue)}</b></span>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <DashboardLayout breadcrumbTitle="Gift Registry">
      <div className={styles.dashContent}>
        <div className={styles.pageHead}>
              <div>
                <div className={styles.pageTitle}>Your Registries</div>
                <div className={styles.pageSub}>Build wishlists of services for your events and share them with guests to reserve or gift.</div>
              </div>
              <Link className={styles.btnPrimary} href="/registry/create"><i className='bx bx-plus'></i>Add Gift Registry</Link>
            </div>

            <div className={styles.qtabs}>
              <button className={`${styles.qtab} ${activeTab === 'my' ? styles.qtabActive : ''}`} onClick={() => setActiveTab('my')}>My Registries</button>
              <button className={`${styles.qtab} ${activeTab === 'friends' ? styles.qtabActive : ''}`} onClick={() => setActiveTab('friends')}>Friends Registries</button>
            </div>

            {activeTab === 'my' && (
              <div className={styles.filterbar}>
                <div className={styles.filterSearch}>
                  <i className='bx bx-search'></i>
                  <input type="text" placeholder="Search your registries..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
                </div>
                <button className={`${styles.fchip} ${filter === 'all' ? styles.fchipActive : ''}`} onClick={() => setFilter('all')}>All</button>
                <button className={`${styles.fchip} ${filter === 'active' ? styles.fchipActive : ''}`} onClick={() => setFilter('active')}>Active</button>
                <button className={`${styles.fchip} ${filter === 'closed' ? styles.fchipActive : ''}`} onClick={() => setFilter('closed')}>Closed</button>
              </div>
            )}

            {isLoading ? (
               <div style={{ textAlign: 'center', padding: '100px 0' }}>
                 <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
               </div>
            ) : filteredRegistries.length > 0 ? (
              <div>
                {currentBucket.length > 0 && (
                  <>
                    <div className={styles.bucketLabel}>{activeTab === 'friends' ? 'Invited to' : 'Current'}</div>
                    <div className={styles.regGrid}>
                      {currentBucket.map(renderCard)}
                    </div>
                  </>
                )}
                {pastBucket.length > 0 && (
                  <>
                    <div className={styles.bucketLabel}>Past</div>
                    <div className={styles.regGrid}>
                      {pastBucket.map(renderCard)}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <i className={activeTab === 'friends' ? 'bx bx-share-alt' : 'bx bx-gift'}></i>
                <h3>{activeTab === 'friends' ? 'No shared registries yet' : 'No registries found'}</h3>
                <p>
                  {activeTab === 'friends' 
                    ? "When friends and family invite you to their registries, they'll appear here." 
                    : "Create a gift registry to let guests reserve or purchase services for your event."}
                </p>
                {activeTab === 'my' && (
                  <Link className={styles.btnPrimary} href="/registry/create" style={{ display: 'inline-flex', marginTop: '10px' }}>
                    <i className='bx bx-plus'></i>Add Gift Registry
                  </Link>
                )}
              </div>
            )}
      </div>
    </DashboardLayout>
  );
}
