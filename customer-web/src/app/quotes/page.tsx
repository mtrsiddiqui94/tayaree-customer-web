'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import styles from './quotes.module.css';

interface QuoteRequest {
  id: number;
  title: string;
  category: string;
  status: 'Awaiting Bids' | 'Bids Received' | 'Negotiating' | 'Accepted';
  createdDate: string;
  bidsCount: number;
  bestBidPrice?: string;
  notes?: string;
}

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'awaiting' | 'negotiating' | 'accepted'>('all');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/quotes');
      return;
    }
    loadQuotes();
  }, []);

  const loadQuotes = () => {
    // 1. Gather dynamic custom quotes from local storage if user requested customize package
    const customQuotesRaw = localStorage.getItem('customQuotes');
    let parsed: QuoteRequest[] = [];
    if (customQuotesRaw) {
      try {
        parsed = JSON.parse(customQuotesRaw);
      } catch (e) {
        console.error(e);
      }
    }

    // 2. Fallback template templates to let user test comparing vendor bids
    const defaultTemplates: QuoteRequest[] = [
      {
        id: 1,
        title: 'Wedding Event Catering Services (150 Guests)',
        category: 'Catering',
        status: 'Bids Received',
        createdDate: '05 July 2026',
        bidsCount: 3,
        bestBidPrice: 'Rs. 185,000',
        notes: 'Requires buffet setup, dessert platters, and premium cutlery.'
      },
      {
        id: 2,
        title: 'Engagement Stages Floral Layout Decoration',
        category: 'Decor',
        status: 'Negotiating',
        createdDate: '04 July 2026',
        bidsCount: 2,
        bestBidPrice: 'Rs. 45,000',
        notes: 'White rose themes, backdrop lighting setups.'
      },
      {
        id: 3,
        title: 'Mehndi Event DSLR Stage Photography Session',
        category: 'Photography',
        status: 'Accepted',
        createdDate: '01 July 2026',
        bidsCount: 1,
        bestBidPrice: 'Rs. 32,000',
        notes: 'Includes portrait photos, HD event highlights reel.'
      }
    ];

    setQuotes([...parsed, ...defaultTemplates]);
  };

  const filteredQuotes = quotes.filter((q) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'awaiting') return q.status === 'Awaiting Bids';
    if (activeTab === 'negotiating') return q.status === 'Negotiating' || q.status === 'Bids Received';
    if (activeTab === 'accepted') return q.status === 'Accepted';
    return true;
  });

  return (
    <>
      <Header />

      <main className={styles.page}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Quotes Dashboard</span>
        </div>

        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>Custom Quotes &amp; Negotiations</h1>
          <p className={styles.pageSub}>Request tailored packages directly from premium vendors and compare bids.</p>
        </div>

        {/* Anonymity Banner */}
        <div className={styles.anonNote}>
          <i className="bx bx-shield-quarter"></i>
          <div>
            <h4 className={styles.anonNoteT}>Anonymous Bargaining Protected</h4>
            <p className={styles.anonNoteS}>
              Your personal information remains completely anonymous to vendors during the bidding and negotiation stages. It is only revealed when you accept a proposal.
            </p>
          </div>
        </div>

        {/* segmented tabs */}
        <div className={styles.qtabs}>
          <button
            onClick={() => setActiveTab('all')}
            className={`${styles.qtab} ${activeTab === 'all' ? styles.qtabActive : ''}`}
          >
            All Requests ({quotes.length})
          </button>
          <button
            onClick={() => setActiveTab('awaiting')}
            className={`${styles.qtab} ${activeTab === 'awaiting' ? styles.qtabActive : ''}`}
          >
            Awaiting Bids ({quotes.filter(q => q.status === 'Awaiting Bids').length})
          </button>
          <button
            onClick={() => setActiveTab('negotiating')}
            className={`${styles.qtab} ${activeTab === 'negotiating' ? styles.qtabActive : ''}`}
          >
            Bids Received / Negotiating ({quotes.filter(q => q.status === 'Negotiating' || q.status === 'Bids Received').length})
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`${styles.qtab} ${activeTab === 'accepted' ? styles.qtabActive : ''}`}
          >
            Accepted ({quotes.filter(q => q.status === 'Accepted').length})
          </button>
        </div>

        <div className={styles.qevent}>
          <div className={styles.qeventHead}>
            <h3 className={styles.qeventTitle}>Recent Quote Requests</h3>
            <span className={styles.qeventCount}>{filteredQuotes.length} Active</span>
          </div>

          {filteredQuotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <i className="bx bx-git-pull-request" style={{ fontSize: '48px', color: 'var(--text-muted)' }}></i>
              <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>No quote requests found matching this filter.</p>
            </div>
          ) : (
            filteredQuotes.map((q) => {
              const isAccepted = q.status === 'Accepted';
              const isAwaiting = q.status === 'Awaiting Bids';

              return (
                <div key={q.id} className={styles.qcard}>
                  <div className={styles.qcardIc}>
                    <i className={q.category === 'Catering' ? 'bx bx-dish' : q.category === 'Decor' ? 'bx bx-palette' : 'bx bx-camera'}></i>
                  </div>
                  <div className={styles.qcardMain}>
                    <h4 className={styles.qcardName}>{q.title}</h4>
                    <div className={styles.qcardMeta}>
                      <span className={`${styles.qbadge} ${
                        isAccepted ? styles.qbadgeAccepted : isAwaiting ? styles.qbadgeAwaiting : styles.qbadgeNegotiating
                      }`}>
                        {q.status}
                      </span>
                      <span>·</span>
                      <span>Created on: {q.createdDate}</span>
                      <span>·</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{q.bidsCount} Vendor proposal bids</span>
                    </div>
                  </div>

                  {q.bestBidPrice && (
                    <div className={styles.qcardBest}>
                      <span className={styles.qcardBestLbl}>Best Bid Price</span>
                      <span className={styles.qcardBestAmt}>{q.bestBidPrice}</span>
                    </div>
                  )}

                  <Link href={`/quotes/${q.id}`} className={`${styles.qcardCta} ${isAwaiting ? styles.qcardCtaGhost : ''}`} style={{ marginLeft: '16px', textDecoration: 'none' }}>
                    {isAccepted ? 'View accepted Invoice' : isAwaiting ? 'Awaiting bids...' : 'Compare Bids'}
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
