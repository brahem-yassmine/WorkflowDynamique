fetch('http://localhost:5000/api/notifications', {
  headers: {
    'Authorization': 'Bearer test'
  }
}).then(res => res.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Fetch error:', err.message));
