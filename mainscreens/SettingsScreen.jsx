import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Share } from 'react-native';
import { auth, firestore } from '../config/firebase';
import { signOut, deleteUser } from 'firebase/auth';
import { doc, updateDoc, arrayRemove, deleteDoc, getDocs, collection, query, where, setDoc } from 'firebase/firestore';
import useFetchUser from '../hooks/useFetchUser';
import Colors from '../constants/Colors';
import * as Device from 'expo-device';               // For checking if the app is running on a physical device
import * as Notifications from 'expo-notifications'; // For handling notifications
import Spacing from '../constants/Spacing';
import FontSize from '../constants/FontSize';
import { registerIndieID, unregisterIndieDevice } from 'native-notify';
import axios from 'axios'; // Make sure to import axios


const SettingsScreen = ({ navigation }) => {
  const { user, username, flatNum, flatName, email, refetch } = useFetchUser();

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
            userEmails: arrayRemove(user.email),
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
 
  


  const handleReportBug = () => {
    const subject = encodeURIComponent('Bug Report');
    const body = encodeURIComponent(
      `Hi,\n\nI encountered an issue while using the app. Here are the details:\n\nName: ${username}\nFlat: ${flatName}\nCode: ${flatNum}\nEmail: ${email}\n\nDescription of the issue:\n`
    );
    const emailUrl = `mailto:hrsugarnan@gmail.com?subject=${subject}&body=${body}`;

    Linking.openURL(emailUrl).catch((err) => {
      console.error('Failed to open email client: ', err);
      Alert.alert('Error', 'Could not open email client.');
    });
  };

  const handleInvite = async () => {
    const message = `Hey! Check out FlatBuddy, the app for managing flats. Here's my flat code: ${flatNum}. Download it from the App Store or Google Play Store: https://apps.apple.com/app/flatbuddy/id6621263551`;
    try {
      await Share.share({
        message,
      });
    } catch (error) {
      console.error('Error sharing invite:', error);
      Alert.alert('Error', 'Failed to share invite.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Name: {username}</Text>
      <Text style={styles.headerText}>Flat: {flatName}</Text>
      <Text style={styles.headerText}>Code: {flatNum}</Text>

      <TouchableOpacity style={styles.button} onPress={handleLeaveFlat}>
        <Text style={styles.buttonText}>Leave Flat</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>



      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
        <Text style={styles.deleteButtonText}>Delete Account</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.reportButton} onPress={handleReportBug}>
        <Text style={styles.reportButtonText}>Report Bug</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.inviteButton} onPress={handleInvite}>
        <Text style={styles.inviteButtonText}>Invite</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing * 2,
  },
  headerText: {
    fontSize: FontSize.large,
    color: Colors.primary,
    marginBottom: Spacing,
  },
  button: {
    padding: Spacing * 2,
    backgroundColor: Colors.primary,
    borderRadius: Spacing,
    marginTop: Spacing * 2,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.onPrimary,
    fontSize: FontSize.large,
  },
  deleteButton: {
    padding: Spacing * 2,
    backgroundColor: 'red',
    borderRadius: Spacing,
    marginTop: Spacing * 2,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: Colors.onPrimary,
    fontSize: FontSize.large,
  },
  reportButton: {
    padding: Spacing * 2,
    backgroundColor: Colors.secondary,
    borderRadius: Spacing,
    marginTop: Spacing * 2,
    alignItems: 'center',
  },
  reportButtonText: {
    color: Colors.onPrimary,
    fontSize: FontSize.large,
  },
  inviteButton: {
    padding: Spacing * 2,
    backgroundColor: Colors.tertiary, // Use a different color for the invite button
    borderRadius: Spacing,
    marginTop: Spacing * 2,
    alignItems: 'center',
  },
  inviteButtonText: {
    color: Colors.onPrimary,
    fontSize: FontSize.large,
  },
});
