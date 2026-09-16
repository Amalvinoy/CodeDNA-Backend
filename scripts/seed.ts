import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { seedInitialDatabaseData } from '../src/config/seed';

const runStandaloneSeed = async () => {
  const connected = await connectDatabase();
  if (connected) {
    await seedInitialDatabaseData();
    await disconnectDatabase();
    console.log('✅ Standalone database seed completed.');
    process.exit(0);
  } else {
    console.error('❌ Could not connect to database for seeding.');
    process.exit(1);
  }
};

if (require.main === module) {
  runStandaloneSeed();
}

export { seedInitialDatabaseData };
