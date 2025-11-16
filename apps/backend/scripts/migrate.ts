import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../src/config/supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

async function runMigrations() {
  console.log('Starting database migrations...');
  
  // Get list of migration files in order
  const migrationFiles = [
    '0001_initial_schema.sql',
    '0002_functions_and_triggers.sql',
    // Add new migration files here in order
  ];

  // Create migrations table if it doesn't exist
  await supabase.rpc(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Get already executed migrations
  const { data: executedMigrations } = await supabase
    .from('migrations')
    .select('name');
  
  const executedMigrationNames = new Set(
    executedMigrations?.map(m => m.name) || []
  );

  // Execute pending migrations
  for (const migrationFile of migrationFiles) {
    if (executedMigrationNames.has(migrationFile)) {
      console.log(`Skipping already executed migration: ${migrationFile}`);
      continue;
    }

    console.log(`Running migration: ${migrationFile}`);
    
    try {
      const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
      const sql = await readFile(migrationPath, 'utf8');
      
      // Split the SQL file into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      // Execute each statement in a transaction
      const { error } = await supabase.rpc('begin');
      
      try {
        for (const statement of statements) {
          if (statement.trim() === '') continue;
          const { error: stmtError } = await supabase.rpc('execute_sql', {
            query: statement,
          });
          
          if (stmtError) throw stmtError;
        }
        
        // Record the migration as complete
        const { error: insertError } = await supabase
          .from('migrations')
          .insert({ name: migrationFile });
          
        if (insertError) throw insertError;
        
        await supabase.rpc('commit');
        console.log(`✓ Successfully applied migration: ${migrationFile}`);
      } catch (err) {
        await supabase.rpc('rollback');
        console.error(`❌ Error executing migration ${migrationFile}:`, err);
        process.exit(1);
      }
    } catch (err) {
      console.error(`❌ Error reading migration file ${migrationFile}:`, err);
      process.exit(1);
    }
  }
  
  console.log('All migrations completed successfully!');
  process.exit(0);
}

runMigrations().catch(err => {
  console.error('Unhandled error during migrations:', err);
  process.exit(1);
});
