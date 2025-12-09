import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ProfileScreen from '../pages/ProfileScreen';
import Calendar from '../mainscreens/CalendarScreen'
import AntDesign from '@expo/vector-icons/AntDesign';
import SharedProducts from '../mainscreens/SharedProducts';
import Feather from '@expo/vector-icons/Feather';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import SettingsScreen from '../mainscreens/SettingsScreen';




const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'FlatHub') {
            return <AntDesign name="idcard" size={size} color={color} />
          } else if (route.name === 'Chores') {
            return <AntDesign name="calendar" size={size} color={color} />
          } else if (route.name === 'SharedProducts') {
           return <MaterialIcons name="cleaning-services" size={size} color={color} />
          }else if (route.name === 'Settings') {
            return <Feather name="settings" size={size} color={color} />
           }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
      tabBarOptions={{
        activeTintColor: 'tomato',
        inactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen name="FlatHub" component={ProfileScreen} options={{ headerShown: false }} />
      <Tab.Screen name="SharedProducts" component={SharedProducts} options={{ headerShown: false }} />
      <Tab.Screen name="Chores" component={Calendar}  options={{ headerShown: false }} />
      <Tab.Screen name="Settings" component={SettingsScreen}  options={{ headerShown: false }} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
