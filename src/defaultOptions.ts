import { TaggedTextOptions } from "./types";

const DEFAULT_OPTIONS: TaggedTextOptions = {
  debug: false,
  debugConsole: false,
  splitStyle: "words",
  imgMap: {},
  scaleIcons: true,
  skipUpdates: false,
  skipDraw: false,
  drawWhitespace: false,
  wrapEmoji: true,
  errorHandler: undefined,
  supressConsole: false,
};

export default DEFAULT_OPTIONS;
