import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import LoadingScreen from "./screens/LoadingScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import ParkingSearchScreen from "./screens/ParkingSearchScreen";
import ParkingLotScreen from "./screens/ParkingLotScreen";
import ParkingZoneScreen from "./screens/ParkingZoneScreen";
import ReservationConfirmScreen from "./screens/ReservationConfirmScreen";
import ReservationsListScreen from "./screens/ReservationsListScreen";
import ReservationDetailsScreen from "./screens/ReservationDetailsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import DrawerContent from "./components/DrawerContent";

// Admin screens
import AdminDashboardScreen from "./screens/AdminDashboardScreen";
import AdminMetroStationsScreen from "./screens/AdminMetroStationsScreen";
import AdminParkingLotsScreen from "./screens/AdminParkingLotsScreen";
import AdminParkingSlotsScreen from "./screens/AdminParkingSlotsScreen";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Drawer navigator that includes the HomeScreen
const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: "75%",
        },
      }}
    >
      <Drawer.Screen name="HomeDrawer" component={HomeScreen} />
    </Drawer.Navigator>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="Loading"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Loading" component={LoadingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Home" component={DrawerNavigator} />
          <Stack.Screen name="ParkingSearch" component={ParkingSearchScreen} />
          <Stack.Screen name="ParkingLot" component={ParkingLotScreen} />
          <Stack.Screen name="ParkingZone" component={ParkingZoneScreen} />
          <Stack.Screen
            name="ReservationConfirm"
            component={ReservationConfirmScreen}
          />
          <Stack.Screen
            name="ReservationsList"
            component={ReservationsListScreen}
          />
          <Stack.Screen
            name="ReservationDetails"
            component={ReservationDetailsScreen}
          />
          <Stack.Screen name="Profile" component={ProfileScreen} />

          {/* Admin Screens */}
          <Stack.Screen
            name="AdminDashboard"
            component={AdminDashboardScreen}
          />
          <Stack.Screen
            name="AdminMetroStations"
            component={AdminMetroStationsScreen}
          />
          <Stack.Screen
            name="AdminParkingLots"
            component={AdminParkingLotsScreen}
          />
          <Stack.Screen
            name="AdminParkingSlots"
            component={AdminParkingSlotsScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
