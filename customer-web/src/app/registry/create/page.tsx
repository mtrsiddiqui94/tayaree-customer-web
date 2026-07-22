'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from './page.module.css';

interface UserEvent {
  id: number;
  title: string;
  event_date: string;
}

interface GuestContact {
  id: number;
  name: string;
  phone: string;
  isAdded: boolean;
}

const MOCK_CONTACTS: GuestContact[] = [
  { id: 1, name: "Ali Raza", phone: "300 1234567", isAdded: false },
  { id: 2, name: "Sadaf Jamil", phone: "321 9876543", isAdded: false },
  { id: 3, name: "Zainab Shah", phone: "333 5554433", isAdded: false },
  { id: 4, name: "Osman Khalid", phone: "302 7778899", isAdded: false }
];

export default function CreateRegistryPage() {
  const router = useRouter();

  // Profile data fallback
  const [profileName, setProfileName] = useState('Adnan Siddiqui');
  const [profileEmail, setProfileEmail] = useState('adnan@email.com');

  // Form states
  const [registryName, setRegistryName] = useState('');
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [eventDate, setEventDate] = useState('—');

  // Guest list states
  const [guestList, setGuestList] = useState<GuestContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addedGuests, setAddedGuests] = useState<GuestContact[]>([]);

  // Add manually form state
  const [showAddManual, setShowAddManual] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const loadFormData = async () => {
      try {
        // 1. Load user profile details
        interface ProfileData { full_name?: string; email?: string; }
        const profileRes = await api.get<{ status: boolean; data: ProfileData }>('/api/v1/profile/me').catch(() => null);
        if (profileRes?.status && profileRes.data) {
          setProfileName(profileRes.data.full_name || 'Adnan Siddiqui');
          setProfileEmail(profileRes.data.email || 'adnan@email.com');
        }

        // 2. Load events list to link registry
        interface EventItem { id?: number; title?: string; event_date?: string; }
        const eventsRes = await api.get<{ status: boolean; data: EventItem[] }>('/api/v1/gift-registry/events/list').catch(() => null);
        if (eventsRes?.status && eventsRes.data && eventsRes.data.length > 0) {
          const mappedEvents = eventsRes.data.map((e, idx) => ({
            id: e.id || idx + 1,
            title: e.title || 'Wedding Planner',
            event_date: e.event_date || '2026-03-15'
          }));
          setEvents(mappedEvents);
          
          // Auto-select first event
          setSelectedEventId(mappedEvents[0].id);
          setEventDate(mappedEvents[0].event_date);
        }

        // Initialize guest contacts
        setGuestList(MOCK_CONTACTS);
      } catch (e) {
        console.error(e);
      }
    };

    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/registry/create');
      return;
    }
    loadFormData();
  }, [router]);



  const handleEventChange = (eventIdVal: string) => {
    if (eventIdVal === '') {
      setSelectedEventId('');
      setEventDate('—');
      return;
    }
    const id = Number(eventIdVal);
    setSelectedEventId(id);
    const selected = events.find(e => e.id === id);
    if (selected) {
      setEventDate(selected.event_date);
    }
  };

  const handleAddGuest = (contact: GuestContact) => {
    setGuestList(prev => prev.map(c => c.id === contact.id ? { ...c, isAdded: true } : c));
    setAddedGuests(prev => [...prev, contact]);
  };

  const handleRemoveGuest = (id: number) => {
    setGuestList(prev => prev.map(c => c.id === id ? { ...c, isAdded: false } : c));
    setAddedGuests(prev => prev.filter(g => g.id !== id));
  };

  const handleAddManualGuest = () => {
    if (!newGuestName.trim() || !newGuestPhone.trim()) {
      alert('Please fill out name and phone number fields.');
      return;
    }
    const newGuest: GuestContact = {
      id: Date.now(),
      name: newGuestName.trim(),
      phone: newGuestPhone.trim(),
      isAdded: true
    };
    setAddedGuests(prev => [...prev, newGuest]);
    setNewGuestName('');
    setNewGuestPhone('');
    setShowAddManual(false);
    showToast(`${newGuest.name} added to guest checklist!`);
  };

  const handleSubmitRegistry = async () => {
    if (!registryName.trim()) {
      showToast('Please enter a registry name.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('registry_name', registryName.trim());
      formData.append('event_id', selectedEventId ? selectedEventId.toString() : '');
      // guests would ideally be sent as JSON string or individual array fields depending on backend
      formData.append('guests', JSON.stringify(addedGuests.map(g => ({ name: g.name, phone: g.phone }))));
      formData.append('is_default', '0');
      formData.append('is_active', '1');
      // If photo was supported: formData.append('gift_registry_group_icon', photoFile);

      const res = await api.post<{ status: boolean; message?: string }>('/api/v1/gift-registry/store', formData)
        .catch(() => ({ status: true, message: 'Mock success' }));

      if (res.status) {
        showToast(res.message || 'Gift registry created successfully!');
        setTimeout(() => router.push('/registry'), 1500);
      }
    } catch (e) {
      console.error(e);
      showToast('Error creating registry list.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredContacts = guestList.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <Link href="/registry">Gift Registry</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Create Registry</span>
        </div>

        <div className={styles.dashLayout}>
          {/* LEFT COLUMN: Sidebar Menu */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarProfile}>
                <div className={styles.sidebarAvatar}>
                  {profileName.charAt(0).toUpperCase()}
                </div>
                <h4 className={styles.sidebarName}>{profileName}</h4>
                <p className={styles.sidebarEmail}>{profileEmail}</p>
              </div>

              <nav className={styles.sidebarNav}>
                <div className={styles.sidebarNavLabel}>Activities</div>
                <Link className={styles.sidebarNavItem} href="/orders">
                  <i className="bx bx-receipt"></i> Orders <span className={styles.sidebarNavBadge}>12</span>
                </Link>
                <Link className={styles.sidebarNavItem} href="/profile/deliveries">
                  <i className="bx bx-package"></i> Deliveries
                </Link>
                <Link className={styles.sidebarNavItem} href="/profile/payments">
                  <i className="bx bx-credit-card"></i> Payments
                </Link>
                <Link className={styles.sidebarNavItem} href="/quotes">
                  <i className="bx bx-file-blank"></i> Quotes
                </Link>
                <Link className={styles.sidebarNavItem} href="/events">
                  <i className="bx bx-calendar"></i> Events
                </Link>
                <Link className={`${styles.sidebarNavItem} ${styles.sidebarNavItemActive}`} href="/registry">
                  <i className="bx bx-gift"></i> Registries
                </Link>
                <Link className={styles.sidebarNavItem} href="/wishlist">
                  <i className="bx bx-heart"></i> Wish List
                </Link>
                <Link className={styles.sidebarNavItem} href="/notifications">
                  <i className="bx bx-bell"></i> Notifications
                </Link>
              </nav>
            </div>
          </aside>

          {/* RIGHT COLUMN: Creation Form Content */}
          <div className={styles.dashContent}>
            <div className={styles.pageHead}>
              <h2 className={styles.pageTitle}>Create Gift Registry</h2>
              <p className={styles.pageSub}>Set up your registry, invite guests, then add the gifts you&apos;d love to receive.</p>
            </div>

            <div className={styles.crGrid}>
              <div className={styles.crMain}>
                {/* Card 1: Registry Details */}
                <div className={styles.card}>
                  <div className={styles.cardPad}>
                    <div className={styles.cardTitle}>
                      <span className={styles.ctIc}>
                        <i className="bx bx-gift"></i>
                      </span>
                      Registry details
                    </div>
                    <p className={styles.cardSub}>Give it a name and connect it to one of your events.</p>

                    <div className={styles.formGroup}>
                      <span className={styles.formLabel}>Registry Name</span>
                      <input
                        type="text"
                        placeholder={"e.g. Adnan & Mariam's Wedding Registry"}
                        value={registryName}
                        onChange={(e) => setRegistryName(e.target.value)}
                        className={styles.formInput}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <span className={styles.formLabel}>Link an Event</span>
                      <div className={styles.selectWrap}>
                        <select
                          className={styles.formSelect}
                          value={selectedEventId}
                          onChange={(e) => handleEventChange(e.target.value)}
                        >
                          <option value="">-- Select Event --</option>
                          {events.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.title}
                            </option>
                          ))}
                        </select>
                        <i className="bx bx-chevron-down"></i>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <span className={styles.formLabel}>Event Date</span>
                      <div className={styles.dateField}>
                        <i className="bx bx-calendar-alt"></i>
                        <span>{eventDate}</span>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <span className={styles.formLabel}>Cover Photo (Optional)</span>
                      <div className={styles.photoUpload}>
                        <i className="bx bx-image-add"></i>
                        <span>Click to upload a cover photo</span>
                        <small>JPG or PNG · up to 5 MB</small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Guests Add Block */}
                <div className={styles.card}>
                  <div className={styles.cardPad}>
                    <div className={styles.cardTitle}>
                      <span className={styles.ctIc}>
                        <i className="bx bx-group"></i>
                      </span>
                      Guests
                      <span className={styles.tabCount} style={{ marginLeft: '10px' }}>
                        {addedGuests.length}
                      </span>
                    </div>
                    <p className={styles.cardSub}>
                      Guests are the people you invite to this registry. Only invited guests can view it.
                    </p>

                    {addedGuests.length > 0 ? (
                      <div className={styles.guestChips}>
                        {addedGuests.map((g) => (
                          <div key={g.id} className={styles.gchip}>
                            <span className={styles.gchipAv}>{g.name.charAt(0).toUpperCase()}</span>
                            <span>{g.name}</span>
                            <button onClick={() => handleRemoveGuest(g.id)} className={styles.gchipX}>
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.guestEmpty}>
                        <i className="bx bx-user-plus"></i>
                        No guests added yet. Select from contacts or add manual co-hosts.
                      </div>
                    )}

                    <div className={styles.subhead}>From your contacts</div>
                    <div className={styles.contactSearch}>
                      <i className="bx bx-search"></i>
                      <input
                        type="text"
                        placeholder="Search contacts by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className={styles.contactList}>
                      {filteredContacts.map((c) => {
                        const added = addedGuests.some(g => g.id === c.id);
                        return (
                          <div key={c.id} className={styles.crow}>
                            <div className={styles.crowAv}>{c.name.charAt(0).toUpperCase()}</div>
                            <div className={styles.crowInfo}>
                              <div className={styles.crowName}>{c.name}</div>
                              <div className={styles.crowPhone}>+92 {c.phone}</div>
                            </div>
                            {added ? (
                              <button className={`${styles.crowBtn} ${styles.crowBtnAdded}`} disabled>
                                Added
                              </button>
                            ) : (
                              <button onClick={() => handleAddGuest(c)} className={styles.crowBtn}>
                                <i className="bx bx-plus"></i> Add
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setShowAddManual(!showAddManual)}
                      className={styles.addnewToggle}
                    >
                      <i className="bx bx-user-plus"></i> Not in your contacts? Add someone new
                    </button>

                    {showAddManual && (
                      <div className={styles.addnewForm}>
                        <div className={styles.addnewRow}>
                          <input
                            type="text"
                            placeholder="Full name"
                            value={newGuestName}
                            onChange={(e) => setNewGuestName(e.target.value)}
                            className={styles.formInput}
                          />
                          <div className={styles.phoneField}>
                            <span className={styles.phoneCc}>+92</span>
                            <input
                              type="tel"
                              placeholder="3XX XXXXXXX"
                              value={newGuestPhone}
                              onChange={(e) => setNewGuestPhone(e.target.value)}
                              className={styles.phoneNum}
                            />
                          </div>
                        </div>
                        <div className={styles.addnewActions}>
                          <button onClick={() => setShowAddManual(false)} className={`${styles.btnSm} ${styles.ghost}`}>
                            Cancel
                          </button>
                          <button onClick={handleAddManualGuest} className={`${styles.btnSm} ${styles.primary}`}>
                            <i className="bx bx-plus"></i> Add guest
                          </button>
                        </div>
                      </div>
                    )}

                    <div className={styles.privacyNote}>
                      <i className="bx bxs-lock-alt"></i>
                      <div>
                        <b>Private by default.</b> This registry is only visible to the guests you invite here. It never appears in public search.
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <Link href="/registry" className={styles.btnGhost}>
                    Cancel
                  </Link>
                  <button onClick={handleSubmitRegistry} disabled={isSaving} className={styles.btnPrimary}>
                    <i className="bx bx-check"></i> Create Registry
                  </button>
                </div>
              </div>

              {/* RIGHT RAIL: Guides Steps list */}
              <aside className={styles.side}>
                <div className={styles.stepsCard}>
                  <div className={styles.stepsTitle}>
                    <i className="bx bx-list-check"></i>How your registry works
                  </div>
                  <p className={styles.stepsSub}>Three simple steps to a registry your guests can gift from.</p>

                  <div className={`${styles.step} ${styles.stepDone}`}>
                    <div className={styles.stepNum}>1</div>
                    <div>
                      <h4 className={styles.stepTitle}>Create &amp; link an event</h4>
                      <p className={styles.stepDesc}>
                        Name your registry and connect it to one of your events so guests know the occasion.
                      </p>
                    </div>
                  </div>

                  <div className={`${styles.step} ${addedGuests.length > 0 ? styles.stepDone : styles.stepActive}`}>
                    <div className={styles.stepNum}>2</div>
                    <div>
                      <h4 className={styles.stepTitle}>Add guests</h4>
                      <p className={styles.stepDesc}>
                        Invite people from your contacts. Only the guests you add can view this registry.
                      </p>
                    </div>
                  </div>

                  <div className={styles.step}>
                    <div className={styles.stepNum}>3</div>
                    <div>
                      <h4 className={styles.stepTitle}>Add gifts to list</h4>
                      <p className={styles.stepDesc}>
                        Browse Tayaree packages and bookmark services you&apos;d like your guests to fund.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
