import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { User } from '../src/models';
import { DnaService } from '../src/services/dna.service';

async function main() {
  console.log('🧬 Code DNA - Full Engineering Profile Rebuild');
  await connectDatabase();

  try {
    const users = await User.find({});
    console.log(`Found ${users.length} total user accounts to recalculate.\n`);

    let successCount = 0;
    let failedCount = 0;

    for (const user of users) {
      try {
        const userId = user._id.toString();
        const profile = await DnaService.rebuildCodeDNA(userId);
        console.log(
          `✅ Rebuilt DNA for "${user.name}" (${user.email}) -> Score: ${profile.overallScore}, Level: ${profile.level} (${profile.levelTitle}), Reviews: ${profile.reviewCount}, Strengths: ${profile.strengths?.length || 0}, Weaknesses: ${profile.recurringWeaknesses?.length || 0}`
        );
        successCount++;
      } catch (err: any) {
        console.error(`❌ Failed to rebuild DNA for user ${user.email}: ${err.message}`);
        failedCount++;
      }
    }

    console.log('\n==================================================');
    console.log('CODE DNA REBUILD SUMMARY');
    console.log('==================================================');
    console.log(`Total Users Processed: ${users.length}`);
    console.log(`Successfully Rebuilt:  ${successCount}`);
    console.log(`Failed:                ${failedCount}`);
    console.log('==================================================\n');
  } catch (err: any) {
    console.error('Fatal Rebuild Error:', err.message);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

main();
