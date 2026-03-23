export interface Poem {
  id: string;
  title: string;
  author: string;
  lines: string[];
}

export const PRESET_POEMS: Poem[] = [
  {
    id: "frost-road",
    title: "The Road Not Taken",
    author: "Robert Frost",
    lines: [
      "Two roads diverged in a yellow wood",
      "And sorry I could not travel both",
      "And be one traveler, long I stood",
      "And looked down one as far as I could",
      "To where it bent in the undergrowth",
    ],
  },
  {
    id: "neruda-fire",
    title: "Tonight I Can Write",
    author: "Pablo Neruda",
    lines: [
      "Tonight I can write the saddest lines",
      "I loved her, and sometimes she loved me too",
      "Through nights like this one I held her in my arms",
      "She loved me, sometimes I loved her too",
      "One loves. Love is so short, forgetting is so long.",
    ],
  },
  {
    id: "rumi-ocean",
    title: "The Guest House",
    author: "Rumi",
    lines: [
      "This being human is a guest house",
      "Every morning a new arrival",
      "A joy, a depression, a meanness",
      "Some momentary awareness comes as an unexpected visitor",
      "Welcome and entertain them all",
    ],
  },
  {
    id: "dickinson-infinity",
    title: "Because I could not stop for Death",
    author: "Emily Dickinson",
    lines: [
      "Because I could not stop for Death",
      "He kindly stopped for me",
      "The Carriage held but just Ourselves",
      "And Immortality",
      "We passed the school where children played",
    ],
  },
  {
    id: "rilke-silence",
    title: "Archaic Torso of Apollo",
    author: "Rainer Maria Rilke",
    lines: [
      "We cannot know his legendary head",
      "with eyes like ripening fruit",
      "And yet his torso still suffuses light",
      "like a lamp in which his gaze, now turned down low",
      "You must change your life",
    ],
  },
  {
    id: "blake-fire",
    title: "The Tyger",
    author: "William Blake",
    lines: [
      "Tyger Tyger, burning bright",
      "In the forests of the night",
      "What immortal hand or eye",
      "Could frame thy fearful symmetry",
      "In what distant deeps or skies burnt the fire of thine eyes",
    ],
  },
];
