import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";

const RazorpayCheckout = ({
  visible,
  amount, // in INR
  name = "Park and Ride",
  description = "Parking Reservation",
  prefillEmail = "",
  prefillContact = "",
  prefillName = "",
  orderId = "",
  onPaymentSuccess,
  onPaymentError,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Razorpay test key
  const razorpayKeyId = "rzp_test_1DP5mmOlF5G5ag";

  // HTML to render the Razorpay checkout
  const generateCheckoutHTML = () => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Razorpay Checkout</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #f0f4f8;
          }
          .container {
            text-align: center;
            padding: 20px;
          }
          .loading {
            font-size: 16px;
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <p class="loading">Initializing payment...</p>
        </div>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            const options = {
              key: '${razorpayKeyId}',
              amount: ${amount * 100}, // Amount in paise
              currency: 'INR',
              name: '${name}',
              description: '${description}',
              order_id: '${orderId}', // Optional, for capturing payments
              prefill: {
                name: '${prefillName}',
                email: '${prefillEmail}',
                contact: '${prefillContact}'
              },
              theme: {
                color: '#4e73df'
              },
              handler: function(response) {
                // Send message to React Native
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'payment_success',
                  data: response
                }));
              },
              modal: {
                ondismiss: function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'payment_cancelled'
                  }));
                }
              }
            };
            
            try {
              const rzp = new Razorpay(options);
              rzp.open();
            } catch (error) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'payment_error',
                data: error.message
              }));
            }
          });
        </script>
      </body>
      </html>
    `;
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case "payment_success":
          onPaymentSuccess && onPaymentSuccess(data.data);
          break;
        case "payment_error":
          onPaymentError && onPaymentError(data.data);
          break;
        case "payment_cancelled":
          onClose && onClose();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Error parsing WebView message:", error);
      onPaymentError && onPaymentError("Payment failed");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Secure Payment</Text>
          <View style={styles.placeholder} />
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setLoading(true);
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            source={{ html: generateCheckoutHTML() }}
            onMessage={handleMessage}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              setError(`WebView error: ${nativeEvent.description}`);
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              setError(`WebView HTTP error: ${nativeEvent.statusCode}`);
            }}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        )}

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4e73df" />
            <Text style={styles.loadingText}>Loading payment gateway...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
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
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#4e73df",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default RazorpayCheckout;
