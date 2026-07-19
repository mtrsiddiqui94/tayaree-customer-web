'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from './page.module.css';

interface PackageItem {
  name: string;
  img: string;
  variation: string;
}

interface PaymentInst {
  label: string;
  date: string;
  amount: number;
  status: 'paid' | 'future' | 'full';
}

interface OrderPackage {
  id: string;
  key: string;
  name: string;
  vendor: string;
  img: string;
  status: 'confirmed' | 'transit' | 'delivered' | 'install';
  statusLabel: string;
  statusClass: string;
  metaGuests: string;
  metaItems: string;
  deliveryDate: string;
  packageAmount: number;
  amountPaid: number;
  paidPercent: number;
  cancellationFee: number;
  refundAmount: number;
  isSelectable: boolean;
  restrictReason?: string;
  items: PackageItem[];
  schedule: PaymentInst[];
}

const MOCK_PACKAGES: OrderPackage[] = [
  {
    id: "pkg-1",
    key: "catering",
    name: "Royal Biryani Catering",
    vendor: "Amber's Kitchen",
    img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=200&h=200&q=80",
    status: "confirmed",
    statusLabel: "Confirmed",
    statusClass: "confirmed",
    metaGuests: "150 Guests",
    metaItems: "4 Items",
    deliveryDate: "15 Mar 2025",
    packageAmount: 114750,
    amountPaid: 34425,
    paidPercent: 30,
    cancellationFee: 3443,
    refundAmount: 30982,
    isSelectable: true,
    items: [
      { name: "Chicken Biryani", img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=200&h=160&q=80", variation: "Standard" },
      { name: "Beef Pulao", img: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=200&h=160&q=80", variation: "Standard" },
      { name: "Raita & Salad", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=200&h=160&q=80", variation: "Standard" },
      { name: "Kheer", img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=200&h=160&q=80", variation: "Standard" }
    ],
    schedule: [
      { label: "Booking Deposit", date: "Paid · at checkout", amount: 34425, status: "paid" },
      { label: "Final Balance", date: "Due March 10, 2025", amount: 80325, status: "future" }
    ]
  },
  {
    id: "pkg-2",
    key: "photography",
    name: "Premium Photography & Videography",
    vendor: "Lens & Light Studio",
    img: "https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?auto=format&fit=crop&w=200&h=200&q=80",
    status: "confirmed",
    statusLabel: "Confirmed",
    statusClass: "confirmed",
    metaGuests: "200 Guests",
    metaItems: "4 Items",
    deliveryDate: "17 – 29 Mar 2025",
    packageAmount: 85000,
    amountPaid: 25500,
    paidPercent: 30,
    cancellationFee: 2550,
    refundAmount: 22950,
    isSelectable: true,
    items: [
      { name: "Photography", img: "https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?auto=format&fit=crop&w=200&h=160&q=80", variation: "12 Hours" },
      { name: "Videography", img: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=200&h=160&q=80", variation: "8 Hours" },
      { name: "Drone Shots", img: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=200&h=160&q=80", variation: "Standard" },
      { name: "Highlights Reel", img: "https://images.unsplash.com/photo-1598300056393-4afd99d1d79a?auto=format&fit=crop&w=200&h=160&q=80", variation: "Standard" }
    ],
    schedule: [
      { label: "Booking Deposit", date: "Paid · at checkout", amount: 25500, status: "paid" },
      { label: "Final Balance", date: "Due March 10, 2025", amount: 59500, status: "future" }
    ]
  },
  {
    id: "pkg-3",
    key: "florals",
    name: "Floral Decoration — Grand Hall",
    vendor: "Rose Garden Events",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&h=200&q=80",
    status: "confirmed",
    statusLabel: "Confirmed",
    statusClass: "confirmed",
    metaGuests: "Stage + Hall",
    metaItems: "3 Items",
    deliveryDate: "15 Mar 2025",
    packageAmount: 45000,
    amountPaid: 45000,
    paidPercent: 100,
    cancellationFee: 4500,
    refundAmount: 40500,
    isSelectable: true,
    items: [
      { name: "Stage Backdrop", img: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=200&h=160&q=80", variation: "Red & White" },
      { name: "Entrance Arch", img: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=200&h=160&q=80", variation: "Standard" },
      { name: "Table Centerpieces", img: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=200&h=160&q=80", variation: "×15" }
    ],
    schedule: [
      { label: "Paid in Full", date: "Paid · at checkout", amount: 45000, status: "full" }
    ]
  },
  {
    id: "pkg-4",
    key: "sound",
    name: "Sound & Lighting Setup",
    vendor: "SoundWave Productions",
    img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=200&h=200&q=80",
    status: "transit",
    statusLabel: "In Transit",
    statusClass: "transit",
    metaGuests: "Standard",
    metaItems: "5 Items",
    deliveryDate: "14 Mar 2025",
    packageAmount: 60000,
    amountPaid: 60000,
    paidPercent: 100,
    cancellationFee: 6000,
    refundAmount: 54000,
    isSelectable: false,
    restrictReason: "In-transit packages can't be cancelled",
    items: [
      { name: "Line Array Speakers", img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=200&h=160&q=80", variation: "×4" },
      { name: "Subwoofers", img: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=200&h=160&q=80", variation: "×2" },
      { name: "Wireless Mics", img: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=200&h=160&q=80", variation: "×6" },
      { name: "LED Par Lights", img: "https://images.unsplash.com/photo-1504509546545-e000b4a62425?auto=format&fit=crop&w=200&h=160&q=80", variation: "×12" },
      { name: "DJ Console", img: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?auto=format&fit=crop&w=200&h=160&q=80", variation: "Standard" }
    ],
    schedule: [
      { label: "Paid in Full", date: "Paid · at checkout", amount: 60000, status: "full" }
    ]
  },
  {
    id: "pkg-5",
    key: "couture",
    name: "Bride & Groom Couture",
    vendor: "Élan Atelier",
    img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=200&h=200&q=80",
    status: "delivered",
    statusLabel: "Delivered",
    statusClass: "delivered",
    metaGuests: "Standard",
    metaItems: "2 Items",
    deliveryDate: "12 Mar 2025",
    packageAmount: 80000,
    amountPaid: 24000,
    paidPercent: 30,
    cancellationFee: 2400,
    refundAmount: 21600,
    isSelectable: false,
    restrictReason: "Delivered packages can't be cancelled",
    items: [
      { name: "Bridal Lehenga", img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=200&h=160&q=80", variation: "Red · M" },
      { name: "Groom Sherwani", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=160&q=80", variation: "Ivory · L" }
    ],
    schedule: [
      { label: "Booking Deposit", date: "Paid · at checkout", amount: 24000, status: "paid" },
      { label: "Final Balance", date: "Due March 10, 2025", amount: 56000, status: "future" }
    ]
  }
];

const REASONS = [
  "Event date changed",
  "Found a better deal",
  "Booked by mistake",
  "Vendor delayed response",
  "No longer needed",
  "Other"
];

export default function CancelOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string || 'TAY-20250315-001';

  const [packages, setPackages] = useState<OrderPackage[]>(MOCK_PACKAGES);
  const [selectedPkgIds, setSelectedPkgIds] = useState<string[]>([]);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [reasonComment, setReasonComment] = useState('');
  
  // Collapse details tracking
  const [openDetailsId, setOpenDetailsId] = useState<string | null>(null);
  const [isOrderAmtOpen, setIsOrderAmtOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push(`/login?redirect=/orders/${orderId}/cancel`);
      return;
    }
  }, [orderId]);

  const togglePackage = (pkg: OrderPackage) => {
    if (!pkg.isSelectable) return;
    if (selectedPkgIds.includes(pkg.id)) {
      setSelectedPkgIds(prev => prev.filter(id => id !== pkg.id));
    } else {
      setSelectedPkgIds(prev => [...prev, pkg.id]);
    }
  };

  const toggleDetails = (pkgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDetailsId(prev => (prev === pkgId ? null : pkgId));
  };

  const formatAmount = (num: number) => {
    return num.toLocaleString('en-PK');
  };

  // Calculations
  const selectedPackages = packages.filter(p => selectedPkgIds.includes(p.id));
  const amountPaidSoFar = selectedPackages.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const cancellationFeeTotal = Math.round(amountPaidSoFar * 0.10);
  const refundTotal = amountPaidSoFar - cancellationFeeTotal;

  const isFormValid = selectedPkgIds.length > 0 && selectedReason !== null;

  const handleReviewCancellation = () => {
    if (!isFormValid) return;
    
    // Store cancellation info temporarily in localStorage for summary review screen
    localStorage.setItem('temp_cancel_details', JSON.stringify({
      orderId,
      cancelledPkgIds: selectedPkgIds,
      reason: selectedReason,
      comment: reasonComment,
      refundTotal,
      cancellationFeeTotal,
      amountPaidSoFar,
      cancelledPackages: selectedPackages.map(p => ({ name: p.name, amount: p.packageAmount }))
    }));

    router.push(`/orders/${orderId}/cancel/summary`);
  };

  return (
    <>
      <Header />

      <main className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <Link href="/orders">My Orders</Link>
          <span className={styles.sep}>/</span>
          <Link href={`/orders/${orderId}`}>Order Details</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Cancel Order</span>
        </div>

        <div className={styles.pageHead}>
          <div>
            <h2 className={styles.pageTitle}>Cancel Order</h2>
            <p className={styles.pageSub}>Select the packages you&apos;d like to cancel and review your refund before confirming.</p>
          </div>
          <Link href={`/orders/${orderId}`} className={styles.backLink}>
            <i className="bx bx-arrow-back"></i> Back to Order
          </Link>
        </div>

        <div className={styles.layout}>
          {/* LEFT: Selectable packages list */}
          <div>
            <div className={styles.warnBanner}>
              <i className="bx bx-error-circle"></i>
              <div>
                <h4 className={styles.warnTitle}>This action cannot be undone</h4>
                <p className={styles.warnBody}>Your booking will be cancelled immediately and the vendor will be notified automatically. A cancellation fee may apply depending on the package&apos;s policy.</p>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.cardTitle}>
                  <i className="bx bx-select-multiple"></i>Select Packages to Cancel
                  <span className={styles.count}>
                    {selectedPkgIds.length} of {packages.length} selected
                  </span>
                </div>
                <p className={styles.cardSubtitle}>
                  Tick the packages you want to cancel. Delivered and in-transit packages can no longer be cancelled. Use <b>View Details</b> on any package to review its items and payment schedule.
                </p>

                {packages.map((pkg) => {
                  const isSelected = selectedPkgIds.includes(pkg.id);
                  const isExpanded = openDetailsId === pkg.id;

                  return (
                    <div
                      key={pkg.id}
                      className={`${styles.cpkg} ${pkg.isSelectable ? styles.selectable : styles.restricted} ${
                        isSelected ? styles.selected : ''
                      }`}
                      onClick={() => togglePackage(pkg)}
                    >
                      {pkg.isSelectable ? (
                        <span className={styles.cpkgBox}>
                          <i className="bx bx-check"></i>
                        </span>
                      ) : (
                        <span className={styles.cpkgLock}>
                          <i className="bx bx-lock-alt"></i>
                        </span>
                      )}

                      <div className={styles.cpkgBody}>
                        <div className={styles.ciHeader}>
                          <img className={styles.ciImg} src={pkg.img} alt={pkg.name} />
                          <div className={styles.ciHeadInfo}>
                            <div className={styles.ciHeadTop}>
                              <div>
                                <h4 className={styles.ciName}>{pkg.name}</h4>
                                <div className={styles.ciVendor}>
                                  <i className="bx bx-store"></i> {pkg.vendor}
                                </div>
                              </div>
                              <div className={styles.ciBadges}>
                                <span className={`${styles.ciStatus} ${styles[pkg.statusClass]}`}>
                                  {pkg.statusLabel}
                                </span>
                              </div>
                            </div>
                            <div className={styles.ciMetaRow}>
                              <span className={styles.ciMeta}><i className="bx bx-group"></i>{pkg.metaGuests}</span>
                              <span className={styles.ciMeta}><i className="bx bx-box"></i>{pkg.metaItems}</span>
                            </div>
                            <div className={styles.ciDd}>
                              <span className={styles.ciDdText}>
                                <i className="bx bxs-truck"></i>
                                {pkg.status === 'delivered' ? `Delivered: ${pkg.deliveryDate}` : `Delivery: ${pkg.deliveryDate}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {pkg.isSelectable ? (
                          <div className={styles.ciPriceRow}>
                            <div className={styles.ciPr}>
                              <span className={styles.ciPrLbl}>Package Amount</span>
                              <span className={styles.ciPrVal}>PKR {formatAmount(pkg.packageAmount)}</span>
                            </div>
                            <div className={styles.ciPr}>
                              <span className={styles.ciPrLbl}>Amount Paid ({pkg.paidPercent}%)</span>
                              <span className={styles.ciPrVal}>PKR {formatAmount(pkg.amountPaid)}</span>
                            </div>
                            <div className={styles.ciPr}>
                              <span className={styles.ciPrLbl}>Cancellation Fee (10%)</span>
                              <span className={`${styles.ciPrVal} ${styles.amber}`}>
                                − PKR {formatAmount(pkg.cancellationFee)}
                              </span>
                            </div>
                            <div className={styles.ciPr}>
                              <span className={styles.ciPrLbl}>Refund for this Package</span>
                              <span className={`${styles.ciPrVal} ${styles.red}`}>
                                PKR {formatAmount(pkg.refundAmount)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.cpkgRestrictNote}>
                            <i className="bx bx-info-circle"></i>
                            {pkg.restrictReason}
                          </div>
                        )}

                        <button
                          className={`${styles.viewDetails} ${isExpanded ? styles.open : ''}`}
                          onClick={(e) => toggleDetails(pkg.id, e)}
                        >
                          <i className="bx bx-list-ul"></i>View Details
                          <i className={`bx bx-chevron-down ${styles.chev}`}></i>
                        </button>

                        <div
                          className={`${styles.detailsPanel} ${isExpanded ? styles.open : ''}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className={styles.detailsInner}>
                            <div className={styles.detailsSec}>
                              <div className={styles.detailsSecTitle}>
                                <i className="bx bx-box"></i>Items in this Package
                              </div>
                              <div className={styles.dcCarousel}>
                                {pkg.items.map((item, itemIdx) => (
                                  <div key={itemIdx} className={styles.dcPc}>
                                    <img src={item.img} alt={item.name} />
                                    <div className={styles.dcPcName}>{item.name}</div>
                                    <div className={styles.dcPcVar}>{item.variation}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className={styles.detailsSec}>
                              <div className={styles.detailsSecTitle}>
                                <i className="bx bx-calendar-check"></i>Payment Schedule
                              </div>
                              {pkg.schedule.map((sch, schIdx) => (
                                <div key={schIdx} className={styles.inst}>
                                  <div className={styles.instG}>
                                    <div className={`${styles.instDot} ${styles[sch.status]}`}></div>
                                    {schIdx < pkg.schedule.length - 1 && (
                                      <div className={styles.instConn}></div>
                                    )}
                                  </div>
                                  <div className={styles.instBody}>
                                    <div>
                                      <div className={styles.instLabel}>{sch.label}</div>
                                      <div className={styles.instDate}>{sch.date}</div>
                                    </div>
                                    <div className={`${styles.instAmt} ${sch.status === 'paid' || sch.status === 'full' ? styles.green : styles.red}`}>
                                      PKR {formatAmount(sch.amount)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <div className={styles.detailsTotal}>
                                <span>Package Total</span>
                                <b>PKR {formatAmount(pkg.packageAmount)}</b>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Refund calculations sidebar panel */}
          <aside>
            <div className={styles.sidebarSticky}>
              <div className={styles.bookingCard}>
                <div className={styles.sidebarHead}>
                  <div className={styles.shTop}>
                    <span className={styles.shEyebrow}>Cancellation</span>
                    <span className={styles.shStatus}>
                      <i className="bx bx-x-circle"></i>Cancelling
                    </span>
                  </div>
                  <h3 className={styles.shTitle}>#{orderId}</h3>
                  <div className={styles.shOrderdate}>
                    <i className="bx bx-calendar"></i>Ordered 10 March 2025
                  </div>
                  <div className={styles.shSub}>Event · March 15, 2025</div>
                </div>

                {/* Refund breakdown section */}
                <div className={styles.refundBlock}>
                  <h4 className={styles.refundTitle}>
                    <i className="bx bx-wallet"></i>Your Refund
                  </h4>
                  {selectedPkgIds.length > 0 ? (
                    <div>
                      <div className={styles.refundRow}>
                        Paid so far <span className={styles.v}>PKR {formatAmount(amountPaidSoFar)}</span>
                      </div>
                      <div className={styles.refundRow}>
                        Cancellation fee (10%){' '}
                        <span className={`${styles.v} ${styles.fee}`}>
                          − PKR {formatAmount(cancellationFeeTotal)}
                        </span>
                      </div>
                      <hr className={styles.refundDashed} />
                      <div className={styles.refundTotal}>
                        <span className={styles.refundTotalLbl}>Total Refund</span>
                        <span className={styles.refundTotalVal}>
                          PKR {formatAmount(refundTotal)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.refundEmpty}>
                      Select at least one package to see your refund.
                    </div>
                  )}
                </div>

                {/* Policy note */}
                <div className={styles.policyNote}>
                  <i className="bx bx-time-five"></i>
                  <div className={styles.policyNoteTxt}>
                    Refund credited to your original payment method within <b>3–5 business days</b>. <Link href="/orders/cancellation-policy">View cancellation policy</Link>
                  </div>
                </div>

                {/* Action button triggers */}
                <div className={styles.actionsBlock}>
                  {selectedPkgIds.length > 0 && !selectedReason && (
                    <div className={`${styles.needReason} ${styles.show}`}>
                      <i className="bx bx-error-circle"></i>
                      Please select a cancellation reason below to continue.
                    </div>
                  )}
                  <button
                    disabled={!isFormValid}
                    className={styles.btnDanger}
                    onClick={handleReviewCancellation}
                  >
                    {selectedPkgIds.length === 0 ? (
                      <>
                        <i className="bx bx-select-multiple"></i>Select a package
                      </>
                    ) : !selectedReason ? (
                      <>
                        <i className="bx bx-message-square-detail"></i>Select a reason
                      </>
                    ) : (
                      <>
                        <i className="bx bx-right-arrow-alt"></i>Review Cancellation ({selectedPkgIds.length})
                      </>
                    )}
                  </button>
                  <Link href={`/orders/${orderId}`} className={styles.btnOutline}>
                    Keep Order
                  </Link>
                </div>
                <div className={styles.undoneNote}>
                  <i className="bx bx-lock-alt"></i>You&apos;ll review everything before it&apos;s final
                </div>
              </div>

              {/* Order total amount breakdowns */}
              <div className={`${styles.orderAmtBlock} ${isOrderAmtOpen ? styles.open : ''}`}>
                <button
                  className={styles.oaHead}
                  onClick={() => setIsOrderAmtOpen(!isOrderAmtOpen)}
                >
                  <div>
                    <div className={styles.oaLbl}>Order Total</div>
                    <div className={styles.oaNote}>At time of order · 5 packages</div>
                  </div>
                  <div className={styles.oaHeadRight}>
                    <span className={styles.oaTotal}>PKR 4,25,125</span>
                    <i className="bx bx-chevron-down oaChev"></i>
                  </div>
                </button>
                <div className={styles.oaBody}>
                  <div className={styles.oaInner}>
                    <div className={styles.oaRow}>
                      Packages (5)<span>PKR 3,84,750</span>
                    </div>
                    <div className={styles.oaRow}>
                      Shipping<span>PKR 15,000</span>
                    </div>
                    <div className={styles.oaRow}>
                      Taxes &amp; Fees<span>PKR 25,375</span>
                    </div>
                    <hr className={styles.oaDashed} />
                    <div className={`${styles.oaRow} ${styles.total}`}>
                      Order Total<span>PKR 4,25,125</span>
                    </div>
                    <div className={`${styles.oaRow} ${styles.sub}`}>
                      Paid at Checkout<span>PKR 2,29,300</span>
                    </div>
                    <div className={`${styles.oaRow} ${styles.sub}`}>
                      Future Payments<span>PKR 1,95,825</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cancellation Reason selection card */}
              <div className={styles.bookingCard} style={{ marginTop: '16px' }}>
                <div className={styles.cardInner}>
                  <div className={styles.cardTitle}>
                    <i className="bx bx-message-square-detail"></i>Why are you cancelling?{' '}
                    <span style={{ color: 'var(--primary)' }}>*</span>
                  </div>
                  <p className={styles.cardSubtitle} style={{ marginBottom: '12px' }}>
                    A reason is required to continue. Your feedback helps us improve.
                  </p>
                  
                  <div>
                    {REASONS.map((r, rIdx) => {
                      const isSel = selectedReason === r;
                      return (
                        <div
                          key={rIdx}
                          className={`${styles.reasonRow} ${isSel ? styles.sel : ''}`}
                          onClick={() => setSelectedReason(r)}
                        >
                          <span className={styles.reasonRadio}></span>
                          <span className={styles.reasonLabel}>{r}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className={styles.reasonCommentLbl}>Tell us more (optional)</div>
                  <div className={styles.reasonTextareaWrap}>
                    <textarea
                      className={styles.reasonTextarea}
                      maxLength={200}
                      placeholder="Share any specific reason..."
                      value={reasonComment}
                      onChange={(e) => setReasonComment(e.target.value)}
                    />
                  </div>
                  <div className={styles.reasonFoot}>
                    <span className={styles.reasonCount}>
                      {reasonComment.length} / 200
                    </span>
                    <button className={styles.reasonMic} title="Record a voice note">
                      <i className="bx bx-microphone"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}
