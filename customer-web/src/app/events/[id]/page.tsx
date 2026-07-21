'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';
import styles from './page.module.css';

interface EventDetail {
  id: number;
  title: string;
  eventType: string;
  eventDate: string;
  guestCount: number;
  budget: string;
  city: string;
  description: string;
  status: string;
}

export default function EventDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'quotes' | 'registry'>('overview');

  useEffect(() => {
    loadEvent();
  }, [id]);

  async function loadEvent() {
    try {
      setIsLoading(true);
      const res = await api.get<{ status: boolean; data: any }>(ENDPOINTS.EVENT_DETAIL(id as string));
      if (res.data) {
        setEvent({
          id: res.data.id,
          title: res.data.title || 'unset',
          eventType: res.data.event_type || 'unset',
          eventDate: res.data.event_date || 'unset',
          guestCount: res.data.guest_count || 0,
          budget: res.data.budget || '0',
          city: res.data.city || 'unset',
          description: res.data.description || '',
          status: res.data.status || 'planning',
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
        </div>
        <Footer />
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Header />
        <div style={{ textAlign: 'center', padding: '100px 0' }}>Event not found</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className={styles.page}>
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link><span className={styles.sep}>/</span>
          <Link href="/events">My Events</Link><span className={styles.sep}>/</span>
          <span className={styles.current}>{event.title}</span>
        </nav>
        <div className={styles.dashContent}>
            <div className={styles.evtHero}>
              <div className={styles.evtHeroCover}>
                <div className={styles.evtHeroCoverFallback}>🎉</div>
                <span className={styles.evtHeroBadge}>✨ {event.eventType}</span>
                <div className={styles.evtHeroTitle}>
                  <div className={styles.evtHeroName}>{event.title}</div>
                  <div className={styles.evtHeroDate}><i className='bx bx-calendar'></i>{event.eventDate} · {event.city}</div>
                </div>
              </div>
              <div className={styles.evtHeroActions}>
                <Link href={`/events/create?edit=${event.id}`} className={styles.btnGhost}><i className='bx bx-edit'></i>Edit Event</Link>
                <Link href="/registry" className={styles.btnGhost}><i className='bx bx-gift'></i>View Registry</Link>
              </div>
            </div>

            <div className={styles.factGrid}>
              <div className={styles.factTile}><div className={styles.factLbl}><i className='bx bx-calendar'></i>Date</div><div className={styles.factVal}>{event.eventDate}</div></div>
              <div className={styles.factTile}><div className={styles.factLbl}><i className='bx bx-group'></i>Guests</div><div className={styles.factVal}>{event.guestCount}</div></div>
              <div className={styles.factTile}><div className={styles.factLbl}><i className='bx bx-wallet'></i>Budget</div><div className={styles.factVal}>{event.budget}</div></div>
              <div className={styles.factTile}><div className={styles.factLbl}><i className='bx bx-map-pin'></i>Location</div><div className={styles.factVal}>{event.city}</div></div>
            </div>

            <div className={styles.tabs}>
              <button className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`} onClick={() => setActiveTab('overview')}><i className='bx bx-grid-alt'></i>Overview</button>
              <button className={`${styles.tab} ${activeTab === 'quotes' ? styles.active : ''}`} onClick={() => setActiveTab('quotes')}><i className='bx bx-receipt'></i>Quotes</button>
              <button className={`${styles.tab} ${activeTab === 'registry' ? styles.active : ''}`} onClick={() => setActiveTab('registry')}><i className='bx bx-gift'></i>Registry</button>
            </div>

            {activeTab === 'overview' && (
              <div>
                <div className={styles.evInfo}>
                  <div className={styles.evInfoHead}><i className='bx bx-info-circle'></i>Event Details</div>
                  <div className={styles.evInfoGrid}>
                    <div className={styles.evInfoItem}><div className={styles.evInfoIc}><i className='bx bx-purchase-tag'></i></div><div><div className={styles.evInfoLbl}>Event Name</div><div className={styles.evInfoVal}>{event.title}</div><div className={styles.evInfoSub}>{event.eventType}</div></div></div>
                    <div className={styles.evInfoItem}><div className={styles.evInfoIc}><i className='bx bx-calendar'></i></div><div><div className={styles.evInfoLbl}>Date</div><div className={styles.evInfoVal}>{event.eventDate}</div></div></div>
                    <div className={styles.evInfoItem}><div className={styles.evInfoIc}><i className='bx bx-group'></i></div><div><div className={styles.evInfoLbl}>Guests</div><div className={styles.evInfoVal}>{event.guestCount}</div></div></div>
                    <div className={styles.evInfoItem}><div className={styles.evInfoIc}><i className='bx bx-wallet'></i></div><div><div className={styles.evInfoLbl}>Budget</div><div className={styles.evInfoVal}>{event.budget}</div></div></div>
                    <div className={styles.evInfoItem}><div className={styles.evInfoIc}><i className='bx bx-map-pin'></i></div><div><div className={styles.evInfoLbl}>Location</div><div className={styles.evInfoVal}>{event.city}</div></div></div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'quotes' && (
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '14px' }}>Quotes</h2>
                <div style={{ padding: '24px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', textAlign: 'center' }}>
                  No quotes received yet for this event.
                </div>
              </div>
            )}

            {activeTab === 'registry' && (
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '14px' }}>Linked Registries</h2>
                <div style={{ padding: '24px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)', textAlign: 'center' }}>
                  <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>No registries linked to this event.</p>
                  <Link href="/registry/create" className={styles.btnPrimary}><i className='bx bx-plus'></i>Create Registry</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      <Footer />
    </>
  );
}
