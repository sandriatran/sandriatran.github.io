/**
 * Memory metadata — captions and tags for the polaroid grid.
 * Tags: California | Edinburgh | Travel | Nature | Film
 * Lookup by filename; missing entries fall back to no caption / all tags shown.
 */

export type MemoryTag = 'California' | 'Edinburgh' | 'Travel' | 'Nature' | 'Film';

export interface MemoryEntry {
  filename: string;
  caption: string;
  tags: MemoryTag[];
}

export const memories: MemoryEntry[] = [
  { filename: '2.jpeg',  caption: 'double exposure, hong kong',   tags: ['Travel', 'Film'] },
  { filename: '3.jpg',   caption: 'above the harbour, hong kong', tags: ['Travel', 'Film'] },
  { filename: '4.jpg',   caption: 'first footprints',             tags: ['Nature'] },
  { filename: '5.jpg',   caption: 'through the prism',            tags: ['Film', 'Nature'] },
  { filename: '6.jpg',   caption: 'street mural',                 tags: ['California'] },
  { filename: '7.jpg',   caption: 'edinburgh in snow',            tags: ['Edinburgh'] },
  { filename: '8.jpg',   caption: 'eastern columbia, los angeles',tags: ['California'] },
  { filename: '9.jpg',   caption: 'empty streets, edinburgh',     tags: ['Edinburgh'] },
  { filename: '10.jpeg', caption: 'hauser & wirth, downtown la',  tags: ['California'] },
  { filename: '11.jpg',  caption: 'power lines',                  tags: ['California'] },
  { filename: '12.jpg',  caption: 'london, in pride',             tags: ['Travel'] },
  { filename: '13.jpg',  caption: 'californian dusk',             tags: ['California'] },
  { filename: '15.jpg',  caption: 'pier lights at night',         tags: ['California', 'Film'] },
  { filename: '16.jpg',  caption: 'pink clouds',                  tags: ['Nature'] },
  { filename: '17.jpg',  caption: 'reflected city, hong kong',    tags: ['Travel', 'Film'] },
  { filename: '19.png',  caption: 'paris rooftops',               tags: ['Travel'] },
  { filename: '20.png',  caption: 'rain on glass',                tags: ['Nature'] },
  { filename: '21.png',  caption: 'chromatic aberration',         tags: ['Film'] },
  { filename: '22.png',  caption: 'light through glass',          tags: ['Film'] },
  { filename: '23.jpeg', caption: 'bangkok street',               tags: ['Travel', 'Film'] },
  { filename: '24.jpg',  caption: 'hong kong',                    tags: ['Travel', 'Film'] },
  { filename: '25.png',  caption: 'orange county transit',        tags: ['California'] },
  { filename: '26.jpg',  caption: 'morning drive, orange county', tags: ['California'] },
  { filename: '27.jpg',  caption: 'palace of versailles',         tags: ['Travel'] },
  { filename: '28.jpg',  caption: 'white blossom',                tags: ['Nature'] },
  { filename: '29.jpg',  caption: 'paris from above',             tags: ['Travel'] },
  { filename: '30.jpg',  caption: 'eiffel tower',                 tags: ['Travel'] },
  { filename: '31.jpg',  caption: 'power lines and clouds',       tags: ['California'] },
  { filename: '32.jpg',  caption: 'california coastline',         tags: ['California'] },
  { filename: '33.jpg',  caption: '',                             tags: ['California'] },
  { filename: '34.jpg',  caption: 'la at night',                  tags: ['California', 'Film'] },
  { filename: '35.jpg',  caption: 'power lines',                  tags: ['California'] },
  { filename: '36.jpg',  caption: 'long beach morning',           tags: ['California'] },
  { filename: '38.jpg',  caption: 'newport beach',                tags: ['California', 'Nature'] },
  { filename: '39.jpg',  caption: 'sun on the shore',             tags: ['California', 'Film'] },
  { filename: '40.jpg',  caption: 'city park in winter, dc',      tags: ['Travel'] },
  { filename: '41.jpg',  caption: 'californian freeway',          tags: ['California'] },
  { filename: '42.jpg',  caption: 'los angeles at dusk',          tags: ['California'] },
  { filename: '43.jpg',  caption: 'sculpture, washington dc',     tags: ['Travel'] },
  { filename: '44.jpg',  caption: 'bokeh city',                   tags: ['Film'] },
  { filename: '45.jpg',  caption: 'botanical garden in snow',     tags: ['Nature'] },
  { filename: '46.jpg',  caption: 'crystal prism',                tags: ['Film'] },
  { filename: '47.jpg',  caption: 'paris rooftops at dusk',       tags: ['Travel'] },
  { filename: '49.jpg',  caption: 'coastal plants, newport beach', tags: ['California', 'Nature'] },
  { filename: '50.jpg',  caption: 'magnolia street',              tags: ['California'] },
  { filename: '51.jpg',  caption: 'the louvre',                   tags: ['Travel'] },
  { filename: '52.jpg',  caption: 'los angeles overpass',         tags: ['California'] },
  { filename: '53.jpg',  caption: 'orchid and lanterns',          tags: ['Travel'] },
  { filename: '54.jpg',  caption: 'bangkok skyline',              tags: ['Travel'] },
  { filename: '56.jpg',  caption: 'sunset, long beach',           tags: ['California', 'Film'] },
  { filename: '57.jpg',  caption: 'lily pond, cambridge',         tags: ['Travel', 'Nature'] },
  { filename: '58.JPG',  caption: 'magnolia street at dusk',      tags: ['California'] },
  { filename: '59.jpg',  caption: 'sundew seedlings',             tags: ['Nature'] },
  { filename: '60.jpg',  caption: 'manhattan beach sunset',       tags: ['California'] },
  { filename: '61.jpg',  caption: 'light refraction',             tags: ['Film'] },
  { filename: '62.jpg',  caption: 'bokeh',                        tags: ['Film'] },
];

export const ALL_TAGS: MemoryTag[] = ['California', 'Edinburgh', 'Travel', 'Nature', 'Film'];

export function getMemoryMeta(filename: string): MemoryEntry | undefined {
  return memories.find((m) => m.filename === filename);
}
