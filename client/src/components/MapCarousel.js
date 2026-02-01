import { useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Image,
  Animated,
  Easing,
} from "react-native";
import {
  MAP_OPTIONS,
  CAROUSEL_SMALL_W,
  CAROUSEL_SMALL_H,
  CAROUSEL_BIG_W,
  CAROUSEL_BIG_H,
  CAROUSEL_GAP,
  CAROUSEL_REST_X,
  CAROUSEL_STEP,
  CAROUSEL_VIEW_W,
  SLIDE_DURATION,
} from "../constants";

const CAROUSEL_EASING = Easing.bezier(0.25, 0.1, 0.25, 1);
const CAROUSEL_VIEW_CENTER = CAROUSEL_VIEW_W / 2;

export default function MapCarousel({
  mapOptions = MAP_OPTIONS,
  selectedId,
  onSelect,
}) {
  const carouselSlide = useRef(new Animated.Value(CAROUSEL_REST_X)).current;
  const carouselAnimating = useRef(false);

  const slideToPrev = useCallback(() => {
    if (carouselAnimating.current) return;
    const len = mapOptions.length;
    const idx = mapOptions.findIndex((m) => m.id === selectedId);
    const prevId = mapOptions[(idx - 1 + len) % len].id;
    carouselAnimating.current = true;
    Animated.timing(carouselSlide, {
      toValue: 0,
      duration: SLIDE_DURATION,
      easing: CAROUSEL_EASING,
      useNativeDriver: true,
    }).start(() => {
      onSelect(prevId);
      carouselSlide.setValue(CAROUSEL_REST_X);
      carouselAnimating.current = false;
    });
  }, [selectedId, mapOptions, onSelect, carouselSlide]);

  const slideToNext = useCallback(() => {
    if (carouselAnimating.current) return;
    const len = mapOptions.length;
    const idx = mapOptions.findIndex((m) => m.id === selectedId);
    const nextId = mapOptions[(idx + 1) % len].id;
    carouselAnimating.current = true;
    Animated.timing(carouselSlide, {
      toValue: CAROUSEL_REST_X - CAROUSEL_STEP,
      duration: SLIDE_DURATION,
      easing: CAROUSEL_EASING,
      useNativeDriver: true,
    }).start(() => {
      onSelect(nextId);
      carouselSlide.setValue(CAROUSEL_REST_X);
      carouselAnimating.current = false;
    });
  }, [selectedId, mapOptions, onSelect, carouselSlide]);

  const selectById = useCallback(
    (id) => {
      if (carouselAnimating.current) return;
      onSelect(id);
      carouselSlide.setValue(CAROUSEL_REST_X);
    },
    [onSelect, carouselSlide],
  );

  const mapIndex = mapOptions.findIndex((m) => m.id === selectedId);
  const len = mapOptions.length;
  const prevPrevMap = mapOptions[(mapIndex - 2 + len * 2) % len];
  const prevMap = mapOptions[(mapIndex - 1 + len) % len];
  const currMap = mapOptions[mapIndex];
  const nextMap = mapOptions[(mapIndex + 1) % len];
  const nextNextMap = mapOptions[(mapIndex + 2) % len];
  const showMaps = [prevPrevMap, prevMap, currMap, nextMap, nextNextMap];
  const itemWidths = [
    CAROUSEL_SMALL_W,
    CAROUSEL_SMALL_W,
    CAROUSEL_BIG_W,
    CAROUSEL_SMALL_W,
    CAROUSEL_SMALL_W,
  ];
  const itemHeights = [
    CAROUSEL_SMALL_H,
    CAROUSEL_SMALL_H,
    CAROUSEL_BIG_H,
    CAROUSEL_SMALL_H,
    CAROUSEL_SMALL_H,
  ];
  const itemCenterX = [32, 106, 196, 286, 360];
  const c = CAROUSEL_VIEW_CENTER;
  const scaleInputRange = [
    c - 140,
    c - 90,
    c - 50,
    c - 20,
    c,
    c + 20,
    c + 50,
    c + 90,
    c + 140,
  ];
  const scaleOutputRange = [0.78, 0.82, 0.88, 0.94, 1, 0.94, 0.88, 0.82, 0.78];

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [
          styles.arrowBtn,
          pressed && styles.arrowBtnPressed,
        ]}
        onPress={slideToPrev}
      >
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>
      <View
        style={[
          styles.window,
          { width: CAROUSEL_VIEW_W, height: CAROUSEL_BIG_H },
        ]}
      >
        <Animated.View
          style={[styles.track, { transform: [{ translateX: carouselSlide }] }]}
        >
          {showMaps.map((m, i) => {
            const itemPos = Animated.add(carouselSlide, itemCenterX[i]);
            const scale = itemPos.interpolate({
              inputRange: scaleInputRange,
              outputRange: scaleOutputRange,
            });
            return (
              <Animated.View
                key={`${m.id}-${i}`}
                style={[
                  styles.itemWrap,
                  {
                    width: itemWidths[i],
                    height: itemHeights[i],
                    transform: [{ scale }],
                  },
                ]}
              >
                <Pressable
                  style={[
                    styles.item,
                    {
                      width: itemWidths[i],
                      height: itemHeights[i],
                    },
                  ]}
                  onPress={() => selectById(m.id)}
                >
                  {m.image ? (
                    <Image
                      source={m.image}
                      style={styles.thumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.thumbDefault}>
                      <Text style={styles.thumbDefaultText}>Default</Text>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </Animated.View>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.arrowBtn,
          pressed && styles.arrowBtnPressed,
        ]}
        onPress={slideToNext}
      >
        <Text style={styles.arrowText}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 6,
  },
  arrowBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(67, 67, 67, 1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  arrowBtnPressed: {
    backgroundColor: "rgba(67, 67, 67, 0.15)",
    borderColor: "rgba(67, 67, 67, 1)",
    transform: [{ scale: 0.96 }],
  },
  arrowText: {
    fontSize: 28,
    color: "rgba(67, 67, 67, 1)",
    fontWeight: "600",
    includeFontPadding: false,
  },
  window: {
    overflow: "hidden",
    borderRadius: 8,
  },
  track: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  itemWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  item: { borderRadius: 6, overflow: "hidden" },
  thumb: { width: "100%", height: "100%" },
  thumbDefault: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbDefaultText: { fontSize: 10, color: "#666", fontWeight: "600" },
});
