"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/pure.ts
var pure_exports = {};
__export(pure_exports, {
  levelFromXp: () => levelFromXp,
  xpForLevel: () => xpForLevel
});
module.exports = __toCommonJS(pure_exports);
var POINTS_FIRST_LEVEL_UP = 9e3;
var TUNING_FACTOR = 1;
var POINT_FACTOR = Math.round(POINTS_FIRST_LEVEL_UP / 3);
function xpForLevel(level) {
  return POINT_FACTOR / (2 * TUNING_FACTOR) * Math.pow(level, 2) + POINT_FACTOR * (1 + 1 / (2 * TUNING_FACTOR)) * level - POINT_FACTOR * (1 + 1 / TUNING_FACTOR);
}
function levelFromXp(xp) {
  return Math.floor(
    Math.sqrt(
      POINT_FACTOR * Math.pow(2 * TUNING_FACTOR + 3, 2) + 8 * TUNING_FACTOR * xp
    ) / (2 * Math.sqrt(POINT_FACTOR)) - TUNING_FACTOR - 0.5
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  levelFromXp,
  xpForLevel
});
