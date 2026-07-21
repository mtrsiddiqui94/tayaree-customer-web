'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import styles from './page.module.css';

export default function DealsPage() {
  return (
    <>
      <Header />
      <div className={styles.page}>
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link><span className={styles.sep}>/</span>
          <span className={styles.current}>Deals</span>
        </nav>

        <div className={styles.dealsHero}>
          <div className={styles.dealsHeroT}>Three ways to save on Tayaree</div>
          <div className={styles.dealsHeroS}>Every deal on Tayaree falls into one of three types. Pick the one that fits your plan — a ready package, a group buy, or a full multi-store bundle.</div>
          <div className={styles.dealsHeroTags}>
            <span className={`${styles.dhTag} ${styles.p}`}><b>P</b>Package Deals</span>
            <span className={`${styles.dhTag} ${styles.g}`}><b>G</b>Group Deals</span>
            <span className={`${styles.dhTag} ${styles.m}`}><b>M</b>Mega Deals</span>
          </div>
        </div>

        <div className={styles.dealsCards}>
          <Link className={`${styles.dealHubCard} ${styles.p}`} href="/packages">
            <div className={`${styles.dhbBadge} ${styles.p}`}>P</div>
            <div className={styles.dhbTitle}>Package Deals <span className={`${styles.dhbPill} ${styles.p}`}>1 store</span></div>
            <div className={styles.dhbTagline}>One vendor &middot; fixed price</div>
            <div className={styles.dhbDesc}>Ready-made packages curated by a single vendor. Browse a package, pick your options and book it at a set price — no waiting, no negotiation.</div>
            <div className={styles.dhbEx}><span>🍛 Catering</span><span>💄 Bridal</span><span>🎀 Decor</span><span>📸 Photography</span></div>
            <div className={styles.dhbFoot}><span className={styles.dhbCount}>280+ vendor packages</span><span className={`${styles.dhbCta} ${styles.p}`}>Browse<i className='bx bx-chevron-right'></i></span></div>
          </Link>

          <Link className={`${styles.dealHubCard} ${styles.g}`} href="/deals/group">
            <div className={`${styles.dhbBadge} ${styles.g}`}>G</div>
            <div className={styles.dhbTitle}>Group Deals <span className={`${styles.dhbPill} ${styles.g}`}>Group buy</span></div>
            <div className={styles.dhbTagline}>One vendor &middot; unlocks with the crowd</div>
            <div className={styles.dhbDesc}>Community group-buys. When enough people join the same deal before the timer ends, everyone unlocks the lower price. Reserve with a small deposit.</div>
            <div className={styles.dhbEx}><span>📸 Photography</span><span>💄 Salon</span><span>✈️ Travel</span><span>🎧 DJ</span></div>
            <div className={styles.dhbFoot}><span className={styles.dhbCount}>Limited-time &middot; live now</span><span className={`${styles.dhbCta} ${styles.g}`}>Browse<i className='bx bx-chevron-right'></i></span></div>
          </Link>

          <Link className={`${styles.dealHubCard} ${styles.m}`} href="/deals/grand">
            <div className={`${styles.dhbBadge} ${styles.m}`}>M</div>
            <div className={styles.dhbTitle}>Mega Deals <span className={`${styles.dhbPill} ${styles.m}`}>Multi-store</span></div>
            <div className={styles.dhbTagline}>Multiple stores &middot; one bundle</div>
            <div className={styles.dhbDesc}>Tayaree-curated bundles that combine several vendors — catering, venue, decor, photography and more — into one package at a bundle price. Book once, save more.</div>
            <div className={styles.dhbEx}><span>💍 Wedding</span><span>🌸 Mehndi</span><span>🏢 Corporate</span></div>
            <div className={styles.dhbFoot}><span className={styles.dhbCount}>Silver &middot; Gold &middot; Platinum tiers</span><span className={`${styles.dhbCta} ${styles.m}`}>Browse<i className='bx bx-chevron-right'></i></span></div>
          </Link>
        </div>

        <div className={styles.cmp}>
          <div className={styles.cmpHead}>How they differ</div>
          <div className={styles.cmpHeadRow}>
            <div className={`${styles.cmpLt} ${styles.p}`}><b>P</b>Package</div>
            <div className={`${styles.cmpLt} ${styles.g}`}><b>G</b>Group</div>
            <div className={`${styles.cmpLt} ${styles.m}`}><b>M</b>Mega</div>
          </div>
          <div className={styles.cmpRow}><div className={styles.lbl}>Vendors</div><div>1 vendor</div><div>Multiple vendors, 1 bundle</div></div>
          <div className={styles.cmpRow}><div className={styles.lbl}>Price</div><div>Fixed / group-unlocked</div><div>Bundle price vs separate</div></div>
          <div className={styles.cmpRow}><div className={styles.lbl}>Best for</div><div>Quick single service &middot; a crowd-driven discount</div><div>A whole event in one booking</div></div>
        </div>
      </div>
      <Footer />
    </>
  );
}
