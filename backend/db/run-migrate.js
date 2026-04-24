require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { Pool } = require('pg');

async function main() {
  console.log('Connecting to:', {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
  });

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const db = drizzle(pool);

  try {
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: './db/migrations' });
    console.log('✓ Migrations applied successfully');
  } catch (err) {
    console.error('✗ Migration failed:');
    console.error(err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();