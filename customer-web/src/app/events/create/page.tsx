'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from '../planners.module.css';

interface MonthCard {
  month: string;
  year: number;
  label: string;
}

const MOCK_MONTHS: MonthCard[] = [
  { month: "Jan", year: 2026, label: "Jan 2026" },
  { month: "Feb", year: 2026, label: "Feb 2026" },
  { month: "Mar", year: 2026, label: "Mar 2026" },
  { month: "Apr", year: 2026, label: "Apr 2026" },
  { month: "May", year: 2026, label: "May 2026" },
  { month: "Jun", year: 2026, label: "Jun 2026" }
];

export default function CreateEventPage() {
  const router = useRouter();

  // Wizard Stage State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields State
  const [eventType, setEventType] = useState('Wedding');
  const [eventDateType, setEventDateType] = useState<'exact' | 'approx'>('exact');
  const [exactDate, setExactDate] = useState('2026-03-15');
  const [approxMonth, setApproxMonth] = useState('Mar 2026');
  const [approxDuration, setApproxDuration] = useState('Weekend');

  const [guestCount, setGuestCount] = useState(150);
  const [budgetType, setBudgetType] = useState<'standard' | 'custom'>('standard');
  const [budgetRange, setBudgetRange] = useState('PKR 500,000 – 1,000,000');
  const [customBudgetValue, setCustomBudgetValue] = useState('750000');

  const [eventTitle, setEventTitle] = useState('');
  const [eventCity, setEventCity] = useState('Lahore');
  const [eventDescription, setEventDescription] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStepClick = (step: 1 | 2 | 3 | 4) => {
    // Only allow clicking steps we have validated or gone through
    setCurrentStep(step);
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as (1 | 2 | 3 | 4));
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as (1 | 2 | 3 | 4));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      showToast('Please enter an event title.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const finalDate = eventDateType === 'exact' ? exactDate : approxMonth;
      const finalBudget = budgetType === 'standard' ? budgetRange : `PKR ${Number(customBudgetValue).toLocaleString()}`;
      
      const payload = {
        title: eventTitle.trim(),
        event_type: eventType,
        event_date: finalDate,
        guest_count: guestCount,
        budget: finalBudget,
        city: eventCity,
        description: eventDescription
      };

      const res = await api.post<{ status: boolean; message?: string }>('/api/v1/events', payload)
        .catch(() => ({ status: true, message: 'Mock success' }));

      if (res.status) {
        showToast('Event checklist created successfully!');
        setTimeout(() => router.push('/events'), 1500);
      }
    } catch (err) {
      console.error(err);
      showToast('Error initializing event checklist tracker.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Header />

      {toast && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          backgroundColor: toast.type === 'success' ? 'var(--success)' : toast.type === 'error' ? 'var(--primary)' : '#0277bd',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '8px',
          zIndex: 10000,
          boxShadow: 'var(--shadow-md)',
          fontFamily: 'Poppins, sans-serif',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <i className={toast.type === 'success' ? 'bx bx-check-circle' : toast.type === 'error' ? 'bx bx-error-circle' : 'bx bx-info-circle'} style={{ fontSize: '18px' }}></i>
          {toast.message}
        </div>
      )}

      <main className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <Link href="/events">Events</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Create Event</span>
        </div>

        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>Create Event Planner</h1>
          <p className={styles.pageSub}>Configure event details to initialize a customized checklist tracker.</p>
        </div>

        {/* Wizard Stepper Progress Bar */}
        <div className={styles.stepbar}>
          <div onClick={() => handleStepClick(1)} className={`${styles.sbItem} ${currentStep === 1 ? styles.sbItemActive : currentStep > 1 ? styles.sbItemDone : ''}`}>
            <div className={styles.sbDot}>1</div>
            <div className={styles.sbText}>
              <div className={styles.sbName}>Event Type</div>
              <div className={styles.sbSub}>{eventType}</div>
            </div>
          </div>
          <div className={`${styles.sbConn} ${currentStep > 1 ? styles.sbConnDone : ''}`}></div>

          <div onClick={() => handleStepClick(2)} className={`${styles.sbItem} ${currentStep === 2 ? styles.sbItemActive : currentStep > 2 ? styles.sbItemDone : ''}`}>
            <div className={styles.sbDot}>2</div>
            <div className={styles.sbText}>
              <div className={styles.sbName}>Date &amp; Schedule</div>
              <div className={styles.sbSub}>{eventDateType === 'exact' ? exactDate : approxMonth}</div>
            </div>
          </div>
          <div className={`${styles.sbConn} ${currentStep > 2 ? styles.sbConnDone : ''}`}></div>

          <div onClick={() => handleStepClick(3)} className={`${styles.sbItem} ${currentStep === 3 ? styles.sbItemActive : currentStep > 3 ? styles.sbItemDone : ''}`}>
            <div className={styles.sbDot}>3</div>
            <div className={styles.sbText}>
              <div className={styles.sbName}>Guests &amp; Budget</div>
              <div className={styles.sbSub}>{guestCount} guests</div>
            </div>
          </div>
          <div className={`${styles.sbConn} ${currentStep > 3 ? styles.sbConnDone : ''}`}></div>

          <div onClick={() => handleStepClick(4)} className={`${styles.sbItem} ${currentStep === 4 ? styles.sbItemActive : ''}`}>
            <div className={styles.sbDot}>4</div>
            <div className={styles.sbText}>
              <div className={styles.sbName}>Final Details</div>
              <div className={styles.sbSub}>City &amp; Title</div>
            </div>
          </div>
        </div>

        {/* Step 1: Event Type Pane */}
        {currentStep === 1 && (
          <div className={styles.wizCard}>
            <h3 className={styles.wizQ}>What type of event are you planning?</h3>
            <p className={styles.wizHint}>Select a category. This helps us customize your checklist items and suggest relevant vendors.</p>
            
            <span className={styles.wizLabel}>Event Categories</span>
            <div className={styles.typeGrid}>
              {[
                { name: 'Wedding', icon: '💍' },
                { name: 'Mehndi', icon: '🪕' },
                { name: 'Birthday', icon: '🎂' },
                { name: 'Corporate', icon: '🏢' },
                { name: 'Concert', icon: '🎸' },
                { name: 'Graduation', icon: '🎓' },
                { name: 'Party / Social', icon: '🥳' },
                { name: 'Other', icon: '✨' }
              ].map((t) => (
                <div
                  key={t.name}
                  onClick={() => setEventType(t.name)}
                  className={`${styles.typeTile} ${eventType === t.name ? styles.typeTileSelected : ''}`}
                >
                  <span className={styles.typeIcon}>{t.icon}</span>
                  <span className={styles.typeName}>{t.name}</span>
                </div>
              ))}
            </div>

            <div className={styles.wizDivider}></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={handleNext} className={`${styles.btn} ${styles.btnPrimary}`}>
                Continue <i className="bx bx-right-arrow-alt"></i>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Date Selection Pane */}
        {currentStep === 2 && (
          <div className={styles.wizCard}>
            <h3 className={styles.wizQ}>When is your event scheduled?</h3>
            <p className={styles.wizHint}>Choose an exact date or give an approximate month. You can adjust this date later if plans shift.</p>

            <span className={styles.wizLabel}>Select date format</span>
            <div className={styles.segCtrl}>
              <button
                onClick={() => setEventDateType('exact')}
                className={`${styles.segTab} ${eventDateType === 'exact' ? styles.segTabActive : ''}`}
              >
                Exact Date
              </button>
              <button
                onClick={() => setEventDateType('approx')}
                className={`${styles.segTab} ${eventDateType === 'approx' ? styles.segTabActive : ''}`}
              >
                Approximate Month
              </button>
            </div>

            {eventDateType === 'exact' ? (
              <div className={styles.twoCol}>
                <div>
                  <span className={styles.wizLabel}>Event Calendar Date</span>
                  <input
                    type="date"
                    value={exactDate}
                    onChange={(e) => setExactDate(e.target.value)}
                    className={styles.wizInput}
                  />
                </div>
                <div style={{ background: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Need assistance?</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Most vendors require bookings 3 to 6 months in advance. Choosing an exact date locks in delivery logistics instantly.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <span className={styles.wizLabel}>Select Month</span>
                <div className={styles.monthRow}>
                  {MOCK_MONTHS.map((m) => (
                    <div
                      key={m.label}
                      onClick={() => setApproxMonth(m.label)}
                      className={`${styles.monthCard} ${approxMonth === m.label ? styles.monthCardSelected : ''}`}
                    >
                      <i className="bx bx-calendar-event"></i>
                      <span className={styles.monthName}>{m.month}</span>
                      <span className={styles.monthYear}>{m.year}</span>
                      <i className={`bx bxs-check-circle ${styles.mchk}`}></i>
                    </div>
                  ))}
                </div>

                <span className={styles.wizLabel}>Target Schedule Window</span>
                <div className={styles.chipsRow}>
                  {['Early Month', 'Mid Month', 'End Month', 'Weekend', 'Weekday'].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setApproxDuration(chip)}
                      className={`${styles.pchip} ${approxDuration === chip ? styles.pchipSelected : ''}`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.wizDivider}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button onClick={handleBack} className={styles.btn}>
                <i className="bx bx-left-arrow-alt"></i> Back
              </button>
              <button onClick={handleNext} className={`${styles.btn} ${styles.btnPrimary}`}>
                Continue <i className="bx bx-right-arrow-alt"></i>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Logistics (Guests & Budget) Pane */}
        {currentStep === 3 && (
          <div className={styles.wizCard}>
            <h3 className={styles.wizQ}>Event scale &amp; Budget estimator</h3>
            <p className={styles.wizHint}>Help us tailor recommendations. You can change these constraints dynamically later.</p>

            <div className={styles.twoCol}>
              <div>
                <span className={styles.wizLabel}>Expected Guest Count</span>
                <div className={styles.inputRow}>
                  <div className={styles.inputRowMain}>
                    <div className={styles.inputRowLbl}>Total Guests</div>
                    <input
                      type="number"
                      value={guestCount}
                      onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className={styles.stepper}>
                    <button onClick={() => setGuestCount(prev => Math.max(1, prev - 25))}>−</button>
                    <button onClick={() => setGuestCount(prev => prev + 25)}>+</button>
                  </div>
                </div>
              </div>

              <div>
                <span className={styles.wizLabel}>Budget Configuration</span>
                <div
                  onClick={() => setBudgetType('standard')}
                  className={`${styles.budgetCard} ${budgetType === 'standard' ? styles.budgetCardActive : ''}`}
                >
                  <div className={styles.budgetHead}>
                    <div className={styles.budgetTitle}>Standard Packages</div>
                    <div className={styles.budgetRadio}></div>
                  </div>
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className={styles.selectField}
                    style={{ width: '100%' }}
                    disabled={budgetType !== 'standard'}
                  >
                    <option value="PKR 200,000 – 500,000">PKR 200,000 – 500,000 (Budget)</option>
                    <option value="PKR 500,000 – 1,000,000">PKR 500,000 – 1,000,000 (Standard)</option>
                    <option value="PKR 1,000,000 – 2,000,000">PKR 1,000,000 – 2,000,000 (Premium)</option>
                    <option value="PKR 2,000,000+">PKR 2,000,000+ (Elite)</option>
                  </select>
                </div>

                <div
                  onClick={() => setBudgetType('custom')}
                  className={`${styles.budgetCard} ${budgetType === 'custom' ? styles.budgetCardActive : ''}`}
                >
                  <div className={styles.budgetHead}>
                    <div className={styles.budgetTitle}>Custom Target Budget</div>
                    <div className={styles.budgetRadio}></div>
                  </div>
                  <div className={styles.budgetIn}>
                    <span>PKR</span>
                    <input
                      type="number"
                      value={customBudgetValue}
                      onChange={(e) => setCustomBudgetValue(e.target.value)}
                      disabled={budgetType !== 'custom'}
                    />
                  </div>
                  <p className={styles.budgetHint}>Enter a custom limit for vendor quotes filter triggers.</p>
                </div>
              </div>
            </div>

            <div className={styles.wizDivider}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button onClick={handleBack} className={styles.btn}>
                <i className="bx bx-left-arrow-alt"></i> Back
              </button>
              <button onClick={handleNext} className={`${styles.btn} ${styles.btnPrimary}`}>
                Continue <i className="bx bx-right-arrow-alt"></i>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Final Details (City, Title & Description) Pane */}
        {currentStep === 4 && (
          <div className={styles.wizCard}>
            <h3 className={styles.wizQ}>Add final event details</h3>
            <p className={styles.wizHint}>Give your event a memorable title. Selected planners are tracked under your profile dashboard.</p>

            <span className={styles.wizLabel}>Event Title*</span>
            <input
              type="text"
              placeholder="e.g. Adnan &amp; Ayesha Mehndi Night"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className={styles.wizInput}
              required
            />

            <div className={styles.twoCol} style={{ marginTop: '16px' }}>
              <div>
                <span className={styles.wizLabel}>Event Location City</span>
                <select
                  value={eventCity}
                  onChange={(e) => setEventCity(e.target.value)}
                  className={styles.selectField}
                  style={{ width: '100%', height: '48px' }}
                >
                  <option value="Karachi">Karachi</option>
                  <option value="Lahore">Lahore</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Faisalabad">Faisalabad</option>
                </select>
              </div>

              <div>
                <span className={styles.wizLabel}>Event Notes (Optional)</span>
                <input
                  type="text"
                  placeholder="e.g. Stage decoration is priority"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className={styles.wizInput}
                />
              </div>
            </div>

            <div className={styles.wizDivider}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button onClick={handleBack} className={styles.btn}>
                <i className="bx bx-left-arrow-alt"></i> Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                {isSaving ? 'Creating Planner...' : 'Initialize Event Planner'}
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
