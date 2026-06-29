function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

export function parseCsvQuestions(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('CSV must include a header row and at least one data row');
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });

    return row;
  });
}

export function parseImportPayload({ file, body }) {
  if (file?.buffer) {
    const text = file.buffer.toString('utf8').trim();
    const name = file.originalname?.toLowerCase() ?? '';

    if (name.endsWith('.json') || file.mimetype === 'application/json') {
      const payload = JSON.parse(text);
      return Array.isArray(payload) ? payload : payload.questions ?? [];
    }

    return parseCsvQuestions(text);
  }

  if (Array.isArray(body?.questions)) {
    return body.questions;
  }

  if (typeof body?.csv === 'string' && body.csv.trim()) {
    return parseCsvQuestions(body.csv);
  }

  throw new Error('Provide a CSV/JSON file upload or a JSON questions array');
}
