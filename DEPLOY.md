# 🚀 Deploying Pan to Vercel

## Quick Deploy Steps:

### 1. Run Deployment Command
```bash
vercel
```

### 2. Follow Prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No (first time)
- **Project name?** → pan (or whatever you want)
- **Directory?** → ./ (press Enter)
- **Override settings?** → No (press Enter)

### 3. Add Environment Variables

After deployment, go to:
**Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Redeploy
```bash
vercel --prod
```

---

## 🎉 That's It!

Your app will be live at: `https://your-project.vercel.app`

**Pan is LAUNCHED! 🚀✨**

