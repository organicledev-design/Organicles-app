import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Modal, Pressable
} from 'react-native';
import Config from 'react-native-config';

import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { heroBannerService,productService, reviewService, partnerService } from '../services/api';
import { Product, Review, Partner } from '../types';
const { width } = Dimensions.get('window');


const API_BASE = Config.API_BASE_URL || '';
const ASSET_BASE = API_BASE.replace(/\/api\/?$/, '');

const HERO_SLIDES = [
  'https://picsum.photos/seed/organic-1/1290/1000',
  'https://picsum.photos/seed/organic-2/1290/1000',
  'https://picsum.photos/seed/organic-3/1290/1000',
  'https://picsum.photos/seed/organic-4/1290/1000',
];

const BUNDLES = [
  {
    id: 'bundle-1',
    title: "Men's Vitality Bundle",
image: '/uploads/1771227370797-Bundle01updated_313a7587-1b96-4c3d-889a-f3231a5bc4f9_1170x.webp',
    bundleId: 'bundle-1',
  },
  {
    id: 'bundle-2',
    title: 'Family Wellness Bundle',
image: '/uploads/1771227370821-Bundle05updated_1170x.webp',
    bundleId: 'bundle-2',
  },
  {
    id: 'bundle-3',
    title: 'All in One Bundle',
image: '/uploads/1771227370841-Bundle06updated_1170x.webp',
    bundleId: 'bundle-3',
  },
];



const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const cartItems = useSelector((state: RootState) => state.cart.totalItems);
  const profile = useSelector((state: RootState) => state.auth.profile);
  const heroScrollRef = useRef<ScrollView>(null);
const [heroIndex, setHeroIndex] = useState(0);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnersError, setPartnersError] = useState<string | null>(null);
  const partnerScrollX = useRef(new Animated.Value(0)).current;
  const [menuOpen, setMenuOpen] = useState(false);
const sidebarX = useRef(new Animated.Value(-280)).current;

const bestSellerProducts = products
  .filter((p) => p.bestSeller)
  .sort((a: any, b: any) => {
    const ao = a.bestSellerOrder ?? 9999;
    const bo = b.bestSellerOrder ?? 9999;
    return ao - bo;
  });
const [heroSlides, setHeroSlides] = useState<string[]>([]);

// Use heroSlides from state (loaded from API), fallback to HERO_SLIDES if empty
const displaySlides = heroSlides.length > 0 ? heroSlides : HERO_SLIDES;


  const loadHeroBanners = async () => {
  try {
    const res = await heroBannerService.getAll();

    if (!res.success || !res.data) {
      setHeroSlides([]);
      return;
    }

    const banners = Array.isArray(res.data)
      ? res.data
      : (res.data as any).data || [];

    console.log('hero response:', res);
console.log('hero slides:', banners.map((b: any) => b.imageUrl));
setHeroSlides(banners.map((b: any) => b.imageUrl).filter(Boolean));


  } catch (error) {
    setHeroSlides([]);
  }
};


  const loadProducts = async () => {
    setLoadingProducts(true);
    setProductError(null);

    try {
      const res = await productService.getAll();
      if (!res.success || !res.data) {
        setProductError(res.error || 'Failed to load products.');
        return;
      }
      const parsedProducts = Array.isArray(res.data)
        ? res.data
        : ((res.data as unknown as { products?: Product[] }).products || []);
      setProducts(parsedProducts);
    } catch (error: any) {
      setProductError(error?.message || 'Something went wrong while loading products.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadReviews = async () => {
    setReviewsError(null);
    try {
      const res = await reviewService.getAll();
      if (!res.success || !res.data) {
        setReviewsError(res.error || 'Failed to load reviews.');
        return;
      }
      const parsedReviews = Array.isArray(res.data)
        ? res.data
        : ((res.data as unknown as { reviews?: Review[] }).reviews || []);
      setReviews(parsedReviews);
    } catch (error: any) {
      setReviewsError(error?.message || 'Something went wrong while loading reviews.');
    }
  };

  const loadPartners = async () => {
    setPartnersError(null);
    try {
      const res = await partnerService.getAll();
      if (!res.success || !res.data) {
        setPartnersError(res.error || 'Failed to load partners.');
        return;
      }
      const parsedPartners = Array.isArray(res.data)
        ? res.data
        : ((res.data as unknown as { partners?: Partner[] }).partners || []);
      setPartners(parsedPartners);
    } catch (error: any) {
      setPartnersError(error?.message || 'Something went wrong while loading partners.');
    }
  };
  const toFullUri = (value?: string) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/')) return `${ASSET_BASE}${value}`;
  return `${ASSET_BASE}/${value}`;
};

  useEffect(() => {
    loadProducts();
    loadReviews();
    loadPartners();
    loadHeroBanners();

  }, []);

  // Auto-scroll partners marquee
  useEffect(() => {
    if (!partners.length) {
      return;
    }
    const partnersWidth = partners.length * 130;
    const loop = 
      Animated.loop(
        Animated.timing(partnerScrollX, {
          toValue: -partnersWidth,
          duration: 15000,
          useNativeDriver: true,
        })
      
    );
    loop.start();

   return () => loop.stop();
  }, [partners, partnerScrollX]);
      
    
  useEffect(() => {
  if (heroSlides.length <= 1) return;

  const interval = setInterval(() => {
    setHeroIndex((prev) => {
      const next = (prev + 1) % heroSlides.length;
      heroScrollRef.current?.scrollTo({ x: next * width, animated: true });
      return next;
    });
  }, 3000);

  return () => clearInterval(interval);
}, [heroSlides.length, width]);


  const navigateToProduct = (productId: string) => {
  navigation.navigate('ProductDetail', { productId });
};

  const navigateToCart = () => {
    navigation.navigate('Cart');
  };

  const navigateToAllProducts = () => {
    navigation.navigate('AllProducts');
  };
  const openMenu = () => {
  setMenuOpen(true);
  Animated.timing(sidebarX, {
    toValue: 0,
    duration: 220,
    useNativeDriver: true,
  }).start();
};

const closeMenu = () => {
  Animated.timing(sidebarX, {
    toValue: -280,
    duration: 180,
    useNativeDriver: true,
  }).start(() => setMenuOpen(false));
};

const goToProfile = () => {
  closeMenu();
  setTimeout(() => navigation.navigate('Profile'), 180);
};

  const handleBundleShopNow = (bundleId: string) => {
    navigation.navigate('BundleDetail', { bundleId });
  };


    return (
  // CHANGED: outer wrapper must be `container`, not `heroSection`
  <View style={styles.container}>
    <Header
      showCart
      cartItemCount={cartItems}
      onCartPress={navigateToCart}
      onAllProductsPress={navigateToAllProducts}
      backgroundColor="#FFFFFF"
        logoSource={require('../images/new logo green.png')}
        showMenu

onMenuPress={openMenu}
/>

<Modal visible={menuOpen} transparent animationType="none" onRequestClose={closeMenu}>
  <View style={styles.drawerRoot}>
    <Pressable style={styles.drawerOverlay} onPress={closeMenu} />

    <Animated.View style={[styles.drawerPanel, { transform: [{ translateX: sidebarX }] }]}>
      <View style={styles.drawerHeader}>
        <View style={styles.drawerAvatar}>
          <Text style={styles.drawerAvatarText}>
            {(profile?.fullName?.charAt(0) || 'U').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.drawerName}>{profile?.fullName || 'User Name'}</Text>
        <Text style={styles.drawerPhone}>{profile?.phone || '+92 3XX XXXXXXX'}</Text>
      </View>

      <TouchableOpacity style={styles.drawerItem} onPress={goToProfile}>
        <Text style={styles.drawerItemText}>Profile</Text>
      </TouchableOpacity>
    </Animated.View>
  </View>
</Modal>


    {/* CHANGED: this is the main vertical page scroll */}
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* CHANGED: heroSection wraps only hero carousel area */}
      <View style={styles.heroSection}>
        <ScrollView
        contentContainerStyle={{ paddingHorizontal: 0 }}

          ref={heroScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled
          onMomentumScrollEnd={(e) => {
            const next = Math.round(e.nativeEvent.contentOffset.x / width);
            setHeroIndex(next);
          }}
          style={styles.heroCarousel}
        >
            {/* CHANGED: wrap each image in a frame so image can be smaller inside full-width page */}
            {displaySlides.map((uri, index) => (
  <View key={`${uri}-${index}`} style={styles.heroSlideFrame}>
    <Image
      source={{ uri  }}
      style={styles.heroSlideImage}
      resizeMode="cover" // CHANGED: show full image without aggressive crop
    />
  </View>
))}

        </ScrollView>

        <View style={styles.heroOverlay}>
          <Image
            // source={require('../images/new logo green.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>



       {/* All Products Preview */}
<View style={styles.section}>
  <View style={styles.sectionHeaderRow}>
    <View>
      <Text style={styles.sectionTitle}>All Products</Text>
      <Text style={styles.sectionSubtitle}>
        Browse our complete collection
      </Text>
    </View>

    <Text
      style={styles.allButton}
      onPress={navigateToAllProducts}
    >
      All →
    </Text>
  </View>

  {loadingProducts ? (
    <View style={styles.productsStatusContainer}>
      <ActivityIndicator size="small" color={COLORS.primary} />
      <Text style={styles.statusText}>Loading products...</Text>
    </View>
  ) : productError ? (
    <View style={styles.productsStatusContainer}>
      <Text style={styles.statusErrorText}>{productError}</Text>
      <TouchableOpacity onPress={loadProducts}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  ) : bestSellerProducts.length === 0
 ? (
    <View style={styles.productsStatusContainer}>
      <Text style={styles.statusText}>No products found.</Text>
    </View>
  ) : (
    <View style={styles.productGrid}>
      {bestSellerProducts.slice(0, 4).map(product => (
        <ProductCard
          key={product.id}
          product={product}
onPress={() => navigateToProduct(product.id)}
          />
      ))}
    </View>
  )}

  {/* bundles */}
</View>
<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>Save Big With Bundles</Text>
  </View>

  <View style={styles.bundleGrid}>
    {BUNDLES.map((bundle) => (
      <View key={bundle.id} style={styles.bundleCard}>
<Image source={{ uri:  toFullUri(bundle.image)}} style={styles.bundleImage} resizeMode="contain" />
        <Text style={styles.bundleImage}>{bundle.title}</Text>
        <TouchableOpacity style={styles.bundleButton} onPress={() => navigation.navigate('BundleDetail', { bundleId: bundle.bundleId })}
>
          <Text style={styles.bundleButtonText}>SHOP NOW</Text>
        </TouchableOpacity>
      </View>
    ))}
  </View>
</View>



        

        {/* Partner Logos Marquee */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trusted Partners</Text>
          <Text style={styles.sectionSubtitle}>
            Certified and working with leading organizations
          </Text>
          
          <View style={styles.marqueeContainer}>
            <Animated.View
              style={[
                styles.marqueeContent,
                {
                  transform: [{ translateX: partnerScrollX }],
                },
              ]}>
              {partnersError ? (
                <View style={styles.productsStatusContainer}>
                  <Text style={styles.statusErrorText}>{partnersError}</Text>
                </View>
              ) : [...partners, ...partners].map((partner, index) => (
                <View key={`${partner.id}-${index}`} style={styles.partnerCard}>
                  <Image
                    source={{ uri: partner.logo }}
                    style={styles.partnerLogo}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </Animated.View>
          </View>
        </View>

        {/* Footer Spacing */}
        <View style={styles.footer} />
      </ScrollView>
    </View>
    
  );
};

const styles = StyleSheet.create({


  bundleGrid: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  paddingHorizontal: SPACING.md,
  gap: SPACING.sm,
},
bundleCard: {
  flex: 1,
  backgroundColor: COLORS.surface,
  borderRadius: BORDER_RADIUS.lg,
  padding: SPACING.sm,
  alignItems: 'center',
},
bundleImage: {
  width: '100%',
  height: 140,
  marginBottom: SPACING.sm,
},
bundleTitle: {
  fontSize: FONT_SIZES.md,
  fontWeight: FONT_WEIGHTS.semibold,
  color: COLORS.textPrimary,
  marginBottom: SPACING.sm,
  textAlign: 'center',
},
bundleButton: {
  backgroundColor: COLORS.primary,
  paddingVertical: 10,
  width: '100%',
  borderRadius: 8,
  alignItems: 'center',
},
bundleButtonText: {
  color: COLORS.white,
  fontWeight: FONT_WEIGHTS.bold,
  fontSize: FONT_SIZES.sm,
},


  
heroCarousel: {
width: '100%',
height: '100%',
},
heroSlide: {
  width,
  height: '100%',
  paddingHorizontal: 32, // makes visual image smaller
  paddingVertical: 24,
},
heroOverlay: {
  ...StyleSheet.absoluteFillObject,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255,255,255,0.35)',
},
// CHANGED: each slide still uses full page width (for paging), but image is inset
heroSlideFrame: {
  width: width * 0.99,
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
},

// CHANGED: actual image fills frame area
heroSlideImage: {
  width: '99%',
  height: '100%',
},


logoImage: {
  width: 100,
  height: 50,
},

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    width: '100%',
  aspectRatio: 1252 / 650,
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: '#f4f1ea',
  padding: 0,          // important
  margin: 0,
  },
  
  
  logoContainer: {
    alignItems: 'center',
  },
  
  tagline: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  section: {
    paddingVertical: SPACING.lg,
  },
  sectionHeader: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.md,
  },
  horizontalList: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  productsStatusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statusErrorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    textAlign: 'center',
  },
  retryText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  reviewCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  star: {
    color: COLORS.accentGold,
    fontSize: FONT_SIZES.md,
  },
  reviewComment: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.xs,
  },
  reviewDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },
  marqueeContainer: {
    height: 80,
    marginTop: SPACING.md,
    overflow: 'hidden',
  },
  marqueeContent: {
    flexDirection: 'row',
    paddingLeft: SPACING.md,
  },
  partnerCard: {
    width: 120,
    height: 70,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
  },
  partnerLogo: {
    width: '100%',
    height: '100%',
  },
  footer: {
    height: SPACING.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  allButton: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  drawerRoot: {
  flex: 1,
  flexDirection: 'row',
},
drawerOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.35)',
},
drawerPanel: {
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: 280,
  backgroundColor: '#fff',
  paddingTop: 56,
  paddingHorizontal: 16,
},
drawerHeader: {
  marginBottom: 20,
},
drawerAvatar: {
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: COLORS.primary,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 8,
},
drawerAvatarText: {
  color: '#fff',
  fontWeight: '700',
  fontSize: 22,
},
drawerName: {
  fontSize: 18,
  fontWeight: '700',
  color: COLORS.textPrimary,
},
drawerPhone: {
  marginTop: 4,
  color: COLORS.textSecondary,
},
drawerItem: {
  paddingVertical: 14,
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
},
drawerItemText: {
  fontSize: 16,
  color: COLORS.textPrimary,
  fontWeight: '600',
},


});

export default HomeScreen;
