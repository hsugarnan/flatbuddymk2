import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, Image,
  ScrollView, RefreshControl, Alert, Modal, TextInput, Platform, KeyboardAvoidingView
} from 'react-native';
import Spacing from '../constants/Spacing';
import FontSize from '../constants/FontSize';
import Colors from '../constants/Colors';
import useFetchUser from '../hooks/useFetchUser';
import { auth, firestore } from '../config/firebase';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Device from 'expo-device';               //for checking if the app is running on a physical device
import * as Notifications from 'expo-notifications'; //for handling notifications
import Constants from 'expo-constants';              //for accessing app constants (e.g., project ID)
import { useFocusEffect } from '@react-navigation/native';
import {
  collection, query, where, getDocs, addDoc, onSnapshot, orderBy, serverTimestamp, deleteDoc, doc, updateDoc, setDoc 
} from 'firebase/firestore';
import { signOut, deleteUser } from 'firebase/auth';
import { Picker } from '@react-native-picker/picker'; //import Picker component



const ProfileScreen = ({ route, navigation }) => {
    // --- FlatBoard State ---
    const [flatBoardPosts, setFlatBoardPosts] = useState([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [addingPost, setAddingPost] = useState(false);
    // --- Fetch FlatBoard Posts ---
   
    // --- Add New FlatBoard Post ---
    const handleAddFlatBoardPost = async () => {
      if (!newPostContent.trim() || !flatNum || !user) return;
      setAddingPost(true);
      try {
        const postsRef = collection(firestore, 'flatboards', flatNum, 'posts');
        await addDoc(postsRef, {
          content: newPostContent.trim(),
          createdBy: user.uid,
          createdByName: username,
          createdAt: serverTimestamp(),
          type: 'note',
        });
        setNewPostContent('');
      } catch (error) {
        console.error('Error adding flatboard post:', error);
        Alert.alert('Error', 'Could not add post.');
      }
      setAddingPost(false);
    };

    // --- Delete FlatBoard Post ---
    const handleDeleteFlatBoardPost = async (postId) => {
      try {
        const postRef = doc(firestore, 'flatboards', flatNum, 'posts', postId);
        await deleteDoc(postRef);
      } catch (error) {
        console.error('Error deleting flatboard post:', error);
        Alert.alert('Error', 'Could not delete post.');
      }
    };
  const [overdueChores, setOverdueChores] = useState([]);
  const [sharedProducts, setSharedProducts] = useState([]);
  const [mess, setMess] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [reload, setReload] = useState(false);
  const [expenseUser, setExpenseUser] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [messName, setMessName] = useState('');
  const [userExpenses, setUserExpenses] = useState([]);
  const [messDescription, setMessDescription] = useState('');
  const [messResponsible, setMessResponsible] = useState('');
  const { user, username, flatNum, email, flatMembUsernames, flatMembImgLinks, flatMembVacated, isVacated, flatName, loading, error, refetch, imgLink, flatMemb } = useFetchUser();

  useFocusEffect(
    useCallback(() => {
      if (route.params?.reload) {
        refetch();
        navigation.setParams({ reload: false });
      }
    }, [route.params])
  );

  useEffect(() => {
    if (auth.currentUser && flatNum) {
      fetchOverdueChores();
      fetchUserExpenses(); 
      fetchSharedProducts();
      fetchMessData();
      registerForPushNotificationsAsync();

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

  const renderExpensesStatus = (username) => {
    const hasOutstandingExpenses = userExpenses.some(
      expense => expense.expenseUser === username
    );
  
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {hasOutstandingExpenses ? "Outstanding Expenses" : "No Outstanding Expenses"}
        </Text>
        {hasOutstandingExpenses ? (
          <Entypo name="circle-with-cross" size={24} color="red" style={styles.icon} />
        ) : (
          <AntDesign name="checkcircle" size={24} color="green" style={styles.icon} />
        )}
      </View>
    );
  };
  




  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchOverdueChores(), fetchSharedProducts(), fetchUserExpenses(), fetchMessData(),refetch()]).then(() => setRefreshing(false));
  }, []);

  const handleReload = () => {
    setReload(!reload);
    refetch();
  };



  async function requestPermissions() {
    if (Device.isDevice) {  //ensures this is running on a physical device
      const { status: existingStatus } = await Notifications.getPermissionsAsync(); //check current permission status
      let finalStatus = existingStatus;
  
      if (existingStatus !== 'granted') {  //if not already granted, request permission
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
  
      if (finalStatus !== 'granted') {  //if permission is still not granted, alert the user
        alert('Failed to get push token for push notification!');
        return false;
      }
  
      return true;  //return true if permission is granted
    } else {
      alert('Must use physical device for Push Notifications');  //alert if not on a physical device
      return false;
    }
  }
  
  async function registerForPushNotificationsAsync() {
    let token;
    if (Platform.OS === 'android' || Platform.OS === 'ios') {  //checks if the app is running on a physical device
      const hasPermission = await requestPermissions();  //call the permission request function
      if (!hasPermission) return;  //if permissions are not granted, exit the function
  
      token = await Notifications.getExpoPushTokenAsync({  //if permissions are granted, get the FCM token
        projectId: Constants.expoConfig?.extra?.eas.projectId,
      });
      console.log(token);  //log the token or send it to your backend
      await savePushTokenToFirestore(user.uid,token)
  
      //additional Android-specific settings
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    } else {
      alert('Must use physical device for Push Notifications');  //alert if not on a physical device
    }
    
    return token;  //return the FCM token
  }

  const fetchUserExpenses = async () => {
    if (!flatNum) return;
  
    const expensesQuery = query(
      collection(firestore, 'expenses'),
      where('flatID', '==', flatNum)
    );
    const snapshot = await getDocs(expensesQuery);
  
    const expenseList = [];
  
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (!data.settled) {
        expenseList.push({ ...data, id: docSnap.id });
      }
    });
  
    setUserExpenses(expenseList);
  };
  

  const savePushTokenToFirestore = async (userId, token) => {
    try {
      //reference to the user's document
      const userRef = doc(firestore, 'users', userId);
      
      //set the push token in the user's document
      await setDoc(userRef, { expoPushToken: token }, { merge: true });
  
      //log success message
      console.log(`Push token for user ${userId} saved successfully.`);
      
      //optionally, return a confirmation message
      return { success: true, message: `Push token saved for user ${userId}` };
    } catch (error) {
      //log error message
      console.error('Error saving push token:', error);
      
      //optionally, return an error message
      return { success: false, message: 'Failed to save push token', error };
    }
  };

  const renderOverdue = (username) => {
    // Find if the provided username has overdue chores
    const hasOverdueChores = overdueChores.some(chore => chore.userEmail === username);
    
    // Console log all usernames with overdue chores
    if (hasOverdueChores) {
      const overdueUsernames = overdueChores
        .filter(chore => chore.userEmail)
        .map(chore => chore.userEmail);
        
      console.log('Usernames with overdue chores:', [...new Set(overdueUsernames)]); // Log unique usernames
    }
    
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

  const handleUserPress = (username) => {
    setSelectedUser(username);
  };


 
  const issueCheck = (username) => {
    //determine if the user has mess responsibilities
    const hasMess = mess.some(item => item.messResponsible === username);

    const hasExpenses = userExpenses.some(
      expense => expense.expenseUser === username
    );
    
    //determine if the user has shared products to purchase
    const hasSharedProducts = sharedProducts.some(product => product.purchasedBy === username && product.status === 'to be purchased');
    
    //determine if the user has overdue chores
    const hasOverdueChores = overdueChores.some(chore => chore.userEmail === username);
  
    
  
    //return the cross icon if any issues are found
    if (hasMess || hasSharedProducts || hasOverdueChores || hasExpenses) {
      return <AntDesign name="exclamationcircle" size={24} color="red" style={styles.icon} />;
    }
  
    //return null if no issues are found
    return null;
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
        const userRef = doc(firestore, 'users', user.uid);
        const flatQuery = query(collection(firestore, 'flats'), where('flatNum', '==', flatNum));
        const flatSnapshot = await getDocs(flatQuery);
        
        if (!flatSnapshot.empty) {
          const flatDoc = flatSnapshot.docs[0];
          const flatRef = doc(firestore, 'flats', flatDoc.id);

          await setDoc(userRef, { flatNum: '' }, { merge: true });

          await updateDoc(flatRef, {
            userEmails: arrayRemove(user.email)
          });

          refetch();
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

  // --- Reassign Chores Function (when user vacates) ---
  // --- Reassign All Chores Fairly (when user vacates) ---
  const reassignVacatedUserChores = async (vacatedUsername) => {
    if (!flatNum) return;

    // Get active flatmates (excluding the vacating user)
    const activeFlatmates = flatMembUsernames.filter((u, index) => 
      u !== vacatedUsername && !flatMembVacated[index]
    );

    if (activeFlatmates.length === 0) {
      console.log('No active flatmates to reassign chores to');
      return;
    }

    // Get ALL future chores for this flat (not just the vacating user's)
    const today = new Date().toISOString().split('T')[0];
    const choresQuery = query(
      collection(firestore, 'chores'),
      where('flatID', '==', flatNum)
    );
    
    const querySnapshot = await getDocs(choresQuery);
    
    // Group chores by choreName, only including future chores
    const choresByName = {};
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.date >= today) {
        if (!choresByName[data.choreName]) {
          choresByName[data.choreName] = [];
        }
        choresByName[data.choreName].push({ id: docSnap.id, ...data });
      }
    });

    // For each chore type, redistribute fairly among active flatmates
    let totalReassigned = 0;
    for (const choreName in choresByName) {
      const choreInstances = choresByName[choreName];
      
      // Sort by date
      choreInstances.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Redistribute round-robin to all active flatmates
      for (let i = 0; i < choreInstances.length; i++) {
        const chore = choreInstances[i];
        const newAssignee = activeFlatmates[i % activeFlatmates.length];
        
        // Only update if assignee changed
        if (chore.userEmail !== newAssignee) {
          const choreRef = doc(firestore, 'chores', chore.id);
          await updateDoc(choreRef, { userEmail: newAssignee });
          totalReassigned++;
        }
      }
    }

    console.log(`Redistributed ${totalReassigned} chores fairly among ${activeFlatmates.length} active flatmates`);
  };

  // --- Redistribute All Chores Fairly (when user returns) ---
  const redistributeAllChoresFairly = async (returningUsername) => {
    if (!flatNum) return;

    // Get all flatmates including the returning user (they're now active)
    // We need to include the returning user manually since flatMembVacated hasn't updated yet
    const allActiveFlatmates = flatMembUsernames.filter((u, index) => 
      u === returningUsername || !flatMembVacated[index]
    );

    if (allActiveFlatmates.length === 0) {
      console.log('No active flatmates');
      return;
    }

    // Get all future chores for this flat
    const today = new Date().toISOString().split('T')[0];
    const choresQuery = query(
      collection(firestore, 'chores'),
      where('flatID', '==', flatNum)
    );
    
    const querySnapshot = await getDocs(choresQuery);
    
    // Group chores by choreName, only including future chores
    const choresByName = {};
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.date >= today) {
        if (!choresByName[data.choreName]) {
          choresByName[data.choreName] = [];
        }
        choresByName[data.choreName].push({ id: docSnap.id, ...data });
      }
    });

    // For each chore type, redistribute fairly
    for (const choreName in choresByName) {
      const choreInstances = choresByName[choreName];
      
      // Sort by date
      choreInstances.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Redistribute round-robin to all active flatmates
      for (let i = 0; i < choreInstances.length; i++) {
        const chore = choreInstances[i];
        const newAssignee = allActiveFlatmates[i % allActiveFlatmates.length];
        
        // Only update if assignee changed
        if (chore.userEmail !== newAssignee) {
          const choreRef = doc(firestore, 'chores', chore.id);
          await updateDoc(choreRef, { userEmail: newAssignee });
        }
      }
    }

    console.log(`Redistributed chores fairly among ${allActiveFlatmates.length} flatmates`);
  };

  // --- Vacate Flat Function ---
  const handleVacateFlat = () => {
    Alert.alert(
      'Vacate Flat',
      'Are you sure you want to vacate the flat? Your upcoming chores will be reassigned to other flatmates until you return.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Vacate',
          style: 'destructive',
          onPress: async () => {
            try {
              // First reassign chores to other flatmates
              await reassignVacatedUserChores(username);
              
              // Then mark user as vacated
              const userRef = doc(firestore, 'users', auth.currentUser.uid);
              await updateDoc(userRef, { vacated: true });
              refetch();
              Alert.alert('Success', 'You have vacated the flat. Your chores have been reassigned to other flatmates.');
            } catch (error) {
              console.error('Error vacating flat:', error);
              Alert.alert('Error', 'Failed to vacate flat.');
            }
          },
        },
      ]
    );
  };

  // --- Return to Flat Function ---
  const handleReturnToFlat = () => {
    Alert.alert(
      'Return to Flat',
      'Welcome back! Your chores will be fairly redistributed among all flatmates.',
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Yes, I\'m Back!',
          onPress: async () => {
            try {
              // First mark user as not vacated
              const userRef = doc(firestore, 'users', auth.currentUser.uid);
              await updateDoc(userRef, { vacated: false });
              
              // Redistribute all future chores fairly among all flatmates (including returning user)
              await redistributeAllChoresFairly(username);
              
              refetch();
              Alert.alert('Welcome Back!', 'You have been added back to all rotations and chores have been redistributed fairly.');
            } catch (error) {
              console.error('Error returning to flat:', error);
              Alert.alert('Error', 'Failed to return to flat.');
            }
          },
        },
      ]
    );
  };

   useEffect(() => {
      if (!flatNum) return;
      const postsRef = collection(firestore, 'flatboards', flatNum, 'posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('FlatBoard Posts:', posts);
        setFlatBoardPosts(posts);
      });
      return () => unsubscribe();
    }, [flatNum]);


  const handleDeleteAccount = async () => {
    const user = auth.currentUser;

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
                await deleteDoc(doc(firestore, 'users', user.uid));

                const flatQuery = query(collection(firestore, 'flats'), where('flatNum', '==', flatNum));
                const flatSnapshot = await getDocs(flatQuery);

                if (!flatSnapshot.empty) {
                  const flatDoc = flatSnapshot.docs[0];
                  const flatRef = doc(firestore, 'flats', flatDoc.id);

                  await updateDoc(flatRef, {
                    userEmails: arrayRemove(user.email),
                  });
                }

                await deleteUser(user);

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

  const handleReportMess = () => {
    setShowReportModal(true);
  };

  const handleReportSubmit = async () => {
    try {
      //access the 'mess' collection in Firestore
      const messCollection = collection(firestore, 'mess');
      
      //add a new document to the 'mess' collection with the provided data
      await addDoc(messCollection, {
        messName: messName,
        messDescription: messDescription,
        messResponsible: messResponsible,
        flatCode: flatNum //assuming flatNum is the code of the flat, you should pass it as an argument or access it from the state
      });
  
      //show a success alert
      Alert.alert('Report Submitted', 'Your report has been submitted.');
      console.log('Report submitted:', { messName, messDescription, messResponsible, flatNum });
  
      //reset the form and close the modal
      setShowReportModal(false);
      setMessName('');
      setMessDescription('');
      setMessResponsible('');
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'There was an error submitting your report. Please try again.');
    }
  };




  const fetchMessData = async () => {
    if (!flatNum) return;
  
    const messQuery = query(collection(firestore, 'mess'), where('flatCode', '==', flatNum));
    const querySnapshot = await getDocs(messQuery);
    const messData = [];
  
    querySnapshot.forEach(doc => {
      const data = doc.data();
      messData.push({ ...data, id: doc.id });
    });
  
    setMess(messData); // Assuming setMess is a state setter to store the mess data
  };

  const renderMessStatus = (username) => {
    const userMess = mess.find(item => item.messResponsible === username);
  
    const handleDeleteMess = async (messId) => {
      try {
        await deleteDoc(doc(firestore, 'mess', messId)); // Delete the mess document
        setMess(prevMess => prevMess.filter(item => item.id !== messId)); // Update local state
        Alert.alert('Success', 'The mess has been deleted.');
      } catch (error) {
        console.error('Error deleting mess: ', error);
        Alert.alert('Error', 'Failed to delete the mess.');
      }
    };
  
    if (userMess) {
      return (
        <View style={styles.messContainer}>
          <Text style={styles.messTitle}>{userMess.messName}</Text>
          <Text style={styles.messDescription}>{userMess.messDescription}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteMess(userMess.id)}
          >
            <Text style={styles.deleteButtonText}>Delete Issue</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={styles.noMessContainer}>
          <Text style={styles.noMessText}>No Issue Assigned</Text>
          <AntDesign name="checkcircle" size={24} color="green" style={styles.icon} />
        </View>
      );
    }
  };
  
  
  
  

  const closeModal = () => {
    setSelectedUser(null);
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setMessName('');
    setMessDescription('');
    setMessResponsible('');
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
      <View style={styles.welcomecontainer}>

        <View style={styles.buttonOptions}>
          <Text style={styles.title}>No Flat Number Assigned</Text>
          <TouchableOpacity style={styles.button} onPress={handleCreateFlat}>
            <Text style={styles.buttonText}>Create Flat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleJoinFlat}>
            <Text style={styles.buttonText}>Join Flat</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
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
      </View>

      <ScrollView
        contentContainerStyle={styles.mainContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* --- Occupants Section --- */}
        <View style={styles.headerWithButton}>
          <Text style={styles.title}>Occupants</Text>
          <TouchableOpacity onPress={handleReportMess} style={styles.reportButton}>
            <Text style={styles.reportButtonText}>Report Issue</Text>
          </TouchableOpacity>
        </View>
        {flatMembUsernames.map((item, index) => (
          <View key={item}>
            <TouchableOpacity key={item} onPress={() => handleUserPress(item)}>
              <View style={styles.occupantRow}>
                <View style={styles.leftColumn}>
                  <Image
                    source={{ uri: flatMembImgLinks[index] || 'https://cdn-icons-png.freepik.com/512/8637/8637477.png' }}
                    style={[styles.profileImage, flatMembVacated[index] && styles.profileImageVacated]}
                  />
                  <View>
                    <Text style={styles.arrayItem}>{item}</Text>
                    {flatMembVacated[index] && (
                      <View style={styles.vacatedBadge}>
                        <Ionicons name="airplane" size={12} color="#fff" />
                        <Text style={styles.vacatedBadgeText}>Away</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.rightColumn}>
                  {issueCheck(item)}
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.separator} />
          </View>
        ))}

        {/* --- Vacate/Return Button --- */}
        <View style={styles.vacateContainer}>
          {isVacated ? (
            <TouchableOpacity style={styles.returnButton} onPress={handleReturnToFlat}>
              <Ionicons name="home" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.returnButtonText}>Return to Flat</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.vacateButton} onPress={handleVacateFlat}>
              <Ionicons name="airplane" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.vacateButtonText}>Vacate Flat</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.vacateHint}>
            {isVacated 
              ? "You're currently away. Tap to rejoin rotations." 
              : "Going away? Tap to pause your chore & product rotations."}
          </Text>
        </View>

        {/* --- FlatBoard Section (moved below Occupants) --- */}
        <View style={styles.flatBoardContainer}>
          <Text style={styles.flatBoardTitle}>FlatBoard</Text>
          <View style={styles.flatBoardInputRow}>
            <TextInput
              style={styles.flatBoardInput}
              placeholder="Add a note or shopping item..."
              value={newPostContent}
              onChangeText={setNewPostContent}
              editable={!addingPost}
              placeholderTextColor="#666"
            />
            <TouchableOpacity
              style={styles.flatBoardAddButton}
              onPress={handleAddFlatBoardPost}
              disabled={addingPost || !newPostContent.trim()}
            >
              <Text style={styles.flatBoardAddButtonText}>{addingPost ? '...' : 'Post'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.flatBoardPostsList}>
            {flatBoardPosts.length === 0 ? (
              <Text style={styles.flatBoardEmptyText}>No posts yet. Start the conversation!</Text>
            ) : (
              flatBoardPosts.map(post => (
                <View key={post.id} style={styles.flatBoardPostItem}>
                  <View style={styles.flatBoardPostHeader}>
                    <Text style={styles.flatBoardPostAuthor}>{post.createdByName || 'User'}</Text>
                    <Text style={styles.flatBoardPostTime}>{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : ''}</Text>
                  </View>
                  <Text style={styles.flatBoardPostContent}>{post.content}</Text>
                  {user && post.createdBy === user.uid && (
                    <TouchableOpacity onPress={() => handleDeleteFlatBoardPost(post.id)} style={styles.flatBoardDeleteButton}>
                      <Text style={styles.flatBoardDeleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal for user details */}
      <Modal
        transparent={true}
        visible={!!selectedUser}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedUser}</Text>
            {renderOverdue(selectedUser)}
            {renderSharedProducts(selectedUser)}
            {renderExpensesStatus(selectedUser)}
            {renderMessStatus(selectedUser)}

            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal for reporting mess */}
       {/* Modal for reporting mess */}
       <Modal
        transparent={true}
        visible={showReportModal}
        animationType="slide"
        onRequestClose={closeReportModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report Issue</Text>
            <TextInput
              style={styles.input}
              placeholder="Name of the Issue"
              value={messName}
              onChangeText={setMessName}
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={messDescription}
              onChangeText={setMessDescription}
              placeholderTextColor="#666"
            />


             <View style={styles.listContainer}>
              {flatMembUsernames.map(username => (
                <TouchableOpacity 
                  key={username} 
                  style={[
                    styles.listItem, 
                    messResponsible === username && styles.selectedItem
                  ]}
                  onPress={() => setMessResponsible(username)}
                >
                  <Text style={styles.listItemText}>{username}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View >
            <TouchableOpacity onPress={handleReportSubmit} style={styles.reportButton}>
              <Text style={styles.reportButtonText}>Submit Report</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={closeReportModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

       
      
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flatBoardContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: Spacing * 2,
    marginBottom: Spacing * 2,
    marginTop: Spacing * 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  flatBoardTitle: {
    fontSize: FontSize.xLarge,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing,
  },
  flatBoardInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing,
  },
  flatBoardInput: {
    flex: 1,
    borderColor: Colors.primary,
    borderWidth: 1,
    borderRadius: Spacing,
    padding: Spacing,
    marginRight: Spacing,
    backgroundColor: '#fff',
    color: Colors.text,
  },
  flatBoardAddButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing / 1.5,
    paddingHorizontal: Spacing * 1.5,
    borderRadius: Spacing,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flatBoardAddButtonText: {
    color: Colors.onPrimary,
    fontSize: FontSize.medium,
    fontWeight: 'bold',
  },
  flatBoardPostsList: {
    marginTop: Spacing,
  },
  flatBoardEmptyText: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: Spacing,
  },
  flatBoardPostItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: Spacing,
    marginBottom: Spacing,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  flatBoardPostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  flatBoardPostAuthor: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  flatBoardPostTime: {
    color: '#888',
    fontSize: FontSize.small,
  },
  flatBoardPostContent: {
    fontSize: FontSize.medium,
    color: Colors.text,
    marginVertical: 2,
  },
  flatBoardDeleteButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
    backgroundColor: '#dc3545',
    borderRadius: 5,
    paddingVertical: 2,
    paddingHorizontal: 10,
  },
  flatBoardDeleteButtonText: {
    color: '#fff',
    fontSize: FontSize.small,
  },
  container: {
    flex: 1,
    padding: Spacing * 2,
  },
  welcomecontainer:{
    flex: 1,
    padding: Spacing * 2,
    alignContent:'center',
    justifyContent:'center'

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
  mainContent: {
    flexGrow: 1,
    paddingVertical: Spacing * 2,
    paddingHorizontal: Spacing * 1.5,
  },
  title: {
    fontSize: FontSize.xxLarge,
    color: Colors.primary,
    marginBottom: Spacing * 2,
  },
  headerWithButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing * 2,
  },
  reportButton: {
    backgroundColor: Colors.primary,
    padding: Spacing,
    borderRadius: Spacing,
    alignItems: 'center',
  },
  reportButtonText: {
    fontSize: FontSize.large,
    color: Colors.onPrimary,
  },
  occupantRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: Spacing * 2,
  },
  leftColumn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 80, // Increased size
    height: 80, // Increased size
    borderRadius: 40, // Ensure it remains circular
    marginRight: Spacing,
  },
  profileImageVacated: {
    opacity: 0.5,
    borderWidth: 2,
    borderColor: '#F39C12',
  },
  vacatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F39C12',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  vacatedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  vacateContainer: {
    backgroundColor: '#f8f9fa',
    padding: Spacing * 1.5,
    borderRadius: 10,
    marginVertical: Spacing * 2,
    alignItems: 'center',
  },
  vacateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F39C12',
    paddingVertical: Spacing,
    paddingHorizontal: Spacing * 2,
    borderRadius: 10,
  },
  vacateButtonText: {
    color: '#fff',
    fontSize: FontSize.medium,
    fontWeight: 'bold',
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27AE60',
    paddingVertical: Spacing,
    paddingHorizontal: Spacing * 2,
    borderRadius: 10,
  },
  returnButtonText: {
    color: '#fff',
    fontSize: FontSize.medium,
    fontWeight: 'bold',
  },
  vacateHint: {
    marginTop: Spacing,
    color: '#666',
    fontSize: FontSize.small,
    textAlign: 'center',
  },
  arrayItem: {
    fontSize: FontSize.large,
    color: Colors.primary,
  },
  leaveFlatButton: {
    backgroundColor: Colors.primary,
    padding: Spacing,
    borderRadius: Spacing,
    alignItems: 'center',
    marginTop: Spacing * 2,
  },
  leaveFlatButtonText: {
    fontSize: FontSize.large,
    color: Colors.onPrimary,
  },
  logoutButton: {
    backgroundColor: Colors.danger,
    padding: Spacing,
    borderRadius: Spacing,
    alignItems: 'center',
    marginTop: Spacing,
  },
  logoutButtonText: {
    fontSize: FontSize.large,
    color: Colors.onPrimary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusText: {
    fontSize: 18,
    marginRight: 10,
  },
  icon: {
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignItems:'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing,
    fontSize: FontSize.large,
    color: Colors.onBackground,
  },
  buttonOptions: {
    marginTop: Spacing * 4,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: Spacing,
    borderRadius: Spacing,
    alignItems: 'center',
    marginBottom: Spacing * 2,
  },
  buttonText: {
    fontSize: FontSize.large,
    color: Colors.onPrimary,
  },
  input: {
    width: '100%',
    borderColor: Colors.primary,
    borderWidth: 1,
    borderRadius: Spacing,
    padding: Spacing,
    marginBottom: Spacing,
  },
  picker: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: Spacing,
    marginBottom: Spacing * 2, // Increased margin to add more space below
    marginTop: Spacing, // Added top margin for spacing above
    paddingHorizontal: Spacing, // Added horizontal padding for better touch experience
  },
  padding: {
    paddingTop:Spacing * 20,

  },
  deleteButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: FontSize.medium,
    textAlign: 'center',
  },
  choreItem: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messContainer: {
    backgroundColor: '#f8f9fa',
    padding: Spacing,
    borderRadius: Spacing / 2,
    marginVertical: Spacing,
    borderWidth: 1,
    borderColor: '#ced4da',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  messTitle: {
    fontSize: FontSize.large,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing / 2,
  },
  messDescription: {
    fontSize: FontSize.medium,
    color: '#6c757d',
    marginBottom: Spacing,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing / 2,
    paddingHorizontal: Spacing,
    backgroundColor: '#dc3545',
    borderRadius: Spacing / 2,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: FontSize.medium,
  },
  noMessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing,
    paddingHorizontal: Spacing,
    backgroundColor: '#e9ecef',
    borderRadius: Spacing / 2,
    marginVertical: Spacing,
  },
  noMessText: {
    fontSize: FontSize.medium,
    color: Colors.primary,
    marginRight: Spacing,
  },
  icon: {
    marginLeft: Spacing / 4,
  },
  rightColumn: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#CCCCCC', // Light grey color
    marginHorizontal: 10,
    marginVertical: 5,
  },
  listContainer: {
    width: '100%',
    marginBottom: 15,
  },
  listItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  listItemText: {
    fontSize: 16,
    color: '#000',
  },
  selectedItem: {
    backgroundColor: '#e0e0e0',
  },

});

export default ProfileScreen;
