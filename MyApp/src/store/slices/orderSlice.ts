import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Order, PaymentInfo } from '../../types';

interface OrderState {
  currentOrder: Order | null;
  orderHistory: Order[];
  paymentInfo: PaymentInfo | null;
}

const initialState: OrderState = {
  currentOrder: null,
  orderHistory: [],
  paymentInfo: null,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setPaymentInfo: (state, action: PayloadAction<PaymentInfo>) => {
      state.paymentInfo = action.payload;
    },
    
    createOrder: (state, action: PayloadAction<Order>) => {
      state.currentOrder = action.payload;
      state.orderHistory.push(action.payload);
    },
    
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
      state.paymentInfo = null;
    },
    
    updateOrderStatus: (state, action: PayloadAction<{ orderId: string; status: string }>) => {
      const { orderId, status } = action.payload;
      const order = state.orderHistory.find(o => o.id === orderId);
      
      if (order) {
        order.status = status as any;
      }
      
      if (state.currentOrder?.id === orderId) {
        state.currentOrder.status = status as any;
      }
    },
  },
});

export const {
  setPaymentInfo,
  createOrder,
  clearCurrentOrder,
  updateOrderStatus,
} = orderSlice.actions;

export default orderSlice.reducer;
