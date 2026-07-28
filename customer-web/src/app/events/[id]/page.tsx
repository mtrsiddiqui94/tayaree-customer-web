'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { api } from '@/lib/api';
import styles from './page.module.css';

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Number(n).toLocaleString('en-IN');
}

interface ServiceItem {
  id: string;
  key: string;
  name: string;
  icon: string;
  sub: string;
  status: 'confirmed' | 'quoted' | 'pending';
}

interface DrawerPackageItem {
  emoji: string;
  name: string;
  tag: string;
}

interface DrawerPackage {
  name: string;
  meta: string;
  items: DrawerPackageItem[];
}

interface ServiceDrawerContent {
  key?: string;
  icon: string;
  name: string;
  status: string;
  packages: DrawerPackage[];
}

const SERVICE_DRAWER_DATA: Record<string, ServiceDrawerContent> = {
  catering: {
    icon: "🍛",
    name: "Catering",
    status: "Classic Pakistani · 200 guests",
    packages: [
      {
        name: "Classic Pakistani Buffet",
        meta: "7 items · PKR 1,200/head",
        items: [
          { emoji: "🍛", name: "Chicken Biryani", tag: "Main" },
          { emoji: "🍖", name: "Mutton Karahi", tag: "Main" },
          { emoji: "🍢", name: "Seekh Kabab", tag: "Starter" },
          { emoji: "🍗", name: "Chicken Tikka", tag: "Starter" },
          { emoji: "🫓", name: "Naan", tag: "Bread" },
          { emoji: "🍮", name: "Gulab Jamun", tag: "Dessert" },
          { emoji: "🥛", name: "Kheer", tag: "Dessert" }
        ]
      }
    ]
  },
  venue: {
    icon: "🏛️",
    name: "Venue",
    status: "2 quotes received · pending review",
    packages: [
      {
        name: "Grand Banquet Hall",
        meta: "300 capacity · Valet included",
        items: [
          { emoji: "🏛️", name: "Main Hall (300 pax)", tag: "Space" },
          { emoji: "🎤", name: "Stage & Sound System", tag: "AV" },
          { emoji: "❄️", name: "Central Air Conditioning", tag: "Comfort" },
          { emoji: "🅿️", name: "Valet Parking", tag: "Service" }
        ]
      }
    ]
  },
  decor: {
    icon: "🎀",
    name: "Decoration",
    status: "1 quote received · pending review",
    packages: [
      {
        name: "Wedding Stage & Floral Theme",
        meta: "Stage + entrance setup",
        items: [
          { emoji: "🌸", name: "Floral Stage Backdrop", tag: "Stage" },
          { emoji: "🎀", name: "Entry Arch", tag: "Entrance" },
          { emoji: "💡", name: "Fairy Lights", tag: "Lighting" },
          { emoji: "🕯️", name: "Table Centerpieces", tag: "Tables" }
        ]
      }
    ]
  },
  photo: {
    icon: "📸",
    name: "Photography & Video",
    status: "Awaiting vendor bids",
    packages: [
      {
        name: "Full-Day Coverage Package",
        meta: "2 shooters · 10 hrs · Drone",
        items: [
          { emoji: "📷", name: "Candid Photography", tag: "Photo" },
          { emoji: "🎬", name: "Cinematic Highlight Video", tag: "Video" },
          { emoji: "🚁", name: "Drone Coverage", tag: "Aerial" },
          { emoji: "📖", name: "Premium Printed Album", tag: "Deliverable" }
        ]
      }
    ]
  }
};

function parseDateFormatted(dStr?: string): { short: string; full: string } {
  if (!dStr) return { short: '30 Jan 2026', full: 'Friday, 30 Jan 2026 · Lahore' };
  if (dStr.includes('2026-01-30') || dStr === '2026-01-30') return { short: '30 Jan 2026', full: 'Friday, 30 Jan 2026 · Lahore' };
  try {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dt = new Date(parseInt(year, 10), monthIdx, day);
      if (months[monthIdx]) {
        const dayOfWeek = days[dt.getDay()] || 'Friday';
        return {
          short: `${day} ${months[monthIdx]} ${year}`,
          full: `${dayOfWeek}, ${day} ${months[monthIdx]} ${year} · Lahore`
        };
      }
    }
  } catch (e) {}
  return { short: dStr, full: `${dStr} · Lahore` };
}

function processEventObject(data: any) {
  const guestsNum = data.guest_count || data.guests || 200;
  const bAmt = data.budget_amount || data.budgetPerHead || 1500;
  const rawName = data.event_name || data.name || "Ahmed's Wedding";
  const nameFormatted = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const rawDate = data.event_date || data.date || '2026-01-30';
  const dateObj = parseDateFormatted(rawDate);

  const flexStr = data.date_flexibility || data.dateFlexibility || 'specific';
  const flexDisplay = (flexStr === '1_day' || flexStr === 1 || flexStr === '1') ? '± 1 day flexible' : (flexStr === '2_days' || flexStr === 2 || flexStr === '2') ? '± 2 days flexible' : 'Specific date';

  const pkgs = Array.isArray(data.packages) ? data.packages : [];
  const svcs = Array.isArray(data.services) ? data.services : [];

  const hasMenu = pkgs.length > 0 || svcs.some((s: string) => String(s).includes('cat') || String(s).includes('menu') || String(s).includes('hightea') || String(s).includes('bbq') || String(s).includes('classic') || String(s).includes('continental'));
  const isHighTea = pkgs.includes('hightea');
  const isBBQ = pkgs.includes('bbq');
  const isCont = pkgs.includes('continental');
  const menuPrice = isHighTea ? 650 : isBBQ ? 2200 : isCont ? 1800 : 1200;
  const menuName = isHighTea ? 'High Tea + Desserts' : isBBQ ? 'Premium BBQ' : isCont ? 'Continental Buffet' : 'Classic Pakistani';

  const dynamicServices: ServiceItem[] = [];

  if (hasMenu) {
    dynamicServices.push({
      id: 'cat',
      key: 'catering',
      name: 'Catering',
      icon: '🍛',
      sub: `${menuName} · ${guestsNum} guests`,
      status: 'confirmed'
    });
  }

  const hasVenue = svcs.some((s: string) => String(s).includes('venue') || String(s).includes('hall') || String(s).includes('ballroom') || String(s).includes('marquee') || String(s).includes('lawn'));
  if (hasVenue) {
    dynamicServices.push({
      id: 'ven',
      key: 'venue',
      name: 'Venue',
      icon: '🏛️',
      sub: '2 quotes received · pending your review',
      status: 'quoted'
    });
  }

  const hasDecor = svcs.some((s: string) => String(s).includes('decor') || String(s).includes('stage') || String(s).includes('floral') || String(s).includes('theme'));
  if (hasDecor) {
    dynamicServices.push({
      id: 'dec',
      key: 'decor',
      name: 'Decoration',
      icon: '🎀',
      sub: '1 quote received · pending your review',
      status: 'quoted'
    });
  }

  const hasPhoto = svcs.some((s: string) => String(s).includes('photo') || String(s).includes('video') || String(s).includes('camera') || String(s).includes('shoot'));
  if (hasPhoto) {
    dynamicServices.push({
      id: 'pho',
      key: 'photo',
      name: 'Photography & Video',
      icon: '📸',
      sub: 'Awaiting vendor bids',
      status: 'pending'
    });
  }

  if (dynamicServices.length === 0) {
    dynamicServices.push(
      { id: 'cat', key: 'catering', name: 'Catering', icon: '🍛', sub: `Catering · ${guestsNum} guests`, status: 'confirmed' },
      { id: 'ven', key: 'venue', name: 'Venue', icon: '🏛️', sub: '2 quotes received', status: 'quoted' }
    );
  }

  const estCostItems: { name: string; val: number }[] = [];
  let calcTotalEst = 0;

  if (hasMenu) {
    const catTotal = guestsNum * menuPrice;
    calcTotalEst += catTotal;
    estCostItems.push({
      name: `Catering (${guestsNum} × ${fmt(menuPrice)})`,
      val: catTotal
    });
  }

  if (hasVenue) {
    const venTotal = 250000;
    calcTotalEst += venTotal;
    estCostItems.push({
      name: 'Venue',
      val: venTotal
    });
  }

  if (hasDecor) {
    const decTotal = 120000;
    calcTotalEst += decTotal;
    estCostItems.push({
      name: 'Decoration',
      val: decTotal
    });
  }

  if (hasPhoto) {
    const phoTotal = 90000;
    calcTotalEst += phoTotal;
    estCostItems.push({
      name: 'Photography',
      val: phoTotal
    });
  }

  if (estCostItems.length === 0) {
    calcTotalEst = 700000;
    estCostItems.push(
      { name: `Catering (${guestsNum} × 1,200)`, val: guestsNum * 1200 },
      { name: 'Venue', val: 250000 }
    );
  }

  const typeStr = typeof data.event_type === 'string' ? data.event_type : (data.event_type?.name || 'Wedding');

  return {
    id: data.id || data._id,
    name: nameFormatted,
    type: typeStr,
    typeIcon: '💍',
    date: dateObj.short,
    fullDate: dateObj.full,
    flexDisplay,
    location: data.location || 'Lahore',
    country: 'Pakistan',
    img: data.cover_image || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=400&fit=crop',
    guests: guestsNum,
    budgetPerHead: bAmt,
    marketEst: calcTotalEst,
    estCostItems,
    quotesCount: data.quote_count ?? dynamicServices.length,
    registryCount: data.registry_count ?? 0,
    status: data.status || 'quoted',
    timingInstructions: data.timing_instructions || data.timingInstructions || null,
    timingVoiceNote: data.timing_voice_note || data.timingVoiceNote || null,
    services: dynamicServices
  };
}

export default function EventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<'overview' | 'quotes' | 'registry'>('overview');
  const [eventData, setEventData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // SERVICE REQUEST DRAWER STATE
  const [activeDrawerKey, setActiveDrawerKey] = useState<string | null>(null);

  const defaultServices: ServiceItem[] = [
    { id: 'cat', key: 'catering', name: 'Catering', icon: '🍛', sub: 'Royal Dastarkhwan · Classic Pakistani · 200 guests', status: 'confirmed' },
    { id: 'ven', key: 'venue', name: 'Venue', icon: '🏛️', sub: '2 quotes received · pending your review', status: 'quoted' },
    { id: 'dec', key: 'decor', name: 'Decoration', icon: '🎀', sub: '1 quote received · pending your review', status: 'quoted' },
    { id: 'pho', key: 'photo', name: 'Photography & Video', icon: '📸', sub: 'Awaiting vendor bids', status: 'pending' }
  ];

  const fallback = {
    id: "ahmed-wedding",
    name: "Ahmed's Wedding",
    type: "Wedding",
    typeIcon: "💍",
    date: "30 Jan 2026",
    fullDate: "Friday, 30 Jan 2026 · Lahore",
    location: "Lahore",
    country: "Pakistan",
    img: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=400&fit=crop",
    guests: 200,
    budgetPerHead: 1500,
    marketEst: 700000,
    quotesCount: 4,
    registryCount: 3,
    status: "quoted",
    services: defaultServices
  };

  async function loadData() {
    setIsLoading(true);

    try {
      const localList = JSON.parse(localStorage.getItem('local_events') || '[]');
      const match = localList.find((item: any) => String(item.id) === String(id));
      if (match) {
        setEventData(processEventObject(match));
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.error(e);
    }

    const res = await api.safeCall(() => api.get<any>(`/api/v1/events/${id}`));
    if (res.success && res.data) {
      const data = res.data.data || res.data;
      setEventData(processEventObject(data));
    } else {
      setEventData(processEventObject(fallback));
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <DashboardLayout breadcrumbTitle="Loading...">
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
          <p>Loading event details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!eventData) {
    return (
      <DashboardLayout breadcrumbTitle="Event">
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <h3>Event not found</h3>
          <Link href="/events" className={styles.btnPrimary} style={{ marginTop: '16px' }}>
            Back to My Events
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const drawerContent = activeDrawerKey ? SERVICE_DRAWER_DATA[activeDrawerKey] : null;

  return (
    <DashboardLayout breadcrumbTitle={eventData.name}>
      <div>
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
            <Link className={styles.btnGhost} href={`/events/create?edit=${eventData.id}`}>
              <i className="bx bx-edit"></i>Edit Event
            </Link>
            <Link className={styles.btnGhost} href="/registry">
              <i className="bx bx-gift"></i>View Registry
            </Link>
            <button className={styles.btnGhost} onClick={() => alert('Event share link copied!')}>
              <i className="bx bx-share-alt"></i>Share
            </button>
          </div>
        </div>

        {/* 4 TOP FACT TILES */}
        <div className={styles.factGrid}>
          <div className={styles.factTile}>
            <div className={styles.factLbl}><i className="bx bx-calendar"></i>DATE</div>
            <div className={styles.factVal}>{eventData.date}</div>
            <div className={styles.factSub}>{eventData.flexDisplay}</div>
          </div>
          <div className={styles.factTile}>
            <div className={styles.factLbl}><i className="bx bx-group"></i>GUESTS</div>
            <div className={styles.factVal}>{eventData.guests}</div>
            <div className={styles.factSub}>Expected attendees</div>
          </div>
          <div className={styles.factTile}>
            <div className={styles.factLbl}><i className="bx bx-wallet"></i>BUDGET</div>
            <div className={styles.factVal}>PKR {fmt(eventData.budgetPerHead)}</div>
            <div className={styles.factSub}>Per head rate</div>
          </div>
          <div className={styles.factTile}>
            <div className={styles.factLbl}><i className="bx bx-calculator"></i>EST. COST</div>
            <div className={styles.factVal}>PKR {fmt(eventData.marketEst)}</div>
            <div className={styles.factSub}>Market estimate</div>
          </div>
        </div>

        {/* TABS */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="bx bx-grid-alt"></i>Overview
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'quotes' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('quotes')}
          >
            <i className="bx bx-receipt"></i>Quotes <span className={styles.tabCount}>{eventData.quotesCount}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'registry' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('registry')}
          >
            <i className="bx bx-gift"></i>Registry <span className={styles.tabCount}>{eventData.registryCount}</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            {/* EVENT DETAILS CARD */}
            <div className={styles.evInfo}>
              <div className={styles.evInfoHead}><i className="bx bx-info-circle"></i>Event Details</div>
              <div className={styles.evInfoGrid}>
                <div className={styles.evInfoItem}>
                  <div className={styles.evInfoIc}><i className="bx bx-purchase-tag"></i></div>
                  <div>
                    <div className={styles.evInfoLbl}>EVENT NAME</div>
                    <div className={styles.evInfoVal}>{eventData.name}</div>
                    <div className={styles.evInfoSub}>{eventData.typeIcon} {eventData.type}</div>
                  </div>
                </div>

                <div className={styles.evInfoItem}>
                  <div className={styles.evInfoIc}><i className="bx bx-calendar"></i></div>
                  <div>
                    <div className={styles.evInfoLbl}>DATE</div>
                    <div className={styles.evInfoVal}>{eventData.date}</div>
                    <div className={styles.evInfoSub}>{eventData.flexDisplay}</div>
                  </div>
                </div>

                <div className={styles.evInfoItem}>
                  <div className={styles.evInfoIc}><i className="bx bx-group"></i></div>
                  <div>
                    <div className={styles.evInfoLbl}>GUESTS</div>
                    <div className={styles.evInfoVal}>{eventData.guests}</div>
                    <div className={styles.evInfoSub}>Expected attendees</div>
                  </div>
                </div>

                <div className={styles.evInfoItem}>
                  <div className={styles.evInfoIc}><i className="bx bx-wallet"></i></div>
                  <div>
                    <div className={styles.evInfoLbl}>BUDGET</div>
                    <div className={styles.evInfoVal}>PKR {fmt(eventData.budgetPerHead)}</div>
                    <div className={styles.evInfoSub}>Per head rate</div>
                  </div>
                </div>

                <div className={styles.evInfoItem}>
                  <div className={styles.evInfoIc}><i className="bx bx-map-pin"></i></div>
                  <div>
                    <div className={styles.evInfoLbl}>LOCATION</div>
                    <div className={styles.evInfoVal}>{eventData.location}</div>
                    <div className={styles.evInfoSub}>{eventData.country}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* TIMING INSTRUCTIONS & VOICE NOTE CARD */}
            {(eventData.timingInstructions || eventData.timingVoiceNote) && (
              <div className={styles.evInfo} style={{ marginTop: '18px' }}>
                <div className={styles.evInfoHead}>
                  <i className="bx bx-notepad" style={{ color: '#D71921', fontSize: '18px' }}></i>Timing Instructions &amp; Voice Note
                </div>
                {eventData.timingInstructions && (
                  <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', margin: '12px 0 14px', lineHeight: '1.6' }}>
                    {eventData.timingInstructions}
                  </p>
                )}
                {eventData.timingVoiceNote && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(`voice-audio-el-${eventData.id}`) as HTMLAudioElement;
                        if (el) {
                          if (el.paused) el.play();
                          else el.pause();
                        }
                      }}
                      style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#D71921', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}
                      title="Play / Pause Voice Note"
                    >
                      <i className="bx bx-play"></i>
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)' }}>Play Voice Note Instruction</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Recorded by organizer · Tap to play audio</div>
                      <audio id={`voice-audio-el-${eventData.id}`} src={eventData.timingVoiceNote} style={{ display: 'none' }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SPLIT LAYOUT: YOUR SERVICES (LEFT) + ESTIMATED COST (RIGHT) */}
            <div className={styles.split}>
              <div>
                <h2 className={styles.secTitle}>
                  <i className="bx bx-map-pin" style={{ color: 'var(--primary)' }}></i>Your Services
                </h2>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '-6px 0 14px' }}>
                  Tap a service to see the packages and items you requested for it.
                </p>

                <div className={styles.card}>
                  {eventData.services.map((svc: ServiceItem) => (
                    <div
                      key={svc.id}
                      className={styles.svcRow}
                      onClick={() => setActiveDrawerKey(svc.key || 'catering')}
                    >
                      <div className={styles.svcIc}>{svc.icon}</div>
                      <div className={styles.svcMain}>
                        <div className={styles.svcName}>{svc.name}</div>
                        <div className={styles.svcSub}>{svc.sub}</div>
                      </div>
                      {svc.status === 'confirmed' && (
                        <span className={`${styles.svcTag} ${styles.svcTagConfirmed}`}>
                          <i className="bx bx-check-circle"></i> Booked
                        </span>
                      )}
                      {svc.status === 'quoted' && (
                        <span className={`${styles.svcTag} ${styles.svcTagQuoted}`}>
                          Quoted
                        </span>
                      )}
                      {svc.status === 'pending' && (
                        <span className={`${styles.svcTag} ${styles.svcTagPending}`}>
                          Awaiting quotes
                        </span>
                      )}
                      <span className={styles.svcView}>
                        View request <i className="bx bx-chevron-right"></i>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ESTIMATED EVENT COST CARD */}
              <div className={styles.estCard}>
                <div className={styles.estLbl}>ESTIMATED EVENT COST</div>
                {(eventData.estCostItems || []).map((item: any, idx: number) => (
                  <div key={idx} className={styles.estRow}>
                    <span className={styles.estN}>{item.name}</span>
                    <span className={styles.estV}>PKR {fmt(item.val)}</span>
                  </div>
                ))}

                <div className={styles.estTotal}>
                  <div className={styles.estTotalLbl}>ESTIMATED TOTAL</div>
                  <div className={styles.estTotalAmt}>PKR {fmt(eventData.marketEst)}</div>
                </div>

                <div className={styles.estNote}>
                  Vendors typically bid 20–35% below market — expect final quotes around <b style={{ color: 'var(--success)', fontWeight: 800 }}>PKR {fmt(Math.round(eventData.marketEst * 0.75))}+</b>.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QUOTES */}
        {activeTab === 'quotes' && (
          <div>
            <h2 className={styles.secTitle}>
              <i className="bx bx-receipt" style={{ color: 'var(--primary)' }}></i>Quotes for {eventData.name}
            </h2>
            <div className={styles.anonNote}>
              <i className="bx bxs-shield-alt-2"></i>
              <div className={styles.anonNoteS}>
                Vendors are <b>Tayaree-verified but anonymous</b>. Compare quotes and request revisions through Tayaree — a vendor's name and contact are revealed <b>only when you accept</b> their quote.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href="/quotes/catering" className={styles.svcRow} style={{ background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div className={styles.svcIc}>🍛</div>
                <div className={styles.svcMain}>
                  <div className={styles.svcName}>Catering</div>
                  <div className={styles.svcSub}>3 vendors bid · Market avg PKR 2,40,000</div>
                </div>
                <span className={styles.btnPrimary} style={{ padding: '8px 16px', fontSize: '12px' }}>
                  <i className="bx bx-git-compare"></i> Compare 3
                </span>
              </Link>

              <Link href="/quotes/venue" className={styles.svcRow} style={{ background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div className={styles.svcIc}>🏛️</div>
                <div className={styles.svcMain}>
                  <div className={styles.svcName}>Venue</div>
                  <div className={styles.svcSub}>2 vendors bid · Market avg PKR 2,20,000</div>
                </div>
                <span className={styles.btnPrimary} style={{ padding: '8px 16px', fontSize: '12px' }}>
                  <i className="bx bx-git-compare"></i> Compare 2
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* TAB 3: REGISTRY */}
        {activeTab === 'registry' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 className={styles.secTitle} style={{ margin: 0 }}>
                <i className="bx bx-gift" style={{ color: 'var(--primary)' }}></i>Registries for {eventData.name}
              </h2>
              <Link className={styles.btnPrimary} href="/registry/create">
                <i className="bx bx-plus"></i>Add Gift Registry
              </Link>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '-6px 0 18px' }}>
              Gift registries linked to this event. You can create more than one — e.g. a main wishlist plus home essentials.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '4px' }}>Main Wedding Registry</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>12 items added · 4 fulfilled</p>
                <Link href="/registry" style={{ display: 'inline-block', marginTop: '12px', fontSize: '12.5px', fontWeight: 700, color: 'var(--primary)' }}>
                  View Registry &gt;
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SERVICE REQUEST SIDE DRAWER MODAL MATCHING EVENT-DETAIL.HTML LINES 486-496 */}
      <div
        className={`${styles.drawerOv} ${activeDrawerKey ? styles.drawerOvOpen : ''}`}
        onClick={() => setActiveDrawerKey(null)}
      >
        <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
          {drawerContent && (
            <>
              <div className={styles.svcdHead}>
                <div className={styles.svcdIc}>{drawerContent.icon}</div>
                <div>
                  <div className={styles.svcdName}>{drawerContent.name}</div>
                  <div className={styles.svcdSub}>{drawerContent.status}</div>
                </div>
                <button className={styles.svcdClose} onClick={() => setActiveDrawerKey(null)}>
                  <i className="bx bx-x"></i>
                </button>
              </div>

              <div className={styles.svcdBody}>
                <div className={styles.svcdSeclbl}>
                  Requested Package{drawerContent.packages.length > 1 ? 's' : ''}
                </div>

                {drawerContent.packages.map((pkg, pIdx) => (
                  <div key={pIdx} className={styles.svcdPkg}>
                    <div className={styles.svcdPkgHead}>
                      <div className={styles.svcdPkgName}>{pkg.name}</div>
                      <div className={styles.svcdPkgMeta}>{pkg.meta}</div>
                    </div>
                    {pkg.items.map((it, iIdx) => (
                      <div key={iIdx} className={styles.svcdItem}>
                        <div className={styles.svcdItemIc}>{it.emoji}</div>
                        <div className={styles.svcdItemName}>{it.name}</div>
                        <div className={styles.svcdItemTag}>{it.tag}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
