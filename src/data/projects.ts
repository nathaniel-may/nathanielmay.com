import type { ImageMetadata } from 'astro';

import partyCarloPreview from '~/assets/images/projects/partycarlo.png';
import wordokuPreview from '~/assets/images/projects/wordoku.png';

export interface Project {
  title: string;
  description: string;
  href: string;
  image: ImageMetadata;
  imageAlt: string;
  since: Date;
}

export const projects: Project[] = [
  {
    title: 'Party Carlo',
    description:
      'Invite a ton of people to a party, estimate the likelihood of each individual coming, and use Monte Carlo methods to see how many folks you think might come! I use it to see if I need to invite more people or ask folks to bring friends. Designed to copy-paste from a spreadsheet.',
    href: 'https://partycarlo.nathanielmay.com',
    image: partyCarloPreview,
    imageAlt: 'Party Carlo showing an estimated attendance range of 13 to 20 people',
    since: new Date(Date.UTC(2022, 8, 1)),
  },
  {
    title: 'Wordoku',
    description:
      "Sudoku with letters where the diagonal spells a word. This site was a birthday gift to my mom who finished all the puzzles in the one book she had. Now she can print and play forever. It supports the sudoku variant, and colorku variant. I most frequently use this app on mobile to set up my physical colorku board. Particularly helpful for dropping a hint when we're stuck and want to move the game along.",
    href: 'https://sudoku.nathanielmay.com',
    image: wordokuPreview,
    imageAlt: 'A generated Wordoku puzzle with letters arranged in a nine-by-nine grid',
    since: new Date(Date.UTC(2021, 0, 1)),
  },
].sort((left, right) => right.since.getTime() - left.since.getTime());
