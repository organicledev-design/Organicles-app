// Core Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: Array<string | number>;
  category: string;
  featured: boolean;
  bestSeller: boolean;
  stock: number;
  tags?: string[];
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
}

// Address Types
export interface Address {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

// Payment Types
export enum PaymentMethod {
  COD = 'COD',
ONLINE = 'ONLINE',}
export enum WalletProvider {
  JAZZCASH = 'JAZZCASH',
  EASYPaisa = 'EASYPaisa',
}

export interface PaymentInfo {
  method: PaymentMethod;
  transactionId?: string;
}

// Order Types
export interface Order {
  id: string;
  items: CartItem[];
  shippingAddress: Address;
  paymentInfo: PaymentInfo;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

// Review Types
export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  avatar?: string;
}

// Partner Types
export interface Partner {
  id: string;
  name: string;
  logo: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface UserProfile {
  fullName: string;
  phone: string;
  dob: string;
  email?: string;
}

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  PhoneLogin: undefined;
  Home: undefined;
  Profile: undefined;
  AllProducts: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Address: undefined;
  Payment: undefined;
  OrderSuccess: { orderId: string };
  BundleDetail: { bundleId: string };
  PaymentWebView: {        // ← ADDED
    checkoutUrl: string;
    orderId: string;
  };

};
