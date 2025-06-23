import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import { RidesAPI } from "../config/api";

const RideHistoryScreen = ({ navigation }) => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const response = await RidesAPI.getUserRides();
      setRides(response.data);
    } catch (error) {
      console.error("Error fetching rides:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRides();
  };

  const handleRidePress = (ride) => {
    navigation.navigate("RideConfirmation", {
      ride,
      mode: "view",
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status, paymentStatus) => {
    if (status === "cancelled") return "#dc3545";
    if (status === "completed") return "#28a745";
    if (status === "active" && paymentStatus === "pending") return "#ffc107";
    return "#4e73df";
  };

  const getStatusText = (status, paymentStatus) => {
    if (status === "cancelled") return "Cancelled";
    if (status === "completed") return "Completed";
    if (status === "active" && paymentStatus === "pending")
      return "Payment Pending";
    if (status === "pending") return "Scheduled";
    return "Active";
  };

  const getVehicleIcon = (type) => {
    switch (type) {
      case "e-rickshaw":
        return "car-sport-outline";
      case "cab":
        return "car-outline";
      case "shuttle":
        return "bus-outline";
      default:
        return "car-outline";
    }
  };

  const renderRideItem = ({ item }) => {
    const statusColor = getStatusColor(item.status, item.paymentStatus);
    const statusText = getStatusText(item.status, item.paymentStatus);

    return (
      <TouchableOpacity
        style={styles.rideItem}
        onPress={() => handleRidePress(item)}
      >
        <View style={styles.rideHeader}>
          <View style={styles.vehicleInfo}>
            <Ionicons
              name={getVehicleIcon(item.vehicleId?.type)}
              size={20}
              color="#4e73df"
            />
            <Text style={styles.vehicleType}>
              {item.vehicleId?.type === "e-rickshaw"
                ? "E-Rickshaw"
                : item.vehicleId?.type === "cab"
                ? "Cab"
                : "Shuttle"}
            </Text>
            {item.isShared && (
              <View style={styles.sharedBadge}>
                <Text style={styles.sharedText}>Shared</Text>
              </View>
            )}
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.rideDetails}>
          <View style={styles.locationContainer}>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color="#4e73df" />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.pickupLocation?.name}
              </Text>
            </View>

            <View style={styles.locationDivider}>
              <Ionicons name="ellipsis-vertical" size={16} color="#ddd" />
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color="#dc3545" />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.dropoffLocation?.name}
              </Text>
            </View>
          </View>

          <View style={styles.rideInfo}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.infoText}>
                {item.rideType === "scheduled"
                  ? formatDateTime(item.scheduledTime)
                  : formatDateTime(item.startTime)}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="cash-outline" size={14} color="#666" />
              <Text style={styles.infoText}>₹{item.fare}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="car-outline" size={60} color="#ddd" />
      <Text style={styles.emptyText}>No rides found</Text>
      <Text style={styles.emptySubtext}>
        Book a ride to see your history here
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Ride History" showBack={true} showMenu={false} />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4e73df" />
        </View>
      ) : (
        <FlatList
          data={rides}
          renderItem={renderRideItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#4e73df"]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  rideItem: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  rideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  vehicleInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  vehicleType: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginLeft: 8,
  },
  sharedBadge: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  sharedText: {
    fontSize: 12,
    color: "#0369a1",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#fff",
  },
  rideDetails: {
    marginTop: 4,
  },
  locationContainer: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  locationText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  locationDivider: {
    alignItems: "center",
    paddingVertical: 2,
  },
  rideInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
});

export default RideHistoryScreen;
