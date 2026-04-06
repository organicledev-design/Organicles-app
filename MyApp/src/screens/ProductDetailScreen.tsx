import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import Header from '../components/Header';
import Button from '../components/Button';
import apiClient, { productService } from '../services/api';
import { Product } from '../types';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { formatCurrency, toAbsoluteUrl } from '../utils/helpers';
import Config from 'react-native-config';

const { width } = Dimensions.get('window');
const API_BASE = (Config.API_BASE_URL || apiClient.defaults.baseURL || '').toString();
const ProductDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(0);

  const NASHTA_VARIANTS = [
    { label: '250gm', price: 2950 },
    { label: '500gm', price: 5350 },
  ];

  const isNashta = product?.name === 'Nashta';

  const toFullUri = (value?: string) => toAbsoluteUrl(value, API_BASE);
  const safeStringify = (value: any) => {
    try {
      const text = JSON.stringify(value, null, 2);
      if (text.length > 900) return `${text.slice(0, 900)}\n...trimmed`;
      return text;
    } catch {
      return '[unserializable]';
    }
  };
  const normalizeImages = (value: any): any[] => {
    if (Array.isArray(value)) {
      return value.map((img) => (typeof img === 'string' ? toFullUri(img) : img)).filter(Boolean);
    }
    if (typeof value === 'string') return [toFullUri(value)];
    return [];
  };
  useEffect(() => {
    console.error(`ProductDetail mounted\nparams=${safeStringify(route?.params)}`);
  }, []);
  useEffect(() => {
    const loadProduct = async () => {
      setLoadingProduct(true);
      setProductError(null);

      try {
        if (!productId) {
          setProductError('Missing product id.');
          console.error(`loadProduct: missing productId\nparams=${safeStringify(route?.params)}`);
          return;
        }
        if (!productService || typeof (productService as any).getById !== 'function') {
          setProductError('Product service unavailable.');
          console.error(
            `loadProduct: service missing\nproductService=${safeStringify(productService)}\ngetByIdType=${typeof (productService as any)?.getById}`
          );
          return;
        }
        const res = await productService.getById(productId);
        if (!res.success || !res.data) {
          setProductError(res.error || 'Failed to load product.');
          return;
        }

        const productData = (res.data as any).product || res.data;
        console.error(
          `loadProduct: success=true\n` +
            `id=${productId}\n` +
            `imagesType=${typeof productData?.images}\n` +
            `raw=${safeStringify(res.data)}`
        );
        const images = normalizeImages(productData?.images);
        setSelectedImage(0);
        setProduct({ ...productData, images });
      } catch (error: any) {
        setProductError(error?.message || 'Something went wrong while loading product.');
        console.error(
          `loadProduct: threw\nid=${productId}\nmessage=${error?.message || 'n/a'}\nerror=${safeStringify(error)}`
        );
      } finally {
        setLoadingProduct(false);
      }
    };

    loadProduct();
  }, [productId]);

  if (loadingProduct) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{productError || 'Product not found'}</Text>
      </View>
    );
  }

  const handleAddToCart = () => {
    const price = isNashta ? NASHTA_VARIANTS[selectedVariant].price : product.price;
const variantLabel = isNashta ? NASHTA_VARIANTS[selectedVariant].label : null;
    if (product.stock === 0) {
      Alert.alert('Out of Stock', 'This product is currently unavailable.');
      return;
    }

    if (quantity > product.stock) {
      Alert.alert('Limited Stock', `Only ${product.stock} items available.`);
      return;
    }

dispatch(addToCart({ product: { ...product, price }, quantity }));
    Alert.alert(
      'Added to Cart',
      `${quantity} x ${product.name} added to your cart.`,
      [
        { text: 'Continue Shopping', style: 'cancel' },
        {
          text: 'View Cart',
          onPress: () => navigation.navigate('Cart'),
        },
      ]
    );
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
    console.error('product data:', JSON.stringify({
  name: product.name,
  tagsType: typeof product.tags,
  tags: product.tags,
  imagesType: typeof product.images,
  images: product.images,
}));
  };

  return (
    <View style={styles.container}>
      <Header
        showBack
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageSection}>
          {product.images.length > 0 ? (
            <Image
              source={
                typeof product.images[selectedImage] === 'string'
                  ? { uri: product.images[selectedImage] }
                  : product.images[selectedImage]
              }
              style={styles.mainImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.mainImagePlaceholder}>
              <Text style={styles.mainImagePlaceholderText}>No Image</Text>
            </View>
          )}
          
          {product.bestSeller && (
            <View style={styles.bestSellerBadge}>
              <Text style={styles.bestSellerText}>⭐ Best Seller</Text>
            </View>
          )}
          
          {product.images.length > 1 && (
            <View style={styles.thumbnailContainer}>
              {product.images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImage(index)}
                  style={[
                    styles.thumbnail,
                    selectedImage === index && styles.selectedThumbnail,
                  ]}>
                  <Image
                    source={
                      typeof image === 'string'
                        ? { uri: image }
                        : image
                    }
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.productName}>{product.name}</Text>
          
          <View style={styles.priceContainer}>
  <Text style={styles.price}>
    {formatCurrency(isNashta ? NASHTA_VARIANTS[selectedVariant].price : product.price)}
  </Text>
</View>

{isNashta && (
  <View style={styles.variantSection}>
    <Text style={styles.sectionTitle}>Size</Text>
    <View style={styles.variantRow}>
      {NASHTA_VARIANTS.map((v, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.variantButton, selectedVariant === i && styles.variantButtonSelected]}
          onPress={() => setSelectedVariant(i)}
        >
          <Text style={[styles.variantText, selectedVariant === i && styles.variantTextSelected]}>
            {v.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
)}
          <View style={styles.stockContainer}>
            {product.stock > 0 ? (
              <Text style={[
                styles.stockText,
                product.stock < 10 && styles.lowStock
              ]}>
                {product.stock < 10 ? `Only ${product.stock} left in stock!` : 'In Stock'}
              </Text>
            ) : (
              <Text style={styles.outOfStock}>Out of Stock</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>



    

                </View>
      </ScrollView>

      <View style={styles.footer}>
  <View style={styles.footerRow}>
    <View style={styles.quantitySelector}>
      <TouchableOpacity style={styles.quantityButton} onPress={decrementQuantity} disabled={quantity <= 1}>
        <Text style={styles.quantityButtonText}>−</Text>
      </TouchableOpacity>
      <View style={styles.quantityDisplay}>
        <Text style={styles.quantityText}>{quantity}</Text>
      </View>
      <TouchableOpacity style={styles.quantityButton} onPress={incrementQuantity} disabled={quantity >= product.stock}>
        <Text style={styles.quantityButtonText}>+</Text>
      </TouchableOpacity>
    </View>

    <TouchableOpacity
      style={[styles.addToCartBtn, product.stock === 0 && styles.addToCartDisabled]}
      onPress={handleAddToCart}
      disabled={product.stock === 0}
    >
      <Text style={styles.addToCartText}>
        {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
      </Text>
    </TouchableOpacity>
  </View>
</View>
      
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.error,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  imageSection: {
    position: 'relative',
    alignItems: 'center',
  },
  mainImage: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: COLORS.secondaryLight,
  },
  mainImagePlaceholder: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: COLORS.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainImagePlaceholderText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  bestSellerBadge: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  bestSellerText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  thumbnailContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedThumbnail: {
    borderColor: COLORS.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    padding: SPACING.md,
  },
  productName: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  price: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  tag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  tagText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  stockContainer: {
    marginBottom: SPACING.md,
  },
  addToCartInline: {
  height: 44,
  backgroundColor: COLORS.primary,
  borderRadius: BORDER_RADIUS.md,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: SPACING.lg,  // controls width
},
addToCartDisabled: {
  backgroundColor: COLORS.border,
},
addToCartInlineText: {
  color: COLORS.white,
  fontWeight: FONT_WEIGHTS.bold,
  fontSize: FONT_SIZES.md,
},
  stockText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: FONT_WEIGHTS.medium,
  },
  lowStock: {
    color: COLORS.warning,
  },
  outOfStock: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  quantitySection: {
    marginBottom: SPACING.lg,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
      flexWrap: 'nowrap',  // ADD THIS

  },
  quantityButton: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  quantityDisplay: {
    minWidth: 60,
    height: 44,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quantityText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    ...SHADOWS.lg,
  },
  variantSection: {
  marginBottom: SPACING.md,
},
variantRow: {
  flexDirection: 'row',
  gap: SPACING.sm,
},
variantButton: {
  paddingHorizontal: SPACING.lg,
  paddingVertical: SPACING.sm,
  borderRadius: BORDER_RADIUS.md,
  borderWidth: 2,
  borderColor: COLORS.border,
},
variantButtonSelected: {
  borderColor: COLORS.primary,
  backgroundColor: COLORS.primaryLight,
},
variantText: {
  fontSize: FONT_SIZES.md,
  fontWeight: FONT_WEIGHTS.semibold,
  color: COLORS.textSecondary,
},
variantTextSelected: {
  color: COLORS.white,
},

footerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: SPACING.md,
},
addToCartBtn: {
  flex: 1,
  height: 44,
  backgroundColor: COLORS.primary,
  borderRadius: BORDER_RADIUS.md,
  alignItems: 'center',
  justifyContent: 'center',
},

addToCartText: {
  color: COLORS.white,
  fontWeight: FONT_WEIGHTS.bold,
  fontSize: FONT_SIZES.md,
},
});

export default ProductDetailScreen;
