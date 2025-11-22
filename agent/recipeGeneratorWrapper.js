/**
 * Recipe Generator with Web Search Wrapper
 * Node.js wrapper for Python recipe generator that uses Google Search
 */

const { spawn } = require('child_process');
const path = require('path');

/**
 * Call Python recipe generator with Google Search
 */
async function generateRecipeFromWeb(requirements) {
  const {
    diet = 'any',
    avoidIngredients = [],
    maxCookMins = 30,
    servings = 2,
    style = 'any cuisine'
  } = requirements;

  const input = {
    diet,
    avoidIngredients,
    maxCookMins,
    servings,
    style
  };

  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'recipe_generator_with_search.py');
    const pythonProcess = spawn('python3', [scriptPath]);
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Recipe generator exited with code ${code}: ${stderr}`));
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        
        if (result.error && !result.fallbackUsed) {
          reject(new Error(`Recipe generator error: ${result.error}`));
          return;
        }
        
        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse recipe: ${err.message}\nOutput: ${stdout}`));
      }
    });
    
    pythonProcess.on('error', (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
    
    // Send input
    pythonProcess.stdin.write(JSON.stringify(input));
    pythonProcess.stdin.end();
    
    // Timeout after 60 seconds (search can take time)
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Recipe generation timed out'));
    }, 60000);
  });
}

module.exports = {
  generateRecipeFromWeb
};

