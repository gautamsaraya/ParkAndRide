import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import DateTimePicker from "../components/DateTimePicker";
import Button from "../components/Button";
import { MetroStationsAPI } from "../config/api";

export default function ParkingSearchScreen({ route, navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [arrivalTime, setArrivalTime] = useState(new Date());
  const [departureTime, setDepartureTime] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 2); // Default: current time + 2 hours
    return date;
  });

  useEffect(() => {
    // Check if there's a preselected station from navigation params
    if (route.params?.selectedStation) {
      setSelectedStation(route.params.selectedStation);
      setSearchQuery(route.params.selectedStation.name);
    }
  }, []);

  // Add debounced search effect
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        handleSearch();
      } else {
        setStations([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setStations([]);
      return;
    }

    try {
      setLoading(true);
      const response = await MetroStationsAPI.search(searchQuery);
      setStations(response.data);
    } catch (error) {
      console.error("Error searching stations:", error);
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStationSelect = (station) => {
    setSelectedStation(station);
    setSearchQuery(station.name);
  };

  const handleContinue = () => {
    if (!selectedStation) {
      alert("Please select a metro station");
      return;
    }

    if (arrivalTime >= departureTime) {
      alert("Departure time must be after arrival time");
      return;
    }

    navigation.navigate("ParkingLot", {
      metroStationId: selectedStation._id,
      stationName: selectedStation.name,
      arrivalTime: arrivalTime.toISOString(),
      departureTime: departureTime.toISOString(),
    });
  };

  return (
    <View style={styles.container}>
      <Header title="Find Parking" showBack={true} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <Text style={styles.sectionTitle}>Select Metro Station</Text>
        <SearchBar
          placeholder="Search metro stations"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSearch={handleSearch}
          suggestions={stations}
          loading={loading}
          onSuggestionPress={handleStationSelect}
          style={styles.searchBar}
          showSuggestions={stations.length > 0}
        />

        {selectedStation && (
          <View style={styles.selectedStationContainer}>
            <View style={styles.selectedStation}>
              <Ionicons name="location" size={24} color="#4e73df" />
              <Text style={styles.selectedStationText}>
                {selectedStation.name}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedStation(null)}>
              <Ionicons name="close-circle" size={24} color="#999" />
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Select Time</Text>
        <View style={styles.timeSelectionContainer}>
          <DateTimePicker
            mode="datetime"
            label="Arrival Time"
            value={arrivalTime}
            onChange={setArrivalTime}
            style={styles.timePicker}
          />
          <DateTimePicker
            mode="datetime"
            label="Departure Time"
            value={departureTime}
            onChange={setDepartureTime}
            style={styles.timePicker}
          />
        </View>

        <Button
          title="Find Parking Lots"
          onPress={handleContinue}
          style={styles.continueButton}
          disabled={!selectedStation}
          fullWidth
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 16,
    color: "#333",
  },
  searchBar: {
    marginBottom: 16,
  },
  selectedStationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#e6eeff",
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  selectedStation: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedStationText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
    color: "#333",
  },
  timeSelectionContainer: {
    marginBottom: 24,
  },
  timePicker: {
    marginBottom: 16,
  },
  continueButton: {
    marginTop: 16,
  },
});
