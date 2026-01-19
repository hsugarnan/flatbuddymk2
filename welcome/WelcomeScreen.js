import { Dimensions, SafeAreaView, StyleSheet, Text, View, TouchableOpacity, ImageBackground, Platform } from "react-native";
import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Spacing from "../constants/Spacing";
import * as Notifications from 'expo-notifications';
import FontSize from "../constants/FontSize";
import Colors from "../constants/Colors";
import { auth, firestore } from "../config/firebase";

const { height } = Dimensions.get("window");

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const WelcomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);

  const updatePushTokenForUser = async (currentUser) => {
    try {
      console.log('📱 Requesting notification permissions...');
      
      // Add a small delay to ensure Firebase is initialized
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const permissionResult = await Notifications.requestPermissionsAsync();
      
      if (!permissionResult || !permissionResult.granted) {
        console.log('❌ Notification permission denied or unavailable');
        return;
      }

      console.log('✅ Notification permission granted');

      // Get the Expo push token
      const expoPushToken = await Notifications.getExpoPushTokenAsync({
        projectId: 'a0e3eaf8-1866-44b1-a7c1-6e12f2daaae5',
      });

      console.log('✅ Expo Push Token:', expoPushToken.data);

      // Update Firestore with the token
      await updateDoc(doc(firestore, 'users', currentUser.uid), {
        expoPushToken: expoPushToken.data,
        pushPlatform: Platform.OS,
        pushUpdatedAt: serverTimestamp(),
      });

      console.log(' Push token saved to Firestore');
    } catch (error) {
      console.error(' Error updating push token:', error);
    }
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          console.log(" User logged in:", currentUser.uid);
          navigation.replace('Main');
          await updatePushTokenForUser(currentUser);
        } else {
          console.log("No user logged in");
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, navigation]);

  // Set up notification listeners
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      // Handle notification tap - navigate to relevant screen
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageContainer}>
        <ImageBackground
          style={styles.image}
          resizeMode="contain"
          source={require("../images/welcomePic.png")}
        />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>FlatBuddy</Text>
        <Text style={styles.slogan}>Live Together, Manage Better – Your Ultimate Flatmate Companion</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.loginButton]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.signupButton]}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.SignUpButtonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    height: height / 2.5,
    width: '100%',
  },
  textContainer: {
    paddingHorizontal: Spacing * 4,
    paddingVertical: Spacing * 4,
  },
  title: {
    fontSize: FontSize.xxLarge,
    color: Colors.primary,
    textAlign: "center",
  },
  slogan: {
    fontSize: FontSize.small,
    color: Colors.text,
    textAlign: "center",
    marginTop: Spacing * 2,
  },
  buttonContainer: {
    paddingHorizontal: Spacing * 2,
    paddingVertical: Spacing * 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    paddingVertical: Spacing * 1.5,
    paddingHorizontal: Spacing * 2,
    width: "48%",
    borderRadius: Spacing,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: Colors.primary,
  },
  signupButton: {
    backgroundColor: Colors.onPrimary,
  },
  buttonText: {
    color: Colors.onPrimary,
    fontSize: FontSize.large,
    textAlign: "center",
  },
  SignUpButtonText: {
    color: Colors.text,
    fontSize: FontSize.large,
    textAlign: "center",
  },
  loadingText: {
    fontSize: FontSize.large,
    textAlign: 'center',
    color: Colors.text,
  },
});