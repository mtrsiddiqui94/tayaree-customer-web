'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';
import styles from '../planners.module.css';

interface EventType {
  id: number;
  name: string;
  icon?: string;
}

function CreateEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEdit = !!editId;

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
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
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadEventTypes();
    if (isEdit) {
      loadEventDetails();
    }
  }, [isEdit, editId]);

  async function loadEventTypes() {
    try {
      const res = await api.get<{ status: boolean; data: any[] }>(ENDPOINTS.EVENTS_TYPES).catch(() => null);
      if (res?.data) {
        setEventTypes(res.data.map(t => ({
          id: t.id,
          name: t.name,
          icon: t.icon || '✨'
        })));
      } else {
        setEventTypes([
          { id: 1, name: 'Wedding', icon: '💍' },
          { id: 2, name: 'Mehndi', icon: '🪕' },
          { id: 3, name: 'Birthday', icon: '🎂' },
          { id: 4, name: 'Corporate', icon: '🏢' },
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadEventDetails() {
    try {
      setIsLoading(true);
      const res = await api.get<{ status: boolean; data: any }>(ENDPOINTS.EVENT_DETAIL(editId as string));
      if (res.data) {
        setEventTitle(res.data.title || '');
        setEventType(res.data.event_type || 'Wedding');
        setGuestCount(res.data.guest_count || 150);
        setExactDate(res.data.event_date || '2026-03-15');
        if (res.data.budget) {
          if (res.data.budget.includes('–')) {
            setBudgetType('standard');
            setBudgetRange(res.data.budget);
          } else {
            setBudgetType('custom');
            setCustomBudgetValue(res.data.budget.replace(/\D/g, ''));
          }
        }
        setEventCity(res.data.city || 'Lahore');
        setEventDescription(res.data.description || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const handleNext = () => currentStep < 4 && setCurrentStep(prev => (prev + 1) as 1|2|3|4);
  const handleBack = () => currentStep > 1 && setCurrentStep(prev => (prev - 1) as 1|2|3|4);

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
        event_name: eventTitle.trim(),
        event_type_id: eventTypes.find(t => t.name === eventType)?.id || 1,
        event_date: finalDate,
        guest_count: guestCount,
        budget_type: budgetType === 'standard' ? 'fixed_total' : 'per_head',
        budget_amount: budgetType === 'custom' ? Number(customBudgetValue) : null,
        city: eventCity,
        notes: eventDescription || null
      };

      let res;
      if (isEdit) {
        res = await api.put(ENDPOINTS.EVENT_DETAIL(editId as string), payload);
      } else {
        res = await api.post(ENDPOINTS.EVENTS_LIST, payload);
      }
      
      showToast(`Event ${isEdit ? 'updated' : 'created'} successfully!`);
      setTimeout(() => router.push('/events'), 1500);
    } catch (err) {
      console.error(err);
      showToast(`Error ${isEdit ? 'updating' : 'creating'} event.`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '100px 0' }}><i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i></div>;
  }

  return (
    <>
      <main className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link><span className={styles.sep}>/</span>
          <Link href="/events">Events</Link><span className={styles.sep}>/</span>
          <span className={styles.current}>{isEdit ? 'Edit Event' : 'Create Event'}</span>
        </div>

        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>{isEdit ? 'Edit Event Planner' : 'Create Event Planner'}</h1>
          <p className={styles.pageSub}>Configure event details to initialize a customized checklist tracker.</p>
        </div>

        <div className={styles.stepbar}>
          <div onClick={() => setCurrentStep(1)} className={`${styles.sbItem} ${currentStep === 1 ? styles.sbItemActive : currentStep > 1 ? styles.sbItemDone : ''}`}>
            <div className={styles.sbDot}>1</div>
            <div className={styles.sbText}>
              <div className={styles.sbName}>Event Type</div>
              <div className={styles.sbSub}>{eventType}</div>
            </div>
          </div>
          <div className={`${styles.sbConn} ${currentStep > 1 ? styles.sbConnDone : ''}`}></div>

          <div onClick={() => setCurrentStep(2)} className={`${styles.sbItem} ${currentStep === 2 ? styles.sbItemActive : currentStep > 2 ? styles.sbItemDone : ''}`}>
            <div className={styles.sbDot}>2</div>
            <div className={styles.sbText}>
              <div className={styles.sbName}>Date &amp; Schedule</div>
              <div className={styles.sbSub}>{eventDateType === 'exact' ? exactDate : approxMonth}</div>
            </div>
          </div>
          <div className={`${styles.sbConn} ${currentStep > 2 ? styles.sbConnDone : ''}`}></div>

          <div onClick={() => setCurrentStep(3)} className={`${styles.sbItem} ${currentStep === 3 ? styles.sbItemActive : currentStep > 3 ? styles.sbItemDone : ''}`}>
            <div className={styles.sbDot}>3</div>
            <div className={styles.sbText}>
              <div className={styles.sbName}>Guests &amp; Budget</div>
              <div className={styles.sbSub}>{guestCount} guests</div>
            </div>
          </div>
          <div className={`${styles.sbConn} ${currentStep > 3 ? styles.sbConnDone : ''}`}></div>

          <div onClick={() => setCurrentStep(4)} className={`${styles.sbItem} ${currentStep === 4 ? styles.sbItemActive : ''}`}>
            <div className={styles.sbDot}>4</div>
            <div className={styles.sbText}>
              <div className={styles.sbName}>Final Details</div>
              <div className={styles.sbSub}>City &amp; Title</div>
            </div>
          </div>
        </div>

        {currentStep === 1 && (
          <div className={styles.wizCard}>
            <h3 className={styles.wizQ}>What type of event are you planning?</h3>
            <span className={styles.wizLabel}>Event Categories</span>
            <div className={styles.typeGrid}>
              {eventTypes.map((t) => (
                <div key={t.id} onClick={() => setEventType(t.name)} className={`${styles.typeTile} ${eventType === t.name ? styles.typeTileSelected : ''}`}>
                  <span className={styles.typeIcon}>{t.icon}</span>
                  <span className={styles.typeName}>{t.name}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={handleNext} className={`${styles.btn} ${styles.btnPrimary}`}>Continue <i className="bx bx-right-arrow-alt"></i></button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles.wizCard}>
            <h3 className={styles.wizQ}>When is your event scheduled?</h3>
            <div className={styles.segCtrl}>
              <button onClick={() => setEventDateType('exact')} className={`${styles.segTab} ${eventDateType === 'exact' ? styles.segTabActive : ''}`}>Exact Date</button>
              <button onClick={() => setEventDateType('approx')} className={`${styles.segTab} ${eventDateType === 'approx' ? styles.segTabActive : ''}`}>Approximate Month</button>
            </div>
            {eventDateType === 'exact' ? (
              <div className={styles.twoCol}>
                <div>
                  <span className={styles.wizLabel}>Event Calendar Date</span>
                  <input type="date" value={exactDate} onChange={(e) => setExactDate(e.target.value)} className={styles.wizInput} />
                </div>
              </div>
            ) : (
              <div>
                <span className={styles.wizLabel}>Select Month</span>
                <div className={styles.chipsRow}>
                  {['Mar 2026', 'Apr 2026', 'May 2026'].map((m) => (
                    <button key={m} onClick={() => setApproxMonth(m)} className={`${styles.pchip} ${approxMonth === m ? styles.pchipSelected : ''}`}>{m}</button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button onClick={handleBack} className={styles.btn}><i className="bx bx-left-arrow-alt"></i> Back</button>
              <button onClick={handleNext} className={`${styles.btn} ${styles.btnPrimary}`}>Continue <i className="bx bx-right-arrow-alt"></i></button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className={styles.wizCard}>
            <h3 className={styles.wizQ}>Event scale &amp; Budget estimator</h3>
            <div className={styles.twoCol}>
              <div>
                <span className={styles.wizLabel}>Expected Guest Count</span>
                <div className={styles.inputRow}>
                  <div className={styles.inputRowMain}>
                    <input type="number" value={guestCount} onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)} />
                  </div>
                </div>
              </div>
              <div>
                <span className={styles.wizLabel}>Budget Configuration</span>
                <div onClick={() => setBudgetType('standard')} className={`${styles.budgetCard} ${budgetType === 'standard' ? styles.budgetCardActive : ''}`}>
                  <div className={styles.budgetHead}>
                    <div className={styles.budgetTitle}>Standard Packages</div>
                  </div>
                  <select value={budgetRange} onChange={(e) => setBudgetRange(e.target.value)} className={styles.selectField} style={{ width: '100%' }} disabled={budgetType !== 'standard'}>
                    <option value="PKR 200,000 – 500,000">PKR 200,000 – 500,000</option>
                    <option value="PKR 500,000 – 1,000,000">PKR 500,000 – 1,000,000</option>
                    <option value="PKR 1,000,000 – 2,000,000">PKR 1,000,000 – 2,000,000</option>
                  </select>
                </div>
                <div onClick={() => setBudgetType('custom')} className={`${styles.budgetCard} ${budgetType === 'custom' ? styles.budgetCardActive : ''}`}>
                  <div className={styles.budgetHead}>
                    <div className={styles.budgetTitle}>Custom Target Budget</div>
                  </div>
                  <div className={styles.budgetIn}>
                    <span>PKR</span>
                    <input type="number" value={customBudgetValue} onChange={(e) => setCustomBudgetValue(e.target.value)} disabled={budgetType !== 'custom'} />
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button onClick={handleBack} className={styles.btn}><i className="bx bx-left-arrow-alt"></i> Back</button>
              <button onClick={handleNext} className={`${styles.btn} ${styles.btnPrimary}`}>Continue <i className="bx bx-right-arrow-alt"></i></button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className={styles.wizCard}>
            <h3 className={styles.wizQ}>Add final event details</h3>
            <span className={styles.wizLabel}>Event Title*</span>
            <input type="text" placeholder="e.g. Adnan &amp; Ayesha Mehndi Night" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className={styles.wizInput} required />
            <div className={styles.twoCol} style={{ marginTop: '16px' }}>
              <div>
                <span className={styles.wizLabel}>Event Location City</span>
                <select value={eventCity} onChange={(e) => setEventCity(e.target.value)} className={styles.selectField} style={{ width: '100%', height: '48px' }}>
                  <option value="Karachi">Karachi</option>
                  <option value="Lahore">Lahore</option>
                  <option value="Islamabad">Islamabad</option>
                </select>
              </div>
              <div>
                <span className={styles.wizLabel}>Event Notes (Optional)</span>
                <input type="text" placeholder="e.g. Stage decoration is priority" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} className={styles.wizInput} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button onClick={handleBack} className={styles.btn}><i className="bx bx-left-arrow-alt"></i> Back</button>
              <button onClick={handleSubmit} disabled={isSaving} className={`${styles.btn} ${styles.btnPrimary}`}>
                {isSaving ? 'Saving...' : (isEdit ? 'Update Event Planner' : 'Initialize Event Planner')}
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default function CreateEventPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px 0' }}><i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i></div>}>
        <CreateEventForm />
      </Suspense>
      <Footer />
    </>
  );
}
