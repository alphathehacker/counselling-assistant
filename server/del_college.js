import http from 'http';

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/user/bookmarks',
  method: 'POST',
}, res => {
  console.log(`STATUS: ${res.statusCode}`);
});

req.on('error', console.error);
req.end();
