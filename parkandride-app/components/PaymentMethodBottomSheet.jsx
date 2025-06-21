import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet from "./BottomSheet";
import Button from "./Button";

const PaymentMethodBottomSheet = ({
  visible,
  onClose,
  onSelectMethod,
  walletBalance = 0,
  amount = 0,
}) => {
  // Check if wallet has sufficient balance
  const hasWalletBalance = walletBalance >= amount;

  const handleSelectWallet = () => {
    onSelectMethod("wallet");
    onClose();
  };

  const handleSelectRazorpay = () => {
    onSelectMethod("razorpay");
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      snapPoint="middle"
      enableDrag={true}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Select Payment Method</Text>
        <Text style={styles.amountText}>Amount: ₹{amount.toFixed(2)}</Text>

        {hasWalletBalance && (
          <TouchableOpacity
            style={styles.paymentOption}
            onPress={handleSelectWallet}
          >
            <View style={styles.optionIconContainer}>
              <Ionicons name="wallet-outline" size={24} color="#4e73df" />
            </View>
            <View style={styles.optionDetails}>
              <Text style={styles.optionTitle}>Wallet</Text>
              <Text style={styles.optionDescription}>
                Balance: ₹{walletBalance.toFixed(2)}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.paymentOption}
          onPress={handleSelectRazorpay}
        >
          <View style={styles.optionIconContainer}>
            <Ionicons name="card-outline" size={24} color="#4e73df" />
          </View>
          <View style={styles.optionDetails}>
            <Text style={styles.optionTitle}>Razorpay</Text>
            <Text style={styles.optionDescription}>
              Pay using credit/debit card, UPI, etc.
            </Text>
          </View>
        </TouchableOpacity>

        <Button title="Cancel" onPress={onClose} variant="outline" fullWidth />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  amountText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  disabledOption: {
    opacity: 0.7,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f4f8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionDetails: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: "#666",
  },
  insufficientBadge: {
    backgroundColor: "#ffebee",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  insufficientText: {
    fontSize: 12,
    color: "#f44336",
  },
});

export default PaymentMethodBottomSheet;
