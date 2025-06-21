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
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MetroStationsAPI, AdminAPI } from "../config/api";
import Header from "../components/Header";
import Button from "../components/Button";
import Input from "../components/Input";

export default function AdminMetroStationsScreen({ navigation }) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentStation, setCurrentStation] = useState(null);
  const [stationForm, setStationForm] = useState({
    name: "",
    location: {
      coordinates: [0, 0], // [longitude, latitude]
    },
  });

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await MetroStationsAPI.getAll();
      setStations(response.data);
    } catch (error) {
      console.error("Error fetching stations:", error);
      Alert.alert("Error", "Failed to load metro stations");
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleAddStation = () => {
    setEditMode(false);
    setStationForm({
      name: "",
      location: {
        coordinates: [0, 0],
      },
    });
    setModalVisible(true);
  };

  const handleEditStation = (station) => {
    setEditMode(true);
    setCurrentStation(station);
    setStationForm({
      name: station.name,
      location: {
        coordinates: [...station.location.coordinates],
      },
    });
    setModalVisible(true);
  };

  const handleDeleteStation = (station) => {
    Alert.alert(
      "Delete Station",
      `Are you sure you want to delete ${station.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await AdminAPI.deleteStation(station._id);
              Alert.alert("Success", "Metro station deleted successfully");
              fetchStations();
            } catch (error) {
              console.error("Error deleting station:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message ||
                  "Failed to delete metro station"
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveStation = async () => {
    // Basic validation
    if (!stationForm.name.trim()) {
      Alert.alert("Error", "Station name is required");
      return;
    }

    try {
      setLoading(true);
      setModalVisible(false);

      if (editMode && currentStation) {
        // Update existing station
        await AdminAPI.updateStation(currentStation._id, stationForm);
        Alert.alert("Success", "Metro station updated successfully");
      } else {
        // Create new station
        await AdminAPI.createStation(stationForm);
        Alert.alert("Success", "Metro station created successfully");
      }

      fetchStations();
    } catch (error) {
      console.error("Error saving station:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to save metro station"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === "longitude" || field === "latitude") {
      const index = field === "longitude" ? 0 : 1;
      const newCoordinates = [...stationForm.location.coordinates];
      const parsedValue = parseFloat(value);
      newCoordinates[index] = isNaN(parsedValue) ? 0 : parsedValue;

      setStationForm({
        ...stationForm,
        location: {
          ...stationForm.location,
          coordinates: newCoordinates,
        },
      });
    } else {
      setStationForm({
        ...stationForm,
        [field]: value,
      });
    }
  };

  const renderStationItem = ({ item }) => (
    <View style={styles.stationItem}>
      <View style={styles.stationInfo}>
        <Text style={styles.stationName}>{item.name}</Text>
        <Text style={styles.stationCoordinates}>
          Longitude: {item.location.coordinates[0].toFixed(6)}, Latitude:{" "}
          {item.location.coordinates[1].toFixed(6)}
        </Text>
      </View>
      <View style={styles.stationActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditStation(item)}
        >
          <Ionicons name="create-outline" size={20} color="#4e73df" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteStation(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#e74a3b" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Manage Metro Stations"
        showMenu={false}
        showBack={true}
        onMenuPress={() => {}}
      />

      <View style={styles.content}>
        <View style={styles.topBar}>
          <Text style={styles.subtitle}>Metro Stations List</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddStation}>
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={styles.addButtonText}>Add Station</Text>
          </TouchableOpacity>
        </View>

        {loading && !modalVisible ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4e73df" />
            <Text style={styles.loadingText}>Loading stations...</Text>
          </View>
        ) : stations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="train" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No metro stations found</Text>
            <Text style={styles.emptySubtext}>
              Add your first metro station using the button above
            </Text>
          </View>
        ) : (
          <FlatList
            data={stations}
            renderItem={renderStationItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.stationList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editMode ? "Edit Metro Station" : "Add Metro Station"}
            </Text>

            <Input
              label="Station Name"
              value={stationForm.name}
              onChangeText={(text) => handleInputChange("name", text)}
              placeholder="Enter station name"
              style={styles.input}
            />

            <Input
              label="Longitude"
              value={stationForm.location.coordinates[0].toString()}
              onChangeText={(text) => handleInputChange("longitude", text)}
              placeholder="Enter longitude"
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <Input
              label="Latitude"
              value={stationForm.location.coordinates[1].toString()}
              onChangeText={(text) => handleInputChange("latitude", text)}
              placeholder="Enter latitude"
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setModalVisible(false)}
                variant="outline"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={editMode ? "Update" : "Create"}
                onPress={handleSaveStation}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
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
    backgroundColor: "#4e73df",
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
  stationList: {
    paddingBottom: 20,
  },
  stationItem: {
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
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  stationCoordinates: {
    fontSize: 12,
    color: "#666",
  },
  stationActions: {
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
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
});
