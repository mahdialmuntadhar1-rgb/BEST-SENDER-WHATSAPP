const fs = require('fs');
const { parse } = require('csv-parse/sync');

const CSV_PATH = 'C:\\Users\\HB LAPTOP STORE\\Documents\\puython-pro-scraper\\iraq_businesses_2026-05-26_122423.csv';

try {
  let content = fs.readFileSync(CSV_PATH, 'utf-8');
  
  // Remove BOM if present
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.substring(1);
  }
  
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });
  
  console.error(`Total records: ${records.length}`);
  
  // Print first 10 records with all keys
  for (let i = 0; i < Math.min(10, records.length); i++) {
    const row = records[i];
    const keys = Object.keys(row);
    console.error(`\nRecord ${i+1} keys: ${keys.join(', ')}`);
    console.error(`  name="${row.name}" phone="${row.phone}" mobile="${row.mobile}"`);
  }
  
  // Count records with valid data
  let valid = 0;
  let hasPhone = 0;
  let hasName = 0;
  
  for (const row of records) {
    if (row.name && row.name !== 'undefined' && row.name.trim()) hasName++;
    const phone = row.phone || row.mobile || row.whatsapp;
    if (phone && phone.trim()) hasPhone++;
    if (row.name && row.name !== 'undefined' && row.name.trim() && phone && phone.trim()) valid++;
  }
  
  console.error(`\nStats:`);
  console.error(`  Has name: ${hasName}`);
  console.error(`  Has phone: ${hasPhone}`);
  console.error(`  Valid (both): ${valid}`);
} catch (e) {
  console.error('ERROR: ' + e.message);
}
