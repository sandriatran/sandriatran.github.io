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
  challenge?: string;
  process?: string;
  outcome?: string;
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
    challenge: 'Plant-based food culture lacked a voice that was both aesthetically compelling and rooted in genuine advocacy — most content either preached or aestheticised without substance.',
    process: 'Built an editorial identity from scratch: visual language, tone of voice, and a content cadence that centred food sovereignty stories alongside recipe development. Grew organically through community, not paid reach.',
    outcome: '45.6k+ unique followers across platforms as of January 2026, with a sister nonprofit (The Soft Bunny xx Foundation) launched to extend the mission into direct food access work.',
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
    challenge: 'Access to nuanced, interdisciplinary science and technology education remains deeply unequal — particularly at the intersection of AI, cognitive science, and society.',
    process: 'Designed a multimedia content and programming strategy combining long-form writing, visual storytelling, and community events. Positioned the org at the crossroads of academic rigour and radical accessibility.',
    outcome: 'An operational nonprofit with a growing body of educational content and a defined mission in digital justice and STEAM equity.',
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
    challenge: 'Academic research presentations are structurally inaccessible — dense slides, opaque statistics, no interactivity. The original 2009 study deserved a richer re-examination.',
    process: 'Built a full Bayesian reanalysis pipeline in R using brms, then translated every statistical finding into an interactive, animated slide experience in React/Vite — including a 50-term glossary for non-specialist readers.',
    outcome: 'A published interactive deck that makes Bayesian psycholinguistics legible to a broader audience, with live visualisations and full source on GitHub.',
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
    challenge: 'The media platform had grown an audience with shared values — the question was how to convert that into direct, structural food access work rather than just content.',
    process: 'Formalised the nonprofit structure, defined a food sovereignty mission, and began building programming that linked the platform\'s creative voice to tangible community impact.',
    outcome: 'A functioning 501(c)(3)-equivalent organisation with a clear mandate, extending the platform\'s reach from content into direct advocacy.',
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
    challenge: 'Baby2Baby\'s existing web presence undersold the emotional weight of their mission — a charity serving children in poverty deserved a design language that communicated urgency and warmth equally.',
    process: 'Conducted a full design audit, rebuilt the information architecture around donor and recipient journeys, and introduced a story-led visual system using photography, colour, and typography to foreground the human impact.',
    outcome: 'A complete front-end redesign — responsive, accessible, and emotionally coherent — that frames the organisation\'s work with the gravity it deserves.',
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
    challenge: 'Food insecurity affects a significant proportion of university students, yet the resources available — scattered across websites, flyers, and word-of-mouth — are nearly impossible to navigate in a moment of need.',
    process: 'Mapped the full student journey from awareness to access, then designed a mobile product that surfaces nearby food resources in real time. Developed complete in-app flows, an App Store listing, and social assets to form a coherent product ecosystem.',
    outcome: 'A fully designed, prototype-tested mobile app concept that treats campus food access as a product problem worthy of rigorous design thinking.',
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
    challenge: 'Mental health apps tend to either overwhelm with features or offer too little structure. Students in particular need something that fits into existing routines rather than adding another obligation.',
    process: 'Used iterative UX research — interviews, journey mapping, rapid prototyping — to design a calendar-integrated system that identifies genuine time gaps and fills them with light, evidence-backed stress-reduction activities.',
    outcome: 'A high-fidelity prototype that reimagines the mental wellness app as ambient support: present when needed, invisible when not.',
  },
];
