/**
 * Resolves template strings like {{itemVar.field}} to actual values
 * Used for data binding in list items
 *
 * @example
 * resolveTemplateString("{{todo.title}}", { id: 1, title: "Buy milk" }, "todo")
 * // Returns: "Buy milk"
 */
export function resolveTemplateString(
  text: string | undefined,
  itemContext: any | undefined,
  itemVar: string | undefined
): string | undefined {
  if (!text || !itemContext || !itemVar) return text;

  // Simple template string resolution: {{itemVar.field}}
  return text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const trimmedPath = path.trim();

    // Handle simple paths like "todo.title" or "item.done"
    if (trimmedPath.startsWith(`${itemVar}.`)) {
      const field = trimmedPath.substring(itemVar.length + 1);
      const value = itemContext[field];
      return value !== undefined ? String(value) : match;
    }

    return match;
  });
}
