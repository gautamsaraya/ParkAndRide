import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import Button from "../components/Button";
import ParkingSlot from "../components/ParkingSlot";
import { ParkingLotsAPI } from "../config/api";

export default function ParkingZoneScreen({ route, navigation }) {
  const { parkingLotId, parkingLotName, zone, arrivalTime, departureTime } =
    route.params;

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [price, setPrice] = useState(0);
  const [availabilityData, setAvailabilityData] = useState(null);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      setLoading(true);

      // Check availability for the time period
      const availabilityResponse = await ParkingLotsAPI.checkAvailability(
        parkingLotId,
        arrivalTime,
        departureTime
      );

      if (!availabilityResponse.data) {
        console.error(
          "Unexpected availability data format:",
          availabilityResponse
        );
        Alert.alert("Error", "Invalid availability data format");
        setLoading(false);
        return;
      }

      setAvailabilityData(availabilityResponse.data);

      // Get available slots for the zone
      const zoneAvailableSlots =
        availabilityResponse.data.slotsByZone?.[zone] || [];

      // console.log("Zone:", zone);
      // console.log(
      //   "Available zones:",
      //   Object.keys(availabilityResponse.data.slotsByZone || {})
      // );
      // console.log("Slots for zone:", zoneAvailableSlots);

      // Process slots with availability info
      const processedSlots = zoneAvailableSlots.map((slot) => ({
        ...slot,
        available: slot.isAvailable,
        unavailableReason: slot.unavailableReason || null,
      }));

      // Get price multiplier from availability response
      const priceMultiplier = availabilityResponse.data.priceMultiplier || 1.0;
      const basePrice = 50; // Base price per hour
      const durationHours =
        (new Date(departureTime) - new Date(arrivalTime)) / (1000 * 60 * 60);

      // Calculate price
      const calculatedPrice = Math.round(
        basePrice * priceMultiplier * durationHours
      );
      setPrice(calculatedPrice);

      setSlots(processedSlots);
    } catch (error) {
      console.error("Error fetching slots:", error);
      Alert.alert("Error", "Failed to load parking slots");
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot) => {
    // Only allow selection of available slots
    if (!slot.available) {
      let message =
        "This parking slot is already occupied for the selected time period.";

      // Add more specific information based on the reason
      if (slot.unavailableReason) {
        switch (slot.unavailableReason) {
          case "maintenance":
            message = "This parking slot is under maintenance.";
            break;
          case "reserved":
            message =
              "This parking slot is already reserved for the selected time period.";
            break;
          case "other":
            message =
              "This parking slot is unavailable for the selected time period.";
            break;
        }
      }

      Alert.alert("Slot Unavailable", message);
      return;
    }
    setSelectedSlot(slot);
  };

  const handleContinue = () => {
    if (!selectedSlot) {
      Alert.alert(
        "Selection Required",
        "Please select a parking slot to continue"
      );
      return;
    }

    navigation.navigate("ReservationConfirm", {
      parkingLotId,
      parkingLotName,
      parkingSlotId: selectedSlot._id,
      slotNumber: selectedSlot.slotNumber,
      zone,
      arrivalTime,
      departureTime,
      price,
    });
  };

  const renderSlot = ({ item }) => (
    <ParkingSlot
      slotNumber={item.slotNumber}
      isAvailable={item.available}
      isSelected={selectedSlot?._id === item._id}
      onPress={() => handleSlotSelect(item)}
      unavailableReason={item.unavailableReason}
    />
  );

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={`Zone ${zone} - Select Slot`} showBack={true} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.infoCard}>
          <Text style={styles.parkingLotName}>{parkingLotName}</Text>
          <View style={styles.timeInfo}>
            <View style={styles.timeItem}>
              <Ionicons name="time-outline" size={18} color="#4e73df" />
              <Text style={styles.timeText}>
                {formatDateTime(arrivalTime)} - {formatDateTime(departureTime)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.availableBox]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.unavailableBox]} />
            <Text style={styles.legendText}>Unavailable</Text>
            <Ionicons
              name="close-circle"
              size={16}
              color="#000"
              style={styles.legendIcon}
            />
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.selectedBox]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4e73df" />
            <Text style={styles.loadingText}>Loading parking slots...</Text>
          </View>
        ) : slots.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              No parking slots found in this zone
            </Text>
            {availabilityData && (
              <Text style={styles.debugText}>
                Available zones:{" "}
                {Object.keys(availabilityData.slotsByZone || {}).join(", ")}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.slotsContainer}>
            <FlatList
              data={slots}
              renderItem={renderSlot}
              keyExtractor={(item) => item._id}
              numColumns={2}
              contentContainerStyle={styles.slotsList}
              scrollEnabled={false} // Disable FlatList scrolling since we're using ScrollView
            />
          </View>
        )}

        {/* Add padding at the bottom to ensure content is visible above the footer */}
        <View style={styles.footerSpace} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total Price</Text>
          <Text style={styles.priceValue}>₹{price}</Text>
        </View>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedSlot}
          style={styles.continueButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  parkingLotName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  timeInfo: {
    marginTop: 8,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendIcon: {
    marginLeft: 2,
  },
  availableBox: {
    backgroundColor: "#00a651", // Darker green for better contrast
    borderWidth: 1,
    borderColor: "#007a3d",
  },
  unavailableBox: {
    backgroundColor: "#000000", // Black instead of red for better distinction
    borderWidth: 1,
    borderColor: "#333333",
  },
  selectedBox: {
    backgroundColor: "#0066cc", // Darker blue for better contrast
    borderWidth: 1,
    borderColor: "#004c99",
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
  slotsContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  slotsList: {
    paddingVertical: 16,
    alignItems: "center",
  },
  loadingContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  debugText: {
    marginTop: 16,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  footerSpace: {
    height: 24,
  },
  footer: {
    backgroundColor: "#fff",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e1e1e1",
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: "#666",
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4e73df",
  },
  continueButton: {
    width: "50%",
  },
});
