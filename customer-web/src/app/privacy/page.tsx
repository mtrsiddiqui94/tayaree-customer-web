'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import styles from './page.module.css';

export default function PrivacyPage() {
  return (
    <DashboardLayout breadcrumbTitle="Privacy Policy">
      <div className={styles.dashContent}>
        <div className={styles.pageHead}>
              <div className={styles.pageTitle}>Privacy Policy</div>
              <div className={styles.pageSub}>How Tayaree collects, uses, and protects your information.</div>
            </div>
            
            <div className={styles.card}>
              <div className={styles.cardInner}>
                <span className={styles.legalUpdated}>
                  <i className='bx bx-calendar-check'></i>Last updated: 1 July 2026
                </span>
                
                <p className={styles.legalIntro}>At Tayaree, your privacy matters. This policy explains what information we collect when you use our platform to plan and book event services, how we use it, and the choices you have. By using Tayaree, you agree to the practices described below.</p>

                <div className={styles.legalH}><i className='bx bx-data'></i>Information We Collect</div>
                <ul className={styles.legalList}>
                  <li><b>Account details</b> — your name, email, phone number, and profile information.</li>
                  <li><b>Addresses &amp; location</b> — delivery addresses and, with your permission, your device location to verify addresses.</li>
                  <li><b>Payment information</b> — card and bank details are collected securely by our payment partners; Tayaree never stores your full card number or CVV.</li>
                  <li><b>Order &amp; usage data</b> — packages you view, cart items, orders, and how you interact with the app.</li>
                </ul>

                <div className={styles.legalH}><i className='bx bx-cog'></i>How We Use Your Information</div>
                <ul className={styles.legalList}>
                  <li>To process orders, payments, deliveries, and refunds.</li>
                  <li>To verify addresses and coordinate delivery with vendors.</li>
                  <li>To send order updates, reminders, and service notifications.</li>
                  <li>To improve our services, personalize recommendations, and prevent fraud.</li>
                </ul>

                <div className={styles.legalH}><i className='bx bx-share-alt'></i>Sharing Your Information</div>
                <p className={styles.legalP}>We share only what&apos;s necessary — with vendors fulfilling your order, delivery partners, and payment processors. We never sell your personal data. We may disclose information where required by law.</p>

                <div className={styles.legalH}><i className='bx bx-lock-alt'></i>Data Security</div>
                <p className={styles.legalP}>Your data is encrypted in transit and at rest. Payment details are tokenized by PCI-compliant partners. Access is restricted to authorized personnel only.</p>

                <div className={styles.legalH}><i className='bx bx-user-check'></i>Your Rights</div>
                <p className={styles.legalP}>You can view, update, or delete your account information at any time from your profile. You may request a copy of your data or ask us to delete it by contacting our support team.</p>

                <div className={styles.legalH}><i className='bx bx-cookie'></i>Cookies</div>
                <p className={styles.legalP}>We use cookies and similar technologies to keep you signed in, remember your preferences, and understand how the platform is used. You can control cookies through your browser settings.</p>

                <div className={styles.legalContact}>
                  Questions about your privacy? Contact us at <a href="mailto:privacy@tayaree.com">privacy@tayaree.com</a> or through <Link href="/chat">Customer Service</Link>.
                </div>
              </div>
            </div>
          </div>
    </DashboardLayout>
  );
}
