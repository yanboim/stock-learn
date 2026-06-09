/**
 * remark-callout-directive
 *
 * Handles :::tip[Title], :::note[Title], :::caution[Title], :::warning[Title], :::danger[Title]
 * using remark-directive's container directive syntax.
 *
 * Important: remark-directive also parses ordinary text like `9:15` and `1:2.5`
 * as text directives. If left alone, those become empty <div></div> nodes in Astro.
 * This plugin converts all non-container text/leaf directives back to plain text.
 */
import { visit } from 'unist-util-visit';

const CALLOUT_TYPES = {
  tip:     { icon: '💡', color: '#10b981', bg: '#ecfdf5' },
  note:    { icon: '📝', color: '#3b82f6', bg: '#eff6ff' },
  info:    { icon: 'ℹ️', color: '#6366f1', bg: '#eef2ff' },
  caution: { icon: '⚠️', color: '#f59e0b', bg: '#fffbeb' },
  warning: { icon: '🚨', color: '#ef4444', bg: '#fef2f2' },
  danger:  { icon: '🔴', color: '#dc2626', bg: '#fef2f2' },
};

function collectText(node) {
  const parts = [];
  const walk = (n) => {
    if (!n) return;
    if (n.type === 'text') parts.push(n.value);
    if (Array.isArray(n.children)) n.children.forEach(walk);
  };
  walk(node);
  return parts.join('');
}

function directiveToText(node) {
  // For accidental text directives parsed from normal text:
  // `9:15` is represented as text("9") + textDirective(name="15").
  // Reconstruct the exact visible directive fragment.
  let value = `:${node.name || ''}`;

  if (Array.isArray(node.children) && node.children.length) {
    value += `[${node.children.map(collectText).join('')}]`;
  }

  const attrs = node.attributes || {};
  const attrEntries = Object.entries(attrs);
  if (attrEntries.length) {
    const attrText = attrEntries
      .map(([key, val]) => (val === true ? key : `${key}="${String(val)}"`))
      .join(' ');
    value += `{${attrText}}`;
  }

  return value;
}

export default function remarkCalloutDirective() {
  return (tree) => {
    // 1) Convert accidental text/leaf directives back to literal text.
    visit(tree, ['textDirective', 'leafDirective'], (node, index, parent) => {
      if (!parent || typeof index !== 'number') return;
      parent.children[index] = {
        type: 'text',
        value: directiveToText(node),
      };
    });

    // 2) Convert only container directives with known callout names into callout boxes.
    visit(tree, 'containerDirective', (node) => {
      const type = node.name;
      if (!CALLOUT_TYPES[type]) return;

      const config = CALLOUT_TYPES[type];
      const data = node.data || (node.data = {});

      let titleText = type.toUpperCase();
      const firstChild = node.children?.[0];
      if (firstChild?.data?.directiveLabel) {
        titleText = collectText(firstChild) || titleText;
        node.children.shift();
      }

      data.hName = 'div';
      data.hProperties = {
        className: `callout callout-${type}`,
        style: `border-left:4px solid ${config.color};background:${config.bg};border-radius:8px;padding:1rem 1.25rem;margin:1.5rem 0`,
      };

      node.children.unshift({
        type: 'paragraph',
        data: {
          hName: 'p',
          hProperties: {
            style: `font-weight:bold;color:${config.color};margin:0 0 0.5rem 0;font-size:0.95rem`,
          },
        },
        children: [{ type: 'text', value: `${config.icon} ${titleText}` }],
      });
    });
  };
}
