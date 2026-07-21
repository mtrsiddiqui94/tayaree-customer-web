'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import styles from './page.module.css';

// Mock package options matching mockup
const PKG_OPTIONS = [
  { key: "all", name: "All Packages", img: "" },
  { key: "sound", name: "Sound & Lighting", img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=80&h=80&q=80" },
  { key: "catering", name: "Royal Biryani Catering", img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=80&h=80&q=80" },
  { key: "florals", name: "Floral Decoration", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=80&h=80&q=80" }
];

// Mock upcoming payments
const MOCK_UPCOMING = [
  {
    key: "sound",
    name: "Sound & Lighting Setup — Final Installment",
    sub: "Booking #TY-48938 · SoundWave Productions",
    amount: 140000,
    dueDate: "Due in 2 days (Mar 14, 2025)",
    status: "due"
  },
  {
    key: "catering",
    name: "Royal Biryani Catering — Second Installment",
    sub: "Booking #TY-84920 · Amber's Kitchen",
    amount: 90000,
    dueDate: "Due in 3 days (Mar 15, 2025)",
    status: "due"
  },
  {
    key: "florals",
    name: "Floral Decoration — Final Installment",
    sub: "Booking #TY-19405 · Rose Garden Events",
    amount: 45000,
    dueDate: "Due in 3 days (Mar 15, 2025)",
    status: "due"
  }
];

// Mock historical paid payments
const MOCK_HISTORY = [
  {
    key: "sound",
    name: "Sound & Lighting Setup — Downpayment",
    sub: "Booking #TY-48938 · SoundWave Productions",
    amount: 60000,
    date: "Mar 08, 2025",
    method: "Visa *4242"
  },
  {
    key: "catering",
    name: "Royal Biryani Catering — Downpayment",
    sub: "Booking #TY-84920 · Amber's Kitchen",
    amount: 45000,
    date: "Mar 05, 2025",
    method: "Mastercard *9876"
  },
  {
    key: "florals",
    name: "Floral Decoration — Downpayment",
    sub: "Booking #TY-19405 · Rose Garden Events",
    amount: 20000,
    date: "Feb 28, 2025",
    method: "HBL Bank Direct"
  }
];

export default function PaymentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('All');
  
  // Package Selector states
  const [isPkgSelectOpen, setIsPkgSelectOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(PKG_OPTIONS[0]);
  const [pkgSearchQuery, setPkgSearchQuery] = useState('');

  const [upcomingPayments, setUpcomingPayments] = useState(MOCK_UPCOMING);
  const [paidPayments, setPaidPayments] = useState(MOCK_HISTORY);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/profile/payments');
      return;
    }

    async function loadPayments() {
      try {
        setIsLoading(true);
        // Attempt dynamically fetching payments list
        const res = await api.get<{ status: boolean; data?: unknown }>('/api/v1/payment/list');
        if (res.status && res.data) {
          // If api data is successfully returned, populate lists
          // Fallback is handled by catching and keeping mock values
        }
      } catch (e) {
        console.log('Using mockup payments fallback.');
      } finally {
        setIsLoading(false);
      }
    }
    loadPayments();
  }, [router]);


  const formatAmount = (num: number) => {
    return num.toLocaleString('en-PK');
  };

  const filteredPkgOptions = PKG_OPTIONS.filter(pkg => 
    pkg.name.toLowerCase().includes(pkgSearchQuery.toLowerCase())
  );

  // Filter lists based on searches
  const filteredUpcoming = upcomingPayments.filter(item => {
    const matchesPkg = selectedPkg.key === 'all' || item.key === selectedPkg.key;
    const matchesSearch = searchQuery.trim() === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sub.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPkg && matchesSearch;
  });

  const filteredHistory = paidPayments.filter(item => {
    const matchesPkg = selectedPkg.key === 'all' || item.key === selectedPkg.key;
    const matchesSearch = searchQuery.trim() === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sub.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPkg && matchesSearch;
  });

  // Calculate totals
  const totalUpcomingAmount = filteredUpcoming.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaidAmount = filteredHistory.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <DashboardLayout breadcrumbTitle="Payment Methods">
      <>
      <div>
        <div className={styles.pageHead}>
          <h2 className={styles.pageTitle}>Payments &amp; Billings</h2>
          <p className={styles.pageSub}>Manage credit card details, payment schedules, and installment breakdowns.</p>
        </div>

        {/* Hero Cards Section */}
        {activeTab === 'upcoming' ? (
          <div className={`${styles.payHero} ${styles.upcoming}`}>
            <div className={styles.payHeroTop}>
              <div>
                <span className={styles.payHeroLbl}>Total Outstanding Due</span>
                <h3 className={styles.payHeroAmt}>PKR {formatAmount(totalUpcomingAmount)}</h3>
              </div>
              <span className={styles.payHeroBadge}>
                <i className="bx bx-calendar"></i> Next Due in 2 Days
              </span>
            </div>
            <div className={styles.payHeroStats}>
              <div className={styles.payHeroStat}>
                <span className={styles.payHeroStatLbl}>
                  <i className="bx bx-receipt"></i> Scheduled Installments
                </span>
                <div className={styles.payHeroStatVal}>{filteredUpcoming.length} Items</div>
              </div>
              <div className={styles.payHeroStat}>
                <span className={styles.payHeroStatLbl}>
                  <i className="bx bx-info-circle"></i> Autopay Status
                </span>
                <div className={styles.payHeroStatVal}>Disabled</div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`${styles.payHero} ${styles.paid}`}>
            <div className={styles.payHeroTop}>
              <div>
                <span className={styles.payHeroLbl}>Total Paid Amount</span>
                <h3 className={styles.payHeroAmt}>PKR {formatAmount(totalPaidAmount)}</h3>
              </div>
              <span className={styles.payHeroBadge} style={{ background: 'rgba(255,255,255,0.22)' }}>
                <i className="bx bx-check-shield"></i> Fully Settled
              </span>
            </div>
            <div className={styles.payHeroStats}>
              <div className={styles.payHeroStat}>
                <span className={styles.payHeroStatLbl}>
                  <i className="bx bx-check-circle"></i> Completed Payments
                </span>
                <div className={styles.payHeroStatVal}>{filteredHistory.length} Items</div>
              </div>
              <div className={styles.payHeroStat}>
                <span className={styles.payHeroStatLbl}>
                  <i className="bx bx-wallet"></i> Default Payment
                </span>
                <div className={styles.payHeroStatVal}>Visa *4242</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className={styles.payTabs}>
          <button
            className={`${styles.payTab} ${activeTab === 'upcoming' ? styles.active : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Installments <span className={styles.payTabCount}>{upcomingPayments.length}</span>
          </button>
          <button
            className={`${styles.payTab} ${activeTab === 'history' ? styles.active : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Payment History <span className={styles.payTabCount}>{paidPayments.length}</span>
          </button>
        </div>

        {/* Filters */}
        <div className={styles.filterbar}>
          <div className={styles.filterSearch}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Search by package or vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            className={`${styles.periodChip} ${selectedPeriod === 'All' ? styles.active : ''}`}
            onClick={() => setSelectedPeriod('All')}
          >
            All
          </button>
          <button
            className={`${styles.periodChip} ${selectedPeriod === '3 Months' ? styles.active : ''}`}
            onClick={() => setSelectedPeriod('3 Months')}
          >
            3 Months
          </button>
          <button
            className={`${styles.periodChip} ${selectedPeriod === '6 Months' ? styles.active : ''}`}
            onClick={() => setSelectedPeriod('6 Months')}
          >
            6 Months
          </button>
          <button
            className={`${styles.periodChip} ${selectedPeriod === '12 Months' ? styles.active : ''}`}
            onClick={() => setSelectedPeriod('12 Months')}
          >
            12 Months
          </button>
        </div>

        {/* Package Selector */}
        <div className={`${styles.pkgSelect} ${isPkgSelectOpen ? styles.open : ''}`}>
          <div
            className={styles.pkgSelectTrigger}
            onClick={() => setIsPkgSelectOpen(!isPkgSelectOpen)}
          >
            <div className={styles.pkgSelectCurrent}>
              {selectedPkg.img ? (
                <img src={selectedPkg.img} alt={selectedPkg.name} />
              ) : (
                <i className="bx bx-package"></i>
              )}
              <span>{selectedPkg.name}</span>
            </div>
            <i className={`bx bx-chevron-down ${styles.pkgSelectChev}`}></i>
          </div>

          {isPkgSelectOpen && (
            <div className={styles.pkgSelectMenu}>
              <div className={styles.pkgSearch}>
                <i className="bx bx-search"></i>
                <input
                  type="text"
                  placeholder="Filter packages..."
                  value={pkgSearchQuery}
                  onChange={(e) => setPkgSearchQuery(e.target.value)}
                />
              </div>
              <div className={styles.pkgOptions}>
                {filteredPkgOptions.length > 0 ? (
                  filteredPkgOptions.map((pkg) => (
                    <button
                      key={pkg.key}
                      className={`${styles.pkgOption} ${selectedPkg.key === pkg.key ? styles.active : ''}`}
                      onClick={() => {
                        setSelectedPkg(pkg);
                        setIsPkgSelectOpen(false);
                        setPkgSearchQuery('');
                      }}
                    >
                      {pkg.img ? (
                        <img src={pkg.img} alt={pkg.name} style={{ borderRadius: '4px' }} />
                      ) : (
                        <i className={`bx bx-package ${styles.lead}`}></i>
                      )}
                      <span>{pkg.name}</span>
                      <i className={`bx bx-check ${styles.chk}`}></i>
                    </button>
                  ))
                ) : (
                  <div className={styles.pkgNoopt}>No packages found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Payments List panel content */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '30px', color: 'var(--primary)' }}></i>
          </div>
        ) : (
          <div className={styles.payCard}>
            {activeTab === 'upcoming' ? (
              filteredUpcoming.length > 0 ? (
                filteredUpcoming.map((item, idx) => (
                  <div key={idx} className={styles.payRow}>
                    <div className={`${styles.payRowIc} ${styles.due}`}>
                      <i className="bx bx-calendar-exclamation"></i>
                    </div>
                    <div className={styles.payRowInfo}>
                      <div className={styles.payRowName}>{item.name}</div>
                      <div className={styles.payRowSub}>{item.sub}</div>
                      <div className={styles.payRowChips}>
                        <span className={`${styles.payRowChip} ${styles.amber}`}>
                          <i className="bx bx-time-five"></i> Pending
                        </span>
                        <span className={styles.payRowDue}>{item.dueDate}</span>
                      </div>
                    </div>
                    <div className={styles.payRowRight}>
                      <div className={`${styles.payRowAmt} ${styles.amber}`}>
                        PKR {formatAmount(item.amount)}
                      </div>
                      <button
                        onClick={() => alert(`Redirecting to checkout for ${item.name}`)}
                        className={styles.payRowDue}
                        style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '12px', cursor: 'pointer', marginTop: '6px', fontWeight: 700 }}
                      >
                        Pay Now
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.payEmpty}>
                  <i className="bx bx-credit-card-front"></i>
                  <div className={styles.payEmptyT}>No upcoming payments found</div>
                  <div className={styles.payEmptyS}>All your upcoming schedules are fully clear.</div>
                </div>
              )
            ) : (
              filteredHistory.length > 0 ? (
                filteredHistory.map((item, idx) => (
                  <div key={idx} className={styles.payRow}>
                    <div className={`${styles.payRowIc} ${styles.paid}`}>
                      <i className="bx bx-check"></i>
                    </div>
                    <div className={styles.payRowInfo}>
                      <div className={styles.payRowName}>{item.name}</div>
                      <div className={styles.payRowSub}>{item.sub}</div>
                      <div className={styles.payRowChips}>
                        <span className={`${styles.payRowChip} ${styles.green}`}>
                          <i className="bx bx-check-circle"></i> Paid
                        </span>
                        <span className={styles.payRowMethod}>via {item.method}</span>
                      </div>
                    </div>
                    <div className={styles.payRowRight}>
                      <div className={`${styles.payRowAmt} ${styles.green}`}>
                        PKR {formatAmount(item.amount)}
                      </div>
                      <div className={styles.payRowSub} style={{ marginTop: '4px', fontWeight: 600 }}>
                        {item.date}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.payEmpty}>
                  <i className="bx bx-history"></i>
                  <div className={styles.payEmptyT}>No historical payments found</div>
                  <div className={styles.payEmptyS}>You haven&apos;t completed any invoice bookings yet.</div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </>
  </DashboardLayout>
  );
}
