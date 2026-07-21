const BASE_URL = typeof window === 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://dev-customer2.tayaree.com') : '';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export class ApiError extends Error {
  statusCode: number;
  data: any;

  constructor(message: string, statusCode: number, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

/**
 * Result type matching Flutter's safeCall pattern.
 * Either a success with data or an error.
 */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError; message: string };

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  });

  const config: RequestInit = {
    ...options,
    headers,
  };

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  const response = await fetch(url, config);

  let responseData: any;
  try {
    const text = await response.text();
    responseData = text ? JSON.parse(text) : {};
  } catch {
    responseData = {};
  }

  if (!response.ok) {
    const errorMessage = responseData?.message || responseData?.error || 'Something went wrong';
    throw new ApiError(errorMessage, response.status, responseData);
  }

  return responseData as T;
}

/**
 * Upload a file via multipart form data.
 * Matches Flutter's multipart upload pattern used for:
 * - Profile image upload
 * - Audio upload
 * - Gift registry cover photo
 */
async function uploadMultipart<T>(
  endpoint: string,
  formData: FormData,
  method: 'POST' | 'PUT' = 'POST'
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Do NOT set Content-Type — browser will set multipart/form-data with boundary automatically

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers,
    body: formData,
  });

  let responseData: any;
  try {
    const text = await response.text();
    responseData = text ? JSON.parse(text) : {};
  } catch {
    responseData = {};
  }

  if (!response.ok) {
    const errorMessage = responseData?.message || responseData?.error || 'Something went wrong';
    throw new ApiError(errorMessage, response.status, responseData);
  }

  return responseData as T;
}

/**
 * Safe wrapper matching Flutter's safeCall<T> pattern.
 * Returns a Result union type instead of throwing.
 */
async function safeCall<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (err) {
    if (err instanceof ApiError) {
      return { success: false, error: err, message: err.message };
    }
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return {
      success: false,
      error: new ApiError(message, 0),
      message,
    };
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  getSafe: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'GET' }).catch(() => null),

  post: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    }),

  upload: <T>(endpoint: string, formData: FormData, method: 'POST' | 'PUT' = 'POST') =>
    uploadMultipart<T>(endpoint, formData, method),

  safeCall,
};
