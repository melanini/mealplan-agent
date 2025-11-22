const axios = require('axios');

const AGENT_URL = 'http://localhost:4000';
const USER_PROFILE_URL = 'http://localhost:3000';
const RECIPE_URL = 'http://localhost:3001';
const SHOPPING_URL = 'http://localhost:3002';

async function testFlow() {
  console.log('🧪 Testing Mealprep Agent Flow\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Check services are running
    console.log('\n📡 Step 1: Checking services...\n');
    
    const services = [
      { name: 'User Profile Tool', url: USER_PROFILE_URL },
      { name: 'Recipe Tool', url: RECIPE_URL },
      { name: 'Shopping Tool', url: SHOPPING_URL },
      { name: 'Agent', url: AGENT_URL }
    ];

    for (const service of services) {
      try {
        await axios.get(`${service.url}/`, { timeout: 2000 });
        console.log(`✅ ${service.name} is running (${service.url})`);
      } catch (err) {
        console.log(`❌ ${service.name} is NOT running (${service.url})`);
        console.log(`   Please start: node tools/${service.name.toLowerCase().replace(' tool', 'Tool')}/index.js\n`);
        return;
      }
    }

    // Step 2: Get user profile
    console.log('\n👤 Step 2: Fetching user profile...\n');
    const profileResponse = await axios.get(`${USER_PROFILE_URL}/profile/melani-123`);
    console.log('Profile:', JSON.stringify(profileResponse.data, null, 2));

    // Step 3: Generate meal plan
    console.log('\n📅 Step 3: Generating weekly meal plan...\n');
    const planRequest = {
      userId: 'melani-123',
      weekStart: new Date().toISOString().split('T')[0]
    };
    
    console.log('Request:', JSON.stringify(planRequest, null, 2));
    
    const startTime = Date.now();
    const planResponse = await axios.post(`${AGENT_URL}/plan/generate`, planRequest);
    const duration = Date.now() - startTime;
    
    console.log(`\n✅ Plan generated in ${duration}ms`);
    console.log('Plan ID:', planResponse.data.planId);
    console.log('\nWeek Plan:');
    
    planResponse.data.plan.weekPlan.forEach(day => {
      console.log(`  ${day.day}: ${day.dinner.title} (${day.dinner.cookTimeMins} min)`);
    });

    console.log(`\nShopping List: ${planResponse.data.plan.shoppingList.length} items`);
    console.log('First 5 items:');
    planResponse.data.plan.shoppingList.slice(0, 5).forEach(item => {
      console.log(`  - ${item.name}: ${item.qtySuggested}`);
    });

    // Step 4: Submit feedback
    console.log('\n💬 Step 4: Testing feedback submission...\n');
    const firstRecipeId = planResponse.data.plan.weekPlan[0].dinner.id;
    const feedbackRequest = {
      accepted: false,
      rejectionReason: 'I prefer meals that take less than 15 minutes on Mondays',
      comment: 'Too time-consuming for a weekday'
    };

    const feedbackResponse = await axios.post(
      `${AGENT_URL}/plan/${planResponse.data.planId}/recipe/${firstRecipeId}/feedback`,
      feedbackRequest
    );

    console.log('✅ Feedback submitted');
    console.log('Feedback:', JSON.stringify(feedbackResponse.data.feedback, null, 2));

    // Step 5: Verify profile was updated
    console.log('\n🔄 Step 5: Verifying profile update...\n');
    const updatedProfileResponse = await axios.get(`${USER_PROFILE_URL}/profile/melani-123`);
    console.log('Updated preferences:', JSON.stringify(updatedProfileResponse.data.preferences, null, 2));

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed!\n');
    console.log('Summary:');
    console.log(`  - Generated plan: ${planResponse.data.planId}`);
    console.log(`  - Recipes selected: ${planResponse.data.plan.weekPlan.length}`);
    console.log(`  - Shopping items: ${planResponse.data.plan.shoppingList.length}`);
    console.log(`  - Feedback processed: 1`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status:', error.response.status);
    }
    process.exit(1);
  }
}

// Run the test
testFlow();

