import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import { ReservationsAPI } from "../config/api";

export default function ReservationsListScreen({ navigation }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await ReservationsAPI.getUserReservations();
      setReservations(response.data);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      setError("Failed to load reservations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReservationPress = (reservation) => {
    navigation.navigate("ReservationDetails", {
      reservationId: reservation._id,
    });
  };

  const getStatusColor = (status, paymentStatus) => {
    if (status === "cancelled") return "#ff6b6b";
    if (status === "completed") return "#4CAF50";
    if (paymentStatus === "pending") return "#ff9800";
    return "#4e73df";
  };

  const getStatusText = (status, paymentStatus) => {
    if (status === "cancelled") return "Cancelled";
    if (status === "completed") return "Completed";
    if (paymentStatus === "pending") return "Payment Pending";
    return "Active";
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderReservationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.reservationCard}
      onPress={() => handleReservationPress(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.parkingInfo}>
          <Text style={styles.parkingLotName} numberOfLines={1}>
            {item.parkingLotId.name}
          </Text>
          <Text style={styles.slotInfo}>
            Slot {item.parkingSlotId.slotNumber}, Zone {item.parkingSlotId.zone}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: getStatusColor(item.status, item.paymentStatus),
            },
          ]}
        >
          <Text style={styles.statusText}>
            {getStatusText(item.status, item.paymentStatus)}
          </Text>
        </View>
      </View>

      <View style={styles.timeContainer}>
        <View style={styles.timeInfo}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.timeText}>
            {formatDateTime(item.startTime)} - {formatDateTime(item.endTime)}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.priceText}>₹{item.price}</Text>
        <View style={styles.viewDetailsContainer}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#4e73df" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No reservations found</Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate("ParkingSearch")}
      >
        <Text style={styles.createButtonText}>Create Reservation</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="My Reservations" showBack={true} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4e73df" />
          <Text style={styles.loadingText}>Loading reservations...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={reservations}
          renderItem={renderReservationItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          refreshing={loading}
          onRefresh={fetchReservations}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  reservationCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  parkingInfo: {
    flex: 1,
    marginRight: 8,
  },
  parkingLotName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  slotInfo: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  timeContainer: {
    marginBottom: 12,
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 14,
    marginLeft: 6,
    color: "#666",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e1e1e1",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  viewDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetailsText: {
    fontSize: 14,
    color: "#4e73df",
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: "#4e73df",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});
