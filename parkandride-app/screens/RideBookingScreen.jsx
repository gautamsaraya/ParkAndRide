import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import Button from "../components/Button";
import LocationInput from "../components/LocationInput";
import DateTimePicker from "../components/DateTimePicker";
import VehicleTypeSelector from "../components/VehicleTypeSelector";
import SeatSelector from "../components/SeatSelector";
import { RidesAPI } from "../config/api";

const RideBookingScreen = ({ navigation }) => {
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [rideType, setRideType] = useState("on-demand"); // 'on-demand' or 'scheduled'
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [vehicleType, setVehicleType] = useState("cab");
  const [seatsRequired, setSeatsRequired] = useState(1);
  const [isShared, setIsShared] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const [errors, setErrors] = useState({});

  // Get max seats based on vehicle type
  const getMaxSeats = () => {
    switch (vehicleType) {
      case "e-rickshaw":
        return 3;
      case "cab":
        return 4;
      case "shuttle":
        return 8;
      default:
        return 1;
    }
  };

  // Reset seats when vehicle type changes
  useEffect(() => {
    const maxSeats = getMaxSeats();
    if (seatsRequired > maxSeats) {
      setSeatsRequired(maxSeats);
    }
  }, [vehicleType]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!pickupLocation) {
      newErrors.pickupLocation = "Pickup location is required";
    }

    if (!dropoffLocation) {
      newErrors.dropoffLocation = "Drop-off location is required";
    }

    if (rideType === "scheduled") {
      const now = new Date();
      if (scheduledTime <= now) {
        newErrors.scheduledTime = "Scheduled time must be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check vehicle availability
  const checkAvailability = async () => {
    if (!validateForm()) {
      return;
    }

    setCheckingAvailability(true);
    setAvailabilityStatus(null);

    try {
      const params = {
        vehicleType,
        seatsRequired,
        isShared: isShared.toString(),
        rideType,
      };

      if (rideType === "scheduled") {
        params.scheduledTime = scheduledTime.toISOString();
      }

      const response = await RidesAPI.checkAvailability(params);
      setAvailabilityStatus(response.data);

      if (!response.data.isAvailable) {
        Alert.alert("Availability", response.data.message);
      }
    } catch (error) {
      console.error("Error checking availability:", error);
      Alert.alert(
        "Error",
        "Failed to check vehicle availability. Please try again."
      );
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Book ride
  const handleBookRide = async () => {
    if (!validateForm()) {
      return;
    }

    // Check availability first if not already checked
    if (!availabilityStatus) {
      await checkAvailability();
      if (!availabilityStatus?.isAvailable) {
        return;
      }
    }

    setIsLoading(true);

    try {
      const rideData = {
        pickupLocation,
        dropoffLocation,
        rideType,
        vehicleType,
        seatsRequired,
        isShared,
      };

      if (rideType === "scheduled") {
        rideData.scheduledTime = scheduledTime.toISOString();
      }

      const response = await RidesAPI.bookRide(rideData);

      navigation.navigate("RideConfirmation", { ride: response.data });
    } catch (error) {
      console.error("Error booking ride:", error);
      Alert.alert("Error", "Failed to book ride. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Book a Ride" showBack={true} showMenu={false} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            {/* Location inputs need higher z-index to show suggestions properly */}
            <View style={[styles.inputWrapper, { zIndex: 3 }]}>
              <LocationInput
                label="Pickup Location"
                placeholder="Enter pickup location"
                onLocationSelect={setPickupLocation}
                error={errors.pickupLocation}
              />
            </View>

            <View style={[styles.inputWrapper, { zIndex: 2 }]}>
              <LocationInput
                label="Drop-off Location"
                placeholder="Enter drop-off location"
                onLocationSelect={setDropoffLocation}
                error={errors.dropoffLocation}
              />
            </View>

            <View style={styles.rideTypeContainer}>
              <Text style={styles.label}>Ride Type</Text>
              <View style={styles.rideTypeOptions}>
                <TouchableOpacity
                  style={[
                    styles.rideTypeOption,
                    rideType === "on-demand" && styles.selectedRideType,
                  ]}
                  onPress={() => setRideType("on-demand")}
                >
                  <Ionicons
                    name="flash-outline"
                    size={20}
                    color={rideType === "on-demand" ? "#fff" : "#333"}
                  />
                  <Text
                    style={[
                      styles.rideTypeText,
                      rideType === "on-demand" && styles.selectedText,
                    ]}
                  >
                    On-Demand
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.rideTypeOption,
                    rideType === "scheduled" && styles.selectedRideType,
                  ]}
                  onPress={() => setRideType("scheduled")}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={rideType === "scheduled" ? "#fff" : "#333"}
                  />
                  <Text
                    style={[
                      styles.rideTypeText,
                      rideType === "scheduled" && styles.selectedText,
                    ]}
                  >
                    Scheduled
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {rideType === "scheduled" && (
              <DateTimePicker
                label="Schedule Time"
                value={scheduledTime}
                onChange={setScheduledTime}
                mode="datetime"
                error={errors.scheduledTime}
                style={styles.inputContainer}
              />
            )}

            <VehicleTypeSelector
              selectedType={vehicleType}
              onSelect={setVehicleType}
              style={styles.inputContainer}
            />

            <SeatSelector
              value={seatsRequired}
              onChange={setSeatsRequired}
              maxSeats={getMaxSeats()}
              style={styles.inputContainer}
            />

            <View style={styles.switchContainer}>
              <Text style={styles.label}>Share Ride</Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>
                  {isShared
                    ? "Share with other passengers (25% extra fare per seat)"
                    : "Private ride (full fare)"}
                </Text>
                <Switch
                  value={isShared}
                  onValueChange={setIsShared}
                  trackColor={{ false: "#d1d1d1", true: "#81b0ff" }}
                  thumbColor={isShared ? "#4e73df" : "#f4f3f4"}
                />
              </View>
            </View>

            {availabilityStatus && (
              <View style={styles.availabilityContainer}>
                <Text
                  style={[
                    styles.availabilityText,
                    availabilityStatus.isAvailable
                      ? styles.availableText
                      : styles.unavailableText,
                  ]}
                >
                  {availabilityStatus.isAvailable
                    ? `${
                        availabilityStatus.availableVehiclesCount || "Multiple"
                      } vehicles available`
                    : availabilityStatus.message}
                </Text>
              </View>
            )}

            <View style={styles.buttonsContainer}>
              <Button
                title="Check Availability"
                onPress={checkAvailability}
                loading={checkingAvailability}
                disabled={isLoading}
                variant="outline"
                style={styles.checkButton}
              />

              <Button
                title="Book Ride"
                onPress={handleBookRide}
                loading={isLoading}
                disabled={
                  checkingAvailability ||
                  (availabilityStatus && !availabilityStatus.isAvailable)
                }
                style={styles.bookButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    marginBottom: 16,
    // Higher z-index for location inputs to ensure suggestions are visible
    zIndex: 1000,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  rideTypeContainer: {
    marginBottom: 16,
    zIndex: 1,
  },
  rideTypeOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rideTypeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    flex: 0.48,
  },
  selectedRideType: {
    backgroundColor: "#4e73df",
    borderColor: "#4e73df",
  },
  rideTypeText: {
    marginLeft: 8,
    fontWeight: "500",
    color: "#333",
  },
  selectedText: {
    color: "#fff",
  },
  switchContainer: {
    marginBottom: 16,
    zIndex: 1,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchText: {
    flex: 1,
    fontSize: 14,
    color: "#555",
  },
  availabilityContainer: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    marginBottom: 16,
    zIndex: 1,
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  availableText: {
    color: "#28a745",
  },
  unavailableText: {
    color: "#dc3545",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    zIndex: 1,
  },
  checkButton: {
    flex: 0.48,
  },
  bookButton: {
    flex: 0.48,
  },
});

export default RideBookingScreen;
