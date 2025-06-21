import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const ParkingCard = ({
  name,
  location,
  totalSlots,
  availableSlots,
  price,
  distance,
  onPress,
  style,
  showBadge = false,
  badgeText = "",
}) => {
  // Calculate availability percentage
  const availabilityPercentage = Math.round(
    (availableSlots / totalSlots) * 100
  );

  // Determine availability status
  let availabilityStatus = "High";
  let availabilityColor = "#4caf50";

  if (availabilityPercentage < 40) {
    availabilityStatus = "Medium";
    availabilityColor = "#ff9800";
  }

  if (availabilityPercentage < 10) {
    availabilityStatus = "Low";
    availabilityColor = "#f44336";
  }

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={onPress}>
      {showBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      )}

      <View style={styles.imageContainer}>
        <Image
          source={require("../assets/parking-placeholder.png")}
          style={styles.image}
          defaultSource={require("../assets/parking-placeholder.png")}
        />
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>

        <View style={styles.locationContainer}>
          <Icon name="location-outline" size={14} color="#757575" />
          <Text style={styles.location} numberOfLines={1}>
            {location}
          </Text>
          {distance && <Text style={styles.distance}>{distance} km</Text>}
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.availabilityContainer}>
            <Text style={styles.availabilityLabel}>Available</Text>
            <View style={styles.availabilityRow}>
              <Text style={styles.availabilityValue}>
                {availableSlots} / {totalSlots}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: availabilityColor },
                ]}
              >
                <Text style={styles.statusText}>{availabilityStatus}</Text>
              </View>
            </View>
          </View>

          {price && (
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.priceValue}>₹{price}/hr</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
    overflow: "hidden",
    flexDirection: "row",
  },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#4e73df",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    zIndex: 1,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  imageContainer: {
    width: 100,
    height: 100,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  contentContainer: {
    flex: 1,
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  location: {
    fontSize: 12,
    color: "#757575",
    flex: 1,
    marginLeft: 4,
  },
  distance: {
    fontSize: 12,
    color: "#4e73df",
    fontWeight: "500",
    marginLeft: 8,
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  availabilityContainer: {
    flex: 1,
  },
  availabilityLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 2,
  },
  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  availabilityValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#212121",
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "500",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4e73df",
  },
});

export default ParkingCard;
