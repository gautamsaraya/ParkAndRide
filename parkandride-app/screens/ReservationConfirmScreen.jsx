import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import Button from "../components/Button";
import { ReservationsAPI, UserAPI } from "../config/api";
import PaymentMethodBottomSheet from "../components/PaymentMethodBottomSheet";
import RazorpayCheckout from "../components/RazorpayCheckout";

export default function ReservationConfirmScreen({ route, navigation }) {
  const {
    parkingLotId,
    parkingLotName,
    parkingSlotId,
    slotNumber,
    zone,
    arrivalTime,
    departureTime,
    price,
  } = route.params;

  const [loading, setLoading] = useState(false);
  const [reservationId, setReservationId] = useState(null);
  const [paymentMethodVisible, setPaymentMethodVisible] = useState(false);
  const [razorpayVisible, setRazorpayVisible] = useState(false);
  const [userWalletBalance, setUserWalletBalance] = useState(0);

  useEffect(() => {
    // Create reservation when screen loads
    handleReserve();
    // Fetch user wallet balance
    fetchUserWalletBalance();
  }, []);

  const fetchUserWalletBalance = async () => {
    try {
      const response = await UserAPI.getProfile();
      setUserWalletBalance(response.data.walletBalance || 0);
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    }
  };

  const handleReserve = async () => {
    try {
      setLoading(true);
      const reservationData = {
        parkingLotId,
        parkingSlotId,
        startTime: arrivalTime,
        endTime: departureTime,
        price,
      };

      const response = await ReservationsAPI.create(reservationData);
      setReservationId(response.data._id);
    } catch (error) {
      console.error("Error creating reservation:", error);
      Alert.alert(
        "Reservation Failed",
        error.response?.data?.message || "Failed to create reservation"
      );
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodSelect = async (method) => {
    if (method === "wallet") {
      await handleWalletPayment();
    } else if (method === "razorpay") {
      setRazorpayVisible(true);
    }
  };

  const handleWalletPayment = async () => {
    try {
      setLoading(true);
      const response = await ReservationsAPI.completePayment(
        reservationId,
        "wallet"
      );

      Alert.alert(
        "Payment Successful",
        `Your reservation is confirmed. You earned ${response.data.loyaltyPointsAwarded} loyalty points!`,
        [
          {
            text: "View Details",
            onPress: () =>
              navigation.replace("ReservationDetails", {
                reservationId: reservationId,
              }),
          },
        ]
      );
    } catch (error) {
      console.error("Error processing wallet payment:", error);
      Alert.alert(
        "Payment Failed",
        error.response?.data?.message || "Failed to process payment"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpaySuccess = async (paymentData) => {
    try {
      setRazorpayVisible(false);
      setLoading(true);
      const response = await ReservationsAPI.completePayment(
        reservationId,
        "razorpay"
      );

      Alert.alert(
        "Payment Successful",
        `Your reservation is confirmed. You earned ${response.data.loyaltyPointsAwarded} loyalty points!`,
        [
          {
            text: "View Details",
            onPress: () =>
              navigation.replace("ReservationDetails", {
                reservationId: reservationId,
              }),
          },
        ]
      );
    } catch (error) {
      console.error("Error processing Razorpay payment:", error);
      Alert.alert(
        "Payment Failed",
        error.response?.data?.message || "Failed to process payment"
      );
      setLoading(false);
    }
  };

  const handleRazorpayError = (error) => {
    setRazorpayVisible(false);
    Alert.alert(
      "Payment Failed",
      error || "Something went wrong with the payment"
    );
  };

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

  const calculateDuration = () => {
    const start = new Date(arrivalTime);
    const end = new Date(departureTime);
    const diffMs = end - start;
    const diffHrs = diffMs / (1000 * 60 * 60);
    return diffHrs.toFixed(1);
  };

  if (loading && !reservationId) {
    return (
      <View style={styles.container}>
        <Header title="Confirm Reservation" showBack={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4e73df" />
          <Text style={styles.loadingText}>Creating reservation...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Confirm Reservation" showBack={true} />

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Parking Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{parkingLotName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Slot</Text>
            <Text style={styles.detailValue}>
              {zone}-{slotNumber}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Arrival</Text>
            <Text style={styles.detailValue}>
              {formatDateTime(arrivalTime)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Departure</Text>
            <Text style={styles.detailValue}>
              {formatDateTime(departureTime)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{calculateDuration()} hours</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Summary</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Parking Fee</Text>
            <Text style={styles.detailValue}>₹{price.toFixed(2)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Taxes & Fees</Text>
            <Text style={styles.detailValue}>₹0.00</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{price.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.walletInfo}>
          <Ionicons name="wallet-outline" size={20} color="#4e73df" />
          <Text style={styles.walletText}>
            Wallet Balance: ₹{userWalletBalance.toFixed(2)}
          </Text>
        </View>

        <Button
          title="Proceed to Payment"
          onPress={() => setPaymentMethodVisible(true)}
          style={styles.payButton}
          fullWidth
          loading={loading}
        />
      </ScrollView>

      <PaymentMethodBottomSheet
        visible={paymentMethodVisible}
        onClose={() => setPaymentMethodVisible(false)}
        onSelectMethod={handlePaymentMethodSelect}
        walletBalance={userWalletBalance}
        amount={price}
      />

      <RazorpayCheckout
        visible={razorpayVisible}
        amount={price}
        onPaymentSuccess={handleRazorpaySuccess}
        onPaymentError={handleRazorpayError}
        onClose={() => setRazorpayVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: 16,
    color: "#666",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4e73df",
  },
  walletInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6eeff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  walletText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 8,
  },
  payButton: {
    marginBottom: 24,
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
});
