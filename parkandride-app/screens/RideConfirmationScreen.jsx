import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import Header from "../components/Header";
import Button from "../components/Button";
import PaymentMethodBottomSheet from "../components/PaymentMethodBottomSheet";
import RazorpayCheckout from "../components/RazorpayCheckout";
import { RidesAPI, UserAPI } from "../config/api";

const RideConfirmationScreen = ({ route, navigation }) => {
  const { ride: initialRide, mode = "new" } = route.params;
  const [ride, setRide] = useState(initialRide);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [isShared, setIsShared] = useState(initialRide.isShared || false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await UserAPI.getProfile();
      setUserProfile(response.data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const handleCompleteRide = () => {
    setShowPaymentSheet(true);
  };

  const handleCancelRide = async () => {
    Alert.alert("Cancel Ride", "Are you sure you want to cancel this ride?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          setIsLoading(true);
          try {
            await RidesAPI.cancelRide(ride._id);
            Alert.alert("Success", "Ride cancelled successfully");
            navigation.navigate("Home");
          } catch (error) {
            console.error("Error cancelling ride:", error);
            Alert.alert("Error", "Failed to cancel ride. Please try again.");
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const handlePaymentMethodSelect = (method) => {
    setShowPaymentSheet(false);

    if (method === "wallet") {
      handleWalletPayment();
    } else if (method === "razorpay") {
      setShowRazorpay(true);
    }
  };

  const handleWalletPayment = async () => {
    setIsLoading(true);
    try {
      await RidesAPI.completeRide(ride._id, "wallet");
      Alert.alert(
        "Payment Successful",
        "Your ride has been completed and payment processed successfully.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Home"),
          },
        ]
      );
    } catch (error) {
      console.error("Error processing wallet payment:", error);
      Alert.alert(
        "Payment Failed",
        error.response?.data?.message ||
          "Failed to process payment. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRazorpaySuccess = async (paymentData) => {
    setShowRazorpay(false);
    setIsLoading(true);

    try {
      await RidesAPI.completeRide(ride._id, "razorpay");
      Alert.alert(
        "Payment Successful",
        "Your ride has been completed and payment processed successfully.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Home"),
          },
        ]
      );
    } catch (error) {
      console.error("Error processing razorpay payment:", error);
      Alert.alert(
        "Payment Failed",
        "Failed to process payment. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRazorpayError = (error) => {
    setShowRazorpay(false);
    Alert.alert(
      "Payment Failed",
      error.description || "Failed to process payment. Please try again."
    );
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getVehicleIcon = () => {
    const vehicleType = ride.vehicleId?.type;
    switch (vehicleType) {
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

  const calculateFare = (
    distance,
    vehicleType,
    seatsBooked,
    totalCapacity,
    isShared
  ) => {
    const baseFare = Math.ceil(distance) * 2 * 10 * totalCapacity;
    if (isShared) {
      return Math.ceil(baseFare * (seatsBooked / totalCapacity) * 1.25);
    } else {
      return baseFare;
    }
  };

  const handleSharingToggle = async () => {
    if (isLoading) return;

    const newIsShared = !isShared;
    setIsLoading(true);
    try {
      // Calculate new fare
      const newFare = calculateFare(
        ride.distance,
        ride.vehicleId?.type,
        ride.seatsBooked,
        ride.vehicleId?.capacity,
        newIsShared
      );

      // Call API to update ride sharing status and fare
      const response = await RidesAPI.updateRide(ride._id, {
        isShared: newIsShared,
        fare: newFare,
      });

      // Update local state with API response
      setIsShared(newIsShared);
      setRide(response.data);

      Alert.alert(
        "Success",
        newIsShared
          ? "Ride updated to shared mode. Fare adjusted accordingly."
          : "Ride updated to private mode. Fare adjusted accordingly."
      );
    } catch (error) {
      console.error("Error updating ride sharing status:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to update ride sharing status. Please try again."
      );
      // Revert the toggle if API call fails
      setIsShared(!newIsShared);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={mode === "view" ? "Ride Details" : "Confirm Ride"}
        showBack={true}
        showMenu={false}
      />

      <ScrollView style={styles.content}>
        <View style={styles.qrContainer}>
          {ride.qrCode && (
            <QRCode
              value={ride.qrCode}
              size={200}
              color="#000"
              backgroundColor="#fff"
            />
          )}
          <Text style={styles.qrText}>Show this QR code to the driver</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name={getVehicleIcon()} size={24} color="#4e73df" />
            <Text style={styles.cardTitle}>
              {ride.vehicleId?.type === "e-rickshaw"
                ? "E-Rickshaw"
                : ride.vehicleId?.type === "cab"
                ? "Cab"
                : "Shuttle"}
            </Text>
            <Text style={styles.cardSubtitle}>
              {ride.isShared ? "Shared Ride" : "Private Ride"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>Driver:</Text>
            <Text style={styles.infoValue}>
              {ride.driverId?.name || "Not assigned yet"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="car-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>Vehicle:</Text>
            <Text style={styles.infoValue}>
              {ride.vehicleId?.model} ({ride.vehicleId?.registrationNumber})
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>Seats:</Text>
            <Text style={styles.infoValue}>
              {ride.seatsBooked} / {ride.vehicleId?.capacity}
            </Text>
          </View>

          {mode === "new" && (
            <TouchableOpacity
              style={styles.sharingToggle}
              onPress={handleSharingToggle}
              disabled={mode !== "new" || isLoading}
            >
              <View style={styles.toggleRow}>
                <Ionicons
                  name={isShared ? "people" : "person"}
                  size={24}
                  color="#4e73df"
                />
                <Text style={styles.toggleText}>
                  {isShared ? "Shared Ride" : "Private Ride"}
                </Text>
                <View
                  style={[
                    styles.toggleSwitch,
                    isShared && styles.toggleSwitchActive,
                  ]}
                >
                  <View
                    style={[
                      styles.toggleDot,
                      isShared && styles.toggleDotActive,
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.sharingNote}>
                {isLoading
                  ? "Updating ride status..."
                  : isShared
                  ? "Share your ride and save up to 25% on fare"
                  : "Switch to shared ride to save on fare"}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.divider} />

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={20} color="#4e73df" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationValue}>
                {ride.pickupLocation?.name}
              </Text>
            </View>
          </View>

          <View style={styles.verticalLine} />

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={20} color="#dc3545" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Drop-off</Text>
              <Text style={styles.locationValue}>
                {ride.dropoffLocation?.name}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>Time:</Text>
            <Text style={styles.infoValue}>
              {ride.rideType === "scheduled"
                ? formatDateTime(ride.scheduledTime)
                : "On-Demand (Now)"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="speedometer-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>Distance:</Text>
            <Text style={styles.infoValue}>{ride.distance.toFixed(2)} km</Text>
          </View>

          <View style={styles.fareContainer}>
            <Text style={styles.fareLabel}>Total Fare:</Text>
            <Text style={styles.fareValue}>₹{ride.fare.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.buttonsContainer}>
          {mode === "new" ? (
            <>
              <View style={styles.mainButtonsRow}>
                <Button
                  title="Cancel Ride"
                  onPress={handleCancelRide}
                  variant="outline"
                  style={styles.cancelButton}
                  loading={isLoading}
                />
                <Button
                  title="Complete & Pay"
                  onPress={handleCompleteRide}
                  style={styles.payButton}
                  loading={isLoading}
                />
              </View>

              <Button
                title="Go to Home"
                onPress={() => navigation.navigate("Home")}
                variant="outline"
                style={styles.homeButton}
                fullWidth
              />
            </>
          ) : (
            <>
              <Button
                title="Go to Home"
                onPress={() => navigation.navigate("Home")}
                variant="outline"
                style={styles.homeButton}
                fullWidth
              />
            </>
          )}
        </View>
      </ScrollView>

      <PaymentMethodBottomSheet
        visible={showPaymentSheet}
        onClose={() => setShowPaymentSheet(false)}
        onSelectMethod={handlePaymentMethodSelect}
        walletBalance={userProfile?.walletBalance || 0}
        amount={ride.fare}
      />

      <RazorpayCheckout
        visible={showRazorpay}
        amount={Math.round(ride.fare)}
        prefillEmail={userProfile?.email}
        prefillContact={userProfile?.phoneNumber}
        prefillName={userProfile?.name}
        onPaymentSuccess={handleRazorpaySuccess}
        onPaymentError={handleRazorpayError}
        onClose={() => setShowRazorpay(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrText: {
    marginTop: 16,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#333",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#4e73df",
    marginLeft: "auto",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginLeft: 10,
    width: 70,
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 10,
  },
  locationLabel: {
    fontSize: 12,
    color: "#666",
  },
  locationValue: {
    fontSize: 14,
    color: "#333",
    marginTop: 2,
  },
  verticalLine: {
    width: 1,
    height: 20,
    backgroundColor: "#ddd",
    marginLeft: 10,
    marginBottom: 8,
  },
  fareContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  fareLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  fareValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4e73df",
  },
  buttonsContainer: {
    marginBottom: 24,
  },
  mainButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cancelButton: {
    flex: 0.48,
  },
  payButton: {
    flex: 0.48,
  },
  backButton: {
    marginBottom: 12,
  },
  homeButton: {
    width: "100%",
  },
  sharingToggle: {
    backgroundColor: "#f8f9fc",
    padding: 16,
    borderRadius: 8,
    marginVertical: 12,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginLeft: 12,
  },
  toggleSwitch: {
    width: 48,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ddd",
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: "#4e73df",
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    transform: [{ translateX: 0 }],
  },
  toggleDotActive: {
    transform: [{ translateX: 24 }],
  },
  sharingNote: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
});

export default RideConfirmationScreen;
