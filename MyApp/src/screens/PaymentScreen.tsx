import React, { useState,useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setPaymentInfo, createOrder } from '../store/slices/orderSlice';
import { clearCart } from '../store/slices/cartSlice';
import Header from '../components/Header';
import { PaymentMethod, OrderStatus } from '../types';
import { orderService, paymentService, settingsService } from '../services/api';


const PaymentScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const cart = useSelector((state: RootState) => state.cart);
  const selectedAddress = useSelector((state: RootState) => state.address.selectedAddress);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // const [scaleAnim] = useState(new Animated.Value(1));
  // const [deliveryFee, setDeliveryFee] = useState(200);

  const [scaleAnim] = useState(new Animated.Value(1));

// ✅ Add these
const [deliveryFee, setDeliveryFee] = useState(200);

useEffect(() => {
  settingsService.getDeliveryFee().then(fee => setDeliveryFee(fee));
}, []);

const COD_TAX_RATE = 0.04;
const subtotal = cart.totalPrice;
const codTax = selectedPaymentMethod === PaymentMethod.COD
  ? Math.round(subtotal * COD_TAX_RATE)
  : 0;
const finalTotal = subtotal + deliveryFee + codTax;


  const animateSelection = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const handleSelectPayment = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    animateSelection();
  };

  const handlePlaceOrder = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Payment Method Required', 'Please select a payment method to continue');
      return;
    }
    if (!selectedAddress) {
      Alert.alert('Address Missing', 'Please add a delivery address');
      return;
    }
    if (cart.items.length === 0) {
      Alert.alert('Cart Empty', 'Please add items to your cart');
      return;
    }

    setIsProcessing(true);

    try {
      // ── COD ──────────────────────────────────────────────────────────────
      if (selectedPaymentMethod === PaymentMethod.COD) {
        const orderId = `ORD-${Date.now()}`;

        const codResult = await orderService.createCODOrder({
          orderId,
          items: cart.items.map(item => ({
            productId: item.product.id,
            name: item.product.name,
            price: Number(item.product.price),
            quantity: Number(item.quantity),
            image: item.product.images?.[0] || '',
          })),
          shippingAddress: {
            fullName: selectedAddress.fullName,
            email: selectedAddress.email,
            phone: selectedAddress.phone,
            addressLine1: selectedAddress.addressLine1,
            addressLine2: selectedAddress.addressLine2 || '',
            city: selectedAddress.city,
            state: selectedAddress.state,
            zipCode: selectedAddress.zipCode,
            country: 'Pakistan',
          },
          totalAmount: finalTotal,
        });

        if (!codResult.success || !codResult.data?.order) {
          throw new Error(codResult.error || 'Failed to create COD order');
        }

        dispatch(
          createOrder({
            id: codResult.data.order.id,
            items: cart.items,
            shippingAddress: selectedAddress,
            paymentInfo: { method: PaymentMethod.COD },
            totalAmount: finalTotal,
            status: OrderStatus.PENDING,
            createdAt: new Date().toISOString(),
          })
        );

        dispatch(clearCart());
        navigation.replace('OrderSuccess', { orderId: codResult.data.order.id });
        return;
      }

      // ── Online Payment (hosted checkout — gateway handles card/wallet) ───
      const paymentPayload = {
        items: cart.items.map(item => ({
          id: item.product.id,
          name: item.product.name,
          price: Number(item.product.price),
          quantity: Number(item.quantity),
          image: item.product.images?.[0] || '',
        })),
        shippingAddress: {
          fullName: selectedAddress.fullName,
          email: selectedAddress.email,
          phone: selectedAddress.phone,
          addressLine1: selectedAddress.addressLine1,
          addressLine2: selectedAddress.addressLine2 || '',
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.zipCode,
        },
        totalAmount: finalTotal,
        paymentMethod: PaymentMethod.CARD,
      };

      console.log('📤 Payment payload:', JSON.stringify(paymentPayload, null, 2));

      const paymentResult = await paymentService.createOrderAndPayment(paymentPayload);

      console.log('📥 Payment response:', JSON.stringify(paymentResult, null, 2));

      if (!paymentResult.success || !paymentResult.data) {
        throw new Error(paymentResult.error || 'Payment request failed');
      }

      const { checkout_url, order: responseOrder, txnRef } = paymentResult.data;

      dispatch(setPaymentInfo({ method: PaymentMethod.CARD, transactionId: txnRef }));

      dispatch(
        createOrder({
          id: responseOrder?.id?.toString() || `ORD-${Date.now()}`,
          items: cart.items,
          shippingAddress: selectedAddress,
          paymentInfo: { method: PaymentMethod.CARD, transactionId: txnRef },
          totalAmount: finalTotal,
          status: OrderStatus.PROCESSING,
          createdAt: new Date().toISOString(),
        })
      );

      dispatch(clearCart());

      if (checkout_url) {
        navigation.navigate('PaymentWebView', {
          checkoutUrl: checkout_url,
          orderId: responseOrder?.id?.toString() || `ORD-${Date.now()}`,
        });
      } else {
        Alert.alert(
          'Payment Gateway Error',
          'Unable to initialize payment. Please try again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      console.error('❌ Payment Error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Unable to process payment. Please try again.';
      Alert.alert('Payment Failed', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const PaymentOption = ({
    method,
    title,
    subtitle,
    emoji,
    accentColor,
  }: {
    method: PaymentMethod;
    title: string;
    subtitle: string;
    emoji: string;
    accentColor: string;
  }) => {
    const isSelected = selectedPaymentMethod === method;

    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => handleSelectPayment(method)}>
        <Animated.View
          style={[
            styles.paymentOption,
            isSelected && { ...styles.paymentOptionSelected, borderColor: accentColor },
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={[styles.iconBox, { backgroundColor: accentColor + '18' }]}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>

          <View style={styles.paymentTextContainer}>
            <Text style={[styles.paymentTitle, isSelected && { color: accentColor }]}>
              {title}
            </Text>
            <Text style={styles.paymentSubtitle}>{subtitle}</Text>
          </View>

          <View
            style={[
              styles.radio,
              isSelected && { borderColor: accentColor, backgroundColor: accentColor },
            ]}
          >
            {isSelected && <Text style={styles.radioCheck}>✓</Text>}
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Payment" showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary */}
<View style={styles.summaryCard}>
  <Text style={styles.summaryTitle}>🧾  Order Summary</Text>

  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>Items ({cart.items.length})</Text>
    <Text style={styles.summaryValue}>Rs. {subtotal.toFixed(2)}</Text>
  </View>

  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>Delivery Fee</Text>
    <Text style={styles.summaryValue}>Rs. {deliveryFee}</Text>
  </View>

  {selectedPaymentMethod === PaymentMethod.COD && (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>COD Tax (4%)</Text>
      <Text style={styles.summaryValue}>Rs. {codTax.toFixed(2)}</Text>
    </View>
  )}

  <View style={styles.divider} />

  <View style={styles.summaryRow}>
    <Text style={styles.totalLabel}>Total Amount</Text>
    <Text style={styles.totalValue}>
      Rs. {selectedPaymentMethod ? finalTotal.toFixed(2) : (subtotal + deliveryFee).toFixed(2)}
    </Text>
  </View>
</View>

{/* Payment Methods */}
        <Text style={styles.sectionTitle}>Select Payment Method</Text>

        <PaymentOption
          method={PaymentMethod.COD}
          title="Cash on Delivery"
          subtitle="Pay when you receive your order"
          emoji="💵"
          accentColor="#10B981"
        />

        <PaymentOption
          method={PaymentMethod.CARD}
          title="Pay Online"
          subtitle="Card, JazzCash, EasyPaisa & more"
          emoji="💳"
          accentColor="#6366F1"
        />

        {/* Security badge */}
        <View style={styles.securityBadge}>
          <Text style={styles.securityText}>🔒  Payments are secure and encrypted</Text>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePlaceOrder}
          disabled={!selectedPaymentMethod || isProcessing}
          style={[
            styles.placeOrderButton,
            (!selectedPaymentMethod || isProcessing) && styles.placeOrderButtonDisabled,
          ]}
        >
          <Text style={styles.buttonText}>
            {isProcessing ? '⟳  Processing...' : 'Place Order  →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 15, color: '#6B7280', fontWeight: '500' },
  summaryValue: { fontSize: 15, color: '#1F2937', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  totalLabel: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  totalValue: { fontSize: 20, fontWeight: '800', color: '#6366F1' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 },

  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  paymentOptionSelected: {
    borderWidth: 2,
    shadowOpacity: 0.1,
    elevation: 4,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: { fontSize: 26 },
  paymentTextContainer: { flex: 1, marginLeft: 14 },
  paymentTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 3 },
  paymentSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCheck: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  securityBadge: { alignItems: 'center', marginTop: 8, paddingVertical: 8 },
  securityText: { fontSize: 13, color: '#059669', fontWeight: '600' },

  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  placeOrderButton: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  buttonText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
});

export default PaymentScreen;