/**
 * Gastronomy narrative data — dish name, story, and season.
 * Keyed by filename. Images without an entry show no overlay text.
 */

export interface DishEntry {
  filename: string;
  name: string;
  story: string;
  season?: string;
}

export const dishes: DishEntry[] = [
  {
    filename: 'carrot_lox_bagel.jpg',
    name: 'Carrot Lox Bagel',
    story: 'Inspired by Jewish deli tradition — silky carrot ribbons cured in smoke and brine, layered on a toasted everything bagel with cashew cream cheese.',
    season: 'Year-round',
  },
  {
    filename: 'raguchay.jpg',
    name: 'Raguchay',
    story: 'A slow-simmered ragù reimagined with chayote squash — tender, earthy, and deeply comforting. Plant-based food sovereignty on a plate.',
    season: 'Autumn · Winter',
  },
  {
    filename: 'salad.jpg',
    name: 'Market Salad',
    story: 'Whatever the market had that morning. Seasonal leaves, pickled things, something toasted, something bright. No recipe — just attention.',
    season: 'Spring · Summer',
  },
];

export function getDishMeta(filename: string): DishEntry | undefined {
  return dishes.find((d) => d.filename === filename);
}
