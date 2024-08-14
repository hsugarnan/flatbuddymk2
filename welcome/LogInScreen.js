// screens/LoginScreen.js
import React, { useState } from 'react';
import { Dimensions, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Spacing from '../constants/Spacing';
import FontSize from '../constants/FontSize';
import Colors from '../constants/Colors';
import { auth } from '../config/firebase'; // Import the configured auth
import { signInWithEmailAndPassword, sendPasswordResetEmail, getAuth } from 'firebase/auth'; // Import Firebase Auth methods

const { height } = Dimensions.get("window");

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // New state for error messages


  const handleLogin = async () => {
    setError(''); // Clear previous errors

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      navigation.replace('Main');
    } catch (error) {
      setError('Email or password incorrect. Please try again.');
      console.error('Error logging in:', error);
    }
  };

  const handleResetPassword = () => {
    if (email === '') {
      setError('Please enter your email address to reset your password');
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        setError('Password reset email sent successfully');
      })
      .catch((error) => {
        setError('Error sending password reset email: ' + error.message);
        console.error('Error sending password reset email:', error);
      });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholderTextColor="#666"  // Adjust placeholder text color for better readability
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#666"  // Adjust placeholder text color for better readability
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleResetPassword}>
          <Text style={styles.resetText}>Forgot Password?</Text>
        </TouchableOpacity>

        {error !== '' && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

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
    color: '#333',  // Set text color to a darker shade
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
  resetText: {
    color: Colors.primary,
    marginTop: Spacing * 2,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: 'red',
    marginTop: Spacing * 2,
    textAlign: 'center',
  },
});
