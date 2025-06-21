import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

const Button = ({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  loading = false,
  variant = "primary", // primary, secondary, outline
  size = "medium", // small, medium, large
  fullWidth = false,
  icon,
}) => {
  const getButtonStyle = () => {
    let buttonStyle = [styles.button];

    // Add variant styles
    if (variant === "primary") {
      buttonStyle.push(styles.primaryButton);
    } else if (variant === "secondary") {
      buttonStyle.push(styles.secondaryButton);
    } else if (variant === "outline") {
      buttonStyle.push(styles.outlineButton);
    }

    // Add size styles
    if (size === "small") {
      buttonStyle.push(styles.smallButton);
    } else if (size === "large") {
      buttonStyle.push(styles.largeButton);
    }

    // Add full width style
    if (fullWidth) {
      buttonStyle.push(styles.fullWidth);
    }

    // Add disabled style
    if (disabled || loading) {
      buttonStyle.push(styles.disabledButton);
    }

    // Add custom style
    if (style) {
      buttonStyle.push(style);
    }

    return buttonStyle;
  };

  const getTextStyle = () => {
    let textStyleArray = [styles.buttonText];

    // Add variant text styles
    if (variant === "primary") {
      textStyleArray.push(styles.primaryText);
    } else if (variant === "secondary") {
      textStyleArray.push(styles.secondaryText);
    } else if (variant === "outline") {
      textStyleArray.push(styles.outlineText);
    }

    // Add size text styles
    if (size === "small") {
      textStyleArray.push(styles.smallText);
    } else if (size === "large") {
      textStyleArray.push(styles.largeText);
    }

    // Add disabled text style
    if (disabled || loading) {
      textStyleArray.push(styles.disabledText);
    }

    // Add custom text style
    if (textStyle) {
      textStyleArray.push(textStyle);
    }

    return textStyleArray;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? "#4e73df" : "#fff"}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
  },
  primaryButton: {
    backgroundColor: "#4e73df",
  },
  secondaryButton: {
    backgroundColor: "#858796",
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#4e73df",
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 80,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  fullWidth: {
    width: "100%",
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  primaryText: {
    color: "#fff",
  },
  secondaryText: {
    color: "#fff",
  },
  outlineText: {
    color: "#4e73df",
  },
  smallText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 18,
  },
  disabledText: {
    opacity: 0.8,
  },
});

export default Button;
