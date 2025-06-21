import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthAPI } from "../config/api";
import Input from "../components/Input";
import Button from "../components/Button";

// Secret admin code (in a real app, this would be handled more securely)
const ADMIN_SECRET_CODE = "ADMIN1234";

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phoneNumber: "",
    vehicleNumber: "",
    password: "",
    confirmPassword: "",
    isAdmin: false,
    adminCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [showAdminFields, setShowAdminFields] = useState(false);

  const handleChange = (key, value) => setForm({ ...form, [key]: value });

  const toggleAdminMode = () => {
    setShowAdminFields(!showAdminFields);
    if (!showAdminFields) {
      handleChange("isAdmin", false);
      handleChange("adminCode", "");
    }
  };

  const validateForm = () => {
    if (!form.name) return "Name is required";
    if (!form.username) return "Username is required";
    if (!form.email) return "Email is required";
    if (!form.password) return "Password is required";
    if (form.password !== form.confirmPassword) return "Passwords do not match";

    // Basic email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(form.email)) return "Please enter a valid email";

    // Username validation (lowercase letters, numbers, underscores)
    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(form.username))
      return "Username can only contain lowercase letters, numbers, and underscores";

    // Admin code validation
    if (form.isAdmin && form.adminCode !== ADMIN_SECRET_CODE) {
      return "Invalid admin code";
    }

    return null;
  };

  const handleRegister = async () => {
    const errorMessage = validateForm();
    if (errorMessage) {
      Alert.alert("Error", errorMessage);
      return;
    }

    try {
      setLoading(true);
      // Remove confirmPassword and adminCode before sending to API
      const { confirmPassword, adminCode, ...userData } = form;
      const res = await AuthAPI.register(userData);
      Alert.alert(
        "Success",
        "Registration successful! Please login with your credentials."
      );
      navigation.navigate("Login");
    } catch (err) {
      console.error("Registration error:", err);
      Alert.alert(
        "Registration Failed",
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/splash-icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Park & Ride</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.subtitle}>Create Account</Text>
        <Text style={styles.description}>Sign up to get started</Text>

        <Input
          label="Full Name"
          value={form.name}
          onChangeText={(text) => handleChange("name", text)}
          placeholder="Enter your full name"
          leftIcon={
            <Ionicons name="person-outline" size={20} color="#757575" />
          }
          style={styles.input}
        />

        <Input
          label="Username"
          value={form.username}
          onChangeText={(text) => handleChange("username", text)}
          placeholder="Choose a unique username"
          autoCapitalize="none"
          leftIcon={<Ionicons name="at-outline" size={20} color="#757575" />}
          style={styles.input}
        />

        <Input
          label="Email"
          value={form.email}
          onChangeText={(text) => handleChange("email", text)}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon={<Ionicons name="mail-outline" size={20} color="#757575" />}
          style={styles.input}
        />

        <Input
          label="Phone Number"
          value={form.phoneNumber}
          onChangeText={(text) => handleChange("phoneNumber", text)}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          leftIcon={<Ionicons name="call-outline" size={20} color="#757575" />}
          style={styles.input}
        />

        <Input
          label="Vehicle Number"
          value={form.vehicleNumber}
          onChangeText={(text) => handleChange("vehicleNumber", text)}
          placeholder="Enter your vehicle number"
          leftIcon={<Ionicons name="car-outline" size={20} color="#757575" />}
          style={styles.input}
        />

        <Input
          label="Password"
          value={form.password}
          onChangeText={(text) => handleChange("password", text)}
          placeholder="Create a password"
          secureTextEntry
          leftIcon={
            <Ionicons name="lock-closed-outline" size={20} color="#757575" />
          }
          style={styles.input}
        />

        <Input
          label="Confirm Password"
          value={form.confirmPassword}
          onChangeText={(text) => handleChange("confirmPassword", text)}
          placeholder="Confirm your password"
          secureTextEntry
          leftIcon={
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#757575"
            />
          }
          style={styles.input}
        />

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Register as Admin?</Text>
          <Switch
            value={showAdminFields}
            onValueChange={toggleAdminMode}
            trackColor={{ false: "#d1d1d1", true: "#4e73df" }}
            thumbColor="#fff"
          />
        </View>

        {showAdminFields && (
          <>
            <Input
              label="Admin Code"
              value={form.adminCode}
              onChangeText={(text) => handleChange("adminCode", text)}
              placeholder="Enter admin code"
              secureTextEntry
              leftIcon={
                <Ionicons name="key-outline" size={20} color="#757575" />
              }
              style={styles.input}
            />
            <View style={styles.adminCheckContainer}>
              <Text style={styles.adminCheckLabel}>Confirm Admin Status</Text>
              <Switch
                value={form.isAdmin}
                onValueChange={(value) => handleChange("isAdmin", value)}
                trackColor={{ false: "#d1d1d1", true: "#4e73df" }}
                thumbColor="#fff"
                disabled={!form.adminCode}
              />
            </View>
          </>
        )}

        <Button
          title="Register"
          onPress={handleRegister}
          loading={loading}
          style={styles.registerButton}
          fullWidth
        />

        <TouchableOpacity
          style={styles.loginContainer}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.loginText}>Already have an account? </Text>
          <Text style={styles.loginLink}>Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f7fa",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4e73df",
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  switchLabel: {
    fontSize: 16,
    color: "#333",
  },
  adminCheckContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  adminCheckLabel: {
    fontSize: 16,
    color: "#333",
  },
  registerButton: {
    marginTop: 8,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    color: "#666",
    fontSize: 14,
  },
  loginLink: {
    color: "#4e73df",
    fontSize: 14,
    fontWeight: "500",
  },
});
