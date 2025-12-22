
const { exec } = require('child_process');
const fs = require('fs');

exec('npx wrangler d1 execute ooh-db --remote --command "SELECT name, type, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE \'sqlite_%\' AND name != \'_cf_KV\' ORDER BY name" --json', { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    fs.writeFileSync('clean_schema.json', stdout);
    console.log('Schema saved to clean_schema.json');
});
