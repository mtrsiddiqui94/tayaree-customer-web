'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Container } from '@/components/layout/Container';
import styles from './policy.module.css';

interface FAQ {
  q: string;
  a: string;
}

const FAQS: FAQ[] = [
  {
    q: 'How are refund amounts calculated?',
    a: 'Refunds are calculated based on the total paid amount minus applicable cancellation fees determined by the number of days remaining before your scheduled event date.',
  },
  {
    q: 'What happens if a vendor cancels my booking?',
    a: 'If a vendor cancels your booking or is unable to fulfill your order, you will receive a 100% full refund to your original payment method, and our customer support team will assist you in finding an alternative vendor immediately.',
  },
  {
    q: 'How long does a refund take to process?',
    a: 'Approved refunds are initiated immediately and usually reflect on your bank account or card statement within 3 to 5 business days, depending on your financial institution.',
  },
  {
    q: 'Can I cancel individual items from a multi-package order?',
    a: 'Yes, Tayaree supports itemized cancellations. You can cancel specific packages or line items individually without affecting the rest of your order.',
  },
];

export default function CancellationPolicyPage() {
  const [openFaqs, setOpenFaqs] = useState<{ [key: number]: boolean }>({ 0: true });

  const toggleFaq = (idx: number) => {
    setOpenFaqs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <>
      <Header />
      <div className={styles.page}>
        <Container>
          <nav className={styles.breadcrumb}>
            <Link href="/">Home</Link>
            <span className={styles.sep}>/</span>
            <Link href="/orders">My Orders</Link>
            <span className={styles.sep}>/</span>
            <span className={styles.current}>Cancellation Policy</span>
          </nav>

          <div className={styles.contentWrap}>
            {/* HERO BANNER */}
            <div className={styles.hero}>
              <div className={styles.heroEyebrow}>Tayaree Customer Protection</div>
              <h1 className={styles.heroTitle}>Cancellation &amp; Refund Policy</h1>
              <p className={styles.heroSub}>
                Transparent, flexible, and customer-first cancellation rules designed to protect your event plans and investment.
              </p>
            </div>

            {/* POLICY TIERS GRID */}
            <div className={styles.tiersGrid}>
              <div className={styles.tierCard}>
                <span className={`${styles.tierBadge} ${styles.green}`}>More than 14 Days</span>
                <div className={`${styles.tierPercent} ${styles.green}`}>90%</div>
                <div className={styles.tierLabel}>Refund Amount</div>
                <div className={styles.tierSub}>10% processing &amp; admin fee applies</div>
              </div>

              <div className={styles.tierCard}>
                <span className={`${styles.tierBadge} ${styles.amber}`}>7 – 14 Days Before</span>
                <div className={`${styles.tierPercent} ${styles.amber}`}>50%</div>
                <div className={styles.tierLabel}>Refund Amount</div>
                <div className={styles.tierSub}>50% vendor prep fee retained</div>
              </div>

              <div className={styles.tierCard}>
                <span className={`${styles.tierBadge} ${styles.red}`}>Less than 7 Days</span>
                <div className={`${styles.tierPercent} ${styles.red}`}>0%</div>
                <div className={styles.tierLabel}>Non-Refundable</div>
                <div className={styles.tierSub}>Full vendor reservation committed</div>
              </div>
            </div>

            {/* KEY POLICY DETAILS */}
            <div className={styles.sectionCard}>
              <h2 className={styles.secTitle}>
                <i className="bx bx-shield-quarter"></i> Deposits &amp; Initial Payments
              </h2>
              <p className={styles.secBody}>
                When you place an order on Tayaree, your initial deposit secures vendor slots, ingredients, materials, and staffing for your event date.
              </p>
              <ul className={styles.secList}>
                <li>Initial deposit payments (typically 30% of total order value) are subject to the lead-time timeline above.</li>
                <li>Future scheduled payments for unperformed services will be automatically cancelled upon approval.</li>
                <li>Customized items or tailored degs already in production cannot be refunded after manufacturing begins.</li>
              </ul>
            </div>

            <div className={styles.sectionCard}>
              <h2 className={styles.secTitle}>
                <i className="bx bx-refresh"></i> Vendor Exception Guidelines &amp; Weather Policy
              </h2>
              <p className={styles.secBody}>
                In rare cases of extreme weather, official security emergencies, or severe force majeure events preventing safe delivery:
              </p>
              <ul className={styles.secList}>
                <li>Tayaree coordinates free rescheduling to an alternative date agreed upon with the vendor.</li>
                <li>If rescheduling is impossible, a 100% full credit or refund is issued.</li>
                <li>Our event day support team remains active 24/7 to resolve on-site issues immediately.</li>
              </ul>
            </div>

            {/* FREQUENTLY ASKED QUESTIONS */}
            <div className={styles.sectionCard}>
              <h2 className={styles.secTitle}>
                <i className="bx bx-help-circle"></i> Frequently Asked Questions
              </h2>
              <div>
                {FAQS.map((faq, idx) => {
                  const isOpen = !!openFaqs[idx];
                  return (
                    <div key={idx} className={`${styles.faqItem} ${isOpen ? styles.open : ''}`}>
                      <button type="button" className={styles.faqHead} onClick={() => toggleFaq(idx)}>
                        <span>{faq.q}</span>
                        <i className={`bx bx-chevron-down ${styles.faqChev}`}></i>
                      </button>
                      {isOpen && <div className={styles.faqBody}>{faq.a}</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SUPPORT CTA */}
            <div className={styles.supportCard}>
              <div className={styles.scText}>
                <div className={styles.scTitle}>
                  <i className="bx bx-headphone"></i> Need help with your cancellation?
                </div>
                <div className={styles.scSub}>
                  Have special circumstances or need to speak with our support team? We&apos;re here for you.
                </div>
              </div>
              <Link href="/chat" className={styles.scBtn}>
                <i className="bx bx-message-square-detail"></i> Contact Support
              </Link>
            </div>
          </div>
        </Container>
      </div>
      <Footer />
    </>
  );
}
