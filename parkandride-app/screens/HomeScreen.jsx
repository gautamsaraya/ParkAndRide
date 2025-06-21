import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import TabBar from "../components/TabBar";
import SearchBar from "../components/SearchBar";
import ParkingCard from "../components/ParkingCard";
import { AuthAPI, MetroStationsAPI } from "../config/api";

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState("User");
  const [activeTab, setActiveTab] = useState("parking");
  const [recentStations, setRecentStations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const backAction = () => true; // Disable back
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    fetchUserData();
    fetchRecentStations();

    return () => backHandler.remove();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await AuthAPI.getProfile();
      setUserName(response.data.name.split(" ")[0]); // Get first name
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchRecentStations = async () => {
    try {
      setLoading(true);
      const response = await MetroStationsAPI.getAll();
      setRecentStations(response.data.slice(0, 3)); // Get first 3 stations
    } catch (error) {
      console.error("Error fetching stations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleSearchPress = () => {
    navigation.navigate("ParkingSearch");
  };

  const handleStationPress = (station) => {
    navigation.navigate("ParkingSearch", {
      selectedStation: station,
    });
  };

  const handleViewReservations = () => {
    navigation.navigate("ReservationsList");
  };

  const handleProfilePress = () => {
    navigation.navigate("Profile");
  };

  const handleMenuPress = () => {
    navigation.openDrawer();
  };

  const renderParkingTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity style={styles.searchBar} onPress={handleSearchPress}>
        <Ionicons name="search" size={20} color="#666" />
        <Text style={styles.searchPlaceholder}>Search metro stations</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Stations</Text>
          <TouchableOpacity onPress={handleSearchPress}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recentStations.map((station) => (
            <TouchableOpacity
              key={station._id}
              style={styles.stationCard}
              onPress={() => handleStationPress(station)}
            >
              <View style={styles.stationIcon}>
                <Ionicons name="train" size={24} color="#fff" />
              </View>
              <Text style={styles.stationName} numberOfLines={1}>
                {station.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Reservations</Text>
          <TouchableOpacity onPress={handleViewReservations}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.reservationButton}
          onPress={handleViewReservations}
        >
          <Ionicons name="calendar-outline" size={24} color="#4e73df" />
          <Text style={styles.reservationButtonText}>View My Reservations</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRideTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.comingSoonContainer}>
        <Ionicons name="car" size={64} color="#ccc" />
        <Text style={styles.comingSoonText}>Ride Booking Coming Soon</Text>
        <Text style={styles.comingSoonSubtext}>
          We're working on adding ride booking functionality. Stay tuned!
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title={`Welcome, ${userName}`}
        showMenu={true}
        showBack={false}
        onMenuPress={handleMenuPress}
      />

      <TabBar
        activeTab={activeTab}
        onTabPress={handleTabChange}
        style={styles.tabBar}
      />

      <ScrollView style={styles.content}>
        {activeTab === "parking" ? renderParkingTab() : renderRideTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
  },
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: "#999",
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  seeAllText: {
    fontSize: 14,
    color: "#4e73df",
  },
  stationCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    width: 120,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4e73df",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  stationName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
  },
  reservationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reservationButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4e73df",
    marginLeft: 8,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  comingSoonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
});
