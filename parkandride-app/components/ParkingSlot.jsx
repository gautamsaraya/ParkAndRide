import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ParkingSlot = ({
  slotNumber,
  isAvailable = true,
  isSelected = false,
  unavailableReason = null,
  onPress,
  style,
}) => {
  // Determine slot status and styling
  const getSlotStyle = () => {
    if (isSelected) {
      return [styles.slot, styles.selectedSlot, style];
    } else if (isAvailable) {
      return [styles.slot, styles.availableSlot, style];
    } else {
      return [styles.slot, styles.occupiedSlot, style];
    }
  };

  // Get icon based on slot status
  const getSlotIcon = () => {
    if (isSelected) {
      return <Ionicons name="checkmark-circle" size={24} color="#fff" />;
    } else if (!isAvailable) {
      // Show different icons based on unavailability reason
      switch (unavailableReason) {
        case "maintenance":
          return <Ionicons name="construct" size={24} color="#fff" />;
        case "reserved":
          return <Ionicons name="car" size={24} color="#fff" />;
        default:
          return <Ionicons name="close-circle" size={24} color="#fff" />;
      }
    }
    return null;
  };

  return (
    <TouchableOpacity
      style={getSlotStyle()}
      onPress={onPress}
      disabled={!isAvailable}
    >
      <Text style={styles.slotNumber}>{slotNumber}</Text>
      {getSlotIcon()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  slot: {
    width: 120,
    height: 100,
    margin: 8,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  availableSlot: {
    backgroundColor: "#00a651", // Darker green for better contrast
    borderColor: "#007a3d",
  },
  occupiedSlot: {
    backgroundColor: "#000000", // Black instead of red for better distinction
    borderColor: "#333333",
  },
  selectedSlot: {
    backgroundColor: "#0066cc", // Darker blue for better contrast
    borderColor: "#004c99",
  },
  slotNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
});

export default ParkingSlot;
