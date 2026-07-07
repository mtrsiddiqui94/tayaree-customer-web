'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from './planners.module.css';

interface EventPlanner {
  id: number;
  title: string;
  eventType: string;
  eventDate: string;
  guestCount: number;
  budget: string;
  progressPercentage: number;
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventPlanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/events');
      return;
    }
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ status: boolean; data: any[] }>('/api/v1/events')
        .catch(() => ({ status: false, data: [] }));

      const parsed: EventPlanner[] = (res.data || []).map((ev: any) => ({
        id: ev.id,
        title: ev.title || 'unset',
        eventType: ev.event_type || 'unset',
        eventDate: ev.event_date || 'unset',
        guestCount: ev.guest_count || 0,
        budget: ev.budget || '0',
        progressPercentage: ev.progress_percentage || 20,
      }));

      if (parsed.length === 0) {
        // Fallback mockup events to test tracking checklists
        const mockup: EventPlanner[] = [
          {
            id: 1,
            title: 'Adnan & Ayesha Wedding Celebration',
            eventType: 'Wedding',
            eventDate: '28 December 2026',
            guestCount: 250,
            budget: 'Rs. 750,000',
            progressPercentage: 45,
          },
          {
            id: 2,
            title: 'Anas Graduation Party Dinner',
            eventType: 'Party',
            eventDate: '15 September 2026',
            guestCount: 50,
            budget: 'Rs. 120,000',
            progressPercentage: 80,
          }
        ];
        setEvents(mockup);
      } else {
        setEvents(parsed);
      }
    } catch (e) {
      showToast('Error loading events.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event planner?')) return;
    try {
      await api.delete(`/api/v1/events/${id}`);
      showToast('Event planner deleted successfully.');
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      // offline fallback
      setEvents(prev => prev.filter(e => e.id !== id));
      showToast('Deleted locally.');
    }
  };

  return (
    <>
      <Header />

      {/* Toast Alert */}
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
          <span className={styles.current}>Events Portfolio</span>
        </div>

        <div className={styles.pageHead}>
          <div>
            <h1 className={styles.pageTitle}>My Event Planners</h1>
            <p className={styles.pageSub}>Create checklists, manage budgets, and track service vendor bookings.</p>
          </div>
          <Link href="/events/create" className={`${styles.btn} ${styles.btnPrimary}`}>
            <i className="bx bx-plus"></i> Create Planner
          </Link>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
          </div>
        ) : (
          <div className={styles.grid}>
            {events.map((ev) => (
              <div key={ev.id} className={styles.card}>
                <div className={styles.cardBanner}>
                  <i className="bx bx-calendar-star"></i>
                </div>
                <div className={styles.cardInner}>
                  <h3 className={styles.cardTitle}>{ev.title}</h3>
                  <div className={styles.cardMeta}>
                    <i className="bx bx-calendar"></i>
                    <span>{ev.eventDate}</span>
                  </div>
                  <div className={styles.cardMeta}>
                    <i className="bx bx-group"></i>
                    <span>{ev.guestCount} Guests</span>
                  </div>
                  <div className={styles.cardMeta}>
                    <i className="bx bx-wallet"></i>
                    <span>Budget: {ev.budget}</span>
                  </div>

                  <div className={styles.progressContainer}>
                    <div className={styles.progressLabel}>
                      <span>Checklist Completion</span>
                      <span>{ev.progressPercentage}%</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${ev.progressPercentage}%` }}></div>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button onClick={() => handleDeleteEvent(ev.id)} className={`${styles.btn} style.btnGhost`} style={{ color: 'var(--primary)' }}>
                      <i className="bx bx-trash"></i> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
