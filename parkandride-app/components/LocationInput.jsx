import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Input from "./Input";

const GEOAPIFY_API_KEY = "b705dea2c97e4e768d951ed373f3d977";
const { width } = Dimensions.get("window");

const LocationInput = ({
  label,
  placeholder,
  value,
  onLocationSelect,
  style,
  error,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 3) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
            searchQuery
          )}&apiKey=${GEOAPIFY_API_KEY}&format=json`
        );
        const data = await response.json();

        if (data.results) {
          const formattedSuggestions = data.results.map((result) => ({
            id: result.place_id,
            name: result.formatted,
            coordinates: {
              type: "Point",
              coordinates: [result.lon, result.lat],
            },
          }));
          setSuggestions(formattedSuggestions);
          if (formattedSuggestions.length > 0) {
            setShowSuggestions(true);
          }
        }
      } catch (err) {
        console.error("Error fetching location suggestions:", err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleInputChange = (text) => {
    setSearchQuery(text);
    if (text.trim().length >= 3) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setSearchQuery(suggestion.name);
    onLocationSelect(suggestion);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleInputFocus = () => {
    if (searchQuery.trim().length >= 3 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Use a short timeout to allow the suggestion press to register before hiding
    setTimeout(() => {
      if (!showSuggestions) return;
      setShowSuggestions(false);
    }, 200);
  };

  const renderSuggestionsModal = () => {
    if (!showSuggestions || searchQuery.trim().length < 3) {
      return null;
    }

    return (
      <View style={[styles.suggestionsContainer, { width: width - 32 }]}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color="#4e73df" size="small" />
          </View>
        ) : suggestions.length === 0 ? (
          <Text style={styles.noResults}>No locations found</Text>
        ) : (
          <ScrollView
            style={styles.suggestionsList}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.id}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(suggestion)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="location-outline"
                  size={16}
                  color="#666"
                  style={styles.suggestionIcon}
                />
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {suggestion.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <Input
        ref={inputRef}
        label={label}
        value={searchQuery}
        onChangeText={handleInputChange}
        placeholder={placeholder}
        leftIcon={<Ionicons name="location-outline" size={20} color="#666" />}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        error={error}
      />

      {renderSuggestionsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1000,
    elevation: 1000,
  },
  suggestionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
    maxHeight: 200,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  suggestionIcon: {
    marginRight: 10,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  loaderContainer: {
    padding: 20,
    alignItems: "center",
  },
  noResults: {
    padding: 15,
    textAlign: "center",
    color: "#666",
  },
});

export default LocationInput;
