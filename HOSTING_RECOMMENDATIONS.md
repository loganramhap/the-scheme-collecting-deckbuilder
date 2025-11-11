# Hosting Recommendations for Zaunite Workshop

## 🎯 Best Options for Your Use Case

### Option 1: Vercel (Recommended) ⭐
**Best for: Frontend + Serverless**

**Pros:**
- ✅ **Free tier** - Generous limits for hobby projects
- ✅ **Zero config** - Deploy from GitHub in minutes
- ✅ **Automatic HTTPS** - SSL certificates included
- ✅ **Global CDN** - Fast worldwide
- ✅ **Easy custom domain** - `zauniteworkshop.com` setup is simple
- ✅ **Serverless functions** - Can handle API proxy if needed
- ✅ **Preview deployments** - Every PR gets a preview URL
- ✅ **Excellent DX** - Best developer experience

**Cons:**
- ⚠️ Need separate hosting for Gitea (backend)
- ⚠️ Serverless functions have execution time limits

**Cost:** 
- Free for hobby projects
- Pro: $20/month (if you need more)

**Setup Steps:**
1. Push code to GitHub
2. Connect Vercel to GitHub repo
3. Add `zauniteworkshop.com` domain
4. Add environment variables (Riot API key)
5. Deploy! ✨

**Perfect for:** Your Riftbound deck builder frontend

---

### Option 2: Netlify
**Best for: Static sites + Serverless**

**Pros:**
- ✅ Free tier with good limits
- ✅ Easy deployment from Git
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless functions
- ✅ Form handling built-in

**Cons:**
- ⚠️ Slightly less generous than Vercel
- ⚠️ Need separate Gitea hosting

**Cost:**
- Free for personal projects
- Pro: $19/month

**Similar to Vercel, great alternative**

---

### Option 3: Railway (Recommended for Full Stack) ⭐
**Best for: Frontend + Backend + Database**

**Pros:**
- ✅ **Can host everything** - Frontend, Gitea, Database
- ✅ **$5/month free credit** - Good for small projects
- ✅ **Docker support** - Easy to deploy your Proxmox setup
- ✅ **Automatic HTTPS**
- ✅ **Database included** - PostgreSQL, MySQL, etc.
- ✅ **Simple pricing** - Pay for what you use
- ✅ **Great for monorepos**

**Cons:**
- ⚠️ Not free (but very affordable)
- ⚠️ Less mature than Vercel/Netlify

**Cost:**
- $5/month free credit
- ~$10-20/month for small app
- Pay per usage after free credit

**Perfect for:** Hosting your entire stack (webapp + Gitea + DB)

---

### Option 4: DigitalOcean App Platform
**Best for: Full control + Managed**

**Pros:**
- ✅ Can host full stack
- ✅ Managed platform (less DevOps)
- ✅ Good documentation
- ✅ Predictable pricing
- ✅ Can scale easily

**Cons:**
- ⚠️ More expensive than Railway
- ⚠️ Minimum $5/month per service

**Cost:**
- Basic: $5/month per service
- ~$15-25/month for full stack

---

### Option 5: Cloudflare Pages + Workers
**Best for: Global performance**

**Pros:**
- ✅ **Generous free tier**
- ✅ **Best global performance** - Cloudflare's network
- ✅ **Automatic HTTPS**
- ✅ **Workers for serverless** - Can proxy Riot API
- ✅ **R2 storage** - Cheap object storage
- ✅ **Great DDoS protection**

**Cons:**
- ⚠️ Need separate Gitea hosting
- ⚠️ Workers have learning curve

**Cost:**
- Free tier is very generous
- Workers: $5/month for unlimited requests

---

## 🏆 My Recommendation

### For Your Situation:

**Frontend (Deck Builder):** Vercel
- Deploy your React app to Vercel
- Free tier is perfect
- Easy custom domain setup
- Automatic deployments from Git

**Backend (Gitea):** Railway or Keep Self-Hosted
- **Option A:** Move Gitea to Railway (~$10/month)
- **Option B:** Keep Gitea at home, use Cloudflare Tunnel (free)

**Total Cost:** $0-10/month

---

## 📋 Recommended Setup

### Architecture:

```
zauniteworkshop.com (Vercel)
├── Frontend (React app)
├── Riot API calls (client-side with CORS)
└── /riot.txt (static file for verification)

git.zauniteworkshop.com (Railway or Self-hosted)
└── Gitea (version control + deck storage)
```

### Why This Works:

1. **Vercel handles frontend** - Fast, free, reliable
2. **Gitea stays separate** - Can be self-hosted or on Railway
3. **Riot API calls** - Direct from browser (no proxy needed)
4. **Simple architecture** - Easy to maintain

---

## 🚀 Quick Start: Deploy to Vercel

### Step 1: Prepare Your Repo
```bash
# Make sure your code is in GitHub
git push origin main
```

### Step 2: Create riot.txt
```bash
# In your webapp public folder
echo "your-riot-api-key-here" > deckbuilder-webapp/public/riot.txt
```

### Step 3: Deploy to Vercel
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository
5. Configure:
   - Framework: Vite
   - Root Directory: `deckbuilder-webapp`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add Environment Variables:
   - `VITE_RIOT_API_KEY` = your key
   - `VITE_GITEA_URL` = your Gitea URL
7. Deploy!

### Step 4: Add Custom Domain
1. In Vercel project settings
2. Go to "Domains"
3. Add `zauniteworkshop.com`
4. Update DNS records as instructed
5. Wait for SSL certificate (automatic)

### Step 5: Verify with Riot
1. Visit `zauniteworkshop.com/riot.txt`
2. Should show your API key
3. Submit to Riot for production key approval

---

## 💰 Cost Comparison

| Option | Frontend | Backend | Total/Month |
|--------|----------|---------|-------------|
| **Vercel + Self-hosted Gitea** | Free | $0 | **$0** ⭐ |
| **Vercel + Railway** | Free | $10 | **$10** |
| **Railway (Full Stack)** | $10 | $10 | **$20** |
| **DigitalOcean** | $5 | $15 | **$20** |
| **Netlify + Railway** | Free | $10 | **$10** |

---

## 🔒 Security Considerations

### Riot API Key
- **Never expose in frontend code**
- Store in environment variables
- Consider API proxy if needed
- Rotate keys regularly

### Gitea
- Use strong passwords
- Enable 2FA
- Keep updated
- Use HTTPS only
- Consider private network if self-hosted

### Domain
- Enable DNSSEC
- Use Cloudflare for DDoS protection
- Set up CAA records
- Monitor for unauthorized changes

---

## 📝 Next Steps

1. **Choose hosting** - I recommend Vercel for frontend
2. **Set up domain** - Point `zauniteworkshop.com` to Vercel
3. **Create riot.txt** - Add to `public/` folder
4. **Deploy** - Push to GitHub, connect to Vercel
5. **Apply for production API key** - Submit to Riot
6. **Test** - Verify everything works
7. **Launch!** 🚀

---

## 🆘 Need Help?

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Riot API: https://developer.riotgames.com/
- Cloudflare: https://developers.cloudflare.com/

Let me know if you need help with any of these steps!
