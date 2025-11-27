import axios from 'axios';

const apiKey = 'AIzaSyBNlwV6S5qgBYAPpadz9xrV96aICW8yrKM';
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

async function test() {
    try {
        const response = await axios.post(apiUrl, {
            contents: [{
                parts: [{
                    text: 'Say hello in 3 words'
                }]
            }]
        });

        const responseText = response.data.candidates[0].content.parts[0].text;
        console.log('✅ SUCCESS! AI Response:', responseText);
        console.log('\n🎉 The API is working perfectly!');
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        console.log('\n⚠️ API key still has issues');
    }
}

test();
