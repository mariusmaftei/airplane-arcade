import { useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  PanResponder,
  Image,
} from "react-native";
import { colToLetter } from "../utils/format";
import {
  UI_BODY,
  UI_BODY_MUTED,
  UI_INPUT_BORDER,
  UI_UNSELECTED_BG,
  UI_WHITE,
} from "../constants/constants";

const STEP_PX = 16;
const PAD_SIZE = 112;

const SHOOT_BTN_UNPRESSED = require("../../assets/images/menus/button-unpressed.png");
const SHOOT_BTN_PRESSED = require("../../assets/images/menus/button-pressed.png");

export default function CoordPicker({
  gridSize,
  selectedCol,
  selectedRow,
  onColChange,
  onRowChange,
  onShoot,
  canShoot,
  disabled,
  onPadTouchStart,
  onPadTouchEnd,
}) {
  const disabledRef = useRef(disabled);
  const gridSizeRef = useRef(gridSize);
  const selectedColRef = useRef(selectedCol);
  const selectedRowRef = useRef(selectedRow);
  const onColChangeRef = useRef(onColChange);
  const onRowChangeRef = useRef(onRowChange);
  const onPadTouchStartRef = useRef(onPadTouchStart);
  const onPadTouchEndRef = useRef(onPadTouchEnd);
  useEffect(() => {
    disabledRef.current = disabled;
    gridSizeRef.current = gridSize;
    selectedColRef.current = selectedCol;
    selectedRowRef.current = selectedRow;
    onColChangeRef.current = onColChange;
    onRowChangeRef.current = onRowChange;
    onPadTouchStartRef.current = onPadTouchStart;
    onPadTouchEndRef.current = onPadTouchEnd;
  }, [
    disabled,
    gridSize,
    selectedCol,
    selectedRow,
    onColChange,
    onRowChange,
    onPadTouchStart,
    onPadTouchEnd,
  ]);

  const consumedDxRef = useRef(0);
  const consumedDyRef = useRef(0);

  const applyMove = useRef((dx, dy) => {
    if (disabledRef.current) return;
    const gs = gridSizeRef.current;
    const onCol = onColChangeRef.current;
    const onRow = onRowChangeRef.current;
    let consumedDx = consumedDxRef.current;
    let consumedDy = consumedDyRef.current;

    while (dx - consumedDx >= STEP_PX) {
      const col = selectedColRef.current;
      const next = Math.min(col + 1, gs - 1);
      onCol(next);
      selectedColRef.current = next;
      consumedDx += STEP_PX;
    }
    while (dx - consumedDx <= -STEP_PX) {
      const col = selectedColRef.current;
      const next = Math.max(col - 1, 0);
      onCol(next);
      selectedColRef.current = next;
      consumedDx -= STEP_PX;
    }
    while (dy - consumedDy >= STEP_PX) {
      const row = selectedRowRef.current;
      const next = Math.min(row + 1, gs - 1);
      onRow(next);
      selectedRowRef.current = next;
      consumedDy += STEP_PX;
    }
    while (dy - consumedDy <= -STEP_PX) {
      const row = selectedRowRef.current;
      const next = Math.max(row - 1, 0);
      onRow(next);
      selectedRowRef.current = next;
      consumedDy -= STEP_PX;
    }

    consumedDxRef.current = consumedDx;
    consumedDyRef.current = consumedDy;
  }).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onStartShouldSetPanResponderCapture: () => !disabledRef.current,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        consumedDxRef.current = 0;
        consumedDyRef.current = 0;
        onPadTouchStartRef.current?.();
      },
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponderCapture: () => !disabledRef.current,
      onPanResponderMove: (_, { dx, dy }) => {
        applyMove(dx, dy);
      },
      onPanResponderRelease: (_, { dx, dy }) => {
        applyMove(dx, dy);
        onPadTouchEndRef.current?.();
      },
    }),
  ).current;

  return (
    <View style={styles.wrap}>
      <View style={styles.row} collapsable={false}>
        <View
          style={[styles.swipePad, disabled && styles.swipePadDisabled]}
          collapsable={false}
          pointerEvents="box-only"
          {...panResponder.panHandlers}
        >
          <View style={styles.coordDisplay}>
            <Text style={styles.coordLetter}>{colToLetter(selectedCol)}</Text>
            <Text style={styles.coordNumber}>{selectedRow + 1}</Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.confirmBtn,
            !canShoot && styles.confirmBtnDisabled,
          ]}
          onPress={onShoot}
          disabled={!canShoot}
        >
          {({ pressed }) => (
            <Image
              source={pressed ? SHOOT_BTN_PRESSED : SHOOT_BTN_UNPRESSED}
              style={styles.confirmBtnImage}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    width: "100%",
    marginTop: 2,
    marginBottom: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 0,
    marginBottom: 0,
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  swipePad: {
    width: PAD_SIZE,
    height: PAD_SIZE,
    borderWidth: 2,
    borderColor: UI_INPUT_BORDER,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: UI_UNSELECTED_BG,
  },
  swipePadDisabled: { opacity: 0.6 },
  coordDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  coordLetter: {
    fontSize: 24,
    fontWeight: "800",
    color: UI_BODY,
  },
  coordNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: UI_BODY_MUTED,
  },
  confirmBtn: {
    width: 160,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnImage: {
    width: "100%",
    height: "100%",
  },
  confirmBtnText: {
    fontSize: 20,
    fontWeight: "800",
    color: UI_WHITE,
  },
  confirmBtnDisabled: { opacity: 0.5 },
});
