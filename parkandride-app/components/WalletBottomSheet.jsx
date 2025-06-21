import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet from "./BottomSheet";
import Button from "./Button";

const WalletBottomSheet = ({
  visible,
  onClose,
  currentBalance = 0,
  loyaltyPoints = 0,
  onAddMoney,
  onRedeemPoints,
  type = "add", // 'add' or 'redeem'
}) => {
  const [amount, setAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(null);
  const predefinedAmounts = [100, 200, 500, 1000];

  // Calculate redeemable amount (20% of loyalty points)
  const redeemableAmount = Math.round(loyaltyPoints * 0.2);

  useEffect(() => {
    // Reset state when sheet becomes visible
    if (visible) {
      setAmount("");
      setSelectedAmount(null);
    }
  }, [visible]);

  const handleAmountSelect = (value) => {
    setSelectedAmount(value);
    setAmount(value.toString());
  };

  const handleAddMoney = () => {
    const amountValue = parseInt(amount, 10);
    if (isNaN(amountValue) || amountValue <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    onAddMoney(amountValue);
  };

  const handleRedeemPoints = () => {
    if (loyaltyPoints <= 0) {
      alert("You don't have any loyalty points to redeem");
      return;
    }
    onRedeemPoints(redeemableAmount);
  };

  const renderAddMoneyContent = () => (
    <View style={styles.content}>
      <Text style={styles.title}>Add Money to Wallet</Text>
      <Text style={styles.balance}>
        Current Balance: ₹{currentBalance.toFixed(2)}
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.rupeeSymbol}>₹</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="Enter amount"
          keyboardType="number-pad"
          value={amount}
          onChangeText={setAmount}
          maxLength={6}
        />
      </View>

      <View style={styles.amountButtonsContainer}>
        {predefinedAmounts.map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.amountButton,
              selectedAmount === value && styles.selectedAmountButton,
            ]}
            onPress={() => handleAmountSelect(value)}
          >
            <Text
              style={[
                styles.amountButtonText,
                selectedAmount === value && styles.selectedAmountButtonText,
              ]}
            >
              ₹{value}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="Add Money"
        onPress={handleAddMoney}
        style={styles.button}
        disabled={!amount || parseInt(amount, 10) <= 0}
        fullWidth
      />
    </View>
  );

  const renderRedeemPointsContent = () => (
    <View style={styles.content}>
      <Text style={styles.title}>Redeem Loyalty Points</Text>
      <Text style={styles.balance}>Loyalty Points: {loyaltyPoints} points</Text>

      <View style={styles.redeemInfoContainer}>
        <Ionicons name="information-circle-outline" size={24} color="#4e73df" />
        <Text style={styles.redeemInfoText}>
          You can redeem your loyalty points for wallet balance at 20%
          conversion rate.
        </Text>
      </View>

      <View style={styles.conversionContainer}>
        <View style={styles.conversionItem}>
          <Text style={styles.conversionLabel}>Points to Redeem</Text>
          <Text style={styles.conversionValue}>{loyaltyPoints}</Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color="#999" />
        <View style={styles.conversionItem}>
          <Text style={styles.conversionLabel}>Wallet Balance</Text>
          <Text style={styles.conversionValue}>₹{redeemableAmount}</Text>
        </View>
      </View>

      <Button
        title="Redeem Points"
        onPress={handleRedeemPoints}
        style={styles.button}
        disabled={loyaltyPoints <= 0}
        fullWidth
      />
    </View>
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      snapPoint="middle"
      enableDrag={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        {type === "add" ? renderAddMoneyContent() : renderRedeemPointsContent()}
      </KeyboardAvoidingView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    width: "100%",
  },
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
  balance: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 56,
    marginBottom: 16,
  },
  rupeeSymbol: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    color: "#333",
  },
  amountButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  amountButton: {
    width: "23%",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  selectedAmountButton: {
    backgroundColor: "#4e73df",
  },
  amountButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  selectedAmountButtonText: {
    color: "#fff",
  },
  button: {
    marginTop: 8,
  },
  redeemInfoContainer: {
    flexDirection: "row",
    backgroundColor: "#e6eeff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  redeemInfoText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
  },
  conversionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  conversionItem: {
    flex: 1,
    alignItems: "center",
  },
  conversionLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  conversionValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
});

export default WalletBottomSheet;
