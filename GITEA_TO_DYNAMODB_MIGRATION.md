# Gitea to DynamoDB Migration Guide

## 🎯 Migration Strategy: Zero Downtime

Deploy to Lightsail now, migrate to serverless later while keeping all your data.

---

## 📅 Timeline

### Phase 1: Launch on Lightsail (Today - 30 min)
- Deploy to Lightsail
- Use Gitea for storage
- Get users and feedback

### Phase 2: Prepare for Migration (Weekend - 2 hours)
- Set up DynamoDB
- Create migration script
- Test data sync

### Phase 3: Migrate to Serverless (Weekend - 4 hours)
- Export data from Gitea
- Import to DynamoDB
- Deploy serverless architecture
- Switch DNS

---

## 🔄 Data Sync Options

### Option 1: One-Time Migration (Recommended)
**When:** You're ready to fully switch to serverless

**Process:**
1. Export all decks from Gitea
2. Import to DynamoDB
3. Switch to serverless
4. Shut down Lightsail

**Downtime:** ~5 minutes

### Option 2: Dual-Write (Advanced)
**When:** You want to run both systems simultaneously

**Process:**
1. Write to both Gitea AND DynamoDB
2. Test serverless with real data
3. Switch reads to DynamoDB
4. Stop writing to Gitea

**Downtime:** 0 minutes

---

## 📦 Migration Script

### Step 1: Export from Gitea

Create `scripts/export-from-gitea.js`:

```javascript
const fs = require('fs');
const path = require('path');

// Configuration
const GITEA_DATA_PATH = '/home/ubuntu/gitea-data/git/repositories';
const OUTPUT_FILE = 'decks-export.json';

async function exportDecks() {
  const decks = [];
  
  // Read all user directories
  const users = fs.readdirSync(GITEA_DATA_PATH);
  
  for (const user of users) {
    const userPath = path.join(GITEA_DATA_PATH, user);
    
    if (!fs.statSync(userPath).isDirectory()) continue;
    
    // Read all deck repositories
    const repos = fs.readdirSync(userPath);
    
    for (const repo of repos) {
      const deckPath = path.join(userPath, repo, 'deck.json');
      
      if (fs.existsSync(deckPath)) {
        try {
          const deckData = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
          
          decks.push({
            userId: user,
            deckId: repo.replace('.git', ''),
            deckName: deckData.name || repo,
            data: deckData,
            exportedAt: new Date().toISOString()
          });
          
          console.log(`✓ Exported: ${user}/${repo}`);
        } catch (error) {
          console.error(`✗ Failed: ${user}/${repo}`, error.message);
        }
      }
    }
  }
  
  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(decks, null, 2));
  
  console.log(`\n✅ Exported ${decks.length} decks to ${OUTPUT_FILE}`);
  return decks;
}

exportDecks().catch(console.error);
```

### Step 2: Import to DynamoDB

Create `scripts/import-to-dynamodb.js`:

```javascript
const AWS = require('aws-sdk');
const fs = require('fs');

// Configuration
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-1'
});

const TABLE_NAME = 'Decks';
const INPUT_FILE = 'decks-export.json';

async function importDecks() {
  // Read exported data
  const decks = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  
  console.log(`Importing ${decks.length} decks to DynamoDB...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const deck of decks) {
    try {
      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: {
          userId: deck.userId,
          deckId: deck.deckId,
          name: deck.deckName,
          game: deck.data.game || 'riftbound',
          legend: deck.data.legend,
          battlefields: deck.data.battlefields || [],
          cards: deck.data.cards || [],
          runeDeck: deck.data.runeDeck || [],
          metadata: deck.data.metadata || {},
          createdAt: deck.exportedAt,
          updatedAt: deck.exportedAt,
          version: 1
        }
      }).promise();
      
      successCount++;
      console.log(`✓ Imported: ${deck.userId}/${deck.deckId}`);
    } catch (error) {
      errorCount++;
      console.error(`✗ Failed: ${deck.userId}/${deck.deckId}`, error.message);
    }
  }
  
  console.log(`\n✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
}

importDecks().catch(console.error);
```

### Step 3: Run Migration

```bash
# On your Lightsail instance

# 1. Export from Gitea
node scripts/export-from-gitea.js

# 2. Download export file
scp ubuntu@your-ip:~/decks-export.json ./

# 3. Import to DynamoDB (from your local machine)
npm install aws-sdk
node scripts/import-to-dynamodb.js

# Done! ✅
```

---

## 🔀 Dual-Write Implementation (Optional)

If you want zero downtime, write to both systems during migration.

### Create Dual-Write Service

`src/services/dualWriteDeckService.ts`:

```typescript
import { giteaService } from './gitea';
import { amplifyDeckService } from './amplifyDeckService';

const USE_DUAL_WRITE = import.meta.env.VITE_DUAL_WRITE === 'true';
const READ_FROM = import.meta.env.VITE_READ_FROM || 'gitea'; // 'gitea' or 'dynamodb'

export class DualWriteDeckService {
  async saveDeck(username: string, deckName: string, deck: any) {
    if (USE_DUAL_WRITE) {
      // Write to both systems
      await Promise.all([
        giteaService.saveDeck(username, deckName, deck),
        amplifyDeckService.createDeck(deck)
      ]);
    } else if (READ_FROM === 'dynamodb') {
      // Only write to DynamoDB
      await amplifyDeckService.createDeck(deck);
    } else {
      // Only write to Gitea
      await giteaService.saveDeck(username, deckName, deck);
    }
  }

  async getDeck(username: string, deckName: string) {
    if (READ_FROM === 'dynamodb') {
      return await amplifyDeckService.getDeck(deckName);
    } else {
      return await giteaService.getDeck(username, deckName);
    }
  }

  async listDecks(username: string) {
    if (READ_FROM === 'dynamodb') {
      return await amplifyDeckService.listDecks();
    } else {
      return await giteaService.listDecks(username);
    }
  }
}

export const deckService = new DualWriteDeckService();
```

### Migration Process with Dual-Write

```
1. Deploy Lightsail with Gitea
   ↓
2. Add DynamoDB (keep Gitea running)
   ↓
3. Enable dual-write (VITE_DUAL_WRITE=true)
   ↓
4. All new saves go to both systems
   ↓
5. Run migration script for old data
   ↓
6. Switch reads to DynamoDB (VITE_READ_FROM=dynamodb)
   ↓
7. Test everything works
   ↓
8. Disable dual-write, remove Gitea
   ↓
9. Shut down Lightsail, fully serverless!
```

---

## 📊 Data Mapping

### Gitea Structure:
```
repos/
└── username/
    └── deck-name.git/
        └── deck.json
```

### DynamoDB Structure:
```javascript
{
  "userId": "username",
  "deckId": "deck-name",
  "name": "My Fury Deck",
  "game": "riftbound",
  "legend": { ... },
  "battlefields": [ ... ],
  "cards": [ ... ],
  "runeDeck": [ ... ],
  "metadata": { ... },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "version": 1
}
```

---

## ✅ Migration Checklist

### Pre-Migration
- [ ] Lightsail deployed and working
- [ ] Users creating decks
- [ ] Backup Gitea data
- [ ] Set up DynamoDB table
- [ ] Test migration script locally

### Migration Day
- [ ] Announce maintenance window (5 min)
- [ ] Stop accepting new deck saves
- [ ] Run export script
- [ ] Run import script
- [ ] Verify data in DynamoDB
- [ ] Deploy serverless frontend
- [ ] Update DNS to serverless
- [ ] Test deck loading
- [ ] Re-enable deck saves
- [ ] Monitor for errors

### Post-Migration
- [ ] Keep Lightsail running for 1 week (backup)
- [ ] Monitor DynamoDB for issues
- [ ] Verify all users can access decks
- [ ] Shut down Lightsail
- [ ] Celebrate! 🎉

---

## 🔍 Verification Script

Create `scripts/verify-migration.js`:

```javascript
const AWS = require('aws-sdk');
const fs = require('fs');

const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

async function verifyMigration() {
  const exported = JSON.parse(fs.readFileSync('decks-export.json', 'utf8'));
  
  console.log(`Verifying ${exported.length} decks...`);
  
  let found = 0;
  let missing = 0;
  
  for (const deck of exported) {
    try {
      const result = await dynamodb.get({
        TableName: 'Decks',
        Key: {
          userId: deck.userId,
          deckId: deck.deckId
        }
      }).promise();
      
      if (result.Item) {
        found++;
        console.log(`✓ Found: ${deck.userId}/${deck.deckId}`);
      } else {
        missing++;
        console.log(`✗ Missing: ${deck.userId}/${deck.deckId}`);
      }
    } catch (error) {
      missing++;
      console.error(`✗ Error: ${deck.userId}/${deck.deckId}`, error.message);
    }
  }
  
  console.log(`\n✅ Found: ${found}/${exported.length}`);
  console.log(`❌ Missing: ${missing}/${exported.length}`);
  
  if (missing === 0) {
    console.log('\n🎉 Migration successful!');
  } else {
    console.log('\n⚠️  Some decks are missing. Check errors above.');
  }
}

verifyMigration().catch(console.error);
```

---

## 💰 Cost During Migration

### Running Both Systems:
```
Lightsail                  $10.00/month
DynamoDB (testing)         $ 0.00 (free tier)
Route 53                   $ 0.50/month
──────────────────────────────────
TOTAL                      $10.50/month
```

### After Migration:
```
S3 + CloudFront           $ 2.00/month
Lambda + API Gateway      $ 4.00/month
DynamoDB                  $ 1.25/month
Cognito                   $ 0.00 (free tier)
Route 53                  $ 0.50/month
──────────────────────────────────
TOTAL                     $ 7.75/month
```

**Savings: $2.75/month** (and unlimited scaling!)

---

## 🎯 Recommended Timeline

### Week 1: Launch on Lightsail
- Deploy to Lightsail
- Get users
- Collect feedback

### Week 2-3: Grow and Stabilize
- Fix bugs
- Add features
- Build user base

### Week 4: Prepare Migration
- Set up DynamoDB
- Test migration scripts
- Create dual-write service

### Week 5: Migrate
- Run migration
- Switch to serverless
- Monitor closely

### Week 6: Cleanup
- Verify everything works
- Shut down Lightsail
- Celebrate savings!

---

## 🆘 Rollback Plan

If something goes wrong during migration:

### Quick Rollback (5 minutes):
```bash
# 1. Switch DNS back to Lightsail
# Update Route 53 A record to Lightsail IP

# 2. Gitea still has all data
# Users can continue using the site

# 3. Debug serverless issues
# Fix and try again later
```

### Data Recovery:
- Gitea data is preserved
- DynamoDB has copy of data
- Export file is backup
- Can retry migration anytime

---

## 📝 Summary

**Your Path:**
1. ✅ Deploy to Lightsail today (30 min)
2. ✅ Launch and get users
3. ✅ Migrate to serverless later (weekend project)
4. ✅ Keep all data with migration script
5. ✅ Save money and scale infinitely

**Benefits:**
- 🚀 Launch quickly
- 💰 Save money long-term
- 📈 Scale automatically
- 🔒 Modern architecture
- 🛡️ Zero data loss

Ready to deploy to Lightsail? Follow `LIGHTSAIL_DEPLOYMENT_GUIDE.md` and you'll be live in 30 minutes!
