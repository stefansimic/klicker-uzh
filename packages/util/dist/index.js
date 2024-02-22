"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  getInitialElementResults: () => getInitialElementResults,
  processElementData: () => processElementData,
  processQuestionData: () => processQuestionData
});
module.exports = __toCommonJS(src_exports);
var import_prisma = require("@klicker-uzh/prisma");
var R = __toESM(require("ramda"));
var RELEVANT_KEYS = [
  "id",
  "name",
  "content",
  "explanation",
  "pointsMultiplier",
  "type",
  "options"
];
function processQuestionData(question) {
  const extractRelevantKeys = R.pick(RELEVANT_KEYS);
  return {
    ...extractRelevantKeys(question),
    id: `${question.id}-v${question.version}`,
    questionId: question.id
  };
}
var CONTENT_KEYS = ["name", "content", "type", "pointsMultiplier"];
var FLASHCARD_KEYS = [
  "name",
  "content",
  "explanation",
  "type",
  "pointsMultiplier"
];
var QUESTION_KEYS = [
  "name",
  "content",
  "explanation",
  "pointsMultiplier",
  "type",
  "options"
];
function processElementData(element) {
  const extractContentKeys = R.pick(CONTENT_KEYS);
  const extractFlashcardKeys = R.pick(FLASHCARD_KEYS);
  const extractQuestionKeys = R.pick(QUESTION_KEYS);
  if (element.type === import_prisma.ElementType.FLASHCARD) {
    return {
      ...extractFlashcardKeys(element),
      id: `${element.id}-v${element.version}`,
      elementId: element.id
    };
  } else if (element.type === import_prisma.ElementType.SC || element.type === import_prisma.ElementType.MC || element.type === import_prisma.ElementType.KPRIM || element.type === import_prisma.ElementType.NUMERICAL || element.type === import_prisma.ElementType.FREE_TEXT) {
    return {
      ...extractQuestionKeys(element),
      id: `${element.id}-v${element.version}`,
      elementId: element.id
    };
  } else if (element.type === import_prisma.ElementType.CONTENT) {
    return {
      ...extractContentKeys(element),
      id: `${element.id}-v${element.version}`,
      elementId: element.id
    };
  } else {
    throw new Error(
      "Invalid element type encountered during element data processing"
    );
  }
}
function getInitialElementResults(element) {
  if (element.type === import_prisma.ElementType.FLASHCARD) {
    return {
      INCORRECT: 0,
      PARTIAL: 0,
      CORRECT: 0,
      total: 0
    };
  } else if (element.type === import_prisma.ElementType.SC || element.type === import_prisma.ElementType.MC || element.type === import_prisma.ElementType.KPRIM) {
    const choices = element.options.choices.reduce(
      (acc, _, ix) => ({
        ...acc,
        [ix]: 0
      }),
      {}
    );
    return { choices, total: 0 };
  } else if (element.type === import_prisma.ElementType.NUMERICAL || element.type === import_prisma.ElementType.FREE_TEXT) {
    return {
      responses: {},
      total: 0
    };
  } else if (element.type === import_prisma.ElementType.CONTENT) {
    return {
      viewed: 0
    };
  } else {
    throw new Error(
      "Invalid element type encountered during result initialization"
    );
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getInitialElementResults,
  processElementData,
  processQuestionData
});
