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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ParkingLotsAPI, MetroStationsAPI, AdminAPI } from "../config/api";
import Header from "../components/Header";
import Button from "../components/Button";
import Input from "../components/Input";

export default function AdminParkingLotsScreen({ navigation }) {
  const [parkingLots, setParkingLots] = useState([]);
  const [metroStations, setMetroStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentLot, setCurrentLot] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [stationModalVisible, setStationModalVisible] = useState(false);

  const [lotForm, setLotForm] = useState({
    name: "",
    location: {
      coordinates: [0, 0], // [longitude, latitude]
    },
    totalSlots: "0",
    metroStationId: "",
  });

  useEffect(() => {
    fetchParkingLots();
    fetchMetroStations();
  }, []);

  const fetchParkingLots = async () => {
    try {
      setLoading(true);
      const response = await ParkingLotsAPI.getAll();
      setParkingLots(response.data);
    } catch (error) {
      console.error("Error fetching parking lots:", error);
      Alert.alert("Error", "Failed to load parking lots");
    } finally {
      setLoading(false);
    }
  };

  const fetchMetroStations = async () => {
    try {
      const response = await MetroStationsAPI.getAll();
      setMetroStations(response.data);
    } catch (error) {
      console.error("Error fetching metro stations:", error);
      Alert.alert("Error", "Failed to load metro stations");
    }
  };

  const handleAddLot = () => {
    if (metroStations.length === 0) {
      Alert.alert(
        "No Metro Stations",
        "You need to create at least one metro station before adding parking lots."
      );
      return;
    }

    setEditMode(false);
    setLotForm({
      name: "",
      location: {
        coordinates: [0, 0],
      },
      totalSlots: "0",
      metroStationId: "",
    });
    setSelectedStation(null);
    setModalVisible(true);
  };

  const handleEditLot = (lot) => {
    setEditMode(true);
    setCurrentLot(lot);

    // Find the associated metro station
    const station = metroStations.find((s) => s._id === lot.metroStationId);
    setSelectedStation(station);

    setLotForm({
      name: lot.name,
      location: {
        coordinates: [...lot.location.coordinates],
      },
      totalSlots: lot.totalSlots.toString(),
      metroStationId: lot.metroStationId,
    });

    setModalVisible(true);
  };

  const handleDeleteLot = (lot) => {
    Alert.alert(
      "Delete Parking Lot",
      `Are you sure you want to delete ${lot.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await AdminAPI.deleteParkingLot(lot._id);
              Alert.alert("Success", "Parking lot deleted successfully");
              fetchParkingLots();
            } catch (error) {
              console.error("Error deleting parking lot:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to delete parking lot"
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveLot = async () => {
    // Basic validation
    if (!lotForm.name.trim()) {
      Alert.alert("Error", "Parking lot name is required");
      return;
    }

    if (!lotForm.metroStationId) {
      Alert.alert("Error", "Please select a metro station");
      return;
    }

    if (parseInt(lotForm.totalSlots) <= 0) {
      Alert.alert("Error", "Total slots must be greater than 0");
      return;
    }

    try {
      setLoading(true);
      setModalVisible(false);

      const lotData = {
        ...lotForm,
        totalSlots: parseInt(lotForm.totalSlots),
      };

      if (editMode && currentLot) {
        // Update existing lot
        await AdminAPI.updateParkingLot(currentLot._id, lotData);
        Alert.alert("Success", "Parking lot updated successfully");
      } else {
        // Create new lot
        await AdminAPI.createParkingLot(lotData);
        Alert.alert("Success", "Parking lot created successfully");
      }

      fetchParkingLots();
    } catch (error) {
      console.error("Error saving parking lot:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to save parking lot"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === "longitude" || field === "latitude") {
      const index = field === "longitude" ? 0 : 1;
      const newCoordinates = [...lotForm.location.coordinates];
      // Use parseFloat and handle NaN values
      const parsedValue = parseFloat(value);
      newCoordinates[index] = isNaN(parsedValue) ? 0 : parsedValue;

      setLotForm({
        ...lotForm,
        location: {
          ...lotForm.location,
          coordinates: newCoordinates,
        },
      });
    } else {
      setLotForm({
        ...lotForm,
        [field]: value,
      });
    }
  };

  const handleSelectStation = (station) => {
    setSelectedStation(station);
    setLotForm({
      ...lotForm,
      metroStationId: station._id,
    });
    setStationModalVisible(false);
  };

  const renderParkingLotItem = ({ item }) => {
    // Find associated metro station
    const station = metroStations.find((s) => s._id === item.metroStationId);

    return (
      <View style={styles.lotItem}>
        <View style={styles.lotInfo}>
          <Text style={styles.lotName}>{item.name}</Text>
          <Text style={styles.lotDetails}>
            Total Slots: {item.totalSlots} | Occupied: {item.occupiedSlots || 0}
          </Text>
          <Text style={styles.lotStation}>
            Metro Station: {station ? station.name : "Unknown"}
          </Text>
        </View>
        <View style={styles.lotActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditLot(item)}
          >
            <Ionicons name="create-outline" size={20} color="#4e73df" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteLot(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#e74a3b" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.stationItem}
      onPress={() => handleSelectStation(item)}
    >
      <Text style={styles.stationName}>{item.name}</Text>
      <Ionicons
        name="checkmark-circle"
        size={20}
        color={
          selectedStation && selectedStation._id === item._id
            ? "#4e73df"
            : "transparent"
        }
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Manage Parking Lots"
        showMenu={false}
        showBack={true}
        onMenuPress={() => {}}
      />

      <View style={styles.content}>
        <View style={styles.topBar}>
          <Text style={styles.subtitle}>Parking Lots List</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddLot}>
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={styles.addButtonText}>Add Parking Lot</Text>
          </TouchableOpacity>
        </View>

        {loading && !modalVisible ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4e73df" />
            <Text style={styles.loadingText}>Loading parking lots...</Text>
          </View>
        ) : parkingLots.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No parking lots found</Text>
            <Text style={styles.emptySubtext}>
              Add your first parking lot using the button above
            </Text>
          </View>
        ) : (
          <FlatList
            data={parkingLots}
            renderItem={renderParkingLotItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.lotList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Add/Edit Parking Lot Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editMode ? "Edit Parking Lot" : "Add Parking Lot"}
            </Text>

            <Input
              label="Parking Lot Name"
              value={lotForm.name}
              onChangeText={(text) => handleInputChange("name", text)}
              placeholder="Enter parking lot name"
              style={styles.input}
            />

            <Input
              label="Longitude"
              value={lotForm.location.coordinates[0].toString()}
              onChangeText={(text) => handleInputChange("longitude", text)}
              placeholder="Enter longitude"
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <Input
              label="Latitude"
              value={lotForm.location.coordinates[1].toString()}
              onChangeText={(text) => handleInputChange("latitude", text)}
              placeholder="Enter latitude"
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <Input
              label="Total Slots"
              value={lotForm.totalSlots}
              onChangeText={(text) => handleInputChange("totalSlots", text)}
              placeholder="Enter total number of slots"
              keyboardType="numeric"
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.stationSelector}
              onPress={() => setStationModalVisible(true)}
            >
              <Text style={styles.stationSelectorLabel}>Metro Station</Text>
              <Text style={styles.stationSelectorValue}>
                {selectedStation ? selectedStation.name : "Select a station"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setModalVisible(false)}
                variant="outline"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={editMode ? "Update" : "Create"}
                onPress={handleSaveLot}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Metro Station Selection Modal */}
      <Modal
        visible={stationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStationModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Metro Station</Text>

            <FlatList
              data={metroStations}
              renderItem={renderStationItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.stationList}
              showsVerticalScrollIndicator={false}
            />

            <Button
              title="Close"
              onPress={() => setStationModalVisible(false)}
              variant="outline"
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fc",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1cc88a",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  lotList: {
    paddingBottom: 20,
  },
  lotItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lotInfo: {
    flex: 1,
  },
  lotName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  lotDetails: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  lotStation: {
    fontSize: 13,
    color: "#4e73df",
  },
  lotActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
  },
  stationSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  stationSelectorLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    position: "absolute",
    top: -10,
    left: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 4,
  },
  stationSelectorValue: {
    flex: 1,
    fontSize: 14,
    color: "#666",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  stationList: {
    maxHeight: 300,
  },
  stationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  stationName: {
    fontSize: 16,
    color: "#333",
  },
});
