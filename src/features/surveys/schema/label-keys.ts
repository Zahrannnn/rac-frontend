export function fieldLabelKey(sectionKey: string, fieldKey: string): string {
  return `survey.field.${sectionKey}.${fieldKey}`;
}

export function optionLabelKey(key: string): string {
  return `survey.opt.${key}`;
}

export function checklistItemLabelKey(key: string): string {
  return `survey.item.${key}`;
}

/** Axis statement rows are namespaced per section (survey.statement.{section}.{row}). */
export function statementLabelKey(sectionKey: string, rowKey: string): string {
  return `survey.statement.${sectionKey}.${rowKey}`;
}

export function matrixRowLabelKey(key: string): string {
  return `survey.row.${key}`;
}

export function matrixColLabelKey(key: string): string {
  return `survey.col.${key}`;
}
