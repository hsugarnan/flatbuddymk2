import { Dimensions, SafeAreaView, StyleSheet, Text, View, TouchableOpacity, ImageBackground } from "react-native";
import React from "react";
import Spacing from "../constants/Spacing";
import FontSize from "../constants/FontSize";
import Colors from "../constants/Colors";

const { height } = Dimensions.get("window"); // getting the dimensions of the screen

const WelcomeScreen = ({ navigation }) => {
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
    width: '100%'
  
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
