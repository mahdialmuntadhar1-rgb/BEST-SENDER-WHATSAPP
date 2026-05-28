const fs = require('fs');

const CSV_PATH = 'C:\\Users\\HB LAPTOP STORE\\Documents\\puython-pro-scraper\\iraq_businesses_2026-05-26_122423.csv';
const OUTPUT_PATH = 'import-final.sql';

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('7')) {
    return '+964' + digits;
  }
  if (digits.length === 11 && digits.startsWith('964')) {
    return '+' + digits;
  }
  if (digits.length === 14 && digits.startsWith('00964')) {
    return '+964' + digits.slice(5);
  }
  return digits.length > 0 ? phone : null;
}

function escapeSQL(str) {
  if (!str) return '';
  return str.replace(/'/g, "''").replace(/\u0000/g, '').substring(0, 500);
}

function main() {
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    console.error('Empty CSV file');
    process.exit(1);
  }
  
  const headers = parseCSVLine(lines[0]);
  console.error(`Headers: ${headers.join(', ')}`);
  console.error(`Total records: ${lines.length - 1}`);
  
  const BATCH_SIZE = 50;
  const batches = [];
  let currentBatch = [];
  let skipped = 0;
  let imported = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) {
      skipped++;
      continue;
    }
    
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    
    const name = escapeSQL(row.name);
    const phone = normalizePhone(row.phone || row.mobile || row.whatsapp);
    const email = escapeSQL(row.email);
    const category = escapeSQL(row.category);
    const governorate = escapeSQL(row.governorate);
    const language = row.language === 'ar' ? 'arabic' : row.language === 'ku' ? 'sorani' : 'arabic';
    
    const metadata = JSON.stringify({
      address: row.address || '',
      bio: row.bio || '',
      website: row.website || '',
      facebook: row.facebook || '',
      instagram: row.instagram || '',
      latitude: row.latitude || '',
      longitude: row.longitude || '',
      category: row.category || '',
    });
    
    if (phone && name) {
      const sql = `('${name}', '${phone}', '${email}', '${category}', '${governorate}', '${language}', '${escapeSQL(metadata)}')`;
      currentBatch.push(sql);
      imported++;
      
      if (currentBatch.length >= BATCH_SIZE) {
        batches.push(currentBatch);
        currentBatch = [];
      }
    } else {
      skipped++;
    }
  }
  
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }
  
  // Write clean SQL
  const out = fs.createWriteStream(OUTPUT_PATH);
  out.write('BEGIN TRANSACTION;\n');
  
  for (const batch of batches) {
    out.write('INSERT INTO contacts (name, phone, email, category, governorate, language, metadata) VALUES\n');
    out.write(batch.join(',\n'));
    out.write(';\n');
  }
  
  out.write('COMMIT;\n');
  out.end();
  
  console.error(`\nImport summary:`);
  console.error(`- Total CSV rows: ${lines.length - 1}`);
  console.error(`- Imported: ${imported}`);
  console.error(`- Skipped: ${skipped}`);
  console.error(`- Batches: ${batches.length}`);
  console.error(`\nSQL written to: ${OUTPUT_PATH}`);
}

main();
