document.getElementById('clearDbBtn').addEventListener('click', async () => {
  const msgDiv = document.getElementById('message');
  msgDiv.textContent = '';
  msgDiv.className = 'message';
  if (!confirm('Are you sure you want to clear ALL cookie banner data from the backend database?')) return;
  try {
    const response = await fetch('http://localhost:3000/api/cookie-banners/clear', { method: 'DELETE' });
    const data = await response.json();
    if (data.success) {
      msgDiv.textContent = 'Database cleared successfully!';
      msgDiv.classList.add('success');
    } else {
      msgDiv.textContent = 'Failed to clear database.';
      msgDiv.classList.add('error');
    }
  } catch (err) {
    msgDiv.textContent = 'Error: ' + err.message;
    msgDiv.classList.add('error');
  }
}); 