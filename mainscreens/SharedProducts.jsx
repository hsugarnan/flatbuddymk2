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
  const [activeTab, setActiveTab] = useState('products'); 
  const [productName, setProductName] = useState('');
  const [sharedProducts, setSharedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // EXPENSE STATE
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseUser, setExpenseUser] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenses, setExpenses] = useState([]);

  const { flatNum, flatMembUsernames, username } = useFetchUser();

  const app = initializeApp(firebaseConfig);
  const firestore = getFirestore(app);

  useEffect(() => {
    fetchSharedProducts();
    fetchExpenses();
  }, [flatNum]);

  // ------------------------------
  // PRODUCTS
  // ------------------------------
  const fetchSharedProducts = async () => {
    if (!flatNum) return;

    setLoading(true);
    const productsQuery = collection(firestore, 'sharedProducts');
    const querySnapshot = await getDocs(productsQuery);
    const productsData = [];

    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.flatID === flatNum) {
        productsData.push({ ...data, id: docSnap.id });
      }
    });

    setSharedProducts(productsData);
    setLoading(false);
  };

  const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [array[currentIndex], array[randomIndex]] =
        [array[randomIndex], array[currentIndex]];
    }
    return array;
  };

  const handleAddProduct = async () => {
    if (!productName) {
      alert('Please enter a product name');
      return;
    }

    try {
      const shuffled = shuffleArray([...flatMembUsernames]);
      const nextUser = shuffled[0];

      const newProduct = {
        name: productName,
        flatID: flatNum,
        purchasedBy: nextUser,
        status: 'available',
      };

      const ref = await addDoc(collection(firestore, 'sharedProducts'), newProduct);

      const flatQuery = query(collection(firestore, 'flats'), where('flatNum', '==', flatNum));
      const flatSnapshot = await getDocs(flatQuery);

      if (!flatSnapshot.empty) {
        const flatDoc = flatSnapshot.docs[0];
        await updateDoc(doc(firestore, 'flats', flatDoc.id), {
          activeProducts: arrayUnion(ref.id),
        });
      }

      setProductName('');
      fetchSharedProducts();
    } catch (error) {
      alert(error.message);
    }
  };

  const getNextUser = (currentUser) => {
    const i = flatMembUsernames.indexOf(currentUser);
    return flatMembUsernames[(i + 1) % flatMembUsernames.length];
  };

  const handleUseProduct = async (product) => {
    try {
      const next = getNextUser(product.purchasedBy);
      const ref = doc(firestore, 'sharedProducts', product.id);

      await updateDoc(ref, {
        purchasedBy: next,
        status: 'to be purchased',
      });

      fetchSharedProducts();
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePurchaseProduct = async (product) => {
    try {
      const ref = doc(firestore, 'sharedProducts', product.id);

      await updateDoc(ref, { status: 'available' });
      fetchSharedProducts();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRemoveProduct = async (product) => {
    try {
      const ref = doc(firestore, 'sharedProducts', product.id);

      const flatQuery = query(collection(firestore, 'flats'), where('flatNum', '==', flatNum));
      const flatSnapshot = await getDocs(flatQuery);

      if (!flatSnapshot.empty) {
        const flatDoc = flatSnapshot.docs[0];
        await updateDoc(doc(firestore, 'flats', flatDoc.id), {
          activeProducts: arrayRemove(product.id),
        });
      }

      await deleteDoc(ref);
      fetchSharedProducts();
    } catch (error) {
      alert(error.message);
    }
  };

  // ------------------------------
  // EXPENSES
  // ------------------------------
  const fetchExpenses = async () => {
    if (!flatNum) return;

    const queryRef = collection(firestore, 'expenses');
    const snap = await getDocs(queryRef);

    const data = [];
    snap.forEach(docSnap => {
      if (docSnap.data().flatID === flatNum) {
        data.push({ id: docSnap.id, ...docSnap.data() });
      }
    });

    setExpenses(data);
  };

  const addExpense = async () => {
    if (!expenseAmount || !expenseDesc || !expenseUser) {
      alert("Enter all fields");
      return;
    }

    await addDoc(collection(firestore, 'expenses'), {
      amount: parseFloat(expenseAmount),
      description: expenseDesc,
      addedBy: username,
      expenseUser,
      flatID: flatNum,
      settled: false,
      createdAt: new Date(),
    });

    setExpenseAmount('');
    setExpenseDesc('');
    setExpenseUser('');
    fetchExpenses();
  };

  const settleExpense = async (expense) => {
    try {
      const ref = doc(firestore, 'expenses', expense.id);

      await updateDoc(ref, { settled: true });

      fetchExpenses();
    } catch (err) {
      alert("Error settling expense: " + err.message);
    }
  };

  // ------------------------------
  // UI RENDERING
  // ------------------------------
  const renderProduct = ({ item }) => (
    <View style={styles.productItem}>
      <Text style={styles.productName}>{item.name}</Text>
      <Text>Status: {item.status}</Text>
      <Text>Purchaser: {item.purchasedBy}</Text>

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

  // -------------------------------
  // MAIN RETURN
  // -------------------------------
  return (
    <View style={styles.container}>

      {/* BEAUTIFUL PURPLE SEGMENT TOGGLE */}
      <View style={styles.header}>
        <View style={styles.segmentWrapper}>
          <View style={styles.segmentBackground}>

            <TouchableOpacity
              style={[styles.segmentButton, activeTab === "products" && styles.segmentButtonActive]}
              onPress={() => setActiveTab("products")}
            >
              <Text style={[styles.segmentText, activeTab === "products" && styles.segmentTextActive]}>
                Products
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentButton, activeTab === "expenses" && styles.segmentButtonActive]}
              onPress={() => setActiveTab("expenses")}
            >
              <Text style={[styles.segmentText, activeTab === "expenses" && styles.segmentTextActive]}>
                Expenses
              </Text>
            </TouchableOpacity>

          </View>
        </View>

        <TouchableOpacity onPress={fetchSharedProducts}>
          <Ionicons name="reload" size={24} color={Colors.primary}/>
        </TouchableOpacity>
      </View>

      {/* ---------------- PRODUCTS UI ---------------- */}
      {activeTab === 'products' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter product name"
            value={productName}
            onChangeText={setProductName}
          />

          <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
            <Text style={styles.addButtonText}>Add Product</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large"/>
          ) : (
            <FlatList
              data={sharedProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
            />
          )}
        </>
      )}

      {/* ---------------- EXPENSE UI ---------------- */}
      {activeTab === 'expenses' && (
        <View style={styles.expenseContainer}>

          {/* FORM CARD */}
          <View style={styles.expenseCard}>
            <Text style={styles.sectionTitle}>Add New Expense</Text>

            <TextInput
              placeholder="Description"
              value={expenseDesc}
              onChangeText={setExpenseDesc}
              style={styles.input}
            />

            <TextInput
              placeholder="Amount (£)"
              value={expenseAmount}
              onChangeText={setExpenseAmount}
              keyboardType="numeric"
              style={styles.input}
            />

            <Text style={styles.subHeading}>Assign to:</Text>

            <View style={styles.userGrid}>
              {flatMembUsernames.map(member => (
                <TouchableOpacity
                  key={member}
                  style={[
                    styles.userPill,
                    expenseUser === member && styles.userPillSelected
                  ]}
                  onPress={() => setExpenseUser(member)}
                >
                  <Text
                    style={[
                      styles.userPillText,
                      expenseUser === member && styles.userPillTextSelected
                    ]}
                  >
                    {member}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.addExpenseButton} onPress={addExpense}>
              <Text style={styles.addExpenseButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>

          {/* EXPENSE HISTORY */}
          <Text style={styles.sectionTitle}>Expense History</Text>

          <FlatList
            data={expenses.filter(e => !e.settled)}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.emptyText}>No outstanding expenses</Text>}
            renderItem={({ item }) => (
              <View style={styles.expenseItemCard}>

                <View style={styles.expenseRow}>
                  <Text style={styles.expenseItemTitle}>{item.description}</Text>
                  <Text style={styles.expenseAmount}>£{item.amount}</Text>
                </View>

                <Text style={styles.expenseMeta}>
                  Added by <Text style={styles.bold}>{item.addedBy}</Text>
                </Text>

                {item.expenseUser && (
                  <Text style={styles.expenseMeta}>
                    Assigned to <Text style={styles.bold}>{item.expenseUser}</Text>
                  </Text>
                )}

                {/* SETTLE UP BUTTON */}
                {!item.settled ? (
                  <TouchableOpacity
                    style={styles.settleButton}
                    onPress={() => settleExpense(item)}
                  >
                    <Text style={styles.settleButtonText}>
                      {username === item.expenseUser ? "Settle Up" : "Mark as Settled"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.settledText}>✓ Settled</Text>
                )}

              </View>
            )}
          />
        </View>
      )}

    </View>
  );
};

export default SharedProducts;

//
// --------------------- STYLES ---------------------
//

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing * 4,
    backgroundColor: "#FFF",
  },

  // SEGMENT SWITCH
  segmentWrapper: {
    width: "70%",
  },
  segmentBackground: {
    flexDirection: "row",
    backgroundColor: "#A24BF4",
    borderRadius: 30,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: "center",
  },
  segmentButtonActive: {
    backgroundColor: "white",
  },
  segmentText: {
    color: "white",
    fontSize: FontSize.medium,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: "#A24BF4",
    fontWeight: "700",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  // INPUT
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },

  addButton: {
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  addButtonText: {
    color: Colors.onPrimary,
    fontWeight: "700",
  },

  // PRODUCT ITEMS
  productItem: {
    backgroundColor: "#f5f5f5",
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
  },
  productName: {
    fontWeight: "700",
    color: Colors.primary,
    fontSize: FontSize.large,
  },
  useButton: {
    marginTop: 10,
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  useButtonText: {
    color: "#FFF",
  },
  purchaseButton: {
    marginTop: 10,
    backgroundColor: "#A020F0",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  purchaseButtonText: {
    color: "#FFF",
  },
  removeButton: {
    marginTop: 10,
    backgroundColor: "#ff4444",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  removeButtonText: {
    color: "#FFF",
  },

  // EXPENSE UI
  expenseContainer: {
    marginTop: 10,
  },

  sectionTitle: {
    fontSize: FontSize.large,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 10,
  },

  expenseCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },

  subHeading: {
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 6,
  },

  userGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  userPill: {
    backgroundColor: "#eee",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  userPillSelected: {
    backgroundColor: Colors.primary,
  },
  userPillText: {
    color: "#333",
  },
  userPillTextSelected: {
    color: "white",
    fontWeight: "700",
  },

  addExpenseButton: {
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  addExpenseButtonText: {
    color: "white",
    fontWeight: "700",
  },

  expenseItemCard: {
    backgroundColor: "#fafafa",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 14,
  },

  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  expenseItemTitle: {
    fontSize: FontSize.large,
    fontWeight: "700",
    color: Colors.primary,
  },
  expenseAmount: {
    fontSize: FontSize.large,
    fontWeight: "700",
    color: "#4CAF50",
  },

  expenseMeta: {
    color: "#777",
    marginTop: 4,
  },
  bold: {
    fontWeight: "700",
  },

  // SETTLE UP BUTTON
  settleButton: {
    backgroundColor: "#4CAF50",
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  settleButtonText: {
    color: "white",
    fontWeight: "700",
  },
  settledText: {
    marginTop: 10,
    color: "#4CAF50",
    fontWeight: "800",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#777",
  },
});
