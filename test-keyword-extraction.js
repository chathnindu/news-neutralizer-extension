/**
 * Simple test for keyword extraction
 * Run with: node test-keyword-extraction.js
 */

import { extractKeywords } from './background/keyword-extractor.js';

// Test cases
const testCases = [
  {
    title: 'Breaking News: Major Climate Summit Reaches Historic Agreement',
    text: 'World leaders gathered at the Climate Summit today to discuss global warming and environmental policies. The historic agreement aims to reduce carbon emissions by 50% over the next decade. Scientists praised the commitment as a crucial step in fighting climate change.',
    expected: ['climate', 'summit', 'agreement', 'historic', 'breaking']
  },
  {
    title: 'Technology Giants Announce New AI Partnership',
    text: 'Major technology companies have joined forces to develop ethical artificial intelligence frameworks. The partnership includes Microsoft, Google, and OpenAI, focusing on responsible AI development and deployment.',
    expected: ['technology', 'giants', 'partnership']
  },
  {
    title: 'Local Election Results Show Surprising Turnout',
    text: 'Voter turnout in yesterday\'s local election exceeded expectations, with 75% of registered voters casting their ballots. The results demonstrate increased civic engagement across all demographics.',
    expected: ['election', 'results', 'local', 'turnout']
  }
];

console.log('Testing Keyword Extraction\n');
console.log('='.repeat(50));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}:`);
  console.log(`Title: ${testCase.title}`);
  
  const keywords = extractKeywords(testCase.title, testCase.text);
  
  console.log(`Extracted keywords: ${keywords.join(', ')}`);
  console.log(`Expected keywords: ${testCase.expected.join(', ')}`);
  
  // Check if at least 2 expected keywords are found
  const matches = testCase.expected.filter(expected => 
    keywords.includes(expected)
  );
  
  const success = matches.length >= 2;
  
  if (success) {
    console.log('✓ PASS (found ' + matches.length + ' expected keywords)');
    passed++;
  } else {
    console.log('✗ FAIL (found ' + matches.length + ' expected keywords, need at least 2)');
    failed++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('✓ All tests passed!');
  process.exit(0);
} else {
  console.log('✗ Some tests failed');
  process.exit(1);
}
