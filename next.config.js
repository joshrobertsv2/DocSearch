const fs = require('fs');
const axios = require('axios');
const path = require('path');
const {createClient} = require('@supabase/supabase-js')
const { spawn } = require('child_process');
const cheerio = require('cheerio');
require('dotenv').config(); // Load environment variables
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const spaceKey = process.env.SPACE_KEY;
const baseUrl = process.env.BASE_URL;
const username = process.env.USERNAME_ATTLISSIAN;
const password = process.env.PASSWORD;


const getpageEndpoint = `${baseUrl}/content?type=page&spaceKey=${spaceKey}`;

const supabseStorage = createClient(supabaseUrl, supabaseKey);


async function downLoadPage() {
  try {
    const pages = await axios.get(getpageEndpoint, {
      auth: {
        username: username,
        password: password,
      },
    });

    const result = pages.data.results;
    const data = result.map((pageid) => pageid.id);
    for (let i=0;i<data.length;i++) {
      //const response = await axios.get(`${baseUrl}/content/${data[i]}`, {
        const response = await axios.get(`${baseUrl}/content/${data[i]}?expand=body.storage`, {
        auth: {
          username: username,
          password: password,
        },
      });



      const pageData = response.data;
      const pageContent = pageData.title;
      const pageBody = pageData.body.storage.value;

      const $ = cheerio.load(pageBody);

// Iterate through each h1 element and process it
let modifiedText = '';
$('h1').each((index, element) => {
  const text = $(element).text();
  if (text.startsWith('#')) {
    const newText = text.substring(2).replace(':', ''); // Remove the '# ' prefix and the colon
    const paragraph = $(element).next('p').text(); // Get the content of the following <p> element
    modifiedText += `# ${newText}:\n${paragraph}\n\n`;
  }
});


      const projectFolderPath = path.resolve('.');
      const docsFolderPath = path.join(projectFolderPath, 'pages/docs');
      fs.mkdirSync(docsFolderPath, { recursive: true });
      const fileName = `${pageContent}.mdx`;
      const absoluteFilePath = path.join(docsFolderPath, fileName);

      fs.writeFile(absoluteFilePath, modifiedText + '\n', 'utf8', (err) => {
        if (err) {
          console.error('Error writing file:', err);
        } else {
          console.log('Page content downloaded successfully.');
        }
      });

      
 // } 
  }
  } catch (error) {
    console.log(error)
  }

  const scriptName = 'embeddings'; // Replace this with your script's name
const pnpmCommand = 'pnpm'; // Or 'npm' if you're using npm

const child = spawn(pnpmCommand, ['run', scriptName], {
  stdio: 'inherit', // This will make sure that the child process outputs to the parent's console
  shell: true, // Use a shell to execute the command (required for Windows)
});

child.on('exit', (code) => {
  if (code === 0) {
    console.log(`Script '${scriptName}' executed successfully.`);
  } else {
    console.error(`Script '${scriptName}' execution failed with code ${code}.`);
  }
});



}

//downLoadPage();

const callApi = async () => {
  downLoadPage();
};

// Function to make API call every 24 hours
const scheduleApiCalls = () => {
  callApi(); // Call immediately on startup
  setInterval(callApi, 6 * 60 * 60 * 1000); // Repeat every 12 hours
};

// Start scheduling API calls
scheduleApiCalls();

module.exports = nextConfig
