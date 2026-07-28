'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import styles from '../../quotes.module.css';

export default function QuoteSentPage() {
  const params = useParams();
  const rawParam = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const quoteId = rawParam ? String(rawParam).toLowerCase() : 'catering';

  return (
    <DashboardLayout breadcrumbTitle="Revision Sent">
      <div style={{ maxWidth: '600px', margin: '30px auto 60px' }}>
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--card)', borderRadius: 'var(--radius-l)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(26,107,181,0.1)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', margin: '0 auto 20px' }}>
            <i className="bx bx-send"></i>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '10px' }}>Revision Sent!</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
            Your requested changes were sent to the vendor anonymously. They usually respond with an updated quote within a few hours.
          </p>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href={`/quotes/${quoteId}/review`} className={styles.qbtn}>
              Back to Quote
            </Link>
            <Link href="/quotes" className={`${styles.qbtn} ${styles.qbtnPrimary}`}>
              <i className="bx bx-file-blank"></i> Go to Quotes
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
