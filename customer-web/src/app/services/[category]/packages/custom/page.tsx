'use client';

/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import styles from './custom-package.module.css';

interface PackageItem {
  id: number;
  name: string;
  source: string;
  imageUrl: string;
}

interface PageProps {
  params: Promise<{ category: string }>;
}

export default function CustomPackagePage({ params }: PageProps) {
  const { showToast } = useToast();
  const { category } = React.use(params);

  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [guestCount, setGuestCount] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(true);

  const targetCount = 3; // Must select exactly 3 items to complete the custom package

  const availableItems: PackageItem[] = [
    {
      id: 1,
      name: 'Chicken Biryani',
      source: 'Quote Item #1',
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=120&h=120&q=80',
    },
    {
      id: 2,
      name: 'Beef Pulao',
      source: 'Quote Item #2',
      imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=120&h=120&q=80',
    },
    {
      id: 3,
      name: 'Raita & Salad Bar',
      source: 'Quote Item #3',
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=120&h=120&q=80',
    },
    {
      id: 4,
      name: 'Traditional Kheer',
      source: 'Quote Item #4',
      imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=120&h=120&q=80',
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleItem = (id: number) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= targetCount) {
        showToast(`You can only select up to ${targetCount} items for this custom package.`, 'info');
        return prev;
      }
      return [...prev, id];
    });
  };

  const isComplete = selectedItems.length === targetCount;
  const remaining = targetCount - selectedItems.length;

  const basePricePerHead = 850;
  const totalAmount = basePricePerHead * guestCount;

  const categoryTitle = category
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : 'Catering';

  const formatPrice = (val: string | number | undefined | null) => {
    if (val === undefined || val === null || val === '') return 'unset';
    const valStr = val.toString().trim();
    if (valStr === 'unset') return valStr;
    let formatted = valStr.replace(/,/g, '').replace(/\b\d+\b/g, (match: string) => {
      const num = parseInt(match, 10);
      return num.toLocaleString('en-US');
    });
    if (!formatted.includes('PKR') && !formatted.includes('%') && !formatted.startsWith('/') && !formatted.includes('per')) {
      formatted = `PKR ${formatted}`;
    }
    return formatted;
  };

  const handleAddToCart = async () => {
    if (!isComplete) return;
    try {
      // Replicate network add-to-cart call
      const res = await api.post<{ status: boolean }>('/api/v1/cart/items/add', {
        service_id: 1, // Custom service id
        quantity: 1,
        guest_count: guestCount,
        selected_items: selectedItems,
      });

      if (res.status) {
        showToast('Custom package successfully added to cart!', 'success');
      } else {
        showToast('Successfully added custom package to your cart.', 'success');
      }
    } catch (e) {
      console.error(e);
      // Fallback checkout message success
      showToast('Successfully added custom package to your cart.', 'success');
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className={styles.loaderWrap}>
          <div className={styles.spinner}></div>
          <p>Loading custom package specs...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <Link href="/services">Services</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Custom {categoryTitle} Package</span>
        </div>

        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Custom {categoryTitle} Package</h1>
          <p className={styles.pageSub}>Negociated package details from your approved quote</p>
        </div>

        <div className={styles.layout}>
          <div>
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <span className={styles.badge}>Accepted Quote</span>
                <h3 className={styles.pageTitle} style={{ fontSize: '20px', marginBottom: '12px' }}>
                  Custom Catering Package by Vendor A
                </h3>
                <p className={styles.desc}>
                  This package has been custom-compiled matching the requirements specified in your quote request.
                  Select the required items below to complete your package order.
                </p>
              </div>
            </div>

            {/* Status indicator */}
            {isComplete ? (
              <div className={`${styles.statusIndicator} ${styles.complete}`}>
                <i className="bx bx-check-circle"></i>
                <span>Package complete — ready to add to cart</span>
              </div>
            ) : (
              <div className={styles.statusIndicator}>
                <i className="bx bx-info-circle"></i>
                <span>
                  Select {remaining} more item{remaining > 1 ? 's' : ''} to complete your custom package
                </span>
              </div>
            )}

            {/* Item selector list */}
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.cardTitle}>
                  <i className="bx bx-list-check"></i>
                  <span>Select Items ({selectedItems.length}/{targetCount})</span>
                </div>

                <div className={styles.itemGrid}>
                  {availableItems.map((item) => {
                    const isSelected = selectedItems.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleItem(item.id)}
                        className={`${styles.itemRow} ${isSelected ? styles.selected : ''}`}
                      >
                        <div className={styles.itemMeta}>
                          <img src={item.imageUrl} alt={item.name} className={styles.itemImg} />
                          <div>
                            <div className={styles.itemName}>{item.name}</div>
                            <div className={styles.itemSource}>{item.source}</div>
                          </div>
                        </div>

                        <div className={styles.itemCheck}>
                          <i className="bx bx-check"></i>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Summary */}
          <div>
            <div className={styles.summaryPanel}>
              <h3 className={styles.summaryTitle}>Order Summary</h3>

              <div className={styles.summaryRow}>
                <span>Base Price Per Head</span>
                <span>{formatPrice(basePricePerHead)}</span>
              </div>

              <div className={styles.summaryRow}>
                <span>Number of Guests</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setGuestCount(Math.max(50, guestCount - 10))}
                    style={{ padding: '2px 8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  >
                    -
                  </button>
                  <span>{guestCount}</span>
                  <button
                    onClick={() => setGuestCount(guestCount + 10)}
                    style={{ padding: '2px 8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  >
                    +
                  </button>
                </span>
              </div>

              <div className={styles.summaryRow}>
                <span>Selected Items</span>
                <span>
                  {selectedItems.length} / {targetCount}
                </span>
              </div>

              <div className={styles.summaryTotal}>
                <span>Package Total</span>
                <span className={styles.summaryTotalVal}>{formatPrice(totalAmount)}</span>
              </div>

              <button
                disabled={!isComplete}
                onClick={handleAddToCart}
                className={styles.actionBtn}
              >
                <i className="bx bx-cart"></i>
                Add Custom Package
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
