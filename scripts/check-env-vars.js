/**
 * Quick script to check if environment variables are set correctly
 * Run: node scripts/check-env-vars.js
 */

const requiredVars = [
  'NEXT_PUBLIC_SHOPKEEPER_CORE_API_URL',
  'NEXT_PUBLIC_SHOPKEEPER_INVENTORY_BILLING_API_URL',
  'NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_API_URL'
];

console.log('=== Environment Variables Check ===\n');

let allSet = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allSet = false;
  }
});

console.log('\n=== Summary ===');
if (allSet) {
  console.log('✅ All required environment variables are set!');
  console.log('⚠️  Remember: Restart Next.js server after setting env vars.');
} else {
  console.log('❌ Some environment variables are missing!');
  console.log('\nAdd them to .env.development.local:');
  console.log('NEXT_PUBLIC_SHOPKEEPER_CORE_API_URL=https://qzzjg3i8me.execute-api.ap-south-1.amazonaws.com/dev');
  console.log('NEXT_PUBLIC_SHOPKEEPER_INVENTORY_BILLING_API_URL=https://f8l11138vd.execute-api.ap-south-1.amazonaws.com/dev');
  console.log('NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_API_URL=https://znbn5ri9f1.execute-api.ap-south-1.amazonaws.com/dev');
  console.log('\nThen restart: npm run dev');
}
