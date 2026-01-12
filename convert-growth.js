const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = path.join(__dirname, 'growth.csv');
const OUTPUT_FILE = path.join(__dirname, 'data', 'growth_curve.ts');

const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

try {
  console.log(`📖 Reading ${INPUT_FILE}...`);
  const rawData = fs.readFileSync(INPUT_FILE, 'utf-8');

  const lines = rawData.split(/\r?\n/).filter(line => line.trim() !== '');
  
  // Detect Separator (Check the first row)
  const header = lines[0];
  const separator = header.includes(';') ? ';' : ',';
  console.log(`ℹ️  Detected separator: "${separator}"`);

  const dataRows = lines.slice(1);

  const tsData = dataRows.map((line, index) => {
    const cols = line.split(separator); 

    if (cols.length < 6) {
      console.warn(`⚠️ Skipping invalid row ${index + 2}: ${line}`);
      return null;
    }

    // 1. DATE FIX: DD/MM/YYYY -> YYYY-MM-DD
    const rawDate = cols[0].trim(); 
    let isoDate = rawDate;

    if (rawDate.includes('/')) {
      const [day, month, year] = rawDate.split('/');
      isoDate = `${year}-${month}-${day}`;
    }

    // 2. NUMBER FIX: Replace ',' with '.' before parsing
    const parseNum = (val) => {
      if (!val) return 0;
      // Remove any quotes and swap comma to dot
      const clean = val.replace(/"/g, '').replace(',', '.').trim();
      return parseFloat(clean);
    };

    return {
      date: isoDate,
      p15: parseNum(cols[1]),
      p25: parseNum(cols[2]),
      p50: parseNum(cols[3]),
      p75: parseNum(cols[4]),
      p85: parseNum(cols[5]),
    };
  }).filter(item => item !== null);

  const fileContent = `// Auto-generated from growth.csv
export const STATIC_GROWTH_DATA = ${JSON.stringify(tsData, null, 2)};
`;

  fs.writeFileSync(OUTPUT_FILE, fileContent);
  console.log(`✅ Success! Converted ${tsData.length} entries.`);
  
  // Debug: Show first entry to verify
  if (tsData.length > 0) {
    console.log('👀 First entry preview:', tsData[0]);
  }

} catch (error) {
  console.error('❌ Error:', error.message);
}