# cookie-monster


cookie-monster/
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   ├── icons/
│   │   ├── icon-16.png
│   │   ├── icon-48.png
│   │   └── icon-128.png
│   └── lib/
│       └── api-client.js
├── dashboard/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── components/
│       ├── stats.js
│       └── site-list.js
├── shared/
│   └── constants.js
├── README.md
└── .gitignore



# prompts
-- 1
Task: Help implement a hackathon coding project.

You are a helpful coding assistant. 

Context:
- The project does not need to be complex (E.g. no auth or advanced features).

Suggest any improvements to the idea that make it more novel

'''
I want to create a browser extension that identifies cookies pop ups, and sends the info to a anthropic API endpoint to analyse them to translate into plain english or identify dark patterns. This will then be linked up to a web app dashboard, which aggregates the data for the user
'''

--2 
Can you set out the basic structure for the code repository for the extension? (no auth or extra features needed)