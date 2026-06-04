export const ARTIST = "SLPlayer Project" as const;

export type Track = {
  id: string;
  index: string;
  title: string;
  duration: string;
  filename?: string;
  endTime?: number;
};

export type Gate = {
  id: string;
  name: string;
  rank: string;
  code: string;
  tracks: Track[];
};

// Gates are empty shells — tracks assigned dynamically via the Unassigned Essence panel
export const GATES: Gate[] = [
  {
    id: "boss",
    name: "BOSS THEMES",
    rank: "S-RANK",
    code: "GT-001",
    tracks: [],
  },
  {
    id: "hype",
    name: "SHADOW HYPE",
    rank: "A-RANK",
    code: "GT-002",
    tracks: [],
  },
  {
    id: "chill",
    name: "CHILL VOID",
    rank: "B-RANK",
    code: "GT-003",
    tracks: [],
  },
  {
    id: "monarch",
    name: "MONARCH'S DOMAIN",
    rank: "S-RANK",
    code: "GT-004",
    tracks: [],
  },
  {
    id: "dungeon",
    name: "DUNGEON RUN",
    rank: "C-RANK",
    code: "GT-005",
    tracks: [],
  },
  { id: "awaken", name: "AWAKENING", rank: "??", code: "GT-006", tracks: [] },
];

export const NEW_UNASSIGNED_TRACKS: Track[] = [
  {
    id: "tiki-tiki-slowed",
    index: "??",
    title: "TIKI TIKI (Slowed)",
    duration: "3:42",
  },
  {
    id: "veki-veki-slowed",
    index: "??",
    title: "VEKI VEKI (Ultra Slowed)",
    duration: "4:05",
  },
  {
    id: "worry-slowed",
    index: "??",
    title: "worry (ultra slowed)",
    duration: "3:18",
  },
  {
    id: "babydoll-perfect-girl",
    index: "??",
    title: "Babydoll X The Perfect Girl (Full Version)",
    duration: "3:50",
  },
  {
    id: "one-of-the-girls-mashup",
    index: "??",
    title: "One Of The Girls X Good For You (Mashup)",
    duration: "4:15",
  },
];
