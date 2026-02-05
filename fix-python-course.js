const fetch = require('node-fetch');

async function fixPythonCourse() {
  try {
    const res = await fetch('http://localhost:3000/api/courses');
    const courses = await res.json();
    
    const pythonCourse = courses.find(c => c.slug === 'python' || c.title.toLowerCase().includes('python'));
    
    if (!pythonCourse) {
      console.log('Python course not found');
      return;
    }
    
    console.log('Found Python course:', pythonCourse._id);
    console.log('Current values:', {
      title: pythonCourse.title,
      price: pythonCourse.price,
      originalPrice: pythonCourse.originalPrice,
      discount: pythonCourse.discount
    });
    
    // Update with discount
    const updateRes = await fetch('http://localhost:3000/api/courses/' + pythonCourse._id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...pythonCourse,
        originalPrice: 2000,
        discount: 50
      })
    });
    
    const updated = await updateRes.json();
    console.log('Updated successfully:', updated);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

fixPythonCourse();
