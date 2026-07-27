'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import styles from './page.module.css';

interface EventType {
  id: string | number;
  name: string;
  icon?: string;
}

const DEFAULT_TYPES: EventType[] = [
  { id: '1', icon: "💍", name: "Wedding" },
  { id: '2', icon: "🎂", name: "Birthday" },
  { id: '3', icon: "🏢", name: "Corporate" },
  { id: '4', icon: "💑", name: "Engagement" },
  { id: '5', icon: "💕", name: "Anniversary" },
  { id: '6', icon: "👶", name: "Baby Shower" },
  { id: '7', icon: "👰", name: "Bridal Shower" },
  { id: '8', icon: "🎓", name: "Graduation" }
];

function getEventTypeIcon(name: string, fallback?: string): string {
  if (fallback && fallback !== '📅' && fallback !== 'http' && !fallback.includes('http')) return fallback;
  const n = (name || '').toLowerCase();
  if (n.includes('wedding')) return '💍';
  if (n.includes('birthday')) return '🎂';
  if (n.includes('corporate') || n.includes('conference') || n.includes('workshop')) return '🏢';
  if (n.includes('engagement')) return '💑';
  if (n.includes('anniversary')) return '💕';
  if (n.includes('baby')) return '👶';
  if (n.includes('bridal')) return '👰';
  if (n.includes('graduation')) return '🎓';
  if (n.includes('housewarming')) return '🏡';
  if (n.includes('farewell') || n.includes('festival') || n.includes('party')) return '🎉';
  return '📅';
}

function fmt(n: number | string): string {
  const num = typeof n === 'number' ? n : parseFloat(String(n).replace(/,/g, ''));
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-IN');
}

function formatDateDisplay(dStr: string): string {
  if (!dStr) return 'Jan 30, 2026';
  try {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (months[monthIdx]) {
        return `${months[monthIdx]} ${day}, ${year}`;
      }
    }
  } catch (e) {}
  return dStr;
}

const STORE_TYPES = [
  { id: "venue", icon: "🏛️", name: "Venue" },
  { id: "decor", icon: "🎀", name: "Decoration" },
  { id: "photo", icon: "📸", name: "Photography" },
  { id: "attire", icon: "👗", name: "Attire" },
  { id: "ent", icon: "🎵", name: "Entertainment" },
  { id: "transport", icon: "🚗", name: "Transport" },
  { id: "invites", icon: "✉️", name: "Invitations" },
  { id: "mehndi", icon: "💄", name: "Makeup" }
];

const PACKAGES = [
  {
    id: "classic",
    icon: "🍛",
    name: "Classic Pakistani",
    price: 1200,
    itemCount: 7,
    desc: "Biryani · 4 mains · 3 starters · 2 desserts",
    items: [
      { icon: "🍛", name: "Chicken Biryani", tag: "Main", variations: ["Spicy", "Mild"] },
      { icon: "🍢", name: "Seekh Kabab", tag: "Starter", variations: ["Beef", "Chicken"] },
      { icon: "🍖", name: "Mutton Karahi", tag: "Main", variations: ["Boneless", "On-the-bone"] },
      { icon: "🫓", name: "Naan", tag: "Bread", variations: ["Plain", "Butter", "Garlic"] },
      { icon: "🥙", name: "Chicken Tikka", tag: "Starter", variations: ["Boneless", "Bone-in"] },
      { icon: "🍮", name: "Gulab Jamun", tag: "Dessert", variations: ["Regular", "Sugar-free"] },
      { icon: "🥛", name: "Kheer", tag: "Dessert", variations: ["Traditional", "Saffron"] }
    ]
  },
  {
    id: "continental",
    icon: "🍝",
    name: "Continental Buffet",
    price: 1800,
    itemCount: 7,
    desc: "Pasta · grills · soups · 4 desserts",
    items: [
      { icon: "🍝", name: "Alfredo Pasta", tag: "Main", variations: ["Chicken", "Veg", "Seafood"] },
      { icon: "🍲", name: "Cream Soup", tag: "Starter", variations: ["Mushroom", "Tomato", "Corn"] },
      { icon: "🥗", name: "Caesar Salad", tag: "Starter", variations: ["Classic", "Chicken"] },
      { icon: "🍗", name: "Grilled Chicken", tag: "Main", variations: ["Lemon", "Herb", "Cajun"] },
      { icon: "🥩", name: "Beef Steak", tag: "Main", variations: ["Medium", "Well-done"] },
      { icon: "🍰", name: "Tiramisu", tag: "Dessert", variations: ["Classic", "Espresso"] },
      { icon: "🍫", name: "Chocolate Mousse", tag: "Dessert", variations: ["Dark", "Milk"] }
    ]
  },
  {
    id: "hightea",
    icon: "🍰",
    name: "High Tea + Desserts",
    price: 650,
    itemCount: 6,
    desc: "12 sweet + 8 savoury items",
    items: [
      { icon: "🥪", name: "Cucumber Sandwiches", tag: "Savoury", variations: ["Brown", "White"] },
      { icon: "🥧", name: "Chicken Pie", tag: "Savoury", variations: ["Mini", "Regular"] },
      { icon: "🧁", name: "Mini Cupcakes", tag: "Sweet", variations: ["Vanilla", "Chocolate", "Red Velvet"] },
      { icon: "🍪", name: "Shortbread Cookies", tag: "Sweet", variations: ["Plain", "Chocolate-chip"] },
      { icon: "🍩", name: "Glazed Doughnuts", tag: "Sweet", variations: ["Sugar", "Chocolate"] },
      { icon: "☕", name: "Premium Tea Bar", tag: "Drink", variations: ["Earl Grey", "Green", "Chai"] }
    ]
  },
  {
    id: "bbq",
    icon: "🍢",
    name: "Premium BBQ",
    price: 2200,
    itemCount: 7,
    desc: "Live grill · 3 kebabs · 2 curries · breads",
    items: [
      { icon: "🍢", name: "Beef Seekh Kabab", tag: "Grill", variations: ["Mild", "Spicy"] },
      { icon: "🍖", name: "Mutton Boti", tag: "Grill", variations: ["Boneless", "Bone-in"] },
      { icon: "🍗", name: "Chicken Tikka", tag: "Grill", variations: ["Boneless", "Bone-in"] },
      { icon: "🥩", name: "BBQ Ribs", tag: "Grill", variations: ["Smoked", "Honey-glazed"] },
      { icon: "🍛", name: "Daal Makhani", tag: "Curry", variations: ["Mild", "Spicy"] },
      { icon: "🍲", name: "Nihari", tag: "Curry", variations: ["Beef", "Mutton"] },
      { icon: "🫓", name: "Garlic Naan", tag: "Bread", variations: ["Plain", "Butter"] }
    ]
  }
];

interface SvcPackage {
  id: string;
  storeType: string;
  categoryName: string;
  icon: string;
  name: string;
  price: number;
  desc: string;
  itemCount: number;
  items: any[];
}

const SERVICE_PACKAGES_MAP: Record<string, SvcPackage[]> = {
  venue: [
    {
      id: "venue-ballroom",
      storeType: "venue",
      categoryName: "Venue",
      icon: "🏛️",
      name: "Grand Ballroom",
      price: 250000,
      desc: "AC hall · stage · seating 300 · valet",
      itemCount: 4,
      items: [
        { icon: "❄️", name: "AC Banquet Hall", tag: "Space", variations: ["200 cap", "300 cap"] },
        { icon: "🎭", name: "Stage & Backdrop", tag: "Setup", variations: ["Standard", "Premium"] },
        { icon: "🪑", name: "Guest Seating", tag: "Setup", variations: ["Round", "Theatre"] },
        { icon: "🅿️", name: "Valet Parking", tag: "Service", variations: ["Standard"] }
      ]
    },
    {
      id: "venue-marquee",
      storeType: "venue",
      categoryName: "Venue",
      icon: "⛺",
      name: "Garden Marquee",
      price: 180000,
      desc: "Weatherproof marquee · lawn · lighting",
      itemCount: 3,
      items: [
        { icon: "⛺", name: "Weatherproof Marquee", tag: "Space", variations: ["Standard", "Premium"] },
        { icon: "🌿", name: "Lawn Area", tag: "Space", variations: ["Half", "Full"] },
        { icon: "💡", name: "Ambient Lighting", tag: "Setup", variations: ["Warm", "Cool"] }
      ]
    }
  ],
  decor: [
    {
      id: "decor-classic",
      storeType: "decor",
      categoryName: "Decoration",
      icon: "🌸",
      name: "Classic Floral",
      price: 120000,
      desc: "Stage · arch · centerpieces · fairy lights",
      itemCount: 4,
      items: [
        { icon: "🎭", name: "Stage Backdrop", tag: "Decor", variations: ["Floral", "Drapes"] },
        { icon: "🌸", name: "Entrance Arch", tag: "Decor", variations: ["Round", "Arch"] },
        { icon: "🕯️", name: "Table Centerpieces", tag: "Decor", variations: ["Low", "Tall"] },
        { icon: "✨", name: "Fairy Lights", tag: "Lighting", variations: ["Warm", "Cool"] }
      ]
    },
    {
      id: "decor-modern",
      storeType: "decor",
      categoryName: "Decoration",
      icon: "🔷",
      name: "Modern Minimal",
      price: 90000,
      desc: "Geometric backdrop · LED walls · uplighting",
      itemCount: 3,
      items: [
        { icon: "🔷", name: "Geometric Backdrop", tag: "Decor", variations: ["Gold", "Silver"] },
        { icon: "📺", name: "LED Wall", tag: "Tech", variations: ["Single", "Double"] },
        { icon: "💡", name: "Uplighting", tag: "Lighting", variations: ["Static", "Dynamic"] }
      ]
    }
  ],
  photo: [
    {
      id: "photo-fullday",
      storeType: "photo",
      categoryName: "Photography",
      icon: "📸",
      name: "Full Day Coverage",
      price: 90000,
      desc: "Photo · video · drone · edited album",
      itemCount: 4,
      items: [
        { icon: "📷", name: "Lead Photographer", tag: "Crew", variations: ["12 hrs", "Full day"] },
        { icon: "🎥", name: "Cinematographer", tag: "Crew", variations: ["Highlights", "Full film"] },
        { icon: "🚁", name: "Drone Shots", tag: "Add-on", variations: ["Standard"] },
        { icon: "📖", name: "Edited Album", tag: "Deliverable", variations: ["30 pg", "50 pg"] }
      ]
    },
    {
      id: "photo-highlights",
      storeType: "photo",
      categoryName: "Photography",
      icon: "🎬",
      name: "Highlights Package",
      price: 55000,
      desc: "Photographer · highlights reel",
      itemCount: 2,
      items: [
        { icon: "📷", name: "Photographer", tag: "Crew", variations: ["8 hrs", "12 hrs"] },
        { icon: "🎬", name: "Highlights Reel", tag: "Deliverable", variations: ["3 min", "5 min"] }
      ]
    }
  ],
  attire: [
    {
      id: "attire-bridal",
      storeType: "attire",
      categoryName: "Attire",
      icon: "👰",
      name: "Bridal Couture",
      price: 150000,
      desc: "Lehenga · dupatta · accessories",
      itemCount: 3,
      items: [
        { icon: "👗", name: "Bridal Lehenga", tag: "Outfit", variations: ["Red", "Maroon", "Custom"] },
        { icon: "🧣", name: "Dupatta Set", tag: "Outfit", variations: ["Single", "Double"] },
        { icon: "💍", name: "Accessories", tag: "Add-on", variations: ["Kundan", "Polki"] }
      ]
    },
    {
      id: "attire-groom",
      storeType: "attire",
      categoryName: "Attire",
      icon: "🤵",
      name: "Groom Sherwani",
      price: 80000,
      desc: "Sherwani · khussa · turban",
      itemCount: 3,
      items: [
        { icon: "🥻", name: "Sherwani", tag: "Outfit", variations: ["Ivory", "Black"] },
        { icon: "👞", name: "Khussa", tag: "Footwear", variations: ["Classic", "Embellished"] },
        { icon: "👑", name: "Turban / Kalgi", tag: "Add-on", variations: ["Simple", "Royal"] }
      ]
    }
  ],
  ent: [
    {
      id: "ent-dj",
      storeType: "ent",
      categoryName: "Entertainment",
      icon: "🎧",
      name: "DJ + Sound",
      price: 60000,
      desc: "DJ · sound system · lighting",
      itemCount: 3,
      items: [
        { icon: "🎧", name: "DJ with Console", tag: "Act", variations: ["Standard", "Premium"] },
        { icon: "🔊", name: "Sound System", tag: "Equip", variations: ["Indoor", "Outdoor"] },
        { icon: "💡", name: "Stage Lighting", tag: "Equip", variations: ["Basic", "Full"] }
      ]
    }
  ],
  transport: [
    {
      id: "trans-vip",
      storeType: "transport",
      categoryName: "Transport",
      icon: "🚘",
      name: "VIP Bridal Fleet",
      price: 40000,
      desc: "Decorated luxury sedan · driver",
      itemCount: 2,
      items: [
        { icon: "🚘", name: "Bridal Sedan", tag: "Vehicle", variations: ["Sedan", "SUV"] },
        { icon: "🚌", name: "Guest Coaster", tag: "Vehicle", variations: ["24 seats"] }
      ]
    }
  ],
  invites: [
    {
      id: "inv-custom",
      storeType: "invites",
      categoryName: "Invitations",
      icon: "✉️",
      name: "Custom Card Suite",
      price: 25000,
      desc: "Foil-stamped cards (150 pcs) · RSVP site",
      itemCount: 2,
      items: [
        { icon: "✉️", name: "Physical Cards", tag: "Print", variations: ["Hardcover", "Softcover"] },
        { icon: "📱", name: "Digital Website", tag: "Digital", variations: ["Standard", "Interactive"] }
      ]
    }
  ],
  mehndi: [
    {
      id: "mk-bridal",
      storeType: "mehndi",
      categoryName: "Makeup",
      icon: "💄",
      name: "Bridal Glam Package",
      price: 55000,
      desc: "HD bridal makeup · hair styling · henna art",
      itemCount: 3,
      items: [
        { icon: "💄", name: "HD Bridal Makeup", tag: "Makeup", variations: ["HD", "Airbrush"] },
        { icon: "💇", name: "Hair Styling", tag: "Hair", variations: ["Updo", "Braided"] },
        { icon: "🌿", name: "Henna Art", tag: "Mehndi", variations: ["Bridal", "Minimal"] }
      ]
    }
  ]
};

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [eventTypes, setEventTypes] = useState<EventType[]>(DEFAULT_TYPES);

  // STEP 1 STATE
  const [eventName, setEventName] = useState('');
  const [eventTypeId, setEventTypeId] = useState<string | number>('1');
  const [dateMode, setDateMode] = useState<'specific' | 'flexible'>('specific');
  
  // DYNAMIC CALENDAR STATE (DEFAULT: Jan 2026)
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(0); // 0 = Jan, 1 = Feb, etc.
  const [selectedDay, setSelectedDay] = useState<number | null>(30);
  const [eventDate, setEventDate] = useState('2026-01-30');
  
  const [dateFlexibility, setDateFlexibility] = useState('± 1 day');
  const [selectedMonths, setSelectedMonths] = useState<string[]>(['Jan 2026']);
  const [selectedSessions, setSelectedSessions] = useState<string[]>(['Evening']);
  const [guests, setGuests] = useState(200);
  const [budgetMode, setBudgetMode] = useState<'perhead' | 'fixed'>('perhead');
  const [perHeadAmount, setPerHeadAmount] = useState('1,500');
  const [fixedTotalAmount, setFixedTotalAmount] = useState('');

  // STEP 2 STATE
  const [menuTab, setMenuTab] = useState<'pkg' | 'items'>('pkg');
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedPkgIds, setSelectedPkgIds] = useState<string[]>(['continental', 'classic']);

  // STEP 3 STATE
  const [activeStoreType, setActiveStoreType] = useState('venue');
  const [svcTab, setSvcTab] = useState<'pkg' | 'items'>('pkg');
  const [svcSearch, setSvcSearch] = useState('');
  const [selectedSvcPkgIds, setSelectedSvcPkgIds] = useState<string[]>([
    'venue-ballroom',
    'decor-classic'
  ]);

  // STEP 4 STATE
  const [notes, setNotes] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // CONFIRMATION SCREEN STATE
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedReqId, setSubmittedReqId] = useState('#RQ-771025');

  // MODAL STATE
  const [activePkgModal, setActivePkgModal] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(y => y - 1);
    } else {
      setCalMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(y => y + 1);
    } else {
      setCalMonth(m => m + 1);
    }
  };

  const getCalendarCells = () => {
    const firstDayIndex = new Date(calYear, calMonth, 1).getDay(); // 0 = Sun, 1 = Mon, ...
    const startOffset = (firstDayIndex + 6) % 7; // Convert to 0 = Mon, ..., 6 = Sun
    const daysInCurrentMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();

    const cells: { day: number; isCurrentMonth: boolean; key: string }[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      cells.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        key: `prev-${daysInPrevMonth - i}`
      });
    }

    for (let d = 1; d <= daysInCurrentMonth; d++) {
      cells.push({
        day: d,
        isCurrentMonth: true,
        key: `curr-${d}`
      });
    }

    return cells;
  };

  const selectDate = (d: number) => {
    setSelectedDay(d);
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    setEventDate(`${calYear}-${mm}-${dd}`);
  };

  const showToast = (msg: string, type: 'error' | 'success' = 'error') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    async function initPage() {
      // 1. Check if editId parameter is present in URL
      const search = window.location.search;
      const params = new URLSearchParams(search);
      const targetId = params.get('edit') || params.get('id');

      if (targetId) {
        setEditId(targetId);
        try {
          const localList = JSON.parse(localStorage.getItem('local_events') || '[]');
          const match = localList.find((item: any) => String(item.id) === String(targetId));
          if (match) {
            if (match.event_name) setEventName(match.event_name);
            if (match.event_type_id) setEventTypeId(match.event_type_id);
            if (match.event_date) setEventDate(match.event_date);
            if (match.guest_count) setGuests(match.guest_count);
            if (match.budget_type) setBudgetMode(match.budget_type === 'fixed_total' ? 'fixed' : 'perhead');
            if (match.budget_amount) {
              if (match.budget_type === 'fixed_total') setFixedTotalAmount(String(match.budget_amount));
              else setPerHeadAmount(String(match.budget_amount));
            }
            if (Array.isArray(match.packages)) setSelectedPkgIds(match.packages);
            if (Array.isArray(match.services)) setSelectedSvcPkgIds(match.services);
            if (match.notes) setNotes(match.notes);
            if (match.contact_phone) setContactPhone(match.contact_phone);
          }
        } catch (e) {
          console.error(e);
        }
      }

      // 2. Fetch event types from API
      const res = await api.safeCall(() => api.get<any>('/api/v1/events/types'));
      if (res.success && res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setEventTypes(res.data.data);
      }
    }
    initPage();
  }, []);

  const toggleSession = (sess: string) => {
    setSelectedSessions(prev => 
      prev.includes(sess) ? prev.filter(s => s !== sess) : [...prev, sess]
    );
  };

  const togglePackage = (id: string) => {
    setSelectedPkgIds(prev =>
      prev.includes(id) ? prev.filter(pkgId => pkgId !== id) : [...prev, id]
    );
  };

  const toggleSvcPackage = (id: string) => {
    setSelectedSvcPkgIds(prev =>
      prev.includes(id) ? prev.filter(pkgId => pkgId !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (!eventName.trim()) {
        showToast('Please enter an event name.');
        return;
      }
      if (!eventTypeId) {
        showToast('Please select an event type.');
        return;
      }
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 2) {
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 3) {
      setStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 4) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const cleanBudget = parseFloat(String(budgetMode === 'perhead' ? perHeadAmount : fixedTotalAmount).replace(/,/g, ''));
    const selectedType = eventTypes.find(t => String(t.id) === String(eventTypeId));

    const finalEventName = eventName.trim() || "Ahmed's Wedding";
    const reqId = `#RQ-${Math.floor(100000 + Math.random() * 900000)}`;

    const payload: any = {
      event_name: finalEventName,
      event_type_id: typeof eventTypeId === 'number' ? eventTypeId : parseInt(eventTypeId as string, 10) || 1,
      event_type: selectedType?.name || 'Wedding',
      event_date: eventDate || null,
      guest_count: guests ? parseInt(guests as any, 10) : null,
      budget_type: budgetMode === 'perhead' ? 'per_head' : 'fixed_total',
      budget_amount: cleanBudget > 0 ? cleanBudget : null,
      notes: notes.trim() || null,
      contact_phone: contactPhone.trim() || null,
      services: selectedSvcPkgIds,
      packages: selectedPkgIds
    };

    const cleanPayload: any = {};
    Object.keys(payload).forEach(key => {
      if (payload[key] !== null && payload[key] !== undefined && payload[key] !== '') {
        cleanPayload[key] = payload[key];
      }
    });

    const targetEventId = editId || `evt-${Date.now()}`;

    const updatedEvt = {
      id: targetEventId,
      ...cleanPayload,
      event_name: finalEventName,
      status: 'planning',
      quote_count: 0,
      registry_count: 0
    };

    try {
      const existing = JSON.parse(localStorage.getItem('local_events') || '[]');
      if (editId) {
        // Update existing event in place
        const updatedList = existing.map((evt: any) => String(evt.id) === String(editId) ? updatedEvt : evt);
        localStorage.setItem('local_events', JSON.stringify(updatedList));
      } else {
        // Insert new event at front
        localStorage.setItem('local_events', JSON.stringify([updatedEvt, ...existing]));
      }
    } catch (e) {
      console.error(e);
    }

    if (editId) {
      await api.safeCall(() => api.put<any>(`/api/v1/events/${editId}`, cleanPayload));
    } else {
      await api.safeCall(() => api.post<any>('/api/v1/events', cleanPayload));
    }
    
    setSubmittedReqId(reqId);
    setIsSubmitting(false);
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedTypeObj = eventTypes.find(t => String(t.id) === String(eventTypeId)) || DEFAULT_TYPES[0];
  const selectedPkgObjs = PACKAGES.filter(p => selectedPkgIds.includes(p.id));
  const perHeadSum = selectedPkgObjs.reduce((acc, p) => acc + p.price, 0) || parseFloat(perHeadAmount.replace(/,/g, '')) || 1500;
  const estimatedCateringTotal = Math.round(perHeadSum * guests);

  const allSvcPackages: SvcPackage[] = Object.values(SERVICE_PACKAGES_MAP).flat();
  const selectedSvcPkgObjs = allSvcPackages.filter(p => selectedSvcPkgIds.includes(p.id));
  const servicesSubtotal = selectedSvcPkgObjs.reduce((acc, p) => acc + p.price, 0);

  const selectedStoreNames = Array.from(new Set(selectedSvcPkgObjs.map(p => p.categoryName))).join(', ') || 'None';

  // RENDER QUOTE REQUEST SENT CONFIRMATION SCREEN
  if (isSubmitted) {
    return (
      <DashboardLayout breadcrumbTitle="Request Sent">
        <div style={{ maxWidth: '1160px', margin: '0 auto', paddingBottom: '90px' }}>
          <div className={styles.cgLayout}>
            {/* LEFT CONFIRMATION PANEL */}
            <div className={styles.cgMain}>
              <div className={styles.cgPanel}>
                <div className={styles.cgHero}>
                  <div className={styles.cgCircle}>
                    <i className="bx bx-send"></i>
                  </div>
                  <div className={styles.cgBadge}>
                    <i className="bx bxs-star"></i>
                  </div>
                </div>

                <h1 className={styles.cgTitle}>Quote request sent! 🎉</h1>
                <p className={styles.cgSub}>
                  Your request went out <b>anonymously</b> to matching vendors for <b>{eventName || "Ahmed's Wedding"} · Catering</b>. Offers will start arriving in Quotes — you'll be notified as they come in.
                </p>

                {/* ANONYMITY BANNER */}
                <div className={styles.cgAnon}>
                  <div className={styles.cgAnonIc}>
                    <i className="bx bxs-shield"></i>
                  </div>
                  <div>
                    <div className={styles.cgAnonMain}>You stay anonymous</div>
                    <div className={styles.cgAnonSub}>
                      Vendors quote without seeing who you are — so pricing stays fair. Names are revealed only when you accept.
                    </div>
                  </div>
                </div>

                {/* REQUEST SUMMARY BOOK */}
                <div className={styles.cgBook}>
                  <div className={styles.cgBookHead}>
                    <i className="bx bx-file"></i>Request summary
                  </div>
                  <div className={styles.cgBookBody}>
                    <div className={styles.cgRow}>
                      <span className={styles.cgRowLbl}>Request ID</span>
                      <span className={styles.cgRowVal} style={{ letterSpacing: '0.3px' }}>{submittedReqId}</span>
                    </div>
                    <div className={styles.cgRow}>
                      <span className={styles.cgRowLbl}>Event</span>
                      <span className={styles.cgRowVal}>{eventName || "Ahmed's Wedding"}</span>
                    </div>
                    <div className={styles.cgRow}>
                      <span className={styles.cgRowLbl}>Service</span>
                      <span className={styles.cgRowVal}>Catering &amp; Additional Services</span>
                    </div>
                    <div className={styles.cgRow}>
                      <span className={styles.cgRowLbl}>Guests</span>
                      <span className={styles.cgRowVal}>{guests} Pax</span>
                    </div>
                    <div className={styles.cgRow}>
                      <span className={styles.cgRowLbl}>Budget</span>
                      <span className={styles.cgRowVal}>PKR {fmt(estimatedCateringTotal + servicesSubtotal)}</span>
                    </div>
                    <div className={styles.cgRow}>
                      <span className={styles.cgRowLbl}>Sent</span>
                      <span className={styles.cgRowVal}>Just now</span>
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className={styles.cgActs}>
                  <button className={styles.cgBtn} onClick={() => router.push('/quotes')}>
                    <i className="bx bx-receipt" style={{ fontSize: '18px' }}></i>Go to Quotes
                  </button>
                  <button className={`${styles.cgBtn} ${styles.cgBtnOut}`} onClick={() => router.push('/events')}>
                    <i className="bx bx-home-alt"></i>Back to Events
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE PANEL */}
            <aside className={styles.cgSide}>
              <div className={styles.stepsCard}>
                <div className={styles.stepsT}>
                  <i className="bx bx-list-check"></i>What happens next
                </div>
                <div className={styles.stepsSub}>
                  {eventName || "Ahmed's Wedding"} · Catering
                </div>

                <div className={styles.stepDone}>
                  <div className={styles.stepGut}>
                    <div className={styles.stepNum}>
                      <i className="bx bx-check" style={{ fontSize: '16px' }}></i>
                    </div>
                    <div className={styles.stepConn} style={{ background: 'var(--success)' }}></div>
                  </div>
                  <div className={styles.stepBody}>
                    <div className={styles.stepTitle} style={{ color: 'var(--success)' }}>Request sent</div>
                    <div className={styles.stepDesc}>Your anonymous request reached matching vendors for catering.</div>
                  </div>
                </div>

                <div className={styles.stepDone}>
                  <div className={styles.stepGut}>
                    <div className={styles.stepNum2}>2</div>
                    <div className={styles.stepConn}></div>
                  </div>
                  <div className={styles.stepBody}>
                    <div className={styles.stepTitle}>Offers arrive in Quotes</div>
                    <div className={styles.stepDesc}>Vendors respond — usually within a few hours. You'll get a notification for each offer.</div>
                  </div>
                </div>

                <div className={styles.stepDone}>
                  <div className={styles.stepGut}>
                    <div className={styles.stepNum2}>3</div>
                  </div>
                  <div className={styles.stepBody}>
                    <div className={styles.stepTitle}>Compare, negotiate &amp; accept</div>
                    <div className={styles.stepDesc}>Review offers side by side, request a revision or a discount, then accept the one you like.</div>
                  </div>
                </div>

                <div style={{ padding: '0 0 12px' }}>
                  <div className={styles.stepNote}>
                    <i className="bx bx-info-circle"></i>
                    <span>No payment is taken now. You only pay once you accept a quote and confirm your order.</span>
                  </div>
                </div>
              </div>

              <div className={styles.helpCard}>
                <div className={styles.helpT}>Manage your requests</div>
                <div className={styles.helpS}>Track this and all your other quote requests in one place.</div>
                <button
                  className={styles.helpLink}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={() => router.push('/quotes')}
                >
                  <i className="bx bx-file"></i> View all Quotes
                </button>
              </div>
            </aside>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbTitle="Create Event">
      <div className={styles.pageHead}>
        <div className={styles.pageTitle}>Create Event</div>
        <div className={styles.pageSub}>4 quick steps — plan your event and send it out for vendor quotes.</div>
      </div>

      {/* HORIZONTAL STEPPER MATCHING CREATE-EVENT.HTML */}
      <div className={styles.stepbar}>
        <div className={`${styles.sbItem} ${step === 1 ? styles.sbItemActive : step > 1 ? styles.sbItemDone : ''}`} onClick={() => setStep(1)}>
          <div className={styles.sbDot}>{step > 1 ? '✓' : '1'}</div>
          <div className={styles.sbText}>
            <div className={styles.sbName}>Event details</div>
            <div className={styles.sbSub}>Type, date, guests &amp; budget</div>
          </div>
        </div>
        <div className={`${styles.sbConn} ${step > 1 ? styles.sbConnDone : ''}`}></div>
        <div className={`${styles.sbItem} ${step === 2 ? styles.sbItemActive : step > 2 ? styles.sbItemDone : ''}`} onClick={() => setStep(2)}>
          <div className={styles.sbDot}>{step > 2 ? '✓' : '2'}</div>
          <div className={styles.sbText}>
            <div className={styles.sbName}>Menu</div>
            <div className={styles.sbSub}>Catering &amp; food</div>
          </div>
        </div>
        <div className={`${styles.sbConn} ${step > 2 ? styles.sbConnDone : ''}`}></div>
        <div className={`${styles.sbItem} ${step === 3 ? styles.sbItemActive : step > 3 ? styles.sbItemDone : ''}`} onClick={() => setStep(3)}>
          <div className={styles.sbDot}>{step > 3 ? '✓' : '3'}</div>
          <div className={styles.sbText}>
            <div className={styles.sbName}>Services</div>
            <div className={styles.sbSub}>Venue, decor &amp; more</div>
          </div>
        </div>
        <div className={`${styles.sbConn} ${step > 3 ? styles.sbConnDone : ''}`}></div>
        <div className={`${styles.sbItem} ${step === 4 ? styles.sbItemActive : ''}`} onClick={() => setStep(4)}>
          <div className={styles.sbDot}>4</div>
          <div className={styles.sbText}>
            <div className={styles.sbName}>Review</div>
            <div className={styles.sbSub}>Send for quotes</div>
          </div>
        </div>
      </div>

      <div className={styles.wizCard}>
        {/* STEP 1: EVENT DETAILS */}
        {step === 1 && (
          <div className={`${styles.stepPane} ${styles.stepPaneActive}`}>
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
              {eventTypes.map((t) => {
                const icon = getEventTypeIcon(t.name, t.icon);
                return (
                  <div
                    key={t.id}
                    className={`${styles.typeTile} ${String(eventTypeId) === String(t.id) ? styles.typeTileSelected : ''}`}
                    onClick={() => setEventTypeId(t.id)}
                  >
                    <div className={styles.typeIcon}>{icon}</div>
                    <div className={styles.typeName}>{t.name}</div>
                  </div>
                );
              })}
            </div>

            <div className={styles.wizDivider}></div>
            <div className={styles.twoCol}>
              <div>
                <div className={styles.wizSubhead}>When is it?</div>
                <div className={styles.wizSubhint}>Pick a specific date or stay flexible for better deals.</div>
                <div className={styles.segCtrl} style={{ marginTop: '14px' }}>
                  <div className={`${styles.segTab} ${dateMode === 'specific' ? styles.segTabActive : ''}`} onClick={() => setDateMode('specific')}>Specific Date</div>
                  <div className={`${styles.segTab} ${dateMode === 'flexible' ? styles.segTabActive : ''}`} onClick={() => setDateMode('flexible')}>I'm Flexible</div>
                </div>

                {dateMode === 'specific' ? (
                  <div>
                    {/* FULLY INTERACTIVE DYNAMIC CALENDAR */}
                    <div className={styles.cal}>
                      <div className={styles.calHead}>
                        <div className={styles.calNav} onClick={handlePrevMonth} title="Previous month">
                          <i className="bx bx-chevron-left"></i>
                        </div>
                        <div className={styles.calTitle}>
                          {monthNames[calMonth]} {calYear}
                        </div>
                        <div className={styles.calNav} onClick={handleNextMonth} title="Next month">
                          <i className="bx bx-chevron-right"></i>
                        </div>
                      </div>
                      <div className={styles.calGrid}>
                        <div className={styles.calDh}>Mo</div>
                        <div className={styles.calDh}>Tu</div>
                        <div className={styles.calDh}>We</div>
                        <div className={styles.calDh}>Th</div>
                        <div className={styles.calDh}>Fr</div>
                        <div className={styles.calDh}>Sa</div>
                        <div className={styles.calDh}>Su</div>

                        {getCalendarCells().map((cell) => {
                          if (!cell.isCurrentMonth) {
                            return (
                              <div key={cell.key} className={`${styles.calDay} ${styles.calDayMuted}`}>
                                {cell.day}
                              </div>
                            );
                          }
                          const isSelected = selectedDay === cell.day;
                          return (
                            <div
                              key={cell.key}
                              className={`${styles.calDay} ${isSelected ? styles.calDayActive : ''}`}
                              onClick={() => selectDate(cell.day)}
                            >
                              {cell.day}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className={styles.secMini}><i className="bx bx-calendar-star"></i>Is your date flexible?</div>
                    <div className={styles.chipsRow}>
                      {['Exact day', '± 1 day', '± 2 days', '± 7 days'].map(flex => (
                        <div
                          key={flex}
                          className={`${styles.pchip} ${dateFlexibility === flex ? styles.pchipSelected : ''}`}
                          onClick={() => setDateFlexibility(flex)}
                        >
                          {flex}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className={styles.secMini}><i className="bx bx-calendar"></i>Which months?</div>
                    <div className={styles.monthRow}>
                      {[
                        { month: 'Jan', year: '2026' },
                        { month: 'Feb', year: '2026' },
                        { month: 'Mar', year: '2026' },
                        { month: 'Apr', year: '2026' },
                        { month: 'May', year: '2026' },
                        { month: 'Jun', year: '2026' },
                        { month: 'Jul', year: '2026' },
                        { month: 'Aug', year: '2026' }
                      ].map(m => {
                        const mStr = `${m.month} ${m.year}`;
                        const isSel = selectedMonths.includes(mStr);
                        return (
                          <div
                            key={mStr}
                            className={`${styles.monthCard} ${isSel ? styles.monthCardSelected : ''}`}
                            onClick={() => setSelectedMonths(prev => isSel ? prev.filter(x => x !== mStr) : [...prev, mStr])}
                          >
                            <i className="bx bx-calendar"></i>
                            <span className={styles.mchk}><i className="bx bx-check"></i></span>
                            <div className={styles.monthName}>{m.month}</div>
                            <div className={styles.monthYear}>{m.year}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className={styles.secMini}><i className="bx bx-time"></i>Session preference</div>
                <div className={styles.chipsRow}>
                  {['Morning', 'Afternoon', 'Evening', 'Night'].map(sess => (
                    <div
                      key={sess}
                      className={`${styles.pchip} ${selectedSessions.includes(sess) ? styles.pchipSelected : ''}`}
                      onClick={() => toggleSession(sess)}
                    >
                      {sess}
                    </div>
                  ))}
                </div>
              </div>

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
                <div className={styles.chipsRow}>
                  {[50, 100, 200, 300, 500].map(cnt => (
                    <div
                      key={cnt}
                      className={`${styles.pchip} ${guests === cnt ? styles.pchipSelected : ''}`}
                      onClick={() => setGuests(cnt)}
                    >
                      {cnt}
                    </div>
                  ))}
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
                      <input value={perHeadAmount} onChange={(e) => setPerHeadAmount(e.target.value)} />
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
                      <input
                        placeholder="e.g. 400,000"
                        value={fixedTotalAmount}
                        onChange={(e) => setFixedTotalAmount(e.target.value)}
                        disabled={budgetMode !== 'fixed'}
                      />
                    </div>
                    <div className={styles.budgetHint}>Good when you have a hard cap on the whole event.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: MENU */}
        {step === 2 && (
          <div className={`${styles.stepPane} ${styles.stepPaneActive}`}>
            <div className={styles.menuLayout}>
              <div className={styles.menuBrowse}>
                <h1 className={styles.wizQ}>Build your menu</h1>
                <p className={styles.wizHint}>Pick curated packages (tap to review items or add multiple) or browse individual dishes by cuisine. Prices are market-rate estimates — not the final quote.</p>
                
                <div className={styles.menuTabs} style={{ marginTop: '20px' }}>
                  <div
                    className={`${styles.menuTab} ${menuTab === 'pkg' ? styles.menuTabActive : ''}`}
                    onClick={() => setMenuTab('pkg')}
                  >
                    Packages
                  </div>
                  <div
                    className={`${styles.menuTab} ${menuTab === 'items' ? styles.menuTabActive : ''}`}
                    onClick={() => setMenuTab('items')}
                  >
                    Individual Items
                  </div>
                </div>

                <div className={styles.menuSearch}>
                  <i className="bx bx-search"></i>
                  <input
                    placeholder="Search packages..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                  />
                </div>

                <div className={styles.pkgGrid}>
                  {PACKAGES.filter(p => p.name.toLowerCase().includes(menuSearch.toLowerCase())).map(pkg => {
                    const isSel = selectedPkgIds.includes(pkg.id);
                    return (
                      <div
                        key={pkg.id}
                        className={`${styles.pkgCard} ${isSel ? styles.pkgCardSelected : ''}`}
                        onClick={() => setActivePkgModal({ ...pkg, isService: false })}
                      >
                        <div className={styles.pkgThumb}>{pkg.icon}</div>
                        <div className={styles.pkgMain}>
                          <div className={styles.pkgName}>{pkg.name}</div>
                          <div className={styles.pkgMeta}>{pkg.desc}</div>
                          {isSel && (
                            <div className={styles.pkgAdded}>
                              <i className="bx bx-check-circle"></i> Added to menu
                            </div>
                          )}
                        </div>
                        <div className={styles.pkgPrice}>
                          PKR {fmt(pkg.price)}<small>/ head</small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <aside className={styles.menuSide}>
                <div className={styles.menuInfo}>
                  <div className={styles.miTitle}><i className="bx bx-bulb"></i>How it works</div>
                  <div className={styles.miSteps}>
                    <div className={styles.miStep}><span className={styles.miNum}>1</span><span>Pick a package or add dishes.</span></div>
                    <div className={styles.miStep}><span className={styles.miNum}>2</span><span>We send it out for competitive bids.</span></div>
                    <div className={styles.miStep}><span className={styles.miNum}>3</span><span>Compare quotes in 24–48 hours.</span></div>
                  </div>
                  <div className={styles.miDiscount}>
                    <i className="bx bx-trending-down"></i>
                    <span>Vendors typically bid <b>20–35% below market</b> — your final quote will be lower.</span>
                  </div>
                </div>

                <div className={styles.menuSummary}>
                  <div className={styles.msHead}>
                    <div className={styles.msTitle}><i className="bx bx-restaurant"></i>Selected Menu</div>
                    <span className={styles.msCount}>{selectedPkgObjs.length} selected</span>
                  </div>
                  {selectedPkgObjs.length > 0 ? (
                    <div className={styles.msBody}>
                      {selectedPkgObjs.map(pkg => (
                        <div key={pkg.id} className={styles.msRow}>
                          <div className={styles.msIc}>{pkg.icon}</div>
                          <div className={styles.msMain}>
                            <div className={styles.msName}>{pkg.name}</div>
                            <div className={styles.msMeta}>Package · {pkg.itemCount} items</div>
                          </div>
                          <div className={styles.msPrice}>
                            PKR {fmt(pkg.price)}<small>/hd</small>
                          </div>
                          <button className={styles.msRm} onClick={() => togglePackage(pkg.id)}>
                            <i className="bx bx-x"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.msEmpty}>
                      <i className="bx bx-restaurant"></i>
                      <strong>No menu selected</strong>
                      <span>Select packages on the left to start.</span>
                    </div>
                  )}
                  <div className={styles.msFoot}>
                    <div className={styles.msTotalRow}>
                      <span className={styles.msTotalLbl}>Estimate per head</span>
                      <span className={styles.msTotalVal}>PKR {fmt(perHeadSum)}</span>
                    </div>
                    <div className={styles.msNote}>
                      ≈ PKR {fmt(estimatedCateringTotal)} catering for {guests} guests
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* STEP 3: ADDITIONAL SERVICES */}
        {step === 3 && (
          <div className={`${styles.stepPane} ${styles.stepPaneActive}`}>
            <h1 className={styles.wizQ}>Additional services</h1>
            <p className={styles.wizHint}>Browse each service. Pick a store type, then add packages or individual items — we'll gather quotes for everything you select.</p>

            <div className={styles.svcCarousel}>
              {STORE_TYPES.map(st => {
                const isSel = activeStoreType === st.id;
                const count = selectedSvcPkgObjs.filter(p => p.storeType === st.id).length;
                return (
                  <div
                    key={st.id}
                    className={`${styles.stTile} ${isSel ? styles.stTileActive : ''}`}
                    onClick={() => setActiveStoreType(st.id)}
                  >
                    {count > 0 && <div className={styles.stBadge}>{count}</div>}
                    <div className={styles.stIc}>{st.icon}</div>
                    <div className={styles.stName}>{st.name}</div>
                  </div>
                );
              })}
            </div>

            <div className={styles.menuLayout}>
              <div className={styles.menuBrowse}>
                <div className={styles.menuTabs}>
                  <div
                    className={`${styles.menuTab} ${svcTab === 'pkg' ? styles.menuTabActive : ''}`}
                    onClick={() => setSvcTab('pkg')}
                  >
                    Packages
                  </div>
                  <div
                    className={`${styles.menuTab} ${svcTab === 'items' ? styles.menuTabActive : ''}`}
                    onClick={() => setSvcTab('items')}
                  >
                    Individual Items
                  </div>
                </div>

                <div className={styles.menuSearch}>
                  <i className="bx bx-search"></i>
                  <input
                    placeholder={`Search ${STORE_TYPES.find(st => st.id === activeStoreType)?.name} packages...`}
                    value={svcSearch}
                    onChange={(e) => setSvcSearch(e.target.value)}
                  />
                </div>

                <div className={styles.pkgGrid}>
                  {(SERVICE_PACKAGES_MAP[activeStoreType] || [])
                    .filter(p => p.name.toLowerCase().includes(svcSearch.toLowerCase()))
                    .map(pkg => {
                      const isSel = selectedSvcPkgIds.includes(pkg.id);
                      return (
                        <div
                          key={pkg.id}
                          className={`${styles.pkgCard} ${isSel ? styles.pkgCardSelected : ''}`}
                          onClick={() => setActivePkgModal({ ...pkg, isService: true })}
                        >
                          <div className={styles.pkgThumb}>{pkg.icon}</div>
                          <div className={styles.pkgMain}>
                            <div className={styles.pkgName}>{pkg.name}</div>
                            <div className={styles.pkgMeta}>{pkg.desc}</div>
                            {isSel && (
                              <div className={styles.pkgAdded}>
                                <i className="bx bx-check-circle"></i> Added
                              </div>
                            )}
                          </div>
                          <div className={styles.pkgPrice}>
                            PKR {fmt(pkg.price)}<small>total</small>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <aside className={styles.menuSide}>
                <div className={styles.menuSummary}>
                  <div className={styles.msHead}>
                    <div className={styles.msTitle}><i className="bx bx-map-pin"></i>Selected Services</div>
                    <span className={styles.msCount}>{selectedSvcPkgObjs.length} selected</span>
                  </div>

                  {selectedSvcPkgObjs.length > 0 ? (
                    <div className={styles.msBody}>
                      {STORE_TYPES.map(st => {
                        const itemsForSt = selectedSvcPkgObjs.filter(p => p.storeType === st.id);
                        if (itemsForSt.length === 0) return null;
                        return (
                          <div key={st.id}>
                            <div className={styles.msGroupHead}>
                              <span>{st.icon}</span> {st.name.toUpperCase()}
                            </div>
                            {itemsForSt.map(pkg => (
                              <div key={pkg.id} className={styles.msRow}>
                                <div className={styles.msIc}>{pkg.icon}</div>
                                <div className={styles.msMain}>
                                  <div className={styles.msName}>{pkg.name}</div>
                                  <div className={styles.msMeta}>Package · {pkg.itemCount} items</div>
                                </div>
                                <div className={styles.msPrice}>
                                  PKR {fmt(pkg.price)}
                                </div>
                                <button className={styles.msRm} onClick={() => toggleSvcPackage(pkg.id)}>
                                  <i className="bx bx-x"></i>
                                </button>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.msEmpty}>
                      <i className="bx bx-map-pin"></i>
                      <strong>No services selected</strong>
                      <span>Pick a store type and add packages.</span>
                    </div>
                  )}

                  <div className={styles.msFoot}>
                    <div className={styles.msTotalRow}>
                      <span className={styles.msTotalLbl}>Services subtotal</span>
                      <span className={styles.msTotalVal}>PKR {fmt(servicesSubtotal)}</span>
                    </div>
                    <div className={styles.msNote}>
                      Flat vendor estimates — bids are usually lower.
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW */}
        {step === 4 && (
          <div className={`${styles.stepPane} ${styles.stepPaneActive}`}>
            <h1 className={styles.wizQ}>Review &amp; send for quotes</h1>
            <p className={styles.wizHint}>Here's your event summary. Send it out and matching vendors will bid within 24–48 hours.</p>

            <div className={styles.menuLayout} style={{ marginTop: '20px' }}>
              <div className={styles.menuBrowse}>
                {/* 4 SUMMARY TILES */}
                <div className={styles.revGrid}>
                  <div className={styles.revTile}>
                    <div className={styles.revLbl}><i className="bx bx-calendar"></i>EVENT</div>
                    <div className={styles.revVal}>{eventName || "Ahmed's Wedding"}</div>
                    <div className={styles.revSub}>{selectedTypeObj.name}</div>
                  </div>
                  <div className={styles.revTile}>
                    <div className={styles.revLbl}><i className="bx bx-time"></i>DATE</div>
                    <div className={styles.revVal}>{formatDateDisplay(eventDate)}</div>
                    <div className={styles.revSub}>{dateMode === 'specific' ? 'Specific date' : 'Flexible'}</div>
                  </div>
                  <div className={styles.revTile}>
                    <div className={styles.revLbl}><i className="bx bx-group"></i>GUESTS</div>
                    <div className={styles.revVal}>{guests}</div>
                    <div className={styles.revSub}>Expected attendees</div>
                  </div>
                  <div className={styles.revTile}>
                    <div className={styles.revLbl}><i className="bx bx-map-pin"></i>SERVICES</div>
                    <div className={styles.revVal}>{selectedSvcPkgObjs.length} categories</div>
                    <div className={styles.revSub}>{selectedStoreNames}</div>
                  </div>
                </div>

                {/* SELECTED MENU CARD */}
                <div className={styles.menuSummary} style={{ marginBottom: '16px' }}>
                  <div className={styles.msHead}>
                    <div className={styles.msTitle}><i className="bx bx-restaurant"></i>Selected Menu</div>
                    <span className={styles.msCount}>{selectedPkgObjs.length} selected</span>
                  </div>
                  {selectedPkgObjs.length > 0 ? (
                    <div className={styles.msBody}>
                      {selectedPkgObjs.map(pkg => (
                        <div key={pkg.id} className={styles.msRow}>
                          <div className={styles.msIc}>{pkg.icon}</div>
                          <div className={styles.msMain}>
                            <div className={styles.msName}>{pkg.name}</div>
                            <div className={styles.msMeta}>Package · {pkg.itemCount} items</div>
                          </div>
                          <div className={styles.msPrice}>
                            PKR {fmt(pkg.price)}<small>/hd</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.msEmpty}>
                      <i className="bx bx-restaurant"></i>
                      <strong>No menu selected</strong>
                    </div>
                  )}
                  <div className={styles.msFoot}>
                    <div className={styles.msTotalRow}>
                      <span className={styles.msTotalLbl}>Estimate per head</span>
                      <span className={styles.msTotalVal}>PKR {fmt(perHeadSum)}</span>
                    </div>
                    <div className={styles.msNote}>
                      ≈ PKR {fmt(estimatedCateringTotal)} catering for {guests} guests
                    </div>
                  </div>
                </div>

                {/* SELECTED SERVICES CARD */}
                <div className={styles.menuSummary}>
                  <div className={styles.msHead}>
                    <div className={styles.msTitle}><i className="bx bx-map-pin"></i>Selected Services</div>
                    <span className={styles.msCount}>{selectedSvcPkgObjs.length} selected</span>
                  </div>
                  {selectedSvcPkgObjs.length > 0 ? (
                    <div className={styles.msBody}>
                      {STORE_TYPES.map(st => {
                        const itemsForSt = selectedSvcPkgObjs.filter(p => p.storeType === st.id);
                        if (itemsForSt.length === 0) return null;
                        return (
                          <div key={st.id}>
                            <div className={styles.msGroupHead}>
                              <span>{st.icon}</span> {st.name.toUpperCase()}
                            </div>
                            {itemsForSt.map(pkg => (
                              <div key={pkg.id} className={styles.msRow}>
                                <div className={styles.msIc}>{pkg.icon}</div>
                                <div className={styles.msMain}>
                                  <div className={styles.msName}>{pkg.name}</div>
                                  <div className={styles.msMeta}>Package · {pkg.itemCount} items</div>
                                </div>
                                <div className={styles.msPrice}>
                                  PKR {fmt(pkg.price)}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.msEmpty}>
                      <i className="bx bx-map-pin"></i>
                      <strong>No services selected</strong>
                    </div>
                  )}
                  <div className={styles.msFoot}>
                    <div className={styles.msTotalRow}>
                      <span className={styles.msTotalLbl}>Services subtotal</span>
                      <span className={styles.msTotalVal}>PKR {fmt(servicesSubtotal)}</span>
                    </div>
                    <div className={styles.msNote}>
                      Flat vendor estimates — bids are usually lower.
                    </div>
                  </div>
                </div>

                {/* SHIELD NOTE STRIP */}
                <div className={styles.confirmStrip}>
                  <i className="bx bx-shield-quarter"></i>
                  <div>Prices shown are market-rate estimates for planning only — you won't be charged anything until you accept a bid.</div>
                </div>
              </div>

              {/* RIGHT SIDE SUMMARY BOX */}
              <aside className={styles.menuSide}>
                <div className={styles.estCard}>
                  <div className={styles.estLbl}>ESTIMATED EVENT COST (MARKET RATE)</div>
                  <div className={styles.estRow}>
                    <span className="n">Catering · {guests} × {fmt(perHeadSum)}/head</span>
                    <span className="v">PKR {fmt(estimatedCateringTotal)}</span>
                  </div>
                  <div className={styles.estRow}>
                    <span className="n">Services · {selectedStoreNames}</span>
                    <span className="v">PKR {fmt(servicesSubtotal)}</span>
                  </div>
                  <div className={styles.estTotal}>
                    <span className={styles.estTotalLbl}>ESTIMATED TOTAL</span>
                    <span className={styles.estTotalAmt}>PKR {fmt(estimatedCateringTotal + servicesSubtotal)}</span>
                  </div>
                  <div className={styles.msNote} style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>
                    Vendors typically bid lower — expect quotes around <b style={{ color: 'var(--success)', fontWeight: 800 }}>PKR {fmt(660000)}+</b>.
                  </div>
                </div>

                <div className={styles.nextHead}><i className="bx bx-list-check"></i>What happens next</div>
                <div className={styles.nextRow}>
                  <div className={styles.nextNum}>1</div>
                  <div>
                    <div className={styles.nextTitle}>Quote request sent</div>
                    <div className={styles.nextDesc}>Your event goes out to matching vendors across every service you selected.</div>
                  </div>
                </div>
                <div className={styles.nextRow}>
                  <div className={styles.nextNum}>2</div>
                  <div>
                    <div className={styles.nextTitle}>Bids arrive in 24–48 hours</div>
                    <div className={styles.nextDesc}>Compare personalised quotes, chat, and negotiate — no commitment until you accept.</div>
                  </div>
                </div>
                <div className={styles.nextRow}>
                  <div className={styles.nextNum}>3</div>
                  <div>
                    <div className={styles.nextTitle}>Accept &amp; add to cart</div>
                    <div className={styles.nextDesc}>Approve the bids you like; they move to your cart and become an order.</div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>

      {/* FIXED ACTION BAR */}
      <div className={styles.wizBar}>
        <div className={styles.wizBarInner}>
          <div className={styles.wizBarStep}>
            Step {step} of 4: <b>{step === 1 ? 'Event Details' : step === 2 ? 'Menu' : step === 3 ? 'Services' : 'Review'}</b>
          </div>
          <div className={styles.wizBarActions}>
            <button
              className={styles.btnBack}
              disabled={step === 1}
              onClick={() => {
                setStep(prev => Math.max(1, prev - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <i className="bx bx-chevron-left"></i>Back
            </button>
            <button
              className={styles.btnNext}
              onClick={handleNext}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                'Saving...'
              ) : step === 4 ? (
                <>
                  <i className="bx bx-send"></i>Submit
                </>
              ) : (
                <>
                  Continue<i className="bx bx-chevron-right"></i>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* PACKAGE DETAIL MODAL */}
      {activePkgModal && (
        <div className={styles.modalOv} onClick={() => setActivePkgModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <div className={styles.modalTitle}>{activePkgModal.name}</div>
              <button className={styles.modalX} onClick={() => setActivePkgModal(null)}>
                <i className="bx bx-x"></i>
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.pdHero}>
                <div className={styles.pdHeroIc}>{activePkgModal.icon}</div>
                <div>
                  <div className={styles.pdHeroName}>{activePkgModal.name}</div>
                  <div className={styles.pdHeroPrice}>
                    {activePkgModal.isService ? (
                      <><span>{activePkgModal.icon} {activePkgModal.categoryName || 'Service'}</span> · PKR {fmt(activePkgModal.price)}</>
                    ) : (
                      <>PKR {fmt(activePkgModal.price)} / head</>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.pdSec}>
                INCLUDES {activePkgModal.items ? activePkgModal.items.length : 4} ITEMS
              </div>

              <div>
                {(activePkgModal.items || []).map((it: any, idx: number) => (
                  <div key={idx} className={styles.pdItem}>
                    <div className={styles.pdItemIc}>{it.icon}</div>
                    <div className={styles.pdItemMain}>
                      <div className={styles.pdItemName}>{it.name}</div>
                      {it.variations && it.variations.length > 0 && (
                        <div className={styles.varSelect}>
                          {it.variations.map((v: string, vIdx: number) => (
                            <span key={vIdx} className={styles.varChip}>{v}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={styles.pdItemTag}>{it.tag}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.modalFoot}>
              {activePkgModal.isService ? (
                selectedSvcPkgIds.includes(activePkgModal.id) ? (
                  <button
                    className={`${styles.modalBtn} ${styles.modalBtnRemove}`}
                    onClick={() => {
                      toggleSvcPackage(activePkgModal.id);
                      setActivePkgModal(null);
                    }}
                  >
                    <i className="bx bx-trash"></i> Remove from Services
                  </button>
                ) : (
                  <button
                    className={styles.modalBtn}
                    onClick={() => {
                      toggleSvcPackage(activePkgModal.id);
                      setActivePkgModal(null);
                    }}
                  >
                    + Add to Services
                  </button>
                )
              ) : selectedPkgIds.includes(activePkgModal.id) ? (
                <button
                  className={`${styles.modalBtn} ${styles.modalBtnRemove}`}
                  onClick={() => {
                    togglePackage(activePkgModal.id);
                    setActivePkgModal(null);
                  }}
                >
                  <i className="bx bx-trash"></i> Remove from Menu
                </button>
              ) : (
                <button
                  className={styles.modalBtn}
                  onClick={() => {
                    togglePackage(activePkgModal.id);
                    setActivePkgModal(null);
                  }}
                >
                  Add to Menu
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
