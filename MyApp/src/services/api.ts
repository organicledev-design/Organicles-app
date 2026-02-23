import axios from 'axios';
import { Product, Order, ApiResponse, Review, Partner, UserProfile } from '../types';
import Config from 'react-native-config';
import { Platform } from 'react-native';


// Configure base URL - replace with your actual API endpoint
// Use 'http://localhost:5000/api' for iOS simulator
// Use 'http://10.0.2.2:5000/api' for Android emulator
//const API_BASE_URL = __DEV__ ? 'http://192.168.100.17:5000/api' : 'https://api.organicles.pk/v1';


const DEV_API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

const API_BASE_URL =
  (Config.API_BASE_URL || '').trim() ||
  (__DEV__ ? DEV_API_BASE_URL : 'https://api.organicles.pk/v1');
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
export const heroBannerService = {
  getAll: async () : Promise<ApiResponse<any>> => {
    try{
      const response = await apiClient.get('/hero-banners');
      return { success: true, data: response.data };
    }
      catch (error: any) {
        return { success : false, error: error.message};
      }
    }
  };



// Request interceptor for adding auth tokens
apiClient.interceptors.request.use(
  (config) => {
    // Add authentication token if available
    // const token = await SecureStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Product Services
export const productService = {
  getAll: async (): Promise<ApiResponse<Product[]>> => {
    try {
      const response = await apiClient.get('/products');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getById: async (id: string): Promise<ApiResponse<Product>> => {
    try {
      const response = await apiClient.get(`/products/${id}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getFeatured: async (n: number): Promise<ApiResponse<Product[]>> => {
    try {
      const response = await apiClient.get('/products/featured');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

export const reviewService = {
  getAll: async (): Promise<ApiResponse<Review[]>> => {
    try {
      const response = await apiClient.get('/reviews');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

export const partnerService = {
  getAll: async (): Promise<ApiResponse<Partner[]>> => {
    try {
      const response = await apiClient.get('/partners');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

export const userService = {
  upsertProfile: async (profile: UserProfile): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post('/users/profile', profile);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getProfileByPhone: async (phone: string): Promise<ApiResponse<any>> => {
    try {
      const encodedPhone = encodeURIComponent(phone);
      const response = await apiClient.get(`/users/profile/${encodedPhone}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

export const orderService = {
  create: async (orderData: Partial<Order>): Promise<ApiResponse<Order>> => {
    try {
      const response = await apiClient.post('/orders', orderData);
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getById: async (id: string): Promise<ApiResponse<Order>> => {
    try {
      const response = await apiClient.get(`/orders/${id}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getUserOrders: async (): Promise<ApiResponse<Order[]>> => {
    try {
      const response = await apiClient.get('/orders/user');
      return { success: true, data: response.data };
    } catch (error: any) {
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
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

// Payment Services
export const paymentService = {
  createOrderAndPayment: async (paymentData: any): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post('/payments/order', paymentData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

export default apiClient;
