import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import ParkingCard from "../components/ParkingCard";
import { ParkingLotsAPI } from "../config/api";

export default function ParkingLotScreen({ route, navigation }) {
  const { metroStationId, stationName, arrivalTime, departureTime } =
    route.params;
  const [parkingLots, setParkingLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);
  const [zones, setZones] = useState([]);
  const [loadingZones, setLoadingZones] = useState(false);

  useEffect(() => {
    fetchParkingLots();
  }, []);

  const fetchParkingLots = async () => {
    try {
      setLoading(true);
      // First get all parking lots for the metro station
      const response = await ParkingLotsAPI.getByMetroStation(metroStationId);

      // For each parking lot, check availability for the selected time period
      const lotsWithAvailability = await Promise.all(
        response.data.map(async (lot) => {
          try {
            // Check availability for the selected time period
            const availabilityResponse = await ParkingLotsAPI.checkAvailability(
              lot._id,
              arrivalTime,
              departureTime
            );

            // Add availability data to the lot object
            return {
              ...lot,
              availableSlots: availabilityResponse.data?.availableSlots || 0,
              availabilityPercentage:
                availabilityResponse.data?.availabilityPercentage || 0,
            };
          } catch (error) {
            console.error(
              `Error checking availability for lot ${lot._id}:`,
              error
            );
            // Return original lot data if availability check fails
            return {
              ...lot,
              availableSlots: 0,
              availabilityPercentage: 0,
            };
          }
        })
      );

      setParkingLots(lotsWithAvailability);
    } catch (error) {
      console.error("Error fetching parking lots:", error);
      setError("Failed to load parking lots. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleParkingLotSelect = async (parkingLot) => {
    try {
      setSelectedLot(parkingLot);
      setLoadingZones(true);

      // Fetch availability for the selected time period
      const availabilityResponse = await ParkingLotsAPI.checkAvailability(
        parkingLot._id,
        arrivalTime,
        departureTime
      );

      if (!availabilityResponse.data || !availabilityResponse.data.zones) {
        throw new Error("Invalid availability data format");
      }

      setZones(availabilityResponse.data.zones);
    } catch (error) {
      console.error("Error fetching zones:", error);
      Alert.alert("Error", "Failed to load parking zones");
      setSelectedLot(null);
    } finally {
      setLoadingZones(false);
    }
  };

  const handleZoneSelect = (zone) => {
    navigation.navigate("ParkingZone", {
      parkingLotId: selectedLot._id,
      parkingLotName: selectedLot.name,
      zone,
      arrivalTime,
      departureTime,
    });
  };

  const renderParkingLot = ({ item }) => (
    <ParkingCard
      name={item.name}
      totalSlots={item.totalSlots}
      availableSlots={item.availableSlots}
      // Show availability percentage as price
      // price={`${Math.round(item.availabilityPercentage)}% free`}
      // distance="0.5 km" // This would ideally be calculated
      onPress={() => handleParkingLotSelect(item)}
      style={styles.parkingCard}
    />
  );

  const renderZoneItem = ({ item }) => (
    <TouchableOpacity
      style={styles.zoneItem}
      onPress={() => handleZoneSelect(item)}
    >
      <Ionicons name="grid-outline" size={24} color="#4e73df" />
      <Text style={styles.zoneName}>Zone {item}</Text>
      <Ionicons name="chevron-forward" size={24} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Parking Lots" showBack={true} />

      <View style={styles.stationInfoContainer}>
        <Ionicons name="location" size={24} color="#4e73df" />
        <Text style={styles.stationName}>{stationName}</Text>
      </View>

      <View style={styles.timeInfoContainer}>
        <View style={styles.timeInfo}>
          <Ionicons name="time-outline" size={18} color="#666" />
          <Text style={styles.timeText}>
            {new Date(arrivalTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" - "}
            {new Date(departureTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        <Text style={styles.dateText}>
          {new Date(arrivalTime).toLocaleDateString()}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4e73df" />
          <Text style={styles.loadingText}>Loading parking lots...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : selectedLot ? (
        // Show zones if a parking lot is selected
        <View style={styles.zonesContainer}>
          <View style={styles.selectedLotInfo}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedLot(null)}
            >
              <Ionicons name="arrow-back" size={24} color="#4e73df" />
            </TouchableOpacity>
            <Text style={styles.selectedLotName}>{selectedLot.name}</Text>
          </View>

          <Text style={styles.zonesTitle}>Select a Zone</Text>

          {loadingZones ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4e73df" />
              <Text style={styles.loadingText}>Loading zones...</Text>
            </View>
          ) : zones.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="grid-outline" size={48} color="#999" />
              <Text style={styles.emptyText}>
                No zones available for this parking lot
              </Text>
            </View>
          ) : (
            <FlatList
              data={zones}
              renderItem={renderZoneItem}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.zonesList}
            />
          )}
        </View>
      ) : parkingLots.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={48} color="#999" />
          <Text style={styles.emptyText}>
            No parking lots available at this station
          </Text>
        </View>
      ) : (
        <FlatList
          data={parkingLots}
          renderItem={renderParkingLot}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
  },
  stationInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
  },
  stationName: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#333",
  },
  timeInfoContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 16,
    marginLeft: 8,
    color: "#333",
  },
  dateText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    marginLeft: 26,
  },
  listContent: {
    padding: 16,
  },
  parkingCard: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  zonesContainer: {
    flex: 1,
    padding: 16,
  },
  selectedLotInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
  },
  selectedLotName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  zonesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 12,
  },
  zonesList: {
    paddingBottom: 16,
  },
  zoneItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  zoneName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginLeft: 12,
  },
});
