# Customer Wishlist Implementation Guide

This guide explains how to implement a customer-aware wishlist system that works for both guest users (localStorage) and logged-in customers (metafields).

## Features

- **Guest Users**: Wishlist stored in localStorage (device-specific)
- **Logged-in Customers**: Wishlist stored in customer metafields (synced across devices)
- **Seamless Sync**: Guest wishlist automatically merges with customer wishlist on login
- **Multi-user Support**: Different customers on the same device see their own wishlists
- **Fallback Support**: Falls back to localStorage if metafield updates fail

## Prerequisites

1. **Customer Metafield Setup**: Create a custom metafield in your Shopify admin:
   - Navigate to Settings > Metafields > Customers
   - Click "Add definition"
   - Namespace: `custom`
   - Key: `wishlist_products`
   - Name: `Wishlist Products`
   - Type: `Single line text`
   - Validation: JSON (optional)

## File Structure

```
├── wishlist.js                              # Main wishlist functionality
├── sections/
│   └── wishlist.liquid                      # Wishlist page section
├── snippets/
│   ├── wishlist-button.liquid               # Wishlist toggle button
│   ├── update-customer-metafield.liquid     # Metafield update helper
│   └── wishlist-customer-integration.liquid # Customer integration
└── locales/
    └── en.default.json                      # Translation strings
```

## Implementation Steps

### 1. Include Customer Integration

Add this to your `theme.liquid` file in the `<head>` section:

```liquid
{% render 'wishlist-customer-integration' %}
```

### 2. Include Wishlist JavaScript

Add this before the closing `</body>` tag in `theme.liquid`:

```liquid
<script src="{{ 'wishlist.js' | asset_url }}" defer></script>
```

### 3. Add Wishlist Buttons to Product Cards

In your product card templates, include:

```liquid
{% render 'wishlist-button', product: product %}
```

### 4. Create Wishlist Page

1. Create a new page template: `templates/page.wishlist.liquid`
2. Add the wishlist section:

```liquid
{% section 'wishlist' %}
```

3. Create a page in your Shopify admin with the handle `wishlist` and assign the `page.wishlist` template.

### 5. Add Wishlist Counter to Header

Update your header to include the wishlist counter (already provided in your header-wishlist button code).

## How It Works

### Guest Users
- Wishlist items stored in `localStorage` with key `"wishlist"`
- Data persists only on the current device/browser
- Shows guest notice with login prompt

### Logged-in Customers
- Wishlist items stored in customer metafield `custom.wishlist_products`
- Data syncs across all devices where customer logs in
- Shows customer name and sync confirmation

### Login/Logout Flow
1. **Before Login**: Guest wishlist stored in `sessionStorage`
2. **After Login**: Guest wishlist merges with customer wishlist
3. **On Logout**: Customer data cleared, reverts to guest mode

## API Reference

### Wishlist Class Methods

```javascript
// Check if product is in wishlist
window.wishlist.isInWishlist(productHandle)

// Add/remove product from wishlist
window.wishlist.toggleProduct(productHandle, buttonElement)

// Manually sync wishlist (for logged-in customers)
window.wishlist.syncWishlist()

// Get current wishlist array
window.wishlist.wishlist
```

### Custom Events

```javascript
// Listen for wishlist updates
document.addEventListener('wishlist:updated', (event) => {
  console.log(event.detail.handle);    // Product handle
  console.log(event.detail.action);    // 'added' or 'removed'
  console.log(event.detail.isCustomer); // true if logged-in customer
});

// Listen for customer login/logout
document.addEventListener('customer:login', () => {
  // Handle customer login
});

document.addEventListener('customer:logout', () => {
  // Handle customer logout
});
```

## Customization

### Styling
All CSS is included in the respective files. Key classes:
- `.wishlist-user-info` - Logged-in customer info
- `.wishlist-guest-info` - Guest user info
- `.wishlist-toggle` - Wishlist button
- `.wishlist-grid` - Product grid on wishlist page

### Translations
Update `locales/en.default.json` or your language files:

```json
{
  "general": {
    "wishlist": {
      "empty_wishlist": "Your wishlist is empty",
      "logged_in_as": "Logged in as",
      "wishlist_synced": "Your wishlist is synced across all your devices",
      "guest_wishlist_notice": "You're browsing as a guest. Your wishlist is saved locally on this device.",
      "login_to_sync": "Login to sync your wishlist across devices"
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Metafield Not Updating**
   - Ensure customer metafield is created in Shopify admin
   - Check browser console for errors
   - Verify CSRF token is available

2. **Wishlist Not Syncing After Login**
   - Check if customer integration snippet is included
   - Verify customer data is passed to JavaScript
   - Look for console errors during login process

3. **Guest Wishlist Not Working**
   - Ensure localStorage is enabled in browser
   - Check if wishlist.js is loaded properly
   - Verify button elements have correct data attributes

### Debug Mode

Enable debug logging by adding to your console:

```javascript
window.wishlist.debug = true;
```

## Browser Support

- Modern browsers with localStorage support
- ES6+ features used (arrow functions, const/let, template literals)
- Fetch API for AJAX requests

## Performance Considerations

- Wishlist data is lightweight (array of product handles)
- Metafield updates are debounced to prevent excessive API calls
- Guest wishlist uses efficient localStorage operations
- Product cards fetched on-demand for wishlist page

## Security

- Customer metafields are private to each customer
- CSRF tokens used for form submissions
- Input sanitization for product handles
- Fallback to localStorage if customer updates fail