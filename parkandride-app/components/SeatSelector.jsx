import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SeatSelector = ({
  value,
  onChange,
  maxSeats,
  style,
  label = "Number of Seats",
}) => {
  const handleDecrease = () => {
    if (value > 1) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (value < maxSeats) {
      onChange(value + 1);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.selectorContainer}>
        <TouchableOpacity
          style={[styles.button, value <= 1 && styles.disabledButton]}
          onPress={handleDecrease}
          disabled={value <= 1}
        >
          <Ionicons
            name="remove"
            size={20}
            color={value <= 1 ? "#999" : "#fff"}
          />
        </TouchableOpacity>

        <View style={styles.valueContainer}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.maxValue}>/ {maxSeats}</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, value >= maxSeats && styles.disabledButton]}
          onPress={handleIncrease}
          disabled={value >= maxSeats}
        >
          <Ionicons
            name="add"
            size={20}
            color={value >= maxSeats ? "#999" : "#fff"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  selectorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4e73df",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#e0e0e0",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: 20,
  },
  value: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  maxValue: {
    fontSize: 16,
    color: "#666",
    marginLeft: 2,
  },
});

export default SeatSelector;
