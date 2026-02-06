// server/parsers/moneyParser.js
// Extrai valores monetários simples do texto: R$ 12,50 | 12.50 | 50 reais | cinquenta reais
const wordsToNumbers = require('words-to-numbers').wordsToNumbers || (s=>s);

function extractAmounts(text) {
  const results = [];
  if (!text) return results;

  // Regex para R$ e números com vírgula/decimal
  const regex = /(?:r\$\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)(?:\s*(reais|rs|r\$)?)?/ig;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const raw = m[1];
    const num = parseFloat(raw.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(num)) results.push({ text: m[0], normalized: num });
  }

  // tenta encontrar por extenso (ex: 'cinquenta reais') - tentativa simples
  const extensoRegex = /([a-zA-Z\s-]+)\s+(reais|real)/ig;
  while ((m = extensoRegex.exec(text)) !== null) {
    const words = m[1].trim();
    try {
      const n = wordsToNumbers(words);
      if (typeof n === 'number' && !isNaN(n)) results.push({ text: m[0], normalized: n });
    } catch (e) {}
  }

  return results;
}

module.exports = { extractAmounts };
