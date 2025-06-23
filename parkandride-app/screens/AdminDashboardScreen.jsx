import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { logout, getUserData } from "../utils/auth";
import Header from "../components/Header";

export default function AdminDashboardScreen({ navigation }) {
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const userData = await getUserData();
      if (userData && userData.name) {
        setAdminName(userData.name.split(" ")[0]); // Get first name
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          await logout();
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        },
      },
    ]);
  };

  const handleMenuPress = () => {
    // Not used in admin dashboard but required for Header component
  };

  const navigateTo = (screen) => {
    navigation.navigate(screen);
  };

  const AdminMenuCard = ({ title, icon, onPress, color = "#4e73df" }) => (
    <TouchableOpacity
      style={[styles.menuCard, { borderLeftColor: color }]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="#fff" />
      </View>
      <Text style={styles.menuCardTitle}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={`Admin Dashboard: ${adminName}`}
        showMenu={false}
        showBack={false}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome to the Admin Dashboard</Text>
          <Text style={styles.welcomeSubtext}>
            Manage your metro stations, parking lots, and parking slots
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metro Stations</Text>
          <AdminMenuCard
            title="Manage Metro Stations"
            icon="train-outline"
            color="#4e73df"
            onPress={() => navigateTo("AdminMetroStations")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parking Lots</Text>
          <AdminMenuCard
            title="Manage Parking Lots"
            icon="car-outline"
            color="#1cc88a"
            onPress={() => navigateTo("AdminParkingLots")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parking Slots</Text>
          <AdminMenuCard
            title="Manage Parking Slots"
            icon="grid-outline"
            color="#f6c23e"
            onPress={() => navigateTo("AdminParkingSlots")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ride Services</Text>
          <AdminMenuCard
            title="Manage Drivers"
            icon="person-outline"
            color="#e74a3b"
            onPress={() => navigateTo("AdminDrivers")}
          />
          <AdminMenuCard
            title="Manage Vehicles"
            icon="car-sport-outline"
            color="#36b9cc"
            onPress={() => navigateTo("AdminVehicles")}
          />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fc",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  welcomeContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    paddingLeft: 4,
  },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuCardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e74a3b",
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    marginBottom: 40,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
});
