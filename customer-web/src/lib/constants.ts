/** Pagination defaults matching Flutter */
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  SEARCH_LIMIT: 30,
  REVIEWS_LIMIT: 10,
  QUOTES_LIMIT: 20,
  NOTIFICATIONS_LIMIT: 20,
} as const;

/** Order status enum matching Flutter */
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

/** Quote status enum matching Flutter */
export const QUOTE_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  REVISION: 'revision',
  EXPIRED: 'expired',
} as const;

/** Payment status */
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PARTIAL: 'partial',
  OVERDUE: 'overdue',
  REFUNDED: 'refunded',
} as const;

/** Notification types matching Flutter */
export const NOTIFICATION_TYPE = {
  ORDER: 'order',
  QUOTE: 'quote',
  PAYMENT: 'payment',
  CHAT: 'chat',
  GENERAL: 'general',
  PROMOTION: 'promotion',
} as const;

/** API Endpoints — single source of truth matching Flutter repositories */
export const ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/api/v1/auth/login',
  AUTH_REGISTER: '/api/v1/auth/register',
  AUTH_LOGOUT: '/api/v1/auth/logout',
  AUTH_RESET_PASSWORD: '/api/v1/auth/reset-password',
  AUTH_OTP_REQUEST: '/api/v1/auth/otp/request',
  AUTH_OTP_VERIFY: '/api/v1/auth/otp/verify',

  // Home
  HOME: '/api/v1/home',

  // Profile
  PROFILE_ME: '/api/v1/profile/me',
  PROFILE_UPDATE: '/api/v1/profile/update',
  PROFILE_IMAGE_UPDATE: '/api/v1/profile/image-update',
  PROFILE_EMAIL_VERIFY_SEND: '/api/v1/profile/email-verification/send',
  PROFILE_EMAIL_VERIFY: '/api/v1/profile/email-verification/verify',
  PROFILE_EMAIL_CHANGE_REQUEST: '/api/v1/profile/email/change/request',
  PROFILE_EMAIL_CHANGE_VERIFY: '/api/v1/profile/email/change/verify',
  PROFILE_CHANGE_PASSWORD: '/api/v1/profile/change-password',
  PROFILE_PHONE_CHANGE_REQUEST: '/api/v1/profile/phone/change/request',
  PROFILE_PHONE_CHANGE_VERIFY: '/api/v1/profile/phone/change/verify',

  // Address
  ADDRESS_LIST: '/api/v1/address/list',
  ADDRESS_STORE: '/api/v1/address/store',
  ADDRESS_UPDATE: '/api/v1/address/update',
  ADDRESS_DELETE: (id: string | number) => `/api/v1/address/${id}`,

  // Cart
  CART_COUNT: '/api/v1/cart/items/count',
  CART_SUMMARY: '/api/v1/cart/summary',
  CART_ITEMS_LIST: '/api/v1/cart/items/list',
  CART_ADD: '/api/v1/cart/items/add',
  CART_REMOVE: '/api/v1/cart/items/remove',
  CART_UPDATE_QUANTITY: '/api/v1/cart/items/quantity/update',
  CART_PROMO_ADD: '/api/v1/cart/promo-code/add',
  CART_PROMO_REMOVE: '/api/v1/cart/promo-code/remove',
  CART_PAYMENT_TERM: '/api/v1/cart/items/payment-term',
  CART_SHIPMENT_DETAILS: '/api/v1/cart/items/shipment/details',
  CART_SHIPMENT_LIST: '/api/v1/cart/items/shipment/list',
  CART_DELIVERY_INSTRUCTIONS: '/api/v1/cart/delivery-instructions',
  CART_TAXES_DETAILS: '/api/v1/cart/taxes/details',

  // Save for Later
  SAVE_FOR_LATER_LIST: '/api/v1/save-for-later/list',
  SAVE_FOR_LATER_ADD: '/api/v1/save-for-later/add',
  SAVE_FOR_LATER_MOVE_TO_CART: '/api/v1/save-for-later/move-to-cart',
  SAVE_FOR_LATER_REMOVE: '/api/v1/save-for-later/remove',
  SAVE_FOR_LATER_PAYMENT_TERM: '/api/v1/save-for-later/payment-term',

  // Checkout
  CHECKOUT: '/api/v1/checkout',

  // Media
  MEDIA_AUDIO_UPLOAD: '/api/v1/media/audio/upload',

  // Search
  SERVICES_SEARCH: '/api/v1/services/search',
  STORE_TYPES_LIST: '/api/v1/store-types/list',

  // Orders
  ORDERS_LIST: '/api/v1/order/list',
  ORDER_DETAIL: (id: string | number) => `/api/v1/order/${id}`,
  ORDER_CANCEL: (id: string | number) => `/api/v1/order/cancel/${id}`,
  ORDER_ITEM_TRACKING: (itemId: string | number) => `/api/v1/order/items/${itemId}/tracking`,
  ORDER_ITEM_TRACKING_STATUS: (itemId: string | number) => `/api/v1/order/items/${itemId}/tracking/status`,
  ORDER_ITEM_PAYMENT_TERM: (id: string | number) => `/api/v1/order/items/${id}/payment-term`,

  // Quotes
  QUOTE_CATALOG_PACKAGES: (slug: string) => `/api/v1/quote-catalog/${slug}/packages`,
  QUOTE_CATALOG_ITEMS: (slug: string) => `/api/v1/quote-catalog/${slug}/items`,

  // Events
  EVENTS_LIST: '/api/v1/events',
  EVENTS_TYPES: '/api/v1/events/types',
  EVENT_DETAIL: (id: string | number) => `/api/v1/events/${id}`,

  // Gift Registry
  GIFT_REGISTRY_LIST: '/api/v1/gift-registry/list',
  GIFT_REGISTRY_EVENTS_LIST: '/api/v1/gift-registry/events/list',
  GIFT_REGISTRY_DETAIL: (id: string | number) => `/api/v1/gift-registry/detail/${id}`,
  GIFT_REGISTRY_STORE: '/api/v1/gift-registry/store',
  GIFT_REGISTRY_UPDATE: (id: string | number) => `/api/v1/gift-registry/update/${id}`,
  GIFT_REGISTRY_DELETE: (id: string | number) => `/api/v1/gift-registry/${id}`,
  GIFT_REGISTRY_ITEM_REMOVE: (regId: string | number, itemId: string | number) =>
    `/api/v1/gift-registry/${regId}/items/remove/${itemId}`,
  GIFT_REGISTRY_ITEM_MOVE_TO_CART: (regId: string | number, itemId: string | number) =>
    `/api/v1/gift-registry/${regId}/items/move-to-cart/${itemId}`,
  GIFT_REGISTRY_ITEM_SAVE_FOR_LATER: (regId: string | number, itemId: string | number) =>
    `/api/v1/gift-registry/${regId}/items/save-for-later/${itemId}`,

  // Payments
  PAYMENT_CREDIT_CARDS_LIST: '/api/v1/payment/credit-cards/list',
  PAYMENT_METHODS_LIST: '/api/v1/payment/methods/list',

  // Notifications
  NOTIFICATION_LIST: '/api/v1/notification/list',
  NOTIFICATION_UNREAD_COUNT: '/api/v1/notification/unread-count',
  NOTIFICATION_DETAIL: (id: string | number) => `/api/v1/notification/${id}`,

  // Liked Items
  LIKED_ITEMS_LIST: '/api/v1/liked-items/list',

  // Referrals
  REFERRAL_INVITE: '/api/v1/referral/invite',
  REFERRAL_INVITATIONS: '/api/v1/referral/invitations',

  // Inbox/Chat
  INBOX_DETAIL: '/api/v1/inbox/detail',
  INBOX_SEND_AUDIO: '/api/v1/inbox/send-audio',

  // Boot
  BOOT_STARTUP_SCREENS: '/api/v1/boot/startup-screens',
  BOOT_LEGAL_PAGES: '/api/v1/boot/legal-pages',
} as const;
