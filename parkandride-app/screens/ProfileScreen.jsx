import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import Button from "../components/Button";
import { AuthAPI, UserAPI } from "../config/api";
import { logout, getUserData } from "../utils/auth";
import WalletBottomSheet from "../components/WalletBottomSheet";
import RazorpayCheckout from "../components/RazorpayCheckout";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletSheetVisible, setWalletSheetVisible] = useState(false);
  const [loyaltySheetVisible, setLoyaltySheetVisible] = useState(false);
  const [razorpayVisible, setRazorpayVisible] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState(0);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      // First try to get user data from local storage for faster loading
      const localUserData = await getUserData();
      if (localUserData) {
        setUser(localUserData);
      }

      // Then fetch fresh data from API
      const response = await AuthAPI.getProfile();
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  const handleViewReservations = () => {
    navigation.navigate("ReservationsList");
  };

  const handleAddMoney = (amount) => {
    setAmountToAdd(amount);
    setWalletSheetVisible(false);
    // Show Razorpay checkout after a short delay
    setTimeout(() => {
      setRazorpayVisible(true);
    }, 300);
  };

  const handleRedeemPoints = async () => {
    try {
      setLoyaltySheetVisible(false);
      setLoading(true);

      const response = await UserAPI.redeemLoyaltyPoints();

      Alert.alert(
        "Success",
        `${response.data.pointsRedeemed} points redeemed for ₹${response.data.amountCredited}`,
        [{ text: "OK", onPress: fetchUserProfile }]
      );
    } catch (error) {
      console.error("Error redeeming points:", error);
      Alert.alert("Error", "Failed to redeem loyalty points");
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      setRazorpayVisible(false);
      setLoading(true);

      // Add money to wallet
      await UserAPI.addWalletBalance(amountToAdd);

      Alert.alert("Success", `₹${amountToAdd} added to your wallet`, [
        { text: "OK", onPress: fetchUserProfile },
      ]);
    } catch (error) {
      console.error("Error adding money to wallet:", error);
      Alert.alert("Error", "Failed to add money to wallet");
      setLoading(false);
    }
  };

  const handlePaymentError = (error) => {
    setRazorpayVisible(false);
    Alert.alert(
      "Payment Failed",
      error || "Something went wrong with the payment"
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="My Profile" showBack={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4e73df" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="My Profile" showBack={true} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="My Profile" showBack={true} />

      <ScrollView style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0) || "U"}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="wallet-outline" size={24} color="#4e73df" />
            <Text style={styles.cardTitle}>Wallet & Rewards</Text>
          </View>

          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Wallet Balance</Text>
              <Text style={styles.balanceValue}>
                ₹{user?.walletBalance || 0}
              </Text>
              <TouchableOpacity
                style={styles.addMoneyButton}
                onPress={() => setWalletSheetVisible(true)}
              >
                <Ionicons name="add-circle" size={16} color="#fff" />
                <Text style={styles.addMoneyText}>Add Money</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Loyalty Points</Text>
              <Text style={styles.balanceValue}>
                {user?.loyaltyPoints || 0} pts
              </Text>
              {user?.loyaltyPoints > 0 && (
                <TouchableOpacity
                  style={[styles.addMoneyButton, styles.redeemButton]}
                  onPress={() => setLoyaltySheetVisible(true)}
                >
                  <Ionicons name="swap-horizontal" size={16} color="#fff" />
                  <Text style={styles.addMoneyText}>Redeem Points</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="car-outline" size={24} color="#4e73df" />
            <Text style={styles.cardTitle}>Vehicle Information</Text>
          </View>

          {user?.vehicleNumber ? (
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleNumber}>{user.vehicleNumber}</Text>
              <TouchableOpacity style={styles.editButton}>
                <Ionicons name="create-outline" size={18} color="#4e73df" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addVehicleButton}>
              <Ionicons name="add-circle" size={16} color="#4e73df" />
              <Text style={styles.addVehicleText}>Add Vehicle</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <Button
            title="My Reservations"
            onPress={handleViewReservations}
            style={styles.actionButton}
            fullWidth
          />

          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutButton}
            fullWidth
          />
        </View>
      </ScrollView>

      {/* Wallet Bottom Sheet */}
      <WalletBottomSheet
        visible={walletSheetVisible}
        onClose={() => setWalletSheetVisible(false)}
        currentBalance={user?.walletBalance || 0}
        loyaltyPoints={user?.loyaltyPoints || 0}
        onAddMoney={handleAddMoney}
        type="add"
      />

      {/* Loyalty Points Bottom Sheet */}
      <WalletBottomSheet
        visible={loyaltySheetVisible}
        onClose={() => setLoyaltySheetVisible(false)}
        currentBalance={user?.walletBalance || 0}
        loyaltyPoints={user?.loyaltyPoints || 0}
        onRedeemPoints={handleRedeemPoints}
        type="redeem"
      />

      {/* Razorpay Checkout */}
      <RazorpayCheckout
        visible={razorpayVisible}
        amount={amountToAdd}
        prefillEmail={user?.email}
        prefillName={user?.name}
        prefillContact={user?.phoneNumber}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
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
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4e73df",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  profileInfo: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
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
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  balanceItem: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#666",
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 4,
    marginBottom: 8,
  },
  addMoneyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4e73df",
    borderRadius: 4,
    paddingVertical: 8,
    marginRight: 8,
  },
  redeemButton: {
    backgroundColor: "#1cc88a",
  },
  addMoneyText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 6,
  },
  vehicleInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vehicleNumber: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  editButton: {
    padding: 4,
  },
  addVehicleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#4e73df",
    borderRadius: 4,
    paddingVertical: 8,
  },
  addVehicleText: {
    color: "#4e73df",
    fontWeight: "500",
    marginLeft: 6,
  },
  preferenceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
  },
  preferenceLabel: {
    fontSize: 16,
    color: "#333",
  },
  preferenceValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  preferenceValueText: {
    fontSize: 14,
    color: "#666",
    marginRight: 4,
  },
  actionsContainer: {
    marginTop: 8,
    marginBottom: 32,
  },
  actionButton: {
    marginBottom: 12,
  },
  logoutButton: {
    borderColor: "#ff6b6b",
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
});
