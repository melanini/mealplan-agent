#!/usr/bin/env node
/**
 * Test MCP Server Tools
 * Simple test script to verify MCP tools are working
 */

const { spawn } = require('child_process');
const path = require('path');

// Test cases
const TEST_CASES = [
  {
    name: 'List Tools',
    request: {
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1
    }
  },
  {
    name: 'Waste Reduction Tool',
    request: {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'waste_reduction',
        arguments: {
          recipes: [
            {
              id: 'r_001',
              title: 'Chickpea Curry',
              ingredients: [
                { name: 'chickpeas', qty: '1 can' },
                { name: 'tomato', qty: '2' }
              ]
            },
            {
              id: 'r_002',
              title: 'Tomato Pasta',
              ingredients: [
                { name: 'pasta', qty: '200g' },
                { name: 'tomato', qty: '3' }
              ]
            }
          ],
          userProfile: {
            intolerances: ['gluten'],
            dislikes: ['cilantro']
          }
        }
      },
      id: 2
    }
  },
  {
    name: 'Balanced Diet Tool',
    request: {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'balanced_diet',
        arguments: {
          weeklyPlan: [
            {
              day: 'monday',
              mealType: 'lunch',
              recipe: {
                id: 'r_001',
                title: 'Chickpea Curry',
                tags: ['vegan', 'protein-rich']
              }
            }
          ],
          recipesPool: [
            { id: 'r_001', title: 'Chickpea Curry', tags: ['vegan', 'protein-rich'] },
            { id: 'r_002', title: 'Lentil Stew', tags: ['vegan', 'protein-rich'] }
          ],
          userProfile: {
            preferredMacros: {
              protein: 0.30,
              carbs: 0.45,
              fat: 0.25
            }
          },
          history: []
        }
      },
      id: 3
    }
  }
];

async function runTest(testCase) {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, 'mcp_server.js');
    const mcpProcess = spawn('node', [serverPath]);
    
    let stdout = '';
    let stderr = '';
    
    mcpProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    mcpProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    mcpProcess.on('close', (code) => {
      try {
        const response = JSON.parse(stdout);
        resolve({
          success: true,
          response,
          stderr
        });
      } catch (error) {
        resolve({
          success: false,
          error: error.message,
          stdout,
          stderr
        });
      }
    });
    
    mcpProcess.on('error', (error) => {
      reject(error);
    });
    
    // Send request
    mcpProcess.stdin.write(JSON.stringify(testCase.request) + '\n');
    mcpProcess.stdin.end();
    
    // Timeout after 10 seconds
    setTimeout(() => {
      mcpProcess.kill();
      reject(new Error('Test timeout'));
    }, 10000);
  });
}

async function runAllTests() {
  console.log('🧪 Testing MCP Server\n');
  console.log('='.repeat(70));
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of TEST_CASES) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log('-'.repeat(70));
    
    try {
      const startTime = Date.now();
      const result = await runTest(testCase);
      const duration = Date.now() - startTime;
      
      if (result.success) {
        console.log(`✅ PASSED (${duration}ms)`);
        console.log('Response:', JSON.stringify(result.response, null, 2).substring(0, 200) + '...');
        passed++;
      } else {
        console.log(`❌ FAILED (${duration}ms)`);
        console.log('Error:', result.error);
        console.log('Stdout:', result.stdout.substring(0, 200));
        console.log('Stderr:', result.stderr.substring(0, 200));
        failed++;
      }
    } catch (error) {
      console.log('❌ FAILED');
      console.log('Error:', error.message);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. This may be because:');
    console.log('  1. MCP SDK is not installed (run: npm install)');
    console.log('  2. Backend services are not running');
    console.log('  3. Python agents are not configured');
    console.log('\nNote: This is expected for a skeleton implementation.');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
console.log('Starting MCP Server Tests...\n');
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

