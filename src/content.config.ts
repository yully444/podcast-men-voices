import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const episodes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/episodes" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    audioUrl: z.string().url().optional(),
    embedUrl: z.string().url().optional(),
    duration: z.string().optional(),
    season: z.number().optional(),
    number: z.number().optional(),
    chaptersIntro: z.string().optional(),
    chapters: z
      .array(
        z.object({
          time: z.string(),
          title: z.string(),
        }),
      )
      .optional(),
  }),
});

export const collections = { episodes };
