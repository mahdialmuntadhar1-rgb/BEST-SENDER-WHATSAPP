const fs = require('fs');
const { parse } = require('csv-parse/sync');

const CSV_PATH = 'C:\\Users\\HB LAPTOP STORE\\Documents\\puython-pro-scraper\\iraq_businesses_2026-05-26_122423.csv';

try {
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  
  console.error(`Total records: ${records.length}`);
  
  // Print first 5 records
  for (let i = 0; i < Math.min(5, records.length); i++) {
    const row = records[i];
    console.error(`\nRecord ${i+1}:`);
    console.error(`  name: "${row.name}"`);
    console.error(`  language: "${row.language}"`);
    console.error(`  category: "${row.category}"`);
    console.error(`  governorate: "${row.governorate}"`);
    console.error(`  phone: "${row.phone}"`);
    console.error(`  mobile: "${row.mobile}"`);
    console.error(`  whatsapp: "${row.whatsapp}"`);
  }
} catch (e) {
  console.error('ERROR: ' + e.message);
}
