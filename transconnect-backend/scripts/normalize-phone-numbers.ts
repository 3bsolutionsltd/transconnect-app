/**
 * Database Migration: Normalize Existing Phone Numbers
 * 
 * This script:
 * 1. Finds all agents with non-normalized phone numbers
 * 2. Normalizes them to E.164 format
 * 3. Detects and reports potential duplicates
 * 4. Updates the database with normalized numbers
 * 
 * Run with: npm run normalize-phones
 */

import { prisma } from '../src/index';
import { PhoneNormalizer, normalizePhone } from '../src/utils/phone-normalizer';

interface AgentPhoneUpdate {
  id: string;
  name: string;
  originalPhone: string;
  normalizedPhone: string;
  issues: string[];
  isDuplicate: boolean;
}

async function normalizeExistingPhoneNumbers() {
  console.log('🔍 PHONE NUMBER NORMALIZATION MIGRATION');
  console.log('=' * 50);

  try {
    // Get all agents
    const agents = await prisma.agent.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        status: true
      }
    });

    console.log(`Found ${agents.length} agents to process`);
    console.log('');

    const updates: AgentPhoneUpdate[] = [];
    const errors: { agent: any; error: string }[] = [];

    // Process each agent
    for (const agent of agents) {
      console.log(`Processing: ${agent.name} (${agent.phone})`);
      
      const phoneValidation = normalizePhone(agent.phone, 'UG');
      
      if (phoneValidation.isValid) {
        const needsUpdate = phoneValidation.normalizedNumber !== agent.phone;
        
        if (needsUpdate) {
          updates.push({
            id: agent.id,
            name: agent.name,
            originalPhone: agent.phone,
            normalizedPhone: phoneValidation.normalizedNumber!,
            issues: phoneValidation.issues || [],
            isDuplicate: false // Will be set later
          });
          console.log(`  ✅ ${agent.phone} → ${phoneValidation.normalizedNumber}`);
        } else {
          console.log(`  ✅ Already normalized`);
        }
      } else {
        errors.push({
          agent,
          error: phoneValidation.issues?.join(', ') || 'Unknown error'
        });
        console.log(`  ❌ Failed to normalize: ${phoneValidation.issues?.join(', ')}`);
      }
    }

    console.log('');
    console.log(`📊 SUMMARY:`);
    console.log(`  Total agents: ${agents.length}`);
    console.log(`  Need updates: ${updates.length}`);
    console.log(`  Errors: ${errors.length}`);
    console.log('');

    // Check for duplicates after normalization
    if (updates.length > 0) {
      console.log('🔍 Checking for duplicates...');
      
      const allNormalizedPhones = [
        ...agents.filter(a => !updates.find(u => u.id === a.id)).map(a => a.phone),
        ...updates.map(u => u.normalizedPhone)
      ];

      const duplicates = PhoneNormalizer.findDuplicates(allNormalizedPhones);
      
      if (duplicates.length > 0) {
        console.log(`❌ Found ${duplicates.length} potential duplicate groups:`);
        
        for (const dup of duplicates) {
          console.log(`  📱 ${dup.normalized}:`);
          console.log(`     Original formats: ${dup.originalFormats.join(', ')}`);
          
          // Mark updates as duplicates
          for (const update of updates) {
            if (update.normalizedPhone === dup.normalized) {
              update.isDuplicate = true;
            }
          }
        }
        
        console.log('');
        console.log('⚠️  WARNING: Duplicates detected! Review before proceeding.');
        console.log('   You may need to manually merge or remove duplicate agents.');
      } else {
        console.log('✅ No duplicates found');
      }
    }

    // Display errors
    if (errors.length > 0) {
      console.log('');
      console.log('❌ AGENTS WITH PHONE NUMBER ERRORS:');
      for (const error of errors) {
        console.log(`  ${error.agent.name} (${error.agent.phone}): ${error.error}`);
      }
    }

    // Display planned updates
    if (updates.length > 0) {
      console.log('');
      console.log('📋 PLANNED UPDATES:');
      for (const update of updates) {
        const duplicateFlag = update.isDuplicate ? '⚠️  DUPLICATE' : '✅';
        console.log(`  ${duplicateFlag} ${update.name}`);
        console.log(`    ${update.originalPhone} → ${update.normalizedPhone}`);
        if (update.issues.length > 0) {
          console.log(`    Notes: ${update.issues.join(', ')}`);
        }
      }

      console.log('');
      const proceed = process.argv.includes('--execute');
      
      if (!proceed) {
        console.log('🚀 TO EXECUTE UPDATES, RUN:');
        console.log('   npm run normalize-phones -- --execute');
        console.log('');
        console.log('⚠️  IMPORTANT: Review duplicates and errors before executing!');
        return;
      }

      // Execute updates
      console.log('🚀 EXECUTING UPDATES...');
      
      let successCount = 0;
      let skipCount = 0;

      for (const update of updates) {
        if (update.isDuplicate) {
          console.log(`⏭️  Skipping ${update.name} (duplicate detected)`);
          skipCount++;
          continue;
        }

        try {
          await prisma.agent.update({
            where: { id: update.id },
            data: { phone: update.normalizedPhone }
          });
          
          console.log(`✅ Updated ${update.name}: ${update.originalPhone} → ${update.normalizedPhone}`);
          successCount++;
        } catch (error: any) {
          console.log(`❌ Failed to update ${update.name}: ${error.message}`);
        }
      }

      console.log('');
      console.log('📊 MIGRATION COMPLETE:');
      console.log(`  ✅ Successfully updated: ${successCount}`);
      console.log(`  ⏭️  Skipped (duplicates): ${skipCount}`);
      console.log(`  ❌ Errors: ${errors.length}`);
      
      if (duplicates.length > 0) {
        console.log('');
        console.log('⚠️  NEXT STEPS:');
        console.log('   1. Review duplicate agents manually');
        console.log('   2. Decide whether to merge or delete duplicates');
        console.log('   3. Update any references to old phone numbers');
      }
    } else {
      console.log('✅ All phone numbers are already normalized!');
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Test individual phone normalization
async function testPhoneNormalization() {
  console.log('🧪 TESTING PHONE NORMALIZATION');
  console.log('=' * 40);

  const testPhones = [
    '+256778981388',    // Already correct
    '0766272563',       // Missing country code
    '256701234567',     // Missing + prefix  
    '+211921366521',    // Wrong country code
    '700123456',        // Local mobile format
    '+254700123456',    // Kenya number
    '+15551234567',     // US number
  ];

  for (const phone of testPhones) {
    const result = normalizePhone(phone, 'UG');
    console.log(`📱 "${phone}"`);
    console.log(`   → ${result.isValid ? '✅' : '❌'} ${result.normalizedNumber || 'INVALID'}`);
    if (result.issues) {
      console.log(`   ℹ️  ${result.issues.join(', ')}`);
    }
    console.log('');
  }
}

// Main execution
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'test') {
    testPhoneNormalization();
  } else {
    normalizeExistingPhoneNumbers();
  }
}

export { normalizeExistingPhoneNumbers, testPhoneNormalization };