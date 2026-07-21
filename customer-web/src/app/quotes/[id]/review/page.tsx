'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import styles from '../../quotes.module.css';

export default function QuoteReviewPage() {
  const params = useParams();
  const quoteId = params.id;

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <Link href="/quotes">Quotes</Link>
          <span className={styles.sep}>/</span>
          <Link href={`/quotes/${quoteId}`}>Package Details</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Review Quote</span>
        </div>

        <div className={styles.dashLayout}>
          <aside className={styles.dashSidebar}>
            <div className={styles.sidebarCard}>
              <nav className={styles.sidebarNav}>
                <div className={styles.sidebarNavLabel}>Activities</div>
                <Link href="/orders" className={styles.sidebarNavItem}><i className='bx bx-receipt'></i>Orders</Link>
                <Link href="/quotes" className={`${styles.sidebarNavItem} ${styles.active}`}><i className='bx bx-file-blank'></i>Quotes</Link>
                <Link href="/events" className={styles.sidebarNavItem}><i className='bx bx-calendar'></i>Events</Link>
                <Link href="/wishlist" className={styles.sidebarNavItem}><i className='bx bx-heart'></i>Wish List</Link>
              </nav>
            </div>
          </aside>

          <div className={styles.dashContent}>
            <Link href={`/quotes/${quoteId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '16px' }}>
              <i className='bx bx-chevron-left'></i>Back to Details
            </Link>
            
            <div className={styles.pageHead}>
              <h1 className={styles.pageTitle}>Review Quote</h1>
              <p className={styles.pageSub}>Review the proposed packages and pricing before accepting.</p>
            </div>

            <div className={styles.qbCard}>
              <div className={styles.qbLabelRow}>
                <div className={styles.qbAv}>
                  <i className="bx bx-store"></i>
                </div>
                <div className={styles.qbLabel}>Vendor Proposal</div>
              </div>
              
              <div className={styles.qbPrice}>
                <div className={styles.qbPriceMain}>
                  <span className={styles.qbPriceLbl}>New Quote Price</span>
                  <span className={styles.qbPriceAmt}>PKR 2,10,000</span>
                </div>
              </div>

              <div className={styles.qbDetails} style={{ display: 'block', marginTop: '16px' }}>
                <div className={styles.qdSummary}>
                  <span className={styles.qdSum}>7 items total</span>
                  <span className={styles.qdSum}>200 guests</span>
                </div>
                
                <div className={styles.qdItems}>
                  <div className={styles.qdItem}>
                    <div className={styles.qdItemImg} style={{ background: '#eee' }}></div>
                    <div className={styles.qdItemMain}>
                      <div className={styles.qdItemName}>Chicken Biryani</div>
                      <div className={styles.qdItemTag}>Main Course</div>
                    </div>
                  </div>
                  <div className={styles.qdItem}>
                    <div className={styles.qdItemImg} style={{ background: '#eee' }}></div>
                    <div className={styles.qdItemMain}>
                      <div className={styles.qdItemName}>Seekh Kabab</div>
                      <div className={styles.qdItemTag}>Starter</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.qbFoot}>
                <Link href={`/quotes/${quoteId}/revision`} className={styles.qbtn}>
                  Request Revision
                </Link>
                <Link href={`/quotes/${quoteId}/accept`} className={`${styles.qbtn} ${styles.qbtnPrimary}`} style={{ marginLeft: 'auto' }}>
                  <i className="bx bx-check"></i> Accept Quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
