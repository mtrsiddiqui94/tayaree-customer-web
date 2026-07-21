'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from './page.module.css';

interface PageProps {
  params: Promise<{ category: string; id: string }>;
}

export default function MegaPackageDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { category, id } = React.use(params);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMegaDeal() {
      try {
        const res = await api.get<{ status: boolean; data: any }>(`/api/v1/services/mega/${id}`);
        if (res.status && res.data) {
          setData(res.data);
        }
      } catch (e) {
        console.error('Failed to load mega deal', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMegaDeal();
  }, [id]);

  if (isLoading) {
    return (
      <>
        <Header />
        <div style={{ padding: '80px', textAlign: 'center' }}>Loading Mega Deal...</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      
      <div className={styles.page}>
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link><span className={styles.sep}>/</span>
          <Link href="/orders">My Orders</Link><span className={styles.sep}>/</span>
          <span className={styles.current}>{data?.name || 'Mega Deal'}</span>
        </nav>

        <div className={styles.pageHead}>
          <div>
            <div className={styles.pageTitle}>{data?.name || 'Mega Deal'} <span className={styles.mSquare}>M</span></div>
            <div className={styles.pageSub}>
              <span className={styles.ciMegaDeal}>Mega Deal</span>
              <span>{data?.subtitle || 'Complete Package'}</span>
            </div>
          </div>
        </div>

        <div className={styles.megaBanner}>
          <div className={styles.megaBannerIc}>M</div>
          <div className={styles.megaBannerBody}>
            <div className={styles.megaBannerTitle}>Part of Mega Deal — {data?.name || 'Complete Catering'}</div>
            <div className={styles.megaBannerSub}>Multiple packages booked together · bundle discount</div>
          </div>
        </div>

        <div className={styles.detailLayout}>
          {/* Left side details */}
          <div>
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.ciHeader}>
                  <img className={styles.ciImg} src={data?.image_url || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&h=160&fit=crop'} alt="Package" />
                  <div className={styles.ciHeadInfo}>
                    <div className={styles.ciHeadTop}>
                      <div>
                        <div className={styles.ciName}>{data?.name || 'Package Name'}</div>
                        <div className={styles.ciVendor}><i className="bx bx-store" style={{ fontSize: '13px' }}></i> {data?.vendor_name || 'Vendor Name'}</div>
                      </div>
                      <div className={styles.ciHeadBadges}>
                        <span className={styles.ciStatus}><i className="bx bx-check-circle"></i>Confirmed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.cardTitle}>
                  <i className="bx bx-food-menu"></i> Item Details
                </div>
                {/* List items if any */}
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  {data?.items?.length ? data.items.map((it: any, i: number) => <div key={i}>{it.name}</div>) : 'No items to display'}
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div>
            <div className={styles.sidebarSticky}>
              <div className={styles.bookingCard}>
                <div className={styles.sidebarHead}>
                  <div className={styles.shTop}>
                    <div className={styles.shEyebrow}><span className={styles.shM}>M</span>Mega Deal Order</div>
                    <span className={styles.shStatus}><i className="bx bx-check-circle"></i>Confirmed</span>
                  </div>
                  <div className={styles.shTitle}>#{data?.order_number || 'TAY-MEGA-001'}</div>
                  <div className={styles.shOrderdate}><i className="bx bx-calendar"></i>Ordered on {data?.order_date || 'unset'}</div>
                  <div className={styles.shTotalRow}>
                    <span className={styles.shTotalLbl}>Mega Price</span>
                    <span className={styles.shTotalVal}>PKR {data?.total_price || 'unset'}</span>
                  </div>
                </div>
                
                <div className={styles.priceBreakdown}>
                  <div className={styles.priceRow}>
                    <span>Package Amount</span>
                    <span className={styles.priceVal}>PKR {data?.original_price || 'unset'}</span>
                  </div>
                  <div className={styles.priceRow}>
                    <span>Bundle Discount</span>
                    <span className={`${styles.priceVal} ${styles.green}`}>- PKR {data?.discount || 'unset'}</span>
                  </div>
                  <hr className={styles.priceDashed} />
                  <div className={`${styles.priceRow} ${styles.total}`}>
                    <span>Mega Price</span>
                    <span className={`${styles.priceVal} ${styles.total}`}>PKR {data?.total_price || 'unset'}</span>
                  </div>
                </div>

                <div className={styles.actionsBlock}>
                  <button className={styles.btnPrimary}>
                    <i className="bx bx-receipt"></i> View Order Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
