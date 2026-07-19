'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/layout/Footer';
import styles from './page.module.css';

export default function CancellationPolicyPage() {
  const router = useRouter();

  const handleBack = () => {
    // Attempt back routing, fallback to orders page if history is empty
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/orders');
    }
  };

  return (
    <>
      {/* Header bar specific to cancellation policy info view layout */}
      <div className={styles.pageHeader}>
        <button onClick={handleBack} className={styles.backBtn}>
          <i className="bx bx-arrow-back"></i> Back
        </button>
        <div className={styles.headerDivider}></div>
        <div className={styles.headerTitle}>Cancellation Policy</div>
        <div className={styles.headerService}>Tayaree Brand Protection</div>
      </div>

      <main className={styles.main}>
        {/* Policy Hero Card */}
        <div className={styles.policyHero}>
          <div className={styles.policyHeroIcon}>
            <i className="bx bx-shield-quarter"></i>
          </div>
          <h2 className={styles.policyHeroTitle}>Flexible Cancellation Policy</h2>
          <p className={styles.policyHeroSub}>
            Designed to protect both customers and service providers. Review cancellation milestones and refund rules below.
          </p>
          <span className={styles.policyHeroBadge}>
            <i className="bx bx-check-circle"></i> Active Policy
          </span>
        </div>

        {/* Callout Info */}
        <div className={`${styles.callout} ${styles.green}`}>
          <i className="bx bx-info-circle"></i>
          <div>
            You are currently in the <strong>Flexible Window</strong>. Eligible bookings can be cancelled with a partial refund up to 24 hours prior to the scheduled event time.
          </div>
        </div>

        {/* Timeline breakdown cards */}
        <div className={styles.timelineCard}>
          <div className={styles.timelineHeading}>Refund Windows &amp; Milestones</div>
          
          <div className={styles.tlItem}>
            <div className={styles.tlGutter}>
              <div className={`${styles.tlDot} ${styles.green}`}></div>
              <div className={styles.tlConnector}></div>
            </div>
            <div className={styles.tlBody}>
              <div className={styles.tlWindow}>Up to 72 hours before event</div>
              <div className={styles.tlRule}>
                Cancel any package and receive a <strong>100% refund</strong> of the amount paid. No cancellation fees apply.
              </div>
              <span className={`${styles.tlBadge} ${styles.green}`}>Full Refund</span>
            </div>
          </div>

          <div className={styles.tlItem}>
            <div className={styles.tlGutter}>
              <div className={`${styles.tlDot} ${styles.amber}`}></div>
              <div className={styles.tlConnector}></div>
            </div>
            <div className={styles.tlBody}>
              <div className={styles.tlWindow}>72 to 24 hours before event</div>
              <div className={styles.tlRule}>
                Receive a <strong>90% refund</strong> of the amount paid so far. A 10% cancellation processing fee is retained.
              </div>
              <span className={`${styles.tlBadge} ${styles.amber}`}>Partial Refund (90%)</span>
            </div>
          </div>

          <div className={styles.tlItem}>
            <div className={styles.tlGutter}>
              <div className={`${styles.tlDot} ${styles.red}`}></div>
            </div>
            <div className={styles.tlBody}>
              <div className={styles.tlWindow}>Less than 24 hours before event</div>
              <div className={styles.tlRule}>
                No refund is issued. The full booking deposit or package amount paid is non-refundable as vendors have finalized logistics.
              </div>
              <span className={`${styles.tlBadge} ${styles.red}`}>No Refund</span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className={styles.numbersRow}>
          <div className={styles.numberCard}>
            <div className={`${styles.numberVal} ${styles.green}`}>100%</div>
            <div className={styles.numberLbl}>Max Refund</div>
          </div>
          <div className={styles.numberCard}>
            <div className={`${styles.numberVal} ${styles.red}`}>10%</div>
            <div className={styles.numberLbl}>Min Cancel Fee</div>
          </div>
          <div className={styles.numberCard}>
            <div className={`${styles.numberVal} ${styles.amber}`}>3-5</div>
            <div className={styles.numberLbl}>Refund Days</div>
          </div>
        </div>

        {/* Detail FAQ Section Cards */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionHeadIcon}>
              <i className="bx bx-receipt"></i>
            </div>
            <h3 className={styles.sectionHeadTitle}>Refund Calculation Rules</h3>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.ruleRow}>
              <i className="bx bx-check-circle check"></i>
              <div>
                <strong>Deposit Retainment:</strong> The 10% cancellation processing fee is calculated strictly based on the total package price, not the pending balance.
              </div>
            </div>
            <div className={styles.ruleRow}>
              <i className="bx bx-check-circle check"></i>
              <div>
                <strong>Delivered/In-Transit Gating:</strong> Packages containing merchandise or services that are marked &quot;In-Transit&quot; or &quot;Delivered&quot; cannot be cancelled.
              </div>
            </div>
            <div className={styles.ruleRow}>
              <i className="bx bx-info-circle info"></i>
              <div>
                <strong>Add-on adjustments:</strong> Cancellations of single items in custom packages are processed pro-rata matching the vendor&apos;s line item breakdown.
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionHeadIcon}>
              <i className="bx bx-help-circle"></i>
            </div>
            <h3 className={styles.sectionHeadTitle}>Frequently Asked Questions</h3>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.ruleRow}>
              <i className="bx bx-question-mark info"></i>
              <div>
                <strong>How long does the refund take?</strong>
                <p style={{ marginTop: '3px', color: 'var(--text-secondary)' }}>Refunds are automatically processed and sent back to your original payment method (Credit card, Bank transfer) within 3 to 5 business days.</p>
              </div>
            </div>
            <div className={styles.ruleRow}>
              <i className="bx bx-question-mark info"></i>
              <div>
                <strong>What if the vendor cancels my booking?</strong>
                <p style={{ marginTop: '3px', color: 'var(--text-secondary)' }}>In the rare event that a vendor cancels your booking, you will receive a 100% full refund immediately, and Tayaree will assist you in finding an alternative vendor.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
