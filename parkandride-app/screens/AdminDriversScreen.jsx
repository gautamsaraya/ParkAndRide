import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AdminAPI } from "../config/api";
import Header from "../components/Header";
import Button from "../components/Button";
import Input from "../components/Input";

const AdminDriversScreen = ({ navigation }) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDriver, setCurrentDriver] = useState(null);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [license, setLicense] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await AdminAPI.getAllDrivers();
      setDrivers(response.data);
    } catch (err) {
      Alert.alert("Error", "Failed to fetch drivers");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAvailableVehicles = async () => {
    try {
      setLoadingVehicles(true);
      // Get all vehicles
      const vehiclesResponse = await AdminAPI.getAllVehicles();
      const allVehicles = vehiclesResponse.data;

      // Get all drivers to check which vehicles are already assigned
      const driversResponse = await AdminAPI.getAllDrivers();
      const allDrivers = driversResponse.data;

      // Extract all assigned vehicle IDs
      const assignedVehicleIds = allDrivers
        .filter((driver) => driver.vehicleId)
        .map((driver) => driver.vehicleId);

      // Filter out vehicles that are already assigned to drivers
      const unassignedVehicles = allVehicles.filter(
        (vehicle) => vehicle.driverId === null && vehicle.status === "active"
      );

      setAvailableVehicles(unassignedVehicles);
      return unassignedVehicles;
    } catch (err) {
      console.error("Failed to fetch available vehicles:", err);
      return [];
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDrivers();
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setLicense("");
    setError("");
    setCurrentDriver(null);
    setIsEditing(false);
  };

  const openAddModal = async () => {
    resetForm();
    const vehicles = await fetchAvailableVehicles();
    if (vehicles.length === 0) {
      Alert.alert(
        "No Vehicles Available",
        "There are no unassigned vehicles available. Please add a vehicle first.",
        [{ text: "OK" }]
      );
      return;
    }
    setModalVisible(true);
  };

  const openEditModal = (driver) => {
    setCurrentDriver(driver);
    setName(driver.name);
    setPhone(driver.phoneNumber);
    setLicense(driver.licenseNumber);
    setIsEditing(true);
    setModalVisible(true);
  };

  const validateForm = () => {
    if (!name.trim()) return "Name is required";
    if (!phone.trim()) return "Phone number is required";
    if (phone.trim().length !== 10) return "Phone number must be 10 digits";
    if (!license.trim()) return "License number is required";
    return "";
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      if (isEditing && currentDriver) {
        // For editing, we don't change the vehicle assignment
        const driverData = {
          name,
          phoneNumber: phone,
          licenseNumber: license,
        };
        await AdminAPI.updateDriver(currentDriver._id, driverData);
        Alert.alert("Success", "Driver updated successfully");
      } else {
        // For new drivers, auto-assign an available vehicle
        const vehicles =
          availableVehicles.length > 0
            ? availableVehicles
            : await fetchAvailableVehicles();

        if (vehicles.length === 0) {
          setError(
            "No available vehicles to assign. Please add a vehicle first."
          );
          return;
        }

        // Select the first available vehicle
        const selectedVehicle = vehicles[0];

        const driverData = {
          name,
          phoneNumber: phone,
          licenseNumber: license,
          vehicleId: selectedVehicle._id,
        };

        await AdminAPI.createDriver(driverData);
        Alert.alert(
          "Success",
          `Driver added successfully and assigned to vehicle ${selectedVehicle.registrationNumber}`
        );
      }

      setModalVisible(false);
      resetForm();
      fetchDrivers();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Something went wrong";
      setError(errorMessage);
      console.error(err);
    }
  };

  const handleDeleteDriver = (driver) => {
    Alert.alert(
      "Delete Driver",
      `Are you sure you want to delete ${driver.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await AdminAPI.deleteDriver(driver._id);
              Alert.alert("Success", "Driver deleted successfully");
              fetchDrivers();
            } catch (err) {
              Alert.alert("Error", "Failed to delete driver");
              console.error(err);
            }
          },
        },
      ]
    );
  };

  const renderDriverItem = ({ item }) => (
    <View style={styles.driverCard}>
      <View style={styles.driverInfo}>
        <Text style={styles.driverName}>{item.name}</Text>
        <Text style={styles.driverDetail}>Phone: {item.phoneNumber}</Text>
        <Text style={styles.driverDetail}>License: {item.licenseNumber}</Text>
        <Text style={styles.driverDetail}>
          Status:{" "}
          <Text
            style={
              item.status === "available"
                ? styles.statusAvailable
                : styles.statusBusy
            }
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </Text>
        <Text style={styles.driverDetail}>
          Rating: {item.rating ? item.rating.toFixed(1) : "N/A"} ⭐
        </Text>
        {item.vehicleId && (
          <Text style={styles.driverDetail}>
            Vehicle ID:{" "}
            {typeof item.vehicleId === "object"
              ? item.vehicleId._id
              : item.vehicleId}
          </Text>
        )}
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="pencil" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteDriver(item)}
        >
          <Ionicons name="trash" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyState}>
      <Ionicons name="car-outline" size={60} color="#999" />
      <Text style={styles.emptyStateText}>No drivers found</Text>
      <Text style={styles.emptyStateSubText}>Add a driver to get started</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Manage Drivers"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.content}>
        {loading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color="#0066CC"
            style={styles.loader}
          />
        ) : (
          <>
            <Button
              title="Add New Driver"
              onPress={openAddModal}
              style={styles.addButton}
              icon="add-circle"
            />

            <FlatList
              data={drivers}
              renderItem={renderDriverItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContainer}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              ListEmptyComponent={renderEmptyList}
            />
          </>
        )}
      </View>

      {/* Add/Edit Driver Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <Text style={styles.modalTitle}>
                {isEditing ? "Edit Driver" : "Add New Driver"}
              </Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Input
                label="Driver Name"
                value={name}
                onChangeText={setName}
                placeholder="Enter driver name"
              />

              <Input
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter 10-digit phone number"
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Input
                label="License Number"
                value={license}
                onChangeText={setLicense}
                placeholder="Enter driver license number"
              />

              {!isEditing && availableVehicles.length > 0 && (
                <View style={styles.vehicleInfoContainer}>
                  <Text style={styles.vehicleInfoTitle}>
                    Vehicle Assignment
                  </Text>
                  <Text style={styles.vehicleInfoText}>
                    A vehicle will be automatically assigned to this driver.
                  </Text>
                  <Text style={styles.vehicleInfoText}>
                    Available vehicles: {availableVehicles.length}
                  </Text>
                </View>
              )}

              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                  style={styles.cancelButton}
                  textStyle={styles.cancelButtonText}
                />
                <Button
                  title={isEditing ? "Update" : "Add"}
                  onPress={handleSubmit}
                  style={styles.submitButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    marginBottom: 16,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  driverCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    flexDirection: "row",
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  driverDetail: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  statusAvailable: {
    color: "green",
    fontWeight: "bold",
  },
  statusBusy: {
    color: "orange",
    fontWeight: "bold",
  },
  actionButtons: {
    justifyContent: "center",
    alignItems: "center",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  editButton: {
    backgroundColor: "#0066CC",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
    marginTop: 12,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 20,
    maxHeight: "80%",
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  errorText: {
    color: "#FF3B30",
    marginBottom: 12,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: "#F2F2F2",
  },
  cancelButtonText: {
    color: "#333",
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
  },
  vehicleInfoContainer: {
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#cce5ff",
  },
  vehicleInfoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0066CC",
    marginBottom: 8,
  },
  vehicleInfoText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
});

export default AdminDriversScreen;
