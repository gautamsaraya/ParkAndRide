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
import { AdminAPI, MetroStationsAPI } from "../config/api";
import Header from "../components/Header";
import Button from "../components/Button";
import Input from "../components/Input";

const AdminVehiclesScreen = ({ navigation }) => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [metroStations, setMetroStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState(null);

  // Form state
  const [type, setType] = useState("cab");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [model, setModel] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVehicles();
    fetchMetroStations();
    fetchDrivers();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await AdminAPI.getAllVehicles();
      setVehicles(response.data);
    } catch (err) {
      Alert.alert("Error", "Failed to fetch vehicles");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMetroStations = async () => {
    try {
      const response = await MetroStationsAPI.getAll();
      console.log(response.data);
      setMetroStations(response.data);
    } catch (err) {
      console.error("Error fetching metro stations:", err);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await AdminAPI.getAllDrivers();
      setDrivers(response.data);
    } catch (err) {
      console.error("Error fetching drivers:", err);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVehicles();
  };

  const resetForm = () => {
    setType("cab");
    setRegistrationNumber("");
    setModel("");
    setError("");
    setCurrentVehicle(null);
    setIsEditing(false);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (vehicle) => {
    setCurrentVehicle(vehicle);
    setType(vehicle.type);
    setRegistrationNumber(vehicle.registrationNumber);
    setModel(vehicle.model);
    setIsEditing(true);
    setModalVisible(true);
  };

  const validateForm = () => {
    if (!type) return "Vehicle type is required";
    if (!registrationNumber.trim()) return "Registration number is required";
    if (!model.trim()) return "Model is required";
    return "";
  };

  const getRandomMetroStation = () => {
    if (metroStations.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * metroStations.length);
    return metroStations[randomIndex]._id;
  };

  const findAvailableDriver = () => {
    // Find drivers without vehicles
    const availableDrivers = drivers.filter((driver) => !driver.vehicleId);
    if (availableDrivers.length === 0) return null;

    // Select a random available driver
    const randomIndex = Math.floor(Math.random() * availableDrivers.length);
    return availableDrivers[randomIndex]._id;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Get a random metro station as base station
    const baseStationId = getRandomMetroStation();
    if (!baseStationId) {
      setError("No metro stations available. Please add metro stations first.");
      return;
    }

    try {
      const vehicleData = {
        type,
        registrationNumber,
        model,
        baseStationId,
      };

      let newVehicle;
      if (isEditing && currentVehicle) {
        const response = await AdminAPI.updateVehicle(
          currentVehicle._id,
          vehicleData
        );
        newVehicle = response.data;
        Alert.alert("Success", "Vehicle updated successfully");
      } else {
        const response = await AdminAPI.createVehicle(vehicleData);
        newVehicle = response.data;

        // Find an available driver to assign to this vehicle
        const availableDriverId = findAvailableDriver();
        if (availableDriverId) {
          // Assign the vehicle to the driver
          await AdminAPI.updateDriver(availableDriverId, {
            vehicleId: newVehicle._id,
          });
        }

        Alert.alert("Success", "Vehicle added successfully");
      }

      setModalVisible(false);
      resetForm();
      fetchVehicles();
      fetchDrivers(); // Refresh drivers list after assignment
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Something went wrong";
      setError(errorMessage);
      console.error(err);
    }
  };

  const handleDeleteVehicle = (vehicle) => {
    Alert.alert(
      "Delete Vehicle",
      `Are you sure you want to delete ${vehicle.registrationNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await AdminAPI.deleteVehicle(vehicle._id);
              Alert.alert("Success", "Vehicle deleted successfully");
              fetchVehicles();
            } catch (err) {
              Alert.alert("Error", "Failed to delete vehicle");
              console.error(err);
            }
          },
        },
      ]
    );
  };

  const renderVehicleItem = ({ item }) => {
    // Find driver assigned to this vehicle
    const assignedDriver = item.driverId;

    // Safely handle baseStationId which might be an object or string
    const baseStationName =
      item.baseStationId && typeof item.baseStationId === "object"
        ? item.baseStationId.name
        : "Not assigned";

    return (
      <View style={styles.vehicleCard}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleRegistration}>
            {item.registrationNumber}
          </Text>
          <Text style={styles.vehicleDetail}>
            Type: <Text style={styles.vehicleType}>{item.type}</Text>
          </Text>
          <Text style={styles.vehicleDetail}>Model: {item.model}</Text>
          <Text style={styles.vehicleDetail}>
            Status:{" "}
            <Text
              style={
                item.status === "active"
                  ? styles.statusActive
                  : styles.statusInactive
              }
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </Text>
          <Text style={styles.vehicleDetail}>
            Base Station: {baseStationName}
          </Text>
          <Text style={styles.vehicleDetail}>
            DriverID: {assignedDriver ? assignedDriver : "Not assigned"}
          </Text>
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
            onPress={() => handleDeleteVehicle(item)}
          >
            <Ionicons name="trash" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyState}>
      <Ionicons name="car-outline" size={60} color="#999" />
      <Text style={styles.emptyStateText}>No vehicles found</Text>
      <Text style={styles.emptyStateSubText}>Add a vehicle to get started</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Manage Vehicles"
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
              title="Add New Vehicle"
              onPress={openAddModal}
              style={styles.addButton}
              icon="add-circle"
            />

            {vehicles.length > 0 ? (
              <FlatList
                data={vehicles}
                renderItem={renderVehicleItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContainer}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                ListEmptyComponent={renderEmptyList}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="car-outline" size={60} color="#999" />
                <Text style={styles.emptyStateText}>No vehicles found</Text>
                <Text style={styles.emptyStateSubText}>
                  Add a vehicle to get started
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Add/Edit Vehicle Modal */}
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
                {isEditing ? "Edit Vehicle" : "Add New Vehicle"}
              </Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.typeSelector}>
                <Text style={styles.label}>Vehicle Type</Text>
                <View style={styles.typeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      type === "e-rickshaw" && styles.selectedTypeButton,
                    ]}
                    onPress={() => setType("e-rickshaw")}
                  >
                    <Ionicons
                      name="bicycle"
                      size={20}
                      color={type === "e-rickshaw" ? "#fff" : "#333"}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        type === "e-rickshaw" && styles.selectedTypeText,
                      ]}
                    >
                      E-Rickshaw
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      type === "cab" && styles.selectedTypeButton,
                    ]}
                    onPress={() => setType("cab")}
                  >
                    <Ionicons
                      name="car"
                      size={20}
                      color={type === "cab" ? "#fff" : "#333"}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        type === "cab" && styles.selectedTypeText,
                      ]}
                    >
                      Cab
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      type === "shuttle" && styles.selectedTypeButton,
                    ]}
                    onPress={() => setType("shuttle")}
                  >
                    <Ionicons
                      name="bus"
                      size={20}
                      color={type === "shuttle" ? "#fff" : "#333"}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        type === "shuttle" && styles.selectedTypeText,
                      ]}
                    >
                      Shuttle
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Input
                label="Registration Number"
                value={registrationNumber}
                onChangeText={setRegistrationNumber}
                placeholder="Enter vehicle registration number"
                autoCapitalize="characters"
              />

              <Input
                label="Model"
                value={model}
                onChangeText={setModel}
                placeholder="Enter vehicle model"
              />

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
  vehicleCard: {
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
  vehicleInfo: {
    flex: 1,
  },
  vehicleRegistration: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  vehicleDetail: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  vehicleType: {
    textTransform: "capitalize",
  },
  statusActive: {
    color: "green",
    fontWeight: "bold",
  },
  statusInactive: {
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
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  typeSelector: {
    marginBottom: 16,
  },
  typeButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  selectedTypeButton: {
    backgroundColor: "#0066CC",
    borderColor: "#0066CC",
  },
  typeButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#333",
  },
  selectedTypeText: {
    color: "#fff",
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
});

export default AdminVehiclesScreen;
