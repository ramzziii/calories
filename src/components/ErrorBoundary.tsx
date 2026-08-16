import React from "react";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/Button";
import { colors, spacing, typography } from "@/theme/theme";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Unhandled render error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <SafeAreaView style={styles.container}>
          <Text style={styles.emoji}>🍽️</Text>
          <Text style={typography.h2}>Something went wrong</Text>
          <Text style={styles.message}>
            Plateful ran into an unexpected error. Your data is safe — try again.
          </Text>
          <Button
            label="Try again"
            onPress={this.handleReset}
            style={{ marginTop: spacing.lg }}
          />
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  message: {
    ...typography.bodyMuted,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});
