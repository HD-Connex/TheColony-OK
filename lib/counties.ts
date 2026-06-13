// Shared Oklahoma counties list (Phase 1 county moat + 0021 newsletter county feeds + my-counties)
// Used for newsletter signup pickers (The Briefing blocks), my-counties checkboxes, filters.
// Keep in sync with dynamic getCountiesWithCounts() from articles for real data, but this is canonical for prefs/UI.
export const OK_COUNTIES: string[] = [
  "Oklahoma",
  "Tulsa",
  "Cleveland",
  "Comanche",
  "Canadian",
  "Rogers",
  "Payne",
  "Washington",
  "Grady",
  "Cherokee",
  // Extend here as coverage grows (add alphabetically or by story volume)
];

// Convenience for pickers: "Statewide" means no county filter / all editions
export const COUNTY_PICKER_OPTIONS: string[] = ["", ...OK_COUNTIES];

export const COUNTY_LABEL = (c: string) => (c ? `${c} County` : "Statewide / All Editions");

export default OK_COUNTIES;
