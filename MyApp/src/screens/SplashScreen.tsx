import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, StatusBar } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setProfile } from '../store/slices/authSlice';
import { userService } from '../services/api';

const SplashScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();

  useEffect(() => {
  const bootstrap = async () => {
    try {
      const savedPhone = await AsyncStorage.getItem('auth_phone');

      if (savedPhone) {
        const res = await userService.getProfileByPhone(savedPhone);

        if (res.success && res.data) {
          const p: any = (res.data as any).user || (res.data as any).profile || res.data;

          dispatch(
            setProfile({
              fullName: p.fullName || '',
              phone: p.phone || savedPhone,
              dob: p.dob || '',
              email: p.email || '',
            })
          );

          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            })
          );
          return;
        }
      }

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        })
      );
    } catch {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        })
      );
    }
  };

  bootstrap();
}, [navigation, dispatch]);

 useEffect(() => {
  const bootstrap = async () => {
    try {
      const savedPhone = await AsyncStorage.getItem('auth_phone');

      if (savedPhone) {
        const res = await userService.getProfileByPhone(savedPhone);

        if (res.success && res.data) {
          const p: any = (res.data as any).user || (res.data as any).profile || res.data;

          dispatch(
            setProfile({
              fullName: p.fullName || '',
              phone: p.phone || savedPhone,
              dob: p.dob || '',
              email: p.email || '',
            })
          );

          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            })
          );
          return;
        }
      }

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        })
      );
    } catch {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        })
      );
    }
  };

  bootstrap();
}, [navigation, dispatch]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.logoContainer}>
        <Image
          source={require('../images/new logo green.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>Back to Nature</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 200,
    height: 80,
  },
  tagline: {
    fontSize: 16,
    color: '#666666',
    marginTop: 8,
    letterSpacing: 4,
  },
});

export default SplashScreen;
