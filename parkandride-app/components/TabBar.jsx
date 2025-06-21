import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const TabBar = ({
  tabs = [
    { key: "parking", title: "Reserve Parking", icon: "car-outline" },
    { key: "ride", title: "Book Ride", icon: "bus-outline" },
  ],
  activeTab = "parking",
  onTabPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;

        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => onTabPress && onTabPress(tab.key)}
          >
            <Icon
              name={tab.icon}
              size={20}
              color={isActive ? "#4e73df" : "#757575"}
              style={styles.tabIcon}
            />
            <Text style={[styles.tabTitle, isActive && styles.activeTabTitle]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: "#eef2ff",
  },
  tabIcon: {
    marginRight: 6,
  },
  tabTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#757575",
  },
  activeTabTitle: {
    color: "#4e73df",
    fontWeight: "600",
  },
});

export default TabBar;
