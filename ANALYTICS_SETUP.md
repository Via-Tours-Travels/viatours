# Vercel Web Analytics Setup

This project has been configured to use Vercel Web Analytics for privacy-friendly, real-time traffic insights.

## ✅ What Has Been Configured

1. **Package Installation**: `@vercel/analytics` (v1.3.1) has been installed via npm
2. **HTML Integration**: Analytics script has been added to `index.html` using ES module imports
3. **Configuration Files**: 
   - `package.json` created with analytics dependency
   - `vercel.json` created for Vercel deployment configuration
   - `package-lock.json` generated for dependency locking

## 📋 Required Steps to Enable Analytics

### 1. Enable Web Analytics in Vercel Dashboard

Before analytics will work, you need to enable it for your project in the Vercel dashboard:

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your project (viatours)
3. Click on "Analytics" in the left sidebar
4. Click the "Enable" button
5. Deploy your project to Vercel

### 2. Deploy to Vercel

Analytics only work in production when deployed to Vercel:

```bash
# Install Vercel CLI if you haven't already
npm install -g vercel

# Deploy your project
vercel deploy --prod
```

### 3. Verify Installation

After deployment:

1. Visit your live site
2. Open browser DevTools → Network tab
3. Look for requests to `/_vercel/insights/view`
4. Check your Vercel dashboard after a few hours for analytics data

## 🔍 How It Works

The analytics implementation uses the `inject()` function from `@vercel/analytics`:

```html
<script type="module">
  import { inject } from './node_modules/@vercel/analytics/dist/index.mjs';
  inject();
</script>
```

### Features:

- **Privacy-Friendly**: No cookies, respects user privacy
- **Automatic Page Views**: Tracks page navigation automatically  
- **Development Mode**: Doesn't track in development (logs to console instead)
- **Zero Configuration**: Works out of the box once enabled in dashboard

## 📊 What Gets Tracked

- **Page Views**: Automatically tracked on all pages
- **Unique Visitors**: Daily, weekly, and monthly metrics
- **Top Pages**: Most visited pages
- **Referrers**: Where your traffic comes from
- **Devices**: Desktop vs mobile breakdown

## 🛠️ Development

In development mode (localhost), analytics events are logged to the console instead of being sent to Vercel servers. This helps with debugging without polluting your analytics data.

## 📖 Additional Resources

- [Vercel Analytics Quickstart](https://vercel.com/docs/analytics/quickstart)
- [Vercel Analytics Package Documentation](https://vercel.com/docs/analytics/package)
- [Custom Events Guide](https://vercel.com/docs/analytics/custom-events)

## 🎯 Optional: Track Custom Events

If you want to track custom events (e.g., button clicks, form submissions), you can use the `track()` function:

```javascript
import { track } from '@vercel/analytics';

// Track a custom event
track('Button Clicked', { 
  button: 'Plan My Trip',
  location: 'Hero Section'
});
```

Add this import to your `script.js` file and call `track()` wherever you want to measure user interactions.

## ⚠️ Important Notes

1. **Analytics require Vercel hosting**: This package only works when deployed to Vercel
2. **No tracking in development**: Events are logged to console instead
3. **Data appears after deployment**: It may take a few hours for data to appear in dashboard
4. **Free tier limitations**: Check Vercel's pricing for analytics quotas

## 🔧 Troubleshooting

### Analytics not showing data?

1. Verify analytics is enabled in Vercel dashboard
2. Ensure you've deployed to production (`vercel --prod`)
3. Wait at least a few hours for data to appear
4. Check browser console for any error messages
5. Verify you're not blocking scripts with ad blocker

### Script loading errors?

If you see console errors about loading the analytics script:
- Check that node_modules is being served properly
- Consider using the CDN approach instead (see Vercel docs)
- Verify your deployment includes the @vercel/analytics package
