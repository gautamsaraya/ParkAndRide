import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { removeToken } from "../utils/auth";
import { AuthAPI, UserAPI } from "../config/api";

const DrawerContent = ({ navigation }) => {
  const [user, setUser] = useState({
    name: "User",
    email: "user@example.com",
    walletBalance: 0,
    loyaltyPoints: 0,
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await AuthAPI.getProfile();
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await removeToken();
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const navigateTo = (screenName) => {
    navigation.navigate(screenName);
  };

  const menuItems = [
    {
      icon: "home-outline",
      label: "Home",
      onPress: () => navigateTo("Home"),
    },
    {
      icon: "car-outline",
      label: "My Reservations",
      onPress: () => navigateTo("ReservationsList"),
    },
    {
      icon: "compass-outline",
      label: "Book a Ride",
      onPress: () => navigateTo("RideBooking"),
    },
    {
      icon: "time-outline",
      label: "My Rides",
      onPress: () => navigateTo("RideHistory"),
    },
    {
      icon: "person-outline",
      label: "Profile",
      onPress: () => navigateTo("Profile"),
      // badge: user.walletBalance ? `₹${user.walletBalance}` : null,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {(user?.name || "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.menuItems}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <Icon
              name={item.icon}
              size={24}
              color="#4e73df"
              style={styles.menuIcon}
            />
            <Text style={styles.menuLabel}>{item.label}</Text>
            {item.badge && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="log-out-outline" size={24} color="#e74a3b" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#4e73df",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4e73df",
  },
  userDetails: {
    marginLeft: 15,
  },
  userName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  userEmail: {
    color: "#e8eaf6",
    fontSize: 14,
  },
  menuItems: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuIcon: {
    marginRight: 15,
  },
  menuLabel: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  badgeContainer: {
    backgroundColor: "#f8f9fc",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: "#4e73df",
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  logoutText: {
    marginLeft: 15,
    fontSize: 16,
    color: "#e74a3b",
    fontWeight: "500",
  },
});

export default DrawerContent;
