import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Spacing from '../constants/Spacing';
import FontSize from '../constants/FontSize';
import Colors from '../constants/Colors';
import { auth, firestore } from '../config/firebase'; // Import the auth and firestore from firebase.js
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';

const JoinFlat = ({ navigation }) => {
  const [flatNumber, setFlatNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinFlat = async () => {
    if (!flatNumber) {
      Alert.alert('Error', 'Please enter a flat number');
      return;
    }

    setLoading(true);
    const user = auth.currentUser;

    if (user) {
      try {
        const flatsQuery = query(collection(firestore, 'flats'), where('flatNum', '==', flatNumber));
        const querySnapshot = await getDocs(flatsQuery);

        if (!querySnapshot.empty) {
          let flatDocRef = null;
          querySnapshot.forEach((doc) => {
            flatDocRef = doc.ref; // Get the document reference of the flat
          });

          await updateDoc(flatDocRef, {
            userEmails: arrayUnion(user.email)
          });

          // Update user profile with flat number
          const userDocRef = doc(firestore, 'users', user.uid);
          await updateDoc(userDocRef, { flatNum: flatNumber });

          Alert.alert('Success', 'Joined flat successfully');
          navigation.replace('Main');
        } else {
          Alert.alert('Error', 'Flat number does not exist');
        }
      } catch (error) {
        console.error('Error joining flat: ', error);
        Alert.alert('Error', 'Failed to join flat');
      } finally {
        setLoading(false);
      }
    } else {
      Alert.alert('Error', 'No user logged in');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Flat</Text>

      <TextInput
        style={styles.input}
        placeholder="Flat Number"
        value={flatNumber}
        onChangeText={setFlatNumber}
      />

      <TouchableOpacity style={styles.button} onPress={handleJoinFlat} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Joining...' : 'Join Flat'}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default JoinFlat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing * 4,
    backgroundColor: '#FFFFFF',
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
  },
  button: {
    backgroundColor: Colors.primary,
    padding: Spacing * 2,
    borderRadius: Spacing,
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing * 2,
  },
  buttonText: {
    color: Colors.onPrimary,
    fontSize: FontSize.large,
  },
});
