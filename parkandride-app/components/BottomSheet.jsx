import React, { useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SNAP_POINTS = {
  TOP: SCREEN_HEIGHT * 0.9,
  MIDDLE: SCREEN_HEIGHT * 0.5,
  BOTTOM: SCREEN_HEIGHT * 0.25,
};

const BottomSheet = ({
  visible,
  onClose,
  children,
  snapPoint = "middle", // 'top', 'middle', 'bottom'
  enableDrag = true,
  closeOnBackdropPress = true,
  style,
}) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const lastGestureDy = useRef(0);

  const getSnapPointValue = () => {
    switch (snapPoint) {
      case "top":
        return SNAP_POINTS.TOP;
      case "bottom":
        return SNAP_POINTS.BOTTOM;
      case "middle":
      default:
        return SNAP_POINTS.MIDDLE;
    }
  };

  const snapPointValue = getSnapPointValue();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enableDrag,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return enableDrag && gestureState.dy > 0;
      },
      onPanResponderMove: (_, gestureState) => {
        const newTranslateY = lastGestureDy.current + gestureState.dy;
        if (newTranslateY >= 0) {
          translateY.setValue(newTranslateY);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        lastGestureDy.current += gestureState.dy;

        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          // Close the sheet
          closeSheet();
        } else {
          // Snap back to position
          snapToPosition();
        }
      },
    })
  ).current;

  const snapToPosition = () => {
    lastGestureDy.current = 0;
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
      speed: 12,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      if (onClose) {
        onClose();
      }
    });
  };

  useEffect(() => {
    if (visible) {
      lastGestureDy.current = 0;
      translateY.setValue(SCREEN_HEIGHT);
      snapToPosition();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <TouchableWithoutFeedback
        onPress={closeOnBackdropPress ? closeSheet : undefined}
      >
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY }],
            height: snapPointValue,
          },
          style,
        ]}
      >
        <View {...panResponder.panHandlers}>
          <View style={styles.dragHandle}>
            <View style={styles.dragIndicator} />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.content}>{children}</View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 16,
  },
  dragHandle: {
    width: "100%",
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ddd",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

export default BottomSheet;
