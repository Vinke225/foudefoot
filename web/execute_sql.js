const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: process.env.DB_HOST || 'db.hydegfcxuoychqkxzytd.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.DB_PASSWORD,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL!');

    const sql = fs.readFileSync('create_follows_table.sql', 'utf8');
    const res = await client.query(sql);
    console.log('SQL executed successfully!');
    console.log(res);

  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

run();
