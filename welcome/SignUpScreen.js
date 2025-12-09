import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Spacing from '../constants/Spacing';
import FontSize from '../constants/FontSize';
import Colors from '../constants/Colors';
import { auth, firestore } from '../config/firebase'; // Import the auth and firestore
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { registerIndieID, unregisterIndieDevice } from 'native-notify';

const SignUpScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // New state for confirm password
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // New state for error messages

  const imageUrls = [
    'https://cdn-icons-png.freepik.com/512/10693/10693034.png',
    'https://cdn-icons-png.freepik.com/512/16903/16903494.png',
    'https://cdn-icons-png.freepik.com/512/8637/8637477.png',
    
    
  ];

  const getRandomImage = () => {
    const randomIndex = Math.floor(Math.random() * imageUrls.length);
    return imageUrls[randomIndex];
  };

  const handleSignUp = async () => {
    if (email === '' || password === '' || confirmPassword === '') {
      setError('Email, password, and confirm password fields cannot be empty');
      return;
    }

    if (!email.includes('@')) {
      setError('Invalid email format');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and confirm password do not match');
      return;
    }

    setLoading(true);
    setError(''); // Clear previous errors

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user); // sending email verification
      // Successfully created a new user
      const user = userCredential.user;
      setUser(user);
      

      // Store additional user data in Firestore
      await setDoc(doc(firestore, 'users', user.uid), {
        email: email,
        username: username,
        flatNum: "",
        imgLink: getRandomImage(),
      });//setting initial information
      alert('Account created successfully');
      // navigation.navigate('Login'); // using the email and the common prop to the profile

    } catch (error) {
      setError('Error: ' + error.message);
      console.error('Error creating user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Sign Up</Text>

        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#333"
          value={username}
          onChangeText={setUsername}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#333"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#333"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#333"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Signing Up...' : 'Sign Up'}</Text>
        </TouchableOpacity>

        {error !== '' && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing * 4,
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
  errorText: {
    color: 'red',
    marginTop: Spacing,
  },
});
