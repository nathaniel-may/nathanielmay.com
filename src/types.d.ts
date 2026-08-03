import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import type { HTMLAttributes, ImageMetadata } from 'astro/types';

export interface Post {
  /** Unique ID identifying the post. */
  id: string;
  /** URL-friendly slug derived from the post name. */
  slug: string;
  /** Fully resolved permalink, computed from the configured pattern. */
  permalink: string;

  publishDate: Date;
  updateDate?: Date;

  title: string;
  /** Optional summary of post content. */
  excerpt?: string;
  image?: ImageMetadata | string;
  /** Alt text for `image`. Omit for decorative images, which render alt="". */
  imageAlt?: string;
  imageCredit?: string;

  category?: Taxonomy;
  tags?: Taxonomy[];
  author?: string;

  metadata?: MetaData;

  draft?: boolean;

  /** Rendered Astro component factory for the post body. */
  Content?: AstroComponentFactory;

  /** Estimated reading time in minutes. */
  readingTime?: number;
}

export interface Taxonomy {
  slug: string;
  title: string;
}

export interface MetaData {
  title?: string;
  ignoreTitleTemplate?: boolean;

  canonical?: string;

  robots?: MetaDataRobots;

  description?: string;

  openGraph?: MetaDataOpenGraph;
  twitter?: MetaDataTwitter;
}

export interface MetaDataRobots {
  index?: boolean;
  follow?: boolean;
}

export interface MetaDataImage {
  url: string;
  width?: number;
  height?: number;
}

export interface MetaDataOpenGraph {
  url?: string;
  siteName?: string;
  images?: Array<MetaDataImage>;
  locale?: string;
  type?: string;
}

export interface MetaDataTwitter {
  handle?: string;
  site?: string;
  cardType?: string;
}

export interface Widget {
  id?: string;
  bg?: string;
  classes?: Record<string, string | Record<string, string>>;
}

// COMPONENTS
export interface CallToAction extends Omit<HTMLAttributes<'a'>, 'slot'> {
  variant?: 'default' | 'ghost';
  text?: string;
  icon?: string;
  classes?: Record<string, string>;
  type?: 'button' | 'submit' | 'reset';
}
