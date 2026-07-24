'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import styles from './page.module.css';

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  
  // Form State
  const [eventName, setEventName] = useState('');
  const [eventTypeId, setEventTypeId] = useState('');
  const [dateMode, setDateMode] = useState<'specific' | 'flexible'>('specific');
  const [dateFlexibility, setDateFlexibility] = useState<'exact' | '1_day' | '2_days'>('1_day');
  const [eventDate, setEventDate] = useState(''); // simplified date
  const [guests, setGuests] = useState(200);
  const [budgetMode, setBudgetMode] = useState<'perhead' | 'fixed'>('perhead');
  const [budgetAmount, setBudgetAmount] = useState('1500');
  const [notes, setNotes] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  useEffect(() => {
    async function loadTypes() {
      const res = await api.safeCall(() => api.get<any>('/api/v1/events/types'));
      if (res.success && res.data?.data) {
        setEventTypes(res.data.data);
      } else {
        setEventTypes([
          { id: '1', name: 'Wedding', icon: '💍' },
          { id: '2', name: 'Birthday', icon: '🎂' },
          { id: '3', name: 'Corporate', icon: '🏢' },
          { id: '4', name: 'Engagement', icon: '💑' }
        ]);
      }
    }
    loadTypes();
  }, []);

  const handleNext = async () => {
    // Perform strict client-side validation
    if (!eventName.trim()) {
      showToast('Please enter an event name.');
      return;
    }
    if (!eventTypeId) {
      showToast('Please select an event type.');
      return;
    }
    if (dateMode === 'specific' && !eventDate) {
      showToast('Please select an event date.');
      return;
    }
    if (!guests || guests <= 0) {
      showToast('Please enter a valid guest count.');
      return;
    }

    setIsSubmitting(true);
    const cleanBudget = parseFloat(budgetAmount.replace(/,/g, ''));
    const payload: any = {
      event_name: eventName.trim(),
      event_type_id: parseInt(eventTypeId, 10),
      event_date: eventDate || null,
      guest_count: guests ? parseInt(guests as any, 10) : null,
      budget_type: budgetMode === 'perhead' ? 'per_head' : 'fixed_total',
      budget_amount: cleanBudget > 0 ? cleanBudget : null,
      notes: notes.trim() || null,
      contact_phone: contactPhone.trim() || null
    };

    // Strip null/empty values matching Flutter _encode in event_repository_impl.dart
    const cleanPayload: any = {};
    Object.keys(payload).forEach(key => {
      if (payload[key] !== null && payload[key] !== undefined && payload[key] !== '') {
        cleanPayload[key] = payload[key];
      }
    });

    const res = await api.safeCall(() => api.post<any>('/api/v1/events', cleanPayload));
    
    if (res.success && (res.data?.data || res.data?.id || res.data?.status === true)) {
      showToast('Event created successfully!', 'success');
      setTimeout(() => {
        router.push('/events');
      }, 1000);
    } else {
      const errMsg = (!res.success && res.message) || 'Failed to create event.';
      showToast(`Error: ${errMsg}`, 'error');
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
  };

  return (
    <DashboardLayout breadcrumbTitle="Create Event">
      <div className={styles.pageHead}>
        <div className={styles.pageTitle}>Create Event</div>
        <div className={styles.pageSub}>4 quick steps — plan your event and send it out for vendor quotes.</div>
      </div>

      <div className={styles.stepbar}>
        <div className={`${styles.sbItem} ${step === 1 ? styles.sbItemActive : ''}`}>
          <div className={styles.sbDot}>1</div>
          <div className={styles.sbText}>
            <div className={styles.sbName}>Event details</div>
            <div className={styles.sbSub}>Date, guests, budget</div>
          </div>
        </div>
        <div className={styles.sbConn}></div>
        <div className={styles.sbItem}>
          <div className={styles.sbDot}>2</div>
          <div className={styles.sbText}>
            <div className={styles.sbName}>Menu</div>
            <div className={styles.sbSub}>Food & Drinks</div>
          </div>
        </div>
        <div className={styles.sbConn}></div>
        <div className={styles.sbItem}>
          <div className={styles.sbDot}>3</div>
          <div className={styles.sbText}>
            <div className={styles.sbName}>Services</div>
            <div className={styles.sbSub}>Venue, Decor</div>
          </div>
        </div>
        <div className={styles.sbConn}></div>
        <div className={styles.sbItem}>
          <div className={styles.sbDot}>4</div>
          <div className={styles.sbText}>
            <div className={styles.sbName}>Review</div>
            <div className={styles.sbSub}>Send request</div>
          </div>
        </div>
      </div>

      <div className={styles.wizCard}>
        <div className={`${styles.stepPane} ${step === 1 ? styles.stepPaneActive : ''}`}>
          <h1 className={styles.wizQ}>Event details</h1>
          <p className={styles.wizHint}>Name it, pick the type, choose your date, guest count, and budget — all in one place.</p>

          <label className={styles.wizLabel}>Event Name</label>
          <input
            className={styles.wizInput}
            placeholder="e.g. Ahmed's Wedding"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
          />

          <label className={styles.wizLabel}>Event Type</label>
          <div className={styles.typeGrid}>
            {eventTypes.map((t) => (
              <div
                key={t.id}
                className={`${styles.typeTile} ${eventTypeId === t.id ? styles.typeTileSelected : ''}`}
                onClick={() => setEventTypeId(t.id)}
              >
                <div className={styles.typeIcon}>{t.icon || '📅'}</div>
                <div className={styles.typeName}>{t.name}</div>
              </div>
            ))}
          </div>

          <div className={styles.wizDivider}></div>
          <div className={styles.twoCol}>
            {/* Date */}
            <div>
              <div className={styles.wizSubhead}>When is it?</div>
              <div className={styles.wizSubhint}>Pick a specific date or stay flexible for better deals.</div>
              <div className={styles.segCtrl} style={{ marginTop: '14px' }}>
                <div className={`${styles.segTab} ${dateMode === 'specific' ? styles.segTabActive : ''}`} onClick={() => setDateMode('specific')}>Specific Date</div>
                <div className={`${styles.segTab} ${dateMode === 'flexible' ? styles.segTabActive : ''}`} onClick={() => setDateMode('flexible')}>I'm Flexible</div>
              </div>

              {dateMode === 'specific' && (
                <div>
                  <input
                    type="date"
                    className={styles.wizInput}
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    style={{ marginBottom: '16px' }}
                  />
                  <div className={styles.secMini}><i className="bx bx-calendar-star"></i>Is your date flexible?</div>
                  <div className={styles.chipsRow}>
                    <div
                      className={`${styles.pchip} ${dateFlexibility === 'exact' ? styles.pchipSelected : ''}`}
                      onClick={() => setDateFlexibility('exact')}
                      style={{ cursor: 'pointer' }}
                    >
                      Exact day
                    </div>
                    <div
                      className={`${styles.pchip} ${dateFlexibility === '1_day' ? styles.pchipSelected : ''}`}
                      onClick={() => setDateFlexibility('1_day')}
                      style={{ cursor: 'pointer' }}
                    >
                      ± 1 day
                    </div>
                    <div
                      className={`${styles.pchip} ${dateFlexibility === '2_days' ? styles.pchipSelected : ''}`}
                      onClick={() => setDateFlexibility('2_days')}
                      style={{ cursor: 'pointer' }}
                    >
                      ± 2 days
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Guests + Budget */}
            <div>
              <div className={styles.wizSubhead}>Guests</div>
              <div className={styles.wizSubhint}>How many people are you expecting?</div>
              <div className={styles.inputRow} style={{ marginTop: '14px' }}>
                <div className={styles.inputRowMain}>
                  <div className={styles.inputRowLbl}>Total guests</div>
                  <input type="number" value={guests} onChange={(e) => setGuests(parseInt(e.target.value) || 0)} />
                </div>
                <div className={styles.stepper}>
                  <button onClick={() => setGuests(Math.max(0, guests - 25))}><i className="bx bx-minus"></i></button>
                  <button onClick={() => setGuests(guests + 25)}><i className="bx bx-plus"></i></button>
                </div>
              </div>

              <div className={styles.wizSubhead} style={{ marginTop: '26px' }}>Budget</div>
              <div className={styles.wizSubhint}>Set the pricing track that fits — vendors bid within your range.</div>
              <div style={{ marginTop: '14px' }}>
                <div className={`${styles.budgetCard} ${budgetMode === 'perhead' ? styles.budgetCardActive : ''}`} onClick={() => setBudgetMode('perhead')}>
                  <div className={styles.budgetHead}>
                    <div className={styles.budgetTitle}>Per Head Rate</div>
                    <div className={styles.budgetRadio}></div>
                  </div>
                  <div className={styles.budgetIn}>
                    <span>PKR</span>
                    <input value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} />
                  </div>
                  <div className={styles.budgetHint}>Great for venue + premium catering. We search within 10–20% of this range.</div>
                </div>
                
                <div className={`${styles.budgetCard} ${budgetMode === 'fixed' ? styles.budgetCardActive : ''}`} onClick={() => setBudgetMode('fixed')}>
                  <div className={styles.budgetHead}>
                    <div className={styles.budgetTitle}>Fixed Total</div>
                    <div className={styles.budgetRadio}></div>
                  </div>
                  <div className={styles.budgetIn}>
                    <span>PKR</span>
                    <input placeholder="e.g. 400,000" disabled={budgetMode !== 'fixed'} />
                  </div>
                  <div className={styles.budgetHint}>Good when you have a hard cap on the whole event.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.wizBar}>
        <div className={styles.wizBarInner}>
          <div className={styles.wizBarStep}>Step {step} of 4: <b>Event Details</b></div>
          <div className={styles.wizBarActions}>
            <button className={styles.btnBack} disabled={step === 1}>Back</button>
            <button className={styles.btnNext} onClick={handleNext} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save & Continue'}<i className="bx bx-right-arrow-alt"></i>
            </button>
          </div>
        </div>
      </div>

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
    </DashboardLayout>
  );
}
