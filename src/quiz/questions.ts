export interface Option {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
  answer: string;
  hints: [string, string];
  explanation: string;
}

// Sorted roughly from easy to hard, as in the original challenge.
export const QUESTIONS: Question[] = [
  {
    id: "camille-home",
    text: "Where does Camille live?",
    options: [
      { id: "Croix-Rousse, Lyon 4th", label: "Croix-Rousse" },
      { id: "La Guillotière, Lyon 7th", label: "La Guillotière" },
      { id: "Villeurbanne, near Gratte-Ciel", label: "Villeurbanne, near Gratte-Ciel" },
      { id: "Bron", label: "Bron" },
    ],
    answer: "Croix-Rousse, Lyon 4th",
    hints: [
      "Show Camille on any day and move the time to 3 in the morning.",
      "Her dot spends every night in the same spot. Click that place to see its area.",
    ],
    explanation:
      "The place where a phone spends its nights is almost always home. It was the first question of the original challenge too. With a home and a workplace, a name is often one search away.",
  },
  {
    id: "hugo-sport",
    text: "Which sport does Hugo do?",
    options: [
      { id: "climbing", label: "Climbing" },
      { id: "swimming", label: "Swimming" },
      { id: "football", label: "Football" },
      { id: "tennis", label: "Tennis" },
    ],
    answer: "climbing",
    hints: [
      "Highlight Hugo and look at the places that aren't home or work.",
      "He goes to the same place in Gerland on Wednesday evening and Sunday morning.",
    ],
    explanation:
      "A regular place at regular times becomes a hobby, and a hobby tells people about your health, your budget and when your flat is empty. Hugo's phone also loses signal on the way there: he takes the metro, and the gap is a clue in itself.",
  },
  {
    id: "camille-friday",
    text: "What did Camille do on Friday evening?",
    options: [
      { id: "theatre", label: "She went to the theatre" },
      { id: "cinema", label: "She went to the cinema" },
      { id: "concert hall", label: "She went to a concert" },
      { id: "restaurant", label: "She had dinner out" },
    ],
    answer: "theatre",
    hints: ["Pick Friday and move the time to 21:00.", "She walked a few minutes from home and stayed close to three hours."],
    explanation:
      "One evening out says little. A few months of them give away someone's tastes, and with the theatre's programme, the play they saw. The original challenge asked what someone went to see at this same theatre.",
  },
  {
    id: "same-building",
    text: "Two of them live in the same building. Who?",
    options: [
      { id: "hugo+tom", label: "Tom and Hugo" },
      { id: "ines+lea", label: "Inès and Léa" },
      { id: "camille+malik", label: "Camille and Malik" },
      { id: "ines+tom", label: "Inès and Tom" },
    ],
    answer: "hugo+tom",
    hints: [
      "Find where each person spends the night.",
      "Show everyone at 3 in the morning and look for two dots on top of each other.",
    ],
    explanation:
      "Two homes at the same point usually mean flatmates, a couple or neighbours. Nobody said anything about Tom and Hugo, their traces did. Shared places at shared times are how the original challenge found social links between participants.",
  },
  {
    id: "bike-commute",
    text: "Who cycles to work?",
    options: [
      { id: "ines", label: "Inès" },
      { id: "tom", label: "Tom" },
      { id: "hugo", label: "Hugo" },
      { id: "malik", label: "Malik" },
    ],
    answer: "ines",
    hints: [
      "Compare how fast each of them moves between home and work on a weekday morning.",
      "One route goes through Parc de la Tête d'Or, where no car, bus or tram can go.",
    ],
    explanation:
      "Speed alone is ambiguous: in town, a bike and a car take about the same time. Our report named this as a limit of the original and suggested looking for routes through parks. That's what gives Inès away here.",
  },
  {
    id: "lea-paris",
    text: "How did Léa get to Paris on Thursday?",
    options: [
      { id: "car", label: "By car" },
      { id: "train", label: "By train" },
      { id: "plane", label: "By plane" },
      { id: "coach", label: "By coach" },
    ],
    answer: "train",
    hints: [
      "Show Léa on Thursday and look at where her trip starts.",
      "She waits at a station, then her phone reports close to 300 km/h for more than an hour.",
    ],
    explanation:
      "Where a trip starts and how fast it goes leave one answer. Trips are among the most telling parts of a location history: which city, which day, how often. The original challenge asked how someone travelled to Bordeaux.",
  },
  {
    id: "saint-jean-photo",
    text: "A lost phone has a photo of Place Saint-Jean taken on Saturday at 15:10. Whose phone is it?",
    options: [
      { id: "ines", label: "Inès" },
      { id: "lea", label: "Léa" },
      { id: "camille", label: "Camille" },
      { id: "hugo", label: "Hugo" },
    ],
    answer: "lea",
    hints: [
      "Pick Saturday and set the time to 15:10.",
      "Someone else was on Place Saint-Jean that week, but on Wednesday. Only one person was there on Saturday afternoon.",
    ],
    explanation:
      "A photo carries a time and often a position. Matching it against location traces is enough to put a name on an anonymous picture. The original challenge had this question with a real photo of Place Saint-Jean.",
  },
  {
    id: "speed-camera",
    text: "A speed camera on the boulevard Laurent-Bonnevay (limit 70 km/h) flashed a car at over 90 km/h on Tuesday, around 8:05. Who was driving?",
    options: [
      { id: "malik", label: "Malik" },
      { id: "tom", label: "Tom" },
      { id: "ines", label: "Inès" },
      { id: "hugo", label: "Hugo" },
    ],
    answer: "malik",
    hints: [
      "Only one of them drives to work. Which way does that car go?",
      "Pick Tuesday, highlight the driver and step through 8:00 to 8:10. The panel gives the speed.",
    ],
    explanation:
      "A phone that logs where you are also logs how fast you go. Some car insurers already price policies on how people drive. The original challenge asked who got a speeding ticket on a given day.",
  },
];
