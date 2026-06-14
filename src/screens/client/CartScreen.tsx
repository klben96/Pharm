import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Trash2, ShoppingCart, Plus, Minus } from 'lucide-react-native';
import { useCart } from '../../contexts/CartContext';
import { formatXOF } from '../../lib/utils';

type CartItem = {
  product_id: string;
  product_name: string;
  brand: string;
  quantity: number;
  price_xof: number;
  pharmacy_name: string;
};

const CartScreen: React.FC = () => {
  const { items = [], removeItem, updateQuantity, total = 0, itemCount = 0 } = useCart();
  const [processing, setProcessing] = useState(false);

  const handleCheckout = async () => {
    if (itemCount === 0) {
      Alert.alert('Panier vide', 'Ajoutez des produits avant de commander');
      return;
    }

    setProcessing(true);
    try {
      Alert.alert(
        'Commande confirmée',
        `Commande passée avec succès. Total: ${formatXOF(total)}`,
        [
          {
            text: 'OK',
            onPress: () => setProcessing(false),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la commande');
      setProcessing(false);
    }
  };

  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }
    updateQuantity(productId, newQuantity);
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemImage}>
        <Text style={styles.itemInitial}>{item.product_name.charAt(0)}</Text>
      </View>

      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.product_name}</Text>
        <Text style={styles.itemBrand}>{item.brand}</Text>
        <Text style={styles.itemPharmacy}>{item.pharmacy_name}</Text>
      </View>

      <View style={styles.quantityControl}>
        <TouchableOpacity
          onPress={() => handleQuantityChange(item.product_id, item.quantity - 1)}
          style={styles.quantityButton}
        >
          <Minus size={14} color="#64748b" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          onPress={() => handleQuantityChange(item.product_id, item.quantity + 1)}
          style={styles.quantityButton}
        >
          <Plus size={14} color="#64748b" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <View style={styles.itemPrice}>
        <Text style={styles.itemPriceText}>
          {formatXOF(item.price_xof * item.quantity)}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => handleRemoveItem(item.product_id)}
        style={styles.deleteButton}
      >
        <Trash2 color="#dc2626" size={18} strokeWidth={1.5} />
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <ShoppingCart size={64} color="#cbd5e1" strokeWidth={1} />
      <Text style={styles.emptyTitle}>Votre panier est vide</Text>
      <Text style={styles.emptySubtext}>
        Commencez à ajouter des médicaments
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Panier</Text>
          {itemCount > 0 && (
            <View style={styles.itemCountBadge}>
              <Text style={styles.itemCountText}>{itemCount}</Text>
            </View>
          )}
        </View>

        {itemCount === 0 ? (
          renderEmpty()
        ) : (
          <>
            <FlatList
              data={items}
              renderItem={renderCartItem}
              keyExtractor={(item) => item.product_id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />

            <View style={styles.footer}>
              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Sous-total:</Text>
                <Text style={styles.totalAmount}>{formatXOF(total)}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.checkoutButton,
                  processing && styles.checkoutButtonDisabled,
                ]}
                onPress={handleCheckout}
                disabled={processing || itemCount === 0}
              >
                <Text style={styles.checkoutButtonText}>
                  {processing ? 'Traitement...' : 'Passer la commande'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#2563eb',
    borderRadius: 12,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    paddingBottom: 140,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  itemImage: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  itemPharmacy: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '500',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  quantityButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    marginHorizontal: 2,
    minWidth: 20,
    textAlign: 'center',
  },
  itemPrice: {
    minWidth: 50,
  },
  itemPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
    textAlign: 'right',
  },
  deleteButton: {
    padding: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563eb',
  },
  checkoutButton: {
    paddingVertical: 14,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default CartScreen;