const fs = require('fs');
const path = require('path');

const CSV_PATH = process.argv[2] || 'C:\\Users\\HB LAPTOP STORE\\Documents\\puython-pro-scraper\\iraq_businesses_2026-05-26_122423.csv';

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
  return str.replace(/'/g, "''").replace(/\u0000/g, '');
}

function generateSQL() {
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    console.error('Empty CSV file');
    process.exit(1);
  }
  
  const headers = parseCSVLine(lines[0]);
  console.log(`-- Headers: ${headers.join(', ')}`);
  console.log(`-- Total records: ${lines.length - 1}`);
  console.log();
  
  // Batch size for D1
  const BATCH_SIZE = 50;
  const batches = [];
  let currentBatch = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;
    
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
    const bio = escapeSQL(row.bio);
    const website = escapeSQL(row.website);
    const facebook = escapeSQL(row.facebook);
    const instagram = escapeSQL(row.instagram);
    const latitude = row.latitude || null;
    const longitude = row.longitude || null;
    
    const metadata = JSON.stringify({
      address: row.address,
      bio: row.bio,
      website: row.website,
      facebook: row.facebook,
      instagram: row.instagram,
      latitude: row.latitude,
      longitude: row.longitude,
      category: row.category,
    });
    
    if (phone) {
      const sql = `('${name}', '${phone}', '${email}', '${category}', '${governorate}', '${language}', '${escapeSQL(metadata)}')`;
      currentBatch.push(sql);
      
      if (currentBatch.length >= BATCH_SIZE) {
        batches.push(currentBatch);
        currentBatch = [];
      }
    }
  }
  
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }
  
  // Output SQL
  console.log('BEGIN TRANSACTION;');
  
  for (const batch of batches) {
    console.log(`INSERT INTO contacts (name, phone, email, category, governorate, language, metadata) VALUES`);
    console.log(batch.join(',\n'));
    console.log(';');
  }
  
  console.log('COMMIT;');
  console.log();
  console.log(`-- Total batches: ${batches.length}`);
  console.log(`-- Total records with phone: ${batches.reduce((sum, b) => sum + b.length, 0)}`);
}

generateSQL();
