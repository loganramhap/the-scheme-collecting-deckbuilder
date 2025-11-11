# Zaunite Workshop - TODO List

## 🚀 Immediate Priority - AWS Lightsail Deployment

### Step 1: Create Lightsail Instance (5 min)
- [ ] Create AWS account (if needed)
- [ ] Create Lightsail instance ($10/month, 2GB RAM)
- [ ] Choose Ubuntu 22.04 LTS
- [ ] Create static IP address
- [ ] Open ports 80, 443 in firewall

### Step 2: Install Software (10 min)
- [ ] SSH into instance
- [ ] Install Docker & Docker Compose
- [ ] Install Nginx
- [ ] Install Certbot (for SSL)

### Step 3: Deploy Application (10 min)
- [ ] Clone/upload your code to server
- [ ] Set up environment variables (.env)
- [ ] Start Docker services (docker-compose up -d)
- [ ] Build React frontend (npm run build)
- [ ] Configure Nginx

### Step 4: Configure Domain (5 min)
- [ ] Create Route 53 hosted zone for zauniteworkshop.com
- [ ] Create A records pointing to Lightsail IP
- [ ] Update domain nameservers at registrar
- [ ] Wait for DNS propagation (5-60 min)

### Step 5: Enable HTTPS (2 min)
- [ ] Run Certbot to get SSL certificate
- [ ] Configure auto-renewal
- [ ] Test HTTPS works

### Step 6: Riot API Setup
- [ ] Verify `/riot.txt` is accessible at zauniteworkshop.com/riot.txt
- [ ] Apply for Riot Games Production API key
- [ ] Update `.env` with production API key once approved
- [ ] Test API integration with production key

**See LIGHTSAIL_DEPLOYMENT_GUIDE.md for detailed instructions!**

## 🔐 Authentication & User Management

### Riot Sign-On (RSO) Integration
- [ ] Research Riot Sign-On (RSO) OAuth flow
- [ ] Register application with Riot Games for RSO
- [ ] Implement RSO authentication flow
- [ ] Replace/supplement Gitea OAuth with RSO
- [ ] Store Riot account info with user profile
- [ ] Add "Sign in with Riot" button to login page
- [ ] Handle RSO token refresh
- [ ] Test RSO login flow end-to-end

### User Profile Enhancements
- [ ] Display Riot username/summoner name
- [ ] Show Riot account region
- [ ] Link Gitea account to Riot account
- [ ] Add profile settings page

## 🎮 Riftbound Features (Current Bugs Fixed)

### ✅ Completed
- [x] Multi-domain Legend support
- [x] Auto-populate runes based on Legend
- [x] Adjustable rune counts (+/- controls)
- [x] Fixed card filtering (Type, Cost, Rarity, Domain)
- [x] Riot API integration with caching
- [x] Separate rune deck (12 cards)
- [x] Battlefield selection (3 required)
- [x] Domain-based card filtering

### 🔧 Remaining Issues
- [ ] Test all features with production Riot API
- [ ] Verify deck validation rules
- [ ] Test deck save/load with all zones
- [ ] Verify tag persistence works

## 🗑️ Code Cleanup

### Remove MTG References
- [ ] Phase 1: Delete MTG-only components
  - [ ] Delete `MTGCommanderBuilder.tsx`
  - [ ] Delete `CommanderSlot.tsx`
  - [ ] Delete `colorIdentityFiltering.ts`
  - [ ] Remove MTG constants from `filters.ts`

- [ ] Phase 2: Simplify shared components
  - [ ] Remove `gameType` props
  - [ ] Remove MTG conditional logic
  - [ ] Update component interfaces

- [ ] Phase 3: Update pages
  - [ ] Simplify `DeckEditor.tsx`
  - [ ] Simplify `Dashboard.tsx`
  - [ ] Remove game type selection

- [ ] Phase 4: Clean up utilities
  - [ ] Simplify `cardFiltering.ts`
  - [ ] Simplify `deckValidation.ts`

- [ ] Phase 5: Update types
  - [ ] Remove `MTGCard` interface
  - [ ] Update `Card` type

- [ ] Phase 6: Documentation
  - [ ] Update README
  - [ ] Remove Scryfall references
  - [ ] Update docs

## 🎨 UI/UX Improvements

### Deck Builder
- [ ] Add keyboard shortcuts for common actions
- [ ] Add deck import/export functionality
- [ ] Add deck sharing via URL
- [ ] Add deck statistics dashboard
- [ ] Improve mobile responsiveness
- [ ] Add dark/light theme toggle

### Card Browser
- [ ] Add card preview on hover (larger image)
- [ ] Add advanced search filters
- [ ] Add sort options (name, cost, rarity)
- [ ] Add collection tracking
- [ ] Add favorite cards feature

## 📊 Features to Add

### Deck Management
- [ ] Deck templates/archetypes
- [ ] Deck comparison tool
- [ ] Deck statistics (mana curve, domain distribution)
- [ ] Deck testing/goldfish mode
- [ ] Deck recommendations based on meta

### Social Features
- [ ] Public deck sharing
- [ ] Deck comments/ratings
- [ ] User profiles with deck collections
- [ ] Follow other deck builders
- [ ] Deck of the week/featured decks

### Competitive Features
- [ ] Tournament deck lists
- [ ] Meta analysis
- [ ] Win rate tracking
- [ ] Matchup guides
- [ ] Tier lists

## 🔧 Technical Improvements

### Performance
- [ ] Implement virtual scrolling for large card lists
- [ ] Optimize image loading
- [ ] Add service worker for offline support
- [ ] Implement progressive web app (PWA)
- [ ] Add loading skeletons

### Testing
- [ ] Add unit tests for core functionality
- [ ] Add integration tests
- [ ] Add E2E tests with Playwright/Cypress
- [ ] Set up CI/CD pipeline

### Monitoring
- [ ] Add error tracking (Sentry)
- [ ] Add analytics (privacy-friendly)
- [ ] Add performance monitoring
- [ ] Set up logging

## 📱 Mobile App (Future)

- [ ] Research React Native vs Flutter
- [ ] Design mobile-first UI
- [ ] Implement offline deck building
- [ ] Add camera scan for physical cards
- [ ] Push notifications for updates

## 🌐 Hosting & Infrastructure

### Current Setup
- Self-hosted at home (Proxmox)
- Gitea for version control
- Nginx for web server

### Recommended Production Hosting
See `HOSTING_RECOMMENDATIONS.md` for details

## 📝 Documentation

- [ ] Write user guide
- [ ] Create video tutorials
- [ ] Document API endpoints
- [ ] Write developer documentation
- [ ] Create FAQ page

## 🐛 Known Issues

- [ ] None currently! 🎉

## 💡 Ideas for Future

- [ ] AI deck builder assistant
- [ ] Card price tracking
- [ ] Trade/marketplace integration
- [ ] Deck builder mobile app
- [ ] Browser extension
- [ ] Discord bot integration
- [ ] Twitch integration for streamers

---

## Priority Order

1. **🔴 Critical** - Riot API production key & hosting
2. **🟠 High** - RSO authentication integration
3. **🟡 Medium** - MTG code removal & cleanup
4. **🟢 Low** - UI improvements & new features

## Notes

- Domain: `zauniteworkshop.com`
- Riot API requires `/riot.txt` verification file
- Production API key needed for public deployment
- RSO will be primary authentication method
