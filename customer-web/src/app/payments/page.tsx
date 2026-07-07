'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from './payments.module.css';

interface CreditCard {
  id: number;
  cardName: string;
  creditCardType: string;
  isActive: number;
  isDefault: number;
  lastDigits: string;
}

interface PaymentMethod {
  id: number;
  methodName: string;
  methodShortName: string;
}

interface PaymentInstallment {
  id: number;
  bookingRef: string;
  packageName: string;
  dueDate: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export default function PaymentsPage() {
  const router = useRouter();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [installments, setInstallments] = useState<PaymentInstallment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/payments');
      return;
    }
    loadPaymentsData();
  }, []);

  const loadPaymentsData = async () => {
    try {
      setIsLoading(true);
      
      // 1. Fetch saved credit cards
      const cardsRes = await api.get<{ status: boolean; data?: any[] }>('/api/v1/payment/credit-cards/list')
        .catch(() => ({ status: false, data: [] }));
      
      const parsedCards: CreditCard[] = (cardsRes.data || []).map((c: any) => ({
        id: c.id,
        cardName: c.card_name || 'Card',
        creditCardType: c.credit_card_type || 'Visa',
        isActive: c.is_active || 1,
        isDefault: c.is_default || 0,
        lastDigits: c.last_digits || '0000',
      }));
      setCards(parsedCards);

      // 2. Fetch payment methods
      const methodsRes = await api.get<{ status: boolean; data?: any[] }>('/api/v1/payment/methods/list')
        .catch(() => ({ status: false, data: [] }));
      
      const parsedMethods: PaymentMethod[] = (methodsRes.data || []).map((m: any) => ({
        id: m.id,
        methodName: m.method_name || 'unset',
        methodShortName: m.method_short_name || 'unset',
      }));
      setMethods(parsedMethods);

      // Mockup payment installments
      setInstallments([
        {
          id: 1,
          bookingRef: '#TY-98214',
          packageName: 'Desi Catering buffet (Downpayment)',
          dueDate: '10 July 2026',
          amount: 'Rs. 46,250',
          status: 'Paid',
        },
        {
          id: 2,
          bookingRef: '#TY-98214',
          packageName: 'Desi Catering buffet (Installment 2)',
          dueDate: '10 August 2026',
          amount: 'Rs. 69,375',
          status: 'Pending',
        },
        {
          id: 3,
          bookingRef: '#TY-98214',
          packageName: 'Desi Catering buffet (Installment 3)',
          dueDate: '10 September 2026',
          amount: 'Rs. 69,375',
          status: 'Pending',
        }
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />

      <main className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Payments</span>
        </div>

        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>Payments &amp; Billing Invoices</h1>
          <p className={styles.pageSub}>Manage credit card lines, payment schedules, and installment breakdowns.</p>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
          </div>
        ) : (
          <div className={styles.paymentLayout}>
            {/* Left side: Installments list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className={styles.card}>
                <div className={styles.cardInner}>
                  <h3 className={styles.cardTitle}>
                    <i className="bx bx-calendar-check"></i> Booking Payment Schedules
                  </h3>
                  
                  <div className={styles.tableResponsive}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Booking Ref</th>
                          <th>Installment Detail</th>
                          <th>Due Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {installments.map((inst) => (
                          <tr key={inst.id}>
                            <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{inst.bookingRef}</td>
                            <td>{inst.packageName}</td>
                            <td>{inst.dueDate}</td>
                            <td style={{ fontWeight: 800 }}>{inst.amount}</td>
                            <td>
                              <span className={`${styles.statusBadge} ${
                                inst.status === 'Paid' ? styles.statusPaid : styles.statusPending
                              }`}>
                                {inst.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: credit cards info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className={styles.card}>
                <div className={styles.cardInner}>
                  <h3 className={styles.cardTitle}>
                    <i className="bx bx-credit-card"></i> Saved Payment Methods
                  </h3>
                  
                  <div className={styles.cardList}>
                    {cards.length === 0 ? (
                      <div className={styles.cardItem}>
                        <div className={styles.cardLogo}>Visa</div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '13px', fontWeight: 800 }}>Visa Card Ending in 4242</h4>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Default Card</span>
                        </div>
                      </div>
                    ) : (
                      cards.map((c) => (
                        <div key={c.id} className={styles.cardItem}>
                          <div className={styles.cardLogo}>{c.creditCardType}</div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 800 }}>
                              {c.cardName} Ending in {c.lastDigits}
                            </h4>
                            {c.isDefault === 1 && (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Default Payment</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
