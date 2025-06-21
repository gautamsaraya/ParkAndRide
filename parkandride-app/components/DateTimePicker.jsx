import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";

const CustomDateTimePicker = ({
  value,
  onChange,
  mode = "datetime", // 'date', 'time', 'datetime'
  label,
  placeholder = "Select date & time",
  error,
  style,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("date"); // 'date' or 'time'

  const handlePress = () => {
    if (mode === "datetime") {
      setPickerMode("date");
    } else {
      setPickerMode(mode);
    }
    setShowPicker(true);
  };

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    if (event.type === "dismissed") {
      return;
    }

    if (selectedDate) {
      // If we're in datetime mode and just finished picking the date, show the time picker
      if (
        mode === "datetime" &&
        pickerMode === "date" &&
        Platform.OS === "android"
      ) {
        onChange(selectedDate);
        setPickerMode("time");
        setShowPicker(true);
        return;
      }

      onChange(selectedDate);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";

    if (mode === "date" || mode === "datetime") {
      const formattedDate = date.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      if (mode === "date") return formattedDate;

      const formattedTime = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return `${formattedDate}, ${formattedTime}`;
    } else {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.inputContainer, error && styles.errorInput]}
        onPress={handlePress}
      >
        <Icon
          name={mode === "time" ? "time-outline" : "calendar-outline"}
          size={20}
          color="#757575"
          style={styles.icon}
        />
        <Text style={[styles.valueText, !value && styles.placeholderText]}>
          {value ? formatDate(value) : placeholder}
        </Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {showPicker &&
        (Platform.OS === "ios" ? (
          <Modal transparent={true} animationType="slide" visible={showPicker}>
            <View style={styles.modalContainer}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity
                    onPress={() => setShowPicker(false)}
                    style={styles.pickerButton}
                  >
                    <Text style={styles.pickerButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerTitle}>
                    {pickerMode === "date" ? "Select Date" : "Select Time"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowPicker(false);
                      if (mode === "datetime" && pickerMode === "date") {
                        setPickerMode("time");
                        setTimeout(() => setShowPicker(true), 300);
                      }
                    }}
                    style={styles.pickerButton}
                  >
                    <Text style={styles.pickerButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={value || new Date()}
                  mode={pickerMode}
                  display="spinner"
                  onChange={handleChange}
                  style={styles.picker}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={value || new Date()}
            mode={pickerMode}
            display="default"
            onChange={handleChange}
          />
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: "100%",
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 6,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    height: 48,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 8,
  },
  valueText: {
    flex: 1,
    fontSize: 16,
    color: "#212121",
  },
  placeholderText: {
    color: "#9e9e9e",
  },
  errorInput: {
    borderColor: "#e74a3b",
  },
  errorText: {
    color: "#e74a3b",
    fontSize: 12,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  pickerButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  pickerButtonText: {
    fontSize: 16,
    color: "#4e73df",
    fontWeight: "600",
  },
  picker: {
    height: 250,
  },
});

export default CustomDateTimePicker;
