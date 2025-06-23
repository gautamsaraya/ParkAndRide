import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

const Header = ({
  title,
  showMenu = true,
  showBack = false,
  onMenuPress,
  onBackPress,
}) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      // Default behavior: open drawer if available
      navigation.openDrawer?.();
    }
  };

  // Convert showBack to boolean if it's passed as a string
  const shouldShowBack = showBack === true || showBack === "true";
  const shouldShowMenu = showMenu === true || showMenu === "true";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        {shouldShowBack ? (
          <TouchableOpacity onPress={handleBackPress} style={styles.iconButton}>
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        ) : shouldShowMenu ? (
          <TouchableOpacity onPress={handleMenuPress} style={styles.iconButton}>
            <Icon name="menu" size={24} color="#000" />
          </TouchableOpacity>
        ) : (
          <View style={styles.emptySpace} />
        )}

        <Text style={styles.title}>{title}</Text>

        <View style={styles.emptySpace} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    flex: 1,
    textAlign: "center",
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptySpace: {
    width: 40,
  },
});

export default Header;
