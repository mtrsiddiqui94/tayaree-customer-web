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
  const serviceId = slugArr[0];

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
  const [isSaved, setIsSaved] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const normalizeDateStr = (dateInput: string | Date): string => {
    if (!dateInput) return '';
    if (dateInput instanceof Date) {
      const y = dateInput.getFullYear();
      const m = String(dateInput.getMonth() + 1).padStart(2, '0');
      const d = String(dateInput.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    const str = String(dateInput).trim();
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        let m = parts[0].padStart(2, '0');
        let d = parts[1].padStart(2, '0');
        let y = parts[2];
        if (y.length === 2) y = `20${y}`;
        if (parts[0].length === 4) {
          y = parts[0];
          m = parts[1].padStart(2, '0');
          d = parts[2].padStart(2, '0');
        }
        return `${y}-${m}-${d}`;
      }
    }
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return str;
  };

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

  const formatCompactPrice = (priceVal: any) => {
    if (priceVal === undefined || priceVal === null || priceVal === '') return '';
    const str = priceVal.toString().trim();
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return str;
    return `PKR ${num.toLocaleString('en-US')}`;
  };

  const getFittingDateString = () => {
    if (!selectedDate) return 'Select event date first';
    const norm = normalizeDateStr(selectedDate);
    const parts = norm.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
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
          calendarDate: normalizeDateStr(c.calendar_date || c.calendarDate),
          info3Label: c.info3_label || '',
          price: c.price !== undefined && c.price !== null ? String(c.price) : '0',
          priceId: c.price_id || c.priceId,
          isAvailable: c.is_available === 1 || c.is_available === true || String(c.is_available) === '1',
        }));
        setCalendarSlots(slots);
        // Default to first available date matching Flutter initState
        const avail = slots.find((s) => s.isAvailable);
        if (avail) {
          setSelectedDate(avail.calendarDate);
          setSelectedPriceId(avail.priceId);
          const parsed = new Date(avail.calendarDate);
          if (!isNaN(parsed.getTime())) {
            setCurrentMonth(parsed);
          }
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
      const res = await api.get<{ status: boolean; data: any }>(`/api/v1/${endpointPath}/product-detail`);
      if (res.status && res.data) {
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
      const res = await api.get<{ status: boolean; data: any[] }>(`/api/v1/${endpointPath}/ratings?limit=${reviewsLimit}&page=${reviewsPage}`);
      if (res.status && res.data) {
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
        const res = await api.get<{ status: boolean; data: any }>(`/api/v1/${endpointPath}`);
        if (res.status && res.data) {
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

          setDetail(detailModel);
          setIsSaved(raw.customer_liked === 1 || raw.customerLiked === 1);
          setSelectedPriceId(detailModel.defaultPriceId);
          setGuestCount(detailModel.minimumGuests || 100);
          if (detailModel.detailConfig.isShowQuantity) {
            setQuantity(4);
          } else {
            setQuantity(1);
          }

          // Trigger sub data loads
          if (detailModel.detailConfig.isShowCalendar) {
            loadCalendarSlots();
          }
          if (detailModel.detailConfig.isShowColor) {
            loadColors();
          }
          if (detailModel.detailConfig.isShowGuidelinesPolicies) {
            loadPackageDetails();
          }
          if (raw.detail_config?.is_show_colors === 1) loadColors();
          if (raw.detail_config?.is_show_sizes === 1) loadSizes();
          
          loadReviews();

          // Load frequently-bought & recommendations
          api.get(`/api/v1/${endpointPath}/frequently-bought`).then((res: any) => {
            if (res.status && res.data) setFrequentlyBought(res.data);
          });
          api.get(`/api/v1/${endpointPath}/recommendations`).then((res: any) => {
            if (res.status && res.data) setRecommendations(res.data);
          });
        }
      } catch (e) {
        console.error('Error fetching service details:', e);
        showToast('Failed to load service packages details.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadServiceSpecs();
  }, [category, slugStr]);

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
        const res = await api.get<{ status: boolean; data: any[] }>(
          `/api/v1/${endpointPath}/items?date_range=${dateToUse} - ${dateToUse}`
        );
        if (res.status && res.data) {
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
        }
      } catch (e) {
        console.error('Error fetching custom items:', e);
      }
    }
    loadCustomItems();
  }, [selectedDate, detail]);

  async function loadInstallmentTerms(summaryId: number) {
    try {
      const res = await api.get<{ status: boolean; data: PaymentTermsResponse }>(
        `/api/v1/${endpointPath}/payment-terms?price_summary_id=${summaryId}`
      );
      if (res.status && res.data?.summary) {
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

        const res = await api.post<{ status: boolean; data: PriceSummaryResponse }>(
          `/api/v1/${endpointPath}/price-summary`,
          payload
        );

        if (res.status && res.data) {
          const summaryId = res.data.price_summary_id || res.data.priceSummaryId || null;
          setPriceSummaryId(summaryId);
          setPriceSummaryHeading(res.data.heading || '');
          const mappedRows = (res.data.summary || []).map((r: any) => ({
            labelInfo: r.label_info || r.labelInfo || '',
            labelValue: r.label_value !== undefined ? r.label_value : r.labelValue
          }));
          setPriceRows(mappedRows);
          
          // Trigger installments fetch if price id is active
          if (detail.detailConfig.isShowPaymentSchedule && summaryId) {
            loadInstallmentTerms(summaryId);
          }
        }
      } catch (e) {
        console.error('Error calculating price summary:', e);
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
    const norm = normalizeDateStr(d);
    return calendarSlots.find(slot => normalizeDateStr(slot.calendarDate) === norm);
  };

  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return 'Select Date';
    const norm = normalizeDateStr(dStr);
    const parts = norm.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      if (months[month]) {
        return `${day} ${months[month]} ${year}`;
      }
    }
    return dStr;
  };

  const isDateSelected = (d: Date) => {
    if (!selectedDate) return false;
    return normalizeDateStr(d) === normalizeDateStr(selectedDate);
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
                    <div className={styles.actionRow} onClick={() => { setIsSaved(true); showToast('Added to registry!', 'success'); }}>
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
                <div className={styles.sidebarHead}>
                  <div className={styles.shName}>{detail.name}</div>
                  <div className={styles.shVendor}>by {detail.info1Label || 'Verified Vendor'}</div>
                  <div className={styles.shPriceRow}>
                    <span className={styles.shFrom}>from</span>
                    <span className={styles.shPrice}>{formatPrice(detail.finalPrice)}</span>
                    <span className={styles.shUnit}>{detail.priceLabel || '/package'}</span>
                    {detail.originalPrice && (
                      <>
                        <span className={styles.shOld}>{formatPrice(detail.originalPrice)}</span>
                        {detail.discountPercentage > 0 && (
                          <span className={styles.shDisc}>
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
                      <span className={styles.fieldHint}>
                        Min: {detail.minimumGuests} · Max: {detail.maximumGuests || 'No Limit'}
                      </span>
                    </div>
                  )}

                  {/* Event Date inline interactive Calendar */}
                  {detail.detailConfig.isShowCalendar && (() => {
                    const today0 = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
                    const availableSlots = calendarSlots.filter(s => s.isAvailable && parseFloat(s.price) > 0);
                    const futureSlots = availableSlots.filter(s => {
                      const d = new Date(s.calendarDate).getTime();
                      return d >= today0;
                    });
                    const averagePrice = futureSlots.length > 0
                      ? futureSlots.reduce((acc, curr) => acc + parseFloat(curr.price), 0) / futureSlots.length
                      : null;

                    const selectedPriceVal = (() => {
                      if (!selectedDate) return null;
                      const s = findCalendarSlot(new Date(selectedDate));
                      return s && s.price ? parseFloat(s.price) : null;
                    })();

                    // Find lowest rate candidate
                    let lowestSlot: CalendarSlot | null = null;
                    if (futureSlots.length > 0) {
                      const candidates = futureSlots.filter(s => {
                        if (selectedDate && normalizeDateStr(s.calendarDate) === normalizeDateStr(selectedDate)) return false;
                        if (selectedPriceVal !== null && parseFloat(s.price) >= selectedPriceVal) return false;
                        return true;
                      });
                      if (candidates.length > 0) {
                        lowestSlot = candidates.reduce((prev, curr) => parseFloat(curr.price) < parseFloat(prev.price) ? curr : prev);
                      }
                    }

                    return (
                      <div>
                        <span className={styles.fieldLabel}>Event date</span>
                        <div className={styles.calTop}>
                          <span className={styles.calDateSel}>{formatDisplayDate(selectedDate)}</span>
                          <span className={styles.calAvail}>
                            <i className="bx bx-check-circle"></i>Available
                          </span>
                        </div>

                        {/* Smart Rate Callout Banner */}
                        {lowestSlot && (
                          <div
                            className={styles.calHighlight}
                            onClick={() => {
                              if (lowestSlot) {
                                setSelectedDate(lowestSlot.calendarDate);
                                setSelectedPriceId(lowestSlot.priceId);
                                const parsed = new Date(lowestSlot.calendarDate);
                                if (!isNaN(parsed.getTime())) setCurrentMonth(parsed);
                              }
                            }}
                          >
                            <i className="bx bx-bulb"></i>
                            <span>
                              Lowest rate PKR {formatPrice(lowestSlot.price).replace('PKR ', '')} on {formatDisplayDate(lowestSlot.calendarDate)} · Tap to pick
                            </span>
                          </div>
                        )}

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
                            const isPast = day.date.getTime() < today0;
                            const isAvailable = !isPast && (calendarSlots.length > 0 ? (slot ? slot.isAvailable : false) : true);
                            const isSelected = isDateSelected(day.date);
                            const isToday = normalizeDateStr(day.date) === normalizeDateStr(new Date());
                            const isLowPrice = slot && averagePrice !== null && parseFloat(slot.price) <= averagePrice && !isSelected && !isPast;

                            return (
                              <div
                                key={day.key}
                                onClick={() => {
                                  if (isAvailable) {
                                    const normStr = normalizeDateStr(day.date);
                                    setSelectedDate(normStr);
                                    if (slot) setSelectedPriceId(slot.priceId);
                                  }
                                }}
                                className={`${styles.calD} ${day.isCurrentMonth ? '' : styles.calDOther} ${isSelected ? styles.calDSel : ''} ${isToday && !isSelected ? styles.calDToday : ''} ${isAvailable ? '' : styles.calDNa}`}
                              >
                                <span className={styles.calDateNum}>{day.date.getDate()}</span>
                                {slot && isAvailable && slot.price && (
                                  <span className={`${styles.calDatePrice} ${isLowPrice ? styles.calDatePriceLow : ''}`}>
                                    {formatCompactPrice(slot.price)}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Calendar Legend Bar */}
                        <div className={styles.calLegend}>
                          <div className={styles.calLegendItem}>
                            <span className={styles.calLegendDot} style={{ background: 'var(--primary)' }}></span>
                            <span>Selected</span>
                          </div>
                          <div className={styles.calLegendItem}>
                            <span className={styles.calLegendDot} style={{ background: 'var(--border)', border: '1px solid var(--text-muted)' }}></span>
                            <span>Today</span>
                          </div>
                          <div className={styles.calLegendItem}>
                            <span className={styles.calLegendDot} style={{ background: 'var(--success)' }}></span>
                            <span>Low price</span>
                          </div>
                          <div className={styles.calLegendItem}>
                            <span className={styles.calLegendDot} style={{ background: 'var(--text-muted)', opacity: 0.4 }}></span>
                            <span>Unavailable</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

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
                    <i className="bx bx-cart-add"></i>Add to cart{(() => {
                      const payTodayRow = priceRows.find(r => {
                        const lbl = (r.labelInfo || '').toLowerCase();
                        return lbl.includes('amount due today') || lbl.includes('due today') || lbl.includes('today') || lbl.includes('pay today') || lbl.includes('deposit');
                      });
                      if (payTodayRow) {
                        const val = formatBreakdownValue(payTodayRow.labelInfo, payTodayRow.labelValue);
                        if (val && val !== 'unset') return ` · ${val}`;
                      }

                      const totalRow = priceRows.find(r => isBoldRow(r.labelInfo) && !r.labelInfo.toLowerCase().includes('deposit') && !r.labelInfo.toLowerCase().includes('installment') && !r.labelInfo.toLowerCase().includes('remaining'));
                      if (totalRow) {
                        const val = formatBreakdownValue(totalRow.labelInfo, totalRow.labelValue);
                        if (val && val !== 'unset') return ` · ${val}`;
                      }

                      if (selectedDate) {
                        const slot = findCalendarSlot(selectedDate);
                        if (slot && slot.price) {
                          const val = formatPrice(slot.price);
                          if (val && val !== 'unset') return ` · ${val}`;
                        }
                      }

                      const fallback = formatPrice(detail.finalPrice || detail.price);
                      if (fallback && fallback !== 'unset') {
                        return ` · ${fallback}`;
                      }

                      return '';
                    })()}
                  </button>
                  <button
                    type="button"
                    className={styles.btnOutline}
                    onClick={() => { setIsSaved(true); showToast('Added to registry!', 'success'); }}
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
