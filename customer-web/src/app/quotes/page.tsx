'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import styles from './quotes.module.css';

interface ServiceQuote {
  key: string;
  icon: string;
  name: string;
  quotes: number;
  best: number | null;
  market: number;
  status: 'new' | 'negotiating' | 'awaiting' | 'accepted';
}

interface EventQuotesGroup {
  id: string;
  title: string;
  date: string;
  services: ServiceQuote[];
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Number(n).toLocaleString('en-IN');
}

function formatDateDisplay(dStr?: string): string {
  if (!dStr) return 'Fri, 30 Jan 2026';
  if (dStr.includes('2026-01-30') || dStr === '2026-01-30') return 'Fri, 30 Jan 2026';
  try {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dt = new Date(parseInt(year, 10), monthIdx, day);
      if (months[monthIdx]) {
        const dayOfWeek = days[dt.getDay()] || 'Fri';
        return `${dayOfWeek}, ${day} ${months[monthIdx]} ${year}`;
      }
    }
  } catch (e) {}
  return dStr;
}

export default function QuotesPage() {
  const [filter, setFilter] = useState<'all' | 'new' | 'negotiating' | 'awaiting' | 'accepted'>('all');
  const [events, setEvents] = useState<EventQuotesGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const statusLabel = (s: string) => {
    if (s === 'new') return 'New';
    if (s === 'negotiating') return 'Negotiating';
    if (s === 'accepted') return 'Accepted';
    return 'Awaiting bids';
  };

  useEffect(() => {
    async function loadUserQuotes() {
      setIsLoading(true);
      let rawEvents: any[] = [];

      try {
        const stored = JSON.parse(localStorage.getItem('local_events') || '[]');
        if (Array.isArray(stored)) rawEvents = stored;
      } catch (e) {}

      const res = await api.safeCall(() => api.get<any>('/api/v1/events'));
      if (res.success && res.data) {
        const apiList = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
        const existingIds = new Set(rawEvents.map(x => String(x.id)));
        apiList.forEach((item: any) => {
          if (item && item.id && !existingIds.has(String(item.id))) {
            rawEvents.push(item);
          }
        });
      }

      let acceptedKeys: string[] = [];
      try {
        acceptedKeys = JSON.parse(localStorage.getItem('accepted_quotes') || '[]');
      } catch (e) {}

      if (rawEvents.length > 0) {
        const mappedGroups: EventQuotesGroup[] = rawEvents.map((evt: any) => {
          const title = evt.event_name || evt.name || "Ahmed's Wedding";
          const date = formatDateDisplay(evt.event_date);
          const guests = evt.guest_count || 200;
          const userPkgs = Array.isArray(evt.packages) ? evt.packages : ['continental', 'classic'];
          const userSvcs = Array.isArray(evt.services) ? evt.services : ['venue-ballroom', 'decor-classic'];

          const servicesList: ServiceQuote[] = [];

          if (userPkgs.length > 0) {
            const cateringEst = guests * 1500;
            servicesList.push({
              key: 'catering',
              icon: '🍛',
              name: 'Catering',
              quotes: 3,
              best: Math.round(cateringEst * 0.88),
              market: cateringEst,
              status: acceptedKeys.includes('catering') ? 'accepted' : 'new'
            });
          }

          if (userSvcs.some((s: string) => s.includes('venue'))) {
            servicesList.push({
              key: 'venue',
              icon: '🏛️',
              name: 'Venue',
              quotes: 2,
              best: 185000,
              market: 220000,
              status: acceptedKeys.includes('venue') ? 'accepted' : 'new'
            });
          }

          if (userSvcs.some((s: string) => s.includes('decor'))) {
            servicesList.push({
              key: 'decor',
              icon: '🎀',
              name: 'Decoration',
              quotes: 1,
              best: 98000,
              market: 120000,
              status: acceptedKeys.includes('decor') ? 'accepted' : 'negotiating'
            });
          }

          if (userSvcs.some((s: string) => s.includes('photo'))) {
            servicesList.push({
              key: 'photo',
              icon: '📸',
              name: 'Photography & Video',
              quotes: 0,
              best: null,
              market: 90000,
              status: acceptedKeys.includes('photo') ? 'accepted' : 'awaiting'
            });
          }

          if (servicesList.length === 0) {
            servicesList.push({
              key: 'catering',
              icon: '🍛',
              name: 'Catering',
              quotes: 3,
              best: 210000,
              market: 240000,
              status: acceptedKeys.includes('catering') ? 'accepted' : 'new'
            });
          }

          servicesList.forEach(s => {
            if (acceptedKeys.includes(s.key)) {
              s.status = 'accepted';
            }
          });

          return {
            id: String(evt.id || `evt-${Date.now()}`),
            title,
            date,
            services: servicesList
          };
        });

        setEvents(mappedGroups);
      } else {
        setEvents([]);
      }

      setIsLoading(false);
    }

    loadUserQuotes();
  }, []);

  return (
    <DashboardLayout breadcrumbTitle="Quotes">
      <div>
        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>Quotes</h1>
          <p className={styles.pageSub}>Anonymous bids from Tayaree-verified vendors for your events.</p>
        </div>

        <div className={styles.anonNote}>
          <i className="bx bxs-shield-alt-2"></i>
          <div>
            <div className={styles.anonNoteT}>Your quotes are anonymous</div>
            <div className={styles.anonNoteS}>
              Vendors bid on your requirements without seeing your name or contact details. Compare freely — a vendor's identity is only revealed once you accept their quote.
            </div>
          </div>
        </div>

        <div className={styles.filterbar}>
          <button
            className={`${styles.fchip} ${filter === 'all' ? styles.fchipActive : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`${styles.fchip} ${filter === 'new' ? styles.fchipActive : ''}`}
            onClick={() => setFilter('new')}
          >
            New
          </button>
          <button
            className={`${styles.fchip} ${filter === 'negotiating' ? styles.fchipActive : ''}`}
            onClick={() => setFilter('negotiating')}
          >
            Negotiating
          </button>
          <button
            className={`${styles.fchip} ${filter === 'awaiting' ? styles.fchipActive : ''}`}
            onClick={() => setFilter('awaiting')}
          >
            Awaiting bids
          </button>
          <button
            className={`${styles.fchip} ${filter === 'accepted' ? styles.fchipActive : ''}`}
            onClick={() => setFilter('accepted')}
          >
            Accepted
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
            <p>Loading your quotes...</p>
          </div>
        ) : events.length > 0 ? (
          events.map(ev => {
            const svcs = ev.services.filter(s => filter === 'all' || s.status === filter);
            if (svcs.length === 0) return null;
            const totalQuotes = ev.services.reduce((acc, s) => acc + s.quotes, 0);

            return (
              <div key={ev.id} className={styles.qevent}>
                <div className={styles.qeventHead}>
                  <div className={styles.qeventTitle}>{ev.title}</div>
                  <div className={styles.qeventDate}>
                    <i className="bx bx-calendar"></i>{ev.date}
                  </div>
                  <div className={styles.qeventCount}>
                    {totalQuotes} {totalQuotes === 1 ? 'quote' : 'quotes'}
                  </div>
                </div>

                {svcs.map(s => {
                  const hasQuotes = s.quotes > 0;
                  const save = (hasQuotes && s.best && s.market) ? Math.round(((s.market - s.best) / s.market) * 100) : 0;
                  const statusBadgeClass =
                    s.status === 'new'
                      ? styles.qbadgeNew
                      : s.status === 'negotiating'
                      ? styles.qbadgeNegotiating
                      : s.status === 'accepted'
                      ? styles.qbadgeAccepted
                      : styles.qbadgeAwaiting;

                  return (
                    <Link
                      key={s.key}
                      href={hasQuotes ? (s.key === 'decor' ? '/quotes/decor' : `/quotes/${s.key}`) : '#'}
                      className={styles.qcard}
                    >
                      <div className={styles.qcardIc}>{s.icon}</div>
                      <div className={styles.qcardMain}>
                        <div className={styles.qcardName}>{s.name}</div>
                        <div className={styles.qcardMeta}>
                          <span className={`${styles.qbadge} ${statusBadgeClass}`}>
                            {statusLabel(s.status)}
                          </span>
                          {hasQuotes ? (
                            <>
                              <span>{s.quotes} {s.quotes > 1 ? 'vendors' : 'vendor'} bid</span>
                              <span>· Market avg PKR {fmt(s.market)}</span>
                            </>
                          ) : (
                            <span>No bids yet — vendors respond within 24–48h</span>
                          )}
                        </div>
                      </div>

                      {hasQuotes ? (
                        <>
                          <div className={styles.qcardBest}>
                            <div className={styles.qcardBestLbl}>Best bid</div>
                            <div className={styles.qcardBestAmt}>PKR {fmt(s.best)}</div>
                            <div className={styles.qcardSave}>{save}% under market</div>
                          </div>
                          <span className={styles.qcardCta}>
                            <i className="bx bx-git-compare"></i> Compare {s.quotes}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className={styles.qcardBest}>
                            <div className={styles.qcardBestLbl}>Market avg</div>
                            <div className={styles.qcardBestAmt} style={{ color: 'var(--text-muted)' }}>
                              PKR {fmt(s.market)}
                            </div>
                          </div>
                          <span className={`${styles.qcardCta} ${styles.qcardCtaGhost}`}>
                            <i className="bx bx-time-five"></i> Awaiting
                          </span>
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <i className="bx bx-receipt" style={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '12px' }}></i>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>No quote requests yet</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Create an event to start gathering competitive vendor quotes.
            </p>
            <Link href="/events/create" className={styles.fchipActive} style={{ padding: '12px 24px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <i className="bx bx-plus"></i> Create Event
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
