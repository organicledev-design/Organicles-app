import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  fullName: string;
  phone: string;
  dob: string;
  email?: string;
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
    logout: (state) => {
      state.profile = null;
      state.isLoggedIn = false;
    },
  },
});

export const { setProfile, logout } = authSlice.actions;
export default authSlice.reducer;
