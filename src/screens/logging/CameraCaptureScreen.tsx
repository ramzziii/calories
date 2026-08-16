import React, { useRef, useState } from "react";
import { Pressable as RNPressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import Button from "@/components/Button";
import { colors, radii, spacing, typography } from "@/theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "CameraCapture">;

export default function CameraCaptureScreen() {
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionEmoji}>📷</Text>
        <Text style={typography.h2}>Camera access needed</Text>
        <Text
          style={[typography.bodyMuted, { textAlign: "center", marginTop: spacing.sm }]}
        >
          YumTrack uses your camera to identify food and estimate nutrition from photos.
        </Text>
        <Button
          label="Allow camera access"
          onPress={requestPermission}
          style={{ marginTop: spacing.lg }}
        />
      </SafeAreaView>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) {
        navigation.replace("ScanResults", { imageUri: photo.uri });
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      navigation.replace("ScanResults", { imageUri: result.assets[0].uri });
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      <SafeAreaView style={styles.overlay}>
        <View style={styles.frameHint}>
          <Text style={styles.frameHintText}>Center your plate in frame</Text>
        </View>
        <View style={styles.controls}>
          <Button
            label="Choose from library"
            variant="ghost"
            onPress={handlePickFromLibrary}
          />
          <View style={styles.shutterRow}>
            <RNPressable
              onPress={handleCapture}
              disabled={isCapturing}
              style={({ pressed }) => [styles.shutterOuter, pressed && { opacity: 0.7 }]}
            >
              <View style={styles.shutterInner} />
            </RNPressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  permissionEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  frameHint: {
    alignSelf: "center",
    marginTop: spacing.xl,
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  frameHintText: {
    color: "white",
    fontWeight: "600",
  },
  controls: {
    alignItems: "center",
    paddingBottom: spacing.xl,
  },
  shutterRow: {
    marginTop: spacing.md,
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.accent,
  },
});
