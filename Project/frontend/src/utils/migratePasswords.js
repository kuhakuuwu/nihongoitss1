/**
 * Migration Script: Hash existing passwords in database
 * 
 * This script should be run ONCE to convert all plain-text passwords
 * in the database to hashed passwords.
 * 
 * IMPORTANT: Backup your database before running this script!
 * 
 * Usage:
 * 1. Open browser console on your app
 * 2. Copy and paste this entire script
 * 3. Run: migratePasswords()
 * 4. Wait for completion message
 */

import { supabase } from '../supabaseClient';
import { hashPassword, isPasswordHashed } from './passwordHash';

export async function migratePasswords() {
    console.log('🔐 Starting password migration...');
    
    try {
        // Fetch all users
        const { data: users, error: fetchError } = await supabase
            .from('users')
            .select('id, email, password');

        if (fetchError) {
            console.error('❌ Error fetching users:', fetchError);
            return;
        }

        console.log(`📊 Found ${users.length} users to process`);

        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        // Process each user
        for (const user of users) {
            // Skip if password is already hashed
            if (isPasswordHashed(user.password)) {
                console.log(`⏭️  Skipping user ${user.email} (already hashed)`);
                skippedCount++;
                continue;
            }

            try {
                // Hash the password
                const hashedPassword = await hashPassword(user.password);

                // Update in database
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ password: hashedPassword })
                    .eq('id', user.id);

                if (updateError) {
                    console.error(`❌ Error updating user ${user.email}:`, updateError);
                    errorCount++;
                } else {
                    console.log(`✅ Updated user ${user.email}`);
                    updatedCount++;
                }
            } catch (err) {
                console.error(`❌ Error processing user ${user.email}:`, err);
                errorCount++;
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`   ✅ Updated: ${updatedCount}`);
        console.log(`   ⏭️  Skipped: ${skippedCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log(`   📦 Total: ${users.length}`);
        console.log('\n🎉 Migration completed!');

    } catch (error) {
        console.error('❌ Fatal error during migration:', error);
    }
}

// Export for manual execution
window.migratePasswords = migratePasswords;

console.log('✅ Migration script loaded. Run migratePasswords() to start.');
