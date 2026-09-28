const rows = [
  [["yak", "4.0"], ["fed", "4.1"], ["pot", "4.2"], ["mix", "4.3"], ["rum", "4.4"], ["the", "4.5"]],
  [["and", "4.6"], ["a tin can", "4.7"], ["a wet van", "4.8"], ["big bag", "4.8"], ["fix the wig", "4.9"], ["rub the dog", "4.9"]],
  [["get the wax", "4.10"], ["twig", "5.0"], ["drug", "5.0"], ["pact", "5.1"], ["held", "5.1"], ["bulb", "5.2"]],
  [["tramp", "5.2"], ["a bell on the hill", "5.3"], ["sell the lamp", "5.4"], ["mum swept", "5.4"], ["crash", "5.5"], ["chimp", "5.6"]],
  [["patch", "5.6"], ["thumbkin", "5.7"], ["shrimp for lunch", "5.8"], ["decade", "5.9"], ["compete", "5.10"], ["reptile", "5.11"]],
  [["cube", "5.11"], ["look at the waves", "6.0"], ["waif", "6.1"], ["whey", "6.2"], ["vein", "6.2"], ["cheese", "6.3"]],
  [["weave", "6.3"], ["chimney", "6.3"], ["industry", "6.3"], ["night", "6.4"], ["diameter", "6.4"], ["fried", "6.4"]],
  [["ply", "6.4"], ["moan", "6.5"], ["throw", "6.5"], ["soak", "6.5"], ["shadow", "6.5"], ["cinder", "6.6"]],
  [["cereal", "6.6"], ["space", "6.6"], ["juicy", "6.6"], ["measure", "6.7"], ["future", "6.7"], ["adventure", "6.7"]],
  [["capture", "6.7"], ["echo", "6.8"], ["mechanic", "6.8"], ["oblique", "6.8"], ["quaint", "6.8"], ["orchestra", "6.8"]],
  [["alphabet", "6.9"], ["cough", "6.9"], ["sphere", "6.9"], ["storage", "6.10"], ["hedgehog", "6.10"], ["ginger", "6.10"]],
  [["gypsum", "6.10"], ["creation", "6.11"], ["dictionary", "6.11"], ["chiffon", "6.11"], ["chauffeur", "6.11"], ["moustache", "6.11"]],
  [["parachute", "6.11"], ["electrician", "6.11"], ["auspicious", "6.11"], ["dose", "7.0"], ["example", "7.0"], ["busy", "7.0"]],
  [["cousin", "7.1"], ["dessert", "7.1"], ["prison", "7.1"], ["xylem", "7.1"], ["bruise", "7.1"], ["glue", "7.2"]],
  [["droop", "7.2"], ["wound", "7.2"], ["souvenir", "7.2"], ["stew", "7.2"], ["bull", "7.3"], ["would", "7.3"]],
  [["germ", "7.4"], ["hurl", "7.4"], ["swirl", "7.4"], ["moist", "7.5"], ["disloyal", "7.5"], ["jackdraw", "7.6"]],
  [["henry has a coil of rope", "7.6"], ["the lady won a new toy", "7.6"], ["people wear masks", "7.6"], ["sought", "7.6"], ["query", "7.7"], ["sheer", "7.7"]],
  [["biosphere", "7.7"], ["funnier", "7.7"], ["the cauliflower soup gives me nausea", "7.9"], ["the pauper is naughty", "7.9"], ["those apple look rosier and heavier", "7.9"], ["knave", "7.10"]],
  [["gnome", "7.10"], ["calm", "7.11"], ["wriggle", "7.11"], ["honour", "7.11"], ["crustacean", "8.0"], ["ocean", "8.2"]],
  [["ancient", "8.4"], ["magician", "8.6"], ["glacier", "8.8"], ["fuchsia", "8.10"], ["bolognese", "9.0"], ["rendezvous", "9.2"]],
  [["queue", "9.4"], ["plateau", "9.6"], ["audience", "9.8"], ["campaign", "10.0"], ["yacht", "10.4"], ["colonel", "10.6"]],
  [["conscience", "11.0"], ["scintillate", "11.4"], ["miscellaneous", "11.8"], ["grotesque", "12.0"], ["somnabulist", "12.4"], ["idiosyncrasy", "12.6"]],
];

export const READING_AGE_ITEMS = rows.flatMap((row, rowIndex) =>
  row.map(([text, ra], columnIndex) => ({
    index: rowIndex * 6 + columnIndex,
    row: rowIndex + 1,
    column: columnIndex + 1,
    text,
    ra,
  })),
);

if (READING_AGE_ITEMS.length !== 132) {
  throw new Error(`Expected 132 reading items, found ${READING_AGE_ITEMS.length}`);
}
