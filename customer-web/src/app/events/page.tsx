'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';
import styles from './page.module.css';

interface EventPlanner {
  id: number;
  title: string;
  eventType: string;
  eventDate: string;
  guestCount: number;
  progressPercentage: number;
  status: string;
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventPlanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login?redirect=/events');
        return;
      }
      loadEvents();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  async function loadEvents() {
    try {
      setIsLoading(true);
      const res = await api.get<{ status: boolean; data: any[] }>(ENDPOINTS.EVENTS_LIST)
        .catch(() => ({ status: false, data: [] }));

      const parsed: EventPlanner[] = (res.data || []).map((ev: any) => ({
        id: ev.id,
        title: ev.title || 'unset',
        eventType: ev.event_type || 'unset',
        eventDate: ev.event_date || 'unset',
        guestCount: ev.guest_count || 0,
        progressPercentage: ev.progress_percentage || 0,
        status: ev.status || 'planning',
      }));

      setEvents(parsed);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredEvents = events.filter(e => {
    if (filter !== 'all') {
      if (filter === 'planning' && e.status !== 'planning') return false;
      if (filter === 'upcoming' && e.eventDate.includes('TBD')) return false;
      if (filter === 'past') return false; 
    }
    if (searchQ) {
      return (e.title + ' ' + e.eventType).toLowerCase().includes(searchQ.toLowerCase());
    }
    return true;
  });

  return (
    <DashboardLayout breadcrumbTitle="My Events">
      <div className={styles.dashContent}>
        <div className={styles.pageHead}>
          <div>
            <div className={styles.pageTitle}>My Events</div>
            <div className={styles.pageSub}>Plan an occasion, gather vendor quotes, and manage everything in one place.</div>
          </div>
          <Link className={styles.btnPrimary} href="/events/create"><i className='bx bx-plus'></i>Create Event</Link>
        </div>
            <div className={styles.filterbar}>
              <div className={styles.filterSearch}>
                <i className='bx bx-search'></i>
                <input type="text" placeholder="Search your events..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
              </div>
              <button className={`${styles.fchip} ${filter === 'all' ? styles.active : ''}`} onClick={() => setFilter('all')}>All</button>
              <button className={`${styles.fchip} ${filter === 'upcoming' ? styles.active : ''}`} onClick={() => setFilter('upcoming')}>Upcoming</button>
              <button className={`${styles.fchip} ${filter === 'planning' ? styles.active : ''}`} onClick={() => setFilter('planning')}>Planning</button>
              <button className={`${styles.fchip} ${filter === 'past' ? styles.active : ''}`} onClick={() => setFilter('past')}>Past</button>
            </div>

            {isLoading ? (
               <div style={{ textAlign: 'center', padding: '100px 0' }}>
                 <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
               </div>
            ) : filteredEvents.length > 0 ? (
              <div className={styles.eventsGrid}>
                {filteredEvents.map(ev => (
                  <Link key={ev.id} className={styles.evtCard} href={`/events/${ev.id}`}>
                    <div className={styles.evtCover}>
                      <div className={styles.evtCoverFallback}>🎉</div>
                      <span className={styles.evtTypeBadge}>{ev.eventType}</span>
                    </div>
                    <div className={styles.evtBody}>
                      <div className={styles.evtTitle}>{ev.title}</div>
                      <div className={styles.evtDate}><i className="bx bx-calendar"></i>{ev.eventDate}</div>
                      <div className={styles.evtChips}>
                        <span className={`${styles.chip} ${styles.neutral}`}><i className="bx bx-group"></i>{ev.guestCount} guests</span>
                      </div>
                      <div className={styles.evtFoot}>
                        <span className={`${styles.evtStatus} ${styles[ev.status] || styles.planning}`}>{ev.status === 'quoted' ? 'Quotes in' : ev.status === 'booked' ? 'Booked' : 'Planning'}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <i className='bx bx-calendar-event'></i>
                <h3>No events found</h3>
                <p>Create an event to start gathering vendor quotes.</p>
                <Link className={styles.btnPrimary} href="/events/create" style={{ display: 'inline-flex', marginTop: '10px' }}><i className='bx bx-plus'></i>Create Event</Link>
              </div>
            )}
      </div>
    </DashboardLayout>
  );
}
