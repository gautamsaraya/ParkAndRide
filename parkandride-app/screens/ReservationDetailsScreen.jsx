import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import Header from "../components/Header";
import Button from "../components/Button";
import DateTimePicker from "../components/DateTimePicker";
import BottomSheet from "../components/BottomSheet";
import { ReservationsAPI } from "../config/api";

export default function ReservationDetailsScreen({ route, navigation }) {
  const { reservationId } = route.params;
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [updateTimeModalVisible, setUpdateTimeModalVisible] = useState(false);
  const [updatedStartTime, setUpdatedStartTime] = useState(null);
  const [updatedEndTime, setUpdatedEndTime] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchReservationDetails();
  }, []);

  const fetchReservationDetails = async () => {
    try {
      setLoading(true);
      const response = await ReservationsAPI.getById(reservationId);
      setReservation(response.data);

      // Initialize update time fields with current reservation times
      setUpdatedStartTime(new Date(response.data.startTime));
      setUpdatedEndTime(new Date(response.data.endTime));
    } catch (error) {
      console.error("Error fetching reservation details:", error);
      setError("Failed to load reservation details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = () => {
    setCancelModalVisible(true);
  };

  const handleUpdateTimePress = () => {
    setUpdateTimeModalVisible(true);
  };

  const cancelReservation = async () => {
    try {
      setCancelLoading(true);
      setCancelModalVisible(false);

      const response = await ReservationsAPI.cancel(reservationId);

      Alert.alert(
        "Reservation Cancelled",
        response.data.refundAmount > 0
          ? `Your reservation has been cancelled. ₹${response.data.refundAmount} has been refunded to your wallet.`
          : "Your reservation has been cancelled.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      setCancelLoading(false);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to cancel reservation"
      );
    }
  };

  const handleUpdateTime = async () => {
    try {
      if (!validateTimeUpdate()) {
        return;
      }

      setUpdating(true);

      const response = await ReservationsAPI.updateTime(reservationId, {
        newStartTime: updatedStartTime.toISOString(),
        newEndTime: updatedEndTime.toISOString(),
      });

      setUpdateTimeModalVisible(false);

      Alert.alert(
        "Reservation Updated",
        response.data.refundAmount > 0
          ? `Your reservation has been updated. ₹${response.data.refundAmount} has been refunded to your wallet.`
          : "Your reservation has been updated.",
        [{ text: "OK", onPress: fetchReservationDetails }]
      );
    } catch (error) {
      console.error("Error updating reservation time:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update reservation time"
      );
    } finally {
      setUpdating(false);
    }
  };

  const validateTimeUpdate = () => {
    const originalStart = new Date(reservation.startTime);
    const originalEnd = new Date(reservation.endTime);

    // Check if start time is after original start time
    if (updatedStartTime < originalStart) {
      Alert.alert(
        "Invalid Time",
        "New start time cannot be earlier than original start time"
      );
      return false;
    }

    // Check if end time is before original end time
    if (updatedEndTime > originalEnd) {
      Alert.alert(
        "Invalid Time",
        "New end time cannot be later than original end time"
      );
      return false;
    }

    // Check if start time is before end time
    if (updatedStartTime >= updatedEndTime) {
      Alert.alert("Invalid Time", "Start time must be before end time");
      return false;
    }

    // Check if the duration is reduced
    const originalDuration = originalEnd - originalStart;
    const newDuration = updatedEndTime - updatedStartTime;
    if (newDuration >= originalDuration) {
      Alert.alert(
        "Invalid Time",
        "New duration must be shorter than original duration"
      );
      return false;
    }

    return true;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDuration = () => {
    if (!reservation) return "";

    const start = new Date(reservation.startTime);
    const end = new Date(reservation.endTime);
    const durationMs = end - start;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
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

  const canBeCancelled = () => {
    if (!reservation) return false;

    // Only active reservations with arrival time in the future can be cancelled
    if (reservation.status !== "active") return false;

    const now = new Date();
    const arrivalTime = new Date(reservation.startTime);

    // Allow cancellation up to 30 minutes before arrival
    const cancellationDeadline = new Date(
      arrivalTime.getTime() - 30 * 60 * 1000
    );
    return now < cancellationDeadline;
  };

  const canBeUpdated = () => {
    if (!reservation) return false;
    if (reservation.status !== "active") return false;
    if (reservation.paymentStatus !== "paid") return false;

    const now = new Date();
    const startTime = new Date(reservation.startTime);
    const endTime = new Date(reservation.endTime);

    // Can be updated if:
    // 1. Current time is before end time (reservation hasn't ended)
    // 2. Start time hasn't passed yet, or current time is between start and end
    return (
      endTime > now && (startTime > now || (now >= startTime && now < endTime))
    );
  };

  const handleBackToHome = () => {
    navigation.navigate("Home");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Reservation Details" showBack={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4e73df" />
          <Text style={styles.loadingText}>Loading reservation details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Reservation Details" showBack={true} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!reservation) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Reservation Details" showBack={true} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>Reservation not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Reservation Details" showBack={true} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: getStatusColor(
                  reservation.status,
                  reservation.paymentStatus
                ),
              },
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusText(reservation.status, reservation.paymentStatus)}
            </Text>
          </View>
        </View>

        {reservation.status === "active" &&
          reservation.paymentStatus === "paid" && (
            <View style={styles.qrContainer}>
              <QRCode
                value={reservation.qrCode}
                size={180}
                color="#000"
                backgroundColor="#fff"
              />
              <Text style={styles.qrText}>Show this QR code at entry</Text>
            </View>
          )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="car" size={24} color="#4e73df" />
            <Text style={styles.cardTitle}>Parking Details</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Parking Lot:</Text>
            <Text style={styles.detailValue}>
              {reservation.parkingLotId.name}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Slot:</Text>
            <Text style={styles.detailValue}>
              {reservation.parkingSlotId.slotNumber} (Zone{" "}
              {reservation.parkingSlotId.zone})
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Arrival:</Text>
            <Text style={styles.detailValue}>
              {formatDateTime(reservation.startTime)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Departure:</Text>
            <Text style={styles.detailValue}>
              {formatDateTime(reservation.endTime)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{calculateDuration()}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cash-outline" size={24} color="#4e73df" />
            <Text style={styles.cardTitle}>Payment Details</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price:</Text>
            <Text style={styles.detailValue}>₹{reservation.price}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text
              style={[
                styles.detailValue,
                {
                  color:
                    reservation.paymentStatus === "paid"
                      ? "#4CAF50"
                      : reservation.paymentStatus === "refunded"
                      ? "#ff9800"
                      : "#ff6b6b",
                },
              ]}
            >
              {(reservation.paymentStatus || "").charAt(0).toUpperCase() +
                (reservation.paymentStatus || "").slice(1)}
            </Text>
          </View>
        </View>

        {(canBeCancelled() || canBeUpdated()) && (
          <View style={styles.actionsContainer}>
            {canBeUpdated() && (
              <Button
                title="Update Time"
                onPress={handleUpdateTimePress}
                variant="outline"
                style={styles.actionButton}
                fullWidth
              />
            )}

            {canBeCancelled() && (
              <Button
                title="Cancel Reservation"
                onPress={handleCancelReservation}
                variant="outline"
                style={styles.cancelButton}
                textStyle={{ color: "#ff6b6b" }}
                fullWidth
              />
            )}
          </View>
        )}

        <Button
          title="Back to Home"
          onPress={handleBackToHome}
          style={styles.homeButton}
          fullWidth
        />

        {/* Add extra space at the bottom to ensure all content is visible */}
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Cancel Confirmation Modal */}
      <BottomSheet
        visible={cancelModalVisible}
        onClose={() => setCancelModalVisible(false)}
        snapPoint="middle"
      >
        <View style={styles.modalContent}>
          <Ionicons name="warning-outline" size={48} color="#ff9800" />
          <Text style={styles.modalTitle}>Cancel Reservation?</Text>
          <Text style={styles.modalText}>
            Are you sure you want to cancel this reservation? Refund policy
            applies based on cancellation time.
          </Text>
          <View style={styles.modalButtons}>
            <Button
              title="No, Keep It"
              onPress={() => setCancelModalVisible(false)}
              variant="outline"
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="Yes, Cancel"
              onPress={cancelReservation}
              style={{ flex: 1, marginLeft: 8, backgroundColor: "#ff6b6b" }}
              loading={cancelLoading}
            />
          </View>
        </View>
      </BottomSheet>

      {/* Update Time Modal */}
      <BottomSheet
        visible={updateTimeModalVisible}
        onClose={() => setUpdateTimeModalVisible(false)}
        snapPoint="middle"
      >
        <ScrollView style={styles.updateTimeModalScrollView}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Reservation Time</Text>
            <Text style={styles.modalText}>
              You can only reduce your reservation time. The original time range
              is from {formatDateTime(reservation?.startTime)} to{" "}
              {formatDateTime(reservation?.endTime)}.
            </Text>

            <DateTimePicker
              label="New Arrival Time"
              value={updatedStartTime}
              onChange={setUpdatedStartTime}
              mode="datetime"
              style={styles.dateTimePicker}
            />

            <DateTimePicker
              label="New Departure Time"
              value={updatedEndTime}
              onChange={setUpdatedEndTime}
              mode="datetime"
              style={styles.dateTimePicker}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setUpdateTimeModalVisible(false)}
                variant="outline"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Update"
                onPress={handleUpdateTime}
                style={{ flex: 1, marginLeft: 8 }}
                loading={updating}
              />
            </View>
          </View>
        </ScrollView>
      </BottomSheet>
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
  statusContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  qrContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  qrText: {
    marginTop: 16,
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  card: {
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
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#333",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  actionsContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
  cancelButton: {
    borderColor: "#ff6b6b",
  },
  homeButton: {
    marginBottom: 16,
    backgroundColor: "#4e73df",
  },
  bottomSpace: {
    height: 40,
  },
  modalContent: {
    padding: 16,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 16,
  },
  modalText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    marginTop: 16,
  },
  dateTimePicker: {
    marginBottom: 16,
    width: "100%",
  },
  updateTimeModalScrollView: {
    maxHeight: "100%",
  },
});
