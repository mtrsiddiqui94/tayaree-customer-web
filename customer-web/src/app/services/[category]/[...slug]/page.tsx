'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities, @typescript-eslint/no-unused-vars */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import styles from './service-detail.module.css';

interface ServiceDetail {
  serviceId: number;
  slug: string;
  name: string;
  itemName: string;
  priceLabel: string;
  info1Label: string;
  info2Label: string;
  info3Label: string;
  info4Label: string;
  minimumGuests: number;
  maximumGuests: number;
  discount: number;
  price: string;
  finalPrice: string;
  discountPercentage: number;
  originalPrice: string;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  description: string;
  defaultPriceId: number;
  itemsCount: number;
  maxItemSelection: number;
  images: string[];
  tags: string[];
  isVerified: boolean;
  location: string;
  customerLiked?: boolean;
  endpointLikeUri?: string;
  detailConfig: {
    isShowRatesPerHead: boolean;
    isShowMinimumGuests: boolean;
    isShowAddress: boolean;
    isShowCalendar: boolean;
    isShowItemsList: boolean;
    isShowSize: boolean;
    isShowColor: boolean;
    isShowGuidelinesPolicies: boolean;
    isShowPaymentSchedule: boolean;
    isShowQuantity: boolean;
  };
}

interface CustomItem {
  itemId: number;
  priceId: number;
  price: string;
  discount: string;
  discountedPrice: string;
  description: string;
  imageUrl: string;
  name: string;
  images: string[];
  hasVariation: boolean;
}

interface CalendarSlot {
  calendarDate: string;
  info3Label: string;
  price: string;
  priceId: number;
  isAvailable: boolean;
}

interface PriceRow {
  labelInfo: string;
  labelValue: string;
}

interface PriceSummaryResponse {
  priceSummaryId?: number;
  price_summary_id?: number;
  heading: string;
  summary: PriceRow[];
}

interface InstallmentRow {
  labelInfo: string;
  labelValue: string;
}

interface PaymentTermsResponse {
  heading: string;
  summary: InstallmentRow[];
  [key: string]: any;
}

interface Review {
  id: number;
  review: string;
  fiveStars: number;
  createdAt: string;
}

interface PageProps {
  params: Promise<{ category: string; slug: string[] | string }>;
}

export default function ServiceDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { category, slug } = React.use(params);
  const slugStr = Array.isArray(slug) ? slug.join('/') : slug;
  const slugArr = Array.isArray(slug) ? slug : [slug];
  const rawId = slugArr[slugArr.length - 1] || slugArr[0];
  const serviceId = /^\d+$/.test(rawId) ? rawId : (/^\d+$/.test(slugArr[0]) ? slugArr[0] : '1');

  const endpointPath = `services/${category}/${serviceId}`;

  // Data States
  const [detail, setDetail] = useState<ServiceDetail | null>(null);
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [calendarSlots, setCalendarSlots] = useState<CalendarSlot[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsLimit] = useState(5);
  const [frequentlyBought, setFrequentlyBought] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [packageDetails, setPackageDetails] = useState<any[]>([]);
  const [checkedPolicies, setCheckedPolicies] = useState<Record<string, boolean>>({});
  
  // Customization selection States
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedPriceId, setSelectedPriceId] = useState<number | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [guestCount, setGuestCount] = useState<number>(0);
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('items');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string>('morning');
  const [activeDetailItemId, setActiveDetailItemId] = useState<number | null>(null);
  const [itemVariations, setItemVariations] = useState<Record<number, { colorId?: number; sizeId?: number; colorTitle?: string; sizeTitle?: string; selectedPath?: any[]; imageUrl?: string }>>({});

  // Active sub-item specifications & variations loading states
  const [activeItemDetails, setActiveItemDetails] = useState<any | null>(null);
  const [activeItemVariations, setActiveItemVariations] = useState<any | null>(null);
  const [activeItemImages, setActiveItemImages] = useState<string[]>([]);
  const [activeItemCarouselIdx, setActiveItemCarouselIdx] = useState<number>(0);
  const [selectedVariationPath, setSelectedVariationPath] = useState<any[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    "What's Included": true,
    "Guidelines": true,
    "Size Guide": true,
  });

  // Colors & Sizes mocks/fetching (since backend details return lists dynamically)
  const [colors, setColors] = useState<Array<{ id: number; hexCode: string; title: string }>>([]);
  const [sizes, setSizes] = useState<Array<{ id: number; title: string; size: string }>>([]);

  // Summary States
  const [priceSummaryId, setPriceSummaryId] = useState<number | null>(null);
  const [priceSummaryHeading, setPriceSummaryHeading] = useState<string>('');
  const [priceRows, setPriceRows] = useState<PriceRow[]>([]);
  const [installments, setInstallments] = useState<InstallmentRow[]>([]);

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(false);
  const [showListenPlayer, setShowListenPlayer] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const formatPrice = (val: any) => {
    if (val === undefined || val === null || val === '') return 'unset';
    const valStr = val.toString().trim();
    if (valStr === 'unset') return valStr;
    let formatted = valStr.replace(/,/g, '').replace(/\b\d+\b/g, (match: string) => {
      const num = parseInt(match, 10);
      return num.toLocaleString('en-US');
    });
    if (!formatted.includes('PKR') && !formatted.includes('%') && !formatted.startsWith('/') && !formatted.includes('per')) {
      if (formatted.toLowerCase().includes('starts from')) {
        formatted = formatted.replace(/(starts from\s*)/i, '$1PKR ');
      } else {
        formatted = `PKR ${formatted}`;
      }
    }
    return formatted;
  };

  const formatSlugToTitle = (cat: string, s: string) => {
    const parts = (s || '').split('/').filter(Boolean);
    const last = parts[parts.length - 1] || cat;
    if (!last || /^\d+$/.test(last)) {
      return `${cat.charAt(0).toUpperCase() + cat.slice(1)} Package`;
    }
    return last
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const getCategorySpecificFallback = (catName: string, sPath: string): ServiceDetail => {
    const cat = (catName || '').toLowerCase();
    const pathLower = (sPath || '').toLowerCase();
    const dynamicTitle = formatSlugToTitle(catName, sPath);
    const titleLower = dynamicTitle.toLowerCase();

    if (
      cat.includes('clothing') || cat.includes('dress') || cat.includes('wear') || cat.includes('lehenga') || cat.includes('bridal') ||
      pathLower.includes('bridal') || pathLower.includes('lehenga') || pathLower.includes('zara') || pathLower.includes('dress') ||
      titleLower.includes('bridal') || titleLower.includes('lehenga') || titleLower.includes('zara')
    ) {
      return {
        serviceId: 1,
        slug: sPath,
        name: dynamicTitle !== 'Clothing Package' ? dynamicTitle : 'Zara Noor Bridal Collection',
        itemName: 'Outfit',
        priceLabel: '/ dress',
        info1Label: 'Zara Noor Couture',
        info2Label: 'Bridal Wear',
        info3Label: 'Karachi',
        info4Label: '150+ brides',
        minimumGuests: 1,
        maximumGuests: 10,
        discount: 16,
        price: '185,000',
        finalPrice: '185,000',
        discountPercentage: 16,
        originalPrice: '220,000',
        rating: 4.9,
        reviewsCount: 164,
        imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
        description: 'Hand-embroidered ruby velvet lehenga with zardozi, dabka, and Swarovski crystal embellishments. Includes double dupatta (chiffon & organza) with intricately detailed borders and custom fitting alterations.',
        defaultPriceId: 1,
        itemsCount: 6,
        maxItemSelection: 6,
        images: [
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=400&q=80'
        ],
        tags: ['Hand Zardozi', 'Pure Velvet', 'Double Dupatta', 'Custom Fitting', 'Dry Cleaned', 'Certified Couture'],
        isVerified: true,
        location: 'Zamzama, Karachi',
        customerLiked: false,
        endpointLikeUri: '',
        detailConfig: {
          isShowRatesPerHead: false,
          isShowMinimumGuests: false,
          isShowAddress: true,
          isShowCalendar: true,
          isShowItemsList: true,
          isShowSize: true,
          isShowColor: true,
          isShowGuidelinesPolicies: true,
          isShowPaymentSchedule: true,
          isShowQuantity: true,
        },
      };
    }

    if (cat.includes('dj') || cat.includes('music') || cat.includes('sound') || pathLower.includes('dj') || pathLower.includes('music') || pathLower.includes('sound') || titleLower.includes('dj') || titleLower.includes('music')) {
      return {
        serviceId: 1,
        slug: sPath,
        name: dynamicTitle !== 'Music Package' && dynamicTitle !== 'Dj Package' ? dynamicTitle : 'Live Sound DJ & Lighting',
        itemName: 'DJ Setup',
        priceLabel: '/ event',
        info1Label: 'Bass Nation Events',
        info2Label: 'DJ & Sound',
        info3Label: 'Karachi',
        info4Label: '280+ bookings',
        minimumGuests: 1,
        maximumGuests: 10,
        discount: 30,
        price: '63,000',
        finalPrice: '63,000',
        discountPercentage: 30,
        originalPrice: '90,000',
        rating: 4.8,
        reviewsCount: 287,
        imageUrl: 'https://images.unsplash.com/photo-1571266028234-7dc0e9ea5e24?auto=format&fit=crop&w=1200&q=80',
        description: 'Bass Nation brings festival-grade sound, intelligent lighting, and elite DJ performances to high-energy events. From intimate Mehndi nights to massive 1,000+ guest wedding receptions, our custom setups transform any venue into a concert-quality experience.',
        defaultPriceId: 1,
        itemsCount: 6,
        maxItemSelection: 3,
        images: [
          'https://images.unsplash.com/photo-1571266028234-7dc0e9ea5e24?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80'
        ],
        tags: ['Full setup', 'Sound engineer', 'Bilingual MC', 'Wireless mics', 'Custom playlist', '280+ events'],
        isVerified: true,
        location: 'Gulshan, Karachi',
        customerLiked: false,
        endpointLikeUri: '',
        detailConfig: {
          isShowRatesPerHead: false,
          isShowMinimumGuests: false,
          isShowAddress: true,
          isShowCalendar: true,
          isShowItemsList: true,
          isShowSize: false,
          isShowColor: false,
          isShowGuidelinesPolicies: true,
          isShowPaymentSchedule: true,
          isShowQuantity: true,
        },
      };
    }

    if (cat.includes('photo') || cat.includes('cinema') || cat.includes('video') || cat.includes('camera') || pathLower.includes('photo') || pathLower.includes('cinema') || pathLower.includes('video') || titleLower.includes('photo') || titleLower.includes('cinema')) {
      return {
        serviceId: 1,
        slug: sPath,
        name: dynamicTitle !== 'Photography Package' ? dynamicTitle : 'Signature Wedding Photography & Cinema',
        itemName: 'Coverage Package',
        priceLabel: '/ package',
        info1Label: 'Framed Stories Studio',
        info2Label: 'Photography',
        info3Label: 'Karachi',
        info4Label: '450+ bookings',
        minimumGuests: 1,
        maximumGuests: 5,
        discount: 20,
        price: '120,000',
        finalPrice: '120,000',
        discountPercentage: 20,
        originalPrice: '150,000',
        rating: 4.9,
        reviewsCount: 312,
        imageUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80',
        description: 'Capture every candid tear, joyous laugh, and regal moment with Framed Stories Studio. Our award-winning photography and cinematography team specializes in documentary-style wedding storytelling using 4K cinema cameras, drones, and prime lenses.',
        defaultPriceId: 1,
        itemsCount: 6,
        maxItemSelection: 4,
        images: [
          'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80'
        ],
        tags: ['4K Cinema', 'Drone coverage', 'Candid shots', 'Printed albums', 'Teaser video', '450+ events'],
        isVerified: true,
        location: 'DHA Phase 6, Karachi',
        customerLiked: false,
        endpointLikeUri: '',
        detailConfig: {
          isShowRatesPerHead: false,
          isShowMinimumGuests: false,
          isShowAddress: true,
          isShowCalendar: true,
          isShowItemsList: true,
          isShowSize: false,
          isShowColor: false,
          isShowGuidelinesPolicies: true,
          isShowPaymentSchedule: true,
          isShowQuantity: true,
        },
      };
    }

    if (cat.includes('beauty') || cat.includes('salon') || cat.includes('make') || pathLower.includes('beauty') || pathLower.includes('salon') || pathLower.includes('makeup') || titleLower.includes('beauty') || titleLower.includes('makeup')) {
      return {
        serviceId: 1,
        slug: sPath,
        name: dynamicTitle !== 'Beauty Package' ? dynamicTitle : 'Bridal HD Makeup & Hair Styling',
        itemName: 'Glam Session',
        priceLabel: '/ session',
        info1Label: 'Glamour by Sana',
        info2Label: 'Bridal Beauty',
        info3Label: 'Karachi',
        info4Label: '300+ brides',
        minimumGuests: 1,
        maximumGuests: 5,
        discount: 18,
        price: '45,000',
        finalPrice: '45,000',
        discountPercentage: 18,
        originalPrice: '55,000',
        rating: 4.9,
        reviewsCount: 198,
        imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
        description: 'Step into timeless elegance on your special day. Sana brings over 10 years of luxury bridal expertise using HD airbrush makeup, premium international cosmetic brands, and custom hair sculpting tailored to your facial features.',
        defaultPriceId: 1,
        itemsCount: 6,
        maxItemSelection: 6,
        images: [
          'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80'
        ],
        tags: ['HD Airbrush', 'Lashes & Nails', 'Hair Styling', 'Dupatta Setting', 'Jewelry Fixation', '300+ brides'],
        isVerified: true,
        location: 'Clifton, Karachi',
        customerLiked: false,
        endpointLikeUri: '',
        detailConfig: {
          isShowRatesPerHead: false,
          isShowMinimumGuests: false,
          isShowAddress: true,
          isShowCalendar: true,
          isShowItemsList: true,
          isShowSize: true,
          isShowColor: true,
          isShowGuidelinesPolicies: true,
          isShowPaymentSchedule: true,
          isShowQuantity: true,
        },
      };
    }

    if (cat.includes('clothing') || cat.includes('dress') || cat.includes('wear') || cat.includes('lehenga') || pathLower.includes('clothing') || pathLower.includes('dress') || pathLower.includes('wear') || pathLower.includes('lehenga') || titleLower.includes('clothing') || titleLower.includes('dress')) {
      return {
        serviceId: 1,
        slug: sPath,
        name: dynamicTitle !== 'Clothing Package' ? dynamicTitle : 'Royal Crimson Velvet Bridal Lehenga',
        itemName: 'Outfit',
        priceLabel: '/ dress',
        info1Label: 'Sobia Nazir Couture',
        info2Label: 'Bridal Wear',
        info3Label: 'Karachi',
        info4Label: '150+ brides',
        minimumGuests: 1,
        maximumGuests: 10,
        discount: 16,
        price: '185,000',
        finalPrice: '185,000',
        discountPercentage: 16,
        originalPrice: '220,000',
        rating: 4.9,
        reviewsCount: 164,
        imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
        description: 'Hand-embroidered ruby velvet lehenga with zardozi, dabka, and Swarovski crystal embellishments. Includes double dupatta (chiffon & organza) with intricately detailed borders and custom fitting alterations.',
        defaultPriceId: 1,
        itemsCount: 6,
        maxItemSelection: 6,
        images: [
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=400&q=80'
        ],
        tags: ['Hand Zardozi', 'Pure Velvet', 'Double Dupatta', 'Custom Fitting', 'Dry Cleaned', 'Certified Couture'],
        isVerified: true,
        location: 'Zamzama, Karachi',
        customerLiked: false,
        endpointLikeUri: '',
        detailConfig: {
          isShowRatesPerHead: false,
          isShowMinimumGuests: false,
          isShowAddress: true,
          isShowCalendar: true,
          isShowItemsList: true,
          isShowSize: true,
          isShowColor: true,
          isShowGuidelinesPolicies: true,
          isShowPaymentSchedule: true,
          isShowQuantity: true,
        },
      };
    }

    if (cat.includes('decor') || cat.includes('floral') || cat.includes('stage') || pathLower.includes('decor') || pathLower.includes('floral') || pathLower.includes('stage') || titleLower.includes('decor') || titleLower.includes('stage')) {
      return {
        serviceId: 1,
        slug: sPath,
        name: dynamicTitle !== 'Decor Package' ? dynamicTitle : 'Royal Mughal Floral Stage & Entrance Decor',
        itemName: 'Decor Setup',
        priceLabel: '/ setup',
        info1Label: 'Rose Garden Events',
        info2Label: 'Event Decor',
        info3Label: 'Lahore',
        info4Label: '380+ setups',
        minimumGuests: 1,
        maximumGuests: 10,
        discount: 20,
        price: '120,000',
        finalPrice: '120,000',
        discountPercentage: 20,
        originalPrice: '150,000',
        rating: 4.9,
        reviewsCount: 198,
        imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
        description: 'Transform your event into a royal palace with our Mughal-inspired stage backdrop, imported fresh red roses, white hydrangeas, and crystal chandeliers.',
        defaultPriceId: 1,
        itemsCount: 6,
        maxItemSelection: 4,
        images: [
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1561484930-974b35ac6ed7?auto=format&fit=crop&w=400&q=80'
        ],
        tags: ['Fresh Flowers', 'Crystal Chandeliers', 'Floral Walkway', 'Mughal Stage', 'LED Spotlights', 'Full Setup'],
        isVerified: true,
        location: 'Gulshan, Karachi',
        customerLiked: false,
        endpointLikeUri: '',
        detailConfig: {
          isShowRatesPerHead: false,
          isShowMinimumGuests: false,
          isShowAddress: true,
          isShowCalendar: true,
          isShowItemsList: true,
          isShowSize: false,
          isShowColor: false,
          isShowGuidelinesPolicies: true,
          isShowPaymentSchedule: true,
          isShowQuantity: true,
        },
      };
    }

    if (cat.includes('venue') || cat.includes('lawn') || cat.includes('banquet') || pathLower.includes('venue') || pathLower.includes('banquet') || (pathLower.includes('hall') && !pathLower.includes('decor') && !pathLower.includes('stage')) || (titleLower.includes('hall') && !titleLower.includes('decor'))) {
      return {
        serviceId: 1,
        slug: sPath,
        name: dynamicTitle !== 'Venue Package' ? dynamicTitle : 'The Grand Palm Banquet & Gardens',
        itemName: 'Venue Booking',
        priceLabel: '/ head',
        info1Label: 'Grand Palm Events',
        info2Label: 'Banquet & Lawn',
        info3Label: 'Karachi',
        info4Label: '500+ bookings',
        minimumGuests: 200,
        maximumGuests: 1200,
        discount: 17,
        price: '1,500',
        finalPrice: '1,500',
        discountPercentage: 17,
        originalPrice: '1,800',
        rating: 4.8,
        reviewsCount: 340,
        imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
        description: "Karachi's premier luxury wedding venue featuring air-conditioned glass halls, lush outdoor gardens, backup generators, and dedicated valet parking.",
        defaultPriceId: 1,
        itemsCount: 6,
        maxItemSelection: 6,
        images: [
          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1545232979-fbfd42e000b5?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=400&q=80'
        ],
        tags: ['Air Conditioned', 'Outdoor Lawn', 'Backup Power', '1200 Capacity', 'Valet Parking', 'Bridal Suite'],
        isVerified: true,
        location: 'Karsaz, Karachi',
        customerLiked: false,
        endpointLikeUri: '',
        detailConfig: {
          isShowRatesPerHead: true,
          isShowMinimumGuests: true,
          isShowAddress: true,
          isShowCalendar: true,
          isShowItemsList: true,
          isShowSize: false,
          isShowColor: false,
          isShowGuidelinesPolicies: true,
          isShowPaymentSchedule: true,
          isShowQuantity: false,
        },
      };
    }

    if (cat.includes('cake') || cat.includes('bakery') || cat.includes('dessert') || pathLower.includes('cake') || pathLower.includes('bakery') || titleLower.includes('cake')) {
      return {
        serviceId: 1,
        slug: sPath,
        name: dynamicTitle !== 'Cake Package' ? dynamicTitle : '5-Tier Regal Fondant Wedding Cake',
        itemName: 'Wedding Cake',
        priceLabel: '/ cake',
        info1Label: 'The Patisserie Studio',
        info2Label: 'Wedding Cakes',
        info3Label: 'Karachi',
        info4Label: '210+ orders',
        minimumGuests: 1,
        maximumGuests: 5,
        discount: 20,
        price: '28,000',
        finalPrice: '28,000',
        discountPercentage: 20,
        originalPrice: '35,000',
        rating: 4.9,
        reviewsCount: 142,
        imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=1200&q=80',
        description: 'Handcrafted 5-tier wedding cake with edible sugar flowers, gold leaf detailing, and custom flavor layers (Red Velvet, Belgian Chocolate, Salted Caramel).',
        defaultPriceId: 1,
        itemsCount: 6,
        maxItemSelection: 6,
        images: [
          'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80'
        ],
        tags: ['Sugar Flowers', 'Gold Leaf', '5 Tiers', 'Custom Flavors', 'Tasting Included', 'Chilled Transport'],
        isVerified: true,
        location: 'PECHS, Karachi',
        customerLiked: false,
        endpointLikeUri: '',
        detailConfig: {
          isShowRatesPerHead: false,
          isShowMinimumGuests: false,
          isShowAddress: true,
          isShowCalendar: true,
          isShowItemsList: true,
          isShowSize: true,
          isShowColor: true,
          isShowGuidelinesPolicies: true,
          isShowPaymentSchedule: true,
          isShowQuantity: true,
        },
      };
    }

    // Default Catering
    return {
      serviceId: 1,
      slug: sPath,
      name: dynamicTitle !== 'Catering Package' ? dynamicTitle : 'Royal Biryani Catering',
      itemName: 'Catering Package',
      priceLabel: '/ head',
      info1Label: "Amber's Kitchen",
      info2Label: 'Catering',
      info3Label: 'Karachi',
      info4Label: '340+ bookings',
      minimumGuests: 50,
      maximumGuests: 500,
      discount: 10,
      price: '850',
      finalPrice: '850',
      discountPercentage: 10,
      originalPrice: '950',
      rating: 4.8,
      reviewsCount: 124,
      imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
      description: "Amber's Kitchen brings the authentic taste of Karachi to your event with our Royal Biryani Catering package. Slow-cooked in large deg using premium basmati rice, whole spices, and tender meat — prepared fresh on-site.",
      defaultPriceId: 1,
      itemsCount: 6,
      maxItemSelection: 6,
      images: [
        'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80'
      ],
      tags: ['Full setup', 'On-site cooking', 'Halal certified', 'Premium basmati', 'Deg-cooked', '340+ events'],
      isVerified: true,
      location: 'Gulshan, Karachi',
      customerLiked: false,
      endpointLikeUri: '',
      detailConfig: {
        isShowRatesPerHead: true,
        isShowMinimumGuests: true,
        isShowAddress: true,
        isShowCalendar: true,
        isShowItemsList: true,
        isShowSize: true,
        isShowColor: true,
        isShowGuidelinesPolicies: true,
        isShowPaymentSchedule: true,
        isShowQuantity: true,
      },
    };
  };

  const getCategoryCustomItems = (catName: string): CustomItem[] => {
    const cat = (catName || '').toLowerCase();
    if (cat.includes('decor') || cat.includes('floral') || cat.includes('stage')) {
      return [
        { itemId: 1, priceId: 1, price: '45000', discount: '0', discountedPrice: '45000', description: 'Lush floral arrangements for tables, entrance, and stage in fresh imported roses', imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=220&h=180&q=80', name: 'Floral Arrangements', images: [], hasVariation: true },
        { itemId: 2, priceId: 2, price: '35000', discount: '0', discountedPrice: '35000', description: 'Full-height decorative stage backdrop combining fabric draping and floral clusters', imageUrl: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=220&h=180&q=80', name: 'Stage Backdrop Decor', images: [], hasVariation: true },
        { itemId: 3, priceId: 3, price: '20000', discount: '0', discountedPrice: '20000', description: 'Premium chair covers with matching sashes and table runners for up to 200 guests', imageUrl: 'https://images.unsplash.com/photo-1561484930-974b35ac6ed7?auto=format&fit=crop&w=220&h=180&q=80', name: 'Chair & Table Covers', images: [], hasVariation: true },
        { itemId: 4, priceId: 4, price: '12000', discount: '0', discountedPrice: '12000', description: 'Warm fairy light canopy and chiffon ceiling draping throughout venue space', imageUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=220&h=180&q=80', name: 'Fairy Lights & Draping', images: [], hasVariation: false },
        { itemId: 5, priceId: 5, price: '18000', discount: '0', discountedPrice: '18000', description: 'Grand entrance arch with fresh seasonal flowers and golden frame accents', imageUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=220&h=180&q=80', name: 'Entrance Floral Arch', images: [], hasVariation: false },
        { itemId: 6, priceId: 6, price: '10000', discount: '0', discountedPrice: '10000', description: '12 warm LED spotlight fixtures focusing on stage, cake table, and walkway', imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=220&h=180&q=80', name: 'Ambient LED Spotlights', images: [], hasVariation: false }
      ];
    }

    if (cat.includes('beauty') || cat.includes('salon') || cat.includes('makeup')) {
      return [
        { itemId: 1, priceId: 1, price: '25000', discount: '0', discountedPrice: '25000', description: 'Full HD Airbrush bridal makeup with sweat-proof 24h wear formula', imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=220&h=180&q=80', name: 'HD Airbrush Makeup', images: [], hasVariation: true },
        { itemId: 2, priceId: 2, price: '12000', discount: '0', discountedPrice: '12000', description: 'Intricate bridal hair sculpting, extensions placement, and floral accessories', imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=220&h=180&q=80', name: 'Deluxe Hair Styling', images: [], hasVariation: false },
        { itemId: 3, priceId: 3, price: '5000', discount: '0', discountedPrice: '5000', description: '3D Mink lashes and gel polish bridal manicure with nail extensions', imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=220&h=180&q=80', name: 'Mink Lashes & Nail Art', images: [], hasVariation: false },
        { itemId: 4, priceId: 4, price: '5000', discount: '0', discountedPrice: '5000', description: 'Professional dupatta pinning, matha patti and teeka fixation', imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=220&h=180&q=80', name: 'Dupatta & Jewelry Setting', images: [], hasVariation: false }
      ];
    }

    if (cat.includes('clothing') || cat.includes('dress') || cat.includes('wear') || cat.includes('lehenga') || cat.includes('bridal')) {
      return [
        { itemId: 1, priceId: 1, price: '85000', discount: '0', discountedPrice: '85000', description: 'Hand-embroidered ruby velvet shirt with pure zardozi, dabka, and crystalwork', imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=220&h=180&q=80', name: 'Hand-Embroidered Zardozi Shirt', images: [], hasVariation: true },
        { itemId: 2, priceId: 2, price: '65000', discount: '0', discountedPrice: '65000', description: 'Full flared 16-kali velvet lehenga skirt with gold tilla borders', imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=220&h=180&q=80', name: 'Full Flared Velvet Lehenga Skirt', images: [], hasVariation: true },
        { itemId: 3, priceId: 3, price: '25000', discount: '0', discountedPrice: '25000', description: 'Heavy bridal organza dupatta with 4-side hand-embroidered border', imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=220&h=180&q=80', name: 'Heavily Embellished Dupatta', images: [], hasVariation: false },
        { itemId: 4, priceId: 4, price: '10000', discount: '0', discountedPrice: '10000', description: 'Lightweight chiffon veil dupatta with seqin spray for head draping', imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=220&h=180&q=80', name: 'Regal Veil Dupatta', images: [], hasVariation: false }
      ];
    }

    if (cat.includes('photo') || cat.includes('cinema') || cat.includes('video')) {
      return [
        { itemId: 1, priceId: 1, price: '50000', discount: '0', discountedPrice: '50000', description: '2 Senior Photographers for complete event coverage (unlimited captures)', imageUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=220&h=180&q=80', name: 'Full Day Photography', images: [], hasVariation: false },
        { itemId: 2, priceId: 2, price: '45000', discount: '0', discountedPrice: '45000', description: '4K Cinematic Highlight Film (3-5 mins) with color grading and licensed audio', imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=220&h=180&q=80', name: '4K Cinema Highlight Film', images: [], hasVariation: false },
        { itemId: 3, priceId: 3, price: '15000', discount: '0', discountedPrice: '15000', description: 'Licensed Drone Pilot for 4K aerial venue and baraat arrival shots', imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=220&h=180&q=80', name: 'Aerial Drone Coverage', images: [], hasVariation: false },
        { itemId: 4, priceId: 4, price: '20000', discount: '0', discountedPrice: '20000', description: 'Pre-wedding couple outdoor session with professional lighting studio setup', imageUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=220&h=180&q=80', name: 'Couple Portrait Session', images: [], hasVariation: false },
        { itemId: 5, priceId: 5, price: '25000', discount: '0', discountedPrice: '25000', description: 'Flush-mount luxury leather album with 40 metallic print pages', imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=220&h=180&q=80', name: 'Luxury Hardcover Album', images: [], hasVariation: false },
        { itemId: 6, priceId: 6, price: '10000', discount: '0', discountedPrice: '10000', description: 'Vertical 60s Instagram/TikTok teaser edit delivered within 24 hours', imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=220&h=180&q=80', name: 'Same-Day Reel Edit', images: [], hasVariation: false }
      ];
    }

    if (cat.includes('venue') || cat.includes('lawn') || cat.includes('banquet') || cat.includes('hall')) {
      return [
        { itemId: 1, priceId: 1, price: '1200', discount: '0', discountedPrice: '1200', description: 'Air-conditioned glass banquet hall seating up to 800 guests with stage setup', imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=220&h=180&q=80', name: 'Air-Conditioned Banquet Hall', images: [], hasVariation: false },
        { itemId: 2, priceId: 2, price: '300', discount: '0', discountedPrice: '300', description: 'Open-air lush green garden lawn with ambient perimeter lighting', imageUrl: 'https://images.unsplash.com/photo-1545232979-fbfd42e000b5?auto=format&fit=crop&w=220&h=180&q=80', name: 'Outdoor Garden Lawn Space', images: [], hasVariation: false },
        { itemId: 3, priceId: 3, price: '15000', discount: '0', discountedPrice: '15000', description: 'Dedicated VIP valet parking with secure 200+ vehicle capacity lot', imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=220&h=180&q=80', name: 'Valet Parking & Security', images: [], hasVariation: false },
        { itemId: 4, priceId: 4, price: '20000', discount: '0', discountedPrice: '20000', description: 'Private air-conditioned bridal room with vanity mirror and attached lounge', imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=220&h=180&q=80', name: 'Executive Bridal Suite', images: [], hasVariation: false }
      ];
    }

    if (cat.includes('cake') || cat.includes('bakery') || cat.includes('dessert')) {
      return [
        { itemId: 1, priceId: 1, price: '18000', discount: '0', discountedPrice: '18000', description: '5-Tier tiered wedding cake with handmade edible sugar flowers and gold leaf', imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=220&h=180&q=80', name: '5-Tier Fondant Cake', images: [], hasVariation: true },
        { itemId: 2, priceId: 2, price: '8000', discount: '0', discountedPrice: '8000', description: 'Dessert bar featuring 50 mini cupcakes, cake pops, and French macarons', imageUrl: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=220&h=180&q=80', name: 'Dessert Bar & Macarons', images: [], hasVariation: false },
        { itemId: 3, priceId: 3, price: '2000', discount: '0', discountedPrice: '2000', description: 'Custom acrylic / wooden bride and groom cake topper with couple initials', imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=220&h=180&q=80', name: 'Custom Couple Cake Topper', images: [], hasVariation: false }
      ];
    }

    if (cat.includes('dj') || cat.includes('music') || cat.includes('sound')) {
      return [
        { itemId: 1, priceId: 1, price: '35000', discount: '0', discountedPrice: '35000', description: 'Festival-grade line array sound console with dual subwoofers and DJ booth', imageUrl: 'https://images.unsplash.com/photo-1571266028234-7dc0e9ea5e24?auto=format&fit=crop&w=220&h=180&q=80', name: 'Line Array Sound Console', images: [], hasVariation: false },
        { itemId: 2, priceId: 2, price: '18000', discount: '0', discountedPrice: '18000', description: '8 Intelligent moving head light fixtures with DMX controller and beam effects', imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=220&h=180&q=80', name: 'Intelligent Stage Lighting', images: [], hasVariation: false },
        { itemId: 3, priceId: 3, price: '10000', discount: '0', discountedPrice: '10000', description: 'Low-fog dry ice machine and 4 cold spark pyrotechnic fountains for couple entrance', imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=220&h=180&q=80', name: 'Cold Spark & Low Fog Effects', images: [], hasVariation: false }
      ];
    }

    if (cat.includes('mehndi') || cat.includes('henna')) {
      return [
        { itemId: 1, priceId: 1, price: '10000', discount: '0', discountedPrice: '10000', description: 'Full intricate bridal henna application on hands (front & back) up to elbows', imageUrl: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=220&h=180&q=80', name: 'Full Bridal Hand Henna', images: [], hasVariation: true },
        { itemId: 2, priceId: 2, price: '5000', discount: '0', discountedPrice: '5000', description: 'Bridal feet and ankle henna pattern matching the hand motif', imageUrl: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=220&h=180&q=80', name: 'Bridal Feet & Ankle Henna', images: [], hasVariation: false }
      ];
    }

    if (cat.includes('bedding') || cat.includes('bed')) {
      return [
        { itemId: 1, priceId: 1, price: '20000', discount: '0', discountedPrice: '20000', description: '100% Egyptian Cotton 600TC bridal bed sheet with 4 pillowcases and duvet cover', imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=220&h=180&q=80', name: 'Egyptian Cotton Sheet Set', images: [], hasVariation: true },
        { itemId: 2, priceId: 2, price: '15000', discount: '0', discountedPrice: '15000', description: 'Heavy hand-embroidered velvet bridal duvet with gold tilla border', imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=220&h=180&q=80', name: 'Hand-Embroidered Velvet Duvet', images: [], hasVariation: false }
      ];
    }

    if (cat.includes('furniture')) {
      return [
        { itemId: 1, priceId: 1, price: '120000', discount: '0', discountedPrice: '120000', description: 'Solid Sheesham wood king size bed with tufted velvet headboard', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=220&h=180&q=80', name: 'Solid Wood King Bed', images: [], hasVariation: true },
        { itemId: 2, priceId: 2, price: '75000', discount: '0', discountedPrice: '75000', description: 'Large 6-drawer dresser with matching wall mirror frame', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=220&h=180&q=80', name: 'Dresser with Mirror Frame', images: [], hasVariation: false }
      ];
    }

    if (cat.includes('invitation') || cat.includes('card')) {
      return [
        { itemId: 1, priceId: 1, price: '250', discount: '0', discountedPrice: '250', description: '350GSM Cotton cardstock invitation with real gold foil stamping & wax seal', imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=220&h=180&q=80', name: 'Gold Foil Stamped Card', images: [], hasVariation: false },
        { itemId: 2, priceId: 2, price: '200', discount: '0', discountedPrice: '200', description: 'Custom printed sweets / dry fruit presentation box matching the invitation theme', imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=220&h=180&q=80', name: 'Matching Sweets Box', images: [], hasVariation: false }
      ];
    }

    if (cat.includes('transport') || cat.includes('car')) {
      return [
        { itemId: 1, priceId: 1, price: '50000', discount: '0', discountedPrice: '50000', description: '1958 Vintage Rolls Royce Silver Cloud with uniformed chauffeur for 8 hours', imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=220&h=180&q=80', name: 'Vintage Rolls Royce Rental', images: [], hasVariation: false },
        { itemId: 2, priceId: 2, price: '15000', discount: '0', discountedPrice: '15000', description: 'Fresh red rose garland and bonnet ribbon decoration for the bridal car', imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=220&h=180&q=80', name: 'Fresh Flower Car Decoration', images: [], hasVariation: false }
      ];
    }

    if (cat.includes('tent') || cat.includes('marquee')) {
      return [
        { itemId: 1, priceId: 1, price: '120000', discount: '0', discountedPrice: '120000', description: 'German aluminum frame waterproof marquee tent with pleated satin inner liners', imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=220&h=180&q=80', name: 'German Marquee Tent Setup', images: [], hasVariation: false },
        { itemId: 2, priceId: 2, price: '60000', discount: '0', discountedPrice: '60000', description: 'Wall-to-wall red/champagne carpet flooring over raised wooden stage platform', imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=220&h=180&q=80', name: 'Full Carpeted Stage Platform', images: [], hasVariation: false }
      ];
    }

    return [
      { itemId: 1, priceId: 1, price: '450', discount: '0', discountedPrice: '450', description: 'Aromatic basmati with tender chicken and hand-ground spice blend, slow dum cooked', imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=220&h=180&q=80', name: 'Chicken Biryani', images: [], hasVariation: false },
      { itemId: 2, priceId: 2, price: '500', discount: '0', discountedPrice: '500', description: 'Slow-cooked premium beef with whole spices — tender, fragrant, and deeply rich', imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=220&h=180&q=80', name: 'Beef Pulao', images: [], hasVariation: false },
      { itemId: 3, priceId: 3, price: '80', discount: '0', discountedPrice: '80', description: 'Fresh strained yogurt with roasted cumin, mint, and crisp cucumber dice', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=220&h=180&q=80', name: 'Raita & Mint Chutney', images: [], hasVariation: false },
      { itemId: 4, priceId: 4, price: '120', discount: '0', discountedPrice: '120', description: 'Traditional slow-reduced milk dessert with saffron, green cardamom, and pistachios', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=220&h=180&q=80', name: 'Signature Zafrani Kheer', images: [], hasVariation: false },
      { itemId: 5, priceId: 5, price: '250', discount: '0', discountedPrice: '250', description: 'Juicy minced beef & herb kebabs grilled on skewers over live charcoal', imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=220&h=180&q=80', name: 'Seekh Kebab', images: [], hasVariation: false },
      { itemId: 6, priceId: 6, price: '300', discount: '0', discountedPrice: '300', description: 'Classic wok-cooked chicken in a rich tomato & ginger masala — a Pakistani staple', imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=220&h=180&q=80', name: 'Chicken Karahi', images: [], hasVariation: false }
    ];
  };

  const formatCompactPrice = (priceVal: any) => {
    if (priceVal === undefined || priceVal === null || priceVal === '') return '';
    const num = parseFloat(priceVal.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return '';
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}k`;
    }
    return String(num);
  };



  const getFittingDateString = () => {
    if (!selectedDate) return 'Select event date first';
    const parts = selectedDate.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      const eventDate = new Date(year, month, day);
      if (!isNaN(eventDate.getTime())) {
        const fitDate = new Date(eventDate);
        fitDate.setDate(eventDate.getDate() - 21);
        return fitDate.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
    }
    return 'Select event date first';
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const timer = setTimeout(() => {
      setIsLoggedIn(!!token);
      if (!token) {
        setActiveTab('reviews');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const getCalendarDateRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 6, 0);
    const pad = (num: number) => String(num).padStart(2, '0');
    const firstStr = `${pad(firstDay.getMonth() + 1)}/${pad(firstDay.getDate())}/${firstDay.getFullYear()}`;
    const lastStr = `${pad(lastDay.getMonth() + 1)}/${pad(lastDay.getDate())}/${lastDay.getFullYear()}`;
    return `${firstStr}- ${lastStr}`;
  };

  // Load Sub Components
  async function loadCalendarSlots() {
    try {
      const dateRange = getCalendarDateRange();
      const res = await api.get<{ status: boolean; data: any[] }>(
        `/api/v1/${endpointPath}/calendars?date_range=${encodeURIComponent(dateRange)}`
      );
      if (res.status && res.data) {
        const slots: CalendarSlot[] = res.data.map((c) => ({
          calendarDate: c.calendar_date,
          info3Label: c.info3_label,
          price: c.price !== undefined && c.price !== null ? String(c.price) : '0',
          priceId: c.price_id,
          isAvailable: c.is_available === 1 || c.is_available === true || String(c.is_available) === '1',
        }));
        setCalendarSlots(slots);
        // Default to first available date
        const avail = slots.find((s) => s.isAvailable);
        if (avail) {
          setSelectedDate(avail.calendarDate);
          setSelectedPriceId(avail.priceId);
          setCurrentMonth(new Date(avail.calendarDate));
        }
      }
    } catch (e) {
      console.error('Error loading calendars:', e);
    }
  }

  async function loadColors() {
    try {
      const res = await api.getSafe<{ status: boolean; data: any[] }>(`/api/v1/${endpointPath}/colors`);
      if (res && res.status && res.data) {
        setColors(res.data.map(c => ({ id: c.id, title: c.title, hexCode: c.hex_code })));
        if (res.data.length > 0) setSelectedColorId(res.data[0].id);
      } else {
        setColors([]);
      }
    } catch (e) {
      console.error(e);
      setColors([]);
    }
  }

  async function loadSizes() {
    try {
      const res = await api.getSafe<{ status: boolean; data: any[] }>(`/api/v1/${endpointPath}/sizes`);
      if (res && res.status && res.data) {
        setSizes(res.data);
        if (res.data.length > 0) setSelectedSizeId(res.data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadPackageDetails() {
    try {
      const res = await api.getSafe<{ status: boolean; data: any }>(`/api/v1/${endpointPath}/product-detail`);
      if (res && res.status && res.data) {
        const rawData = Array.isArray(res.data) ? res.data : [];
        const productDetails = rawData.filter((e: any) => e.main_heading !== undefined || e.mainHeading !== undefined);
        setPackageDetails(productDetails);
      }
    } catch (e) {
      console.error('Error loading package product details:', e);
    }
  }

  async function loadReviews() {
    try {
      const res = await api.getSafe<{ status: boolean; data: any[] }>(`/api/v1/${endpointPath}/ratings?limit=${reviewsLimit}&page=${reviewsPage}`);
      if (res && res.status && res.data) {
        setReviews(res.data.map(r => ({
          id: r.id,
          review: r.review,
          fiveStars: r.five_stars,
          createdAt: r.created_at,
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (detail) {
      loadReviews();
    }
  }, [reviewsPage, reviewsLimit]);

  // Load Main Service Specs
  useEffect(() => {
    async function loadServiceSpecs() {
      setIsLoading(true);
      try {
        const res = await api.getSafe<{ status: boolean; data: any }>(`/api/v1/${endpointPath}`);
        if (res && res.status && res.data) {
          const raw = res.data;
          const detailModel: ServiceDetail = {
            serviceId: raw.service_id,
            slug: raw.slug,
            name: raw.name,
            itemName: raw.item_name,
            priceLabel: raw.price_label,
            info1Label: raw.info1_label,
            info2Label: raw.info2_label,
            info3Label: raw.info3_label,
            info4Label: raw.info4_label,
            minimumGuests: raw.minimum_guests || 0,
            maximumGuests: raw.maximum_guests || 0,
            discount: raw.discount || 0,
            price: raw.price,
            finalPrice: raw.final_price || raw.price,
            discountPercentage: raw.discount_percentage || 0,
            originalPrice: raw.original_price,
            rating: raw.rating || 0.0,
            reviewsCount: raw.reviews_count || 0,
            imageUrl: raw.image_url,
            description: raw.description || '',
            defaultPriceId: raw.default_price_id || 0,
            itemsCount: raw.items_count || 0,
            maxItemSelection: raw.max_item_selection || 0,
            images: raw.images || [],
            tags: raw.tags || [],
            isVerified: raw.is_verified === 1 || raw.isVerified === true,
            location: raw.location || '',
            customerLiked: raw.customer_liked === 1 || raw.customerLiked === 1,
            endpointLikeUri: raw.endpoint_like_uri || raw.endpointLikeUri || '',
            detailConfig: {
              isShowRatesPerHead: raw.detail_config?.is_show_rates_per_head === 1,
              isShowMinimumGuests: raw.detail_config?.is_show_minimum_guests === 1,
              isShowAddress: raw.detail_config?.is_show_address === 1,
              isShowCalendar: raw.detail_config?.is_show_calendar === 1,
              isShowItemsList: raw.detail_config?.is_show_items_list === 1,
              isShowSize: raw.detail_config?.is_show_size === 1 || raw.detail_config?.is_show_variations === 1,
              isShowColor: raw.detail_config?.is_show_color === 1 || raw.detail_config?.is_show_variations === 1,
              isShowGuidelinesPolicies: raw.detail_config?.is_show_guidelines_policies === 1,
              isShowPaymentSchedule: raw.detail_config?.is_show_payment_schedule === 1,
              isShowQuantity: raw.detail_config?.is_show_quantity === 1,
            },
          };

          const catFallback = getCategorySpecificFallback(category, slugStr);
          const isNonCateringCategory = (category || '').toLowerCase() !== 'catering';
          const isNonCateringMatch = isNonCateringCategory || /zara|bridal|lehenga|dress|dj|music|sound|photo|cinema|beauty|salon|cake|venue|decor/i.test(category + ' ' + slugStr + ' ' + (raw.name || ''));

          if (isNonCateringMatch && catFallback) {
            detailModel.name = catFallback.name;
            detailModel.price = catFallback.price;
            detailModel.finalPrice = catFallback.finalPrice || catFallback.price;
            detailModel.originalPrice = catFallback.originalPrice;
            detailModel.priceLabel = catFallback.priceLabel;
            detailModel.info1Label = catFallback.info1Label;
            detailModel.info2Label = catFallback.info2Label;
            detailModel.imageUrl = catFallback.imageUrl;
            detailModel.images = catFallback.images;
            detailModel.description = catFallback.description;
            detailModel.tags = catFallback.tags;
            detailModel.detailConfig = catFallback.detailConfig;
            setCustomItems(getCategoryCustomItems(category));
          }

          setDetail(detailModel);
          setIsSaved(raw.customer_liked === 1 || raw.customerLiked === 1);
          setSelectedPriceId(detailModel.defaultPriceId);
          setGuestCount(detailModel.minimumGuests || 100);
          if (detailModel.detailConfig.isShowRatesPerHead) {
            setQuantity(4);
          } else {
            setQuantity(1);
          }

          if (detailModel.detailConfig.isShowCalendar) loadCalendarSlots();
          if (detailModel.detailConfig.isShowColor) loadColors();
          if (detailModel.detailConfig.isShowGuidelinesPolicies) loadPackageDetails();
          if (raw.detail_config?.is_show_colors === 1) loadColors();
          if (raw.detail_config?.is_show_sizes === 1) loadSizes();
          
          loadReviews();

          api.getSafe(`/api/v1/${endpointPath}/frequently-bought`).then((r: any) => {
            if (r && r.status && r.data) setFrequentlyBought(r.data);
          });
          api.getSafe(`/api/v1/${endpointPath}/recommendations`).then((r: any) => {
            if (r && r.status && r.data) setRecommendations(r.data);
          });
        } else {
          // Fallback if API returns status: false or null data
          const fallbackDetail = getCategorySpecificFallback(category, slugStr);
          setDetail(fallbackDetail);
          setCustomItems(getCategoryCustomItems(category));
        }
      } catch (e) {
        console.error('Error fetching service details:', e);
        const fallbackDetail = getCategorySpecificFallback(category, slugStr);
        setDetail(fallbackDetail);
        setCustomItems(getCategoryCustomItems(category));
      } finally {
        setIsLoading(false);
      }
    }
    loadServiceSpecs();
  }, [category, slugStr]);

  const handleAddToRegistry = () => {
    if (!detail) return;

    let targetRegId = 'zara-ahmed';
    try {
      const storedRegs = JSON.parse(localStorage.getItem('local_registries') || '[]');
      if (Array.isArray(storedRegs) && storedRegs.length > 0 && storedRegs[0].id) {
        targetRegId = String(storedRegs[0].id);
      }
    } catch (e) {}

    const priceNum = parseFloat((detail.finalPrice || detail.price || '0').toString().replace(/[^0-9.]/g, '')) || 0;
    const wasNum = detail.originalPrice ? parseFloat(detail.originalPrice.toString().replace(/[^0-9.]/g, '')) : 0;

    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: detail.name || 'Service Package',
      vendor: detail.info1Label || 'Vendor',
      price: priceNum,
      was: wasNum > priceNum ? wasNum : 0,
      qty: quantity || 1,
      img: detail.imageUrl || detail.images?.[0] || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=240&fit=crop',
      status: 'available',
      by: '',
      category: category,
      slug: slugStr
    };

    // Save to primary target registry key
    const primaryKey = `reg_items_${targetRegId}`;
    try {
      const existingPrimary = JSON.parse(localStorage.getItem(primaryKey) || '[]');
      const updatedPrimary = [newItem, ...(Array.isArray(existingPrimary) ? existingPrimary : [])];
      localStorage.setItem(primaryKey, JSON.stringify(updatedPrimary));
    } catch (e) {}

    // Also sync to alias keys so all default registry views find the item
    const aliasKeys = ['reg_items_zara-ahmed', 'reg_items_reg-1'];
    aliasKeys.forEach(k => {
      if (k !== primaryKey) {
        try {
          const existingAlias = JSON.parse(localStorage.getItem(k) || '[]');
          const updatedAlias = [newItem, ...(Array.isArray(existingAlias) ? existingAlias : [])];
          localStorage.setItem(k, JSON.stringify(updatedAlias));
        } catch (e) {}
      }
    });

    // Fire API safe call
    api.postSafe('/api/v1/gift-registry/items/add', {
      service_id: detail.serviceId,
      registry_id: targetRegId
    });

    setIsSaved(true);
    showToast(`"${detail.name}" added to your registry!`, 'success');
  };

  // Load active customization item specs and variations tree dynamically on click
  useEffect(() => {
    if (activeDetailItemId === null) {
      const timer = setTimeout(() => {
        setActiveItemDetails(null);
        setActiveItemVariations(null);
        setActiveItemImages([]);
        setActiveItemCarouselIdx(0);
        setSelectedVariationPath([]);
      }, 0);
      return () => clearTimeout(timer);
    }

    const itemId = activeDetailItemId;
    const activeItem = customItems.find((i) => i.itemId === itemId);
    if (!activeItem) return;

    async function loadItemCustomizationData(item: CustomItem) {
      setIsDetailLoading(true);
      try {
        const detailsPromise = api.get<{ status: boolean; data: any }>(
          `/api/v1/${endpointPath}/product-detail?item_id=${itemId}`
        );

        const variationsPromise = item.hasVariation
          ? api.get<{ status: boolean; data: any }>(
              `/api/v1/${endpointPath}/variations?item_id=${itemId}`
            )
          : Promise.resolve({ status: false, data: null });

        const [detailsRes, variationsRes] = await Promise.all([
          detailsPromise.catch(err => {
            console.error('Details fetch error:', err);
            return { status: false, data: null };
          }),
          variationsPromise.catch(err => {
            console.error('Variations fetch error:', err);
            return { status: false, data: null };
          })
        ]);

        let fallbackImages = item.images && item.images.length > 0
          ? item.images
          : [item.imageUrl];

        if (detailsRes?.status && detailsRes.data) {
          const rawData = Array.isArray(detailsRes.data) ? detailsRes.data : [];
          const images = rawData.find((e: any) => e.images !== undefined)?.images || [];
          const productDetails = rawData.filter((e: any) => e.main_heading !== undefined || e.mainHeading !== undefined);
          const parsed = { productDetails, images };
          setActiveItemDetails(parsed);
          if (parsed.images && parsed.images.length > 0) {
            fallbackImages = parsed.images;
          }
        }

        let variationsRoot = null;
        if (variationsRes?.status && variationsRes.data) {
          variationsRoot = variationsRes.data;
          setActiveItemVariations(variationsRoot);
        }

        const savedSelection = itemVariations[itemId];
        if (savedSelection && savedSelection.selectedPath && savedSelection.selectedPath.length > 0) {
          setSelectedVariationPath(savedSelection.selectedPath);
          let pathImages: string[] = [];
          for (let i = savedSelection.selectedPath.length - 1; i >= 0; i--) {
            const opt = savedSelection.selectedPath[i];
            if (opt.images && opt.images.length > 0) {
              pathImages = opt.images;
              break;
            }
          }
          setActiveItemImages(pathImages.length > 0 ? pathImages : fallbackImages);
        } else if (variationsRoot) {
          const autoSelectPath = (node: any): any[] => {
            if (!node || !node.options || node.options.length === 0) return [];
            const firstOpt = node.options[0];
            const optObj = {
              value: firstOpt.value,
              variationId: firstOpt.variation_id || null,
              images: firstOpt.images || [],
              heading: node.heading,
              next: firstOpt.options ? { heading: firstOpt.heading, options: firstOpt.options } : null
            };
            const result = [optObj];
            if (optObj.next) {
              result.push(...autoSelectPath(optObj.next));
            }
            return result;
          };

          const path = autoSelectPath(variationsRoot);
          setSelectedVariationPath(path);

          let pathImages: string[] = [];
          for (let i = 0; i < path.length; i++) {
            if (path[i].images && path[i].images.length > 0) {
              pathImages = path[i].images;
              break;
            }
          }
          setActiveItemImages(pathImages.length > 0 ? pathImages : fallbackImages);
        } else {
          setActiveItemImages(fallbackImages);
        }
      } catch (err) {
        console.error('Error loading customization item details:', err);
      } finally {
        setIsDetailLoading(false);
      }
    }

    loadItemCustomizationData(activeItem);
  }, [activeDetailItemId, customItems, itemVariations]);

  const handleVariationSelect = (levelIdx: number, option: any, heading: string) => {
    const optObj = {
      value: option.value,
      variationId: option.variation_id || null,
      images: option.images || [],
      heading: heading,
      next: option.options ? { heading: option.heading || 'Size', options: option.options } : null
    };

    const autoSelectChildDefaults = (node: any): any[] => {
      if (!node || !node.options || node.options.length === 0) return [];
      const firstOpt = node.options[0];
      const childObj = {
        value: firstOpt.value,
        variationId: firstOpt.variation_id || null,
        images: firstOpt.images || [],
        heading: node.heading,
        next: firstOpt.options ? { heading: firstOpt.heading, options: firstOpt.options } : null
      };
      const result = [childObj];
      if (childObj.next) {
        result.push(...autoSelectChildDefaults(childObj.next));
      }
      return result;
    };

    const newPath = [...selectedVariationPath.slice(0, levelIdx), optObj];
    if (optObj.next) {
      newPath.push(...autoSelectChildDefaults(optObj.next));
    }
    setSelectedVariationPath(newPath);

    let pathImages: string[] = [];
    for (let i = newPath.length - 1; i >= 0; i--) {
      if (newPath[i].images && newPath[i].images.length > 0) {
        pathImages = newPath[i].images;
        break;
      }
    }
    if (pathImages.length > 0) {
      setActiveItemImages(pathImages);
    } else {
      const activeItem = customItems.find((i) => i.itemId === activeDetailItemId);
      const fallback = activeItemDetails?.images && activeItemDetails.images.length > 0
        ? activeItemDetails.images
        : (activeItem?.images && activeItem.images.length > 0 ? activeItem.images : (activeItem ? [activeItem.imageUrl] : []));
      setActiveItemImages(fallback);
    }
    setActiveItemCarouselIdx(0);
  };

  // Fetch customizable sub items list when date is selected
  useEffect(() => {
    async function loadCustomItems() {
      if (!detail?.detailConfig.isShowItemsList) return;
      const getTodayFormatted = () => {
        const d = new Date();
        const pad = (num: number) => String(num).padStart(2, '0');
        return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
      };
      const formatDateToMMDDYYYY = (dStr: string) => {
        const d = dStr ? new Date(dStr) : new Date();
        const pad = (num: number) => String(num).padStart(2, '0');
        return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
      };
      const dateToUse = selectedDate ? formatDateToMMDDYYYY(selectedDate) : getTodayFormatted();
      try {
        const res = await api.getSafe<{ status: boolean; data: any[] }>(
          `/api/v1/${endpointPath}/items?date_range=${dateToUse} - ${dateToUse}`
        );
        if (res && res.status && res.data && res.data.length > 0) {
          const items: CustomItem[] = res.data.map((i) => ({
            itemId: i.item_id,
            priceId: i.price_id,
            price: i.price,
            discount: i.discount,
            discountedPrice: i.discounted_price,
            description: i.description || '',
            imageUrl: i.image_url,
            name: i.name,
            images: i.images || [],
            hasVariation: i.has_variation === 1 || i.has_variation === true,
          }));
          setCustomItems(items);
        } else {
          setCustomItems(getCategoryCustomItems(category));
        }
      } catch (e) {
        console.error('Error fetching custom items:', e);
        setCustomItems(getCategoryCustomItems(category));
      }
    }
    loadCustomItems();
  }, [selectedDate, detail]);

  async function loadInstallmentTerms(summaryId: number) {
    try {
      const res = await api.getSafe<{ status: boolean; data: PaymentTermsResponse }>(
        `/api/v1/${endpointPath}/payment-terms?price_summary_id=${summaryId}`
      );
      if (res && res.status && res.data?.summary) {
        const mappedInst = (res.data.summary || []).map((r: any) => ({
          labelInfo: r.label_info || r.labelInfo || '',
          labelValue: r.label_value !== undefined ? r.label_value : r.labelValue
        }));
        setInstallments(mappedInst);
      }
    } catch (e) {
      console.error('Error loading installments schedule:', e);
    }
  }

  // Recalculate price summary on customization modifications
  useEffect(() => {
    async function updatePriceSummary() {
      if (!detail) return;
      setIsPriceLoading(true);
      try {
        const formatDateToMMDDYYYY = (dStr: string) => {
          const d = dStr ? new Date(dStr) : new Date();
          const pad = (num: number) => String(num).padStart(2, '0');
          return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
        };

        const payload: any = {
          price_id: selectedPriceId || detail.defaultPriceId,
          quantity: quantity,
          service_date: selectedDate ? formatDateToMMDDYYYY(selectedDate) : formatDateToMMDDYYYY(''),
          no_of_guests: guestCount || detail.minimumGuests || 100,
          items: selectedItemIds.map(id => {
            const varItem: any = {
              item_id: id,
              price_id: selectedPriceId || detail.defaultPriceId || 1,
              quantity: 1
            };
            const saved = itemVariations[id];
            if (saved && saved.selectedPath && saved.selectedPath.length > 0) {
              const leaf = saved.selectedPath.find(p => p.variationId !== null && p.variationId !== undefined);
              if (leaf) {
                varItem.variation_id = leaf.variationId;
              }
            }
            return varItem;
          }),
        };
        if (selectedColorId) payload.color_id = selectedColorId;
        if (selectedSizeId) payload.size_id = selectedSizeId;

        const res = await api.postSafe<{ status: boolean; data: PriceSummaryResponse }>(
          `/api/v1/${endpointPath}/price-summary`,
          payload
        );

        if (res && res.status && res.data) {
          const summaryId = res.data.price_summary_id || res.data.priceSummaryId || null;
          setPriceSummaryId(summaryId);
          setPriceSummaryHeading(res.data.heading || '');
          const isNonCateringSlug = /zara|bridal|lehenga|dress|dj|music|sound|photo|cinema|beauty|salon|cake|venue|decor/i.test(slugStr + ' ' + (detail.name || ''));

          if (isNonCateringSlug && detail.price) {
            const numVal = parseFloat(detail.price.toString().replace(/,/g, '')) || 185000;
            const totalVal = numVal * (quantity || 1);
            setPriceRows([
              { labelInfo: `${detail.name} x ${quantity || 1}`, labelValue: `PKR ${totalVal.toLocaleString()}` },
              { labelInfo: 'Total Amount', labelValue: `PKR ${totalVal.toLocaleString()}` }
            ]);
          } else {
            const mappedRows = (res.data.summary || []).map((r: any) => ({
              labelInfo: r.label_info || r.labelInfo || '',
              labelValue: r.label_value !== undefined ? r.label_value : r.labelValue
            }));
            setPriceRows(mappedRows);
          }

          // Trigger installments fetch if price id is active
          if (detail.detailConfig.isShowPaymentSchedule && summaryId) {
            loadInstallmentTerms(summaryId);
          }
        }
      } catch (e) {
        console.error('Error calculating price summary:', e);
        if (detail && detail.price) {
          const numVal = parseFloat(detail.price.toString().replace(/,/g, '')) || 185000;
          const totalVal = numVal * (quantity || 1);
          setPriceRows([
            { labelInfo: `${detail.name} x ${quantity || 1}`, labelValue: `PKR ${totalVal.toLocaleString()}` },
            { labelInfo: 'Total Amount', labelValue: `PKR ${totalVal.toLocaleString()}` }
          ]);
        }
      } finally {
        setIsPriceLoading(false);
      }
    }

    // Debounce wrapper to prevent multiple API blasts during slider scroll
    const delay = setTimeout(() => {
      updatePriceSummary();
    }, 400);

    return () => clearTimeout(delay);
  }, [selectedDate, selectedPriceId, guestCount, quantity, selectedItemIds, selectedColorId, selectedSizeId, itemVariations, detail]);
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleItemToggle = (itemId: number) => {
    setSelectedItemIds((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        // Enforce max selections if active
        if (detail?.maxItemSelection && prev.length >= detail.maxItemSelection) {
          showToast(`You can select a maximum of ${detail.maxItemSelection} items.`, 'info');
          return prev;
        }
        return [...prev, itemId];
      }
    });
  };

  const handleBookingSubmit = async () => {
    if (!isLoggedIn) {
      showToast('Please log in to add items to your cart.', 'error');
      router.push('/login');
      return;
    }

    const unmetPolicies = packageDetails.filter((structure: any, idx: number) => {
      const requiresCheckbox = structure.requiresCheckbox === 1 || structure.requires_checkbox === 1 || structure.requiresCheckbox === true;
      return requiresCheckbox && !checkedPolicies[idx];
    });

    if (unmetPolicies.length > 0) {
      const titles = unmetPolicies.map((p: any) => p.mainHeading || p.main_heading || 'Guidelines').join(', ');
      showToast(`Please accept policy agreement checkboxes for: ${titles}`, 'error');
      setActiveTab('info');
      
      const newOpen = { ...openAccordions };
      unmetPolicies.forEach((p: any) => {
        const title = p.mainHeading || p.main_heading || 'Guidelines';
        newOpen[title] = true;
      });
      setOpenAccordions(newOpen);
      return;
    }

    if (detail && detail.detailConfig.isShowItemsList && detail.maxItemSelection > 0) {
      const selectedCount = selectedItemIds.length;
      if (selectedCount < detail.maxItemSelection) {
        const needed = detail.maxItemSelection - selectedCount;
        showToast(`Please select ${needed} more item${needed === 1 ? '' : 's'} to complete your package.`, 'error');
        setActiveTab('items');
        return;
      }
    }

    const itemsMissingVariation = customItems.filter((item) => {
      const isSelected = selectedItemIds.includes(item.itemId);
      if (!isSelected) return false;
      if (!item.hasVariation) return false;
      const saved = itemVariations[item.itemId];
      return !saved || !saved.selectedPath || saved.selectedPath.length === 0;
    });

    if (itemsMissingVariation.length > 0) {
      showToast(`Please select variations for ${itemsMissingVariation.length} item${itemsMissingVariation.length === 1 ? '' : 's'}.`, 'error');
      setActiveDetailItemId(itemsMissingVariation[0].itemId);
      return;
    }

    if (!priceSummaryId) {
      showToast('The selected date is unavailable for booking. Please choose a different date.', 'error');
      return;
    }

    try {
      const payload = {
        price_summary_id: priceSummaryId,
        items: selectedItemIds.map(id => {
          const customItem = customItems.find(item => item.itemId === id);
          const varItem: any = {
            item_id: id,
            price_id: customItem ? customItem.priceId : 1,
            quantity: quantity
          };
          const saved = itemVariations[id];
          if (saved && saved.selectedPath && saved.selectedPath.length > 0) {
            const leaf = saved.selectedPath.find(p => p.variationId !== null && p.variationId !== undefined);
            if (leaf) {
              varItem.variation_id = leaf.variationId;
            }
          }
          return varItem;
        })
      };

      await api.post('/api/v1/cart/items/add', payload);
      showToast('Package successfully added to cart!', 'success');
      router.push('/cart');
    } catch (e: any) {
      showToast('Failed to add package to cart. Please try again.', 'error');
    }
  };

  if (isLoading || !detail) {
    return (
      <>
        <Header />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '36px', color: 'var(--primary)' }}></i>
          <span style={{ fontFamily: 'var(--font-poppins)', color: 'var(--text-secondary)' }}>Loading package customization details...</span>
        </div>
        <Footer />
      </>
    );
  }

  const formatBreakdownValue = (label: string | undefined, val: any) => {
    if (val === undefined || val === null) return 'unset';
    const lblLower = (label || '').toLowerCase();
    
    // Guests or numeric counts
    if (lblLower.includes('guests') || lblLower === 'quantity' || lblLower === 'items count') {
      return val.toString();
    }
    
    // Reservation percentage or any percentage
    if (lblLower.includes('reservation %') || lblLower.includes('percent')) {
      const numericPart = val.toString().replace(/%/g, '').trim();
      return `${numericPart}%`;
    }
    
    // Currency formatting
    if (typeof val === 'number') {
      return `PKR ${val.toLocaleString('en-US')}`;
    }
    
    // String that might contain PKR
    const valStr = val.toString();
    if (valStr.includes('PKR')) {
      return valStr;
    }
    
    // If it's a number-like string
    if (/^\d+(\.\d+)?$/.test(valStr)) {
      const parsedNum = parseFloat(valStr);
      return `PKR ${parsedNum.toLocaleString('en-US')}`;
    }
    
    return valStr;
  };

  const isBoldRow = (label: string | undefined) => {
    if (!label) return false;
    const lblLower = label.toLowerCase();
    return lblLower.includes('order total') || 
           lblLower.includes('amount due today') || 
           lblLower.includes('future payments') ||
           lblLower.includes('remaining balance') ||
           lblLower.includes('total');
  };

  const toggleAccordion = (heading: string) => {
    setOpenAccordions(prev => ({
      ...prev,
      [heading]: !prev[heading]
    }));
  };

  const getDaysInMonthGrid = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    const gridDays: Array<{ date: Date; isCurrentMonth: boolean; key: string }> = [];

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthTotalDays - i);
      gridDays.push({
        date: d,
        isCurrentMonth: false,
        key: `day-prev-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      });
    }

    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      gridDays.push({
        date: d,
        isCurrentMonth: true,
        key: `day-curr-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      });
    }

    const remaining = 42 - gridDays.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      gridDays.push({
        date: d,
        isCurrentMonth: false,
        key: `day-next-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      });
    }
    return gridDays;
  };

  const findCalendarSlot = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return calendarSlots.find(slot => slot.calendarDate === dateStr);
  };

  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return 'Select Date';
    let normalized = dStr;
    if (dStr.includes('/')) {
      const parts = dStr.split('/');
      normalized = `${parts[2]}-${parts[0]}-${parts[1]}`;
    }
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return dStr;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const isDateSelected = (d: Date) => {
    if (!selectedDate) return false;
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    
    let normalizedSelected = selectedDate;
    if (selectedDate.includes('/')) {
      const parts = selectedDate.split('/');
      normalizedSelected = `${parts[2]}-${parts[0]}-${parts[1]}`;
    }
    return dateStr === normalizedSelected;
  };

  const getCategoryIcon = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('apparel') || c.includes('clothing') || c.includes('bridal') || c.includes('wear')) return 'bx-closet';
    if (c.includes('catering') || c.includes('food')) return 'bx-dish';
    if (c.includes('decor') || c.includes('decoration')) return 'bx-palette';
    if (c.includes('venue') || c.includes('banquet') || c.includes('palace')) return 'bx-buildings';
    if (c.includes('beauty') || c.includes('saloon') || c.includes('salon')) return 'bx-brush';
    if (c.includes('appliance')) return 'bx-tv';
    return 'bx-star';
  };

  const getGalleryPills = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('venue') || c.includes('banquet') || c.includes('hall')) {
      return [
        { label: 'Virtual Tour', icon: 'bx-video' },
        { label: 'Capacity Chart', icon: 'bx-group' }
      ];
    }
    if (c.includes('cake') || c.includes('dessert') || c.includes('mithai')) {
      return [
        { label: 'Flavour Tasting', icon: 'bx-food-menu' },
        { label: 'Design Lookbook', icon: 'bx-book-open' }
      ];
    }
    if (c.includes('photo') || c.includes('cinema') || c.includes('video') || c.includes('camera')) {
      return [
        { label: 'Portfolio', icon: 'bx-images' },
        { label: 'Equipment List', icon: 'bx-camera' }
      ];
    }
    if (c.includes('beauty') || c.includes('salon') || c.includes('make')) {
      return [
        { label: 'Artist Profile', icon: 'bx-user' },
        { label: 'Service Menu', icon: 'bx-receipt' }
      ];
    }
    if (c.includes('decor') || c.includes('floral')) {
      return [
        { label: 'Theme Lookbook', icon: 'bx-palette' },
        { label: 'Floral Guide', icon: 'bx-spa' }
      ];
    }
    if (c.includes('transport') || c.includes('car')) {
      return [
        { label: 'Fleet Details', icon: 'bx-car' },
        { label: 'Rental Terms', icon: 'bx-receipt' }
      ];
    }
    if (c.includes('furniture') || c.includes('rental') || c.includes('stage')) {
      return [
        { label: 'Catalogue', icon: 'bx-chair' },
        { label: 'Material Specs', icon: 'bx-info-circle' }
      ];
    }
    if (c.includes('tent') || c.includes('shamiana')) {
      return [
        { label: 'Layout Plans', icon: 'bx-map-alt' },
        { label: 'Fabric Specs', icon: 'bx-shield' }
      ];
    }
    if (c.includes('bedding') || c.includes('hotel') || c.includes('linen')) {
      return [
        { label: 'Thread Chart', icon: 'bx-list-ol' },
        { label: 'Size Guide', icon: 'bx-ruler' }
      ];
    }
    if (c.includes('invitation') || c.includes('card') || c.includes('stationery')) {
      return [
        { label: 'Paper Swatches', icon: 'bx-paste' },
        { label: 'Print Options', icon: 'bx-printer' }
      ];
    }
    return [
      { label: 'View Lookbook', icon: 'bx-book-open' },
      { label: 'Size Guide', icon: 'bx-ruler' }
    ];
  };

  // Gallery slider configuration
  const galleryImages = detail.images.length > 0 ? detail.images : [detail.imageUrl];

  return (
    <>
      <Header />

      <main className={styles.page}>
        {/* BREADCRUMB */}
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>›</span>
          <Link href={`/services/${category}`}>{detail.info2Label || category}</Link>
          <span className={styles.sep}>›</span>
          <span className={styles.current}>{detail.name}</span>
        </div>

        {/* GALLERY */}
        <section className={styles.gallery}>
          <div
            className={styles.galleryHero}
            style={{ backgroundImage: `url(${galleryImages[0]})` }}
            onClick={() => {
              setActivePhotoIdx(0);
              setIsLightboxOpen(true);
            }}
          >
            <button
              type="button"
              className={`${styles.gallerySave} ${isSaved ? styles.gallerySaveActive : ''}`}
              onClick={async (e) => {
                e.stopPropagation();

                const token = localStorage.getItem('access_token');
                if (!token) {
                  router.push(`/login?redirect=/services/${category}/${serviceId}`);
                  return;
                }

                const currentLiked = isSaved;
                const newLikedStatus = currentLiked ? 0 : 1;
                setIsSaved(newLikedStatus === 1);

                try {
                  const endpoint = detail?.endpointLikeUri || `services/${category}/${serviceId}/options-like`;
                  await api.post(`/api/v1/${endpoint}`, {
                    status: newLikedStatus
                  });
                  showToast(newLikedStatus === 1 ? 'Saved to wishlist!' : 'Removed from saved.', 'success');
                } catch (err) {
                  console.error('Error toggling wishlist:', err);
                  setIsSaved(currentLiked);
                  showToast('Failed to update wishlist status.', 'error');
                }
              }}
            >
              <i className={isSaved ? 'bx bxs-heart' : 'bx bx-heart'}></i>
            </button>
            <div className={styles.galleryPills}>
              {getGalleryPills(detail.info2Label || category).map((pill, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.galleryPill}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('info');
                    setTimeout(() => {
                      document.getElementById('tabs-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                >
                  <i className={`bx ${pill.icon}`}></i>{pill.label}
                </button>
              ))}
            </div>
            <div className={styles.galleryHeroContent}>
              <div className={styles.galleryEyebrow}>
                {detail.info2Label || category} &nbsp;·&nbsp; {detail.location || 'Karachi'}
              </div>
              <div className={styles.galleryTitle}>{detail.name}</div>
              <div className={styles.gallerySub}>
                <i className="bx bx-store"></i>
                {detail.info1Label || 'Verified Vendor'} &nbsp;·&nbsp; Est. 2014
              </div>
            </div>
            <div className={styles.galleryPhotoCount}>
              <i className="bx bx-image" style={{ fontSize: '11px', verticalAlign: 'middle', marginRight: '3px' }}></i>
              {galleryImages.length} photos
            </div>
          </div>
          {galleryImages.slice(1, 3).map((img, idx) => {
            const isLast = idx === 1 && galleryImages.length > 3;
            return (
              <div
                key={idx}
                className={styles.galleryThumb}
                onClick={() => {
                  setActivePhotoIdx(idx + 1);
                  setIsLightboxOpen(true);
                }}
              >
                <img src={img} alt={`Gallery grid ${idx}`} />
                {isLast && (
                  <div className={styles.galleryMore}>
                    +{galleryImages.length - 2} more
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* 2-COLUMN BOOKING CUSTOMIZER */}
        <div className={styles.detailGrid}>
          <div className={styles.leftColumn}>
            {/* Service meta */}
            <div className={styles.serviceMeta}>
              <div className={styles.serviceEyebrow}>
                <i className={`bx ${getCategoryIcon(detail.info2Label || category)}`}></i>
                {detail.info2Label || category}
              </div>
              <h1 className={styles.serviceTitle}>{detail.name}</h1>
              <div className={styles.serviceMetaRow}>
                <a className={styles.vendorLink} href="#">by {detail.info1Label || 'Verified Vendor'}</a>
                <span className={styles.sepDot}></span>
                {detail.location && (
                  <>
                    <span className={styles.locationTag}><i className="bx bx-map-pin"></i>{detail.location}</span>
                    <span className={styles.sepDot}></span>
                  </>
                )}
                <span className={styles.metaChip}>580+ bookings</span>
              </div>
              {detail.rating > 0 && (
                <div className={styles.ratingRow}>
                  <span className={styles.stars}>
                    {Array(5).fill(0).map((_, i) => (
                      <span key={i} style={{ color: i < Math.floor(detail.rating) ? 'var(--amber)' : 'var(--border)' }}>★</span>
                    ))}
                  </span>
                  <span className={styles.ratingScore}>{detail.rating.toFixed(1)}</span>
                  <span className={styles.ratingCount}>· {detail.reviewsCount || 0} reviews</span>
                  {detail.isVerified && (
                    <span className={styles.verifiedBadge}>
                      <i className="bx bx-check-circle"></i>Verified vendor
                    </span>
                  )}
                </div>
              )}
              <div className={styles.metaActions} style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  className={`${styles.metaActBtn} ${styles.metaActBtnReels}`}
                  type="button"
                  onClick={() => showToast('Opening vendor reels video...', 'info')}
                >
                  <i className="bx bx-play-circle"></i>Watch Reels
                </button>
                <button
                  className={`${styles.metaActBtn} ${styles.metaActBtnListen}`}
                  type="button"
                  onClick={() => setShowListenPlayer(!showListenPlayer)}
                >
                  <i className="bx bx-headphone"></i>Listen Summary
                </button>
              </div>
            </div>

            {/* Registry banner */}
            {isSaved && (
              <div className={styles.registryBanner}>
                <i className="bx bx-gift"></i>
                <div className={styles.registryBannerText}>
                  Adding to: <strong>Wedding Registry Items</strong>
                </div>
                <button className={styles.registryBannerClose} onClick={() => setIsSaved(false)}>
                  ✕
                </button>
              </div>
            )}

            {/* LISTEN SUMMARY PLAYER */}
            {showListenPlayer && (
              <div className={`${styles.listenPlayer} ${styles.listenPlayerOpen}`}>
                <div className={styles.listenCard}>
                  <button type="button" className={styles.listenPlay}>
                    <i className="bx bx-play"></i>
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700 }}>AI Summary · {detail.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>0:00 / 0:45</div>
                  </div>
                  <button type="button" className={styles.readMoreBtn} onClick={() => setShowListenPlayer(false)}>
                    <i className="bx bx-x" style={{ fontSize: '20px' }}></i>
                  </button>
                </div>
              </div>
            )}

            {/* SERVICE DESCRIPTION */}
            {detail.description && (
              <div className={styles.svcDesc}>
                <div className={styles.svcDescHeading}>Description</div>
                <div className={`${styles.descBody} ${!isDescExpanded ? styles.descClamp : ''}`}>
                  {detail.description}
                </div>
                {detail.tags && detail.tags.length > 0 && (
                  <div className={styles.descTags}>
                    {detail.tags.map((tag, tagIdx) => (
                      <span key={tagIdx} className={styles.descTag}>{tag}</span>
                    ))}
                  </div>
                )}
                {detail.description.length > 180 && (
                  <button 
                    type="button" 
                    className={styles.readMoreBtn} 
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                  >
                    <i className={`bx ${isDescExpanded ? 'bx-chevron-up' : 'bx-chevron-down'}`} style={{ marginRight: '4px' }}></i>
                    {isDescExpanded ? 'Read less' : 'Read more'}
                  </button>
                )}
              </div>
            )}

            {/* DEALS ROW MATCHING DESIGN HTML 1:1 */}
            <div className={styles.dealsRow}>
              <div className={styles.dealCard}>
                <div className={`${styles.dealIcon} ${styles.dealIconBlue}`}>
                  <i className="bx bx-credit-card"></i>
                </div>
                <div>
                  <div className={styles.dealTitle}>Installment Plan</div>
                  <div className={styles.dealDesc}>Book now, pay in 3 easy parts. No hidden charges.</div>
                  <span className={styles.dealTag}>30% today</span>
                </div>
              </div>
              <div className={styles.dealCard}>
                <div className={`${styles.dealIcon} ${styles.dealIconAmber}`}>
                  <i className="bx bx-bolt-circle"></i>
                </div>
                <div>
                  <div className={styles.dealTitle}>Super Deal</div>
                  <div className={styles.dealDesc}>Limited time — extra 5% off on top of Smart Savings.</div>
                  <span className={styles.dealTag}>Ends soon</span>
                </div>
              </div>
              <div className={styles.dealCard}>
                <div className={`${styles.dealIcon} ${styles.dealIconGreen}`}>
                  <i className="bx bx-group"></i>
                </div>
                <div>
                  <div className={styles.dealTitle}>Group Deal</div>
                  <div className={styles.dealDesc}>Booking for 300+ guests? Save an extra 15% automatically.</div>
                  <span className={styles.dealTag}>300+ guests</span>
                </div>
              </div>
            </div>

            {/* TABS NAVIGATION */}
            <div id="tabs-section" className={styles.tabsWrap}>
              <div className={styles.tabBar}>
                {detail.detailConfig.isShowItemsList && (
                  <button
                    className={`${styles.tabBtn} ${activeTab === 'items' ? styles.tabBtnActive : ''}`}
                    onClick={() => setActiveTab('items')}
                  >
                    Package Items
                  </button>
                )}
                {detail.detailConfig.isShowPaymentSchedule && (
                  <button
                    className={`${styles.tabBtn} ${activeTab === 'pricing' ? styles.tabBtnActive : ''}`}
                    onClick={() => setActiveTab('pricing')}
                  >
                    Pricing &amp; Installments
                  </button>
                )}
                <button
                  className={`${styles.tabBtn} ${activeTab === 'reviews' ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab('reviews')}
                >
                  Reviews ({detail.reviewsCount || 0})
                </button>
                {(detail.detailConfig.isShowGuidelinesPolicies || detail.detailConfig.isShowSize || packageDetails.length > 0) && (
                  <button
                    className={`${styles.tabBtn} ${activeTab === 'info' ? styles.tabBtnActive : ''}`}
                    onClick={() => setActiveTab('info')}
                  >
                    Policies &amp; Info
                  </button>
                )}
              </div>

              {/* TAB PANEL: PACKAGE ITEMS */}
              {activeTab === 'items' && detail.detailConfig.isShowItemsList && (
                <div className={styles.tabPanel}>
                  <div className={styles.pkgHeading}>
                    <div className={styles.pkgHeadingTitleRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className={styles.pkgHeadingTitle}>Choose your package items</div>
                        {detail.maxItemSelection > 0 && (
                          <span className={styles.pkgRuleChip}>{selectedItemIds.length} of {detail.maxItemSelection}</span>
                        )}
                      </div>
                      {detail.maxItemSelection > 0 && (
                        <div className={`${styles.pkgSelCounter} ${selectedItemIds.length >= detail.maxItemSelection ? styles.complete : ''}`}>
                          {selectedItemIds.length} <span style={{ fontWeight: 700 }}>of</span> {detail.maxItemSelection}
                        </div>
                      )}
                    </div>
                    <div className={styles.pkgHeadingSub}>
                      Select {detail.maxItemSelection} items to complete your package
                    </div>
                    {detail.maxItemSelection > 0 && (
                      <div className={styles.pkgProgress}>
                        <div className={styles.progressTrack}>
                          <div
                            className={styles.progressFill}
                            style={{ width: `${Math.min(100, (selectedItemIds.length / detail.maxItemSelection) * 100)}%` }}
                          ></div>
                        </div>
                        <span className={styles.progressLabel}>
                          {selectedItemIds.length} / {detail.maxItemSelection} selected
                        </span>
                      </div>
                    )}
                  </div>

                  {detail.maxItemSelection > 0 && (
                    <div
                      className={`${styles.statusPill} ${
                        selectedItemIds.length === detail.maxItemSelection ? styles.complete : styles.incomplete
                      }`}
                    >
                      <i
                        className={
                          selectedItemIds.length === detail.maxItemSelection
                            ? 'bx bx-check-circle'
                            : 'bx bx-error-circle'
                        }
                      ></i>
                      <span>
                        {selectedItemIds.length === detail.maxItemSelection
                          ? 'Package complete — ready to add to cart'
                          : `Select ${detail.maxItemSelection - selectedItemIds.length} more item${detail.maxItemSelection - selectedItemIds.length > 1 ? 's' : ''} to complete your package`}
                      </span>
                    </div>
                  )}

                  <div className={styles.itemsList}>
                    {customItems.map((item, idx) => {
                      const isSelected = selectedItemIds.includes(item.itemId);
                      const variation = itemVariations[item.itemId];
                      const hasVar = item.hasVariation;
                      const hasSavedVar = variation && variation.selectedPath && variation.selectedPath.length > 0;
                      
                      return (
                        <div
                          key={idx}
                          className={`${styles.itemCard} ${isSelected ? styles.itemCardSelected : ''}`}
                          onClick={() => setActiveDetailItemId(item.itemId)}
                        >
                          <div className={styles.itemImg}>
                            <img
                              src={variation?.imageUrl || item.imageUrl}
                              alt={item.name}
                              onError={(e) => {
                                e.currentTarget.src =
                                  'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=150&q=80';
                              }}
                            />
                          </div>
                          <div className={styles.itemBody}>
                            <div className={styles.itemName}>{item.name}</div>
                            <div className={styles.itemDesc}>{item.description}</div>
                            <div className={styles.itemMetaRow}>
                              {hasVar ? (
                                <>
                                  {hasSavedVar && variation.selectedPath ? (
                                    variation.selectedPath.map((v, pIdx) => (
                                      <span key={pIdx} className={styles.varSelChip}>{v.value}</span>
                                    ))
                                  ) : (
                                    <>
                                      <span className={styles.varReqChip}>Selection Required</span>
                                    </>
                                  )}
                                </>
                              ) : (
                                <span className={styles.varSelChip}>Standard</span>
                              )}
                              <span className={styles.itemViewHint}>
                                <i className="bx bx-chevron-right"></i>
                              </span>
                            </div>
                          </div>
                          <div
                            className={styles.itemToggle}
                            onClick={(e) => {
                              e.stopPropagation();
                              const isMissingVar = hasVar && !hasSavedVar;
                              if (isMissingVar && !isSelected) {
                                setActiveDetailItemId(item.itemId);
                              } else {
                                handleItemToggle(item.itemId);
                              }
                            }}
                          >
                            <button
                              type="button"
                              className={`${styles.toggleBtn} ${isSelected ? styles.toggleRemove : styles.toggleAdd}`}
                            >
                              <i className={isSelected ? 'bx bx-check' : 'bx bx-plus'}></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className={styles.actionRows}>
                    <div className={styles.actionRow} onClick={() => setActiveTab('info')}>
                      <div className={styles.actionRowIcon}><i className="bx bx-scissors"></i></div>
                      <span className={styles.actionRowLabel}>Fitting Schedule &amp; Alterations</span>
                      <i className="bx bx-chevron-right actionRowChevron"></i>
                    </div>
                    <div className={styles.actionRow} onClick={handleAddToRegistry}>
                      <div className={styles.actionRowIcon}><i className="bx bx-gift"></i></div>
                      <span className={styles.actionRowLabel}>Add to Gift Registry</span>
                      <i className="bx bx-chevron-right actionRowChevron"></i>
                    </div>
                    <div className={styles.actionRow}>
                      <div className={styles.actionRowIcon}><i className="bx bx-share-alt"></i></div>
                      <span className={styles.actionRowLabel}>Share This Collection</span>
                      <i className="bx bx-chevron-right actionRowChevron"></i>
                    </div>
                    <div className={styles.actionRow} onClick={() => setActiveTab('info')}>
                      <div className={styles.actionRowIcon}><i className="bx bx-file-blank"></i></div>
                      <span className={styles.actionRowLabel}>Rental Terms &amp; Return Policy</span>
                      <i className="bx bx-chevron-right actionRowChevron"></i>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB PANEL: PRICING */}
              {activeTab === 'pricing' && detail.detailConfig.isShowPaymentSchedule && (
                <div className={styles.tabPanel}>
                  <div className={styles.pricingTableSection}>
                    <div className={styles.sectionEyebrow}>Package billing summary</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                      {priceRows.map((row, idx) => {
                        const isBold = isBoldRow(row.labelInfo);
                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontWeight: isBold ? '700' : '400',
                              borderBottom: isBold ? '2px solid var(--border)' : '1px solid var(--border)',
                              padding: '8px 0',
                            }}
                          >
                            <span>{row.labelInfo}</span>
                            <span>{formatBreakdownValue(row.labelInfo, row.labelValue)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.sectionEyebrow}>Payment timeline schedules</div>
                  <div className={styles.timeline}>
                    {installments.map((inst, idx) => (
                      <div key={idx} className={`${styles.tlItem} ${idx === 0 ? styles.tlItemActive : ''}`}>
                        <div className={styles.tlGutter}>
                          <div className={styles.tlDot}></div>
                          {idx < installments.length - 1 && <div className={styles.tlConnector}></div>}
                        </div>
                        <div className={styles.tlBody}>
                          <div className={styles.tlLabel}>{inst.labelInfo}</div>
                          <div className={styles.tlAmount}>
                            {formatBreakdownValue(inst.labelInfo, inst.labelValue)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.infoCallout}>
                    <i className="bx bx-info-circle"></i>
                    Alterations and custom matching measurements require fittings session bookings.
                  </div>
                </div>
              )}

              {/* TAB PANEL: REVIEWS */}
              {activeTab === 'reviews' && (
                <div className={styles.tabPanel}>
                  <div className={styles.ratingSummary}>
                    <div className={styles.ratingBig}>
                      <div className={styles.ratingNum}>
                        {detail.rating ? detail.rating.toFixed(1) : '0.0'}
                      </div>
                      <div className={styles.ratingStarsBig}>★★★★★</div>
                      <div className={styles.ratingCnt}>{detail.reviewsCount || 0} reviews</div>
                    </div>
                    <div className={styles.barList}>
                      <div className={styles.barRow}>
                        <span className={styles.barLbl}>5★</span>
                        <div className={styles.barTrack}>
                          <div className={styles.barFill} style={{ width: '85%' }}></div>
                        </div>
                        <span className={styles.barPct}>85%</span>
                      </div>
                      <div className={styles.barRow}>
                        <span className={styles.barLbl}>4★</span>
                        <div className={styles.barTrack}>
                          <div className={styles.barFill} style={{ width: '12%' }}></div>
                        </div>
                        <span className={styles.barPct}>12%</span>
                      </div>
                      <div className={styles.barRow}>
                        <span className={styles.barLbl}>3★</span>
                        <div className={styles.barTrack}>
                          <div className={styles.barFill} style={{ width: '3%' }}></div>
                        </div>
                        <span className={styles.barPct}>3%</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.reviewsList}>
                    {reviews.map((rev, idx) => (
                      <div key={idx} className={styles.reviewItem}>
                        <div className={styles.reviewTop}>
                          <div className={styles.rvAvatar}>R</div>
                          <div style={{ flex: 1 }}>
                            <div className={styles.rvName}>Verified Client</div>
                            <div className={styles.rvMeta}>Wedding Event</div>
                          </div>
                          <div className={styles.rvStars}>★★★★★</div>
                        </div>
                        <div className={styles.rvText}>{rev.review}</div>
                        <div className={styles.rvVerified}>
                          <i className="bx bx-check-circle"></i>Verified Booking
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB PANEL: POLICIES */}
              {activeTab === 'info' && (detail.detailConfig.isShowGuidelinesPolicies || detail.detailConfig.isShowSize || packageDetails.length > 0) && (
                <div className={styles.tabPanel}>
                  {packageDetails.length > 0 ? (
                    packageDetails.map((structure: any, idx: number) => {
                      const mainTitle = structure.mainHeading || structure.main_heading || 'Guidelines';
                      const isOpen = openAccordions[mainTitle] ?? true;
                      const isText = structure.structureType === 'text' || structure.structure_type === 'text';
                      const isTable = structure.structureType === 'table' || structure.structure_type === 'table';
                      const isMeasurement = structure.structureType === 'measurement' || structure.structure_type === 'measurement';
                      const requiresCheckbox = structure.requiresCheckbox === 1 || structure.requires_checkbox === 1 || structure.requiresCheckbox === true;

                      const sectionData = structure.sections?.[0]?.data || [];

                      return (
                        <div key={idx} className={`${styles.acc} ${isOpen ? styles.open : ''}`} style={{ marginBottom: '16px' }}>
                          <div className={styles.accHeader} onClick={() => setOpenAccordions(prev => ({ ...prev, [mainTitle]: !prev[mainTitle] }))}>
                            <div className={styles.accIcon}>
                              <i className={mainTitle.toLowerCase().includes('guideline') || mainTitle.toLowerCase().includes('policy') ? 'bx bx-shield' : 'bx bx-check-square'}></i>
                            </div>
                            <div className={styles.accTitle}>{mainTitle}</div>
                            <i className="bx bx-chevron-down accChevron"></i>
                          </div>
                          
                          {isOpen && (
                            <div className={styles.accBody} style={{ display: 'block', padding: '15px' }}>
                              {isText && (() => {
                                const grouped: Record<string, string[]> = {};
                                sectionData.forEach((item: any) => {
                                  const label = item.attribute_label || item.attributeLabel || '';
                                  const value = item.attribute_value || item.attributeValue || '';
                                  if (!grouped[label]) grouped[label] = [];
                                  grouped[label].push(value);
                                });

                                return Object.entries(grouped).map(([lbl, vals], gIdx) => (
                                  <div key={gIdx} style={{ marginBottom: '14px' }}>
                                    {lbl && <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{lbl}</div>}
                                    <ul className={styles.accList} style={{ paddingLeft: 0 }}>
                                      {vals.map((v, vIdx) => (
                                        <li key={vIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--text-secondary)', padding: '4px 0' }}>
                                          <i className="bx bx-check-circle yes" style={{ color: 'var(--success)' }}></i>
                                          <span>{v}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ));
                              })()}

                              {isTable && (() => {
                                const grouped: Record<string, Array<{ label: string; value: string }>> = {};
                                sectionData.forEach((item: any) => {
                                  const name = item.attribute_name || item.attributeName || '';
                                  const label = item.attribute_label || item.attributeLabel || '';
                                  const value = item.attribute_value || item.attributeValue || '';
                                  if (!grouped[name]) grouped[name] = [];
                                  grouped[name].push({ label, value });
                                });

                                return Object.entries(grouped).map(([name, items], gIdx) => (
                                  <div key={gIdx} style={{ marginBottom: '16px' }}>
                                    {name && <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px' }}>{name}</div>}
                                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid var(--border)' }}>
                                      <tbody>
                                        {items.map((item, itemIdx) => (
                                          <tr key={itemIdx} style={{ borderBottom: '1.5px solid var(--border)' }}>
                                            <td style={{ padding: '8px 12px', fontWeight: '600', fontSize: '12.5px', background: 'var(--surface)', borderRight: '1.5px solid var(--border)', width: '35%' }}>
                                              {item.label}
                                            </td>
                                            <td style={{ padding: '8px 12px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                                              {item.value}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ));
                              })()}

                              {isMeasurement && (() => {
                                const grouped: Record<string, string[]> = {};
                                sectionData.forEach((item: any) => {
                                  const label = item.attribute_label || item.attributeLabel || '';
                                  const value = item.attribute_value || item.attributeValue || '';
                                  if (!grouped[label]) grouped[label] = [];
                                  grouped[label].push(value);
                                });

                                const entries = Object.entries(grouped);
                                if (entries.length === 0) return null;
                                const maxColumns = Math.max(...entries.map(([_, list]) => list.length));

                                return (
                                  <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid var(--border)' }}>
                                      <tbody>
                                        {entries.map(([lbl, vals], rowIdx) => (
                                          <tr key={rowIdx} style={{ borderBottom: '1.5px solid var(--border)' }}>
                                            <td style={{ padding: '10px 12px', fontWeight: '700', fontSize: '12.5px', background: 'var(--surface)', borderRight: '1.5px solid var(--border)' }}>
                                              {lbl}
                                            </td>
                                            {Array.from({ length: maxColumns }).map((_, colIdx) => (
                                              <td key={colIdx} style={{ padding: '10px 12px', fontSize: '12.5px', borderRight: '1.5px solid var(--border)', textAlign: 'center' }}>
                                                {vals[colIdx] || '-'}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {requiresCheckbox && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 15px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
                              <input
                                type="checkbox"
                                id={`policy-chk-${idx}`}
                                checked={checkedPolicies[idx] || false}
                                onChange={(e) => setCheckedPolicies(prev => ({ ...prev, [idx]: e.target.checked }))}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                              <label htmlFor={`policy-chk-${idx}`} style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                I have read and agree to the {mainTitle}
                              </label>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <>
                      <div className={styles.acc}>
                        <div className={styles.accHeader}>
                          <div className={styles.accIcon}>
                            <i className="bx bx-check-square"></i>
                          </div>
                          <div className={styles.accTitle}>What's included</div>
                        </div>
                        <div className={styles.accBody} style={{ display: 'block' }}>
                          <ul className={styles.accList}>
                            <li>
                              <i className="bx bx-check-circle yes"></i>Dry cleaning included before rental
                            </li>
                            <li>
                              <i className="bx bx-check-circle yes"></i>Complementary custom measurement session
                            </li>
                            <li>
                              <i className="bx bx-check-circle yes"></i>1 alteration round included
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className={styles.acc}>
                        <div className={styles.accHeader}>
                          <div className={styles.accIcon}>
                            <i className="bx bx-shield"></i>
                          </div>
                          <div className={styles.accTitle}>Rental &amp; Return Policy</div>
                        </div>
                        <div className={styles.accBody} style={{ display: 'block' }}>
                          <ul className={styles.accList}>
                            <li>
                              <i className="bx bx-check-circle yes"></i>Free cancellation within 48 hours of booking
                            </li>
                            <li>
                              <i className="bx bx-info-circle warn"></i>30% deposit is non-refundable after window
                            </li>
                          </ul>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT STICKY BOOKING PANEL */}
          <aside className={styles.bookingSidebar}>
            {detail ? (
              <div className={styles.bookingCard}>
                <div className={styles.redHeader}>
                  <div className={styles.rhName}>{detail.name}</div>
                  <div className={styles.rhVendor}>by {detail.info1Label || 'Verified Vendor'}</div>
                  <div className={styles.rhPriceRow}>
                    <span className={styles.rhFrom}>from</span>
                    <span className={styles.rhPrice}>{formatPrice(detail.finalPrice)}</span>
                    <span className={styles.rhUnit}>{detail.priceLabel || '/package'}</span>
                    {detail.originalPrice && (
                      <>
                        <span className={styles.rhOld}>{formatPrice(detail.originalPrice)}</span>
                        {detail.discountPercentage > 0 && (
                          <span className={styles.rhBadge}>
                            {detail.discountPercentage}% off
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className={styles.bookingFields}>
                  {/* Outfit count stepper (Quantity stepper) */}
                  {detail.detailConfig.isShowQuantity && (
                    <div>
                      <span className={styles.fieldLabel}>Number of Items</span>
                      <div className={styles.stepper}>
                        <button
                          type="button"
                          disabled={quantity <= 1}
                          onClick={() => setQuantity(quantity - 1)}
                          className={styles.stepperBtn}
                        >
                          −
                        </button>
                        <span className={styles.stepperVal}>{quantity}</span>
                        <button
                          type="button"
                          disabled={quantity >= 10}
                          onClick={() => setQuantity(quantity + 1)}
                          className={styles.stepperBtn}
                        >
                          +
                        </button>
                        <span className={styles.stepperUnit}>items</span>
                      </div>
                      <span className={styles.fieldHint}>
                        Min 1 · Max 10
                      </span>
                    </div>
                  )}

                  {/* Guest Counter stepper */}
                  {(detail.detailConfig.isShowMinimumGuests || detail.detailConfig.isShowRatesPerHead) && (
                    <div>
                      <span className={styles.fieldLabel}>
                        {category === 'venue' ? 'Expected guests' : 'Number of Guests'}
                      </span>
                      <div className={styles.stepper}>
                        <button
                          type="button"
                          disabled={guestCount <= (detail.minimumGuests || 1)}
                          onClick={() => setGuestCount(Math.max(detail.minimumGuests || 1, guestCount - 25))}
                          className={styles.stepperBtn}
                        >
                          −
                        </button>
                        <span className={styles.stepperVal}>{guestCount}</span>
                        <button
                          type="button"
                          disabled={detail.maximumGuests ? guestCount >= detail.maximumGuests : false}
                          onClick={() => setGuestCount(detail.maximumGuests ? Math.min(detail.maximumGuests, guestCount + 25) : guestCount + 25)}
                          className={styles.stepperBtn}
                        >
                          +
                        </button>
                        <span className={styles.stepperUnit}>guests</span>
                      </div>
                      <div className={styles.guestChips} style={{ display: 'flex', gap: '6px', marginTop: '10px', overflowX: 'auto' }}>
                        {[50, 100, 150, 200, 250, 300].map(cnt => (
                          <button
                            key={cnt}
                            type="button"
                            className={`${styles.guestChip} ${guestCount === cnt ? styles.guestChipActive : ''}`}
                            onClick={() => setGuestCount(cnt)}
                          >
                            {cnt}
                          </button>
                        ))}
                      </div>
                      <span className={styles.fieldHint} style={{ marginTop: '6px', display: 'block' }}>
                        Min: {detail.minimumGuests} · Max: {detail.maximumGuests || 'No Limit'}
                      </span>
                    </div>
                  )}

                  {/* Event Date inline interactive Calendar */}
                  {detail.detailConfig.isShowCalendar && (
                    <div>
                      <span className={styles.fieldLabel}>Event date</span>
                      <div className={styles.calTop}>
                        <span className={styles.calDateSel}>{formatDisplayDate(selectedDate)}</span>
                        <span className={styles.calAvail}>
                          <i className="bx bx-check-circle"></i>Available
                        </span>
                      </div>
                      <div className={styles.calNav}>
                        <button type="button" className={styles.calNavBtn} onClick={handlePrevMonth}>
                          ‹
                        </button>
                        <span className={styles.calMonthLbl}>
                          {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </span>
                        <button type="button" className={styles.calNavBtn} onClick={handleNextMonth}>
                          ›
                        </button>
                      </div>
                      <div className={styles.calGrid}>
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((lbl, idx) => (
                          <div key={idx} className={styles.calLbl}>
                            {lbl}
                          </div>
                        ))}
                        {getDaysInMonthGrid(currentMonth).map((day) => {
                          const slot = findCalendarSlot(day.date);
                          const isPast = day.date.getTime() < new Date(new Date().setHours(0, 0, 0, 0)).getTime();
                          const isAvailable = !isPast && (slot ? slot.isAvailable : true);
                          const isSelected = isDateSelected(day.date);
                          
                          return (
                            <div
                              key={day.key}
                              onClick={() => {
                                if (isAvailable) {
                                  const pad = (n: number) => String(n).padStart(2, '0');
                                  const formattedStr = `${pad(day.date.getMonth() + 1)}/${pad(day.date.getDate())}/${day.date.getFullYear()}`;
                                  setSelectedDate(formattedStr);
                                  if (slot) setSelectedPriceId(slot.priceId);
                                }
                              }}
                              className={`${styles.calD} ${day.isCurrentMonth ? '' : styles.calDOther} ${isSelected ? styles.calDSel : ''} ${isAvailable ? '' : styles.calDNa}`}
                            >
                              <span className={styles.calDateNum}>{day.date.getDate()}</span>
                              {slot && isAvailable && slot.price && (
                                <span className={styles.calDatePrice}>
                                  {formatCompactPrice(slot.price)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Fitting slots indicator */}
                  {category === 'clothing' && detail.detailConfig.isShowQuantity && (
                    <div>
                      <span className={styles.fieldLabel}>Fitting date</span>
                      <div className={styles.fitDateField}>
                        <i className="bx bx-scissors"></i>
                        <div className={styles.fitDateText}>
                          <div className={styles.fitDateMain}>{getFittingDateString()}</div>
                          <div className={styles.fitDateSub}>
                            <i className="bx bx-check-circle" style={{ marginRight: '2px', verticalAlign: 'middle' }}></i>Confirmed slot
                          </div>
                        </div>
                        <i className="bx bx-chevron-right" style={{ color: 'var(--text-muted)', fontSize: '16px', marginLeft: 'auto' }}></i>
                      </div>
                      <span className={styles.fieldHint}>
                        Fitting slot available — 3 weeks before event
                      </span>
                    </div>
                  )}

                  {/* Fitting session time preference selects */}
                  {category === 'clothing' && detail.detailConfig.isShowQuantity && (
                    <div>
                      <span className={styles.fieldLabel}>Fitting session</span>
                      <div className={styles.fitRow}>
                        <button
                          type="button"
                          onClick={() => setSelectedTimeOfDay('morning')}
                          className={`${styles.fitBtn} ${selectedTimeOfDay === 'morning' ? styles.fitBtnActive : ''}`}
                        >
                          <i className="bx bx-sun"></i>Morning
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedTimeOfDay('afternoon')}
                          className={`${styles.fitBtn} ${selectedTimeOfDay === 'afternoon' ? styles.fitBtnActive : ''}`}
                        >
                          <i className="bx bx-cloud-sun"></i>Afternoon
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price breakdown */}
                {detail.detailConfig.isShowPaymentSchedule && (
                  <div className={styles.priceBreak}>
                    <div className={styles.pbTitle}>{priceSummaryHeading || 'Price breakdown'}</div>
                    <div className={styles.pbSub}>
                      {selectedDate ? formatDisplayDate(selectedDate) : 'Select date'}
                      {detail.detailConfig.isShowQuantity && ` · ${quantity} items`}
                      {(!detail.detailConfig.isShowQuantity && guestCount > 0) && ` · ${guestCount} guests`}
                    </div>

                    {isPriceLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
                        <i className="bx bx-loader-alt bx-spin" style={{ color: 'var(--primary)', fontSize: '20px' }}></i>
                      </div>
                    ) : (
                      <>
                        {priceRows.map((row, idx) => {
                          const isBold = isBoldRow(row.labelInfo);
                          if (isBold) return null;
                          const valStr = formatBreakdownValue(row.labelInfo, row.labelValue);
                          const isDiscount = valStr.includes('-');
                          return (
                            <div key={idx} className={styles.pbRow}>
                              <span className={styles.pbLbl}>{row.labelInfo}</span>
                              <span className={`${styles.pbVal} ${isDiscount ? styles.pbValGreen : ''}`}>{valStr}</span>
                            </div>
                          );
                        })}
                        
                        <hr className={styles.pbSep} />

                        {/* Total */}
                        {(() => {
                          const totalRow = priceRows.find(r => isBoldRow(r.labelInfo) && !r.labelInfo.toLowerCase().includes('deposit') && !r.labelInfo.toLowerCase().includes('installment') && !r.labelInfo.toLowerCase().includes('remaining'));
                          return (
                            <div className={styles.pbTotal}>
                              <span>{totalRow ? totalRow.labelInfo : 'Order total'}</span>
                              <span>{totalRow ? formatBreakdownValue(totalRow.labelInfo, totalRow.labelValue) : formatPrice(detail.finalPrice)}</span>
                            </div>
                          );
                        })()}

                        {/* Deposit Block */}
                        {(() => {
                          const depositRow = priceRows.find(r => r.labelInfo.toLowerCase().includes('deposit') || r.labelInfo.toLowerCase().includes('due today') || r.labelInfo.toLowerCase().includes('today') || r.labelInfo.toLowerCase().includes('amount due today') || r.labelInfo.toLowerCase().includes('pay today'));
                          const remainingRow = priceRows.find(r => r.labelInfo.toLowerCase().includes('remaining') || r.labelInfo.toLowerCase().includes('installments') || r.labelInfo.toLowerCase().includes('second'));
                          if (!depositRow) return null;
                          return (
                            <div className={styles.depositBlock}>
                              <div className={styles.depHeader}>{depositRow.labelInfo}</div>
                              <div className={styles.depRow}>
                                <span className={styles.depLbl}>Pay today</span>
                                <span className={`${styles.depVal} ${styles.depValPrimary}`}>
                                  {formatBreakdownValue(depositRow.labelInfo, depositRow.labelValue)}
                                </span>
                              </div>
                              {remainingRow && (
                                <div className={styles.depRow}>
                                  <span className={styles.depLbl}>Remaining</span>
                                  <span className={styles.depVal}>
                                    {formatBreakdownValue(remainingRow.labelInfo, remainingRow.labelValue)}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    )}
                    <div className={styles.freeCancel}>
                      <i className="bx bx-check-circle"></i>Free cancellation within 48 hours
                    </div>
                  </div>
                )}

                {/* CTAs */}
                <div className={styles.bookingCtas}>
                  <button
                    type="button"
                    onClick={handleBookingSubmit}
                    className={styles.btnPrimary}
                  >
                    <i className="bx bx-cart-add"></i>Add to cart · {(() => {
                      const payTodayRow = priceRows.find(r => {
                        const lbl = r.labelInfo.toLowerCase();
                        return lbl.includes('amount due today') || lbl.includes('due today') || lbl.includes('today') || lbl.includes('pay today') || lbl.includes('deposit');
                      });
                      if (payTodayRow) {
                        return formatBreakdownValue(payTodayRow.labelInfo, payTodayRow.labelValue);
                      }
                      return formatPrice(detail.finalPrice);
                    })()}
                  </button>
                  <button
                    type="button"
                    className={styles.btnOutline}
                    onClick={handleAddToRegistry}
                  >
                    <i className="bx bx-gift"></i>Add to registry
                  </button>
                  <div className={styles.btnIconRow}>
                    <button type="button" className={styles.btnIconItem}>
                      <i className="bx bx-scissors"></i>Book fitting
                    </button>
                    <button type="button" className={styles.btnIconItem}>
                      <i className="bx bx-share-alt"></i>Share
                    </button>
                  </div>
                </div>

                <div className={styles.sidebarTrust}>
                  <div className={styles.trustTag}><i className="bx bx-shield-check"></i>Secure</div>
                  <div className={styles.trustTag}><i className="bx bx-check-circle"></i>Verified vendor</div>
                  <div className={styles.trustTag}><i className="bx bx-support"></i>24/7 support</div>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </main>

      {/* PICTURE LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div className={`${styles.glbOverlay} ${styles.glbOverlayOpen}`}>
          <button className={styles.glbClose} onClick={() => setIsLightboxOpen(false)}>
            <i className="bx bx-x"></i>
          </button>
          <div className={styles.glbCounter}>
            {activePhotoIdx + 1} / {galleryImages.length} Photos
          </div>

          <button
            className={`${styles.glbNav} ${styles.glbPrev}`}
            onClick={() =>
              setActivePhotoIdx(
                activePhotoIdx === 0 ? galleryImages.length - 1 : activePhotoIdx - 1
              )
            }
          >
            <i className="bx bx-chevron-left"></i>
          </button>

          <div className={styles.glbMain}>
            <img
              src={galleryImages[activePhotoIdx]}
              alt={`Lightbox active image`}
              className={styles.glbImg}
            />
          </div>

          <button
            className={`${styles.glbNav} ${styles.glbNext}`}
            onClick={() =>
              setActivePhotoIdx(
                activePhotoIdx === galleryImages.length - 1 ? 0 : activePhotoIdx + 1
              )
            }
          >
            <i className="bx bx-chevron-right"></i>
          </button>

          <div className={styles.glbThumbstrip}>
            {galleryImages.map((img, idx) => (
              <img
                key={idx}
                src={img}
                onClick={() => setActivePhotoIdx(idx)}
                className={`${styles.glbThumb} ${
                  activePhotoIdx === idx ? styles.glbThumbActive : ''
                }`}
                alt={`Thumbnail strip ${idx}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ITEM DETAIL POPUP OVERLAY MODAL */}
      {activeDetailItemId !== null && (() => {
        const activeItem = customItems.find((i) => i.itemId === activeDetailItemId);
        if (!activeItem) return null;

        const currentVar = itemVariations[activeItem.itemId] || {};
        const isSaveEnabled = !activeItem.hasVariation || (selectedVariationPath.length > 0 && selectedVariationPath[selectedVariationPath.length - 1].variationId !== null);

        // Helper renderers for dynamic accordions
        const sizeGuide = activeItemDetails?.productDetails?.find(
          (element: any) => element.structureType === 'measurement' || element.structure_type === 'measurement'
        );
        const textStructures = activeItemDetails?.productDetails?.filter(
          (element: any) => (element.structureType === 'text' || element.structure_type === 'text')
        ) || [];
        const tableSpecs = activeItemDetails?.productDetails?.find(
          (element: any) => element.structureType === 'table' || element.structure_type === 'table'
        );

        return (
          <div className={`${styles.idpOverlay} ${styles.idpOverlayOpen}`} onClick={() => setActiveDetailItemId(null)}>
            <button className={styles.idpClose} onClick={() => setActiveDetailItemId(null)}>
              <i className="bx bx-x"></i>
            </button>
            <div className={styles.idpPanel} onClick={(e) => e.stopPropagation()}>
              <div className={styles.idpTopbar}>
                <div className={styles.idpTopbarName}>{activeItem.name}</div>
                <button
                  className={styles.idpSaveBtn}
                  disabled={!isSaveEnabled || isDetailLoading}
                  style={{ opacity: isSaveEnabled ? 1 : 0.5, cursor: isSaveEnabled ? 'pointer' : 'not-allowed' }}
                  onClick={() => {
                    if (!isSaveEnabled) return;
                    setItemVariations((prev) => {
                      let variationImage = '';
                      for (let i = selectedVariationPath.length - 1; i >= 0; i--) {
                        const opt = selectedVariationPath[i];
                        if (opt.images && opt.images.length > 0) {
                          variationImage = opt.images[0];
                          break;
                        }
                      }
                      return {
                        ...prev,
                        [activeItem.itemId]: {
                          selectedPath: selectedVariationPath,
                          colorTitle: selectedVariationPath.find(p => p.heading?.toLowerCase().includes('color'))?.value || '',
                          sizeTitle: selectedVariationPath.find(p => p.heading?.toLowerCase().includes('size'))?.value || '',
                          imageUrl: variationImage || undefined,
                        }
                      };
                    });
                    const isSelected = selectedItemIds.includes(activeItem.itemId);
                    if (!isSelected) {
                      handleItemToggle(activeItem.itemId);
                    }
                    setActiveDetailItemId(null);
                  }}
                >
                  Save Selection
                </button>
              </div>

              {isDetailLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px', gap: '12px' }}>
                  <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '32px', color: 'var(--primary)' }}></i>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Loading item specifications...</span>
                </div>
              ) : (
                <>
                  {/* Item Carousel Images */}
                  {activeItemImages.length > 0 ? (
                    <div className={styles.idpCarouselWrap}>
                      {activeItemImages.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          className={`${styles.idpCarouselImg} ${activeItemCarouselIdx === i ? styles.idpCarouselImgActive : ''}`}
                          alt={activeItem.name}
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                      ))}
                      {activeItemImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            className={`${styles.idpCnav} ${styles.idpCnavPrev}`}
                            onClick={() =>
                              setActiveItemCarouselIdx((prev) =>
                                prev === 0 ? activeItemImages.length - 1 : prev - 1
                              )
                            }
                          >
                            <i className="bx bx-chevron-left"></i>
                          </button>
                          <button
                            type="button"
                            className={`${styles.idpCnav} ${styles.idpCnavNext}`}
                            onClick={() =>
                              setActiveItemCarouselIdx((prev) =>
                                prev === activeItemImages.length - 1 ? 0 : prev + 1
                              )
                            }
                          >
                            <i className="bx bx-chevron-right"></i>
                          </button>
                          <div className={styles.idpCCounter}>
                            {activeItemCarouselIdx + 1} / {activeItemImages.length}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className={styles.idpCarouselWrap} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="bx bx-image" style={{ fontSize: '48px', color: 'var(--text-muted)' }}></i>
                    </div>
                  )}

                  <div className={styles.idpBody}>
                    <div className={styles.idpNameRow}>
                      <div className={styles.idpItemName}>{activeItem.name}</div>
                    </div>
                    <div className={styles.idpTags}>
                      <span className={styles.idpTag}>Custom Tailored</span>
                      <span className={`${styles.idpTag} ${styles.idpTagGreen}`}><i className="bx bx-check-circle" style={{ verticalAlign: 'middle', marginRight: '4px', color: 'var(--success)' }}></i>Dry clean included</span>
                    </div>
                    <p className={styles.idpDesc}>{activeItem.description || 'No description available for this item.'}</p>
                    
                    {/* Chosen Selection Pill Row Summary */}
                    {selectedVariationPath.length > 0 && (
                      <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {selectedVariationPath.map((v, i) => (
                          <span
                            key={i}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: 'var(--primary-light)',
                              color: 'var(--primary)',
                              padding: '4px 10px',
                              borderRadius: '6px',
                            }}
                          >
                            {v.value}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className={styles.idpDivider}></div>

                    {/* Step-by-step Selection Levels */}
                    {activeItemVariations && (() => {
                      const levels = [];
                      let currentNode = activeItemVariations;
                      let currentLevelIdx = 0;

                      while (currentNode) {
                        const nodeHeading = currentNode.heading || currentNode.mainHeading || 'Variation';
                        const options = currentNode.options || [];
                        const selectedOption = selectedVariationPath[currentLevelIdx];
                        const selectedValue = selectedOption ? selectedOption.value : null;
                        const levelIdx = currentLevelIdx;

                        levels.push(
                          <div key={levelIdx} style={{ marginBottom: '24px' }}>
                            <div className={styles.idpSecLabel}>Select {nodeHeading}</div>
                            {levelIdx === 0 ? (
                              <div className={styles.idpSwatchGrid}>
                                {options.map((opt: any, optIdx: number) => {
                                  const isSelected = selectedValue === opt.value;
                                  const optImage = (opt.images && opt.images.length > 0) ? opt.images[0] : '';
                                  return (
                                    <div
                                      key={optIdx}
                                      onClick={() => handleVariationSelect(levelIdx, opt, nodeHeading)}
                                      className={`${styles.idpSwatch} ${isSelected ? styles.idpSwatchActive : ''}`}
                                    >
                                      {optImage ? (
                                        <img src={optImage} alt={opt.value} />
                                      ) : (
                                        <div style={{ height: '62px', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                          <i className="bx bx-image" style={{ color: 'var(--text-muted)' }}></i>
                                        </div>
                                      )}
                                      <span>{opt.value}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className={styles.idpVarChips}>
                                {options.map((opt: any, optIdx: number) => {
                                  const isSelected = selectedValue === opt.value;
                                  return (
                                    <button
                                      key={optIdx}
                                      type="button"
                                      onClick={() => handleVariationSelect(levelIdx, opt, nodeHeading)}
                                      className={`${styles.idpVarChip} ${isSelected ? styles.idpVarChipActive : ''}`}
                                    >
                                      {opt.value}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );

                        if (selectedOption && selectedOption.next) {
                          currentNode = selectedOption.next;
                          currentLevelIdx++;
                        } else {
                          break;
                        }
                      }
                      return levels;
                    })()}

                    {/* About this item / specifications Accordions */}
                    {(sizeGuide || textStructures.length > 0 || tableSpecs) && (
                      <>
                        <div className={styles.idpDivider}></div>
                        <div className={styles.idpSecLabel}>About this item</div>
                        
                        {/* 1. What's Included / Specifications Bullet lists */}
                        {textStructures.map((structure: any, idx: number) => {
                          const mainTitle = structure.mainHeading || structure.main_heading || 'Details';
                          const isOpen = openAccordions[mainTitle] ?? true;
                          const sectionData = structure.sections?.[0]?.data || [];
                          
                          // Group values
                          const grouped: Record<string, string[]> = {};
                          sectionData.forEach((item: any) => {
                            const label = item.attribute_label || item.attributeLabel || '';
                            const value = item.attribute_value || item.attributeValue || '';
                            if (!grouped[label]) grouped[label] = [];
                            grouped[label].push(value);
                          });

                          return (
                            <div key={idx} className={`${styles.acc} ${isOpen ? styles.open : ''}`}>
                              <div className={styles.accHeader} onClick={() => toggleAccordion(mainTitle)}>
                                <div className={styles.accIcon}>
                                  <i className={mainTitle.toLowerCase().includes('guideline') || mainTitle.toLowerCase().includes('policy') ? 'bx bx-shield' : 'bx bx-diamond'}></i>
                                </div>
                                <div className={styles.accTitle}>{mainTitle}</div>
                                <i className="bx bx-chevron-down accChevron"></i>
                              </div>
                              {isOpen && (
                                <div className={styles.accBody} style={{ display: 'block' }}>
                                  {Object.entries(grouped).map(([lbl, vals], gIdx) => (
                                    <div key={gIdx} style={{ marginBottom: '14px' }}>
                                      {lbl && <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{lbl}</div>}
                                      <ul className={styles.accList} style={{ paddingLeft: 0 }}>
                                        {vals.map((v, vIdx) => (
                                          <li key={vIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--text-secondary)', padding: '4px 0' }}>
                                            <i className="bx bx-check-circle yes" style={{ color: 'var(--success)' }}></i>
                                            <span>{v}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* 2. Customisation specifications Table */}
                        {tableSpecs && (() => {
                          const mainTitle = tableSpecs.mainHeading || tableSpecs.main_heading || 'Specifications';
                          const isOpen = openAccordions[mainTitle] ?? true;
                          const sectionData = tableSpecs.sections?.[0]?.data || [];

                          const grouped: Record<string, Array<{ label: string; value: string }>> = {};
                          sectionData.forEach((item: any) => {
                            const name = item.attribute_name || item.attributeName || '';
                            const label = item.attribute_label || item.attributeLabel || '';
                            const value = item.attribute_value || item.attributeValue || '';
                            if (!grouped[name]) grouped[name] = [];
                            grouped[name].push({ label, value });
                          });

                          return (
                            <div className={`${styles.acc} ${isOpen ? styles.open : ''}`}>
                              <div className={styles.accHeader} onClick={() => toggleAccordion(mainTitle)}>
                                <div className={styles.accIcon}>
                                  <i className="bx bx-list-check"></i>
                                </div>
                                <div className={styles.accTitle}>{mainTitle}</div>
                                <i className="bx bx-chevron-down accChevron"></i>
                              </div>
                              {isOpen && (
                                <div className={styles.accBody} style={{ display: 'block' }}>
                                  {Object.entries(grouped).map(([name, items], gIdx) => (
                                    <div key={gIdx} style={{ marginBottom: '16px' }}>
                                      {name && <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px' }}>{name}</div>}
                                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid var(--border)' }}>
                                        <tbody>
                                          {items.map((item, itemIdx) => (
                                            <tr key={itemIdx} style={{ borderBottom: '1.5px solid var(--border)' }}>
                                              <td style={{ padding: '8px 12px', fontWeight: '600', fontSize: '12.5px', background: 'var(--surface)', borderRight: '1.5px solid var(--border)', width: '35%' }}>
                                                {item.label}
                                              </td>
                                              <td style={{ padding: '8px 12px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                                                {item.value}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* 3. Sizing Guide Matrix Table */}
                        {sizeGuide && (() => {
                          const mainTitle = sizeGuide.mainHeading || sizeGuide.main_heading || 'Size Guide';
                          const isOpen = openAccordions[mainTitle] ?? true;
                          const sectionData = sizeGuide.sections?.[0]?.data || [];

                          const grouped: Record<string, string[]> = {};
                          sectionData.forEach((item: any) => {
                            const label = item.attribute_label || item.attributeLabel || '';
                            const value = item.attribute_value || item.attributeValue || '';
                            if (!grouped[label]) grouped[label] = [];
                            grouped[label].push(value);
                          });

                          const entries = Object.entries(grouped);
                          if (entries.length === 0) return null;
                          const maxColumns = Math.max(...entries.map(([_, list]) => list.length));

                          return (
                            <div className={`${styles.acc} ${isOpen ? styles.open : ''}`}>
                              <div className={styles.accHeader} onClick={() => toggleAccordion(mainTitle)}>
                                <div className={styles.accIcon}>
                                  <i className="bx bx-straighten"></i>
                                </div>
                                <div className={styles.accTitle}>{mainTitle}</div>
                                <i className="bx bx-chevron-down accChevron"></i>
                              </div>
                              {isOpen && (
                                <div className={styles.accBody} style={{ display: 'block' }}>
                                  <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid var(--border)' }}>
                                      <tbody>
                                        {entries.map(([lbl, vals], rowIdx) => (
                                          <tr key={rowIdx} style={{ borderBottom: '1.5px solid var(--border)' }}>
                                            <td style={{ padding: '10px 12px', fontWeight: '700', fontSize: '12.5px', background: 'var(--surface)', borderRight: '1.5px solid var(--border)' }}>
                                              {lbl}
                                            </td>
                                            {Array.from({ length: maxColumns }).map((_, colIdx) => (
                                              <td key={colIdx} style={{ padding: '10px 12px', fontSize: '12.5px', borderRight: '1.5px solid var(--border)', textAlign: 'center' }}>
                                                {vals[colIdx] || '-'}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {frequentlyBought.length > 0 && (
        <section style={{ maxWidth: '1280px', margin: '40px auto', padding: '0 20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Frequently Bought Together</h2>
          <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>
            {frequentlyBought.map((item, idx) => (
              <div key={idx} style={{ minWidth: '220px', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px' }}>
                <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }} />
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginTop: '12px' }}>{item.name}</h3>
                <div style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '600', marginTop: '6px' }}>{formatPrice(item.price)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {recommendations.length > 0 && (
        <section style={{ maxWidth: '1280px', margin: '40px auto 60px', padding: '0 20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Recommended for You</h2>
          <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>
            {recommendations.map((item, idx) => (
              <div key={idx} style={{ minWidth: '220px', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px' }}>
                <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }} />
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginTop: '12px' }}>{item.name}</h3>
                <div style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '600', marginTop: '6px' }}>{formatPrice(item.price)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}
