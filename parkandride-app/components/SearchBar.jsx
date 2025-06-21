import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const SearchBar = ({
  placeholder = "Search",
  value,
  onChangeText,
  onSearch,
  suggestions = [],
  loading = false,
  onSuggestionPress,
  style,
  showSuggestions = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);

  useEffect(() => {
    // Only show suggestions if:
    // 1. Input is focused
    // 2. There are suggestions
    // 3. showSuggestions prop is true
    // 4. User has typed something (value has content)
    setShowSuggestionsList(
      isFocused &&
        suggestions.length > 0 &&
        showSuggestions &&
        value.trim().length > 0
    );
  }, [isFocused, suggestions, showSuggestions, value]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for suggestion selection
    setTimeout(() => {
      setIsFocused(false);
    }, 200);
  };

  const handleSuggestionPress = (suggestion) => {
    if (onSuggestionPress) {
      onSuggestionPress(suggestion);
    }
    setShowSuggestionsList(false);
  };

  const handleSubmit = () => {
    if (onSearch) {
      onSearch(value);
    }
  };

  const renderSuggestion = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <Icon
        name="location-outline"
        size={16}
        color="#757575"
        style={styles.suggestionIcon}
      />
      <Text style={styles.suggestionText} numberOfLines={1}>
        {item.name || item.title || item.label || item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.searchContainer, isFocused && styles.focusedSearch]}>
        <Icon
          name="search-outline"
          size={20}
          color="#757575"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9e9e9e"
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
        />
        {loading ? (
          <ActivityIndicator
            size="small"
            color="#4e73df"
            style={styles.loadingIcon}
          />
        ) : value ? (
          <TouchableOpacity
            onPress={() => onChangeText("")}
            style={styles.clearButton}
          >
            <Icon name="close-circle" size={16} color="#9e9e9e" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Use Modal for suggestions to avoid ScrollView nesting issues */}
      <Modal
        visible={showSuggestionsList}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuggestionsList(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSuggestionsList(false)}
        >
          <View
            style={[
              styles.suggestionsContainer,
              { top: 52 + (style?.marginTop || 0) },
            ]}
          >
            <SafeAreaView style={{ maxHeight: 200 }}>
              <FlatList
                data={suggestions}
                renderItem={renderSuggestion}
                keyExtractor={(item, index) =>
                  item.id?.toString() ||
                  item._id?.toString() ||
                  item.name?.toString() ||
                  index.toString()
                }
                keyboardShouldPersistTaps="always"
                style={styles.suggestionsList}
                contentContainerStyle={styles.suggestionsContent}
              />
            </SafeAreaView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  focusedSearch: {
    borderColor: "#4e73df",
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#212121",
    height: "100%",
  },
  loadingIcon: {
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  suggestionsContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
  },
  suggestionsList: {
    borderRadius: 8,
  },
  suggestionsContent: {
    paddingVertical: 4,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  suggestionIcon: {
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: "#212121",
    flex: 1,
  },
});

export default SearchBar;
