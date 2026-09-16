import path from 'path';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { HistoricalIngestionService } from '../src/services/historical/historicalIngestion.service';

async function main() {
  const args = process.argv.slice(2);
  const csvPath = args[0] || path.join(__dirname, '../data/historical_rules.csv');

  console.log('📦 Code DNA Historical Rule Importer');
  console.log(`📁 Source CSV File: ${csvPath}\n`);

  await connectDatabase();

  try {
    const report = await HistoricalIngestionService.importFromCSVFile(csvPath);

    console.log('==================================================');
    console.log('HISTORICAL RULE INGESTION REPORT');
    console.log('==================================================');
    console.log(`Total rows processed: ${report.totalRows}`);
    console.log(`Valid rows:           ${report.validRows}`);
    console.log(`Duplicates:           ${report.duplicates}`);
    console.log(`Invalid rows:         ${report.invalidRows}`);
    console.log(`Inserted:             ${report.inserted}`);
    console.log(`Updated:              ${report.updated}`);
    console.log(`Skipped (Unchanged):  ${report.skipped}`);
    console.log(`Duration:             ${report.durationMs}ms`);
    console.log('==================================================');

    if (report.errors.length > 0) {
      console.log('\n⚠️ Notices / Warnings:');
      report.errors.slice(0, 10).forEach((err) => console.log(`  - ${err}`));
      if (report.errors.length > 10) {
        console.log(`  ... and ${report.errors.length - 10} more`);
      }
    }

    console.log('\n✅ Historical Rules Ingestion Completed Successfully.\n');
  } catch (err: any) {
    console.error('❌ Ingestion Failed:', err.message);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

main();
