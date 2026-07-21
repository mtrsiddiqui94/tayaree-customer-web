'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import styles from './page.module.css';

const DEALS = [
  { id: "photographer", cat: "Photography", icon: "📸", name: "Signature Wedding Photography — Full Day", vendor: "Pixel Perfect Studios", rating: 4.9, img: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&h=380&q=80", orig: 120000, price: 85000, target: 15, joined: 12, closes: "2d 14h", perUnit: false },
  { id: "salon", cat: "Beauty & Makeup", icon: "💄", name: "Signature Bridal Makeover Package", vendor: "Glam by Sana K.", rating: 4.8, img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&h=380&q=80", orig: 55000, price: 38000, target: 20, joined: 20, closes: "1d 06h", perUnit: false },
  { id: "travel", cat: "Travel & Tours", icon: "✈️", name: "Hunza Valley — 4-Day Group Tour", vendor: "Northern Escapes", rating: 4.7, img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&h=380&q=80", orig: 65000, price: 45000, target: 25, joined: 19, closes: "4d 03h", perUnit: true },
  { id: "dj", cat: "DJ & Sound", icon: "🎧", name: "Wedding DJ + Sound & Lights — 5 Hours", vendor: "BeatDrop Events", rating: 4.8, img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=600&h=380&q=80", orig: 90000, price: 60000, target: 10, joined: 8, closes: "1d 19h", perUnit: false },
  { id: "performers", cat: "Live Performers", icon: "🎭", name: "Live Qawwali Night — 7-Member Ensemble", vendor: "Sufi Sound Collective", rating: 4.9, img: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=600&h=380&q=80", orig: 150000, price: 110000, target: 8, joined: 6, closes: "3d 11h", perUnit: false }
];

const CATS = [
  { k: "all", l: "All Deals", i: "bx-purchase-tag" },
  { k: "Photography", l: "Photography", i: "bx-camera" },
  { k: "Beauty & Makeup", l: "Beauty & Makeup", i: "bx-spa" },
  { k: "Travel & Tours", l: "Travel", i: "bx-plane" },
  { k: "DJ & Sound", l: "DJ & Sound", i: "bx-music" },
  { k: "Live Performers", l: "Performers", i: "bx-microphone" }
];

function fmt(n: number) {
  return (n || 0).toLocaleString("en-IN");
}

export default function GroupDealsPage() {
  const [filter, setFilter] = useState("all");

  const filteredDeals = DEALS.filter(d => filter === "all" || d.cat === filter);

  return (
    <>
      <Header />
      <div className={styles.page}>
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link><span className={styles.sep}>/</span>
          <span className={styles.current}>Group Deals</span>
        </nav>

        <div className={styles.dealsHero}>
          <span className={styles.dealsHeroBadge}><i className='bx bx-group'></i>GROUP DEALS</span>
          <div className={styles.dealsHeroT}>Join together, pay less.</div>
          <div className={styles.dealsHeroS}>When enough people join the same deal before the timer runs out, everyone unlocks the group price. Reserve your spot with a small deposit — book on your own date.</div>
        </div>

        <div className={styles.filterbar}>
          {CATS.map(c => (
            <button
              key={c.k}
              className={`${styles.fchip} ${filter === c.k ? styles.fchipActive : ''}`}
              onClick={() => setFilter(c.k)}
            >
              <i className={`bx ${c.i}`}></i>{c.l}
            </button>
          ))}
        </div>

        <div className={styles.dealsGrid}>
          {filteredDeals.map(d => {
            const unlocked = d.joined >= d.target;
            const pct = Math.min(100, Math.round((d.joined / d.target) * 100));
            const savePct = Math.round(((d.orig - d.price) / d.orig) * 100);

            return (
              <Link key={d.id} className={styles.gdCard} href={`/deals/group/${d.id}`}>
                <div className={styles.gdCover}>
                  <img src={d.img} alt={d.name} />
                  <span className={styles.gdCat}>{d.icon} {d.cat}</span>
                  <span className={styles.gdTimer}><i className="bx bx-time-five"></i>{d.closes}</span>
                  <span className={styles.gdOff}>{savePct}% OFF</span>
                </div>
                <div className={styles.gdBody}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <span style={{ display: 'inline-flex', width: '24px', height: '24px', borderRadius: '6px', background: '#6D28D9', color: '#fff', fontWeight: 900, fontSize: '14px', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="Group Deal">G</span>
                    <div className={styles.gdName}>{d.name}</div>
                  </div>
                  <div className={styles.gdVendor}><i className="bx bx-store"></i>{d.vendor} <span className={styles.star}>★ {d.rating}</span></div>
                  <div className={styles.gdPriceRow}>
                    <span className={styles.gdPrice}>PKR {fmt(d.price)}</span>
                    {d.perUnit && <span className={styles.gdPer}>/ person</span>}
                    <span className={styles.gdOrig}>PKR {fmt(d.orig)}</span>
                  </div>
                  <div className={styles.gdProgWrap}>
                    <div className={styles.gdProgTop}>
                      <span><b>{d.joined}</b> of {d.target} joined</span>
                      <span className={styles.u}>{pct}%</span>
                    </div>
                    <div className={styles.gdProg}>
                      <div className={`${styles.gdProgFill} ${unlocked ? styles.gdProgFillDone : ''}`} style={{ width: `${pct}%` }}></div>
                    </div>
                    {unlocked ? (
                      <div className={`${styles.gdNote} ${styles.gdNoteUnlocked}`}>
                        <i className="bx bx-check-circle"></i>Price unlocked — join before it closes
                      </div>
                    ) : (
                      <div className={styles.gdNote}>
                        <i className="bx bx-group"></i>{d.target - d.joined} more to unlock the group price
                      </div>
                    )}
                  </div>
                  <div className={styles.gdFoot}>
                    <span className={styles.gdJoined}>{d.joined} people joined</span>
                    <span className={styles.gdJoin}><i className="bx bx-cart-add"></i>Join Deal</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <Footer />
    </>
  );
}
