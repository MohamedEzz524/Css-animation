// Wishlist functionality
class Wishlist {
  constructor() {
    this.isCustomerLoggedIn = window.Shopify && window.Shopify.customer && window.Shopify.customer.id;
    this.customerId = this.isCustomerLoggedIn ? window.Shopify.customer.id : null;
    this.customerMetafieldKey = 'custom.wishlist';
    
    // Initialize wishlist based on customer status
    this.initializeWishlist();
    
    this.counter = document.getElementById("wishlist-counter");
    this.initButtons();
    this.setInitialStates();
    this.updateCounter();
    
    // Listen for customer login/logout events
    this.initCustomerEvents();
  }

  initializeWishlist() {
    if (this.isCustomerLoggedIn) {
      // Clear any previous customer's data from localStorage
      this.clearOtherCustomerData();
      
      // Get customer wishlist from metafield (passed from Liquid)
      const customerWishlistData = window.customerWishlistData || '[]';
      this.wishlist = JSON.parse(customerWishlistData);
      
      // If metafield is empty, check for customer-specific localStorage backup
      if (this.wishlist.length === 0) {
        const customerBackupKey = `wishlist_customer_${this.customerId}`;
        const backupWishlist = JSON.parse(localStorage.getItem(customerBackupKey)) || [];
        if (backupWishlist.length > 0) {
          this.wishlist = backupWishlist;
          // Save back to metafield
          this.saveCustomerWishlist();
        }
      }
      
      // Sync any guest wishlist items with customer wishlist
      this.syncGuestWishlist();
    } else {
      // Use localStorage for guest users with device-specific key
      const guestKey = this.getGuestWishlistKey();
      this.wishlist = JSON.parse(localStorage.getItem(guestKey)) || [];
    }
  }

  // Clear localStorage data from other customers to prevent cross-contamination
  clearOtherCustomerData() {
    const keysToRemove = [];
    
    // Find all customer-specific wishlist keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('wishlist_customer_') && key !== `wishlist_customer_${this.customerId}`) {
        keysToRemove.push(key);
      }
    }
    
    // Remove other customers' data
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Generate a unique key for guest wishlist to avoid conflicts
  getGuestWishlistKey() {
    // Use a combination of browser fingerprint elements for guest identification
    const browserFingerprint = this.generateBrowserFingerprint();
    return `wishlist_guest_${browserFingerprint}`;
  }

  // Generate a simple browser fingerprint for guest users
  generateBrowserFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Browser fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  syncGuestWishlist() {
    // Check for both old generic key and new guest-specific key
    const oldGuestWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    const guestKey = this.getGuestWishlistKey();
    const newGuestWishlist = JSON.parse(localStorage.getItem(guestKey)) || [];
    
    // Combine both guest wishlists
    const allGuestItems = [...new Set([...oldGuestWishlist, ...newGuestWishlist])];
    
    if (allGuestItems.length > 0) {
      // Merge guest wishlist with customer wishlist (avoid duplicates)
      const mergedWishlist = [...new Set([...this.wishlist, ...allGuestItems])];
      
      if (mergedWishlist.length !== this.wishlist.length) {
        this.wishlist = mergedWishlist;
        this.saveCustomerWishlist();
      }
      
      // Clear both guest wishlists after sync
      localStorage.removeItem("wishlist");
      localStorage.removeItem(guestKey);
    }
  }

  saveWishlist() {
    if (this.isCustomerLoggedIn) {
      this.saveCustomerWishlist();
    } else {
      // Save to guest-specific localStorage key
      const guestKey = this.getGuestWishlistKey();
      localStorage.setItem(guestKey, JSON.stringify(this.wishlist));
      
      // Also clear any old generic wishlist key
      localStorage.removeItem("wishlist");
    }
  }

  saveCustomerWishlist() {
    // Save to customer metafield
    const wishlistData = JSON.stringify(this.wishlist);
    
    // Use the global metafield update function if available
    if (window.updateCustomerMetafield) {
      window.updateCustomerMetafield('custom', 'wishlist', wishlistData)
        .catch(error => {
          console.error('Error saving wishlist to customer metafield:', error);
          // Fallback to customer-specific localStorage if customer save fails
          const fallbackKey = `wishlist_customer_${this.customerId}`;
          localStorage.setItem(fallbackKey, JSON.stringify(this.wishlist));
        });
    } else {
      // Fallback method using direct form submission
      this.updateCustomerMetafieldDirect(wishlistData);
    }
  }

  updateCustomerMetafieldDirect(wishlistData) {
    // Create a hidden form to update customer metafield
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/account';
    form.style.display = 'none';
    
    // Add CSRF token
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'authenticity_token';
    tokenInput.value = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    
    // Add metafield data
    const metafieldInput = document.createElement('input');
    metafieldInput.type = 'hidden';
    metafieldInput.name = 'customer[metafields][custom][wishlist]';
    metafieldInput.value = wishlistData;
    
    form.appendChild(tokenInput);
    form.appendChild(metafieldInput);
    document.body.appendChild(form);
    
    // Submit form via fetch to avoid page reload
    const formData = new FormData(form);
    
    fetch('/account', {
      method: 'POST',
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    }).then(response => {
      if (!response.ok) {
        throw new Error('Failed to update customer metafield');
      }
          }).catch(error => {
        console.error('Error updating customer metafield:', error);
        // Fallback to customer-specific localStorage if customer save fails
        const fallbackKey = `wishlist_customer_${this.customerId}`;
        localStorage.setItem(fallbackKey, JSON.stringify(this.wishlist));
      }).finally(() => {
      document.body.removeChild(form);
    });
  }

  initCustomerEvents() {
    // Listen for customer login/logout events
    document.addEventListener('customer:login', () => {
      location.reload(); // Reload to reinitialize with customer data
    });
    
    document.addEventListener('customer:logout', () => {
      // Clear customer-specific data
      if (this.customerId) {
        const customerFallbackKey = `wishlist_customer_${this.customerId}`;
        localStorage.removeItem(customerFallbackKey);
      }
      
      this.isCustomerLoggedIn = false;
      this.customerId = null;
      
      // Reset to guest wishlist for this browser/session
      const guestKey = this.getGuestWishlistKey();
      this.wishlist = JSON.parse(localStorage.getItem(guestKey)) || [];
      this.updateCounter();
      
      // Clear any old generic wishlist
      localStorage.removeItem("wishlist");
    });
  }

  // Add this new method
  setInitialStates() {
    document.querySelectorAll("[data-wishlist-toggle]").forEach((button) => {
      const productHandle = button.dataset.productHandle;
      if (this.isInWishlist(productHandle)) {
        button.classList.add("in-wishlist", "browse");
        button.setAttribute("aria-label", "Browse to wishlist");
      }
    });
  }

  updateCounter() {
    this.counter.textContent = this.wishlist.length || 0;
  }

  initButtons() {
    document.addEventListener("click", (e) => {
      const button = e.target.closest("[data-wishlist-toggle]");
      if (button) {
        e.preventDefault();
        const productHandle = button.dataset.productHandle;
        this.toggleProduct(productHandle, button);
      }
    });
  }

  toggleProduct(handle, button) {
    const index = this.wishlist.indexOf(handle);

    if (index > -1) {
      // Remove/Browse
      if (button.classList.contains("remove")) {
        this.wishlist.splice(index, 1);
        button.classList.remove("in-wishlist");
        button.setAttribute("aria-label", "Add to wishlist");
      } else {
        window.location = "/pages/wishlist";
      }
    } else {
      // Add to wishlist
      this.wishlist.push(handle);
      button.classList.add("in-wishlist", "browse");
      button.setAttribute("aria-label", "Browse to wishlist");
    }

    this.updateCounter();
    this.saveWishlist();

    // Dispatch a custom event
    document.dispatchEvent(
      new CustomEvent("wishlist:updated", {
        detail: {
          handle: handle,
          action: index > -1 ? "removed" : "added",
          isCustomer: this.isCustomerLoggedIn
        },
      })
    );
  }

  isInWishlist(handle) {
    return this.wishlist.includes(handle);
  }

  // Method to manually sync wishlist (useful for testing)
  syncWishlist() {
    if (this.isCustomerLoggedIn) {
      this.saveCustomerWishlist();
    }
  }
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize global instances
  window.wishlist = new Wishlist();
});