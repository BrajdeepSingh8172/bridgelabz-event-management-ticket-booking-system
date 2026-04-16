// Direct test: upload a real image file via the event creation API
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Create a small but valid 10x10 red PNG
const { createCanvas } = (() => {
  try { return require('canvas'); } catch { return {}; }
})();

async function main() {
  // Generate a valid test image (write raw PNG bytes)
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A  // PNG signature
  ]);
  // Use a minimal valid PNG from base64
  const validPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAE0lEQVQYV2P4z8BQzwAEjFAGACgsBQFWBplNAAAAAElFTkSuQmCC',
    'base64'
  );
  
  const imgPath = path.join(__dirname, 'test_image.png');
  fs.writeFileSync(imgPath, validPng);
  console.log('📁 Test image written:', imgPath, '- Size:', validPng.length, 'bytes');

  // Create a JWT token for the admin user
  const token = jwt.sign(
    { id: '69d73ac780a3f9f1330fa9ee', role: 'admin' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  );

  // Build FormData exactly like the browser would
  const form = new FormData();
  form.append('title', 'IMAGE_TEST_DIRECT');
  form.append('description', 'Testing direct image upload');
  form.append('category', 'other');
  form.append('venue', 'Test Venue');
  form.append('city', 'TestCity');
  form.append('startDate', '2026-06-01T10:00');
  form.append('totalCapacity', '50');
  form.append('isFeatured', 'false');
  form.append('bannerImage', fs.createReadStream(imgPath), {
    filename: 'test_image.png',
    contentType: 'image/png',
  });

  console.log('\n📤 Sending FormData to http://localhost:5000/api/events ...');
  
  try {
    const res = await axios.post('http://localhost:5000/api/events', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('\n✅ Status:', res.status);
    console.log('📸 bannerImage:', res.data?.data?.bannerImage);
    console.log('📋 Event ID:', res.data?.data?._id);
    
    if (res.data?.data?.bannerImage) {
      console.log('\n🎉 IMAGE UPLOAD WORKS! The Cloudinary URL is saved.');
    } else {
      console.log('\n❌ Event created but bannerImage is null');
    }
  } catch (err) {
    console.error('\n❌ Error:', err.response?.data || err.message);
  } finally {
    fs.unlinkSync(imgPath);
  }
}

main();
