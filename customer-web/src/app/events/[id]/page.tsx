'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/formatPrice';
import styles from './page.module.css';

export default function EventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<'overview' | 'quotes' | 'registry'>('overview');
  const [eventData, setEventData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback data
  const fallback = {
    id: "ahmed-wedding",
    name: "Ahmed's Wedding",
    type: "Wedding",
    typeIcon: "💍",
    date: "30 Jan 2026",
    fullDate: "Friday, 30 Jan 2026 · Lahore",
    location: "Lahore, Pakistan",
    img: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&h=360&fit=crop",
    guests: 200,
    budgetPerHead: 1500,
    marketEst: 700000,
    quotesCount: 4,
    registryCount: 3,
    status: "quoted",
    services: [
      { id: '1', name: 'Catering', icon: '🍛', sub: 'Royal Dastarkhwan · Classic Pakistani · 200 guests', status: 'confirmed' },
      { id: '2', name: 'Venue', icon: '🏛️', sub: '2 quotes received · pending your review', status: 'quoted' },
      { id: '3', name: 'Decoration', icon: '🎀', sub: '1 quote received · pending your review', status: 'quoted' },
      { id: '4', name: 'Photography & Video', icon: '📸', sub: 'Awaiting vendor bids', status: 'pending' },
    ]
  };

  async function loadData() {
    setIsLoading(true);

    // 1. Check local_events first if created locally
    try {
      const localList = JSON.parse(localStorage.getItem('local_events') || '[]');
      const match = localList.find((item: any) => String(item.id) === String(id));
      if (match) {
        const guestsNum = match.guest_count || 0;
        const bAmt = match.budget_amount || 0;
        const est = match.market_estimate || (guestsNum * bAmt);

        setEventData({
          id: match.id,
          name: match.event_name || 'Unnamed Event',
          type: typeof match.event_type === 'string' ? match.event_type : (match.event_type?.name || 'Event'),
          typeIcon: '📅',
          date: match.event_date ? new Date(match.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBD',
          fullDate: match.event_date ? `${new Date(match.event_date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}` : 'unset',
          location: match.location || 'unset',
          img: match.cover_image || 'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=1000&h=360&fit=crop',
          guests: guestsNum,
          budgetPerHead: bAmt,
          marketEst: est,
          quotesCount: match.quote_count || 0,
          registryCount: match.registry_count || 0,
          status: match.status || 'planning',
          services: match.services || [
            { id: '1', name: 'Catering', icon: '🍛', sub: `${guestsNum} guests · PKR ${bAmt}/head`, status: 'pending' },
            { id: '2', name: 'Venue & Decor', icon: '🏛️', sub: 'Pending quotes', status: 'pending' }
          ]
        });
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Fetch from API
    const res = await api.safeCall(() => api.get<any>(`/api/v1/events/${id}`));
    if (res.success && res.data) {
      const data = res.data.data || res.data;
      const typeStr = typeof data.event_type === 'string' ? data.event_type : (data.event_type?.name || 'Event');
      const guestsNum = data.guest_count || 0;
      const bAmt = data.budget_amount || 0;
      const est = data.market_estimate || (guestsNum * bAmt);

      setEventData({
        id: data.id || data._id,
        name: data.event_name || 'Unnamed Event',
        type: typeStr,
        typeIcon: '📅',
        date: data.event_date ? new Date(data.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBD',
        fullDate: data.event_date ? `${new Date(data.event_date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}` : 'unset',
        location: data.location || 'unset',
        img: data.cover_image || fallback.img,
        guests: guestsNum,
        budgetPerHead: bAmt,
        marketEst: est,
        quotesCount: data.quote_count ?? data.quotes_count ?? 0,
        registryCount: data.registry_count || 0,
        status: data.status || 'planning',
        services: data.services || []
      });
    } else {
      // 3. Fallback if API fails and not found locally
      setEventData(fallback);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [id]);

  if (isLoading) return <DashboardLayout breadcrumbTitle="Loading..."><div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div></DashboardLayout>;
  if (!eventData) return <DashboardLayout breadcrumbTitle="Error"><div style={{ textAlign: 'center', padding: '50px' }}>Event not found</div></DashboardLayout>;

  return (
    <DashboardLayout breadcrumbTitle={eventData.name}>
      {/* HERO */}
      <div className={styles.evtHero}>
        <div className={styles.evtHeroCover}>
          <img src={eventData.img} alt={eventData.name} />
          <span className={styles.evtHeroBadge}>{eventData.typeIcon} {eventData.type}</span>
          <span className={styles.evtHeroStatus}>
            <i className="bx bx-receipt"></i>{eventData.quotesCount} quotes in
          </span>
          <div className={styles.evtHeroTitle}>
            <div className={styles.evtHeroName}>{eventData.name}</div>
            <div className={styles.evtHeroDate}>
              <i className="bx bx-calendar"></i>{eventData.fullDate}
            </div>
          </div>
        </div>
        <div className={styles.evtHeroActions}>
          <Link className={styles.btnPrimary} href="/events/create">
            <i className="bx bx-plus"></i>Add Services
          </Link>
          <Link className={styles.btnGhost} href="/events/create">
            <i className="bx bx-edit"></i>Edit Event
          </Link>
          <Link className={styles.btnGhost} href="/gift-registry">
            <i className="bx bx-gift"></i>View Registry
          </Link>
        </div>
      </div>

      {/* FACTS */}
      <div className={styles.factGrid}>
        <div className={styles.factTile}>
          <div className={styles.factLbl}><i className="bx bx-calendar"></i>Date</div>
          <div className={styles.factVal}>{eventData.date}</div>
          <div className={styles.factSub}>Flexible</div>
        </div>
        <div className={styles.factTile}>
          <div className={styles.factLbl}><i className="bx bx-group"></i>Guests</div>
          <div className={styles.factVal}>{eventData.guests}</div>
          <div className={styles.factSub}>Expected attendees</div>
        </div>
        <div className={styles.factTile}>
          <div className={styles.factLbl}><i className="bx bx-wallet"></i>Budget</div>
          <div className={styles.factVal}>{eventData.budgetPerHead === 0 ? 'unset' : formatPrice(eventData.budgetPerHead)}</div>
          <div className={styles.factSub}>Per head rate</div>
        </div>
        <div className={styles.factTile}>
          <div className={styles.factLbl}><i className="bx bx-calculator"></i>Est. cost</div>
          <div className={styles.factVal}>{eventData.marketEst === 0 ? 'unset' : formatPrice(eventData.marketEst)}</div>
          <div className={styles.factSub}>Market estimate</div>
        </div>
      </div>

      {/* TABS */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`} onClick={() => setActiveTab('overview')}>
          <i className="bx bx-grid-alt"></i>Overview
        </button>
        <button className={`${styles.tab} ${activeTab === 'quotes' ? styles.tabActive : ''}`} onClick={() => setActiveTab('quotes')}>
          <i className="bx bx-receipt"></i>Quotes <span className={styles.tabCount}>{eventData.quotesCount}</span>
        </button>
        <button className={`${styles.tab} ${activeTab === 'registry' ? styles.tabActive : ''}`} onClick={() => setActiveTab('registry')}>
          <i className="bx bx-gift"></i>Registry <span className={styles.tabCount}>{eventData.registryCount}</span>
        </button>
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className={`${styles.tabpane} ${styles.tabpaneActive}`}>
          <div className={styles.evInfo}>
            <div className={styles.evInfoHead}><i className="bx bx-info-circle"></i>Event Details</div>
            <div className={styles.evInfoGrid}>
              <div className={styles.evInfoItem}>
                <div className={styles.evInfoIc}><i className="bx bx-purchase-tag"></i></div>
                <div>
                  <div className={styles.evInfoLbl}>Event Name</div>
                  <div className={styles.evInfoVal}>{eventData.name}</div>
                  <div className={styles.evInfoSub}>{eventData.typeIcon} {eventData.type}</div>
                </div>
              </div>
              <div className={styles.evInfoItem}>
                <div className={styles.evInfoIc}><i className="bx bx-calendar"></i></div>
                <div>
                  <div className={styles.evInfoLbl}>Date</div>
                  <div className={styles.evInfoVal}>{eventData.date}</div>
                </div>
              </div>
              <div className={styles.evInfoItem}>
                <div className={styles.evInfoIc}><i className="bx bx-group"></i></div>
                <div>
                  <div className={styles.evInfoLbl}>Guests</div>
                  <div className={styles.evInfoVal}>{eventData.guests}</div>
                </div>
              </div>
              <div className={styles.evInfoItem}>
                <div className={styles.evInfoIc}><i className="bx bx-wallet"></i></div>
                <div>
                  <div className={styles.evInfoLbl}>Budget</div>
                  <div className={styles.evInfoVal}>{eventData.budgetPerHead === 0 ? 'unset' : formatPrice(eventData.budgetPerHead)}</div>
                </div>
              </div>
              <div className={styles.evInfoItem}>
                <div className={styles.evInfoIc}><i className="bx bx-map-pin"></i></div>
                <div>
                  <div className={styles.evInfoLbl}>Location</div>
                  <div className={styles.evInfoVal}>{eventData.location}</div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.split}>
            <div>
              <h2 className={styles.secTitle}><i className="bx bx-been-here" style={{ color: 'var(--primary)' }}></i>Your Services</h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '-6px 0 14px' }}>Tap a service to see the packages and items you requested for it.</p>
              
              <div className={styles.card}>
                {eventData.services.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No services requested yet.</div>
                ) : (
                  eventData.services.map((svc: any) => (
                    <div className={styles.svcRow} key={svc.id}>
                      <div className={styles.svcIc}>{svc.icon}</div>
                      <div className={styles.svcMain}>
                        <div className={styles.svcName}>{svc.name}</div>
                        <div className={styles.svcSub}>{svc.sub}</div>
                      </div>
                      {svc.status === 'confirmed' && <span className={`${styles.svcTag} ${styles.svcTagConfirmed}`}><i className="bx bx-check-circle"></i> Booked</span>}
                      {svc.status === 'quoted' && <span className={`${styles.svcTag} ${styles.svcTagQuoted}`}>Quoted</span>}
                      {svc.status === 'pending' && <span className={`${styles.svcTag} ${styles.svcTagPending}`}>Awaiting quotes</span>}
                      <span className={styles.svcView}>View request<i className="bx bx-chevron-right"></i></span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={styles.estCard}>
              <div className={styles.estLbl}>Estimated event cost</div>
              <div className={styles.estRow}><span className={styles.n}>Catering ({eventData.guests} × 1,200)</span><span className={styles.v}>{formatPrice(240000)}</span></div>
              <div className={styles.estRow}><span className={styles.n}>Venue</span><span className={styles.v}>{formatPrice(250000)}</span></div>
              <div className={styles.estRow}><span className={styles.n}>Decoration</span><span className={styles.v}>{formatPrice(120000)}</span></div>
              <div className={styles.estRow}><span className={styles.n}>Photography</span><span className={styles.v}>{formatPrice(90000)}</span></div>
              <div className={styles.estTotal}>
                <div className={styles.estTotalLbl}>Estimated total</div>
                <div className={styles.estTotalAmt}>{formatPrice(700000)}</div>
              </div>
              <div className={styles.estNote}>Vendors typically bid 20–35% below market — expect final quotes around <b>{formatPrice(476000)}</b>+.</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: QUOTES */}
      {activeTab === 'quotes' && (
        <div className={`${styles.tabpane} ${styles.tabpaneActive}`}>
          <h2 className={styles.secTitle}><i className="bx bx-receipt" style={{ color: 'var(--primary)' }}></i>Quotes for {eventData.name}</h2>
          <div className={styles.anonNote}>
            <i className="bx bxs-shield-alt-2"></i>
            <div className={styles.anonNoteS}>Vendors are <b>Tayaree-verified but anonymous</b>. Compare quotes and request revisions through Tayaree — a vendor's name and contact are revealed <b>only when you accept</b> their quote.</div>
          </div>
          <div className={styles.emptyTab}>
            <i className="bx bx-file-blank"></i>
            <h3>No quotes received yet</h3>
            <p>We're gathering bids from our vendors. Check back soon.</p>
          </div>
        </div>
      )}

      {/* TAB: REGISTRY */}
      {activeTab === 'registry' && (
        <div className={`${styles.tabpane} ${styles.tabpaneActive}`}>
          <div className={styles.evrHead}>
            <h2 className={styles.secTitle} style={{ margin: 0 }}><i className="bx bx-gift" style={{ color: 'var(--primary)' }}></i>Registries for {eventData.name}</h2>
            <Link className={styles.btnPrimary} href="/registry">
              <i className="bx bx-plus"></i>Add Gift Registry
            </Link>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '-6px 0 18px' }}>Gift registries linked to this event. You can create more than one.</p>
          <div className={styles.emptyTab}>
            <i className="bx bx-gift"></i>
            <h3>No registries found</h3>
            <p>Create a gift registry for this event.</p>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
