const fs = require('fs');
const { parse } = require('csv-parse/sync');

const CSV_PATH = 'C:\\Users\\HB LAPTOP STORE\\Documents\\puython-pro-scraper\\iraq_businesses_2026-05-26_122423.csv';
const OUTPUT_PATH = 'import-notx.sql';

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
  if (digits.length === 13 && digits.startsWith('964')) {
    return '+' + digits;
  }
  return digits.length > 0 ? '+' + digits : null;
}

function escapeSQL(str) {
  if (!str) return '';
  return str.replace(/'/g, "''").replace(/\u0000/g, '').substring(0, 500);
}

try {
  let content = fs.readFileSync(CSV_PATH, 'utf-8');
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
  
  const BATCH_SIZE = 50;
  const batches = [];
  let currentBatch = [];
  let imported = 0;
  
  for (const row of records) {
    const name = escapeSQL(row.name);
    const rawPhone = row.phone || row.mobile || row.whatsapp;
    const phone = normalizePhone(rawPhone);
    const email = escapeSQL(row.email);
    const category = escapeSQL(row.category);
    const governorate = escapeSQL(row.governorate);
    const language = row.language === 'ku' ? 'sorani' : 'arabic';
    
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
    
    if (phone && name && name !== 'undefined') {
      const sql = `('${name}', '${phone}', '${email}', '${category}', '${governorate}', '${language}', '${escapeSQL(metadata)}')`;
      currentBatch.push(sql);
      imported++;
      
      if (currentBatch.length >= BATCH_SIZE) {
        batches.push(currentBatch);
        currentBatch = [];
      }
    }
  }
  
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }
  
  const out = fs.createWriteStream(OUTPUT_PATH);
  
  for (const batch of batches) {
    out.write('INSERT INTO contacts (name, phone, email, category, governorate, language, metadata) VALUES\n');
    out.write(batch.join(',\n'));
    out.write(';\n');
  }
  
  out.end();
  
  console.error(`Generated ${OUTPUT_PATH} with ${imported} records in ${batches.length} batches`);
} catch (e) {
  console.error('ERROR: ' + e.message);
}
