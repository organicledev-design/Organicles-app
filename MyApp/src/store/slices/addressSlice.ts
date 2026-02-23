import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Address } from '../../types';

interface AddressState {
  addresses: Address[];
  selectedAddress: Address | null;
}

const initialState: AddressState = {
  addresses: [
    // Sample saved address for demo
    {
      id: '1',
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+92 300 1234567',
      addressLine1: 'House 123, Street 45',
      addressLine2: 'F-7 Markaz',
      city: 'Islamabad',
      state: 'Islamabad Capital Territory',
      zipCode: '44000',
      isDefault: true,
    },
  ],
  selectedAddress: null,
};

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    addAddress: (state, action: PayloadAction<Address>) => {
      const newAddress = action.payload;
      
      // If this is set as default, unset all others
      if (newAddress.isDefault) {
        state.addresses.forEach(addr => {
          addr.isDefault = false;
        });
      }
      
      state.addresses.push(newAddress);
    },
    
    updateAddress: (state, action: PayloadAction<Address>) => {
      const updatedAddress = action.payload;
      const index = state.addresses.findIndex(addr => addr.id === updatedAddress.id);
      
      if (index !== -1) {
        // If this is set as default, unset all others
        if (updatedAddress.isDefault) {
          state.addresses.forEach(addr => {
            addr.isDefault = false;
          });
        }
        
        state.addresses[index] = updatedAddress;
      }
    },
    
    deleteAddress: (state, action: PayloadAction<string>) => {
      state.addresses = state.addresses.filter(addr => addr.id !== action.payload);
      
      // If deleted address was selected, clear selection
      if (state.selectedAddress?.id === action.payload) {
        state.selectedAddress = null;
      }
    },
    
    selectAddress: (state, action: PayloadAction<Address>) => {
      state.selectedAddress = action.payload;
    },
    
    clearSelectedAddress: (state) => {
      state.selectedAddress = null;
    },
  },
});

export const {
  addAddress,
  updateAddress,
  deleteAddress,
  selectAddress,
  clearSelectedAddress,
} = addressSlice.actions;

export default addressSlice.reducer;
