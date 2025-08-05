// Wishlist functionality
class Wishlist {
  constructor() {
    this.isCustomerLoggedIn = window.Shopify && window.Shopify.customer && window.Shopify.customer.id;
    this.customerId = this.isCustomerLoggedIn ? window.Shopify.customer.id : null;
    this.customerMetafieldKey = 'custom.wishlist_products';
    
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
      // Get customer wishlist from metafield (passed from Liquid)
      const customerWishlistData = window.customerWishlistData || '[]';
      this.wishlist = JSON.parse(customerWishlistData);
      
      // Sync any guest wishlist items with customer wishlist
      this.syncGuestWishlist();
    } else {
      // Use localStorage for guest users
      this.wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    }
  }

  syncGuestWishlist() {
    const guestWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    
    if (guestWishlist.length > 0) {
      // Merge guest wishlist with customer wishlist (avoid duplicates)
      const mergedWishlist = [...new Set([...this.wishlist, ...guestWishlist])];
      
      if (mergedWishlist.length !== this.wishlist.length) {
        this.wishlist = mergedWishlist;
        this.saveCustomerWishlist();
      }
      
      // Clear guest wishlist after sync
      localStorage.removeItem("wishlist");
    }
  }

  saveWishlist() {
    if (this.isCustomerLoggedIn) {
      this.saveCustomerWishlist();
    } else {
      localStorage.setItem("wishlist", JSON.stringify(this.wishlist));
    }
  }

  saveCustomerWishlist() {
    // Save to customer metafield
    const wishlistData = JSON.stringify(this.wishlist);
    
    // Use the global metafield update function if available
    if (window.updateCustomerMetafield) {
      window.updateCustomerMetafield('custom', 'wishlist_products', wishlistData)
        .catch(error => {
          console.error('Error saving wishlist to customer metafield:', error);
          // Fallback to localStorage if customer save fails
          localStorage.setItem("wishlist", JSON.stringify(this.wishlist));
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
    metafieldInput.name = 'customer[metafields][custom][wishlist_products]';
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
      // Fallback to localStorage if customer save fails
      localStorage.setItem("wishlist", JSON.stringify(this.wishlist));
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
      this.isCustomerLoggedIn = false;
      this.customerId = null;
      this.wishlist = []; // Clear wishlist on logout
      this.updateCounter();
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