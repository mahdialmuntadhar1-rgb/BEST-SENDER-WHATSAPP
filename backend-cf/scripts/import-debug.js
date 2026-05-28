const fs = require('fs');

try {
  const CSV_PATH = 'C:\\Users\\HB LAPTOP STORE\\Documents\\puython-pro-scraper\\iraq_businesses_2026-05-26_122423.csv';
  
  if (!fs.existsSync(CSV_PATH)) {
    console.error('CSV file not found: ' + CSV_PATH);
    process.exit(1);
  }
  
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  console.error(`Total lines: ${lines.length}`);
  console.error(`First line (header): ${lines[0].substring(0, 100)}`);
  
  // Simple split by comma for headers
  const headers = lines[0].split(',');
  console.error(`Headers: ${headers.join(' | ')}`);
  
  // Write a simple test SQL
  const out = fs.createWriteStream('test-import.sql');
  out.write('BEGIN TRANSACTION;\n');
  out.write(`INSERT INTO contacts (name, phone, email, category, governorate, language, metadata) VALUES\n`);
  
  let count = 0;
  for (let i = 1; i < Math.min(lines.length, 100); i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 3) {
      const name = (parts[0] || '').replace(/'/g, "''").substring(0, 100);
      const phone = (parts[5] || parts[6] || '').replace(/\D/g, '');
      const gov = (parts[3] || '').replace(/'/g, "''");
      const lang = parts[1] === 'ku' ? 'sorani' : 'arabic';
      
      if (name && phone) {
        const num = phone.startsWith('964') ? '+' + phone : phone.startsWith('7') ? '+964' + phone : phone;
        out.write(`  ('${name}', '${num}', '', '', '${gov}', '${lang}', '{}')${i < Math.min(lines.length, 100) - 1 ? ',' : ';'}\n`);
        count++;
      }
    }
  }
  
  out.write('COMMIT;\n');
  out.end();
  
  console.error(`\nGenerated test-import.sql with ${count} records`);
} catch (e) {
  console.error('ERROR: ' + e.message);
  console.error(e.stack);
}
