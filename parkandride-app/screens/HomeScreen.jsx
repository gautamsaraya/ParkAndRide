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
import { AuthAPI, MetroStationsAPI, RidesAPI } from "../config/api";

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState("User");
  const [activeTab, setActiveTab] = useState("parking");
  const [recentStations, setRecentStations] = useState([]);
  const [recentRides, setRecentRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const backAction = () => true; // Disable back
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    fetchUserData();
    fetchRecentStations();
    fetchRecentRides();

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

  const fetchRecentRides = async () => {
    try {
      const response = await RidesAPI.getUserRides();
      // Filter active rides and get most recent ones (up to 2)
      const activeRides = response.data
        .filter((ride) => ride.status === "active")
        .slice(0, 2);
      setRecentRides(activeRides);
    } catch (error) {
      console.error("Error fetching rides:", error);
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

  const handleBookRide = () => {
    navigation.navigate("RideBooking");
  };

  const handleViewRides = () => {
    navigation.navigate("RideHistory");
  };

  const handleRideDetails = (ride) => {
    navigation.navigate("RideConfirmation", { ride });
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
      <TouchableOpacity style={styles.bookRideCard} onPress={handleBookRide}>
        <View style={styles.bookRideContent}>
          <View style={styles.bookRideIcon}>
            <Ionicons name="car-sport" size={32} color="#fff" />
          </View>
          <View style={styles.bookRideTextContainer}>
            <Text style={styles.bookRideTitle}>Book a Ride</Text>
            <Text style={styles.bookRideDescription}>
              Book an e-rickshaw, cab, or shuttle from the metro station
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#4e73df" />
      </TouchableOpacity>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Rides</Text>
          <TouchableOpacity onPress={handleViewRides}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentRides.length > 0 ? (
          recentRides.map((ride) => (
            <TouchableOpacity
              key={ride._id}
              style={styles.rideCard}
              onPress={() => handleRideDetails(ride)}
            >
              <View style={styles.rideCardHeader}>
                <View style={styles.rideTypeContainer}>
                  <Ionicons
                    name={
                      ride.vehicleType === "e-rickshaw"
                        ? "bicycle"
                        : ride.vehicleType === "cab"
                        ? "car"
                        : "bus"
                    }
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.rideType}>
                    {(ride.vehicleType || "").charAt(0).toUpperCase() +
                      (ride.vehicleType || "").slice(1)}
                  </Text>
                </View>
                <Text style={[styles.rideStatus, { color: "#4CAF50" }]}>
                  Active
                </Text>
              </View>

              <View style={styles.rideDetails}>
                <View style={styles.rideLocation}>
                  <Ionicons name="location" size={16} color="#666" />
                  <Text style={styles.rideLocationText} numberOfLines={1}>
                    {ride.pickupLocation.name}
                  </Text>
                </View>
                <View style={styles.rideLocationArrow}>
                  <Ionicons name="arrow-down" size={16} color="#666" />
                </View>
                <View style={styles.rideLocation}>
                  <Ionicons name="location" size={16} color="#4e73df" />
                  <Text style={styles.rideLocationText} numberOfLines={1}>
                    {ride.dropoffLocation.name}
                  </Text>
                </View>
              </View>

              <View style={styles.rideFooter}>
                <Text style={styles.rideDate}>
                  {new Date(ride.scheduledTime).toLocaleDateString()}
                </Text>
                <Text style={styles.rideFare}>₹{ride.fare}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noRidesContainer}>
            <Ionicons name="car-sport-outline" size={48} color="#ccc" />
            <Text style={styles.noRidesText}>No recent rides</Text>
            <TouchableOpacity
              style={styles.bookRideButton}
              onPress={handleBookRide}
            >
              <Text style={styles.bookRideButtonText}>
                Book Your First Ride
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  bookRideCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookRideContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  bookRideIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4e73df",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  bookRideTextContainer: {
    flex: 1,
  },
  bookRideTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  bookRideDescription: {
    fontSize: 14,
    color: "#666",
  },
  rideCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  rideCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  rideTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4e73df",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rideType: {
    color: "#fff",
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "500",
  },
  rideStatus: {
    fontSize: 14,
    fontWeight: "500",
  },
  rideDetails: {
    marginBottom: 12,
  },
  rideLocation: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  rideLocationText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  rideLocationArrow: {
    marginLeft: 24,
    marginVertical: 2,
  },
  rideFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
    marginTop: 4,
  },
  rideDate: {
    fontSize: 14,
    color: "#666",
  },
  rideFare: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  noRidesContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  noRidesText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    marginBottom: 16,
  },
  bookRideButton: {
    backgroundColor: "#4e73df",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  bookRideButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
});
