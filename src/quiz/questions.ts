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
      { id: "La Guillotière, Lyon 7th", label: "La Guillotière" },
      { id: "Villeurbanne, near Gratte-Ciel", label: "Villeurbanne, near Gratte-Ciel" },
      { id: "Croix-Rousse, Lyon 4th", label: "Croix-Rousse" },
      { id: "Bron", label: "Bron" },
    ],
    answer: "Croix-Rousse, Lyon 4th",
    hints: [
      "Show Camille on any day and move the time to 3 in the morning.",
      "Her dot spends every night in the same spot. Click that place to see its area.",
    ],
    explanation:
      "Where a phone spends the night is almost always home. It was also the first question of the original challenge. With a home and a workplace, finding a name is often easy.",
  },
  {
    id: "hugo-sport",
    text: "Which sport does Hugo do?",
    options: [
      { id: "swimming", label: "Swimming" },
      { id: "climbing", label: "Climbing" },
      { id: "football", label: "Football" },
      { id: "tennis", label: "Tennis" },
    ],
    answer: "climbing",
    hints: [
      "Put Hugo in amber and look at the places that aren't home or work.",
      "He goes to the same place in Gerland on Wednesday evening and Sunday morning.",
    ],
    explanation:
      "Going to the same place at the same times usually means a hobby. It also says when the flat is empty. Hugo's phone loses signal on the way because he takes the metro, and that gap is a clue too.",
  },
  {
    id: "camille-friday",
    text: "What did Camille do on Friday evening?",
    options: [
      { id: "cinema", label: "She went to the cinema" },
      { id: "concert hall", label: "She went to a concert" },
      { id: "restaurant", label: "She had dinner out" },
      { id: "theatre", label: "She went to the theatre" },
    ],
    answer: "theatre",
    hints: ["Pick Friday and move the time to 21:00.", "She walked a few minutes from home and stayed close to three hours."],
    explanation:
      "One evening out doesn't say much, but a few months of them show someone's tastes. With the theatre's programme you can even find the play. The original challenge had a question about this same theatre.",
  },
  {
    id: "same-building",
    text: "Two of them live in the same building. Who?",
    options: [
      { id: "ines+lea", label: "Inès and Léa" },
      { id: "camille+malik", label: "Camille and Malik" },
      { id: "hugo+tom", label: "Tom and Hugo" },
      { id: "ines+tom", label: "Inès and Tom" },
    ],
    answer: "hugo+tom",
    hints: [
      "Find where each person spends the night.",
      "Show everyone at 3 in the morning and look for two dots on top of each other.",
    ],
    explanation:
      "Two homes at the same point usually means flatmates, a couple or neighbours. In the original challenge, we found links between people the same way, by looking at who was at the same place at the same time.",
  },
  {
    id: "bike-commute",
    text: "Who cycles to work?",
    options: [
      { id: "tom", label: "Tom" },
      { id: "ines", label: "Inès" },
      { id: "malik", label: "Malik" },
      { id: "hugo", label: "Hugo" },
    ],
    answer: "ines",
    hints: [
      "Compare how fast each of them moves between home and work on a weekday morning.",
      "One route goes through Parc de la Tête d'Or, where no car, bus or tram can go.",
    ],
    explanation:
      "Speed alone isn't enough, in town a bike and a car go about as fast. That was a limit of the original, and in our report we suggested looking for routes through parks. That's what gives Inès away here.",
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
      "Where the trip starts and how fast it goes leave only one answer. The original challenge had a similar question about a trip to Bordeaux.",
  },
  {
    id: "saint-jean-photo",
    text: "A lost phone has a photo of Place Saint-Jean taken on Saturday at 15:10. Whose phone is it?",
    options: [
      { id: "camille", label: "Camille" },
      { id: "ines", label: "Inès" },
      { id: "hugo", label: "Hugo" },
      { id: "lea", label: "Léa" },
    ],
    answer: "lea",
    hints: [
      "Pick Saturday and set the time to 15:10.",
      "Someone else was on Place Saint-Jean that week, but on Wednesday. Only one person was there on Saturday afternoon.",
    ],
    explanation:
      "A photo has a time and often a position. Comparing it with location traces is enough to find who took it. The original challenge had this question with a real photo of Place Saint-Jean.",
  },
  {
    id: "speed-camera",
    text: "A speed camera on the boulevard Laurent-Bonnevay (limit 70 km/h) flashed a car at over 90 km/h on Tuesday, around 8:05. Who was driving?",
    options: [
      { id: "tom", label: "Tom" },
      { id: "hugo", label: "Hugo" },
      { id: "malik", label: "Malik" },
      { id: "ines", label: "Inès" },
    ],
    answer: "malik",
    hints: [
      "Only one of them drives to work. Which way does that car go?",
      "Pick Tuesday, put the driver in amber and step through 8:00 to 8:10. The panel gives the speed.",
    ],
    explanation:
      "If a phone logs where you are, it also logs how fast you go. Some car insurers already use this kind of data. The original challenge asked who got a speeding ticket on a given day.",
  },
];
