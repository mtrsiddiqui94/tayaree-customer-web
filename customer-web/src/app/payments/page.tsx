'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import styles from './page.module.css';

// Mock package options matching mockup
const PKG_OPTIONS = [
  { key: "all", name: "All Packages", img: "" },
  { key: "catering", name: "Royal Biryani Catering", img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=80&h=80&q=80" },
  { key: "photography", name: "Premium Photography", img: "https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?auto=format&fit=crop&w=80&h=80&q=80" },
  { key: "florals", name: "Floral Decoration", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=80&h=80&q=80" },
  { key: "sound", name: "Sound & Lighting", img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=80&h=80&q=80" },
  { key: "couture", name: "Bride & Groom Couture", img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=80&h=80&q=80" }
];

const UPCOMING = [
  { pkg: "catering", name: "Royal Biryani Catering", sub: "Final Balance · 70% · Installment 2 of 2", amount: 80325, due: "Due Mar 13, 2025", dueThisWeek: true },
  { pkg: "photography", name: "Premium Photography", sub: "Final Balance · 70% · Installment 2 of 2", amount: 59500, due: "Due Mar 13, 2025", dueThisWeek: true },
  { pkg: "couture", name: "Bride & Groom Couture", sub: "Final Balance · 70% · Installment 2 of 2", amount: 56000, due: "Due Mar 13, 2025", dueThisWeek: true }
];

const HISTORY = [
  { pkg: "catering", name: "Royal Biryani Catering", sub: "Booking Deposit · 30%", amount: 34425, date: "10 Mar 2025", method: "Visa •••• 6411", kind: "inst" },
  { pkg: "photography", name: "Premium Photography", sub: "Booking Deposit · 30%", amount: 25500, date: "10 Mar 2025", method: "Visa •••• 6411", kind: "inst" },
  { pkg: "couture", name: "Bride & Groom Couture", sub: "Booking Deposit · 30%", amount: 24000, date: "10 Mar 2025", method: "Visa •••• 6411", kind: "inst" },
  { pkg: "florals", name: "Floral Decoration", sub: "Full Payment · 100%", amount: 45000, date: "10 Mar 2025", method: "Visa •••• 6411", kind: "checkout" },
  { pkg: "sound", name: "Sound & Lighting", sub: "Full Payment · 100%", amount: 60000, date: "10 Mar 2025", method: "Visa •••• 6411", kind: "checkout" },
  { pkg: "order", name: "Shipping & Taxes", sub: "Order charges · at checkout", amount: 40375, date: "10 Mar 2025", method: "Visa •••• 6411", kind: "checkout" }
];

export default function AllPaymentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('All');
  
  // Package Selector states
  const [isPkgSelectOpen, setIsPkgSelectOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(PKG_OPTIONS[0]);
  const [pkgSearchQuery, setPkgSearchQuery] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setTimeout(() => router.push('/login?redirect=/payments'), 0);
      return;
    }
  }, [router]);

  const formatAmount = (num: number) => {
    return num.toLocaleString('en-PK');
  };

  const filteredPkgOptions = PKG_OPTIONS.filter(pkg => 
    pkg.name.toLowerCase().includes(pkgSearchQuery.toLowerCase())
  );

  const filteredUpcoming = UPCOMING.filter(item => {
    const matchesPkg = selectedPkg.key === 'all' || item.pkg === selectedPkg.key;
    const matchesSearch = searchQuery.trim() === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPkg && matchesSearch;
  });

  const filteredHistory = HISTORY.filter(item => {
    const matchesPkg = selectedPkg.key === 'all' || item.pkg === selectedPkg.key;
    const matchesSearch = searchQuery.trim() === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPkg && matchesSearch;
  });

  const totalUpcomingAmount = filteredUpcoming.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaidAmount = filteredHistory.reduce((acc, curr) => acc + curr.amount, 0);

  const upcomingDueThisWeek = filteredUpcoming.filter(u => u.dueThisWeek);
  const upcomingLater = filteredUpcoming.filter(u => !u.dueThisWeek);
  const weekTotal = upcomingDueThisWeek.reduce((s, u) => s + u.amount, 0);
  const laterTotal = upcomingLater.reduce((s, u) => s + u.amount, 0);

  const instCount = filteredHistory.filter(h => h.kind === 'inst').length;
  const checkoutCount = filteredHistory.filter(h => h.kind === 'checkout').length;

  const groupedHistory = filteredHistory.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, typeof HISTORY>);

  const RefundCard = () => (
    <div className={`${styles.payHero} ${styles.refund}`} style={{ marginBottom: 0, height: '100%' }}>
      <div className={styles.payHeroTop}>
        <div>
          <div className={styles.payHeroLbl}>Total Refunds</div>
          <div className={styles.payHeroAmt}>PKR 63,450</div>
          <div className={styles.payHeroMethod}><i className="bx bx-credit-card"></i>To Visa •••• 6411 · 3–5 business days</div>
        </div>
        <span className={styles.payHeroBadge}>2 refunds</span>
      </div>
      <div className={styles.payHeroStats}>
        <div className={styles.payHeroStat}>
          <div className={styles.payHeroStatLbl}><i className="bx bx-check-circle"></i>Credited</div>
          <div className={styles.payHeroStatVal}>PKR 40,500</div>
        </div>
        <div className={styles.payHeroStat}>
          <div className={styles.payHeroStatLbl}><i className="bx bx-time-five"></i>Processing</div>
          <div className={styles.payHeroStatVal}>PKR 22,950</div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout breadcrumbTitle="All Payments">
      <div className={styles.dashContent}>

        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>All Payments</h1>
          <p className={styles.pageSub}>Every payment across your orders — upcoming installments and full history.</p>
        </div>

        <div className={styles.payTabs}>
          <button
            className={`${styles.payTab} ${activeTab === 'upcoming' ? styles.active : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming <span className={styles.payTabCount}>{filteredUpcoming.length}</span>
          </button>
          <button
            className={`${styles.payTab} ${activeTab === 'history' ? styles.active : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History <span className={styles.payTabCount}>{filteredHistory.length}</span>
          </button>
        </div>

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

        {activeTab === 'upcoming' && (
          <div>
            {filteredUpcoming.length > 0 && (
              <div className={styles.payHeroRow}>
                <div className={`${styles.payHero} ${styles.upcoming}`} style={{ marginBottom: 0, height: '100%' }}>
                  <div className={styles.payHeroTop}>
                    <div>
                      <div className={styles.payHeroLbl}>Total Upcoming</div>
                      <div className={styles.payHeroAmt}>PKR {formatAmount(totalUpcomingAmount)}</div>
                      <div className={styles.payHeroMethod}><i className="bx bx-time-five"></i>Next payment due in 3 days</div>
                    </div>
                    <span className={styles.payHeroBadge}>{filteredUpcoming.length} due</span>
                  </div>
                  <div className={styles.payHeroStats}>
                    <div className={styles.payHeroStat}>
                      <div className={styles.payHeroStatLbl}>Due This Week</div>
                      <div className={styles.payHeroStatVal}>PKR {formatAmount(weekTotal)}</div>
                    </div>
                    <div className={styles.payHeroStat}>
                      <div className={styles.payHeroStatLbl}>Later</div>
                      <div className={styles.payHeroStatVal}>PKR {formatAmount(laterTotal)}</div>
                    </div>
                  </div>
                </div>
                <RefundCard />
              </div>
            )}
            
            <div className={styles.payCard}>
              {filteredUpcoming.length === 0 ? (
                <div className={styles.payEmpty}>
                  <i className="bx bx-calendar-check"></i>
                  <div className={styles.payEmptyT}>No upcoming payments</div>
                  <div className={styles.payEmptyS}>You're all caught up for this selection.</div>
                </div>
              ) : (
                <>
                  {upcomingDueThisWeek.length > 0 && (
                    <>
                      <div className={`${styles.payGrp} ${styles.red}`}><i className="bx bx-time-five"></i>Due This Week</div>
                      {upcomingDueThisWeek.map((u, i) => (
                        <div key={`thisweek-${i}`} className={styles.payRow}>
                          <div className={`${styles.payRowIc} ${styles.due}`}><i className="bx bx-calendar"></i></div>
                          <div className={styles.payRowInfo}>
                            <div className={styles.payRowName}>{u.name}</div>
                            <div className={styles.payRowSub}>{u.sub}</div>
                            <div className={styles.payRowChips}>
                              <span className={`${styles.payRowChip} ${styles.amber}`}><i className="bx bx-time-five"></i>{u.due}</span>
                            </div>
                          </div>
                          <div className={styles.payRowRight}>
                            <div className={`${styles.payRowAmt} ${styles.amber}`}>PKR {formatAmount(u.amount)}</div>
                            <div className={styles.payRowDue}>auto-charged</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  
                  {upcomingLater.length > 0 && (
                    <>
                      <div className={`${styles.payGrp} ${styles.grey}`}><i className="bx bx-calendar"></i>Upcoming</div>
                      {upcomingLater.map((u, i) => (
                        <div key={`later-${i}`} className={styles.payRow}>
                          <div className={`${styles.payRowIc} ${styles.due}`}><i className="bx bx-calendar"></i></div>
                          <div className={styles.payRowInfo}>
                            <div className={styles.payRowName}>{u.name}</div>
                            <div className={styles.payRowSub}>{u.sub}</div>
                            <div className={styles.payRowChips}>
                              <span className={`${styles.payRowChip} ${styles.amber}`}><i className="bx bx-time-five"></i>{u.due}</span>
                            </div>
                          </div>
                          <div className={styles.payRowRight}>
                            <div className={`${styles.payRowAmt} ${styles.amber}`}>PKR {formatAmount(u.amount)}</div>
                            <div className={styles.payRowDue}>auto-charged</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {filteredHistory.length > 0 && (
              <div className={styles.payHeroRow}>
                <div className={`${styles.payHero} ${styles.paid}`} style={{ marginBottom: 0, height: '100%' }}>
                  <div className={styles.payHeroTop}>
                    <div>
                      <div className={styles.payHeroLbl}>Total Paid</div>
                      <div className={styles.payHeroAmt}>PKR {formatAmount(totalPaidAmount)}</div>
                      <div className={styles.payHeroMethod}><i className="bx bx-credit-card"></i>Visa •••• 6411</div>
                    </div>
                    <span className={styles.payHeroBadge}>{filteredHistory.length} paid</span>
                  </div>
                  <div className={styles.payHeroStats}>
                    <div className={styles.payHeroStat}>
                      <div className={styles.payHeroStatLbl}>Installments</div>
                      <div className={styles.payHeroStatVal}>{instCount}</div>
                    </div>
                    <div className={styles.payHeroStat}>
                      <div className={styles.payHeroStatLbl}>At Checkout</div>
                      <div className={styles.payHeroStatVal}>{checkoutCount}</div>
                    </div>
                  </div>
                </div>
                <RefundCard />
              </div>
            )}
            
            <div className={styles.payCard}>
              {filteredHistory.length === 0 ? (
                <div className={styles.payEmpty}>
                  <i className="bx bx-receipt"></i>
                  <div className={styles.payEmptyT}>No payments yet</div>
                  <div className={styles.payEmptyS}>Past payments for this selection will appear here.</div>
                </div>
              ) : (
                Object.keys(groupedHistory).map(date => (
                  <React.Fragment key={date}>
                    <div className={styles.payDateHead}><i className="bx bx-calendar"></i>{date}</div>
                    {groupedHistory[date].map((h, i) => (
                      <div key={`hist-${date}-${i}`} className={styles.payRow}>
                        <div className={`${styles.payRowIc} ${styles.paid}`}><i className="bx bx-check"></i></div>
                        <div className={styles.payRowInfo}>
                          <div className={styles.payRowName}>{h.name}</div>
                          <div className={styles.payRowSub}>{h.sub}</div>
                          <div className={styles.payRowChips}>
                            <span className={`${styles.payRowChip} ${styles.green}`}><i className="bx bx-check-circle"></i>Paid</span>
                            <span className={styles.payRowMethod}>{h.method}</span>
                          </div>
                        </div>
                        <div className={styles.payRowRight}>
                          <div className={`${styles.payRowAmt} ${styles.green}`}>PKR {formatAmount(h.amount)}</div>
                        </div>
                      </div>
                    ))}
                  </React.Fragment>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
