import axios from 'axios';

async function testAPI() {
  console.log('\n=== 🔍 API RESPONSE TEST ===\n');
  
  try {
    console.log('Testing /api/blog/azim-premji...\n');
    const response = await axios.get('http://localhost:9002/api/blog/azim-premji', {
      timeout: 10000,
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('\nResponse Data:');
    console.log(JSON.stringify(response.data, null, 2).substring(0, 1000));
    
    console.log('\n\nDetailed Field Check:');
    const blog = response.data;
    console.log('- title:', blog?.title ? '✅ EXISTS' : '❌ MISSING');
    console.log('- htmlContent type:', typeof blog?.htmlContent);
    console.log('- htmlContent exists:', !!blog?.htmlContent);
    console.log('- htmlContent length:', blog?.htmlContent?.length || 0);
    if (blog?.htmlContent) {
      console.log('- htmlContent preview:', blog.htmlContent.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
  
  process.exit(0);
}

testAPI();
