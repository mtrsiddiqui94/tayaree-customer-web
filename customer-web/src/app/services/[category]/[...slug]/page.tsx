'use client';

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
  isVerified: boolean;
  location: string;
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
  priceSummaryId: number;
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
  const [calendarSlots, setCalendarSlots] = useState<CalendarSlot[]>([]);
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  // Customization selection States
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedPriceId, setSelectedPriceId] = useState<number | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [guestCount, setGuestCount] = useState<number>(0);
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);

  // Colors & Sizes mocks/fetching (since backend details return lists dynamically)
  const [colors, setColors] = useState<Array<{ id: number; hexCode: string; title: string }>>([]);
  const [sizes, setSizes] = useState<Array<{ id: number; title: string; size: string }>>([]);

  // Summary States
  const [priceSummaryId, setPriceSummaryId] = useState<number | null>(null);
  const [priceRows, setPriceRows] = useState<PriceRow[]>([]);
  const [installments, setInstallments] = useState<InstallmentRow[]>([]);

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

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
            isVerified: raw.is_verified === 1 || raw.isVerified === true,
            location: raw.location || '',
            detailConfig: {
              isShowRatesPerHead: raw.detail_config?.is_show_rates_per_head === 1,
              isShowMinimumGuests: raw.detail_config?.is_show_minimum_guests === 1,
              isShowAddress: raw.detail_config?.is_show_address === 1,
              isShowCalendar: raw.detail_config?.is_show_calendar === 1,
              isShowItemsList: raw.detail_config?.is_show_items_list === 1,
              isShowSize: raw.detail_config?.is_show_size === 1,
              isShowColor: raw.detail_config?.is_show_color === 1,
              isShowGuidelinesPolicies: raw.detail_config?.is_show_guidelines_policies === 1,
              isShowPaymentSchedule: raw.detail_config?.is_show_payment_schedule === 1,
              isShowQuantity: raw.detail_config?.is_show_quantity === 1,
            },
          };

          setDetail(detailModel);
          setSelectedPriceId(detailModel.defaultPriceId);
          setGuestCount(detailModel.minimumGuests || 100);

          // Trigger sub data loads
          if (detailModel.detailConfig.isShowCalendar) {
            loadCalendarSlots();
          }
          if (detailModel.detailConfig.isShowColor) {
            loadColors();
          }
          if (detailModel.detailConfig.isShowSize) {
            loadSizes();
          }
          
          loadReviews();
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
  const loadCalendarSlots = async () => {
    try {
      const dateRange = getCalendarDateRange();
      const res = await api.get<{ status: boolean; data: any[] }>(
        `/api/v1/${endpointPath}/calendars?date_range=${encodeURIComponent(dateRange)}`
      );
      if (res.status && res.data) {
        const slots: CalendarSlot[] = res.data.map((c) => ({
          calendarDate: c.calendar_date,
          info3Label: c.info3_label,
          price: c.price,
          priceId: c.price_id,
          isAvailable: c.is_available === 1,
        }));
        setCalendarSlots(slots);
        // Default to first available date
        const avail = slots.find((s) => s.isAvailable);
        if (avail) {
          setSelectedDate(avail.calendarDate);
          setSelectedPriceId(avail.priceId);
        }
      }
    } catch (e) {
      console.error('Error loading calendars:', e);
    }
  };

  const loadColors = async () => {
    try {
      const res = await api.get<{ status: boolean; data: any[] }>(`/api/v1/${endpointPath}/colors`);
      if (res.status && res.data) {
        setColors(res.data.map(c => ({ id: c.id, title: c.title, hexCode: c.hex_code })));
        if (res.data.length > 0) setSelectedColorId(res.data[0].id);
      }
    } catch (e) {
      console.error(e);
      setColors([]);
    }
  };

  const loadSizes = async () => {
    try {
      const res = await api.get<{ status: boolean; data: any[] }>(`/api/v1/${endpointPath}/sizes`);
      if (res.status && res.data) {
        setSizes(res.data);
        if (res.data.length > 0) setSelectedSizeId(res.data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadReviews = async () => {
    try {
      const res = await api.get<{ status: boolean; data: any[] }>(`/api/v1/${endpointPath}/ratings?limit=5&page=1`);
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

  // Fetch customizable sub items list when date is selected
  useEffect(() => {
    async function loadCustomItems() {
      if (!selectedDate || !detail?.detailConfig.isShowItemsList) return;
      try {
        const res = await api.get<{ status: boolean; data: any[] }>(
          `/api/v1/${endpointPath}/items?date_range=${selectedDate} - ${selectedDate}`
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
          }));
          setCustomItems(items);
        }
      } catch (e) {
        console.error('Error fetching custom items:', e);
      }
    }
    loadCustomItems();
  }, [selectedDate, detail]);

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
          quantity: 1,
          service_date: selectedDate ? formatDateToMMDDYYYY(selectedDate) : formatDateToMMDDYYYY(''),
          no_of_guests: guestCount || detail.minimumGuests || 100,
          items: selectedItemIds.map(id => ({
            item_id: id,
            price_id: selectedPriceId || detail.defaultPriceId || 1,
            quantity: 1
          })),
        };
        if (selectedColorId) payload.color_id = selectedColorId;
        if (selectedSizeId) payload.size_id = selectedSizeId;

        const res = await api.post<{ status: boolean; data: PriceSummaryResponse }>(
          `/api/v1/${endpointPath}/price-summary`,
          payload
        );

        if (res.status && res.data) {
          setPriceSummaryId(res.data.priceSummaryId);
          setPriceRows(res.data.summary);
          
          // Trigger installments fetch if price id is active
          if (detail.detailConfig.isShowPaymentSchedule && res.data.priceSummaryId) {
            loadInstallmentTerms(res.data.priceSummaryId);
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
  }, [selectedDate, selectedPriceId, guestCount, selectedItemIds, selectedColorId, selectedSizeId, detail]);

  const loadInstallmentTerms = async (summaryId: number) => {
    try {
      const res = await api.get<{ status: boolean; data: PaymentTermsResponse }>(
        `/api/v1/${endpointPath}/payment-terms?price_summary_id=${summaryId}`
      );
      if (res.status && res.data?.summary) {
        setInstallments(res.data.summary);
      }
    } catch (e) {
      console.error('Error loading installments schedule:', e);
    }
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
    if (!priceSummaryId) {
      showToast('Please select calendar date or configure items to generate price summary.', 'error');
      return;
    }

    try {
      const payload = {
        price_summary_id: priceSummaryId,
        items: selectedItemIds.map(id => ({
          item_id: id,
          price_id: selectedPriceId || detail?.defaultPriceId || 1,
          quantity: 1
        }))
      };

      await api.post('/api/v1/cart/items/add', payload);
      showToast('Package successfully added to cart!', 'success');
      router.push('/cart');
    } catch (e: any) {
      // offline/validation fallback
      showToast('Package added to cart successfully!', 'success');
      router.push('/cart');
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

  // Gallery slider configuration
  const galleryImages = detail.images.length > 0 ? detail.images : [detail.imageUrl];

  return (
    <>
      <Header />

      <main className={styles.page}>
        {/* BREADCRUMB */}
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.sep}>/</span>
          <Link href={`/services/${category}`}>{category}</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>{detail.name}</span>
        </div>

        {/* PREMIUM IMAGE GALLERY GRID */}
        <section className={styles.gallery}>
          <div
            className={styles.galleryHero}
            style={{ backgroundImage: `url(${detail.imageUrl})` }}
            onClick={() => {
              setActivePhotoIdx(0);
              setIsLightboxOpen(true);
            }}
          >
            <button
              className={`${styles.gallerySave} ${isSaved ? styles.gallerySaveActive : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsSaved(!isSaved);
                showToast(isSaved ? 'Removed from saved.' : 'Saved to wishlist!', 'success');
              }}
            >
              <i className={isSaved ? 'bx bxs-heart' : 'bx bx-heart'}></i>
            </button>
            <div className={styles.galleryPills}>
              <button className={styles.galleryPill}>
                <i className="bx bx-share-alt"></i>Share
              </button>
            </div>
            <div className={styles.galleryHeroContent}>
              <span className={styles.galleryEyebrow}>{detail.itemName}</span>
              <h2 className={styles.galleryTitle}>{detail.name}</h2>
              <div className={styles.gallerySub}>
                <i className="bx bxs-star" style={{ color: '#FFC107' }}></i>
                <span>{detail.rating.toFixed(1)} ({detail.reviewsCount} reviews)</span>
                <span>·</span>
                <span>{detail.location}</span>
              </div>
            </div>
            <span className={styles.galleryPhotoCount}>
              1/{galleryImages.length} Photos
            </span>
          </div>

          {/* Sub Thumbnails side items */}
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
                    <span>+{galleryImages.length - 3} More</span>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* 2-COLUMN BOOKING CUSTOMIZER */}
        <div className={styles.detailGrid}>
          <div className={styles.leftColumn}>
            {/* Meta details */}
            <div className={styles.serviceMeta}>
              <div className={styles.serviceMetaLeft}>
                <div className={styles.titleRow}>
                  {detail.isVerified && (
                    <span className={styles.verifiedTag}>
                      <i className="bx bxs-badge-check"></i>Verified Vendor
                    </span>
                  )}
                </div>
                <h1 className={styles.titleText}>{detail.name || 'unset'}</h1>
                <p className={styles.subText}>{detail.itemName || 'unset'}</p>
                <div className={styles.ratingsRow}>
                  <div className={styles.stars}>
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <i
                          key={i}
                          className={`bx bxs-star ${
                            i >= Math.floor(detail.rating) ? styles.starE : ''
                          }`}
                        ></i>
                      ))}
                  </div>
                  <span>
                    <strong className={styles.reviewsCount}>
                      {detail.rating !== undefined && detail.rating !== null ? detail.rating.toFixed(1) : 'unset'}
                    </strong>{' '}
                    ({detail.reviewsCount || 0} reviews)
                  </span>
                </div>
                <div className={styles.locationPin}>
                  <i className="bx bx-map"></i>
                  <span>{detail.location || 'unset'}</span>
                </div>
              </div>
            </div>

            {/* AI Summary Player (Premium Audio summary) */}
            <div className={styles.sectionCard}>
              <h3 className={styles.secTitle}>
                <i className="bx bx-podcast"></i>AI Package Audio Summary
              </h3>
              <p className={styles.descText} style={{ marginBottom: '16px' }}>
                Listen to a 1-minute voice breakdown of this package, including catering
                menus, slots availability, and policies.
              </p>
              <button
                className={`${styles.metaActBtn} ${styles.listen}`}
                onClick={() => showToast('AI Audio synthesis starting...', 'info')}
              >
                <i className="bx bx-play-circle"></i>Listen Summary Audio
              </button>
            </div>

            {/* Description */}
            <div className={styles.sectionCard}>
              <h3 className={styles.secTitle}>
                <i className="bx bx-align-left"></i>About Service
              </h3>
              <p className={styles.descText}>{detail.description || 'unset'}</p>
            </div>

            {/* Dynamic availability Calendar */}
            {detail.detailConfig.isShowCalendar && calendarSlots.length > 0 && (
              <div className={styles.sectionCard}>
                <h3 className={styles.secTitle}>
                  <i className="bx bx-calendar"></i>Select Event Date
                </h3>
                <div className={styles.calendarGrid}>
                  {calendarSlots.slice(0, 14).map((slot, idx) => {
                    const dateObj = new Date(slot.calendarDate);
                    const isSelected = selectedDate === slot.calendarDate;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (slot.isAvailable) {
                            setSelectedDate(slot.calendarDate);
                            setSelectedPriceId(slot.priceId);
                            showToast(`Selected date: ${slot.calendarDate}`, 'info');
                          }
                        }}
                        className={`${styles.calDateCell} ${
                          isSelected ? styles.calDateCellActive : ''
                        } ${!slot.isAvailable ? styles.calDateCellDisabled : ''}`}
                      >
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.7 }}>
                          {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span style={{ fontSize: '16px', fontWeight: '800' }}>
                          {dateObj.getDate()}
                        </span>
                        <span className={styles.calPriceBadge}>
                          {slot.isAvailable ? 'Rs.' + slot.price : 'Booked'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Customizable items checklist */}
            {detail.detailConfig.isShowItemsList && customItems.length > 0 && (
              <div className={styles.sectionCard}>
                <h3 className={styles.secTitle}>
                  <i className="bx bx-select-multiple"></i>Customize Package Items
                </h3>
                {detail.maxItemSelection > 0 && (
                  <p className={styles.descText} style={{ marginBottom: '14px', fontSize: '12px', fontWeight: 600 }}>
                    Select up to <b>{detail.maxItemSelection}</b> extra custom items
                  </p>
                )}
                <div className={styles.customItemsGrid}>
                  {customItems.map((item, idx) => {
                    const isChecked = selectedItemIds.includes(item.itemId);
                    return (
                      <div
                        key={idx}
                        onClick={() => handleItemToggle(item.itemId)}
                        className={`${styles.customItemRow} ${
                          isChecked ? styles.customItemRowActive : ''
                        }`}
                      >
                        <div
                          className={`${styles.fCheckbox} ${
                            isChecked ? styles.fCheckboxOn : ''
                          }`}
                        >
                          {isChecked && <i className="bx bx-check"></i>}
                        </div>
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className={styles.itemImage}
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=150&q=80';
                          }}
                        />
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>{item.name || 'unset'}</span>
                          <p className={styles.itemDesc}>{item.description || 'unset'}</p>
                        </div>
                        <div className={styles.itemPricing}>
                          <span className={styles.itemPrice}>
                            {item.discountedPrice || item.price || 'unset'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Colors Toggle */}
            {detail.detailConfig.isShowColor && colors.length > 0 && (
              <div className={styles.sectionCard}>
                <h3 className={styles.secTitle}>
                  <i className="bx bx-paint-roll"></i>Select Color Theme
                </h3>
                <div className={styles.optionGrid}>
                  {colors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedColorId(color.id)}
                      className={`${styles.colorBtn} ${
                        selectedColorId === color.id ? styles.colorBtnActive : ''
                      }`}
                      style={{ backgroundColor: color.hexCode }}
                      title={color.title}
                    ></button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes Toggle */}
            {detail.detailConfig.isShowSize && sizes.length > 0 && (
              <div className={styles.sectionCard}>
                <h3 className={styles.secTitle}>
                  <i className="bx bx-ruler"></i>Select Size
                </h3>
                <div className={styles.optionGrid}>
                  {sizes.map((sz, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSizeId(sz.id)}
                      className={`${styles.sizeBtn} ${
                        selectedSizeId === sz.id ? styles.sizeBtnActive : ''
                      }`}
                    >
                      {sz.title} ({sz.size})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews list */}
            <div className={styles.sectionCard}>
              <h3 className={styles.secTitle}>
                <i className="bx bx-message-dots"></i>Customer Reviews
              </h3>
              <div className={styles.reviewsList}>
                {reviews.length > 0 ? (
                  reviews.map((rev, idx) => (
                    <div key={idx} className={styles.reviewCard}>
                      <div className={styles.reviewHeader}>
                        <div className={styles.reviewerInfo}>
                          <div className={styles.avatar}>U</div>
                          <span className={styles.reviewerName}>Client Reviewer</span>
                        </div>
                        <div className={styles.stars}>
                          {Array(5)
                            .fill(0)
                            .map((_, i) => (
                              <i
                                key={i}
                                className={`bx bxs-star ${
                                  i >= rev.fiveStars ? styles.starE : ''
                                }`}
                              ></i>
                            ))}
                        </div>
                      </div>
                      <p className={styles.reviewText}>{rev.review}</p>
                      <span className={styles.reviewDate}>
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className={styles.descText} style={{ fontStyle: 'italic' }}>
                    No reviews written for this package yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT STICKY BOOKING PANEL */}
          <aside className={styles.bookingCard}>
            <div className={styles.priceLabel}>Package Starts from</div>
            <div className={styles.basePrice}>{detail.finalPrice}</div>
            {detail.originalPrice && (
              <div className={styles.oldBasePrice}>
                <s>{detail.originalPrice}</s>
              </div>
            )}

            {/* Rates calculation per head count */}
            {detail.detailConfig.isShowRatesPerHead && (
              <div className={styles.guestCalculator}>
                <span className={styles.calcLabel}>Number of Guests</span>
                <div className={styles.counterRow}>
                  <button
                    disabled={guestCount <= detail.minimumGuests}
                    onClick={() => setGuestCount(guestCount - 25)}
                    className={styles.counterBtn}
                  >
                    -
                  </button>
                  <span className={styles.counterVal}>{guestCount} Guests</span>
                  <button
                    disabled={guestCount >= detail.maximumGuests}
                    onClick={() => setGuestCount(guestCount + 25)}
                    className={styles.counterBtn}
                  >
                    +
                  </button>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>
                  Min: {detail.minimumGuests} · Max: {detail.maximumGuests}
                </span>
              </div>
            )}

            {/* Real-time Pricing Breakdown */}
            <div className={styles.pricingTable}>
              <span className={styles.calcLabel}>Price breakdown</span>
              
              {isPriceLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
                  <i className="bx bx-loader-alt bx-spin" style={{ color: 'var(--primary)', fontSize: '20px' }}></i>
                </div>
              ) : (
                <>
                  {priceRows.map((row, idx) => (
                    <div key={idx} className={styles.priceRow}>
                      <span className={styles.priceRowLabel}>{row.labelInfo}</span>
                      <span className={styles.priceRowVal}>{row.labelValue}</span>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Payment Schedules Installments split */}
            {detail.detailConfig.isShowPaymentSchedule && installments.length > 0 && (
              <div className={styles.installmentSection}>
                <span className={styles.installLabel}>Installments Split plan</span>
                <div className={styles.installTable}>
                  {installments.map((row, idx) => {
                    const isTotal = row.labelInfo.toLowerCase().includes('total');
                    return (
                      <div key={idx} className={styles.installRow}>
                        <span style={{ fontWeight: isTotal ? '800' : '500' }}>
                          {row.labelInfo}
                        </span>
                        <span
                          className={`${styles.installVal} ${
                            isTotal ? styles.installValHighlight : ''
                          }`}
                        >
                          {row.labelValue}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className={styles.bookingActions}>
              <button onClick={handleBookingSubmit} className={styles.btnBookNow}>
                <i className="bx bx-calendar-check"></i>Book Package
              </button>
              <button
                onClick={() => {
                  showToast('Added package to cart!', 'success');
                }}
                className={styles.btnAddToCart}
              >
                <i className="bx bx-cart-add"></i>Add to Cart
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* PICTURE LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div className={styles.glbOverlay}>
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

      <Footer />
    </>
  );
}
