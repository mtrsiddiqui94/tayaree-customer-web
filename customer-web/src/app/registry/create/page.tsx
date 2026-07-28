'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import styles from './page.module.css';

interface UserEvent {
  id: string;
  name: string;
  date: string;
  short: string;
}

interface Contact {
  name: string;
  phone: string;
}

const DEFAULT_EVENTS: UserEvent[] = [
  { id: "walima", name: "Walima Reception", date: "Friday, 20 June 2025", short: "Walima · 20 Jun 2025" },
  { id: "nikah", name: "Nikah Ceremony", date: "Saturday, 15 March 2025", short: "Nikah · 15 Mar 2025" },
  { id: "mehndi", name: "Mehndi Night", date: "Tuesday, 17 June 2025", short: "Mehndi · 17 Jun 2025" },
  { id: "bridal", name: "Bridal Shower", date: "Monday, 28 April 2025", short: "Bridal · 28 Apr 2025" }
];

const DEFAULT_CONTACTS: Contact[] = [
  { name: "Fatima Ahmed", phone: "+92 300 1234567" },
  { name: "Ali Raza", phone: "+92 301 2345678" },
  { name: "Hassan Malik", phone: "+92 302 3456789" },
  { name: "Amna Bashir", phone: "+92 303 4567890" },
  { name: "Bilal Khan", phone: "+92 304 5678901" },
  { name: "Sara Nadeem", phone: "+92 305 6789012" },
  { name: "Usman Tariq", phone: "+92 306 7890123" },
  { name: "Hina Qureshi", phone: "+92 307 8901234" },
  { name: "Zoya Iqbal", phone: "+92 308 9012345" },
  { name: "Danish Ali", phone: "+92 309 0123456" }
];

const CATALOG_PACKAGES = [
  { id: "pkg-1", name: "Silverspoon Gold Package", vendor: "Silver Spoon Catering", price: 2000, was: 2500, img: "https://images.unsplash.com/photo-1555244162-803834f70033?w=400&h=240&fit=crop", category: "catering", slug: "silverspoon-gold-package" },
  { id: "pkg-2", name: "Wedding Photography", vendor: "Pixel Perfect Studios", price: 85000, was: 95000, img: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400&h=240&fit=crop", category: "photography", slug: "premium-photography-video" },
  { id: "pkg-3", name: "Mehndi Decor Package", vendor: "Rang Barangi Events", price: 45000, was: 52000, img: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&h=240&fit=crop", category: "mehndi", slug: "bridal-mehndi-artist-package" },
  { id: "pkg-4", name: "Floral Arrangements", vendor: "Bloom & Bliss LHR", price: 28000, was: 0, img: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=240&fit=crop", category: "decor", slug: "floral-stage-hall-decor" },
  { id: "pkg-5", name: "Live Music Band", vendor: "Lahore Beats Co.", price: 60000, was: 0, img: "https://images.unsplash.com/photo-1571266028234-7dc0e9ea5e24?w=400&h=240&fit=crop", category: "music", slug: "live-sound-dj-lighting" },
  { id: "pkg-6", name: "Bridal Makeup & Hair", vendor: "Glam by Sana K.", price: 35000, was: 40000, img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=240&fit=crop", category: "beauty", slug: "bridal-hd-makeup-hair-styling" },
  { id: "pkg-7", name: "Grand Palace Hall Booking", vendor: "Grand Palace Banquet", price: 400000, was: 0, img: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=240&fit=crop", category: "venue", slug: "grand-palace-hall-booking" }
];

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatDatePretty(dStr: string): string {
  if (!dStr) return 'Friday, 20 June 2025';
  if (dStr.includes(',') && dStr.split(' ').length >= 3) return dStr;
  try {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dt = new Date(year, monthIdx, day);
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      if (months[monthIdx]) {
        return `${days[dt.getDay() || 0]}, ${day} ${months[monthIdx]} ${year}`;
      }
    }
  } catch (e) {}
  return dStr;
}

function CreateRegistryFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit') || searchParams.get('id');

  const fileInputRef = useRef<any>(null);
  const dateInputRef = useRef<any>(null);

  const [userEvents, setUserEvents] = useState<UserEvent[]>(DEFAULT_EVENTS);
  const [selectedEventId, setSelectedEventId] = useState<string>(DEFAULT_EVENTS[0].id);

  const [registryName, setRegistryName] = useState('');
  const [customDate, setCustomDate] = useState<string>('');
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [selectedCatalogItemIds, setSelectedCatalogItemIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadEvents() {
      try {
        const storedEvts = JSON.parse(localStorage.getItem('local_events') || '[]');
        if (Array.isArray(storedEvts) && storedEvts.length > 0) {
          const mapped: UserEvent[] = storedEvts.map((e: any) => ({
            id: String(e.id),
            name: e.event_name || 'Event',
            date: formatDatePretty(e.event_date),
            short: `${(e.event_name || 'Event').slice(0, 12)} · ${formatDatePretty(e.event_date).split(', ')[1] || 'Date'}`
          }));
          setUserEvents([...mapped, ...DEFAULT_EVENTS]);
          if (!editId) setSelectedEventId(mapped[0].id);
        }
      } catch (e) {}

      const res = await api.safeCall(() => api.get<any>('/api/v1/events'));
      if (res.success && res.data) {
        const apiList = Array.isArray(res.data) ? res.data : (res.data.data || []);
        if (apiList.length > 0) {
          const mapped: UserEvent[] = apiList.map((e: any) => ({
            id: String(e.id || e._id),
            name: e.event_name || 'Event',
            date: formatDatePretty(e.event_date),
            short: `${(e.event_name || 'Event').slice(0, 12)} · ${formatDatePretty(e.event_date).split(', ')[1] || 'Date'}`
          }));
          setUserEvents(mapped);
          if (!editId) setSelectedEventId(mapped[0].id);
        }
      }
    }

    loadEvents();
  }, [editId]);

  useEffect(() => {
    if (!editId) return;
    try {
      const localRegistries = JSON.parse(localStorage.getItem('local_registries') || '[]');
      let target = localRegistries.find((r: any) => String(r.id) === String(editId));

      if (!target && (editId === 'zara-ahmed' || editId === 'reg-1')) {
        target = {
          id: editId,
          name: "Zara & Ahmed's Wedding",
          date: "15 Mar 2025",
          occasion: "Nikah Ceremony",
          invitedGuests: ['Fatima Ahmed', 'Ali Raza', 'Hassan Malik', 'Amna Bashir']
        };
      }

      if (target) {
        if (target.name) setRegistryName(target.name);
        if (target.img) setCoverPhoto(target.img);
        if (Array.isArray(target.invitedGuests)) setSelectedGuests(target.invitedGuests);

        if (target.occasion) {
          const foundEvt = userEvents.find(e => e.name === target.occasion || e.date === target.date);
          if (foundEvt) setSelectedEventId(foundEvt.id);
        }

        const rawItems = localStorage.getItem(`reg_items_${editId}`);
        if (rawItems) {
          const parsed = JSON.parse(rawItems);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const matchedIds = CATALOG_PACKAGES.filter(cat =>
              parsed.some((i: any) => i.name === cat.name || i.slug === cat.slug)
            ).map(cat => cat.id);
            setSelectedCatalogItemIds(matchedIds);
          }
        }
      }
    } catch (e) {
      console.error('Error prefilling registry edit data:', e);
    }
  }, [editId, userEvents]);

  const activeEvent = userEvents.find(e => e.id === selectedEventId) || userEvents[0] || DEFAULT_EVENTS[0];
  const displayDate = customDate ? formatDatePretty(customDate) : activeEvent.date;

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (el) {
      if ('showPicker' in el) {
        try {
          (el as any).showPicker();
        } catch (e) {
          el.focus();
        }
      } else {
        el.focus();
      }
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setCoverPhoto(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddGuest = (name: string) => {
    if (!selectedGuests.includes(name)) {
      setSelectedGuests(prev => [...prev, name]);
    }
  };

  const handleRemoveGuest = (name: string) => {
    setSelectedGuests(prev => prev.filter(g => g !== name));
  };

  const handleAddNewContact = () => {
    if (!newName.trim()) return;
    const name = newName.trim();
    handleAddGuest(name);
    setNewName('');
    setNewPhone('');
    setShowAddNew(false);
  };

  const isStep1Done = registryName.trim().length > 0 || selectedEventId !== '';
  const isStep2Done = selectedGuests.length > 0;

  const filteredContacts = DEFAULT_CONTACTS.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    const finalName = registryName.trim() || `${activeEvent.name} Registry`;
    setIsSubmitting(true);

    const safeImg = (coverPhoto && coverPhoto.length > 50000)
      ? 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=200&fit=crop'
      : (coverPhoto || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=200&fit=crop');

    const chosenItems = CATALOG_PACKAGES.filter(p => selectedCatalogItemIds.includes(p.id)).map((p, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      name: p.name,
      vendor: p.vendor,
      price: p.price,
      was: p.was,
      qty: 1,
      img: p.img,
      status: 'available',
      category: p.category,
      slug: p.slug
    }));

    const targetRegId = editId || `reg-${Date.now()}`;
    const totalVal = chosenItems.reduce((acc, i) => acc + i.price, 0);

    const newReg = {
      id: targetRegId,
      name: finalName,
      emoji: '🎁',
      img: safeImg,
      date: displayDate,
      occasion: activeEvent.name,
      status: 'active',
      bucket: 'current',
      guests: selectedGuests.length || 1,
      invitedGuests: selectedGuests.length > 0 ? selectedGuests : ['Guest 1'],
      itemsList: chosenItems,
      items: chosenItems.length,
      purchased: 0,
      value: totalVal
    };

    localStorage.setItem(`reg_items_${targetRegId}`, JSON.stringify(chosenItems));

    try {
      const existing = JSON.parse(localStorage.getItem('local_registries') || '[]');
      if (editId) {
        const idx = existing.findIndex((r: any) => String(r.id) === String(editId));
        if (idx !== -1) {
          existing[idx] = { ...existing[idx], ...newReg };
        } else {
          existing.unshift(newReg);
        }
        localStorage.setItem('local_registries', JSON.stringify(existing));
      } else {
        localStorage.setItem('local_registries', JSON.stringify([newReg, ...existing]));
      }
    } catch (e) {
      console.warn('localStorage quota exceeded');
    }

    if (editId) {
      await api.safeCall(() => api.put(`/api/v1/gift-registry/${editId}`, {
        title: finalName,
        event_id: selectedEventId,
        event_date: displayDate,
        guests: selectedGuests
      }));
    } else {
      await api.safeCall(() => api.post('/api/v1/gift-registry', {
        title: finalName,
        event_id: selectedEventId,
        event_date: displayDate,
        guests: selectedGuests
      }));
    }

    setIsSubmitting(false);
    router.push(editId ? `/registry/${editId}` : `/registry`);
  };

  return (
    <DashboardLayout breadcrumbTitle={editId ? "Edit Registry" : "Create Registry"}>
      <div>
        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>{editId ? "Edit Gift Registry" : "Create Gift Registry"}</h1>
          <p className={styles.pageSub}>
            {editId ? "Update your registry details, invited guests, and gift items." : "Set up your registry, invite guests, then add the gifts you'd love to receive."}
          </p>
        </div>

        <div className={styles.crGrid}>
          <div className={styles.crMain}>
            <div className={styles.card}>
              <div className={styles.cardPad}>
                <div className={styles.cardTitle}>
                  <span className={styles.ctIc}><i className="bx bx-gift"></i></span>
                  Registry details
                </div>
                <div className={styles.cardSub}>Give it a name and connect it to one of your events.</div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Registry Name</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    value={registryName}
                    onChange={(e) => setRegistryName(e.target.value)}
                    placeholder="e.g. Adnan & Mariam's Wedding Registry"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Link an Event</label>
                  <div className={styles.selectWrap}>
                    <select
                      className={styles.formSelect}
                      value={selectedEventId}
                      onChange={(e) => {
                        setSelectedEventId(e.target.value);
                        setCustomDate('');
                      }}
                    >
                      {userEvents.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.name} — {e.date}
                        </option>
                      ))}
                    </select>
                    <i className="bx bx-chevron-down"></i>
                  </div>

                  <div className={styles.quickPills}>
                    {userEvents.map(e => (
                      <span
                        key={e.id}
                        className={`${styles.qpill} ${selectedEventId === e.id ? styles.qpillOn : ''}`}
                        onClick={() => {
                          setSelectedEventId(e.id);
                          setCustomDate('');
                        }}
                      >
                        {e.short}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Event Date</label>
                  <div className={styles.dateField} onClick={openDatePicker} style={{ cursor: 'pointer', position: 'relative' }}>
                    <i className="bx bx-calendar-alt"></i>
                    <span style={{ fontWeight: 700, flex: 1 }}>{displayDate}</span>
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        opacity: 0,
                        width: '100%',
                        height: '100%',
                        cursor: 'pointer'
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDatePicker();
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
                    >
                      Change Date
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Cover Photo <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>&#40;optional&#41;</span>
                  </label>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />

                  {coverPhoto ? (
                    <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', height: '150px', border: '1px solid var(--border)' }}>
                      <img
                        src={coverPhoto}
                        alt="Cover Preview"
                        onClick={() => setIsPreviewModalOpen(true)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                      />
                      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setIsPreviewModalOpen(true)}
                          style={{
                            background: 'rgba(0,0,0,0.65)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Preview full image"
                        >
                          <i className="bx bx-show" style={{ fontSize: '18px' }}></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCoverPhoto(null)}
                          style={{
                            background: 'rgba(0,0,0,0.65)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Remove photo"
                        >
                          <i className="bx bx-x" style={{ fontSize: '20px' }}></i>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.photoUpload} onClick={handleFileClick}>
                      <i className="bx bx-image-add"></i>
                      <span>Click to upload a cover photo</span>
                      <small>JPG or PNG · up to 5 MB</small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* GUESTS CARD */}
            <div className={styles.card}>
              <div className={styles.cardPad}>
                <div className={styles.cardTitle}>
                  <span className={styles.ctIc}><i className="bx bx-group"></i></span>
                  Guests
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '3px 10px', borderRadius: '999px', marginLeft: '2px' }}>
                    {selectedGuests.length}
                  </span>
                </div>
                <div className={styles.cardSub}>
                  Guests are the people you invite to this registry — added from your Contacts. Only invited guests can view it.
                </div>

                {selectedGuests.length > 0 && (
                  <div className={styles.guestChips}>
                    {selectedGuests.map(g => (
                      <span key={g} className={styles.gchip}>
                        <span className={styles.gchipAv}>{initials(g)}</span>
                        {g}
                        <button className={styles.gchipX} onClick={() => handleRemoveGuest(g)}>
                          <i className="bx bx-x"></i>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {selectedGuests.length === 0 && (
                  <div className={styles.guestEmpty}>
                    <i className="bx bx-user-plus"></i>No guests yet. Add them from your contacts below, or add someone new.
                  </div>
                )}

                <div className={styles.subhead}>From your contacts</div>
                <div className={styles.contactSearch}>
                  <i className="bx bx-search"></i>
                  <input
                    type="text"
                    placeholder="Search contacts by name..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                  />
                </div>

                <div className={styles.contactList}>
                  {filteredContacts.map(c => {
                    const isAdded = selectedGuests.includes(c.name);

                    return (
                      <div key={c.phone} className={styles.crow}>
                        <div className={styles.crowAv}>{initials(c.name)}</div>
                        <div className={styles.crowInfo}>
                          <div className={styles.crowName}>{c.name}</div>
                          <div className={styles.crowPhone}>{c.phone}</div>
                        </div>
                        {isAdded ? (
                          <button className={`${styles.crowBtn} ${styles.crowBtnAdded}`}>
                            <i className="bx bx-check"></i>Added
                          </button>
                        ) : (
                          <button className={styles.crowBtn} onClick={() => handleAddGuest(c.name)}>
                            <i className="bx bx-plus"></i>Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ADD SOMEONE NEW */}
                {!showAddNew ? (
                  <button className={styles.addnewToggle} onClick={() => setShowAddNew(true)}>
                    <i className="bx bx-user-plus"></i>Not in your contacts? Add someone new
                  </button>
                ) : (
                  <div className={styles.addnewForm}>
                    <div className={styles.addnewRow}>
                      <input
                        className={styles.formInput}
                        type="text"
                        placeholder="Full name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                      <div className={styles.phoneField}>
                        <span className={styles.phoneCc}>+92</span>
                        <input
                          className={styles.phoneNum}
                          type="tel"
                          maxLength={10}
                          placeholder="3XX XXXXXXX"
                          value={newPhone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setNewPhone(val);
                          }}
                        />
                      </div>
                    </div>
                    <div className={styles.addnewActions}>
                      <button className={`${styles.btnSm} ${styles.btnSmGhost}`} onClick={() => setShowAddNew(false)}>
                        Cancel
                      </button>
                      <button className={`${styles.btnSm} ${styles.btnSmPrimary}`} onClick={handleAddNewContact}>
                        <i className="bx bx-plus"></i>Add guest
                      </button>
                    </div>
                    <div className={styles.addnewHint}>
                      <i className="bx bx-info-circle"></i>
                      They&apos;re saved to your contacts and invited by SMS. If they&apos;re not on Tayaree yet, the invite includes a link to join and view your registry.
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

            {/* GIFT ITEMS CARD (STEP 3) */}
            <div className={styles.card} style={{ marginTop: '20px' }}>
              <div className={styles.cardPad}>
                <div className={styles.cardTitle}>
                  <span className={styles.ctIc}><i className="bx bx-package"></i></span>
                  Add Gift Items <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>&#40;optional&#41;</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '3px 10px', borderRadius: '999px', marginLeft: '6px' }}>
                    {selectedCatalogItemIds.length} selected
                  </span>
                </div>
                <div className={styles.cardSub}>
                  Select service packages your guests can gift to you. You can also add more items anytime later!
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginTop: '16px' }}>
                  {CATALOG_PACKAGES.map(pkg => {
                    const isSel = selectedCatalogItemIds.includes(pkg.id);
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => {
                          setSelectedCatalogItemIds(prev =>
                            prev.includes(pkg.id) ? prev.filter(id => id !== pkg.id) : [...prev, pkg.id]
                          );
                        }}
                        style={{
                          border: isSel ? '2px solid var(--primary)' : '1px solid var(--border)',
                          background: isSel ? 'var(--primary-light)' : 'var(--surface)',
                          borderRadius: '12px',
                          padding: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <img src={pkg.img} alt={pkg.name} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pkg.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{pkg.vendor}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--primary)' }}>PKR {pkg.price.toLocaleString()}</span>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: isSel ? 'var(--primary)' : 'var(--border)',
                            color: isSel ? '#ffffff' : 'var(--text-primary)'
                          }}>
                            {isSel ? '✓ Added' : '+ Add'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* FORM ACTIONS */}
            <div className={styles.formActions}>
              <Link className={styles.btnGhost} href={editId ? `/registry/${editId}` : "/registry"}>
                Cancel
              </Link>
              <button className={styles.btnPrimary} onClick={handleSubmit} disabled={isSubmitting}>
                <i className="bx bx-check"></i>
                <span>{isSubmitting ? (editId ? 'Saving...' : 'Creating...') : (editId ? 'Save Changes' : 'Create Registry')}</span>
              </button>
            </div>
          </div>

          {/* RIGHT SIDE RAIL: DYNAMIC STEP INDICATORS MATCHING DESIGNS 1:1 */}
          <aside className={styles.side}>
            <div className={styles.stepsCard}>
              <div className={styles.stepsTitle}>
                <i className="bx bx-list-check"></i>How your registry works
              </div>
              <div className={styles.stepsSub}>
                Three simple steps to a registry your guests can gift from.
              </div>

              {/* STEP 1: GREEN CHECKMARK IF DONE, RED IF ACTIVE */}
              <div className={`${styles.step} ${isStep1Done ? styles.stepDone : styles.stepActive}`}>
                <div className={styles.stepNum}>
                  {isStep1Done ? <i className="bx bx-check"></i> : '1'}
                </div>
                <div>
                  <div className={styles.stepTitle}>Create &amp; link an event</div>
                  <div className={styles.stepDesc}>Name your registry and connect it to one of your events so guests know the occasion and date.</div>
                </div>
              </div>

              {/* STEP 2: GREEN CHECKMARK IF DONE, RED IF ACTIVE, GREY IF PENDING */}
              <div className={`${styles.step} ${isStep2Done ? styles.stepDone : (isStep1Done ? styles.stepActive : '')}`}>
                <div className={styles.stepNum}>
                  {isStep2Done ? <i className="bx bx-check"></i> : '2'}
                </div>
                <div>
                  <div className={styles.stepTitle}>Add guests</div>
                  <div className={styles.stepDesc}>Invite people from your contacts. Only the guests you add can view this registry.</div>
                </div>
              </div>

              {/* STEP 3: GREEN CHECKMARK IF DONE, RED IF ACTIVE, GREY IF PENDING */}
              <div className={`${styles.step} ${selectedCatalogItemIds.length > 0 ? styles.stepDone : (isStep2Done ? styles.stepActive : '')}`}>
                <div className={styles.stepNum}>
                  {selectedCatalogItemIds.length > 0 ? <i className="bx bx-check"></i> : '3'}
                </div>
                <div>
                  <div className={styles.stepTitle}>Add items to the registry</div>
                  <div className={styles.stepDesc}>Browse services and add the packages you&apos;d love — your guests pick from these.</div>
                </div>
              </div>
            </div>

            <div className={styles.notifyCard}>
              <div className={styles.notifyHead}>
                <i className="bx bx-bell"></i>You'll always know
              </div>
              <div className={styles.notifyBody}>
                Your guests can view the registry and <b>buy these packages</b> for you. The moment someone purchases an item, <b>you get a notification</b> — and it's marked as bought so no one gifts the same thing twice.
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* FULL SCREEN LIGHTBOX PREVIEW MODAL */}
      {isPreviewModalOpen && coverPhoto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setIsPreviewModalOpen(false)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
            <img
              src={coverPhoto}
              alt="Cover Photo Full Preview"
              style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
            />
            <button
              onClick={() => setIsPreviewModalOpen(false)}
              style={{
                position: 'absolute',
                top: '-16px',
                right: '-16px',
                background: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                fontSize: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
              }}
            >
              <i className="bx bx-x"></i>
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function CreateRegistryPage() {
  return (
    <React.Suspense fallback={
      <DashboardLayout breadcrumbTitle="Registry">
        <div style={{ padding: '60px 20px', textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)' }}>
          Loading registry editor...
        </div>
      </DashboardLayout>
    }>
      <CreateRegistryFormContent />
    </React.Suspense>
  );
}
