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
  { id: "default", label: "Default", image: null },
  {
    id: "clean",
    label: "Clean sky",
    image: require("../assets/maps/clean-sky-air-map.jpg"),
  },
  {
    id: "cloudy",
    label: "Cloudy sky",
    image: require("../assets/maps/cloudy-air-map.jpg"),
  },
  {
    id: "sunset",
    label: "Sunset",
    image: require("../assets/maps/sunset-sky-map.jpg"),
  },
  {
    id: "aurora",
    label: "Aurora",
    image: require("../assets/maps/aurora-borealis-sky-map.jpg"),
  },
  {
    id: "wheat",
    label: "Wheat",
    image: require("../assets/maps/aircraft-land-wheat-map.png"),
  },
  {
    id: "runway",
    label: "Runway",
    image: require("../assets/maps/airplane runway-map.jpeg"),
  },
];

export const GRID_LINE_COLOR = "#a8d0e6";
export const MATH_PAPER_BG = "#fafcff";

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

export const INTRO_IMAGE = require("../assets/iamges/aircraft-main.png");
