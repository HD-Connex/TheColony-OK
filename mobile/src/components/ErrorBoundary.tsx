import React, { Component, type ReactNode } from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global Error Boundary — catches render errors on any screen.
 *
 * Prevents the entire app from going blank. Shows a user-friendly error
 * with a retry button. Wrap individual screens or the root layout.
 *
 * Strategy: Catch error, log to console (Sentry in production), show retry UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
    console.error("[ErrorBoundary]", error.message, errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View className="flex-1 items-center justify-center bg-surface-950 px-6">
          <Text className="text-red-400 text-3xl mb-2">!</Text>
          <Text className="text-white text-lg font-semibold text-center mb-2">
            Something went wrong
          </Text>
          <Text className="text-surface-400 text-sm text-center mb-6 max-w-xs">
            {this.state.error?.message ?? "An unexpected error occurred"}
          </Text>
          <TouchableOpacity
            onPress={this.handleRetry}
            className="bg-brand-600 px-6 py-3 rounded-lg active:bg-brand-700"
            accessibilityLabel="Retry"
            accessibilityRole="button"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
