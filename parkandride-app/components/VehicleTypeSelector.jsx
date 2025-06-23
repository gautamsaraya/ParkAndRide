import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const VehicleTypeSelector = ({ selectedType, onSelect, style }) => {
  const vehicleTypes = [
    {
      id: "e-rickshaw",
      name: "E-Rickshaw",
      capacity: 3,
      icon: "car-sport-outline",
      description: "Eco-friendly, 3 seats",
    },
    {
      id: "cab",
      name: "Cab",
      capacity: 4,
      icon: "car-outline",
      description: "Comfortable, 4 seats",
    },
    {
      id: "shuttle",
      name: "Shuttle",
      capacity: 8,
      icon: "bus-outline",
      description: "Spacious, 8 seats",
    },
  ];

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>Select Vehicle Type</Text>
      <View style={styles.optionsContainer}>
        {vehicleTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.option,
              selectedType === type.id && styles.selectedOption,
            ]}
            onPress={() => onSelect(type.id)}
          >
            <Ionicons
              name={type.icon}
              size={32}
              color={selectedType === type.id ? "#fff" : "#4e73df"}
            />
            <Text
              style={[
                styles.optionName,
                selectedType === type.id && styles.selectedText,
              ]}
            >
              {type.name}
            </Text>
            <Text
              style={[
                styles.optionDescription,
                selectedType === type.id && styles.selectedText,
              ]}
            >
              {type.description}
            </Text>
          </TouchableOpacity>
        ))}
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
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  option: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
  },
  selectedOption: {
    backgroundColor: "#4e73df",
    borderColor: "#4e73df",
  },
  optionName: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
    color: "#333",
  },
  optionDescription: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  selectedText: {
    color: "#fff",
  },
});

export default VehicleTypeSelector;
