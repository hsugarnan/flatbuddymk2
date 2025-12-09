import { Dimensions, SafeAreaView, StyleSheet, Text, View, TouchableOpacity, ImageBackground } from "react-native";
import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Spacing from "../constants/Spacing";
import FontSize from "../constants/FontSize";
import Colors from "../constants/Colors";

const { height } = Dimensions.get("window"); //getting the dimensions of the screen

const WelcomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const auth = getAuth(); //Initialize Firebase Auth

  useEffect(() => {
    //check authentication status
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // User is signed in
        setUser(currentUser);
        console.log("Welcome"); // Log welcome message
        navigation.replace('Main'); // Navigate to Home or another authenticated screen
      } else {
        // No user is signed in
        setUser(null);
      }
      setLoading(false); // Set loading to false when done
    });

    return () => unsubscribe(); // Clean up the subscription on unmount
  }, [auth, navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* <Text>Loading...</Text> Show loading indicator */}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageContainer}>
        <ImageBackground
          style={styles.image}
          resizeMode="contain"
          source={require("../images/welcomePic.png")} // Ensure this path is correct
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
}

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
});
