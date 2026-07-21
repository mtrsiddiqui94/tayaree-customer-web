'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import styles from './page.module.css';

function fmt(n: number) {
  return (n || 0).toLocaleString("en-IN");
}

export default function GrandDealDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState(0);
  const [ack, setAck] = useState(false);

  const DEAL = {
    name: "The Royal Wedding Bundle",
    id: "royal-wedding-bundle",
    vendor: "Tayaree Curated",
    rating: 4.9,
    reviews: 12,
    images: [
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&h=600&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&h=600&q=80",
      "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=900&h=600&q=80"
    ],
    desc: "A fully curated 3-day wedding experience featuring top-tier vendors. Includes a premium photography team, complete decor for three events, bridal makeup for three days, and a renowned DJ.",
    packages: [
      { name: "Mehndi Decor & Sound", icon: "🌸", orig: 350000, price: 290000, items: 12 },
      { name: "Barat Venue & Catering", icon: "🍲", orig: 1200000, price: 950000, items: 8 },
      { name: "Walima Photography", icon: "📸", orig: 150000, price: 110000, items: 5 }
    ]
  };

  const totals = DEAL.packages.reduce((acc, p) => {
    acc.orig += p.orig;
    acc.price += p.price;
    return acc;
  }, { orig: 0, price: 0 });

  const save = totals.orig - totals.price;

  return (
    <>
      <Header />
      <div className={styles.page}>
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link><span className={styles.sep}>/</span>
          <Link href="/deals/grand">Mega Deals</Link><span className={styles.sep}>/</span>
          <span className={styles.current}>{DEAL.name}</span>
        </nav>

        <div className={styles.gallery}>
          <div className={styles.gHero}>
            <span className={styles.gHeroBadge}><i className='bx bx-purchase-tag-alt'></i> MEGA DEAL</span>
            <img src={DEAL.images[0]} alt="Hero" />
          </div>
          <div><img src={DEAL.images[1]} alt="Gallery 1" /></div>
          <div><img src={DEAL.images[2]} alt="Gallery 2" /></div>
        </div>

        <div className={styles.detailGrid}>
          <div>
            <div className={styles.svcHeaderRow}>
              <div className={styles.svcHeaderMain}>
                <div className={styles.svcEyebrow}>
                  <span className={styles.mSquare}>M</span> TAYAREE MEGA BUNDLE
                </div>
                <h1 className={styles.svcTitle}>{DEAL.name}</h1>
                <div className={styles.svcMeta}>
                  <span className={styles.svcVendor}><i className='bx bx-check-shield' style={{ color: 'var(--success)' }}></i>{DEAL.vendor}</span>
                  <span className={styles.dot}>•</span>
                  <span className={styles.metaChip2}><span className={styles.star}>★</span>{DEAL.rating} ({DEAL.reviews} reviews)</span>
                </div>
              </div>
            </div>

            <div className={styles.svcDesc}>
              <div className={styles.svcDescHeading}>Bundle Description</div>
              <div className={styles.descBody}>{DEAL.desc}</div>
              <div className={styles.descTags}>
                <span className={styles.descTag}>3 Events</span>
                <span className={styles.descTag}>4 Vendors</span>
                <span className={styles.descTag}>Save PKR {fmt(save)}</span>
              </div>
            </div>

            <div className={styles.mtabs}>
              {DEAL.packages.map((pkg, i) => (
                <button
                  key={i}
                  className={`${styles.mtab} ${activeTab === i ? styles.mtabActive : ''}`}
                  onClick={() => setActiveTab(i)}
                >
                  <span className={styles.mtabIc}>{pkg.icon}</span>
                  <span className={styles.mtabName}>{pkg.name}</span>
                </button>
              ))}
            </div>
            <div className={styles.tabBody}>
              <h3 style={{ marginBottom: 12 }}>{DEAL.packages[activeTab].name}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                This package includes {DEAL.packages[activeTab].items} premium items curated for your event.
                (Full item customization list will render here based on the selected package).
              </p>
            </div>
          </div>

          <aside>
            <div className={styles.msum}>
              <div className={styles.msumTop}>
                <div className={styles.msumTopL}>
                  <span className={styles.msumMchip}>M</span> MEGA BUNDLE SUMMARY
                </div>
                <div className={styles.msumCount}>{DEAL.packages.length} Packages</div>
              </div>
              <div className={styles.msumBody}>
                <div className={styles.msumLbl}>Included Packages</div>
                {DEAL.packages.map((pkg, i) => (
                  <div
                    key={i}
                    className={`${styles.msumRow} ${activeTab === i ? styles.msumRowActive : ''}`}
                    onClick={() => setActiveTab(i)}
                  >
                    <div className={styles.msumRowHead}>
                      <div className={styles.msumRowIc}>{pkg.icon}</div>
                      <div className={styles.msumRowMain}>
                        <div className={styles.msumRowName}>{pkg.name}</div>
                        <div className={styles.msumRowMeta}>{pkg.items} items</div>
                      </div>
                      <div className={styles.msumRowAmt}>PKR {fmt(pkg.price)}</div>
                    </div>
                  </div>
                ))}

                <div className={styles.msumTot}>
                  <div className={styles.pbRow}>
                    <span className={styles.pbLbl}>Bundle Value</span>
                    <span className={styles.pbVal}>PKR {fmt(totals.orig)}</span>
                  </div>
                  <div className={styles.pbRow}>
                    <span className={styles.pbLbl}>Mega Discount</span>
                    <span className={`${styles.pbVal} ${styles.pbValGreen}`}>- PKR {fmt(save)}</span>
                  </div>
                  <div className={styles.msumGrand}>
                    <span className={styles.msumGrandL}>Mega Price</span>
                    <span className={styles.msumGrandV}>PKR {fmt(totals.price)}</span>
                  </div>
                </div>

                <div className={styles.msumSave}>
                  <i className='bx bx-purchase-tag'></i> You save PKR {fmt(save)}
                </div>

                <label className={styles.msumAck}>
                  <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
                  <span>I agree to the <b>Mega Deal Terms</b> and acknowledge the bundled cancellation policy.</span>
                </label>

                <button className={`${styles.msumAdd} ${!ack ? styles.msumAddDisabled : ''}`}>
                  <i className='bx bx-cart-add'></i> Add Bundle to Cart
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
