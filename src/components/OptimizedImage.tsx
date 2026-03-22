import React, { useState, memo } from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { getOptimizedImageUrl, getPlaceholderColor, IMAGE_SIZES } from '../utils';
import { colors } from '../constants';

interface OptimizedImageProps {
  uri?: string;
  fallbackText?: string;
  size?: keyof typeof IMAGE_SIZES;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  borderRadius?: number;
}

const OptimizedImageComponent: React.FC<OptimizedImageProps> = ({
  uri,
  fallbackText = '?',
  size = 'medium',
  width,
  height,
  style,
  borderRadius = 0,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const dimensions = {
    width: width || IMAGE_SIZES[size].width,
    height: height || IMAGE_SIZES[size].height,
  };

  const optimizedUri = uri
    ? getOptimizedImageUrl(uri, { ...dimensions, quality: IMAGE_SIZES[size].quality })
    : undefined;

  const placeholderColor = getPlaceholderColor(fallbackText);

  const handleLoad = () => {
    setLoaded(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleError = () => {
    setError(true);
  };

  // Show placeholder if no URI or error
  if (!optimizedUri || error) {
    return (
      <View
        style={[
          styles.placeholder,
          { width: dimensions.width, height: dimensions.height, borderRadius },
          { backgroundColor: placeholderColor },
          style,
        ]}
      >
        <Text style={styles.placeholderText}>
          {fallbackText.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <View style={[{ width: dimensions.width, height: dimensions.height }, style]}>
      {/* Placeholder underneath */}
      {!loaded && (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.placeholder,
            { backgroundColor: placeholderColor, borderRadius },
          ]}
        >
          <Text style={styles.placeholderText}>
            {fallbackText.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Actual image with fade in */}
      <Animated.Image
        source={{ uri: optimizedUri }}
        style={[
          { width: dimensions.width, height: dimensions.height, borderRadius },
          { opacity: fadeAnim },
        ]}
        onLoad={handleLoad}
        onError={handleError}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    opacity: 0.8,
  },
});

export const OptimizedImage = memo(OptimizedImageComponent);
