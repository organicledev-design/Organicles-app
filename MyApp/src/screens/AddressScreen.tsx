import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { addAddress, selectAddress, updateAddress,
  deleteAddress,
  hydrateAddresses, } from '../store/slices/addressSlice';
import Header from '../components/Header';
import Button from '../components/Button';
import { Address } from '../types';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { generateId, isValidPhone, isValidEmail } from '../utils/helpers';


const AddressScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { addresses, selectedAddress } = useSelector((state: RootState) => state.address);
  const ADDRESSES_KEY = 'saved_addresses';
const SELECTED_ADDRESS_ID_KEY = 'selected_address_id';

const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
const [hydrated, setHydrated] = useState(false);

  
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false,
  });

  const handleSelectAddress = (address: Address) => {
    dispatch(selectAddress(address));
  };

  const handleAddNewAddress = () => {
  setEditingAddressId(null);
  setFormData({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false,
  });
  setShowAddressForm(true);
};

const handleEditAddress = (address: Address) => {
  setEditingAddressId(address.id);
  setFormData({
    fullName: address.fullName,
    email: address.email,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 || '',
    city: address.city,
    state: address.state,
    zipCode: address.zipCode,
    isDefault: address.isDefault,
  });
  setShowAddressForm(true);
};

const handleDeleteAddress = (id: string) => {
  Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: () => dispatch(deleteAddress(id)),
    },
  ]);
};



  // load effect
  useEffect(() => {
  const loadSavedAddresses = async () => {
    try {
      const rawAddresses = await AsyncStorage.getItem(ADDRESSES_KEY);
      const rawSelectedId = await AsyncStorage.getItem(SELECTED_ADDRESS_ID_KEY);

      const parsedAddresses: Address[] = rawAddresses ? JSON.parse(rawAddresses) : [];
      const selectedAddressId = rawSelectedId || null;

      dispatch(hydrateAddresses({ addresses: parsedAddresses, selectedAddressId }));
    } catch (e) {
      console.log('Failed to load addresses:', e);
    } finally {
      setHydrated(true);
    }
  };

  loadSavedAddresses();
}, [dispatch]);

// save effect
useEffect(() => {
  if (!hydrated) return;

  const persistAddresses = async () => {
    try {
      await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(addresses));
      await AsyncStorage.setItem(SELECTED_ADDRESS_ID_KEY, selectedAddress?.id || '');
    } catch (e) {
      console.log('Failed to save addresses:', e);
    }
  };

  persistAddresses();
}, [addresses, selectedAddress, hydrated]);


  const validateForm = () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    if (!formData.email.trim() || !isValidEmail(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!isValidPhone(formData.phone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }
    if (!formData.addressLine1.trim()) {
      Alert.alert('Error', 'Please enter your address');
      return false;
    }
    if (!formData.city.trim()) {
      Alert.alert('Error', 'Please enter your city');
      return false;
    }
    if (!formData.state.trim()) {
      Alert.alert('Error', 'Please enter your state/province');
      return false;
    }
    if (!formData.zipCode.trim()) {
      Alert.alert('Error', 'Please enter your zip code');
      return false;
    }
    return true;
  };
const handleSaveAddress = () => {
  if (!validateForm()) return;

  const payload: Address = {
    id: editingAddressId || generateId(),
    ...formData,
  };

  if (editingAddressId) {
    dispatch(updateAddress(payload));
    dispatch(selectAddress(payload));
    Alert.alert('Success', 'Address updated successfully');
  } else {
    dispatch(addAddress(payload));
    dispatch(selectAddress(payload));
    Alert.alert('Success', 'Address added successfully');
  }

  setEditingAddressId(null);
  setShowAddressForm(false);
};

  const handleProceedToPayment = () => {
    if (!selectedAddress) {
      Alert.alert('Select Address', 'Please select a delivery address');
      return;
    }
    navigation.navigate('Payment');
  };

  return (
    <View style={styles.container}>
      <Header
        title="Delivery Address"
        showBack
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Select delivery address or add a new one
          </Text>

          {/* Saved Addresses */}
          {addresses.map((address) => (
            <TouchableOpacity
              key={address.id}
              style={[
                styles.addressCard,
                selectedAddress?.id === address.id && styles.selectedAddress,
              ]}
              onPress={() => handleSelectAddress(address)}
            >
              <View style={styles.radioButton}>
                {selectedAddress?.id === address.id && (
                  <View style={styles.radioButtonSelected} />
                )}
              </View>

              <View style={styles.addressInfo}>
                <Text style={styles.addressName}>{address.fullName}</Text>
                <Text style={styles.addressEmail}>{address.email}</Text>
                <Text style={styles.addressPhone}>{address.phone}</Text>
                <Text style={styles.addressText}>
                  {address.addressLine1}
                  {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                </Text>
                <Text style={styles.addressText}>
                  {address.city}, {address.state} {address.zipCode}
                </Text>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
                <View style={styles.addressActions}>
                  <TouchableOpacity onPress={() => handleEditAddress(address)}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteAddress(address.id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* Add New Address Button */}
          <TouchableOpacity
            style={styles.addAddressButton}
            onPress={handleAddNewAddress}>
            <Text style={styles.addAddressIcon}>+</Text>
            <Text style={styles.addAddressText}>Add New Address</Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title="Proceed to Payment"
          onPress={handleProceedToPayment}
          disabled={!selectedAddress}
          fullWidth
          size="large"
        />
      </View>

      {/* Add Address Modal */}
      <Modal
        visible={showAddressForm}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAddressForm(false)}>
        <View style={styles.modalContainer}>
          <Header
            title="Add Address"
            showBack
            onBack={() => setShowAddressForm(false)}
          />
          
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor={COLORS.textLight}
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Phone Number *"
              placeholderTextColor={COLORS.textLight}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email *"
              placeholderTextColor={COLORS.textLight}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Address Line 1 *"
              placeholderTextColor={COLORS.textLight}
              value={formData.addressLine1}
              onChangeText={(text) => setFormData({ ...formData, addressLine1: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Address Line 2 (Optional)"
              placeholderTextColor={COLORS.textLight}
              value={formData.addressLine2}
              onChangeText={(text) => setFormData({ ...formData, addressLine2: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="City *"
              placeholderTextColor={COLORS.textLight}
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="State/Province *"
              placeholderTextColor={COLORS.textLight}
              value={formData.state}
              onChangeText={(text) => setFormData({ ...formData, state: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Zip Code *"
              placeholderTextColor={COLORS.textLight}
              value={formData.zipCode}
              onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
              keyboardType="numeric"
            />
            
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setFormData({ ...formData, isDefault: !formData.isDefault })}>
              <View style={styles.checkbox}>
                {formData.isDefault && <View style={styles.checkboxChecked} />}
              </View>
              <Text style={styles.checkboxLabel}>Set as default address</Text>
            </TouchableOpacity>
            
            <Button
              title="Save Address"
              onPress={handleSaveAddress}
              fullWidth
              size="large"
              style={styles.saveButton}
            />
          </ScrollView>
        </View>
      </Modal>
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
  content: {
    padding: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.sm,
  },
  selectedAddress: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '10',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    marginTop: 2,
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  addressPhone: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  addressEmail: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  addressText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  defaultBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  defaultText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  addressActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  editText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  deleteText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  addAddressIcon: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
  addAddressText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  footer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    ...SHADOWS.lg,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  formContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  checkboxChecked: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  checkboxLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  saveButton: {
    marginBottom: SPACING.xl,
  },
});

export default AddressScreen;
