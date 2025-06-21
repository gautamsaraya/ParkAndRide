import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthAPI } from "../config/api";
import { storeToken, storeUserData } from "../utils/auth";
import Input from "../components/Input";
import Button from "../components/Button";

export default function LoginScreen({ navigation }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef();

  const handleLogin = async () => {
    if (!login || !password) {
      Alert.alert("Error", "Please enter both login and password");
      return;
    }

    try {
      setLoading(true);
      const response = await AuthAPI.login({ login, password });

      // Store token and user data
      await storeToken(response.data.token);
      await storeUserData(response.data.user);

      // Navigate to appropriate screen based on user role
      if (response.data.user.isAdmin) {
        navigation.reset({
          index: 0,
          routes: [{ name: "AdminDashboard" }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
      }
    } catch (err) {
      console.error("Login error:", err);
      Alert.alert(
        "Login Failed",
        err.response?.data?.message || "Invalid credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const scrollToInput = (y) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: y,
        animated: true,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/splash-icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Park & Ride</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.subtitle}>Welcome Back</Text>
            <Text style={styles.description}>
              Sign in to continue to your account
            </Text>

            <Input
              label="Email or Username"
              value={login}
              onChangeText={setLogin}
              placeholder="Enter your email or username"
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={
                <Ionicons name="person-outline" size={20} color="#757575" />
              }
              style={styles.input}
              onFocus={() => {
                scrollToInput(150);
              }}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              leftIcon={
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#757575"
                />
              }
              style={styles.input}
              onFocus={() => {
                scrollToInput(220);
              }}
            />

            <TouchableOpacity style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title="Login"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
              fullWidth
            />

            <TouchableOpacity
              style={styles.registerContainer}
              onPress={() => navigation.navigate("Register")}
            >
              <Text style={styles.registerText}>Don't have an account? </Text>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>

          {/* Add extra padding at the bottom to ensure everything is visible when keyboard is open */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f7fa",
    padding: 20,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginVertical: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
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
  },
  subtitle: {
    fontSize: 24,
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
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#4e73df",
    fontSize: 14,
  },
  loginButton: {
    marginBottom: 16,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  registerText: {
    color: "#666",
    fontSize: 14,
  },
  registerLink: {
    color: "#4e73df",
    fontSize: 14,
    fontWeight: "500",
  },
  bottomPadding: {
    height: 40,
  },
});
