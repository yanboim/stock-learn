# 股票学习站 · Stock Learn

一个系统化的中文股票投资学习网站。把零散的技术分析、行业研究和交易系统知识，整理成可执行的投资框架，用交互式图表和案例建立自己的分析方法。

线上地址：<https://stock-learn.pages.dev>

> ⚠️ 本站内容仅供学习交流，不构成任何投资建议。投资有风险，入市需谨慎。

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | [Astro 6](https://astro.build)（静态站点）+ MDX 内容集合 |
| 交互 | React 19（`@astrojs/react`，岛屿组件） |
| 样式 | TailwindCSS 4（`@tailwindcss/vite`）+ Typography 插件 |
| 图表 | [lightweight-charts](https://tradingview.github.io/lightweight-charts/)（TradingView 出品） |
| 内容增强 | `remark-directive` + 自写的 callout 插件 |
| 部署 | Cloudflare Pages |

## 命令

| 命令 | 作用 |
|:-----|:-----|
| `npm install` | 安装依赖（需 Node ≥ 22.12） |
| `npm run dev` | 启动本地开发服务器 `localhost:4321` |
| `npm run build` | 构建生产站点到 `./dist/` |
| `npm run preview` | 本地预览构建产物 |

## 目录结构

```text
src/
├── content/tutorials/      # 全部教程（MDX），按主题分文件
│   ├── 01~18-*.mdx         # 基础课程：K线、均线、MACD、RSI、估值、止损…
│   ├── td-sequential-*.mdx # 神奇九转（TD Sequential）完整教程
│   └── mjie-*.mdx          # 「Mi姐交易体系」六章（市场认知/技术/策略/风控/宏观/心法）
├── components/
│   ├── TutorialBanner.astro
│   └── interactive/        # React 交互组件
│       ├── InteractiveChart.tsx   # K线 + MA/MACD/RSI/TD9 多指标
│       ├── RiskCalculator.tsx     # 止损/仓位/盈亏比/复利计算
│       ├── IndicatorDemo.tsx
│       ├── ComparisonTable.tsx
│       └── ProcessSteps.tsx
├── layouts/                # BaseLayout / TutorialLayout
├── pages/
│   ├── index.astro         # 首页
│   └── tutorials/
│       ├── index.astro     # 教程列表（带分类筛选）
│       ├── [slug].astro    # 教程详情（动态静态生成）
│       └── mistery-map.astro # Mi姐交易体系知识地图
├── styles/global.css       # 设计系统
└── content.config.ts       # 内容 schema（category/difficulty/tags/order…）
```

## 内容结构

每篇教程都有结构化的 frontmatter（见 `src/content.config.ts`）：

- **category**：基础入门 / 技术指标 / 行业研究 / 交易系统 / 实战案例 / 风险控制
- **difficulty**：入门 / 进阶 / 高级
- **tags**、**order**、**publishDate**

教程大量使用**内联 SVG 信息图**（`<div class="illustration">`），而非位图，保证清晰度和体积。

## 自定义能力

- **callout 提示框**：在 MDX 中用 `:::tip` / `:::note` / `:::caution` / `:::warning` / `:::danger` 容器指令，由 `remark-callout-directive.mjs` 渲染成彩色提示框。
- **交互式图表**：在 MDX 中 `import InteractiveChart from '../../components/interactive/InteractiveChart'`，传入 `showMA` / `showMACD` / `showRSI` / `showTD` 等参数。

## 部署

构建产物在 `./dist`，通过 Cloudflare Pages 部署（见 `wrangler.toml`）。每次推送到 `main` 分支自动触发部署。
