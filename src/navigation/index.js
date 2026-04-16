import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import AddVehicleScreen from '../screens/AddVehicleScreen';
import VehicleDetailScreen from '../screens/VehicleDetailScreen';
import EditVehicleScreen from '../screens/EditVehicleScreen';
import AddMaintenanceScreen from '../screens/AddMaintenanceScreen';
import EditMaintenanceScreen from '../screens/EditMaintenanceScreen';
import AddPartScreen from '../screens/AddPartScreen';
import AddFuelLogScreen from '../screens/AddFuelLogScreen';
import EditFuelLogScreen from '../screens/EditFuelLogScreen';
import SlotPartsScreen from '../screens/SlotPartsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function Navigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
            <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
            <Stack.Screen name="EditVehicle" component={EditVehicleScreen} />
            <Stack.Screen name="AddMaintenance" component={AddMaintenanceScreen} />
            <Stack.Screen name="EditMaintenance" component={EditMaintenanceScreen} />
            <Stack.Screen name="AddPart" component={AddPartScreen} />
            <Stack.Screen name="AddFuelLog" component={AddFuelLogScreen} />
            <Stack.Screen name="EditFuelLog" component={EditFuelLogScreen} />
            <Stack.Screen name="SlotParts" component={SlotPartsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
