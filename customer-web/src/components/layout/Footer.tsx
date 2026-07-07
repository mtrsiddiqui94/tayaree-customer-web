import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        {/* LOGO & SOCALS */}
        <div>
          <Link href="/" className={styles.footerLogo}>
            <div className={styles.footerLogoMark}>T</div>
            <span className={styles.footerLogoName}>Tayaree</span>
          </Link>
          <p className={styles.footerTagline}>
            Pakistan's Premier Event Marketplace. Compare quotes, book vetted
            vendors, and organize events effortlessly.
          </p>
          <div className={styles.footerSocials}>
            <a href="#" className={styles.footerSocial}>
              <i className="bx bxl-facebook"></i>
            </a>
            <a href="#" className={styles.footerSocial}>
              <i className="bx bxl-instagram"></i>
            </a>
            <a href="#" className={styles.footerSocial}>
              <i className="bx bxl-twitter"></i>
            </a>
            <a href="#" className={styles.footerSocial}>
              <i className="bx bxl-whatsapp"></i>
            </a>
          </div>
        </div>

        {/* CUSTOMER LINKS */}
        <div>
          <div className={styles.footerColTitle}>For Customers</div>
          <div className={styles.footerLinks}>
            <Link href="/login" className={styles.footerLink}>
              Sign In
            </Link>
            <Link href="/signup" className={styles.footerLink}>
              Create Account
            </Link>
            <Link href="/deals" className={styles.footerLink}>
              Hot Deals
            </Link>
            <Link href="/events" className={styles.footerLink}>
              Event Planner
            </Link>
            <Link href="/gift-registry" className={styles.footerLink}>
              Gift Registries
            </Link>
          </div>
        </div>

        {/* LEGAL & INFO */}
        <div>
          <div className={styles.footerColTitle}>Legal &amp; Support</div>
          <div className={styles.footerLinks}>
            <Link href="/privacy" className={styles.footerLink}>
              Privacy Policy
            </Link>
            <Link href="/terms" className={styles.footerLink}>
              Terms of Service
            </Link>
            <Link href="/about" className={styles.footerLink}>
              About Us
            </Link>
            <Link href="/faq" className={styles.footerLink}>
              Help &amp; FAQs
            </Link>
            <Link href="/chat" className={styles.footerLink}>
              Contact Support
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <div className={styles.footerCopy}>
          © 2026 Tayaree Technologies. All rights reserved.
        </div>
        <div className={styles.footerPay}>
          <span className={styles.footerPayBadge}>JazzCash</span>
          <span className={styles.footerPayBadge}>EasyPaisa</span>
          <span className={styles.footerPayBadge}>Card Pay</span>
        </div>
      </div>
    </footer>
  );
}
