import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { RootStackParamList, Product } from '../types';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import Header from '../components/Header';

type BundleRouteProp = RouteProp<RootStackParamList, 'BundleDetail'>;

const BUNDLE_MAP: Record<string, { title: string; image: string; product: Product }> = {
  'bundle-1': {
    title: "Men's Vitality Bundle",
    image: 'https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614980/1771227370797-Bundle01updated_313a7587-1b96-4c3d-889a-f3231a5bc4f9_1170x_u04v5l.webp',
    product: {
      id: 'bundle-1',
      name: "Men's Vitality Bundle",
      description: 'Complete vitality combo.',
      price: 3500,
      images: ['https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614980/1771227370797-Bundle01updated_313a7587-1b96-4c3d-889a-f3231a5bc4f9_1170x_u04v5l.webp'],
      category: 'Bundles',
      featured: true,
      bestSeller: true,
      stock: 50,
      tags: ['bundle'],
    },
  },
  'bundle-2': {
    title: 'Family Wellness Bundle',
    image: 'https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614980/1771227370821-Bundle05updated_1170x_dyztvj.webp',
    product: {
      id: 'bundle-2',
      name: 'Family Wellness Bundle',
      description: 'Family wellness combo.',
      price: 4900,
      images: ['https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614980/1771227370821-Bundle05updated_1170x_dyztvj.webp'],
      category: 'Bundles',
      featured: true,
      bestSeller: true,
      stock: 50,
      tags: ['bundle'],
    },
  },
  'bundle-3': {
    title: 'All in One Bundle',
    image: 'https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614980/1771227370841-Bundle06updated_1170x_w3ngju.webp',
    product: {
      id: 'bundle-3',
      name: 'All in One Bundle',
      description: 'All-in-one value combo.',
      price: 5900,
      images: ['https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614980/1771227370841-Bundle06updated_1170x_w3ngju.webp'],
      category: 'Bundles',
      featured: true,
      bestSeller: true,
      stock: 50,
      tags: ['bundle'],
    },
  },
};

const BundleDetail = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<BundleRouteProp>();
  const dispatch = useDispatch();

  const bundle = BUNDLE_MAP[route.params.bundleId];

  if (!bundle) {
    return (
      <View style={styles.center}>
        <Text>Bundle not found</Text>
      </View>
    );
  }

  const addBundleToCart = () => {
    dispatch(addToCart({ product: bundle.product, quantity: 1 }));
    navigation.navigate('Cart');
  };

  return (
    <View style={styles.container}>
      <Header
        showBack
        title="Bundle Details"
        backgroundColor="#FFFFFF"
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: bundle.image }} style={styles.image} resizeMode="contain" />
        <View style={styles.content}>
          <Text style={styles.title}>{bundle.product.name}</Text>
          <Text style={styles.price}>Rs {bundle.product.price}/-</Text>
          <Text style={styles.desc}>{bundle.product.description}</Text>

          <TouchableOpacity style={styles.button} onPress={addBundleToCart}>
            <Text style={styles.buttonText}>ADD TO CART</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  image: { width: '100%', height: 280, backgroundColor: '#FFFFFF' },
  content: { padding: SPACING.md },
  title: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  price: { marginTop: 8, fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  desc: { marginTop: 8, fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  button: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: COLORS.white, fontWeight: FONT_WEIGHTS.bold },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default BundleDetail;
