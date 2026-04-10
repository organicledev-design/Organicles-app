import axios from 'axios';
import { Product, Order, ApiResponse, Review, Partner, UserProfile } from '../types';
import Config from 'react-native-config';
import { Platform } from 'react-native';

const DEV_API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

const rawApiUrl = Config.API_BASE_URL;
const isValidUrl =
  rawApiUrl &&
  rawApiUrl !== 'undefined' &&
  rawApiUrl !== 'null' &&
  rawApiUrl.startsWith('http');

const API_BASE_URL = isValidUrl
  ? rawApiUrl.trim()
  : __DEV__
  ? DEV_API_BASE_URL
  : 'https://api.organicles.pk/v1';

console.log('[API] Base URL resolved to:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    if (config.data) {
      console.log('[API Request] Data:', JSON.stringify(config.data, null, 2));
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    console.log('[API Response] Data:', JSON.stringify(response.data, null, 2));
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('[API Error Response]', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method,
      });
    } else if (error.request) {
      console.error('[API Network Error] No response received:', {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message,
      });
    } else {
      console.error('[API Error]', error.message);
    }
    return Promise.reject(error);
  }
);

// Hero Banner Services
export const heroBannerService = {
  getAll: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.get('/hero-banners');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('[heroBannerService.getAll] Error:', error.message);
      return { success: false, error: error.message };
    }
  },
};

// Product Services
export const productService = {
  getAll: async (): Promise<ApiResponse<Product[]>> => {
    try {
      const response = await apiClient.get('/products');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('[productService.getAll] Error:', error.message);
      return { success: false, error: error.message };
    }
  },

  getById: async (id: string): Promise<ApiResponse<Product>> => {
    try {
      const response = await apiClient.get(`/products/${id}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`[productService.getById] Error for id ${id}:`, error.message);
      return { success: false, error: error.message };
    }
  },

  getFeatured: async (n: number): Promise<ApiResponse<Product[]>> => {
    try {
      const response = await apiClient.get('/products/featured');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('[productService.getFeatured] Error:', error.message);
      return { success: false, error: error.message };
    }
  },
};

// Review Services
export const reviewService = {
  getAll: async (): Promise<ApiResponse<Review[]>> => {
    try {
      const response = await apiClient.get('/reviews');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('[reviewService.getAll] Error:', error.message);
      return { success: false, error: error.message };
    }
  },
};

// Partner Services
export const partnerService = {
  getAll: async (): Promise<ApiResponse<Partner[]>> => {
    try {
      const response = await apiClient.get('/partners');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('[partnerService.getAll] Error:', error.message);
      return { success: false, error: error.message };
    }
  },
};

// User Services
export const userService = {
  upsertProfile: async (profile: UserProfile): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post('/users/profile', profile);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('[userService.upsertProfile] Error:', error.message);
      return { success: false, error: error.message };
    }
  },

    getProfileByPhone: async (phone: string): Promise<ApiResponse<any>> => {
    try {
      const encodedPhone = encodeURIComponent(phone);
      const response = await apiClient.get(`/users/profile/${encodedPhone}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      if (error.response?.status === 404) {
        // User not found is an expected state for new users
        return { success: false, error: 'User not found' };
      }
      console.error(`[userService.getProfileByPhone] Error for phone ${phone}:`, error.message);
      return { success: false, error: error.message };
    }
  },
};

// Order Services
export const orderService = {
  create: async (orderData: Partial<Order>): Promise<ApiResponse<Order>> => {
    try {
      const response = await apiClient.post('/orders', orderData);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('[orderService.create] Error:', error.message);
      return { success: false, error: error.message };
    }
  },

  getById: async (id: string): Promise<ApiResponse<Order>> => {
    try {
      const response = await apiClient.get(`/orders/${id}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`[orderService.getById] Error for id ${id}:`, error.message);
      return { success: false, error: error.message };
    }
  },

  getUserOrders: async (): Promise<ApiResponse<Order[]>> => {
    try {
      const response = await apiClient.get('/orders/user');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('[orderService.getUserOrders] Error:', error.message);
      return { success: false, error: error.message };
    }
  },

  createCODOrder: async (orderData: {
    orderId: string;
    items: any[];
    shippingAddress: any;
    totalAmount: number;
  }): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post('/orders/cod', orderData);
      console.log('[createCODOrder] Success:', response.data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('[createCODOrder] Error:', error.message);
      if (error.response) {
        console.error('[createCODOrder] Error response:', error.response.data);
      }
      return { success: false, error: error.message };
    }
  },
};

// Payment Services - CORRECTED ENDPOINT
export const paymentService = {
  createOrderAndPayment: async (paymentData: any): Promise<ApiResponse<any>> => {
    try {
      console.log('[PaymentService] Creating order and payment...');
      console.log('[PaymentService] Endpoint: /payments/order');
      console.log('[PaymentService] Payment Data:', JSON.stringify(paymentData, null, 2));
      
      const response = await apiClient.post('/payments/order', paymentData);
      
      console.log('[PaymentService] Response status:', response.status);
      console.log('[PaymentService] Response data:', JSON.stringify(response.data, null, 2));
      
      if (response.data) {
        console.log('[PaymentService] Success - checkout_url:', response.data.checkout_url);
        console.log('[PaymentService] Success - order:', response.data.order);
        console.log('[PaymentService] Success - payment:', response.data.payment);
      }
      
      return { 
        success: true, 
        data: response.data 
      };
    } catch (error: any) {
      console.error('[PaymentService] Error creating payment:');
      
      if (error.response) {
        console.error('[PaymentService] Response status:', error.response.status);
        console.error('[PaymentService] Response data:', JSON.stringify(error.response.data, null, 2));
        
        return { 
          success: false, 
          error: error.response.data?.message || error.response.data?.error || 'Payment service error',
          data: error.response.data 
        };
      } else if (error.request) {
        console.error('[PaymentService] No response received:', error.request);
        return { 
          success: false, 
          error: 'Network error - no response from server' 
        };
      } else {
        console.error('[PaymentService] Request setup error:', error.message);
        return { 
          success: false, 
          error: error.message 
        };
      }
    }
  },
};

export default apiClient;
