import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

const TabLayout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopWidth: 1,
          borderTopColor: '#2A2A2A',
          height: 85,
          paddingBottom: 20,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 10,
        },
        tabBarLabelStyle: { 
          fontSize: 11, 
          fontWeight: '600',
          marginTop: 4,
        }
      }}
    >
      <Tabs.Screen 
        name='home' 
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <Ionicons name="home" size={24} color={color}/>
            </View>
          ),
        }} 
      />
      
     

      <Tabs.Screen
        name='profile' 
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <Ionicons name="person" size={24} color={color}/>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = {
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
};

export default TabLayout;