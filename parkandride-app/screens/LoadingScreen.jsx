import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Image } from "react-native";
import { getToken, isUserAdmin } from "../utils/auth";

export default function LoadingScreen({ navigation }) {
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Simulate loading time
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const token = await getToken();
      if (token) {
        // Check if user is admin
        const admin = await isUserAdmin();
        if (admin) {
          navigation.replace("AdminDashboard");
        } else {
          navigation.replace("Home");
        }
      } else {
        navigation.replace("Login");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      navigation.replace("Login");
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/splash-icon.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Park & Ride</Text>
      <ActivityIndicator size="large" color="#4e73df" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4e73df",
    marginBottom: 24,
  },
  spinner: {
    marginTop: 16,
  },
});
