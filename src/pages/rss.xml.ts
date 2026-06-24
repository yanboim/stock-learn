import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function GET(context: APIContext) {
  const tutorials = await getCollection('tutorials');
  // 按发布时间倒序，最新内容在前
  const items = tutorials
    .sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime())
    .map((tutorial) => ({
      title: tutorial.data.title,
      description: tutorial.data.description,
      pubDate: tutorial.data.publishDate,
      link: `/tutorials/${tutorial.id}/`,
      categories: [tutorial.data.category, ...tutorial.data.tags],
    }));

  return rss({
    title: '股票学习站',
    description: '系统化学习股票投资：技术分析、行业研究、交易系统与风险控制。',
    site: context.site ?? 'https://stock-learn.pages.dev',
    items,
    customData: '<language>zh-cn</language>',
  });
}
