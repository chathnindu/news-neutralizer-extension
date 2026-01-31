/**
 * Simple keyword extraction utility
 * Extracts meaningful keywords from title and text using basic heuristics
 */

// Common stop words to filter out
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
  'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'just', 'don',
  'now', 'says', 'said'
]);

/**
 * Extract keywords from title and text
 * @param {string} title - Article title
 * @param {string} text - Article text content
 * @returns {string[]} Array of extracted keywords
 */
export function extractKeywords(title = '', text = '') {
  // Combine title (weighted more heavily) and beginning of text
  const titleWords = title.toLowerCase().split(/\W+/).filter(w => w.length > 0);
  
  // Take first 500 characters of text for keyword extraction
  const textSample = text ? text.substring(0, 500) : '';
  const textWords = textSample.toLowerCase().split(/\W+/).filter(w => w.length > 0);
  
  // Count word frequency, giving title words more weight
  const wordFrequency = {};
  
  titleWords.forEach(word => {
    if (!STOP_WORDS.has(word) && word.length > 2) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 3; // Title words weighted 3x
    }
  });
  
  textWords.forEach(word => {
    if (!STOP_WORDS.has(word) && word.length > 2) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
  });
  
  // Sort by frequency and take top keywords
  const sortedWords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
  
  // Return top 5 keywords, or all if less than 5
  const topKeywords = sortedWords.slice(0, 5);
  
  // If we have title, always include at least the first significant word from title
  if (titleWords.length > 0 && topKeywords.length === 0) {
    const firstSignificant = titleWords.find(w => !STOP_WORDS.has(w) && w.length > 2);
    if (firstSignificant) {
      topKeywords.push(firstSignificant);
    }
  }
  
  return topKeywords;
}
