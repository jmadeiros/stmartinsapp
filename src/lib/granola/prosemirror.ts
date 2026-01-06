/**
 * ProseMirror to Markdown Converter
 *
 * Converts ProseMirror JSON documents to Markdown format.
 * Used for converting Granola meeting notes content.
 */

import type { ProseMirrorDoc, ProseMirrorNode, ProseMirrorMark } from './types';

/**
 * Convert a ProseMirror document to Markdown string.
 *
 * @param doc - The ProseMirror document to convert
 * @returns Markdown formatted string
 */
export function proseMirrorToMarkdown(doc: ProseMirrorDoc): string {
  if (!doc || typeof doc !== 'object') {
    return '';
  }

  if (doc.type !== 'doc') {
    return '';
  }

  if (!doc.content || !Array.isArray(doc.content)) {
    return '';
  }

  try {
    return doc.content
      .map((node) => nodeToMarkdown(node, 0))
      .filter((text) => text !== null)
      .join('\n\n');
  } catch (error) {
    console.error('Error converting ProseMirror to Markdown:', error);
    return '';
  }
}

/**
 * Convert a single ProseMirror node to Markdown.
 *
 * @param node - The node to convert
 * @param depth - Current nesting depth (for indentation)
 * @returns Markdown string for this node
 */
function nodeToMarkdown(node: ProseMirrorNode, depth: number = 0): string | null {
  if (!node || typeof node !== 'object' || !node.type) {
    return null;
  }

  switch (node.type) {
    case 'heading':
      return convertHeading(node);

    case 'paragraph':
      return convertParagraph(node);

    case 'bulletList':
      return convertBulletList(node, depth);

    case 'orderedList':
      return convertOrderedList(node, depth);

    case 'listItem':
      return convertListItem(node, depth);

    case 'blockquote':
      return convertBlockquote(node);

    case 'codeBlock':
      return convertCodeBlock(node);

    case 'text':
      return applyMarks(node.text || '', node.marks);

    case 'hardBreak':
      return '\n';

    default:
      // For unknown node types, try to extract text content
      return extractTextFromNode(node);
  }
}

/**
 * Convert a heading node to Markdown.
 */
function convertHeading(node: ProseMirrorNode): string {
  const level = node.attrs?.level || 1;
  const clampedLevel = Math.min(Math.max(level, 1), 6);
  const prefix = '#'.repeat(clampedLevel);
  const text = extractInlineContent(node);
  return `${prefix} ${text}`;
}

/**
 * Convert a paragraph node to Markdown.
 */
function convertParagraph(node: ProseMirrorNode): string {
  return extractInlineContent(node);
}

/**
 * Convert a bullet list to Markdown.
 */
function convertBulletList(node: ProseMirrorNode, depth: number): string {
  if (!node.content || !Array.isArray(node.content)) {
    return '';
  }

  const indent = '  '.repeat(depth);
  return node.content
    .map((item) => {
      const content = convertListItem(item, depth);
      if (content === null) return '';
      return `${indent}- ${content}`;
    })
    .join('\n');
}

/**
 * Convert an ordered list to Markdown.
 */
function convertOrderedList(node: ProseMirrorNode, depth: number): string {
  if (!node.content || !Array.isArray(node.content)) {
    return '';
  }

  const indent = '  '.repeat(depth);
  const start = node.attrs?.start || 1;

  return node.content
    .map((item, index) => {
      const content = convertListItem(item, depth);
      if (content === null) return '';
      return `${indent}${start + index}. ${content}`;
    })
    .join('\n');
}

/**
 * Convert a list item to Markdown.
 * Handles nested lists within list items.
 */
function convertListItem(node: ProseMirrorNode, depth: number): string | null {
  if (!node || !node.content || !Array.isArray(node.content)) {
    return null;
  }

  const parts: string[] = [];
  let hasNestedList = false;

  for (const child of node.content) {
    if (child.type === 'bulletList' || child.type === 'orderedList') {
      hasNestedList = true;
      const nestedList = nodeToMarkdown(child, depth + 1);
      if (nestedList) {
        parts.push('\n' + nestedList);
      }
    } else if (child.type === 'paragraph') {
      parts.push(extractInlineContent(child));
    } else {
      const text = extractTextFromNode(child);
      if (text) {
        parts.push(text);
      }
    }
  }

  return parts.join(hasNestedList ? '' : ' ');
}

/**
 * Convert a blockquote to Markdown.
 */
function convertBlockquote(node: ProseMirrorNode): string {
  if (!node.content || !Array.isArray(node.content)) {
    return '';
  }

  const content = node.content
    .map((child) => nodeToMarkdown(child, 0))
    .filter((text) => text !== null)
    .join('\n\n');

  // Prefix each line with >
  return content
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
}

/**
 * Convert a code block to Markdown.
 */
function convertCodeBlock(node: ProseMirrorNode): string {
  const language = node.attrs?.language || '';
  const content = extractTextFromNode(node);
  return `\`\`\`${language}\n${content}\n\`\`\``;
}

/**
 * Extract inline content from a node, applying text marks.
 */
function extractInlineContent(node: ProseMirrorNode): string {
  if (!node.content || !Array.isArray(node.content)) {
    return '';
  }

  return node.content
    .map((child) => {
      if (child.type === 'text') {
        return applyMarks(child.text || '', child.marks);
      }
      if (child.type === 'hardBreak') {
        return '\n';
      }
      // Recursively extract text for other inline nodes
      return extractTextFromNode(child);
    })
    .join('');
}

/**
 * Apply text marks (bold, italic, etc.) to text.
 */
function applyMarks(text: string, marks?: ProseMirrorMark[]): string {
  if (!text || !marks || !Array.isArray(marks) || marks.length === 0) {
    return text;
  }

  let result = text;

  for (const mark of marks) {
    if (!mark || typeof mark !== 'object' || !mark.type) {
      continue;
    }

    switch (mark.type) {
      case 'bold':
      case 'strong':
        result = `**${result}**`;
        break;

      case 'italic':
      case 'em':
        result = `*${result}*`;
        break;

      case 'code':
        result = `\`${result}\``;
        break;

      case 'strike':
      case 'strikethrough':
        result = `~~${result}~~`;
        break;

      case 'link':
        const href = mark.attrs?.href || '';
        const title = mark.attrs?.title;
        if (title) {
          result = `[${result}](${href} "${title}")`;
        } else {
          result = `[${result}](${href})`;
        }
        break;

      // Unknown mark types are ignored
      default:
        break;
    }
  }

  return result;
}

/**
 * Extract plain text from a node, recursively processing children.
 */
function extractTextFromNode(node: ProseMirrorNode): string {
  if (!node || typeof node !== 'object') {
    return '';
  }

  if (node.text) {
    return node.text;
  }

  if (!node.content || !Array.isArray(node.content)) {
    return '';
  }

  return node.content.map((child) => extractTextFromNode(child)).join('');
}

/**
 * Extract plain text from a ProseMirror document.
 * Strips all formatting and returns raw text content.
 *
 * @param doc - The ProseMirror document
 * @returns Plain text string
 */
export function extractPlainText(doc: ProseMirrorDoc): string {
  if (!doc || typeof doc !== 'object') {
    return '';
  }

  if (doc.type !== 'doc') {
    return '';
  }

  if (!doc.content || !Array.isArray(doc.content)) {
    return '';
  }

  try {
    const texts: string[] = [];

    const walkNode = (node: ProseMirrorNode): void => {
      if (!node || typeof node !== 'object') {
        return;
      }

      // Handle text nodes
      if (node.text) {
        texts.push(node.text);
        return;
      }

      // Handle hard breaks as newlines in plain text
      if (node.type === 'hardBreak') {
        texts.push('\n');
        return;
      }

      // Recursively process children
      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          walkNode(child);
        }

        // Add spacing after block-level elements
        if (isBlockElement(node.type)) {
          texts.push(' ');
        }
      }
    };

    for (const node of doc.content) {
      walkNode(node);
    }

    // Clean up the result: normalize whitespace, trim
    return texts
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (error) {
    console.error('Error extracting plain text from ProseMirror doc:', error);
    return '';
  }
}

/**
 * Check if a node type is a block-level element.
 */
function isBlockElement(type: string): boolean {
  const blockTypes = [
    'paragraph',
    'heading',
    'bulletList',
    'orderedList',
    'listItem',
    'blockquote',
    'codeBlock',
  ];
  return blockTypes.includes(type);
}
