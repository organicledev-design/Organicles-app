import React, { useState } from 'react';
import { Modal, TextInput, TouchableWithoutFeedback } from 'react-native';
import { WalletProvider } from '../types';
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
    'wallet': '👛',
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
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletPhone, setWalletPhone] = useState('');
  const [walletProvider, setWalletProvider] =
    useState<WalletProvider | null>(null);





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
    if (method === PaymentMethod.WALLET) {
      setShowWalletModal(true);
    }
    animateSelection();
  };

  const handlePlaceOrder = async () => {
    if (
      selectedPaymentMethod === PaymentMethod.WALLET &&
      (!walletProvider || !walletPhone || walletPhone.length !== 11)
    ) {
      Alert.alert(
        'Wallet Details Required',
        'Please select wallet provider and enter a valid 11-digit mobile number'
      );
      setIsProcessing(false);
      return;
    }

    
    if (!selectedPaymentMethod) {
      Alert.alert('Payment Method Required', 'Please select a payment method to continue');
      return;
    }

    if (!selectedAddress) {
      Alert.alert('Address Missing', 'Please add a delivery address');
      return;
    }

    const orderId = `ORD-${Date.now()}`;
    setIsProcessing(true);

    try {
      /** COD — no backend payment */
      if (selectedPaymentMethod === PaymentMethod.COD) {
        // Save COD order to backend database
        const codResult = await orderService.createCODOrder({
          orderId,
          items: cart.items,
          shippingAddress: selectedAddress,
          totalAmount: cart.totalPrice,
        });

        if (!codResult.success 
          || !codResult.data?.order
        ) {
          throw new Error('Failed to save COD order to database');
        }

        dispatch(
          createOrder({
            id: orderId,
            items: cart.items,
            shippingAddress: selectedAddress,
            paymentInfo: { method: PaymentMethod.COD },
            totalAmount: cart.totalPrice,
            status: OrderStatus.PENDING,
            createdAt: new Date().toISOString(),
          })
        );

        dispatch(clearCart());
        navigation.replace('OrderSuccess', {orderId: codResult.data.order.id });
        return;
      }

      /** CARD / WALLET — backend payment */
      const paymentPayloadDETAILED = {
  items: cart.items.map(item => ({
    id: item.product.id,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
    image:
      typeof item.product.images[0] === 'string'
        ? item.product.images[0]
        : undefined, // optional
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
  totalAmount: cart.totalPrice,
  paymentMethod: selectedPaymentMethod,
  ...(selectedPaymentMethod === PaymentMethod.WALLET && {
    walletPhone,
    walletProvider,
  }),
};

const paymentResult = await paymentService.createOrderAndPayment(paymentPayloadDETAILED);

if (!paymentResult.success || !paymentResult.data) {
  throw new Error(paymentResult.error || 'Payment request failed');
}

const payment = paymentResult.data;

      dispatch(
        setPaymentInfo({
          method: selectedPaymentMethod,
          transactionId: payment.txnRef,
        })
      );

      dispatch(
        createOrder({
          id: orderId,
          items: cart.items,
          shippingAddress: selectedAddress,
          paymentInfo: {
            method: selectedPaymentMethod,
            transactionId: payment.txnRef,
          },
          totalAmount: cart.totalPrice,
          status: OrderStatus.PROCESSING,
          createdAt: new Date().toISOString(),
        })
      );

      dispatch(clearCart());
      navigation.replace('OrderSuccess', { orderId: payment.order.id });
    } catch (error) {
      console.error(error);
      Alert.alert('Payment Failed', 'Unable to process payment. Please try again.');
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
            method={PaymentMethod.WALLET}
            title="Mobile Wallet"
            subtitle="JazzCash / EasyPaisa"
            icon="wallet"
            gradient={['#8B5CF6', '#7C3AED']}
          />

          <PaymentOption
            method={PaymentMethod.CARD}
            title="Credit / Debit Card"
            subtitle="Visa, Mastercard, etc."
            icon="card-outline"
            gradient={['#F59E0B', '#D97706']}
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

      {/* JazzCash Number Modal */}
      <Modal
        visible={showWalletModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setWalletPhone('');
          setWalletProvider(null);
          setShowWalletModal(false);
          setSelectedPaymentMethod(null);
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setWalletPhone('');
            setWalletProvider(null);
            setShowWalletModal(false);
            setSelectedPaymentMethod(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Enter Mobile Wallet Number</Text>
                <Text style={styles.modalSubtitle}>
                  Please enter your 11-digit mobile number (JazzCash/EasyPaisa)
                </Text>
                <View style={styles.walletProviderRow}>
                  <TouchableOpacity
                    style={[
                      styles.walletProviderOption,
                      walletProvider === WalletProvider.JAZZCASH &&
                        styles.walletProviderOptionSelected,
                    ]}
                    onPress={() => setWalletProvider(WalletProvider.JAZZCASH)}
                  >
                    <Text
                      style={[
                        styles.walletProviderText,
                        walletProvider === WalletProvider.JAZZCASH &&
                          styles.walletProviderTextSelected,
                      ]}
                    >
                      JazzCash
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.walletProviderOption,
                      walletProvider === WalletProvider.EASYPaisa &&
                        styles.walletProviderOptionSelected,
                    ]}
                    onPress={() => setWalletProvider(WalletProvider.EASYPaisa)}
                  >
                    <Text
                      style={[
                        styles.walletProviderText,
                        walletProvider === WalletProvider.EASYPaisa &&
                          styles.walletProviderTextSelected,
                      ]}
                    >
                      EasyPaisa
                    </Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.modalInput}
                  placeholder="03XXXXXXXXX"
                  placeholderTextColor="#9CA3AF"
                  value={walletPhone}
                  onChangeText={setWalletPhone}
                  keyboardType="phone-pad"
                  maxLength={11}
                  autoFocus
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancel}
                    onPress={() => {
                      setWalletPhone('');
                      setWalletProvider(null);
                      setShowWalletModal(false);
                      setSelectedPaymentMethod(null);
                    }}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalConfirm}
                    onPress={() => {
                      if (walletProvider && walletPhone.length === 11) {
                        setShowWalletModal(false);
                      } else {
                        Alert.alert(
                          'Missing Details',
                          'Select wallet provider and enter a valid 11-digit number'
                        );
                      }
                    }}
                  >
                    <Text style={styles.modalConfirmText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  // JazzCash Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  walletProviderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  walletProviderOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  walletProviderOptionSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  walletProviderText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  walletProviderTextSelected: {
    color: '#4F46E5',
  },
  modalInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalConfirm: {
    flex: 1,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 16,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  
  
}
);


export default PaymentScreen;
