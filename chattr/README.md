# Chattr Test Social Media Site

A purposely bad-privacy, dark-patterned fake social media site for testing the Cookie Popup Analyzer extension and privacy analysis tools.

## Features
- **Modern social media look**: Feed, profile, trending posts
- **Aggressive cookie banner**: Accept All is prominent, Reject is hidden in settings
- **Manipulative modal**: All non-essential cookies pre-checked, reject is subtle
- **Privacy Policy**: Excessive data collection, indefinite retention, vague language, sharing with 50+ partners, unclear opt-out
- **Great for testing**: Dark patterns, privacy risk detection, and banner analysis

## Files
- `index.html` — Main site with feed and cookie banner
- `privacy-policy.html` — Bad privacy policy
- `styles.css` — Modern, social media-inspired CSS
- `script.js` — Cookie banner/modal logic

## How to Use
1. **Serve the site**
   ```sh
   cd chattr
   python3 -m http.server 8081
   ```
   Then visit [http://localhost:8081](http://localhost:8081)
2. **Test with your extension**
   - The banner should be detected as a dark pattern
   - The privacy policy should trigger high privacy risk
   - Try to reject cookies and see how hard it is!

## What to Look For
- Does your extension flag the manipulative banner?
- Does it extract the privacy policy link?
- Does the privacy policy analysis show high risk, many partners, and poor user rights?

---

**Chattr** is not a real service. It is for privacy/dark pattern testing only. 