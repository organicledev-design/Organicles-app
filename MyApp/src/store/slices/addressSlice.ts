import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Address } from '../../types';

interface AddressState {
  addresses: Address[];
  selectedAddress: Address | null;
}

const initialState: AddressState = {
  addresses: [],
  selectedAddress: null,
};

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    hydrateAddresses: (
      state,
      action: PayloadAction<{ addresses: Address[]; selectedAddressId: string | null }>
    ) => {
      state.addresses = action.payload.addresses || [];
      state.selectedAddress =
        state.addresses.find((a) => a.id === action.payload.selectedAddressId) || null;
    },
    addAddress: (state, action: PayloadAction<Address>) => {
  const newAddress = action.payload;
  if (newAddress.isDefault) {
    state.addresses.forEach((addr) => {
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
  hydrateAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  selectAddress,
  clearSelectedAddress,
} = addressSlice.actions;

export default addressSlice.reducer;
