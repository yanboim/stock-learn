/**
 * remark-callout-directive
 * 
 * Handles :::tip[Title], :::note[Title], :::caution[Title], :::warning[Title], :::danger[Title]
 * using remark-directive's container directive syntax.
 * 
 * The [Title] becomes the first child with directiveLabel=true.
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

export default function remarkCalloutDirective() {
  return (tree) => {
    visit(tree, 'containerDirective', (node) => {
      const type = node.name;
      if (!CALLOUT_TYPES[type]) return;

      const config = CALLOUT_TYPES[type];
      const data = node.data || (node.data = {});

      // Extract title from directiveLabel child
      let titleText = type.toUpperCase();
      const firstChild = node.children?.[0];
      if (firstChild?.data?.directiveLabel) {
        // Get text content from the label child
        const textNodes = [];
        const collectText = (n) => {
          if (n.type === 'text') textNodes.push(n.value);
          if (n.children) n.children.forEach(collectText);
        };
        collectText(firstChild);
        titleText = textNodes.join('');
        // Remove the label node from children
        node.children.shift();
      }

      data.hName = 'div';
      data.hProperties = {
        className: `callout callout-${type}`,
        style: `border-left:4px solid ${config.color};background:${config.bg};border-radius:8px;padding:1rem 1.25rem;margin:1.5rem 0`,
      };

      // Add title as first child
      const titleNode = {
        type: 'paragraph',
        data: {
          hName: 'p',
          hProperties: {
            style: `font-weight:bold;color:${config.color};margin:0 0 0.5rem 0;font-size:0.95rem`,
          },
        },
        children: [
          { type: 'text', value: `${config.icon} ${titleText}` },
        ],
      };

      node.children.unshift(titleNode);
    });
  };
}
