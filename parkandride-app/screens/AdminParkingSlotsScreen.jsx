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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ParkingLotsAPI, AdminAPI } from "../config/api";
import Header from "../components/Header";
import Button from "../components/Button";
import Input from "../components/Input";

export default function AdminParkingSlotsScreen({ navigation }) {
  const [parkingLots, setParkingLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [parkingSlots, setParkingSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lotModalVisible, setLotModalVisible] = useState(false);
  const [slotModalVisible, setSlotModalVisible] = useState(false);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSlot, setCurrentSlot] = useState(null);

  const [slotForm, setSlotForm] = useState({
    slotNumber: "",
    zone: "",
    status: "available",
  });

  const [bulkForm, setBulkForm] = useState({
    zone: "",
    startNumber: "1",
    count: "10",
    status: "available",
  });

  useEffect(() => {
    fetchParkingLots();
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

  const fetchParkingSlots = async (lotId) => {
    try {
      setLoading(true);
      const response = await ParkingLotsAPI.getSlots(lotId);

      // Flatten slots by zone into a single array
      let allSlots = [];
      if (response.data && response.data.slotsByZone) {
        Object.keys(response.data.slotsByZone).forEach((zone) => {
          allSlots = [...allSlots, ...response.data.slotsByZone[zone]];
        });
      } else {
        console.error("Invalid response format:", response.data);
      }

      setParkingSlots(allSlots);
    } catch (error) {
      console.error("Error fetching parking slots:", error);
      Alert.alert("Error", "Failed to load parking slots");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLot = (lot) => {
    setSelectedLot(lot);
    setLotModalVisible(false);
    fetchParkingSlots(lot._id);
  };

  const handleAddSlot = () => {
    if (!selectedLot) {
      Alert.alert("Error", "Please select a parking lot first");
      return;
    }

    setEditMode(false);
    setSlotForm({
      slotNumber: "",
      zone: "",
      status: "available",
    });
    setSlotModalVisible(true);
  };

  const handleAddBulkSlots = () => {
    if (!selectedLot) {
      Alert.alert("Error", "Please select a parking lot first");
      return;
    }

    setBulkForm({
      zone: "",
      startNumber: "1",
      count: "10",
      status: "available",
    });
    setBulkModalVisible(true);
  };

  const handleEditSlot = (slot) => {
    setEditMode(true);
    setCurrentSlot(slot);
    setSlotForm({
      slotNumber: slot.slotNumber,
      zone: slot.zone,
      status: slot.status,
    });
    setSlotModalVisible(true);
  };

  const handleDeleteSlot = (slot) => {
    Alert.alert(
      "Delete Parking Slot",
      `Are you sure you want to delete slot ${slot.slotNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await AdminAPI.deleteParkingSlot(slot._id);
              Alert.alert("Success", "Parking slot deleted successfully");
              fetchParkingSlots(selectedLot._id);
            } catch (error) {
              console.error("Error deleting parking slot:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to delete parking slot"
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveSlot = async () => {
    // Basic validation
    if (!slotForm.slotNumber.trim()) {
      Alert.alert("Error", "Slot number is required");
      return;
    }

    if (!slotForm.zone.trim()) {
      Alert.alert("Error", "Zone is required");
      return;
    }

    try {
      setLoading(true);
      setSlotModalVisible(false);

      const slotData = {
        ...slotForm,
        lotId: selectedLot._id,
      };

      if (editMode && currentSlot) {
        // Update existing slot
        await AdminAPI.updateParkingSlot(currentSlot._id, slotData);
        Alert.alert("Success", "Parking slot updated successfully");
      } else {
        // Create new slot
        await AdminAPI.createParkingSlot(slotData);
        Alert.alert("Success", "Parking slot created successfully");
      }

      fetchParkingSlots(selectedLot._id);
    } catch (error) {
      console.error("Error saving parking slot:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to save parking slot"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBulkSlots = async () => {
    // Basic validation
    if (!bulkForm.zone.trim()) {
      Alert.alert("Error", "Zone is required");
      return;
    }

    if (parseInt(bulkForm.count) <= 0) {
      Alert.alert("Error", "Count must be greater than 0");
      return;
    }

    if (parseInt(bulkForm.startNumber) < 0) {
      Alert.alert("Error", "Start number must be non-negative");
      return;
    }

    try {
      setLoading(true);
      setBulkModalVisible(false);

      const bulkData = {
        ...bulkForm,
        lotId: selectedLot._id,
        startNumber: parseInt(bulkForm.startNumber),
        count: parseInt(bulkForm.count),
      };

      await AdminAPI.createMultipleParkingSlots(bulkData);
      Alert.alert(
        "Success",
        `${bulkForm.count} parking slots created successfully`
      );
      fetchParkingSlots(selectedLot._id);
    } catch (error) {
      console.error("Error creating bulk parking slots:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to create parking slots"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (form, field, value) => {
    if (form === "slot") {
      setSlotForm({
        ...slotForm,
        [field]: value,
      });
    } else if (form === "bulk") {
      setBulkForm({
        ...bulkForm,
        [field]: value,
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "#1cc88a";
      case "occupied":
        return "#e74a3b";
      case "maintenance":
        return "#f6c23e";
      default:
        return "#858796";
    }
  };

  const renderParkingLotItem = ({ item }) => (
    <TouchableOpacity
      style={styles.lotItem}
      onPress={() => handleSelectLot(item)}
    >
      <Text style={styles.lotName}>{item.name}</Text>
      <Text style={styles.lotDetails}>
        Total Slots: {item.totalSlots} | Occupied: {item.occupiedSlots || 0}
      </Text>
      <Ionicons
        name="checkmark-circle"
        size={20}
        color={
          selectedLot && selectedLot._id === item._id
            ? "#4e73df"
            : "transparent"
        }
        style={styles.lotCheckmark}
      />
    </TouchableOpacity>
  );

  const renderParkingSlotItem = ({ item }) => (
    <View style={styles.slotItem}>
      <View style={styles.slotInfo}>
        <Text style={styles.slotNumber}>{item.slotNumber}</Text>
        <View style={styles.slotDetails}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          />
          <Text style={styles.slotZone}>Zone: {item.zone}</Text>
          <Text style={styles.slotStatus}>Status: {item.status}</Text>
        </View>
      </View>
      <View style={styles.slotActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditSlot(item)}
        >
          <Ionicons name="create-outline" size={20} color="#4e73df" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteSlot(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#e74a3b" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Manage Parking Slots"
        showMenu={false}
        showBack={true}
        onMenuPress={() => {}}
      />

      <View style={styles.content}>
        <View style={styles.lotSelector}>
          <Text style={styles.subtitle}>
            {selectedLot ? selectedLot.name : "Select a Parking Lot"}
          </Text>
          <TouchableOpacity
            style={styles.selectLotButton}
            onPress={() => setLotModalVisible(true)}
          >
            <Text style={styles.selectLotText}>Change</Text>
          </TouchableOpacity>
        </View>

        {!selectedLot ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-sport" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No parking lot selected</Text>
            <Text style={styles.emptySubtext}>
              Please select a parking lot to manage its slots
            </Text>
            <Button
              title="Select Parking Lot"
              onPress={() => setLotModalVisible(true)}
              style={styles.selectButton}
            />
          </View>
        ) : (
          <>
            <View style={styles.actionBar}>
              <TouchableOpacity
                style={[styles.actionBarButton, styles.addButton]}
                onPress={handleAddSlot}
              >
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.actionBarButtonText}>Add Slot</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBarButton, styles.bulkButton]}
                onPress={handleAddBulkSlots}
              >
                <Ionicons name="layers-outline" size={20} color="#fff" />
                <Text style={styles.actionBarButtonText}>Bulk Create</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4e73df" />
                <Text style={styles.loadingText}>Loading slots...</Text>
              </View>
            ) : parkingSlots.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="grid-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No parking slots found</Text>
                <Text style={styles.emptySubtext}>
                  Add slots using the buttons above
                </Text>
              </View>
            ) : (
              <FlatList
                data={parkingSlots}
                renderItem={renderParkingSlotItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.slotList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        )}
      </View>

      {/* Parking Lot Selection Modal */}
      <Modal
        visible={lotModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLotModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Parking Lot</Text>

            {parkingLots.length === 0 ? (
              <View style={styles.emptyModalContainer}>
                <Text style={styles.emptyModalText}>No parking lots found</Text>
                <Text style={styles.emptyModalSubtext}>
                  Please create parking lots first
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

            <Button
              title="Close"
              onPress={() => setLotModalVisible(false)}
              variant="outline"
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>

      {/* Add/Edit Slot Modal */}
      <Modal
        visible={slotModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSlotModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editMode ? "Edit Parking Slot" : "Add Parking Slot"}
            </Text>

            <Input
              label="Slot Number"
              value={slotForm.slotNumber}
              onChangeText={(text) =>
                handleInputChange("slot", "slotNumber", text)
              }
              placeholder="Enter slot number (e.g., A1)"
              style={styles.input}
            />

            <Input
              label="Zone"
              value={slotForm.zone}
              onChangeText={(text) => handleInputChange("slot", "zone", text)}
              placeholder="Enter zone (e.g., A)"
              style={styles.input}
            />

            <View style={styles.statusSelector}>
              <Text style={styles.statusLabel}>Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {["available", "occupied", "maintenance"].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      {
                        backgroundColor:
                          slotForm.status === status
                            ? getStatusColor(status)
                            : "#f8f9fc",
                      },
                    ]}
                    onPress={() => handleInputChange("slot", "status", status)}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: slotForm.status === status ? "#fff" : "#333",
                        },
                      ]}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setSlotModalVisible(false)}
                variant="outline"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={editMode ? "Update" : "Create"}
                onPress={handleSaveSlot}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Bulk Create Modal */}
      <Modal
        visible={bulkModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBulkModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Bulk Create Parking Slots</Text>

            <Input
              label="Zone"
              value={bulkForm.zone}
              onChangeText={(text) => handleInputChange("bulk", "zone", text)}
              placeholder="Enter zone (e.g., A)"
              style={styles.input}
            />

            <Input
              label="Start Number"
              value={bulkForm.startNumber}
              onChangeText={(text) =>
                handleInputChange("bulk", "startNumber", text)
              }
              placeholder="Enter start number (e.g., 1)"
              keyboardType="numeric"
              style={styles.input}
            />

            <Input
              label="Count"
              value={bulkForm.count}
              onChangeText={(text) => handleInputChange("bulk", "count", text)}
              placeholder="Enter number of slots to create"
              keyboardType="numeric"
              style={styles.input}
            />

            <View style={styles.statusSelector}>
              <Text style={styles.statusLabel}>Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {["available", "maintenance"].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      {
                        backgroundColor:
                          bulkForm.status === status
                            ? getStatusColor(status)
                            : "#f8f9fc",
                      },
                    ]}
                    onPress={() => handleInputChange("bulk", "status", status)}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: bulkForm.status === status ? "#fff" : "#333",
                        },
                      ]}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.bulkPreview}>
              This will create slots: {bulkForm.zone}
              {bulkForm.startNumber} to {bulkForm.zone}
              {parseInt(bulkForm.startNumber) + parseInt(bulkForm.count) - 1}
            </Text>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setBulkModalVisible(false)}
                variant="outline"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Create Slots"
                onPress={handleCreateBulkSlots}
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
  lotSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  selectLotButton: {
    backgroundColor: "#4e73df",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  selectLotText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
  actionBar: {
    flexDirection: "row",
    marginBottom: 16,
  },
  actionBarButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    flex: 1,
    justifyContent: "center",
  },
  addButton: {
    backgroundColor: "#f6c23e",
    marginRight: 8,
  },
  bulkButton: {
    backgroundColor: "#4e73df",
    marginLeft: 8,
  },
  actionBarButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8,
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
    marginBottom: 24,
  },
  selectButton: {
    width: 200,
  },
  lotList: {
    paddingBottom: 20,
  },
  slotList: {
    paddingBottom: 20,
  },
  lotItem: {
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
  lotName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  lotDetails: {
    fontSize: 14,
    color: "#666",
  },
  lotCheckmark: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  slotItem: {
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
  slotInfo: {
    flex: 1,
  },
  slotNumber: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  slotDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  slotZone: {
    fontSize: 14,
    color: "#666",
    marginRight: 12,
  },
  slotStatus: {
    fontSize: 14,
    color: "#666",
  },
  slotActions: {
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
  statusSelector: {
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontWeight: "500",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  emptyModalContainer: {
    padding: 24,
    alignItems: "center",
  },
  emptyModalText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptyModalSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  bulkPreview: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
    fontStyle: "italic",
  },
});
