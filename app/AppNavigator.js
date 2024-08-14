import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../welcome/WelcomeScreen';
import LoginScreen from '../welcome/LogInScreen';
import SignUpScreen from '../welcome/SignUpScreen';
import ProfileScreen from '../pages/ProfileScreen';
import CreateFlat from '../pages/CreateFlat';
import JoinFlat from '../pages/JoinFlat'
import BottomTabNavigator from './BottomTabNavigator'; // Import the BottomTabNavigator


const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer independent={true}>
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }}  />
        <Stack.Screen name="Login" component={LoginScreen}  options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen}  options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen}  options={{ headerShown: false }} />
        <Stack.Screen name="CreateFlat" component={CreateFlat} options={{ headerShown: false }} /> 
        <Stack.Screen name="Main" component={BottomTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="JoinFlat" component={JoinFlat} options={{ headerShown: false }} /> 
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
