/**
 * Project data for the card stack.
 *
 * To add a new project: append an entry here and drop its hero image
 * into public/images/projects/. No other files need editing.
 */

export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  links: { label: string; href: string }[];
  color: string; // accent gradient stop for card header
}

export const projects: Project[] = [
  {
    id: 'soft-bunny-xx',
    title: 'The Soft Bunny xx',
    description:
      'An altruistic multimedia platform cultivating a utopian culinary landscape — harmonizing sustainable gastronomy, ethical consumption, and environmental stewardship. 45.6k+ unique followers as of January 2026.',
    image: '/images/projects/soft-bunny-xx.jpg',
    tags: ['Multimedia', 'Sustainability', 'Content Creation', 'Plant-Based'],
    links: [
      { label: 'Beacons', href: 'https://www.beacons.ai/TheSoftBunnyxx' },
    ],
    color: '#eccedc',
  },
  {
    id: 'cerebral-constellations',
    title: 'Cerebral Constellations',
    description:
      'A pioneering STEAM-focused nonprofit democratizing knowledge at the intersection of natural & artificial minds, technology, and society. Championing digital justice through multimedia storytelling and accessible educational content.',
    image: '/images/projects/cerebral-constellations.jpg',
    tags: ['Nonprofit', 'STEAM', 'Digital Justice', 'Education'],
    links: [
      { label: 'Website', href: 'https://www.CerebralConstellations.org' },
    ],
    color: '#d2bfd6',
  },
  {
    id: 'key-rock',
    title: 'The Key to the Rock',
    description:
      'A Bayesian hierarchical analysis of L1 phonology in L2 word recognition, reanalyzing Ota, Hartsuiker & Haywood (2009). 26-slide interactive deck with animated statistical visualizations, a 50-term glossary, and glassmorphic UI built in React/Vite with an R-based pipeline.',
    image: '/images/projects/key-rock.gif',
    tags: ['React', 'Vite', 'R/brms', 'Bayesian Stats', 'Psycholinguistics'],
    links: [
      { label: 'Live Demo', href: 'https://sandriatran.github.io/qml-2025/' },
      { label: 'GitHub', href: 'https://github.com/sandriatran/qml-2025' },
    ],
    color: '#e3f4ff',
  },
  {
    id: 'soft-bunny-foundation',
    title: 'The Soft Bunny xx Foundation',
    description:
      'A nonprofit organization dedicated to food sovereignty — believing that delicious, nutritious food is a right for all beings. Cultivating a utopian culinary landscape that harmonizes sustainable gastronomy and ethical consumption.',
    image: '/images/projects/soft-bunny-foundation.jpg',
    tags: ['Nonprofit', 'Food Sovereignty', 'Sustainability'],
    links: [
      { label: 'Website', href: 'https://www.TheSoftBunnyxx.org' },
    ],
    color: '#f4eae0',
  },
  {
    id: 'baby2baby',
    title: 'baby2baby',
    description:
      'A modern, mission-driven full-stack redesign pairing Baby2Baby\'s social impact with story-driven design — providing children in need with essential items like diapers, clothing, and basic necessities.',
    image: '/images/projects/baby2baby.jpg',
    tags: ['HTML', 'CSS', 'JavaScript', 'UI/UX', 'Social Impact'],
    links: [],
    color: '#eccedc',
  },
  {
    id: 'friendleaf',
    title: 'Friendleaf',
    description:
      'A UI/UX mobile application connecting USC students to free and low-cost food resources, reducing campus food insecurity. Presented as a cohesive digital product ecosystem — in-app flows, App Store listing, and social touchpoints.',
    image: '/images/projects/friendleaf.jpg',
    tags: ['UI/UX', 'Mobile App', 'Product Design', 'Food Insecurity'],
    links: [],
    color: '#d2bfd6',
  },
  {
    id: 'perceive',
    title: 'Perceive',
    description:
      'A student-centered mental health app prototype designed through iterative UX and interaction design. Analyzes users\' calendars to fill time gaps with productive de-stressing activities, envisioning a calm, supportive digital space.',
    image: '/images/projects/perceive.jpg',
    tags: ['UX', 'Interaction Design', 'Mental Health', 'Mobile App'],
    links: [],
    color: '#8e8dad',
  },
];
