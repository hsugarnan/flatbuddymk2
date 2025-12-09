import React, { useState } from 'react';
import { Dimensions, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import Spacing from '../constants/Spacing';
import FontSize from '../constants/FontSize';
import Colors from '../constants/Colors';
import { auth } from '../config/firebase'; // Import the configured auth
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'; // Import Firebase Auth methods
import { registerIndieID, unregisterIndieDevice } from 'native-notify';

const { height } = Dimensions.get("window");

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // New state for error messages
  const [loading, setLoading] = useState(false); // Loading state for the login process

  const handleLogin = async () => {
    setError(''); // Clear previous errors
    setLoading(true); // Start loading indicator

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setLoading(false); // Stop loading indicator
      navigation.replace('Main'); // Navigate to the main screen after successful login
      registerIndieID(email, 23326, 'zibbPUUqLIPAgtBaf84dbz');
    } catch (error) {
      setLoading(false); // Stop loading indicator
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
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.replace('Welcome')}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Emails"
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

        {/* Login Button with Loading Indicator */}
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
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
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: FontSize.large,
  },
});
