export const DIFFICULTIES = [
  {
    id: "easy",
    label: "Easy",
    desc: "Few grids",
    gridSize: 8,
    numPlanes: 2,
  },
  {
    id: "medium",
    label: "Medium",
    desc: "More grids",
    gridSize: 10,
    numPlanes: 3,
  },
  {
    id: "hard",
    label: "Hard",
    desc: "Even more grids",
    gridSize: 12,
    numPlanes: 5,
  },
];

export const MAP_OPTIONS = [
  { id: "default", label: "Math paper", image: null },
  {
    id: "clean",
    label: "Clean sky",
    image: require("../../assets/images/maps/clean-sky-air-map.jpg"),
  },
  {
    id: "cloudy",
    label: "Cloudy sky",
    image: require("../../assets/images/maps/cloudy-air-map.jpg"),
  },
  {
    id: "sunset",
    label: "Sunset",
    image: require("../../assets/images/maps/sunset-sky-map.jpg"),
  },
  {
    id: "aurora",
    label: "Aurora",
    image: require("../../assets/images/maps/aurora-borealis-sky-map.jpg"),
  },
  {
    id: "wheat",
    label: "Wheat",
    image: require("../../assets/images/maps/aircraft-land-wheat-map.png"),
  },
  {
    id: "runway",
    label: "Runway",
    image: require("../../assets/images/maps/airplane runway-map.jpeg"),
  },
  {
    id: "lost-sea",
    label: "Lost sea",
    image: require("../../assets/images/maps/lost-sea-map.png"),
  },
  {
    id: "thunder-storm",
    label: "Thunder storm",
    image: require("../../assets/images/maps/thunder-storm-map.png"),
  },
  {
    id: "tornado",
    label: "Tornado",
    image: require("../../assets/images/maps/tornado-map.png"),
  },
  {
    id: "waterspout",
    label: "Waterspout",
    image: require("../../assets/images/maps/waterspout-map.png"),
  },
];

export const GRID_LINE_COLOR = "#a8d0e6";
export const MATH_PAPER_BG = "#fafcff";

export const UI_PRIMARY = "#2c3e50";
export const UI_PRIMARY_LIGHT = "#3d566e";
export const UI_PRIMARY_TINT = "rgba(44, 62, 80, 0.15)";
export const UI_WHITE = "#fff";
export const UI_BODY = "#2c3e50";
export const UI_BODY_MUTED = "#5c6b7a";
export const UI_CARD_BG = "#ffffff";
export const UI_INPUT_BG = "#f4f6f8";
export const UI_INPUT_BORDER = "#e2e6ea";
export const UI_UNSELECTED_BG = "#eef1f4";
export const UI_SUCCESS = "#2e7d32";
export const UI_DANGER = "#c62828";
export const UI_SHADOW = "#1a1a1a";
export const UI_PAGE_BG = "#faf8f5";

export const CAROUSEL_SMALL_W = 64;
export const CAROUSEL_SMALL_H = 48;
export const CAROUSEL_BIG_W = 96;
export const CAROUSEL_BIG_H = 72;
export const CAROUSEL_GAP = 10;
export const CAROUSEL_REST_X = -(64 + 10);
export const CAROUSEL_STEP = 64 + 10;
export const CAROUSEL_VIEW_W =
  CAROUSEL_SMALL_W +
  CAROUSEL_GAP +
  CAROUSEL_BIG_W +
  CAROUSEL_GAP +
  CAROUSEL_SMALL_W;
export const SLIDE_DURATION = 320;

export const INTRO_IMAGE = require("../../assets/images/logo/aircraft-main.png");

export const TAP_SOUND = require("../../assets/sounds/menus/button-menu-sound.mp3");
export const WINNING_SOUND = require("../../assets/sounds/menus/winning-sound.mp3");

const BATTLE_MUSIC_1 = require("../../assets/sounds/battle/battle-sound-1.mp3");
const BATTLE_MUSIC_2 = require("../../assets/sounds/battle/battle-sound-2.mp3");
export const BATTLE_MUSIC_TRACKS = [BATTLE_MUSIC_1, BATTLE_MUSIC_2];
