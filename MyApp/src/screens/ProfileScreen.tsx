import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../components/Header';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { RootState } from '../store';
import { setProfile } from '../store/slices/authSlice';
import { userService } from '../services/api';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const profile = useSelector((state: RootState) => state.auth.profile);

  useEffect(() => {
    const fetchLatestProfile = async () => {
      if (!profile?.phone) return;
      const res = await userService.getProfileByPhone(profile.phone);
      if (!res.success || !res.data?.user) return;

      const serverProfile = {
        fullName: res.data.user.fullName,
        phone: res.data.user.phone,
        dob: res.data.user.dob,
        email: res.data.user.email || '',
      };
      dispatch(setProfile(serverProfile));
    };
    fetchLatestProfile();
  }, [dispatch, profile?.phone]);

  const displayProfile = profile ?? {
    fullName: 'Guest User',
    phone: '+92 3XX XXXXXXX',
    dob: 'DD/MM/YYYY',
    email: 'Optional',
  };

  const avatarLetter = displayProfile.fullName.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <Header showBack title="My Profile" backgroundColor="#FFFFFF" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </View>

        <Text style={styles.name}>{displayProfile.fullName}</Text>
        <Text style={styles.phone}>{displayProfile.phone}</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Full Name</Text>
          <Text style={styles.value}>{displayProfile.fullName}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Date of Birth</Text>
          <Text style={styles.value}>{displayProfile.dob}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Email (Optional)</Text>
          <Text style={styles.value}>{displayProfile.email || 'Optional'}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  name: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  phone: {
    marginTop: 4,
    marginBottom: SPACING.lg,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textPrimary,
  },
});

export default ProfileScreen;
