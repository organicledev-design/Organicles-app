import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  Modal,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Config from 'react-native-config';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import apiClient, {
  heroBannerService,
  productService,
  partnerService,
} from '../services/api';
import { Product, Partner } from '../types';

const { width } = Dimensions.get('window');
const API_BASE = Config.API_BASE_URL
  ?? apiClient.defaults.baseURL
  ?? 'https://your-fallback-url.com';

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
    image: 'https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614980/1771227370797-Bundle01updated_313a7587-1b96-4c3d-889a-f3231a5bc4f9_1170x_u04v5l.webp',
    bundleId: 'bundle-1',
  },
  {
    id: 'bundle-2',
    title: 'Family Wellness Bundle',
    image: 'https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614980/1771227370821-Bundle05updated_1170x_dyztvj.webp',
    bundleId: 'bundle-2',
  },
  {
    id: 'bundle-3',
    title: 'All in One Bundle',
    image: 'https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614980/1771227370841-Bundle06updated_1170x_w3ngju.webp',
    bundleId: 'bundle-3',
  },
];

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const cartItems = useSelector((state: RootState) => state.cart.totalItems);
  const profile = useSelector((state: RootState) => state.auth.profile);

  // ── Hero ──────────────────────────────────────────────────────
  const heroScrollRef = useRef<ScrollView>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroSlides, setHeroSlides] = useState<string[]>([]);
  const displaySlides = heroSlides.length > 0 ? heroSlides : HERO_SLIDES;

  // ── Products ──────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  // ── Partners ──────────────────────────────────────────────────
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnersError, setPartnersError] = useState<string | null>(null);
  const partnerScrollX = useRef(new Animated.Value(0)).current;

  // ── Sidebar ───────────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);
  const sidebarX = useRef(new Animated.Value(-280)).current;

  // ── Category / scroll refs ────────────────────────────────────
  const mainScrollRef = useRef<ScrollView>(null);
  const categoryScrollRef = useRef<ScrollView>(null);
  const [activeCategory, setActiveCategory] = useState('Best Sellers');
  const [categoryBarSticky, setCategoryBarSticky] = useState(false);

  const sectionOffsets = useRef<{ [key: string]: number }>({});
  const categoryBarOffset = useRef(0);

  const toArray = <T,>(value: any, key?: string): T[] => {
    if (Array.isArray(value)) return value;
    if (key && Array.isArray(value?.[key])) return value[key];
    if (Array.isArray(value?.data)) return value.data;
    return [];
  };

  // ── Derived: grouped products ─────────────────────────────────
  const bestSellers = products
    .filter((p) => p.bestSeller)
    .sort((a: any, b: any) => (a.bestSellerOrder ?? 9999) - (b.bestSellerOrder ?? 9999));

  const categoryGroups: { title: string; data: Product[] }[] = [];

  if (bestSellers.length > 0) {
    categoryGroups.push({ title: 'Best Sellers', data: bestSellers });
  }

  const categoryMap: { [key: string]: Product[] } = {};
  products.forEach((p) => {
    if (!categoryMap[p.category]) categoryMap[p.category] = [];
    categoryMap[p.category].push(p);
  });
  Object.entries(categoryMap).forEach(([cat, items]) => {
    categoryGroups.push({ title: cat, data: items });
  });

  const categoryTitles = categoryGroups.map((g) => g.title);

  // ── Data loaders ──────────────────────────────────────────────
  const loadHeroBanners = async () => {
    try {
      const res = await heroBannerService.getAll();
      if (!res.success || !res.data) { setHeroSlides([]); return; }
      const banners = toArray<any>(res.data, 'banners');
      setHeroSlides(banners.map((b: any) => b.imageUrl).filter(Boolean));
    } catch {
      setHeroSlides([]);
    }
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    setProductError(null);
    if (!productService || typeof (productService as any).getAll !== 'function') {
      setProductError('Products service unavailable.');
      setLoadingProducts(false);
      return;
    }
    try {
      const res = await productService.getAll();
      if (!res.success || !res.data) {
        setProductError(res.error || 'Failed to load products.');
        return;
      }
      const rows = toArray<Product>(res.data, 'products');
      const normalized = rows.map((p: Product) => ({
        ...p,
        images: Array.isArray(p.images)
          ? p.images.map((img) => {
              if (typeof img !== 'string') return img;
              if (img.startsWith('http')) return img;
              const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
              return `${base}/${img.startsWith('/') ? img.slice(1) : img}`;
            })
          : p.images,
      }));
      setProducts(normalized);
    } catch (e: any) {
      setProductError(e?.message || 'Something went wrong.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadPartners = async () => {
    setPartnersError(null);
    try {
      const res = await partnerService.getAll();
      if (!res.success || !res.data) { setPartnersError(res.error || 'Failed to load partners.'); return; }
      const parsed = toArray<Partner>(res.data, 'partners');
      setPartners(parsed);
    } catch (e: any) {
      setPartnersError(e?.message || 'Something went wrong.');
      setPartners([]);
    }
  };

  useEffect(() => {
    loadHeroBanners();
    loadProducts();
    loadPartners();
  }, []);

  // ── Hero auto-scroll ──────────────────────────────────────────
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
  }, [heroSlides.length]);

  // ── Partner marquee ───────────────────────────────────────────
  useEffect(() => {
    if (!partners.length) return;
    const loop = Animated.loop(
      Animated.timing(partnerScrollX, {
        toValue: -(partners.length * 130),
        duration: 15000,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [partners]);

  // ── Sidebar ───────────────────────────────────────────────────
  const openMenu = () => {
    setMenuOpen(true);
    Animated.timing(sidebarX, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  };
  const closeMenu = () => {
    Animated.timing(sidebarX, { toValue: -280, duration: 180, useNativeDriver: true }).start(() =>
      setMenuOpen(false)
    );
  };
  const goToProfile = () => { closeMenu(); setTimeout(() => navigation.navigate('Profile'), 180); };

  // ── Category tap → scroll to section ─────────────────────────
  const handleCategoryPress = (title: string) => {
    setActiveCategory(title);
    const offset = sectionOffsets.current[title];
    if (offset !== undefined) {
      mainScrollRef.current?.scrollTo({ y: offset, animated: true });
    }
    const idx = categoryTitles.indexOf(title);
    categoryScrollRef.current?.scrollTo({ x: idx * 110, animated: true });
  };

  // ── Main scroll → update active category & sticky bar ────────
  const handleMainScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = e.nativeEvent.contentOffset.y;
    setCategoryBarSticky(scrollY >= categoryBarOffset.current);

    const offsets = sectionOffsets.current;
    let current = categoryTitles[0];
    for (const title of categoryTitles) {
      if (offsets[title] !== undefined && scrollY >= offsets[title] - 60) {
        current = title;
      }
    }
    if (current !== activeCategory) {
      setActiveCategory(current);
      const idx = categoryTitles.indexOf(current);
      categoryScrollRef.current?.scrollTo({ x: idx * 110, animated: true });
    }
  };

  // ── Render category bar ───────────────────────────────────────
  const renderCategoryBar = () => (
    <View style={styles.categoryContainer}>
      <ScrollView
        ref={categoryScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      >
        {categoryTitles.map((title) => (
          <TouchableOpacity
            key={title}
            style={[styles.categoryButton, activeCategory === title && styles.categoryButtonActive]}
            onPress={() => handleCategoryPress(title)}
          >
            <Text style={[styles.categoryText, activeCategory === title && styles.categoryTextActive]}>
              {title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        showCart
        cartItemCount={cartItems}
        onCartPress={() => navigation.navigate('Cart')}
        onAllProductsPress={() => navigation.navigate('AllProducts')}
        backgroundColor="#FFFFFF"
        logoSource={require('../images/new logo green.png')}
        showMenu
        onMenuPress={openMenu}
      />

      {categoryBarSticky && renderCategoryBar()}

      {/* Sidebar */}
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

      <ScrollView
        ref={mainScrollRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={handleMainScroll}
        scrollEventThrottle={16}
      >
        {/* ── Hero Carousel ── */}
        <View style={styles.heroSection}>
          <ScrollView
            ref={heroScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setHeroIndex(Math.round(e.nativeEvent.contentOffset.x / width))
            }
            style={styles.heroCarousel}
            contentContainerStyle={{ paddingHorizontal: 0 }}
          >
            {displaySlides.map((uri, index) => (
              <View key={`${uri}-${index}`} style={styles.heroSlideFrame}>
                <Image source={{ uri }} style={styles.heroSlideImage} resizeMode="cover" />
              </View>
            ))}
          </ScrollView>
          <View style={styles.heroOverlay} />
        </View>

        {/* ── Inline category bar ── */}
        <View onLayout={(e) => { categoryBarOffset.current = e.nativeEvent.layout.y; }}>
          {!categoryBarSticky && renderCategoryBar()}
        </View>

        {/* ── Product sections ── */}
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
          categoryGroups.map(({ title, data }) => (
            <View
              key={title}
              onLayout={(e) => { sectionOffsets.current[title] = e.nativeEvent.layout.y; }}
            >
              <Text style={styles.sectionTitle}>{title}</Text>
              <View style={styles.productGrid}>
                {data.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                  />
                ))}
              </View>
            </View>
          ))
        )}

        {/* ── Bundles ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Save Big With Bundles</Text>
          <View style={styles.bundleGrid}>
            {BUNDLES.map((bundle) => (
              <View key={bundle.id} style={styles.bundleCard}>
                <Image source={{ uri: bundle.image }} style={styles.bundleImage} resizeMode="contain" />
                <Text style={styles.bundleTitle}>{bundle.title}</Text>
                <TouchableOpacity
                  style={styles.bundleButton}
                  onPress={() => navigation.navigate('BundleDetail', { bundleId: bundle.bundleId })}
                >
                  <Text style={styles.bundleButtonText}>SHOP NOW</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* ── Trusted Partners ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trusted Partners</Text>
          <Text style={styles.sectionSubtitle}>Certified and working with leading organizations</Text>
          <View style={styles.marqueeContainer}>
            <Animated.View
              style={[styles.marqueeContent, { transform: [{ translateX: partnerScrollX }] }]}
            >
              {partnersError ? (
                <Text style={styles.errorText}>{partnersError}</Text>
              ) : (
                [...partners, ...partners].map((partner, index) => (
                  <View key={`${partner.id}-${index}`} style={styles.partnerCard}>
                    <Image source={{ uri: partner.logo }} style={styles.partnerLogo} resizeMode="contain" />
                  </View>
                ))
              )}
            </Animated.View>
          </View>
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },

  heroSection: {
    width: '100%',
    aspectRatio: 1252 / 650,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f4f1ea',
  },
  heroCarousel: { width: '100%', height: '100%' },
  heroSlideFrame: { width: width * 0.99, height: '100%', justifyContent: 'center', alignItems: 'center' },
  heroSlideImage: { width: '99%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },

  categoryContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  categoryList: { paddingHorizontal: SPACING.md },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: SPACING.sm,
  },
  categoryButtonActive: { backgroundColor: COLORS.primary },
  categoryText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },
  categoryTextActive: { color: COLORS.white },

  section: { paddingVertical: SPACING.md },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },

  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },

  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  statusText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  retryText: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.primary },

  bundleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  bundleCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  bundleImage: { width: '100%', height: 140, marginBottom: SPACING.sm },
  bundleTitle: {
    fontSize: FONT_SIZES.sm,
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
  bundleButtonText: { color: COLORS.white, fontWeight: FONT_WEIGHTS.bold, fontSize: FONT_SIZES.sm },

  marqueeContainer: { height: 80, marginTop: SPACING.sm, overflow: 'hidden' },
  marqueeContent: { flexDirection: 'row', paddingLeft: SPACING.md },
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
  partnerLogo: { width: '100%', height: '100%' },

  footer: { height: SPACING.xl },

  drawerRoot: { flex: 1, flexDirection: 'row' },
  drawerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  drawerPanel: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 280,
    backgroundColor: '#fff',
    paddingTop: 56,
    paddingHorizontal: 16,
  },
  drawerHeader: { marginBottom: 20 },
  drawerAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  drawerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 22 },
  drawerName: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  drawerPhone: { marginTop: 4, color: COLORS.textSecondary },
  drawerItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  drawerItemText: { fontSize: 16, color: COLORS.textPrimary, fontWeight: '600' },
});

export default HomeScreen;