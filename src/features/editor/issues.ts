import type { TFunction } from 'i18next'
import type { ValidationIssue } from '@/core'

/**
 * Translates a validation issue (`t` is bound to the "editor" namespace). Falls back to
 * the English message in core for a code that has no translation yet.
 */
export function describeIssue(t: TFunction, issue: ValidationIssue): string {
  return t(`issues.${issue.code}`, {
    defaultValue: issue.message,
    color: issue.color ? t(`colors.${issue.color}`) : '',
    side: issue.side ? t(`sides.${issue.side}`) : '',
    square: issue.square ?? '',
    ply: issue.ply ?? '',
    token: issue.token ?? '',
  })
}
