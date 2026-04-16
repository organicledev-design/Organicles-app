import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDispatch } from 'react-redux';
import { setProfile } from '../store/slices/authSlice';
import { userService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

// Configure Google Sign-In (call once at app start or here)
GoogleSignin.configure({
  webClientId: '589213988240-umairpi0tkocddfh3m9fpc9iu12tkpe1.apps.googleusercontent.com', // 🔴 Replace this
});

type Props = NativeStackScreenProps<RootStackParamList, 'PhoneLogin'>;

const PhoneLoginScreen = ({ navigation }: Props) => {
  const dispatch = useDispatch();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [fakeOtp, setFakeOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const normalizedPhone = `+92${phoneNumber.trim()}`;

  // ─── Google Sign In ───────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        Alert.alert('Error', 'Failed to get Google token');
        return;
      }

      // Send token to your backend
      const res = await userService.googleAuth(idToken);

      if (!res.success) {
        Alert.alert('Error', res.error || 'Google login failed');
        return;
      }

      const user = (res.data as any)?.user;

      dispatch(
        setProfile({
          fullName: user.fullName || '',
          phone: user.phone || '',
          dob: user.dob || '',
          email: user.email || '',
          city: '',
          address: '',
          avatar: user.avatar || '',
        })
      );

      await AsyncStorage.setItem('auth_google_id', user.googleId);
      navigation.replace('Home');
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled - do nothing
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Info', 'Sign in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available');
      } else {
        Alert.alert('Error', error.message || 'Google login failed');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ─── Phone OTP Flow ───────────────────────────────────────────────────────
  const sendFakeOtp = () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    const generatedOtp = String(Math.floor(1000 + Math.random() * 9000));
    setFakeOtp(generatedOtp);
    setStep('otp');

    Alert.alert(
      'Demo OTP',
      `Your OTP is ${generatedOtp}\n\n(This is temporary fake OTP until real SMS is integrated.)`
    );
  };

  const verifyFakeOtp = async () => {
    if (otp.length !== 4) {
      Alert.alert('Error', 'Please enter 4-digit OTP');
      return;
    }
    if (otp !== fakeOtp) {
      Alert.alert('Invalid OTP', 'Incorrect code. Please try again.');
      return;
    }

    try {
      setLoading(true);

      const res = await userService.getProfileByPhone(normalizedPhone);

      if (res.success && res.data) {
        const profile = (res.data as any).user || (res.data as any).profile || res.data;

        dispatch(
          setProfile({
            fullName: profile.fullName || '',
            phone: profile.phone || normalizedPhone,
            dob: profile.dob || '',
            email: profile.email || '',
            city: profile.city || '',
            address: profile.address || '',
          })
        );

        await AsyncStorage.setItem('auth_phone', normalizedPhone);
        navigation.replace('Home');
        return;
      }

      setStep('profile');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to check profile');
    } finally {
      setLoading(false);
    }
  };

  const completeProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!dobDate) {
      Alert.alert('Error', 'Please enter date of birth');
      return;
    }

    const profilePayload = {
      fullName: fullName.trim(),
      phone: normalizedPhone,
      dob: dob.trim(),
      email: email.trim(),
      city: '',
      address: '',
    };

    try {
      setLoading(true);
      const res = await userService.upsertProfile(profilePayload);
      if (!res.success) {
        Alert.alert('Error', res.error || 'Failed to save profile');
        return;
      }

      const saved = (res.data as any)?.profile || profilePayload;
      dispatch(setProfile(saved));
      await AsyncStorage.setItem('auth_phone', normalizedPhone);
      navigation.replace('Home');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (step === 'phone') sendFakeOtp();
    else if (step === 'otp') await verifyFakeOtp();
    else await completeProfile();
  };

  const handleResendOtp = () => {
    setOtp('');
    sendFakeOtp();
  };

  const handleBack = () => {
    if (step === 'profile') { setStep('otp'); return; }
    if (step === 'otp') { setStep('phone'); setOtp(''); return; }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>
          {step === 'phone' ? 'Login with Phone' : step === 'otp' ? 'Verify OTP' : 'Complete Profile'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'phone'
            ? 'Enter your phone number to receive a verification code'
            : step === 'otp'
            ? `Enter the 4-digit code sent to +92 ${phoneNumber}`
            : 'Enter your details to continue'}
        </Text>

        {step === 'phone' ? (
          <View style={styles.inputContainer}>
            <Text style={styles.countryCode}>+92</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#999999"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={10}
            />
          </View>
        ) : step === 'otp' ? (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.otpInput}
              placeholder="Enter 4-digit OTP"
              placeholderTextColor="#999999"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={4}
            />
          </View>
        ) : (
          <>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                placeholderTextColor="#999999"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowDobPicker(true)}
            >
              <Text style={[styles.input, !dobDate && { color: '#999999' }]}>
                {dob || 'Date of Birth (DD/MM/YYYY) *'}
              </Text>
            </TouchableOpacity>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email (Optional)"
                placeholderTextColor="#999999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.continueButton, loading && { opacity: 0.7 }]}
          onPress={handleContinue}
          disabled={loading}
        >
          <Text style={styles.continueButtonText}>
            {loading
              ? 'Please wait...'
              : step === 'phone'
              ? 'Continue'
              : step === 'otp'
              ? 'Verify OTP'
              : 'Complete & Login'}
          </Text>
        </TouchableOpacity>

        {step === 'otp' && (
          <TouchableOpacity onPress={handleResendOtp}>
            <Text style={styles.resendText}>Resend OTP</Text>
          </TouchableOpacity>
        )}

        {/* ── Google Login Button (only on phone step) ── */}
        {step === 'phone' && (
          <>
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.googleButton, googleLoading && { opacity: 0.7 }]}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
            >
              <Image
                source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>
                {googleLoading ? 'Signing in...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.disclaimer}>
          {step === 'otp'
            ? 'Temporary demo verification is enabled. Replace this with real OTP API later.'
            : 'We will send you a verification code via SMS. Standard message rates may apply.'}
        </Text>
      </View>

      {showDobPicker && (
        <DateTimePicker
          value={dobDate || new Date(2000, 0, 1)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(_, selectedDate) => {
            setShowDobPicker(false);
            if (!selectedDate) return;
            setDobDate(selectedDate);
            const dd = String(selectedDate.getDate()).padStart(2, '0');
            const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const yyyy = selectedDate.getFullYear();
            setDob(`${dd}/${mm}/${yyyy}`);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: { marginBottom: 20 },
  backButtonText: { fontSize: 16, color: '#2E7D32', fontWeight: '500' },
  content: { flex: 1, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 24,
  },
  countryCode: { fontSize: 18, color: '#333333', marginRight: 12 },
  input: { flex: 1, fontSize: 18, paddingVertical: 16, color: '#333333' },
  otpInput: {
    flex: 1,
    fontSize: 22,
    letterSpacing: 6,
    textAlign: 'center',
    paddingVertical: 16,
    color: '#333333',
  },
  continueButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  continueButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  resendText: { fontSize: 14, color: '#2E7D32', fontWeight: '600', marginBottom: 12 },
  disclaimer: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 16,
    marginTop: 16,
  },
  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: '#999999' },
  // Google Button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DADCE0',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
  },
  googleIcon: { width: 20, height: 20, marginRight: 12 },
  googleButtonText: { fontSize: 15, color: '#3C4043', fontWeight: '500' },
});

export default PhoneLoginScreen;
