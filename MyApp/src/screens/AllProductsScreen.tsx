import React, { useState, useEffect} from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { productService } from '../services/api';
import { Product } from '../types';

import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS } from '../constants/theme';

const CATEGORIES = [
  'All',
  'Breakfast',
  'Supplements',
  'Wellness',
  'Sweeteners',
  'Spices',
  'Oils',
  'Seeds',
  'Herbs',
  'Seasoning',
  'Beverages',
];

const AllProductsScreen = () => {
  const navigation = useNavigation<any>();
  const cartItems = useSelector((state: RootState) => state.cart.totalItems);
  const [selectedCategory, setSelectedCategory] = useState('All');
const [allProducts, setAllProducts] = useState<Product[]>([]);
const [loadingProducts, setLoadingProducts] = useState(true);
const [productError, setProductError] = useState<string | null>(null);
const loadProducts = async () => {
  setLoadingProducts(true);
  setProductError(null);

  try {
    const res = await productService.getAll();
    if (!res.success || !res.data) {
      setProductError(res.error || 'Failed to load products.');
      return;
    }

    const rows = Array.isArray(res.data)
      ? res.data
      : ((res.data as unknown as { products?: Product[] }).products || []);
    setAllProducts(rows);
  } catch (error: any) {
    setProductError(error?.message || 'Something went wrong while loading products.');
  } finally {
    setLoadingProducts(false);
  }
};


  // Group products by category
  const getGroupedProducts = () => {
    if (selectedCategory === 'All') {
      // Group all products by their category
      const grouped: { [key: string]: typeof allProducts } = {};
      allProducts.forEach(product => {
        if (!grouped[product.category]) {
          grouped[product.category] = [];
        }
        grouped[product.category].push(product);
      });
      return grouped;
    } else {
      // Filter by selected category
      return {
        [selectedCategory]: allProducts.filter(p => 
          p.category.toLowerCase() === selectedCategory.toLowerCase()
        )
      };
    }
  };

  const groupedProducts = getGroupedProducts();

  const navigateToProduct = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const navigateToCart = () => {
    navigation.navigate('Cart');
  };
  useEffect(() => {
  loadProducts();
}, []);


  return (
    <View style={styles.container}>
      <Header
        showBack
        showCart
        cartItemCount={cartItems}
        onBack={() => navigation.goBack()}
        onCartPress={navigateToCart}
      />

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {CATEGORIES.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products by Category */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loadingProducts ? (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.statusText}>Loading products...</Text>
          </View>
        ) : productError ? (
          <View style={styles.statusContainer}>
            <Text style={styles.errorText}>{productError}</Text>
            <TouchableOpacity onPress={loadProducts}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          Object.entries(groupedProducts).map(([category, products]) => (
            products.length > 0 && (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category}</Text>
                <View style={styles.productGrid}>
                  {products.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onPress={() => navigateToProduct(product.id)}
                    />
                  ))}
                </View>
              </View>
            )
          ))
        )}
        
        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  statusContainer: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: SPACING.lg,
  gap: SPACING.sm,
},
statusText: {
  fontSize: FONT_SIZES.sm,
  color: COLORS.textSecondary,
},
errorText: {
  fontSize: FONT_SIZES.sm,
  color: COLORS.error,
  textAlign: 'center',
  paddingHorizontal: SPACING.md,
},
retryText: {
  fontSize: FONT_SIZES.sm,
  fontWeight: FONT_WEIGHTS.semibold,
  color: COLORS.primary,
},

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  categoryContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryList: {
    paddingHorizontal: SPACING.md,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: SPACING.sm,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  categorySection: {
    paddingVertical: SPACING.md,
  },
  categoryTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  footer: {
    height: SPACING.xl,
  },
});

export default AllProductsScreen;
