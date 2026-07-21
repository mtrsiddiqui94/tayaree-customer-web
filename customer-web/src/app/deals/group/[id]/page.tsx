'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import styles from './page.module.css';

function fmt(n: number) {
  return (n || 0).toLocaleString("en-IN");
}

export default function GroupDealDetailPage({ params }: { params: { id: string } }) {
  const [ack, setAck] = useState(false);

  const DEAL = {
    name: "Signature Wedding Photography — Full Day",
    id: "photographer",
    vendor: "Pixel Perfect Studios",
    rating: 4.9,
    reviews: 210,
    images: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&h=600&q=80",
      "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=900&h=600&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&h=600&q=80"
    ],
    desc: "Pixel Perfect Studios brings full-day cinematic wedding coverage by a dedicated two-person team — capturing candid moments, posed portraits and every ritual across your event. Every frame is hand-edited in our signature warm tone and delivered in a private online gallery.",
    includes: [
      { name: "2 Professional Photographers", note: "Candid + posed", emoji: "📷" },
      { name: "Cinematic Highlight Video", note: "3-4 min", emoji: "🎬" },
      { name: "Drone Aerial Coverage", note: "Venue & entrance shots", emoji: "🚁" },
      { name: "500+ Edited Photos", note: "Private gallery + downloads", emoji: "🖼️" },
      { name: "Premium Printed Album", note: "30-page hardcover", emoji: "📖" }
    ],
    orig: 120000,
    price: 85000,
    target: 15,
    joined: 12,
    closes: "2d 14h"
  };

  const unlocked = DEAL.joined >= DEAL.target;
  const pct = Math.min(100, Math.round((DEAL.joined / DEAL.target) * 100));
  const save = DEAL.orig - DEAL.price;

  return (
    <>
      <Header />
      <div className={styles.page}>
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link><span className={styles.sep}>/</span>
          <Link href="/deals/group">Group Deals</Link><span className={styles.sep}>/</span>
          <span className={styles.current}>{DEAL.name}</span>
        </nav>

        <div className={styles.gallery}>
          <div className={styles.gHero}>
            <span className={styles.gHeroBadge}><i className='bx bx-group'></i> GROUP DEAL</span>
            <img src={DEAL.images[0]} alt="Hero" />
          </div>
          <div><img src={DEAL.images[1]} alt="Gallery 1" /></div>
          <div><img src={DEAL.images[2]} alt="Gallery 2" /></div>
        </div>

        <div className={styles.detailGrid}>
          <div>
            <div className={styles.svcEyebrow}>
              <i className='bx bx-group'></i> TAYAREE GROUP DEAL
            </div>
            <h1 className={styles.svcTitle}>{DEAL.name}</h1>
            <div className={styles.svcMeta}>
              <span className={styles.svcVendor}><i className='bx bx-store'></i> {DEAL.vendor}</span>
              <span className={styles.dot}>•</span>
              <span className={styles.metaChip}><span className={styles.star}>★</span> {DEAL.rating} ({DEAL.reviews} reviews)</span>
            </div>

            <div className={styles.lead}>{DEAL.desc}</div>

            <div className={styles.secTitle}><i className='bx bx-check-circle'></i> What&apos;s Included in this Deal</div>
            <div className={styles.incCard}>
              {DEAL.includes.map((inc, i) => (
                <div key={i} className={styles.incRow}>
                  <div className={styles.incIc}>{inc.emoji}</div>
                  <div className={styles.incMain}>
                    <div className={styles.incName}>{inc.name}</div>
                    <div className={styles.incNote}>{inc.note}</div>
                  </div>
                  <i className={`bx bx-check ${styles.incCheck}`}></i>
                </div>
              ))}
            </div>
          </div>

          <aside>
            <div className={styles.gdPanel}>
              <div className={styles.gdTop}>
                <div className={styles.gdTopL}><i className='bx bx-group'></i> Group Deal</div>
                <div className={styles.gdTimer}><i className='bx bx-time-five'></i> Closes in {DEAL.closes}</div>
              </div>
              <div className={styles.gdBody}>
                <div className={styles.gdPriceRow}>
                  <span className={styles.gdPrice}>PKR {fmt(DEAL.price)}</span>
                  <span className={styles.gdOrig}>PKR {fmt(DEAL.orig)}</span>
                </div>
                <div className={styles.gdSave}><i className='bx bxs-discount'></i> Save PKR {fmt(save)}</div>
                <div className={styles.gdUnit}>Full-day coverage · up to 10 hours</div>

                <div className={styles.gdProgWrap}>
                  <div className={styles.gdProgTop}>
                    <span><b>{DEAL.joined}</b> of {DEAL.target} joined</span>
                    <span className={styles.u}>{pct}%</span>
                  </div>
                  <div className={styles.gdProg}>
                    <div className={`${styles.gdProgFill} ${unlocked ? styles.gdProgFillDone : ''}`} style={{ width: `${pct}%` }}></div>
                  </div>
                  {unlocked ? (
                    <div className={`${styles.gdProgNote} ${styles.gdProgNoteUnlocked}`}>
                      <i className='bx bx-check-circle'></i> Price unlocked! Join before it closes.
                    </div>
                  ) : (
                    <div className={styles.gdProgNote}>
                      <i className='bx bx-info-circle'></i> {DEAL.target - DEAL.joined} more needed to unlock price
                    </div>
                  )}
                </div>

                <div className={styles.gdDivider}></div>
                
                <label className={styles.gdFldLbl}>SELECT EVENT DATE</label>
                <div className={styles.gdInput}>
                  <i className='bx bx-calendar'></i> Select your date
                </div>

                <div className={styles.gdDivider}></div>

                <label style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-secondary)', alignItems: 'center' }}>
                  <input type="checkbox" style={{ accentColor: 'var(--primary)', width: 16, height: 16 }} checked={ack} onChange={(e) => setAck(e.target.checked)} />
                  <span>I agree to the <b>Group Deal Terms</b> and deposit policy.</span>
                </label>

                <button className={`${styles.gdJoin} ${!ack ? styles.gdJoinDisabled : ''}`}>
                  <i className='bx bx-cart-add'></i> Reserve Spot Now
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </>
  );
}
