import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  fullName: string;
  phone: string;
  dob: string;
  email?: string;
  city?: string;
  address?: string;
}

interface AuthState {
  isLoggedIn: boolean;
  profile: UserProfile | null;
}

const initialState: AuthState = {
  isLoggedIn: false,
  profile: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      state.isLoggedIn = true;
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (!state.profile) return;
      state.profile = { ...state.profile, ...action.payload };
    },
    logout: (state) => {
      state.profile = null;
      state.isLoggedIn = false;
    },
  },
});

export const { setProfile, logout,updateProfile } = authSlice.actions;
export default authSlice.reducer;
