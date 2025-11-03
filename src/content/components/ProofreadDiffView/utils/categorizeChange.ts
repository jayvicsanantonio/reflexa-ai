/**
 * Categorize Change Utility
 * Categorizes change type based on heuristics
 * Note: Chrome Proofreader API doesn't provide explicit type categorization
 */

export const categorizeChange = (
  original: string,
  corrected: string
): 'grammar' | 'clarity' | 'spelling' => {
  const originalLower = original.toLowerCase();
  const correctedLower = corrected.toLowerCase();

  // Spelling: same length or very similar, different case or characters
  if (
    Math.abs(original.length - corrected.length) <= 2 &&
    originalLower !== correctedLower
  ) {
    return 'spelling';
  }

  // Grammar: structural changes, punctuation, articles, verb forms
  const grammarPatterns = /\b(a|an|the|is|are|was|were|has|have|had)\b/i;
  if (grammarPatterns.test(original) || grammarPatterns.test(corrected)) {
    return 'grammar';
  }

  // Clarity: significant rewording or length changes
  return 'clarity';
};
