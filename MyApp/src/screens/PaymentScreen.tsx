import React, { useState } from 'react';
import { Modal, TextInput, TouchableWithoutFeedback } from 'react-native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setPaymentInfo, createOrder } from '../store/slices/orderSlice';
import { clearCart } from '../store/slices/cartSlice';
import Header from '../components/Header';
import { PaymentMethod, OrderStatus } from '../types';
import { orderService, paymentService } from '../services/api';

const { width } = Dimensions.get('window');

// Simple gradient replacement using overlays
const GradientView = ({ colors, children, style }: any) => {
  return (
    <View style={[{ backgroundColor: colors[0] }, style]}>
      {children}
    </View>
  );
};

// Simple icon replacements
const Icon = ({ name, size = 24, color = '#000' }: any) => {
  const iconMap: any = {
    'receipt-outline': '🧾',
    'card-outline': '💳',
    'cash-outline': '💵',
    'shield-checkmark': '🔒',
    'checkmark': '✓',
    'sync': '⟳',
    'arrow-forward': '→',
  };

  return (
    <Text style={{ fontSize: size, color }}>
      {iconMap[name] || '•'}
    </Text>
  );
};

const PaymentScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const cart = useSelector((state: RootState) => state.cart);
  const selectedAddress = useSelector((state: RootState) => state.address.selectedAddress);

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  const animateSelection = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSelectPayment = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    animateSelection();
  };

  const handlePlaceOrder = async () => {
    // Validate payment method
    if (!selectedPaymentMethod) {
      Alert.alert('Payment Method Required', 'Please select a payment method to continue');
      return;
    }

    // Validate address
    if (!selectedAddress) {
      Alert.alert('Address Missing', 'Please add a delivery address');
      return;
    }

    // Validate cart is not empty
    if (cart.items.length === 0) {
      Alert.alert('Cart Empty', 'Please add items to your cart');
      return;
    }

    setIsProcessing(true);

    try {
      // Handle COD payment
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
          totalAmount: Number(cart.totalPrice),
        });

        if (!codResult.success || !codResult.data?.order) {
          throw new Error(codResult.error || 'Failed to save COD order to database');
        }

        dispatch(
          createOrder({
            id: codResult.data.order.id,
            items: cart.items,
            shippingAddress: selectedAddress,
            paymentInfo: { method: selectedPaymentMethod as PaymentMethod },
            totalAmount: cart.totalPrice,
            status: OrderStatus.PENDING,
            createdAt: new Date().toISOString(),
          })
        );

        dispatch(clearCart());
        navigation.replace('OrderSuccess', { orderId: codResult.data.order.id });
        return;
      }

      // Handle ONLINE payment (Dialog Pay)
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
        totalAmount: Number(cart.totalPrice),
      };

      console.log('📤 Sending payment payload:', JSON.stringify(paymentPayload, null, 2));

      const paymentResult = await paymentService.createOnlinePayment(paymentPayload);

      console.log('📥 Full payment response:', JSON.stringify(paymentResult, null, 2));

      if (!paymentResult.success || !paymentResult.data) {
        throw new Error(paymentResult.error || 'Payment request failed');
      }

      // Extract data from response
      const checkout_url = paymentResult.data.checkout_url;
      const responseOrder = paymentResult.data.order;
      const txnRef = paymentResult.data.txnRef;

      console.log('🔗 checkout_url:', checkout_url);
      console.log('📦 Order ID:', responseOrder?.id);
      console.log('💳 Transaction Ref:', txnRef);

      // Update Redux with payment info
      dispatch(
        setPaymentInfo({
          method: PaymentMethod.ONLINE,
          transactionId: txnRef,
        })
      );

      // Create order in Redux
      dispatch(
        createOrder({
          id: responseOrder?.id?.toString() || `ORD-${Date.now()}`,
          items: cart.items,
          shippingAddress: selectedAddress,
          paymentInfo: {
            method: PaymentMethod.ONLINE,
            transactionId: txnRef,
          },
          totalAmount: cart.totalPrice,
          status: OrderStatus.PROCESSING,
          createdAt: new Date().toISOString(),
        })
      );

      // Clear cart
      dispatch(clearCart());

      // Navigate to PaymentWebView with the checkout_url
      if (checkout_url) {
        console.log('✅ Navigating to PaymentWebView with URL:', checkout_url);
        navigation.navigate('PaymentWebView', {
          checkoutUrl: checkout_url,
          orderId: responseOrder?.id?.toString() || `ORD-${Date.now()}`,
        });
      } else {
        console.error('❌ No checkout_url in response');
        Alert.alert(
          'Payment Gateway Error',
          'Unable to initialize payment gateway. Please try again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
      
    } catch (error: any) {
      console.error('❌ Payment Error:', error);
      
      let errorMessage = 'Unable to process payment. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData.message || errorData.error || errorMessage;
        console.error('Error response data:', JSON.stringify(errorData, null, 2));
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Payment Failed', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const PaymentOption = ({
    method,
    title,
    subtitle,
    icon,
    gradient,
  }: {
    method: PaymentMethod;
    title: string;
    subtitle: string;
    icon: string;
    gradient: string[];
  }) => {
    const isSelected = selectedPaymentMethod === method;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleSelectPayment(method)}
        style={styles.paymentOptionWrapper}
      >
        <Animated.View
          style={[
            styles.paymentOption,
            isSelected && styles.paymentOptionSelected,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <GradientView
            colors={isSelected ? gradient : ['#FFFFFF', '#FFFFFF']}
            style={[
              styles.gradientBackground,
              { backgroundColor: isSelected ? gradient[0] : '#FFFFFF' }
            ]}
          >
            <View style={[
              styles.iconContainer,
              { backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : gradient[0] + '15' }
            ]}>
              <Icon
                name={icon}
                size={32}
                color={isSelected ? '#FFFFFF' : gradient[0]}
              />
            </View>

            <View style={styles.paymentTextContainer}>
              <Text
                style={[
                  styles.paymentTitle,
                  isSelected && styles.paymentTitleSelected,
                ]}
              >
                {title}
              </Text>
              <Text
                style={[
                  styles.paymentSubtitle,
                  isSelected && styles.paymentSubtitleSelected,
                ]}
              >
                {subtitle}
              </Text>
            </View>

            <View style={styles.radioContainer}>
              {isSelected ? (
                <View style={[styles.radioSelected, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}>
                  <Icon name="checkmark" size={16} color="#FFFFFF" />
                </View>
              ) : (
                <View style={styles.radioUnselected} />
              )}
            </View>
          </GradientView>
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
        {/* Order Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Icon name="receipt-outline" size={24} color="#6366F1" />
            <Text style={styles.summaryTitle}>Order Summary</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items ({cart.items.length})</Text>
            <Text style={styles.summaryValue}>Rs. {cart.totalPrice.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>Free</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>Rs. {cart.totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Methods Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="card-outline" size={22} color="#1F2937" />
            <Text style={styles.sectionTitle}>Select Payment Method</Text>
          </View>

          <PaymentOption
            method={PaymentMethod.COD}
            title="Cash on Delivery"
            subtitle="Pay when you receive"
            icon="cash-outline"
            gradient={['#10B981', '#059669']}
          />

          <PaymentOption
            method={PaymentMethod.ONLINE}
            title="Online Payment"
            subtitle="Pay securely via card or wallet"
            icon="card-outline"
            gradient={['#6366F1', '#4F46E5']}
          />
        </View>

        {/* Security Badge */}
        <View style={styles.securityBadge}>
          <Icon name="shield-checkmark" size={20} color="#10B981" />
          <Text style={styles.securityText}>
            Your payment information is secure and encrypted
          </Text>
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
          <GradientView
            colors={
              !selectedPaymentMethod || isProcessing
                ? ['#D1D5DB', '#9CA3AF']
                : ['#6366F1', '#4F46E5']
            }
            style={[
              styles.buttonGradient,
              {
                backgroundColor: !selectedPaymentMethod || isProcessing
                  ? '#9CA3AF'
                  : '#6366F1'
              }
            ]}
          >
            {isProcessing ? (
              <View style={styles.buttonContent}>
                <Icon name="sync" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Processing...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Place Order</Text>
                <Icon name="arrow-forward" size={20} color="#FFFFFF" />
              </View>
            )}
          </GradientView>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6366F1',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  paymentOptionWrapper: {
    marginBottom: 12,
  },
  paymentOption: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentOptionSelected: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  gradientBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  paymentTitleSelected: {
    color: '#FFFFFF',
  },
  paymentSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  paymentSubtitleSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  radioContainer: {
    marginLeft: 12,
  },
  radioSelected: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioUnselected: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  securityText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  placeOrderButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  placeOrderButtonDisabled: {
    shadowOpacity: 0.1,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginHorizontal: 8,
  },
});

export default PaymentScreen;