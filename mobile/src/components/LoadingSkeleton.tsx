import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

interface SkeletonProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
}

/**
 * Skeleton loading placeholder with pulse animation.
 *
 * Used on every screen during data fetching to prevent layout shift
 * and give users immediate visual feedback.
 */
export function Skeleton({ className = "", width, height, borderRadius = 8 }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ opacity, width: width as any, height: height as any, borderRadius }}
      className={`bg-surface-700 ${className}`}
    />
  );
}

/** Program card skeleton — matches ProgramCard layout */
export function ProgramCardSkeleton() {
  return (
    <View className="mb-4">
      <Skeleton className="w-full" height={180} borderRadius={12} />
      <View className="mt-2 px-1">
        <Skeleton height={16} width="70%" borderRadius={4} />
        <View className="mt-1">
          <Skeleton height={12} width="50%" borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

/** Full-screen player skeleton */
export function PlayerSkeleton() {
  return (
    <View className="flex-1 bg-black">
      <Skeleton className="w-full flex-1" height="100%" borderRadius={0} />
    </View>
  );
}

/** Schedule list skeleton */
export function ScheduleListSkeleton() {
  return (
    <View className="px-4 pt-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} className="flex-row mb-4">
          <Skeleton width={120} height={68} borderRadius={8} />
          <View className="flex-1 ml-3 justify-center">
            <Skeleton height={14} width="80%" borderRadius={4} />
            <View className="mt-1">
              <Skeleton height={11} width="50%" borderRadius={4} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
