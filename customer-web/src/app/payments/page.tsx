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

const DEFAULT_MOCK_UPCOMING = [
  { package_name: "Royal Biryani Catering", description: "Final Balance · 70% · Installment 2 of 2", payment_amount: 80325, due_date: "Mar 13, 2025", days_until_due: 3, is_overdue: false, card_last_four: "6411", installment_number: 2, installment_total: 2, percentage: 70 },
  { package_name: "Premium Photography", description: "Final Balance · 70% · Installment 2 of 2", payment_amount: 59500, due_date: "Mar 13, 2025", days_until_due: 3, is_overdue: false, card_last_four: "6411", installment_number: 2, installment_total: 2, percentage: 70 },
  { package_name: "Bride & Groom Couture", description: "Final Balance · 70% · Installment 2 of 2", payment_amount: 56000, due_date: "Mar 13, 2025", days_until_due: 3, is_overdue: false, card_last_four: "6411", installment_number: 2, installment_total: 2, percentage: 70 }
];

const DEFAULT_MOCK_HISTORY = [
  { package_name: "Royal Biryani Catering", description: "Booking Deposit · 30%", payment_amount: 34425, payment_date: "10 Mar 2025", card_last_four: "6411", card_type: "Visa", payment_timing: "scheduled", type: "installment", chips: ["Installment"] },
  { package_name: "Premium Photography", description: "Booking Deposit · 30%", payment_amount: 25500, payment_date: "10 Mar 2025", card_last_four: "6411", card_type: "Visa", payment_timing: "scheduled", type: "installment", chips: ["Installment"] },
  { package_name: "Bride & Groom Couture", description: "Booking Deposit · 30%", payment_amount: 24000, payment_date: "10 Mar 2025", card_last_four: "6411", card_type: "Visa", payment_timing: "scheduled", type: "installment", chips: ["Installment"] },
  { package_name: "Floral Decoration", description: "Full Payment · 100%", payment_amount: 45000, payment_date: "10 Mar 2025", card_last_four: "6411", card_type: "Visa", payment_timing: "at_order", type: "order_payment", chips: ["At Checkout", "Full Paid"] },
  { package_name: "Sound & Lighting", description: "Full Payment · 100%", payment_amount: 60000, payment_date: "10 Mar 2025", card_last_four: "6411", card_type: "Visa", payment_timing: "at_order", type: "order_payment", chips: ["At Checkout", "Full Paid"] },
  { package_name: "Shipping & Taxes", description: "Order charges · at checkout", payment_amount: 40375, payment_date: "10 Mar 2025", card_last_four: "6411", card_type: "Visa", payment_timing: "at_order", type: "order_payment", chips: ["At Checkout"] }
];

const DEFAULT_MOCK_REFUND = {
  refund_count: 2,
  total_amount: 63450,
  card_label: "Visa •••• 6411",
  credited_amount: 40500,
  initiated_amount: 22950
};

import { api } from '@/lib/api';

export default function AllPaymentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('3 Months');

  const historyHeroTitle = (period: string) => {
    switch (period) {
      case '3 Months': return 'Paid in Last 3 Months';
      case '6 Months': return 'Paid in Last 6 Months';
      case '12 Months': return 'Paid in Last 12 Months';
      default: return 'Paid (All)';
    }
  };

  const getOtherPeriodHint = (period: string) => {
    if (period === '3 Months') return '6 Months';
    if (period === '6 Months') return '12 Months';
    return 'All';
  };
  
  // Package Selector states
  const [isPkgSelectOpen, setIsPkgSelectOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(PKG_OPTIONS[0]);
  const [pkgSearchQuery, setPkgSearchQuery] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  // Dynamic API states
  const [upcomingItems, setUpcomingItems] = useState<any[]>([]);
  const [upcomingSummary, setUpcomingSummary] = useState<any>(null);
  
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historySummary, setHistorySummary] = useState<any>(null);
  const [refundHero, setRefundHero] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setTimeout(() => router.push('/login?redirect=/payments'), 0);
      return;
    }

    async function fetchPayments() {
      setIsLoading(true);
      try {
        const pad = (n: number) => String(n).padStart(2, '0');
        const fmtDate = (d: Date) => `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
        const getRangeStr = (days: number) => {
          const now = new Date();
          const start = new Date();
          start.setDate(now.getDate() - days);
          return `${fmtDate(start)} - ${fmtDate(now)}`;
        };

        let listUrl = '/api/v1/profile/payment/list?page=1&limit=50';
        if (selectedPeriod === '3 Months') {
          listUrl += `&date_range=${encodeURIComponent(getRangeStr(90))}`;
        } else if (selectedPeriod === '6 Months') {
          listUrl += `&date_range=${encodeURIComponent(getRangeStr(180))}`;
        } else if (selectedPeriod === '12 Months') {
          listUrl += `&date_range=${encodeURIComponent(getRangeStr(365))}`;
        }

        const [upcomingRes, historyRes] = await Promise.all([
          api.safeCall(() => api.get<any>('/api/v1/profile/payment/upcoming?page=1&limit=50')),
          api.safeCall(() => api.get<any>(listUrl))
        ]);

        if (upcomingRes.success && upcomingRes.data) {
          const raw = upcomingRes.data;
          const payload = raw.data || raw;
          const items = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
          const summary = payload?.summary || raw?.summary || null;

          setUpcomingItems(items);
          setUpcomingSummary(summary);
        } else {
          setUpcomingItems([]);
          setUpcomingSummary(null);
        }

        if (historyRes.success && historyRes.data) {
          const raw = historyRes.data;
          const payload = raw.data || raw;
          const items = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
          const refundData = payload?.refund_hero || raw?.refund_hero || null;

          setHistoryItems(items);
          setRefundHero(refundData);
        } else {
          setHistoryItems([]);
          setRefundHero(null);
        }
      } catch (err) {
        console.error('Error fetching payments:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPayments();
  }, [router, selectedPeriod]);

  const formatAmount = (num: number) => {
    return num.toLocaleString('en-PK');
  };

  const filteredPkgOptions = PKG_OPTIONS.filter(pkg => 
    pkg.name.toLowerCase().includes(pkgSearchQuery.toLowerCase())
  );

  const filteredUpcoming = upcomingItems.filter(item => {
    const pkgName = (item.package_name || '').toLowerCase();
    const searchLow = searchQuery.toLowerCase();
    
    // In real app, we'd match on item.package_id if package selector was dynamic.
    const matchesSearch = searchQuery.trim() === '' || pkgName.includes(searchLow) || (item.description || '').toLowerCase().includes(searchLow);
    return matchesSearch;
  });

  const filteredHistory = historyItems.filter(item => {
    const pkgName = (item.package_name || '').toLowerCase();
    const searchLow = searchQuery.toLowerCase();
    const matchesSearch = searchQuery.trim() === '' || pkgName.includes(searchLow) || (item.description || '').toLowerCase().includes(searchLow);
    return matchesSearch;
  });

  const getItemAmount = (item: any): number => {
    if (!item) return 0;
    const val = item.payment_amount ?? item.amount ?? item.total_amount ?? item.payment_total ?? 0;
    if (typeof val === 'number') return val;
    const parsed = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  const totalUpcomingAmount = upcomingSummary?.due_this_week_total !== undefined 
    ? (upcomingSummary.due_this_week_total + (upcomingSummary.later_total || 0))
    : filteredUpcoming.reduce((acc, curr) => acc + getItemAmount(curr), 0);
    
  // Flutter HistorySummary.fromItems calculation 1:1
  let atCheckoutPaidTotal = 0;
  let installmentsPaidTotal = 0;

  filteredHistory.forEach(h => {
    if (h.is_refund === true) return;
    const amt = getItemAmount(h);
    const timing = (h.payment_timing || '').toString();
    const type = (h.type || h.payment_type || '').toString();
    const hasInstChip = Array.isArray(h.chips) && h.chips.some((c: string) => String(c).toLowerCase().includes('installment'));
    
    // Flutter rule: paymentTiming == 'at_order' lands in At Checkout, everything else in Installments
    if (timing === 'at_order' || type === 'order_payment' || type === 'at_checkout') {
      atCheckoutPaidTotal += amt;
    } else if (timing === 'scheduled' || timing === 'installment' || (h.installment_number && h.installment_number > 0) || type === 'installment' || hasInstChip) {
      installmentsPaidTotal += amt;
    } else {
      // Default non-refund payments to At Checkout if no explicit installment signal
      atCheckoutPaidTotal += amt;
    }
  });

  const totalPaidAmount = installmentsPaidTotal + atCheckoutPaidTotal;

  const upcomingOverdue = filteredUpcoming.filter(u => u.days_until_due < 0 || u.is_overdue === true);
  const upcomingDueThisWeek = filteredUpcoming.filter(u => u.days_until_due >= 0 && u.days_until_due <= 7 && !u.is_overdue);
  const upcomingLater = filteredUpcoming.filter(u => u.days_until_due > 7);

  const weekTotal = upcomingSummary?.due_this_week_total || upcomingDueThisWeek.reduce((s, u) => s + getItemAmount(u), 0);
  const laterTotal = upcomingSummary?.later_total || upcomingLater.reduce((s, u) => s + getItemAmount(u), 0);

  const groupedHistory = filteredHistory.reduce((acc, item) => {
    const dateKey = item.payment_date || 'Unknown Date';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const formatDueLine = (u: any) => {
    const isOverdue = u.days_until_due < 0 || u.is_overdue === true;
    if (isOverdue) {
      const daysOverdue = Math.abs(u.days_until_due || 1);
      return daysOverdue === 1
        ? 'Past Due · was due yesterday'
        : `Past Due · was due ${u.due_date || 'recently'} (${daysOverdue} days ago)`;
    }
    if (u.days_until_due === 0) return 'Due Today';
    if (u.days_until_due === 1) return 'Due Tomorrow';
    return `Due ${u.due_date || ''} · in ${u.days_until_due} days`;
  };

  const formatInstallmentSub = (u: any) => {
    if (u.installment_number && u.installment_total) {
      const pct = u.percentage ? ` (${u.percentage}%)` : '';
      const desc = u.description ? ` · ${u.description}` : '';
      return `Installment ${u.installment_number} of ${u.installment_total}${pct}${desc}`;
    }
    return u.description || '';
  };

  const RefundCard = () => {
    if (!refundHero || (refundHero.refund_count || 0) === 0) return null;
    const count = refundHero.refund_count || 0;
    const cardLabel = refundHero.card_label || '';
    return (
      <div className={`${styles.payHero} ${styles.refund}`} style={{ marginBottom: 0, height: '100%' }}>
        <div className={styles.payHeroTop}>
          <div>
            <div className={styles.payHeroLbl}>TOTAL REFUNDED</div>
            <div className={styles.payHeroAmt}>PKR {formatAmount(refundHero.total_amount || 0)}</div>
            {cardLabel && (
              <div className={styles.payHeroMethod}>
                <i className="bx bx-credit-card"></i>
                <span>Credited to {cardLabel}</span>
              </div>
            )}
          </div>
          <span className={styles.payHeroBadge}>
            <i className="bx bx-undo"></i>
            {count} {count === 1 ? 'Refund' : 'Refunds'}
          </span>
        </div>
        <div className={styles.payHeroStats}>
          <div className={styles.payHeroStat}>
            <div className={styles.payHeroStatLbl}>
              <i className="bx bx-check-circle" style={{ marginRight: 4 }}></i>
              Credited
            </div>
            <div className={styles.payHeroStatVal}>PKR {formatAmount(refundHero.credited_amount || 0)}</div>
          </div>
          <div className={styles.payHeroStat}>
            <div className={styles.payHeroStatLbl}>
              <i className="bx bx-time-five" style={{ marginRight: 4 }}></i>
              Initiated
            </div>
            <div className={styles.payHeroStatVal}>PKR {formatAmount(refundHero.initiated_amount || 0)}</div>
          </div>
        </div>
      </div>
    );
  };

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
          <button
            className={`${styles.periodChip} ${selectedPeriod === 'All' ? styles.active : ''}`}
            onClick={() => setSelectedPeriod('All')}
          >
            All
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

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
            <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>Loading payment records...</p>
          </div>
        ) : (
          <>
            {activeTab === 'upcoming' && (
          <div>
            {filteredUpcoming.length > 0 && (
              <div className={styles.payHeroRow}>
                <div className={`${styles.payHero} ${styles.upcoming}`} style={{ marginBottom: 0, height: '100%' }}>
                  <div className={styles.payHeroTop}>
                    <div>
                      <div className={styles.payHeroLbl}>Total Upcoming</div>
                      <div className={styles.payHeroAmt}>PKR {formatAmount(totalUpcomingAmount)}</div>
                      <div className={styles.payHeroMethod}>
                        <i className="bx bx-time-five"></i>
                        {upcomingSummary?.next_payment_date ? `Next payment due in ${upcomingSummary?.days_until_next || 0} days` : 'No upcoming schedule'}
                      </div>
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
                  <div className={styles.payEmptyS}>You&apos;re all caught up for this selection.</div>
                </div>
              ) : (
                <>
                  {/* OVERDUE / PAST DUE SECTION */}
                  {upcomingOverdue.length > 0 && (
                    <>
                      <div className={`${styles.payGrp} ${styles.red}`}><i className="bx bx-error-circle"></i>Past Due</div>
                      {upcomingOverdue.map((u, i) => (
                        <div key={`overdue-${i}`} className={styles.payRow}>
                          <div className={`${styles.payRowIc} ${styles.overdue}`}><i className="bx bx-error-circle"></i></div>
                          <div className={styles.payRowInfo}>
                            <div className={styles.payRowName}>{u.package_name || 'Order Payment'}</div>
                            {formatInstallmentSub(u) && <div className={styles.payRowSub}>{formatInstallmentSub(u)}</div>}
                            <div className={styles.dueLineRed}>
                              <i className="bx bx-time-five"></i>
                              <span>{formatDueLine(u)}</span>
                            </div>
                            {u.card_last_four && (
                              <div className={styles.payRowMethod}>
                                <i className="bx bx-credit-card"></i>
                                <span>•••• {u.card_last_four}</span>
                              </div>
                            )}
                          </div>
                          <div className={styles.payRowRight}>
                            <div className={`${styles.payRowAmt} ${styles.red}`}>PKR {formatAmount(getItemAmount(u))}</div>
                            <div className={styles.payRowDue} style={{ color: 'var(--primary)', fontWeight: 700 }}>Past Due</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* DUE THIS WEEK SECTION */}
                  {upcomingDueThisWeek.length > 0 && (
                    <>
                      <div className={`${styles.payGrp} ${styles.red}`}><i className="bx bx-time-five"></i>Due This Week</div>
                      {upcomingDueThisWeek.map((u, i) => (
                        <div key={`thisweek-${i}`} className={styles.payRow}>
                          <div className={`${styles.payRowIc} ${styles.due}`}><i className="bx bx-calendar"></i></div>
                          <div className={styles.payRowInfo}>
                            <div className={styles.payRowName}>{u.package_name || 'Order Payment'}</div>
                            {formatInstallmentSub(u) && <div className={styles.payRowSub}>{formatInstallmentSub(u)}</div>}
                            <div className={styles.dueLineAmber}>
                              <i className="bx bx-time-five"></i>
                              <span>{formatDueLine(u)}</span>
                            </div>
                            {u.card_last_four && (
                              <div className={styles.payRowMethod}>
                                <i className="bx bx-credit-card"></i>
                                <span>•••• {u.card_last_four}</span>
                              </div>
                            )}
                          </div>
                          <div className={styles.payRowRight}>
                            <div className={`${styles.payRowAmt} ${styles.amber}`}>PKR {formatAmount(getItemAmount(u))}</div>
                            <div className={styles.payRowDue}>auto-charged</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  
                  {/* LATER SECTION */}
                  {upcomingLater.length > 0 && (
                    <>
                      <div className={`${styles.payGrp} ${styles.grey}`}><i className="bx bx-calendar"></i>Upcoming</div>
                      {upcomingLater.map((u, i) => (
                        <div key={`later-${i}`} className={styles.payRow}>
                          <div className={`${styles.payRowIc} ${styles.due}`}><i className="bx bx-calendar"></i></div>
                          <div className={styles.payRowInfo}>
                            <div className={styles.payRowName}>{u.package_name || 'Order Payment'}</div>
                            {formatInstallmentSub(u) && <div className={styles.payRowSub}>{formatInstallmentSub(u)}</div>}
                            <div className={styles.dueLineMuted}>
                              <i className="bx bx-time-five"></i>
                              <span>{formatDueLine(u)}</span>
                            </div>
                            {u.card_last_four && (
                              <div className={styles.payRowMethod}>
                                <i className="bx bx-credit-card"></i>
                                <span>•••• {u.card_last_four}</span>
                              </div>
                            )}
                          </div>
                          <div className={styles.payRowRight}>
                            <div className={`${styles.payRowAmt} ${styles.amber}`}>PKR {formatAmount(getItemAmount(u))}</div>
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
                      <div className={styles.payHeroLbl}>{historyHeroTitle(selectedPeriod)}</div>
                      <div className={styles.payHeroAmt}>PKR {formatAmount(totalPaidAmount)}</div>
                      <div className={styles.payHeroMethod}>
                        <i className="bx bx-credit-card"></i>
                        {historyItems.length > 0 && historyItems[0].card_last_four ? `${historyItems[0].card_type || 'Card'} •••• ${historyItems[0].card_last_four}` : 'Multiple cards'}
                      </div>
                    </div>
                    <span className={styles.payHeroBadge}>{filteredHistory.length} paid</span>
                  </div>
                  <div className={styles.payHeroStats}>
                    <div className={styles.payHeroStat}>
                      <div className={styles.payHeroStatLbl}>
                        <i className="bx bx-calendar-event" style={{ marginRight: 4 }}></i>
                        Installments
                      </div>
                      <div className={styles.payHeroStatVal}>PKR {formatAmount(installmentsPaidTotal)}</div>
                    </div>
                    <div className={styles.payHeroStat}>
                      <div className={styles.payHeroStatLbl}>
                        <i className="bx bx-shopping-bag" style={{ marginRight: 4 }}></i>
                        At Checkout
                      </div>
                      <div className={styles.payHeroStatVal}>PKR {formatAmount(atCheckoutPaidTotal)}</div>
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
                  <div className={styles.payEmptyT}>No payments in this period</div>
                  <div className={styles.payEmptyS}>Try a longer window — switch to {getOtherPeriodHint(selectedPeriod)}.</div>
                </div>
              ) : (
                Object.keys(groupedHistory).map(date => (
                  <React.Fragment key={date}>
                    <div className={styles.payDateHead}><i className="bx bx-calendar"></i>{date}</div>
                    {groupedHistory[date].map((h: any, i: number) => {
                      const isRefund = h.is_refund === true;
                      const isOrderPayment = h.type === 'order_payment' || h.payment_timing === 'at_order';
                      
                      let tileClass = styles.payRowIc + ' ' + (isRefund ? styles.refund : (isOrderPayment ? styles.order : styles.installment));
                      let tileIcon = isRefund ? 'bx-undo' : (isOrderPayment ? 'bx-shopping-bag' : 'bx-calendar-check');
                      let amtClass = styles.payRowAmt + ' ' + (isRefund ? styles.teal : styles.green);

                      let subText = '';
                      if (isRefund && h.package_subtitle) {
                        subText = h.package_subtitle;
                      } else if (h.installment_total > 0) {
                        if (isOrderPayment && h.installment_total === 1) {
                          subText = h.description || 'Paid in full';
                        } else {
                          const pct = h.percentage ? ` (${h.percentage}%)` : '';
                          const desc = h.description ? ` · ${h.description}` : '';
                          subText = `Installment ${h.installment_number || 1} of ${h.installment_total}${pct}${desc}`;
                        }
                      } else {
                        subText = h.description || (isOrderPayment ? 'Full Payment' : 'Installment Payment');
                      }

                      return (
                        <div key={`hist-${date}-${i}`} className={styles.payRow}>
                          <div className={tileClass}><i className={`bx ${tileIcon}`}></i></div>
                          <div className={styles.payRowInfo}>
                            <div className={styles.payRowName}>{h.package_name || 'Order Payment'}</div>
                            {subText && <div className={styles.payRowSub}>{subText}</div>}
                            
                            {/* CHIPS */}
                            {isRefund ? (
                              <div className={styles.payRowChips}>
                                <span className={`${styles.payRowChip} ${styles.teal}`}><i className="bx bx-undo"></i> REFUND</span>
                                <span className={`${styles.payRowChip} ${h.refund_status === 'credited' ? styles.teal : styles.amber}`}>
                                  <i className={`bx ${h.refund_status === 'credited' ? 'bx-check-circle' : 'bx-time-five'}`}></i>
                                  {(h.refund_status || 'initiated').toUpperCase()}
                                </span>
                              </div>
                            ) : (h.chips && h.chips.length > 0) ? (
                              <div className={styles.payRowChips}>
                                {h.chips.map((chipLabel: string, ci: number) => {
                                  let chipIcon = 'bx-check';
                                  if (chipLabel === 'Installment') chipIcon = 'bx-calendar-event';
                                  if (chipLabel === 'Full Paid') chipIcon = 'bx-check-circle';
                                  if (chipLabel === 'At Checkout') chipIcon = 'bx-bolt';
                                  if (chipLabel === 'Scheduled') chipIcon = 'bx-time-five';
                                  return (
                                    <span key={ci} className={`${styles.payRowChip} ${styles.green}`}>
                                      <i className={`bx ${chipIcon}`}></i>{chipLabel}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : null}

                            {/* CARD METHOD LINE */}
                            {h.card_last_four && (
                              <div className={styles.payRowMethod}>
                                <i className="bx bx-credit-card"></i>
                                <span>•••• {h.card_last_four}</span>
                              </div>
                            )}
                          </div>
                          <div className={styles.payRowRight}>
                            <div className={amtClass}>PKR {formatAmount(getItemAmount(h))}</div>
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))
              )}
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </DashboardLayout>
  );
}
