'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import styles from './page.module.css';

const DEALS = [
  { id: "wedding", cat: "Wedding", name: "Complete Wedding Bundle", occ: "Catering · Venue · Decor · Photography", img: "1519741497674-611481863552", stores: ["🍛","🏛️","🎀","📸"], gold: 720000, sep: 870000 },
  { id: "mehndi", cat: "Mehndi", name: "Mehndi Night Bundle", occ: "Decor · DJ · Catering · Photography", img: "1478146896981-b80fe463b330", stores: ["🎀","🎧","🍛","📸"], gold: 420000, sep: 510000 },
  { id: "corporate", cat: "Corporate", name: "Corporate Event Bundle", occ: "Venue · Catering · AV · Photography", img: "1511578314322-379afb476865", stores: ["🏛️","🍽️","🎤","📸"], gold: 510000, sep: 620000 }
];

const CATS = [
  { k: "all", l: "All Bundles", i: "bx-store-alt" },
  { k: "Wedding", l: "Wedding", i: "bx-heart" },
  { k: "Mehndi", l: "Mehndi", i: "bx-palette" },
  { k: "Corporate", l: "Corporate", i: "bx-briefcase" }
];

function fmt(n: number){ return (n||0).toLocaleString("en-IN"); }
function IMG(id: string){ return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&h=380&q=80`; }

export default function GrandDealsPage() {
  const [filter, setFilter] = useState('all');

  const filteredDeals = DEALS.filter(d => filter === 'all' || d.cat === filter);

  return (
    <>
      <Header />
      <div className={styles.page}>
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link><span className={styles.sep}>/</span>
          <Link href="/deals">Deals</Link><span className={styles.sep}>/</span>
          <span className={styles.current}>Mega Deals</span>
        </nav>

        <div className={styles.dealsHero}>
          <span className={styles.dealsHeroBadge}><i className='bx bx-store-alt'></i>MEGA DEALS &middot; MULTI-STORE</span>
          <div className={styles.dealsHeroT}>Whole events, one bundle.</div>
          <div className={styles.dealsHeroS}>Tayaree-curated bundles combine several top vendors — catering, venue, decor, photography and more — into one package. Pick a tier, book once, and save versus hiring each separately.</div>
        </div>

        <div className={styles.filterbar}>
          {CATS.map((c) => (
            <button key={c.k} className={`${styles.fchip} ${filter === c.k ? styles.active : ''}`} onClick={() => setFilter(c.k)}>
              <i className={`bx ${c.i}`}></i>{c.l}
            </button>
          ))}
        </div>

        <div className={styles.dealsGrid}>
          {filteredDeals.map((d) => {
            const save = d.sep - d.gold;
            const pct = Math.round((save / d.sep) * 100);
            return (
              <Link key={d.id} className={styles.grdCard} href={`/deals/grand/${d.id}`}>
                <div className={styles.grdCover}>
                  <img src={IMG(d.img)} alt={d.name} />
                  <span className={styles.grdBadge}><i className="bx bx-store"></i>{d.stores.length} stores</span>
                  <span className={styles.grdOff}>Save {pct}%</span>
                </div>
                <div className={styles.grdBody}>
                  <div className={styles.grdName}>
                    <span className={styles.mBadge} title="Mega Deal">M</span>
                    {d.name}
                  </div>
                  <div className={styles.grdOcc}>{d.occ}</div>
                  <div className={styles.grdStores}>
                    {d.stores.map((s, i) => <span key={i} className={styles.grdStoreChip}>{s}</span>)}
                    <span className={styles.grdStoreChip}>Curated by Tayaree</span>
                  </div>
                  <div className={styles.grdPriceRow}>
                    <span className={styles.grdFrom}>From (Gold)</span>
                    <span className={styles.grdPrice}>PKR {fmt(d.gold)}</span>
                    <span className={styles.grdSep}>PKR {fmt(d.sep)}</span>
                  </div>
                  <div className={styles.grdFoot}>
                    <span className={styles.grdSaveTxt}>Save PKR {fmt(save)} vs separate</span>
                    <span className={styles.grdView}><i className="bx bx-cart-add"></i>View Bundle</span>
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
