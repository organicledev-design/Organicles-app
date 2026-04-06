import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { clearCurrentOrder } from '../store/slices/orderSlice';
import Button from '../components/Button';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS } from '../constants/theme';

const OrderSuccessScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  
  const { orderId } = route.params;
  
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Animate checkmark on mount
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleContinueShopping = () => {
    dispatch(clearCurrentOrder());
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Success Animation */}
        <Animated.View
          style={[
            styles.checkmarkContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}>
          <View style={styles.checkmarkCircle}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        </Animated.View>

        {/* Success Message */}
        <Text style={styles.title}>Order Placed Successfully!</Text>
        <Text style={styles.subtitle}>
          Thank you for shopping with Organicles
        </Text>

        {/* Order Details */}
        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailValue}>#{orderId.slice(0, 8).toUpperCase()}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>📧</Text>
            <Text style={styles.infoText}>
              Order confirmation has been sent to your email
            </Text>
          </View>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>📦</Text>
            <Text style={styles.infoText}>
              Your order will be delivered within 3-5 business days
            </Text>
          </View>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>🔔</Text>
            <Text style={styles.infoText}>
              You'll receive updates about your order status
            </Text>
          </View>
        </View>

        {/* Message */}
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>
            We appreciate your trust in Organicles. Our team is preparing your order with care to ensure you receive the finest organic products.
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <Button
          title="Continue Shopping"
          onPress={handleContinueShopping}
          fullWidth
          size="large"
        />
        
        <Text style={styles.footerNote}>
          Need help? Contact us at support@organicles.pk
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  checkmarkContainer: {
    marginBottom: SPACING.xl,
  },
  checkmarkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  checkmark: {
    fontSize: 60,
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.bold,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  orderDetails: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  detailLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  messageBox: {
    width: '100%',
    backgroundColor: COLORS.primaryLight + '15',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  messageText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  footerNote: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});

export default OrderSuccessScreen;
