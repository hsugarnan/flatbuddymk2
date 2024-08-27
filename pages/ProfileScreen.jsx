import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, Image, ScrollView, RefreshControl, Alert } from 'react-native';
import Spacing from '../constants/Spacing';
import FontSize from '../constants/FontSize';
import Colors from '../constants/Colors';
import useFetchUser from '../hooks/useFetchUser';
import { auth, firestore } from '../config/firebase';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs, query, where, doc, setDoc, updateDoc, arrayRemove, deleteDoc } from 'firebase/firestore';
import { signOut, deleteUser } from 'firebase/auth';


const ProfileScreen = ({ route, navigation }) => {
  const [overdueChores, setOverdueChores] = useState([]);
  const [sharedProducts, setSharedProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [reload, setReload] = useState(false);
  const { user, username, flatNum, email, flatMembUsernames, flatMembImgLinks, flatName, loading, error, refetch, imgLink, flatMemb } = useFetchUser();

  useFocusEffect(
    useCallback(() => {
      if (route.params?.reload) {
        refetch();
        navigation.setParams({ reload: false }); // Reset the reload parameter
      }
    }, [route.params])
  );

  useEffect(() => {
    if (auth.currentUser && flatNum) {
      fetchOverdueChores();
      fetchSharedProducts();
    }
  }, [auth.currentUser, flatNum, reload]);

  const fetchOverdueChores = async () => {
    if (!flatNum) return;

    const choresQuery = query(collection(firestore, 'chores'), where('flatID', '==', flatNum));
    const querySnapshot = await getDocs(choresQuery);
    const overdueChores = [];
    const today = new Date().toISOString().split('T')[0];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      const date = data.date;

      if (new Date(date) < new Date(today)) {
        overdueChores.push({ ...data, id: doc.id });
      }
    });

    setOverdueChores(overdueChores);
  };

  const fetchSharedProducts = async () => {
    if (!flatNum) return;

    const productsQuery = query(collection(firestore, 'sharedProducts'), where('flatID', '==', flatNum));
    const querySnapshot = await getDocs(productsQuery);
    const productsData = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      productsData.push({ ...data, id: doc.id });
    });

    setSharedProducts(productsData);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchOverdueChores(), fetchSharedProducts(), refetch()]).then(() => setRefreshing(false));
  }, []);

  const handleReload = () => {
    setReload(!reload);
    refetch();
  };

  const renderOverdue = (username) => {
    const hasOverdueChores = overdueChores.some(chore => chore.userEmail === username);
    return (
      <View style={styles.statusContainer}>
        <Text key={username} style={styles.statusText}>
          {hasOverdueChores ? 'Overdue Chores' : 'No Overdue Chores'}
        </Text>
        {hasOverdueChores ? (
          <Entypo name="circle-with-cross" size={24} color="red" style={styles.icon} />
        ) : (
          <AntDesign name="checkcircle" size={24} color="green" style={styles.icon} />
        )}
      </View>
    );
  };

  const renderSharedProducts = (username) => {
    const hasProductsToPurchase = sharedProducts.some(product => product.purchasedBy === username && product.status === 'to be purchased');
    return (
      <View style={styles.statusContainer}>
        <Text key={username} style={styles.statusText}>
          {hasProductsToPurchase ? 'Products to Purchase' : 'No Products to Purchase'}
        </Text>
        {hasProductsToPurchase ? (
          <Entypo name="circle-with-cross" size={24} color="red" style={styles.icon} />
        ) : (
          <AntDesign name="checkcircle" size={24} color="green" style={styles.icon} />
        )}
      </View>
    );
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigation.replace('Login');
      })
      .catch((error) => {
        console.error('Error signing out: ', error);
      });
  };

  const handleLeaveFlat = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const userRef = doc(firestore, 'users', user.uid); // Reference to the user's document
        const flatQuery = query(collection(firestore, 'flats'), where('flatNum', '==', flatNum)); // Query to find the flat document with the matching flatNum
        const flatSnapshot = await getDocs(flatQuery); // Execute the query
        
        if (!flatSnapshot.empty) {
          const flatDoc = flatSnapshot.docs[0]; // Get the first matching flat document
          const flatRef = doc(firestore, 'flats', flatDoc.id); // Reference to the flat document

          // Update the user's flatNum to an empty string
          await setDoc(userRef, { flatNum: '' }, { merge: true });

          // Remove the user's email from the flat's list of members
          await updateDoc(flatRef, {
            userEmails: arrayRemove(user.email)
          });

          refetch(); // Refetch user data
          Alert.alert('Success', 'You have left the flat');
        } else {
          Alert.alert('Error', 'Flat not found');
        }
      } catch (error) {
        console.error('Error leaving flat: ', error);
        Alert.alert('Error', 'Failed to leave flat');
      }
    }
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    console.log('pressed')

    if (user) {
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete your account? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // Remove user document from Firestore
                await deleteDoc(doc(firestore, 'users', user.uid));

                // Remove user's email from the flat's userEmails array
                const flatQuery = query(collection(firestore, 'flats'), where('flatNum', '==', flatNum));
                const flatSnapshot = await getDocs(flatQuery);

                if (!flatSnapshot.empty) {
                  const flatDoc = flatSnapshot.docs[0];
                  const flatRef = doc(firestore, 'flats', flatDoc.id);

                  await updateDoc(flatRef, {
                    userEmails: arrayRemove(user.email),
                  });
                }

                // Delete user account
                await deleteUser(user);

                // Navigate to the Welcome screen or any other screen
                navigation.replace('Welcome');

              } catch (error) {
                console.error('Error deleting account: ', error);
                Alert.alert('Error', 'Failed to delete account.');
              }
            },
          },
        ]
      );
    }
  }; 


  const handleCreateFlat = () => {
    navigation.navigate('CreateFlat');
  };

  const handleJoinFlat = () => {
    navigation.navigate('JoinFlat');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (flatNum === "") {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleDeleteAccount}>
          <Text style={styles.logoutButtonText}>Delete Account</Text>
        </TouchableOpacity>
        <View style={styles.buttonOptions}>
          <Text style={styles.title}>No Flat Number Assigned</Text>
          <TouchableOpacity style={styles.button} onPress={handleJoinFlat}>
            <Text style={styles.buttonText}>Join a Flat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleCreateFlat}>
            <Text style={styles.buttonText}>Create a Flat</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>Name: {username}</Text>
          <Text style={styles.headerText}>Flat: {flatName}</Text>
          <Text style={styles.headerText}>Code: {flatNum}</Text>
        </View>
        <View style={styles.headerIconContainer}>
          <TouchableOpacity onPress={handleReload}>
            <Ionicons name="reload" size={24} color={Colors.onPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveFlat}>
            <Text style={styles.leaveButtonText}>Leave Flat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.leaveButton} onPress={handleDeleteAccount}>
            <Text style={styles.leaveButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.mainContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Occupants</Text>
        {flatMembUsernames.map((item, index) => (
          <View key={item} style={styles.occupantRow}>
            <View style={styles.leftColumn}>
              <Image
                source={{ uri: flatMembImgLinks[index] || 'https://via.placeholder.com/150' }}
                style={styles.profileImage}
              />
              <Text style={styles.arrayItem}>{item}</Text>
            </View>
            <View style={styles.rightColumn}>
              {renderOverdue(item)}
              {renderSharedProducts(item)}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing * 2,
    paddingHorizontal: Spacing * 1.5,
    borderBottomLeftRadius: Spacing,
    borderBottomRightRadius: Spacing,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerText: {
    fontSize: FontSize.large,
    color: Colors.onPrimary,
  },
  headerIconContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginRight: Spacing,
  },
  buttonContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  leaveButton: {
    padding: Spacing,
    backgroundColor: Colors.secondary,
    borderRadius: Spacing,
    marginRight: Spacing,
    width:150,
  },
  leaveButtonText: {
    color: Colors.onPrimary,
    fontSize: FontSize.medium,
  },
  logoutButton: {
    padding: Spacing,
    backgroundColor: Colors.onPrimary,
    borderRadius: Spacing,
    marginRight: Spacing,
    width:150
  },
  logoutButtonText: {
    color: Colors.primary,
    fontSize: FontSize.medium,
  },
  mainContent: {
    flexGrow: 1,
    paddingVertical: Spacing * 2,
    paddingHorizontal: Spacing * 1.5,
  },
  leftColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightColumn: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  occupantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing,
    paddingVertical: Spacing / 2,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Spacing,
  },
  arrayItem: {
    fontSize: FontSize.large,
    color: Colors.primary,
  },
  title: {
    fontSize: FontSize.xxLarge,
    color: Colors.primary,
    marginBottom: Spacing * 2,
  },
  loadingText: {
    fontSize: FontSize.large,
    color: Colors.primary,
    marginTop: Spacing * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  options: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonOptions: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing * 2,
    paddingHorizontal: Spacing * 4,
    borderRadius: Spacing,
    marginVertical: Spacing,
  },
  buttonText: {
    color: Colors.onPrimary,
    fontSize: FontSize.large,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8, // Adjusted for more space between items
    paddingHorizontal: 16, // Added padding to avoid edge clipping
  },
  statusText: {
    fontSize: FontSize.medium,
    color: Colors.primary,
    marginRight: Spacing,
  },
  icon: {
    marginLeft: Spacing/4, // Add margin to space out the icon from the text
    marginRight: Spacing/4, // Add margin to space out the icon from the edge
  },
});


///PREPADDING VERSION!!!! - ask about styling

// import React, { useCallback, useEffect, useState } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, Image, ScrollView, RefreshControl } from 'react-native';
// import Spacing from '../constants/Spacing';
// import FontSize from '../constants/FontSize';
// import Colors from '../constants/Colors';
// import useFetchUser from '../hooks/useFetchUser';
// import { auth, firestore } from '../config/firebase'; // Import from firebase.js
// import AntDesign from '@expo/vector-icons/AntDesign';
// import Entypo from '@expo/vector-icons/Entypo';
// import Ionicons from '@expo/vector-icons/Ionicons';
// import { useFocusEffect } from '@react-navigation/native';
// import { collection, getDocs, query, where, doc, setDoc, updateDoc, arrayRemove } from 'firebase/firestore';
// import { signOut } from 'firebase/auth';

// const ProfileScreen = ({ route, navigation }) => {
//   const [overdueChores, setOverdueChores] = useState([]);
//   const [sharedProducts, setSharedProducts] = useState([]);
//   const [refreshing, setRefreshing] = useState(false);
//   const [reload, setReload] = useState(false);
//   const { user, username, flatNum, email, flatMembUsernames, flatMembImgLinks, flatName, loading, error, refetch, imgLink, flatMemb } = useFetchUser();

//   useFocusEffect(
//     useCallback(() => {
//       if (route.params?.reload) {
//         refetch();
//         navigation.setParams({ reload: false }); // Reset the reload parameter
//       }
//     }, [route.params])
//   );

//   useEffect(() => {
//     if (auth.currentUser && flatNum) {
//       fetchOverdueChores();
//       fetchSharedProducts();
//     }
//   }, [auth.currentUser, flatNum, reload]);

//   const fetchOverdueChores = async () => {
//     if (!flatNum) return;

//     const choresQuery = query(collection(firestore, 'chores'), where('flatID', '==', flatNum));
//     const querySnapshot = await getDocs(choresQuery);
//     const overdueChores = [];
//     const today = new Date().toISOString().split('T')[0];

//     querySnapshot.forEach(doc => {
//       const data = doc.data();
//       const date = data.date;

//       if (new Date(date) < new Date(today)) {
//         overdueChores.push({ ...data, id: doc.id });
//       }
//     });

//     setOverdueChores(overdueChores);
//   };

//   const fetchSharedProducts = async () => {
//     if (!flatNum) return;

//     const productsQuery = query(collection(firestore, 'sharedProducts'), where('flatID', '==', flatNum));
//     const querySnapshot = await getDocs(productsQuery);
//     const productsData = [];

//     querySnapshot.forEach(doc => {
//       const data = doc.data();
//       productsData.push({ ...data, id: doc.id });
//     });

//     setSharedProducts(productsData);
//   };

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     Promise.all([fetchOverdueChores(), fetchSharedProducts(), refetch()]).then(() => setRefreshing(false));
//   }, []);

//   const handleReload = () => {
//     setReload(!reload);
//     refetch();
//   };

//   const renderOverdue = (username) => {
//     const hasOverdueChores = overdueChores.some(chore => chore.userEmail === username);
//     return (
//       <View style={styles.statusContainer}>
//         <Text key={username} style={styles.statusText}>
//           {hasOverdueChores ? 'Overdue Chores' : 'No Overdue Chores'}
//         </Text>
//         {hasOverdueChores ? (
//           <Entypo name="circle-with-cross" size={24} color="red" style={styles.icon} />
//         ) : (
//           <AntDesign name="checkcircle" size={24} color="green" style={styles.icon} />
//         )}
//       </View>
//     );
//   };

//   const renderSharedProducts = (username) => {
//     const hasProductsToPurchase = sharedProducts.some(product => product.purchasedBy === username && product.status === 'to be purchased');
//     return (
//       <View style={styles.statusContainer}>
//         <Text key={username} style={styles.statusText}>
//           {hasProductsToPurchase ? 'Products to Purchase' : 'No Products to Purchase'}
//         </Text>
//         {hasProductsToPurchase ? (
//           <Entypo name="circle-with-cross" size={24} color="red" style={styles.icon} />
//         ) : (
//           <AntDesign name="checkcircle" size={24} color="green" style={styles.icon} />
//         )}
//       </View>
//     );
//   };

//   const handleLogout = () => {
//     signOut(auth)
//       .then(() => {
//         navigation.replace('Login');
//       })
//       .catch((error) => {
//         console.error('Error signing out: ', error);
//       });
//   };

//   const handleLeaveFlat = async () => {
//     const user = auth.currentUser;
//     if (user) {
//       try {
//         const userRef = doc(firestore, 'users', user.uid); // Reference to the user's document
//         const flatQuery = query(collection(firestore, 'flats'), where('flatNum', '==', flatNum)); // Query to find the flat document with the matching flatNum
//         const flatSnapshot = await getDocs(flatQuery); // Execute the query
        
//         if (!flatSnapshot.empty) {
//           const flatDoc = flatSnapshot.docs[0]; // Get the first matching flat document
//           const flatRef = doc(firestore, 'flats', flatDoc.id); // Reference to the flat document

//           // Update the user's flatNum to an empty string
//           await setDoc(userRef, { flatNum: '' }, { merge: true });

//           // Remove the user's email from the flat's list of members
//           await updateDoc(flatRef, {
//             userEmails: arrayRemove(user.email)
//           });

//           refetch(); // Refetch user data
//           Alert.alert('Success', 'You have left the flat');
//         } else {
//           Alert.alert('Error', 'Flat not found');
//         }
//       } catch (error) {
//         console.error('Error leaving flat: ', error);
//         Alert.alert('Error', 'Failed to leave flat');
//       }
//     }
//   };

//   const handleCreateFlat = () => {
//     navigation.navigate('CreateFlat');
//   };

//   const handleJoinFlat = () => {
//     navigation.navigate('JoinFlat');
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={Colors.primary} />
//         <Text style={styles.loadingText}>Loading...</Text>
//       </View>
//     );
//   }

//   if (flatNum === "") {
//     return (
//       <View style={styles.container}>
//         <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
//           <Text style={styles.logoutButtonText}>Logout</Text>
//         </TouchableOpacity>
//         <View style={styles.buttonOptions}>
//           <Text style={styles.title}>No Flat Number Assigned</Text>
//           <TouchableOpacity style={styles.button} onPress={handleJoinFlat}>
//             <Text style={styles.buttonText}>Join a Flat</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.button} onPress={handleCreateFlat}>
//             <Text style={styles.buttonText}>Create a Flat</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <View style={styles.headerTextContainer}>
//           <Text style={styles.headerText}>Name: {username}</Text>
//           <Text style={styles.headerText}>Flat: {flatName}</Text>
//           <Text style={styles.headerText}>Code: {flatNum}</Text>
//         </View>
//         <View style={styles.headerIconContainer}>
//           <TouchableOpacity onPress={handleReload}>
//             <Ionicons name="reload" size={24} color={Colors.onPrimary} />
//           </TouchableOpacity>
//         </View>
//         <View style={styles.buttonContainer}>
//           <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveFlat}>
//             <Text style={styles.leaveButtonText}>Leave Flat</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
//             <Text style={styles.logoutButtonText}>Logout</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       <ScrollView
//         contentContainerStyle={styles.mainContent}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//       >
//         <Text style={styles.title}>Occupants</Text>
//         {flatMembUsernames.map((item, index) => (
//           <View key={item} style={styles.occupantRow}>
//             <View style={styles.leftColumn}>
//               <Image
//                 source={{ uri: flatMembImgLinks[index] || 'https://via.placeholder.com/150' }}
//                 style={styles.profileImage}
//               />
//               <Text style={styles.arrayItem}>{item}</Text>
//             </View>
//             <View style={styles.rightColumn}>
//               {renderOverdue(item)}
//               {renderSharedProducts(item)}
//             </View>
//           </View>
//         ))}
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// export default ProfileScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     backgroundColor: Colors.primary,
//     paddingVertical: Spacing * 2,
//     paddingHorizontal: Spacing * 1.5,
//     borderBottomLeftRadius: Spacing,
//     borderBottomRightRadius: Spacing,
//   },
//   headerTextContainer: {
//     flex: 1,
//   },
//   headerText: {
//     fontSize: FontSize.large,
//     color: Colors.onPrimary,
//   },
//   headerIconContainer: {
//     justifyContent: 'flex-end',
//     alignItems: 'center',
//     marginRight: Spacing,
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   leaveButton: {
//     padding: Spacing,
//     backgroundColor: Colors.secondary,
//     borderRadius: Spacing,
//     marginRight: Spacing,
//   },
//   leaveButtonText: {
//     color: Colors.onPrimary,
//     fontSize: FontSize.medium,
//   },
//   logoutButton: {
//     padding: Spacing,
//     backgroundColor: Colors.onPrimary,
//     borderRadius: Spacing,
//   },
//   logoutButtonText: {
//     color: Colors.primary,
//     fontSize: FontSize.medium,
//   },
//   mainContent: {
//     flexGrow: 1,
//     paddingVertical: Spacing * 2,
//     paddingHorizontal: Spacing * 1.5,
//   },
//   leftColumn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   rightColumn: {
//     flex: 1,
//     alignItems: 'flex-start',
//     justifyContent: 'center',
//   },
//   occupantRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginVertical: Spacing,
//     paddingVertical: Spacing / 2,
//   },
//   profileImage: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     marginRight: Spacing,
//   },
//   arrayItem: {
//     fontSize: FontSize.large,
//     color: Colors.primary,
//   },
//   title: {
//     fontSize: FontSize.xxLarge,
//     color: Colors.primary,
//     marginBottom: Spacing * 2,
//   },
//   loadingText: {
//     fontSize: FontSize.large,
//     color: Colors.primary,
//     marginTop: Spacing * 2,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//   },
//   options: {
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   buttonOptions: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     flex: 1,
//   },
//   button: {
//     backgroundColor: Colors.primary,
//     paddingVertical: Spacing * 2,
//     paddingHorizontal: Spacing * 4,
//     borderRadius: Spacing,
//     marginVertical: Spacing,
//   },
//   buttonText: {
//     color: Colors.onPrimary,
//     fontSize: FontSize.large,
//   },
//   statusContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 2,
//   },
//   statusText: {
//     fontSize: FontSize.medium,
//     color: Colors.primary,
//     marginRight: Spacing,
//   },
//   icon: {},
// });