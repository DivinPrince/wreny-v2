import type { ComponentPropsWithoutRef } from 'react'

type InlineTextDiffParts = {
  prefix: string
  removed: string
  added: string
  suffix: string
}

const TOKEN_PATTERN = /(\s+|[^\s]+)/g

function tokenizeText(value: string) {
  return value.match(TOKEN_PATTERN) ?? []
}

export function splitInlineTextDiff(
  original: string,
  proposed: string,
): InlineTextDiffParts {
  const originalTokens = tokenizeText(original)
  const proposedTokens = tokenizeText(proposed)
  const sharedPrefixLength = Math.min(originalTokens.length, proposedTokens.length)

  let prefixIndex = 0
  while (
    prefixIndex < sharedPrefixLength &&
    originalTokens[prefixIndex] === proposedTokens[prefixIndex]
  ) {
    prefixIndex += 1
  }

  let originalSuffixIndex = originalTokens.length
  let proposedSuffixIndex = proposedTokens.length
  while (
    originalSuffixIndex > prefixIndex &&
    proposedSuffixIndex > prefixIndex &&
    originalTokens[originalSuffixIndex - 1] === proposedTokens[proposedSuffixIndex - 1]
  ) {
    originalSuffixIndex -= 1
    proposedSuffixIndex -= 1
  }

  return {
    prefix: originalTokens.slice(0, prefixIndex).join(''),
    removed: originalTokens.slice(prefixIndex, originalSuffixIndex).join(''),
    added: proposedTokens.slice(prefixIndex, proposedSuffixIndex).join(''),
    suffix: originalTokens.slice(originalSuffixIndex).join(''),
  }
}

export function InlineTextDiff({
  original,
  proposed,
  removedClassName,
  addedClassName,
  ...rest
}: Readonly<{
  original: string
  proposed: string
  removedClassName: string
  addedClassName: string
} & ComponentPropsWithoutRef<'span'>>) {
  const diff = splitInlineTextDiff(original, proposed)

  return (
    <span {...rest}>
      {diff.prefix}
      {diff.removed ? (
        <span className={removedClassName}>{diff.removed}</span>
      ) : null}
      {diff.added ? (
        <span className={addedClassName}>{diff.added}</span>
      ) : null}
      {diff.suffix}
    </span>
  )
}
