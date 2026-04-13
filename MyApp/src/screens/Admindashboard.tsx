import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminService } from '../services/api';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  city: string;
  state: string;
}

interface AdminOrder {
  id: string;
  items: string;
  shippingAddress: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const isPending = status === 'PENDING';
  return (
    <View style={[styles.badge, isPending ? styles.badgePending : styles.badgeConfirmed]}>
      <Text style={[styles.badgeText, isPending ? styles.badgeTextPending : styles.badgeTextConfirmed]}>
        {status}
      </Text>
    </View>
  );
};

const Admindashboardscreen = () => {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      if (!token) {
        navigation.replace('AdminLogin');
        return;
      }
      const result = await adminService.getOrders(token);
      if (result.success && result.data?.orders) {
        setOrders(result.data.orders);
      } else if (result.error?.includes('401') || result.error?.includes('Unauthorized')) {
        await AsyncStorage.removeItem('adminToken');
        navigation.replace('AdminLogin');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const token = await AsyncStorage.getItem('adminToken');
      if (!token) return;
      const result = await adminService.updateOrderStatus(orderId, newStatus, token);
      if (result.success) {
        setOrders(prev =>
          prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to update status');
      }
    } catch {
      Alert.alert('Error', 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('adminToken');
          navigation.replace('AdminLogin');
        },
      },
    ]);
  };

  const parseItems = (itemsStr: string): OrderItem[] => {
    try { return JSON.parse(itemsStr); } catch { return []; }
  };

  const parseAddress = (addrStr: string): ShippingAddress | null => {
    try { return JSON.parse(addrStr); } catch { return null; }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const confirmedOrders = orders.filter(o => o.status === 'CONFIRMED').length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1F2937" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSub}>Organicles</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total orders</Text>
            <Text style={styles.statValue}>{totalOrders}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={[styles.statValue, { color: '#D97706' }]}>{pendingOrders}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Confirmed</Text>
            <Text style={[styles.statValue, { color: '#059669' }]}>{confirmedOrders}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Revenue</Text>
            <Text style={styles.statValue}>
              Rs. {totalRevenue >= 1000 ? `${(totalRevenue / 1000).toFixed(1)}k` : totalRevenue}
            </Text>
          </View>
        </View>

        {/* Orders */}
        <Text style={styles.sectionTitle}>Orders ({totalOrders})</Text>

        {orders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No orders yet</Text>
          </View>
        ) : (
          orders.map(order => {
            const items = parseItems(order.items);
            const address = parseAddress(order.shippingAddress);
            const isExpanded = expandedOrder === order.id;
            const isUpdating = updatingId === order.id;
            const isPending = order.status === 'PENDING';

            return (
              <View key={order.id} style={styles.orderCard}>
                {/* Order Header */}
                <TouchableOpacity
                  onPress={() => setExpandedOrder(isExpanded ? null : order.id)}
                  activeOpacity={0.7}>
                  <View style={styles.orderTop}>
                    <View>
                      <Text style={styles.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
                      <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                    </View>
                    <StatusBadge status={order.status} />
                  </View>

                  <View style={styles.orderMeta}>
                    <Text style={styles.orderCustomer}>{address?.fullName || 'N/A'}</Text>
                    <Text style={styles.orderDot}>·</Text>
                    <Text style={styles.orderCity}>{address?.city || ''}</Text>
                    <Text style={styles.orderDot}>·</Text>
                    <Text style={styles.orderItems}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
                  </View>

                  <View style={styles.orderBottom}>
                    <Text style={styles.orderAmount}>Rs. {order.totalAmount.toLocaleString()}</Text>
                    <View style={styles.methodPill}>
                      <Text style={styles.methodText}>{order.paymentMethod}</Text>
                    </View>
                    <Text style={styles.expandArrow}>{isExpanded ? '▲' : '▼'}</Text>
                  </View>
                </TouchableOpacity>

                {/* Expanded Details */}
                {isExpanded && (
                  <View style={styles.expandedSection}>
                    <View style={styles.divider} />

                    {/* Items */}
                    <Text style={styles.detailSectionTitle}>Items</Text>
                    {items.map((item, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.itemQty}>x{item.quantity}</Text>
                        <Text style={styles.itemPrice}>Rs. {(item.price * item.quantity).toLocaleString()}</Text>
                      </View>
                    ))}

                    {/* Address */}
                    {address && (
                      <>
                        <Text style={[styles.detailSectionTitle, { marginTop: 12 }]}>Delivery address</Text>
                        <Text style={styles.addressText}>{address.addressLine1}</Text>
                        <Text style={styles.addressText}>{address.city}, {address.state}</Text>
                        <Text style={styles.addressText}>{address.phone}</Text>
                        <Text style={styles.addressText}>{address.email}</Text>
                      </>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                      {isPending ? (
                        <TouchableOpacity
                          style={styles.confirmBtn}
                          onPress={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                          disabled={isUpdating}
                          activeOpacity={0.8}>
                          {isUpdating ? (
                            <ActivityIndicator size="small" color="#065F46" />
                          ) : (
                            <Text style={styles.confirmBtnText}>Mark as Confirmed</Text>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.pendingBtn}
                          onPress={() => handleUpdateStatus(order.id, 'PENDING')}
                          disabled={isUpdating}
                          activeOpacity={0.8}>
                          {isUpdating ? (
                            <ActivityIndicator size="small" color="#92400E" />
                          ) : (
                            <Text style={styles.pendingBtnText}>Mark as Pending</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#6B7280' },

  header: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  logoutBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#374151' },
  logoutText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  statLabel: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1F2937' },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 12 },

  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: '#9CA3AF' },

  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  orderId: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  orderDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeConfirmed: { backgroundColor: '#D1FAE5' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextPending: { color: '#92400E' },
  badgeTextConfirmed: { color: '#065F46' },

  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  orderCustomer: { fontSize: 13, color: '#374151', fontWeight: '500' },
  orderDot: { fontSize: 13, color: '#D1D5DB' },
  orderCity: { fontSize: 13, color: '#6B7280' },
  orderItems: { fontSize: 13, color: '#6B7280' },

  orderBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderAmount: { fontSize: 15, fontWeight: '700', color: '#1F2937', flex: 1 },
  methodPill: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  methodText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  expandArrow: { fontSize: 10, color: '#9CA3AF' },

  expandedSection: { marginTop: 4 },
  divider: { height: 0.5, backgroundColor: '#E5E7EB', marginVertical: 12 },
  detailSectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemName: { flex: 1, fontSize: 13, color: '#374151' },
  itemQty: { fontSize: 13, color: '#6B7280', marginRight: 8 },
  itemPrice: { fontSize: 13, fontWeight: '600', color: '#1F2937' },

  addressText: { fontSize: 13, color: '#6B7280', marginBottom: 3 },

  actionRow: { marginTop: 12 },
  confirmBtn: {
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: '#065F46' },
  pendingBtn: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  pendingBtnText: { fontSize: 14, fontWeight: '700', color: '#92400E' },
});

export default Admindashboardscreen;