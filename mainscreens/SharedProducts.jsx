import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import Spacing from '../constants/Spacing';
import FontSize from '../constants/FontSize';
import Colors from '../constants/Colors';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, query, where, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import useFetchUser from '../hooks/useFetchUser';
import Ionicons from '@expo/vector-icons/Ionicons';

const firebaseConfig = {
  apiKey: "AIzaSyBNcTckaLPZpAL3q5T_1KlJCDji_yjMs1A",
  authDomain: "flatbuddy-mk1.firebaseapp.com",
  projectId: "flatbuddy-mk1",
  storageBucket: "flatbuddy-mk1.appspot.com",
  messagingSenderId: "369948891874",
  appId: "1:369948891874:web:5dbe9d9c3616da160b9cbb",
  measurementId: "G-MTV0H8F1Y1"
};

const SharedProducts = () => {
  const [productName, setProductName] = useState('');
  const [sharedProducts, setSharedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { flatNum, flatMembUsernames, username } = useFetchUser();

  const app = initializeApp(firebaseConfig);
  const firestore = getFirestore(app);

  useEffect(() => {
    fetchSharedProducts();
  }, [flatNum]);

  const fetchSharedProducts = async () => {
    if (!flatNum) return;

    setLoading(true);
    const productsQuery = collection(firestore, 'sharedProducts');
    const querySnapshot = await getDocs(productsQuery);
    const productsData = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.flatID === flatNum) {
        productsData.push({ ...data, id: doc.id });
      }
    });

    setSharedProducts(productsData);
    setLoading(false);
  };

  const handleAddProduct = async () => {
    if (!productName) {
      alert('Please enter a product name');
      return;
    }

    try {
      const newProduct = {
        name: productName,
        flatID: flatNum,
        purchasedBy: flatMembUsernames[0],
        status: 'available',
      };

      const productRef = await addDoc(collection(firestore, 'sharedProducts'), newProduct);

      const flatQuery = query(collection(firestore, 'flats'), where('flatNum', '==', flatNum));
      const flatSnapshot = await getDocs(flatQuery);

      if (!flatSnapshot.empty) {
        const flatDoc = flatSnapshot.docs[0];
        await updateDoc(doc(firestore, 'flats', flatDoc.id), {
          activeProducts: arrayUnion(productRef.id),
        });
      }

      setProductName('');
      fetchSharedProducts();
    } catch (error) {
      alert('Error adding product: ' + error.message);
    }
  };

  const handleUseProduct = async (product) => {
    try {
      const nextUser = getNextUser(product.purchasedBy);
      const productRef = doc(firestore, 'sharedProducts', product.id);

      await updateDoc(productRef, {
        purchasedBy: nextUser,
        status: 'to be purchased',
      });

      fetchSharedProducts();
      alert(`Product used up. ${nextUser} will purchase next.`);
    } catch (error) {
      alert('Error updating product: ' + error.message);
    }
  };

  const handlePurchaseProduct = async (product) => {
    try {
      const productRef = doc(firestore, 'sharedProducts', product.id);

      await updateDoc(productRef, {
        status: 'available',
      });

      fetchSharedProducts();
      alert('Product status updated to available.');
    } catch (error) {
      alert('Error updating product: ' + error.message);
    }
  };

  const handleRemoveProduct = async (product) => {
    try {
      const productRef = doc(firestore, 'sharedProducts', product.id);

      const flatQuery = query(collection(firestore, 'flats'), where('flatNum', '==', flatNum));
      const flatSnapshot = await getDocs(flatQuery);

      if (!flatSnapshot.empty) {
        const flatDoc = flatSnapshot.docs[0];
        await updateDoc(doc(firestore, 'flats', flatDoc.id), {
          activeProducts: arrayRemove(product.id),
        });
      }

      await deleteDoc(productRef);

      fetchSharedProducts();
    } catch (error) {
      alert('Error removing product: ' + error.message);
    }
  };

  const getNextUser = (currentUser) => {
    const currentIndex = flatMembUsernames.indexOf(currentUser);
    const nextIndex = (currentIndex + 1) % flatMembUsernames.length;
    return flatMembUsernames[nextIndex];
  };

  const handleReload = () => {
    fetchSharedProducts();
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productItem}>
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productStatus}>Status: {item.status}</Text>
      <Text style={styles.productUser}>Purchaser: {item.purchasedBy}</Text>
      {item.status === 'available' && (
        <TouchableOpacity style={styles.useButton} onPress={() => handleUseProduct(item)}>
          <Text style={styles.useButtonText}>Use Up</Text>
        </TouchableOpacity>
      )}
      {item.status === 'to be purchased' && item.purchasedBy === username && (
        <TouchableOpacity style={styles.purchaseButton} onPress={() => handlePurchaseProduct(item)}>
          <Text style={styles.purchaseButtonText}>Purchased</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveProduct(item)}>
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shared Products</Text>
        <TouchableOpacity onPress={handleReload}>
          <Ionicons name="reload" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Enter product name"
        placeholderTextColor={Colors.text}
        value={productName}
        onChangeText={setProductName}
      />
      <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
        <Text style={styles.addButtonText}>Add Product</Text>
      </TouchableOpacity>
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} />
      ) : (
        <FlatList
          data={sharedProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.productList}
        />
      )}
    </View>
  );
};

export default SharedProducts;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing * 4,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.xxLarge,
    color: Colors.primary,
    marginBottom: Spacing * 3,
  },
  input: {
    width: '100%',
    padding: Spacing * 2,
    marginVertical: Spacing,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Spacing,
    color: Colors.text,
  },
  addButton: {
    backgroundColor: Colors.primary,
    padding: Spacing * 2,
    borderRadius: Spacing,
    alignItems: 'center',
    marginVertical: Spacing,
  },
  addButtonText: {
    color: Colors.onPrimary,
    fontSize: FontSize.large,
  },
  productList: {
    marginTop: Spacing * 2,
  },
  productItem: {
    backgroundColor: '#f9f9f9',
    padding: Spacing * 2,
    borderRadius: Spacing,
    marginBottom: Spacing,
  },
  productName: {
    fontSize: FontSize.large,
    color: Colors.primary,
  },
  productStatus: {
    fontSize: FontSize.medium,
    color: Colors.secondary,
  },
  productUser: {
    fontSize: FontSize.medium,
    color: Colors.secondary,
  },
  useButton: {
    marginTop: Spacing,
    backgroundColor: Colors.primary,
    padding: Spacing,
    borderRadius: Spacing,
    alignItems: 'center',
  },
  useButtonText: {
    color: Colors.onPrimary,
    fontSize: FontSize.medium,
  },
  purchaseButton: {
    marginTop: Spacing,
    backgroundColor: '#A020F0',
    padding: Spacing,
    borderRadius: Spacing,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: FontSize.medium,
    fontWeight: 'bold',
  },
  removeButton: {
    marginTop: Spacing,
    backgroundColor: '#ff4444',
    padding: Spacing,
    borderRadius: Spacing,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: FontSize.medium,
  },
});
