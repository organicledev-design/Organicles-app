import React from 'react';
import { useNavigation } from '@react-navigation/native'; 

import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ImageSourcePropType } from 'react-native';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, SHADOWS } from '../constants/theme';

interface HeaderProps {
  title?: string;
  logoSource?: ImageSourcePropType;
  subtitle?: string;
  backgroundColor?: string;
  showBack?: boolean;
  showCart?: boolean;
  showAllProducts?: boolean;
  cartItemCount?: number;
  onBack?: () => void;
  onCartPress?: () => void;
  onAllProductsPress?: () => void;
  showMenu?: boolean;
onMenuPress?: () => void;

}

const Header: React.FC<HeaderProps> = ({
  title,
  logoSource,
  subtitle,
  backgroundColor,
  showBack = false,
  showCart = false,
  showAllProducts = false,
  cartItemCount = 0,
  onBack,
  onCartPress,
  onAllProductsPress,
  showMenu = false,
onMenuPress,

}) => {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };
  return (
    
    <SafeAreaView style={[styles.safeArea, backgroundColor && { backgroundColor }]}>
      <View style={[styles.header, backgroundColor && { backgroundColor }]}>
        <View style={styles.leftContainer}>
        {showMenu && (
  <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
    <Text style={styles.menuIcon}>☰</Text>
  </TouchableOpacity>
)}
        

          {showBack && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          )}
        </View>

        {logoSource ? (
          <View style={styles.centerContent} pointerEvents="none">
            <View style={styles.logoBlock}>
              <Image source={logoSource} style={styles.logoImage} resizeMode="contain" />
              {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          </View>
        ) : (
          title && (
            <View style={styles.centerContent} pointerEvents="none">
              <Text style={styles.title}>{title}</Text>
            </View>
          )
        )}
        
        <View style={styles.rightContainer}>
          {showAllProducts && (
            <TouchableOpacity onPress={onAllProductsPress} style={styles.allProductsButton}>
              <Text style={styles.allProductsText}>All Products</Text>
            </TouchableOpacity>
          )}
          
          {showCart && (
            <TouchableOpacity onPress={onCartPress} style={styles.cartButton}>
              <Text style={styles.cartIcon}>🛒</Text>
              {cartItemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartItemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    position: 'relative',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },

  leftContainer: {
  width: 56,
  alignItems: 'flex-start',
  justifyContent: 'center',
},

  rightContainer: {
  width: 56,
  alignItems: 'center',   // changed from flex-end
  justifyContent: 'center',
  flexDirection: 'row',
},
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.primary,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  logoBlock: {
  alignItems: 'center',
  justifyContent: 'center',
},
  centerContent: {
  position: 'absolute',
  left: 0,
  right: 0,
  alignItems: 'center',
  justifyContent: 'center',
},
  logoImage: {
    width: 140,
    height: 40,
  },
  subtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
    letterSpacing: 1,
  },
  allProductsButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: SPACING.sm,
  },
  allProductsText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  cartButton: {
  width: 32,
  height: 32,
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
},

  cartIcon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },
  menuButton: {
  width: 40,
  height: 40,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: SPACING.sm,
},
menuIcon: {
  fontSize: 22,
  color: COLORS.primary,
  fontWeight: FONT_WEIGHTS.bold,
},

});

export default Header;
