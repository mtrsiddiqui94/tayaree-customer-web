'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import styles from './page.module.css';

export default function VendorGuidelinesPage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tayaree_vendor_guidelines_accepted', '1');
      router.back();
    }
  };

  return (
    <>
      <Header />
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <i className='bx bx-chevron-left'></i>Back
        </button>

        <div className={styles.policyHero}>
          <div className={styles.policyHeroIcon}><i className='bx bx-file-blank'></i></div>
          <div className={styles.policyHeroTitle}>Vendor Guidelines</div>
          <div className={styles.policyHeroSub}>Please read these guidelines carefully before confirming your booking. Accepting ensures a smooth experience for your event.</div>
          <div className={styles.policyHeroVendor}><i className='bx bx-store'></i>Amber&apos;s Kitchen — Royal Biryani Catering</div>
        </div>

        <div className={styles.callout}>
          <i className='bx bx-info-circle'></i>
          <span>These guidelines are set by <strong>Amber&apos;s Kitchen</strong> and are specific to this catering service. By accepting, you agree to follow these requirements on the day of your event.</span>
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionHeadIcon}><i className='bx bx-map'></i></div>
            <div className={styles.sectionHeadTitle}>Venue & Space Requirements</div>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.ruleRow}>
              <i className={`bx bx-check-circle ${styles.check}`}></i>
              <span><strong>Cooking area:</strong> Client must provide a dedicated outdoor or semi-outdoor space with a minimum clearance of 12×12 ft for on-site deg cooking setup.</span>
            </div>
            <div className={styles.ruleRow}>
              <i className={`bx bx-check-circle ${styles.check}`}></i>
              <span><strong>Power supply:</strong> Two 16-amp sockets must be available within 20 ft of the cooking area for equipment and lighting.</span>
            </div>
            <div className={styles.ruleRow}>
              <i className={`bx bx-check-circle ${styles.check}`}></i>
              <span><strong>Water access:</strong> Running water must be accessible within 30 ft of the setup area for food prep and cleanup.</span>
            </div>
            <div className={styles.ruleRow}>
              <i className={`bx bx-error-circle ${styles.warn}`}></i>
              <span><strong>Indoor kitchens:</strong> Indoor kitchen access is not provided or expected. All cooking is done on-site using our own equipment.</span>
            </div>
          </div>
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionHeadIcon}><i className='bx bx-group'></i></div>
            <div className={styles.sectionHeadTitle}>Minimum Order & Guest Count</div>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.ruleRow}>
              <i className={`bx bx-check-circle ${styles.check}`}></i>
              <span><strong>Minimum order:</strong> This package has a minimum guest count of 50 persons. Orders below 50 guests cannot be accommodated.</span>
            </div>
            <div className={styles.ruleRow}>
              <i className={`bx bx-check-circle ${styles.check}`}></i>
              <span><strong>Final headcount:</strong> The final confirmed guest count must be communicated at least 48 hours before the event. Last-minute increases above 15% of the booked count may not be fulfilled.</span>
            </div>
            <div className={styles.ruleRow}>
              <i className={`bx bx-info-circle ${styles.info}`}></i>
              <span><strong>Overage:</strong> If actual guests exceed the confirmed count, Amber&apos;s Kitchen will provide up to 10% buffer at no charge. Beyond that, additional headcount is billed at the standard per-head rate.</span>
            </div>
          </div>
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionHeadIcon}><i className='bx bx-time'></i></div>
            <div className={styles.sectionHeadTitle}>Arrival, Setup & Departure</div>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.ruleRow}>
              <i className={`bx bx-check-circle ${styles.check}`}></i>
              <span><strong>Arrival window:</strong> Our team will arrive 2–3 hours before the agreed service time. Please ensure the venue access is ready at this time.</span>
            </div>
            <div className={styles.ruleRow}>
              <i className={`bx bx-check-circle ${styles.check}`}></i>
              <span><strong>Parking:</strong> The client must arrange at least 2 dedicated parking spots near the setup area for our transport vehicles.</span>
            </div>
            <div className={styles.ruleRow}>
              <i className={`bx bx-check-circle ${styles.check}`}></i>
              <span><strong>Breakdown:</strong> Our team will clear and clean the cooking area within 90 minutes of service completion. Kitchen equipment remains our property and will be collected same-day.</span>
            </div>
            <div className={styles.ruleRow}>
              <i className={`bx bx-error-circle ${styles.warn}`}></i>
              <span><strong>Delays:</strong> Significant event delays (over 60 minutes from agreed service time) must be communicated in advance. Extended service time may incur additional charges.</span>
            </div>
          </div>
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionHeadIcon}><i className='bx bx-shield-check'></i></div>
            <div className={styles.sectionHeadTitle}>Food Safety & Hygiene</div>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.ruleRow}>
              <i className={`bx bx-check-circle ${styles.check}`}></i>
              <span><strong>Halal certified:</strong> All meat and ingredients used are Halal certified. Certification documents can be requested prior to your event.</span>
            </div>
            <div className={styles.ruleRow}>
              <i className={`bx bx-check-circle ${styles.check}`}></i>
              <span><strong>Allergen disclosure:</strong> Our standard biryani contains gluten (wheat), dairy, and tree nuts. Please inform us of any dietary restrictions at time of booking so we can accommodate where possible.</span>
            </div>
            <div className={styles.ruleRow}>
              <i className={`bx bx-error-circle ${styles.warn}`}></i>
              <span><strong>Outside food:</strong> Mixing of outside food into our serving setup is not permitted for hygiene and liability reasons.</span>
            </div>
          </div>
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionHeadIcon}><i className='bx bx-user-check'></i></div>
            <div className={styles.sectionHeadTitle}>Client Responsibilities</div>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.ruleRow}>
              <i className={`bx bx-check-circle ${styles.check}`}></i>
              <span>Provide a single point-of-contact on event day who has authority to make real-time decisions.</span>
            </div>
            <div className={styles.ruleRow}>
              <i className={`bx bx-check-circle ${styles.check}`}></i>
              <span>Ensure serving tables, chairs, and crockery are arranged for guests before our arrival (unless a full-service package with these items has been booked separately).</span>
            </div>
            <div className={styles.ruleRow}>
              <i className={`bx bx-check-circle ${styles.check}`}></i>
              <span>Inform Amber&apos;s Kitchen of any venue-specific restrictions (noise limits, no-fire zones, etc.) at least 7 days in advance.</span>
            </div>
            <div className={styles.ruleRow}>
              <i className={`bx bx-info-circle ${styles.info}`}></i>
              <span>Tayaree&apos;s 24/7 support team is available to mediate any on-day issues between you and the vendor.</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.stickyFooter}>
        <div className={styles.stickyInner}>
          <label className={styles.ackLabel}>
            <input 
              type="checkbox" 
              checked={accepted} 
              onChange={(e) => setAccepted(e.target.checked)} 
            />
            <span className={styles.ackText}>I have read and accept the <strong>Vendor Guidelines</strong> for Royal Biryani Catering by Amber&apos;s Kitchen</span>
          </label>
          <button 
            className={styles.acceptBtn} 
            disabled={!accepted} 
            onClick={handleAccept}
          >
            <i className='bx bx-check-circle'></i>Accept & Return
          </button>
        </div>
      </div>
      
      <Footer />
    </>
  );
}
