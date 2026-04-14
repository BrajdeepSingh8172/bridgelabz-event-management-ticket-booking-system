// Quick test: upload an image to the event creation endpoint
const http = require('http');
const fs = require('fs');
require('dotenv').config();
const jwt = require('jsonwebtoken');

// Create a tiny valid PNG
const testBuf = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVQYV2P8z8BQz0AEYBxVOHIUAgBGWAkFz0MN5QAAAABJRU5ErkJggg==',
  'base64'
);

// Generate a valid auth token
const token = jwt.sign(
  { id: '69d73ac780a3f9f1330fa9ee', role: 'organizer' },
  process.env.JWT_ACCESS_SECRET,
  { expiresIn: '1h' }
);

const boundary = '----FormBoundary7MA4YWxkTrZu0gW';

// Build multipart body
const parts = [];
const addField = (name, value) => {
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}`);
};
addField('title', 'IMG_UPLOAD_TEST');
addField('description', 'Testing image upload');
addField('category', 'other');
addField('venue', 'Test Venue');
addField('city', 'TestCity');
addField('startDate', '2026-05-01T10:00');
addField('totalCapacity', '100');

// Add file part
parts.push(
  `--${boundary}\r\nContent-Disposition: form-data; name="bannerImage"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`
);

const bodyStart = Buffer.from(parts.join('\r\n') + '\r\n');
const bodyEnd = Buffer.from(`\r\n--${boundary}--\r\n`);
const fullBody = Buffer.concat([bodyStart, testBuf, bodyEnd]);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/events',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': fullBody.length,
    'Authorization': `Bearer ${token}`,
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (d) => (data += d));
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const p = JSON.parse(data);
      console.log('bannerImage:', p.data?.bannerImage);
      console.log('message:', p.message);
      if (p.data?.bannerImage) {
        console.log('\n✅ IMAGE UPLOAD WORKS! URL:', p.data.bannerImage);
      } else {
        console.log('\n❌ bannerImage is null — upload failed');
        console.log('Full response:', JSON.stringify(p, null, 2).substring(0, 1000));
      }
    } catch (e) {
      console.log('Raw:', data.substring(0, 500));
    }
  });
});

req.write(fullBody);
req.end();
