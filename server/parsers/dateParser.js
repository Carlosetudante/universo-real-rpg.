// server/parsers/dateParser.js
const chrono = require('chrono-node');
const { format, addDays } = require('date-fns');

function createParser() {
  return {
    extractAll(text) {
      const results = [];
      try {
        const parsed = chrono.parse(text, new Date(), { forwardDate: true });
        parsed.forEach((r) => {
          const d = r.start.date();
          const hasTime = typeof r.start.get('hour') === 'number' && !isNaN(r.start.get('hour'));
          const normalized = {
            date: format(d, 'yyyy-MM-dd'),
            time: hasTime ? format(d, 'HH:mm') : null,
            datetime: hasTime ? d.toISOString() : null,
            text: r.text
          };
          results.push({ text: r.text, normalized, confidence: hasTime ? 0.9 : 0.7 });
        });
      } catch (e) {
        // ignore
      }
      return results;
    }
  };
}

module.exports = { createParser };
