import { READING_AGE_ITEMS } from "../config/readingAgeItems.js";

export const readingAgeToMonths = (code) => {
  if (!code || code === "B4") return null;
  const match = /^(\d+)\.(\d{1,2})$/.exec(String(code));
  if (!match) throw new Error(`Invalid reading age code: ${code}`);
  return Number(match[1]) * 12 + Number(match[2]);
};

export const formatReadingAge = (code) => {
  if (code === "B4") return "Below 4 years";
  const months = readingAgeToMonths(code);
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  return `${years} year${years === 1 ? "" : "s"} ${remainder} month${remainder === 1 ? "" : "s"}`;
};

export const getIntervention = (code) => {
  if (code === "B4") return "Foundation: letter recognition and sound blending";
  const months = readingAgeToMonths(code);
  const ranges = [
    [48, 58, "Level 1 - CVC"],
    [60, 64, "Level 2 - Blend Words"],
    [65, 68, "Level 2 - Digraphs"],
    [69, 72, "Level 2 - Magic e"],
    [73, 74, "Level 3 - A family"],
    [75, 75, "Level 3 - E family"],
    [76, 76, "Level 3 - I family"],
    [77, 77, "Level 3 - O family"],
    [78, 78, "Level 3 - S family"],
    [79, 79, "Level 3 - Ch family"],
    [80, 80, "Level 3 - /k/ family"],
    [81, 81, "Level 3 - F family"],
    [82, 82, "Level 3 - J family"],
    [83, 83, "Level 3 - Sh family"],
    [84, 85, "Level 3 - /z/ family"],
    [86, 87, "Level 3 - oo family"],
    [88, 88, "Level 3 - Bossy R family"],
    [89, 89, "Level 3 - oi/oy family"],
    [90, 90, "Level 3 - /aw/ words"],
    [91, 93, "Level 3 - Phonograms"],
    [94, 95, "Level 3 - Silent letter family"],
    [96, 106, "Level 3 - /sh/ alternatives"],
    [108, 126, "Non-Phonetic Words"],
    [132, 150, "Uncommon Words"],
  ];
  return ranges.find(([from, to]) => months >= from && months <= to)?.[2]
    || "Teacher review recommended";
};

export const calculateReadingAge = (responses = []) => {
  if (!Array.isArray(responses) || responses.length === 0) {
    throw new Error("Assessment responses are required");
  }

  let consecutiveMistakes = 0;
  let lastCorrect = null;
  let correctCount = 0;
  let incorrectCount = 0;
  let stoppedByThreeErrors = false;
  const processedResponses = [];

  for (let order = 0; order < responses.length; order += 1) {
    const response = responses[order];
    const itemIndex = Number(response?.item_index);

    // The public test always starts at item zero and proceeds without gaps.
    if (!Number.isInteger(itemIndex) || itemIndex !== order) {
      throw new Error(`Invalid assessment sequence at response ${order + 1}`);
    }

    const item = READING_AGE_ITEMS[itemIndex];
    if (!item) throw new Error(`Unknown assessment item: ${itemIndex}`);
    if (typeof response.correct !== "boolean") {
      throw new Error(`Response ${order + 1} must contain a boolean correct value`);
    }

    const isCorrect = response.correct;
    processedResponses.push({
      item_index: item.index,
      text: item.text,
      ra: item.ra,
      correct: isCorrect,
    });

    if (isCorrect) {
      correctCount += 1;
      consecutiveMistakes = 0;
      lastCorrect = { index: item.index, text: item.text, ra: item.ra };
    } else {
      incorrectCount += 1;
      consecutiveMistakes += 1;
    }

    if (consecutiveMistakes === 3) {
      stoppedByThreeErrors = true;
      break;
    }
  }

  const readingAge = lastCorrect?.ra || "B4";
  return {
    readingAge,
    readingAgeMonths: readingAgeToMonths(readingAge),
    intervention: getIntervention(readingAge),
    lastCorrect,
    correctCount,
    incorrectCount,
    stoppedByThreeErrors,
    processedResponses,
  };
};

export const classifyReader = (readingAgeMonths, chronologicalAgeMonths) => {
  if (readingAgeMonths === null) return "Developing Reader";
  if (readingAgeMonths > chronologicalAgeMonths) return "Fluent Reader";
  if (readingAgeMonths === chronologicalAgeMonths) return "Emergent Reader";
  return "Developing Reader";
};
