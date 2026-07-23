'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import styles from './page.module.css';

interface EventChip {
  c: 'neutral' | 'success' | 'amber';
  i: string;
  t: string;
}

interface EventItem {
  id: string;
  title: string;
  type: string;
  typeIcon: string;
  date: string;
  img: string;
  guests: string;
  status: 'planning' | 'quoted' | 'booked';
  statusLabel: string;
  chips: EventChip[];
}

export default function EventsPage() {
  const [searchQ, setSearchQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'planning' | 'past'>('all');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fallbackEvents: EventItem[] = [
    {
      id: 'ahmed-wedding',
      title: "Ahmed's Wedding",
      type: "Wedding",
      typeIcon: "💍",
      date: "Friday, 30 Jan 2026",
      img: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=360&fit=crop",
      guests: "200 guests",
      status: "quoted",
      statusLabel: "3 quotes in",
      chips: [
        { c: "neutral", i: "bx-group", t: "200 guests" },
        { c: "success", i: "bx-receipt", t: "3 quotes" },
        { c: "success", i: "bx-gift", t: "Registry" }
      ]
    },
    {
      id: 'bilal-birthday',
      title: "Bilal's Birthday",
      type: "Birthday",
      typeIcon: "🎂",
      date: "Saturday, 14 Mar 2026",
      img: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&h=360&fit=crop",
      guests: "50 guests",
      status: "quoted",
      statusLabel: "1 quote in",
      chips: [
        { c: "neutral", i: "bx-group", t: "50 guests" },
        { c: "success", i: "bx-receipt", t: "1 quote" }
      ]
    },
    {
      id: 'q4-offsite',
      title: "Q4 Team Offsite",
      type: "Corporate",
      typeIcon: "🏢",
      date: "Date TBD",
      img: "",
      guests: "30 guests",
      status: "planning",
      statusLabel: "Planning",
      chips: [
        { c: "neutral", i: "bx-group", t: "30 guests" },
        { c: "amber", i: "bx-time-five", t: "Awaiting quotes" }
      ]
    },
    {
      id: 'sara-engagement',
      title: "Sara's Engagement",
      type: "Engagement",
      typeIcon: "💑",
      date: "Sunday, 30 Aug 2026",
      img: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=360&fit=crop",
      guests: "120 guests",
      status: "planning",
      statusLabel: "Planning",
      chips: [
        { c: "neutral", i: "bx-group", t: "120 guests" }
      ]
    }
  ];

  async function loadData() {
    setIsLoading(true);
    let combinedRaw: any[] = [];

    const res = await api.safeCall(() => api.get<any>('/api/v1/events'));
    if (res.success && res.data) {
      const rawList = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
      combinedRaw = [...rawList];
    } else {
      // Read local events fallback if API table/migration is missing
      try {
        const localEvts = JSON.parse(localStorage.getItem('local_events') || '[]');
        if (Array.isArray(localEvts)) combinedRaw = [...localEvts];
      } catch (e) {
        console.error(e);
      }
    }

    if (combinedRaw.length > 0) {
      const parsedEvents = combinedRaw.map((item: any) => {
        const typeStr = typeof item.event_type === 'string' ? item.event_type : (item.event_type?.name || 'Event');
        const quotes = item.quote_count ?? item.quotes_count ?? 0;
        const registries = item.registry_count ?? 0;
        const guestsNum = item.guest_count || 0;
        
        return {
          id: item.id || item._id,
          title: item.event_name || 'Unnamed Event',
          type: typeStr,
          typeIcon: '📅',
          date: item.event_date ? new Date(item.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBD',
          img: item.cover_image || 'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=600&h=360&fit=crop',
          guests: `${guestsNum} guests`,
          status: (quotes > 0 ? 'quoted' : 'planning') as 'quoted' | 'planning' | 'booked',
          statusLabel: quotes > 0 ? `${quotes} quotes` : 'Planning',
          chips: [
            ...(quotes > 0 ? [{ c: 'amber' as const, i: 'bx-receipt', t: `${quotes} quotes` }] : []),
            ...(registries > 0 ? [{ c: 'success' as const, i: 'bx-gift', t: `${registries} registry` }] : []),
            { c: 'neutral' as const, i: 'bx-group', t: `${guestsNum} guests` }
          ]
        };
      });
      setEvents(parsedEvents);
    } else {
      setEvents([]);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      let matchesFilter = true;
      if (filter === 'planning') matchesFilter = e.status === 'planning';
      if (filter === 'past') matchesFilter = false; // Mockup: no past events
      if (filter === 'upcoming') matchesFilter = !e.date.includes('TBD');
      
      const matchesSearch = (e.title + ' ' + e.type).toLowerCase().includes(searchQ.toLowerCase());
      
      return matchesFilter && matchesSearch;
    });
  }, [events, searchQ, filter]);

  return (
    <DashboardLayout breadcrumbTitle="My Events">
      <div className={styles.pageHead}>
        <div>
          <div className={styles.pageTitle}>My Events</div>
          <div className={styles.pageSub}>Plan an occasion, gather vendor quotes, and manage everything in one place.</div>
        </div>
        <Link className={styles.btnPrimary} href="/events/create">
          <i className="bx bx-plus"></i>Create Event
        </Link>
      </div>

      <div className={styles.filterbar}>
        <div className={styles.filterSearch}>
          <i className="bx bx-search"></i>
          <input
            type="text"
            placeholder="Search your events..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>
        <button
          className={`${styles.fchip} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`${styles.fchip} ${filter === 'upcoming' ? styles.active : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`${styles.fchip} ${filter === 'planning' ? styles.active : ''}`}
          onClick={() => setFilter('planning')}
        >
          Planning
        </button>
        <button
          className={`${styles.fchip} ${filter === 'past' ? styles.active : ''}`}
          onClick={() => setFilter('past')}
        >
          Past
        </button>
      </div>

      {!isLoading && filteredEvents.length === 0 ? (
        <div className={styles.emptyState}>
          <i className="bx bx-calendar-event"></i>
          <h3>No events found</h3>
          <p>Create an event to start gathering vendor quotes.</p>
          <Link className={styles.btnPrimary} href="/events/create">
            <i className="bx bx-plus"></i>Create Event
          </Link>
        </div>
      ) : (
        <div className={styles.eventsGrid}>
          {filteredEvents.map((e) => (
            <Link key={e.id} href={`/events/${e.id}`} className={styles.evtCard}>
              <div className={styles.evtCover}>
                {e.img ? (
                  <img src={e.img} alt={e.title} />
                ) : (
                  <div className={styles.evtCoverFallback}>{e.typeIcon}</div>
                )}
                <span className={styles.evtTypeBadge}>
                  {e.typeIcon} {e.type}
                </span>
              </div>
              <div className={styles.evtBody}>
                <div className={styles.evtTitle}>{e.title}</div>
                <div className={styles.evtDate}>
                  <i className="bx bx-calendar"></i>
                  {e.date}
                </div>
                <div className={styles.evtChips}>
                  {e.chips.map((c, i) => (
                    <span
                      key={i}
                      className={`${styles.chip} ${
                        c.c === 'success'
                          ? styles.chipSuccess
                          : c.c === 'amber'
                          ? styles.chipAmber
                          : styles.chipNeutral
                      }`}
                    >
                      <i className={`bx ${c.i}`}></i>
                      {c.t}
                    </span>
                  ))}
                </div>
                <div className={styles.evtFoot}>
                  <span
                    className={`${styles.evtStatus} ${
                      e.status === 'planning'
                        ? styles.evtStatusPlanning
                        : e.status === 'quoted'
                        ? styles.evtStatusQuoted
                        : styles.evtStatusBooked
                    }`}
                  >
                    {e.statusLabel}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
