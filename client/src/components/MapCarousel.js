import { useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  Animated,
  Easing,
} from "react-native";
import SoundPressable from "./SoundPressable";
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
  MATH_PAPER_BG,
  GRID_LINE_COLOR,
  UI_PRIMARY,
  UI_PRIMARY_LIGHT,
  UI_WHITE,
  UI_BODY_MUTED,
} from "../constants/constants";

const CAROUSEL_EASING = Easing.bezier(0.25, 0.1, 0.25, 1);
const CAROUSEL_VIEW_CENTER = CAROUSEL_VIEW_W / 2;

const COMPACT_SMALL_W = 50;
const COMPACT_SMALL_H = 36;
const COMPACT_BIG_W = 76;
const COMPACT_BIG_H = 54;
const COMPACT_GAP = 8;
const COMPACT_VIEW_W =
  COMPACT_SMALL_W + COMPACT_GAP + COMPACT_BIG_W + COMPACT_GAP + COMPACT_SMALL_W;

export default function MapCarousel({
  mapOptions = MAP_OPTIONS,
  selectedId,
  onSelect,
  compact = false,
}) {
  const SW = compact ? COMPACT_SMALL_W : CAROUSEL_SMALL_W;
  const SH = compact ? COMPACT_SMALL_H : CAROUSEL_SMALL_H;
  const BW = compact ? COMPACT_BIG_W : CAROUSEL_BIG_W;
  const BH = compact ? COMPACT_BIG_H : CAROUSEL_BIG_H;
  const GAP = compact ? COMPACT_GAP : CAROUSEL_GAP;
  const VIEW_W = compact ? COMPACT_VIEW_W : CAROUSEL_VIEW_W;
  const restX = -(SW + GAP);
  const step = SW + GAP;

  const carouselSlide = useRef(
    new Animated.Value(compact ? -(COMPACT_SMALL_W + COMPACT_GAP) : CAROUSEL_REST_X)
  ).current;
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
      carouselSlide.setValue(restX);
      carouselAnimating.current = false;
      requestAnimationFrame(() => onSelect(prevId));
    });
  }, [selectedId, mapOptions, onSelect, carouselSlide, restX]);

  const slideToNext = useCallback(() => {
    if (carouselAnimating.current) return;
    const len = mapOptions.length;
    const idx = mapOptions.findIndex((m) => m.id === selectedId);
    const nextId = mapOptions[(idx + 1) % len].id;
    carouselAnimating.current = true;
    Animated.timing(carouselSlide, {
      toValue: restX - step,
      duration: SLIDE_DURATION,
      easing: CAROUSEL_EASING,
      useNativeDriver: true,
    }).start(() => {
      carouselSlide.setValue(restX);
      carouselAnimating.current = false;
      requestAnimationFrame(() => onSelect(nextId));
    });
  }, [selectedId, mapOptions, onSelect, carouselSlide, restX, step]);

  const selectById = useCallback(
    (id) => {
      if (carouselAnimating.current) return;
      onSelect(id);
      carouselSlide.setValue(restX);
    },
    [onSelect, carouselSlide, restX],
  );

  const mapIndex = mapOptions.findIndex((m) => m.id === selectedId);
  const len = mapOptions.length;
  const prevPrevMap = mapOptions[(mapIndex - 2 + len * 2) % len];
  const prevMap = mapOptions[(mapIndex - 1 + len) % len];
  const currMap = mapOptions[mapIndex];
  const nextMap = mapOptions[(mapIndex + 1) % len];
  const nextNextMap = mapOptions[(mapIndex + 2) % len];
  const showMaps = [prevPrevMap, prevMap, currMap, nextMap, nextNextMap];
  const itemWidths = [SW, SW, BW, SW, SW];
  const itemHeights = [SH, SH, BH, SH, SH];
  const itemCenterX = compact
    ? [24, 83, 152, 221, 288]
    : [32, 106, 196, 286, 360];
  const c = VIEW_W / 2;
  const scaleRange = compact ? 100 : 140;
  const scaleInputRange = [
    c - scaleRange,
    c - scaleRange * 0.64,
    c - scaleRange * 0.36,
    c - scaleRange * 0.14,
    c,
    c + scaleRange * 0.14,
    c + scaleRange * 0.36,
    c + scaleRange * 0.64,
    c + scaleRange,
  ];
  const scaleOutputRange = [0.78, 0.82, 0.88, 0.94, 1, 0.94, 0.88, 0.82, 0.78];

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <SoundPressable
        style={({ pressed }) => [
          styles.arrowBtn,
          compact && styles.arrowBtnCompact,
          pressed && styles.arrowBtnPressed,
        ]}
        onPress={slideToPrev}
      >
        <Text style={[styles.arrowText, compact && styles.arrowTextCompact]}>
          ‹
        </Text>
      </SoundPressable>
      <View
        style={[styles.window, { width: VIEW_W, height: BH }]}
      >
        <Animated.View
          style={[
            styles.track,
            { gap: GAP, transform: [{ translateX: carouselSlide }] },
          ]}
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
                <SoundPressable
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
                    <View
                      style={[
                        styles.thumbMathPaper,
                        {
                          width: itemWidths[i],
                          height: itemHeights[i],
                        },
                      ]}
                    >
                      {Array.from(
                        {
                          length: Math.ceil(itemWidths[i] / 6) + 1,
                        },
                        (_, k) => (
                          <View
                            key={`v-${k}`}
                            style={[
                              styles.mathPaperLine,
                              styles.mathPaperLineV,
                              {
                                left: k * 6,
                                height: itemHeights[i],
                              },
                            ]}
                          />
                        )
                      )}
                      {Array.from(
                        {
                          length: Math.ceil(itemHeights[i] / 6) + 1,
                        },
                        (_, k) => (
                          <View
                            key={`h-${k}`}
                            style={[
                              styles.mathPaperLine,
                              styles.mathPaperLineH,
                              {
                                top: k * 6,
                                width: itemWidths[i],
                              },
                            ]}
                          />
                        )
                      )}
                      <Text style={styles.thumbMathPaperText}>Math paper</Text>
                    </View>
                  )}
                </SoundPressable>
              </Animated.View>
            );
          })}
        </Animated.View>
      </View>
      <SoundPressable
        style={({ pressed }) => [
          styles.arrowBtn,
          compact && styles.arrowBtnCompact,
          pressed && styles.arrowBtnPressed,
        ]}
        onPress={slideToNext}
      >
        <Text style={[styles.arrowText, compact && styles.arrowTextCompact]}>
          ›
        </Text>
      </SoundPressable>
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
  wrapCompact: {
    gap: 6,
    marginBottom: 4,
  },
  arrowBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: UI_PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  arrowBtnCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  arrowBtnPressed: {
    backgroundColor: UI_PRIMARY_LIGHT,
    transform: [{ scale: 0.96 }],
  },
  arrowTextCompact: {
    fontSize: 22,
  },
  arrowText: {
    fontSize: 28,
    color: UI_WHITE,
    fontWeight: "700",
    includeFontPadding: false,
  },
  window: {
    overflow: "hidden",
    borderRadius: 8,
  },
  track: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  item: { borderRadius: 6, overflow: "hidden" },
  thumb: { width: "100%", height: "100%" },
  thumbMathPaper: {
    backgroundColor: MATH_PAPER_BG,
    justifyContent: "center",
    alignItems: "center",
  },
  mathPaperLine: {
    position: "absolute",
    backgroundColor: GRID_LINE_COLOR,
  },
  mathPaperLineV: {
    width: 1,
  },
  mathPaperLineH: {
    height: 1,
  },
  thumbMathPaperText: {
    fontSize: 10,
    color: UI_BODY_MUTED,
    fontWeight: "700",
    zIndex: 1,
  },
});
