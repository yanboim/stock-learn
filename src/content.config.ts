import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tutorials = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/tutorials' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum([
      '技术指标',
      '基础入门',
      '行业研究',
      '交易系统',
      '实战案例',
      '风险控制',
    ]),
    tags: z.array(z.string()).default([]),
    difficulty: z.enum(['入门', '进阶', '高级']).default('入门'),
    publishDate: z.coerce.date(),
    updateDate: z.coerce.date().optional(),
    /** 分享卡片图，相对 public 目录的路径或绝对 URL；留空则用站点默认 OG 图 */
    coverImage: z.string().optional(),
    order: z.number().default(0),
  }),
});

export const collections = {
  tutorials,
};
