require('dotenv').config();

async function test() {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [
          { role: 'user', content: 'Say hello in plain language.' }
        ]
      })
    });
    const data = await response.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}

test();