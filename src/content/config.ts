import { defineCollection, z } from "astro:content";

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    date: z.string(), // "YYYY-MM-DD"
    status: z.enum(["concept", "in-progress", "completed"]).default("concept"),
    repoUrl: z.string().url().optional(),
    demoUrl: z.string().url().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = {
  projects,
};
