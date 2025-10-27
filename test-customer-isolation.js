// Test script for customer wishlist isolation
// Run this in browser console to test multi-customer functionality

function testCustomerIsolation() {
  console.log('🧪 Testing Customer Wishlist Isolation');
  console.log('=====================================');
  
  // Check if wishlist instance exists
  if (!window.wishlist) {
    console.error('❌ Wishlist instance not found. Make sure wishlist.js is loaded.');
    return;
  }
  
  const wishlist = window.wishlist;
  
  // Test 1: Check customer status
  console.log('1. Customer Status:');
  console.log('   - Is Customer Logged In:', wishlist.isCustomerLoggedIn);
  console.log('   - Customer ID:', wishlist.customerId);
  
  // Test 2: Check storage keys
  console.log('\n2. Storage Keys:');
  if (wishlist.isCustomerLoggedIn) {
    console.log('   - Using customer metafield storage');
    console.log('   - Customer backup key: wishlist_customer_' + wishlist.customerId);
  } else {
    const guestKey = wishlist.getGuestWishlistKey();
    console.log('   - Using guest storage with key:', guestKey);
  }
  
  // Test 3: Current wishlist
  console.log('\n3. Current Wishlist:');
  console.log('   - Items:', wishlist.wishlist);
  console.log('   - Count:', wishlist.wishlist.length);
  
  // Test 4: Check localStorage contents
  console.log('\n4. LocalStorage Analysis:');
  const wishlistKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('wishlist')) {
      wishlistKeys.push({
        key: key,
        value: localStorage.getItem(key)
      });
    }
  }
  console.log('   - Wishlist-related keys found:', wishlistKeys.length);
  wishlistKeys.forEach(item => {
    console.log(`   - ${item.key}: ${item.value}`);
  });
  
  // Test 5: Browser fingerprint (for guests)
  if (!wishlist.isCustomerLoggedIn) {
    console.log('\n5. Browser Fingerprint:');
    const fingerprint = wishlist.generateBrowserFingerprint();
    console.log('   - Generated fingerprint:', fingerprint);
  }
  
  console.log('\n✅ Test completed. Check the results above.');
  
  // Instructions for multi-customer testing
  if (wishlist.isCustomerLoggedIn) {
    console.log('\n📋 To test multi-customer isolation:');
    console.log('1. Add some items to wishlist');
    console.log('2. Note the customer ID and wishlist contents');
    console.log('3. Logout and login with different customer account');
    console.log('4. Run this test again - wishlist should be different/empty');
    console.log('5. Previous customer data should be cleared from localStorage');
  } else {
    console.log('\n📋 To test customer vs guest isolation:');
    console.log('1. Add some items to wishlist as guest');
    console.log('2. Note the guest key and wishlist contents');
    console.log('3. Login with customer account');
    console.log('4. Guest items should merge with customer wishlist');
    console.log('5. Logout and guest wishlist should be separate again');
  }
}

// Helper function to simulate adding items for testing
function addTestItem(handle) {
  if (!window.wishlist) {
    console.error('❌ Wishlist instance not found.');
    return;
  }
  
  handle = handle || 'test-product-' + Date.now();
  console.log('🔧 Adding test item:', handle);
  
  // Simulate button click
  const mockButton = document.createElement('button');
  mockButton.dataset.productHandle = handle;
  
  window.wishlist.toggleProduct(handle, mockButton);
  console.log('✅ Test item added. Current wishlist:', window.wishlist.wishlist);
}

// Helper function to clear all wishlist data (for testing)
function clearAllWishlistData() {
  console.log('🧹 Clearing all wishlist data...');
  
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('wishlist')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log('   - Removed:', key);
  });
  
  if (window.wishlist) {
    window.wishlist.wishlist = [];
    window.wishlist.updateCounter();
  }
  
  console.log('✅ All wishlist data cleared.');
}

// Export functions for console use
window.testCustomerIsolation = testCustomerIsolation;
window.addTestItem = addTestItem;
window.clearAllWishlistData = clearAllWishlistData;

console.log('🔧 Wishlist testing functions loaded:');
console.log('   - testCustomerIsolation() - Run full isolation test');
console.log('   - addTestItem(handle) - Add test item to wishlist');
console.log('   - clearAllWishlistData() - Clear all wishlist data');