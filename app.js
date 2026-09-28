/**
 * Aura Luxe - Main Application JavaScript Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let cart = JSON.parse(localStorage.getItem('auraluxe_cart')) || [];
  let wishlist = JSON.parse(localStorage.getItem('auraluxe_wishlist')) || [];
  let appliedDiscount = 0; // e.g., 0.20 for 20%
  let activeCategory = 'all';
  let maxPrice = 700;
  let sortMode = 'popular';
  let searchQuery = '';
  let activeQuickViewId = null;

  // --- DOM ELEMENTS ---
  const productsGrid = document.getElementById('products-grid');
  const resultsCount = document.getElementById('results-count');
  const categoryPills = document.getElementById('category-pills');
  const priceRange = document.getElementById('price-range');
  const priceVal = document.getElementById('price-val');
  const sortSelect = document.getElementById('sort-select');
  const globalSearch = document.getElementById('global-search');
  const searchDropdown = document.getElementById('search-dropdown');
  const themeToggle = document.getElementById('theme-toggle');

  // Cart & Wishlist Elements
  const cartTrigger = document.getElementById('cart-trigger');
  const wishlistTrigger = document.getElementById('wishlist-trigger');
  const cartDrawer = document.getElementById('cart-drawer');
  const wishlistDrawer = document.getElementById('wishlist-drawer');
  const closeCartBtn = document.getElementById('close-cart-btn');
  const closeWishlistBtn = document.getElementById('close-wishlist-btn');
  const cartBody = document.getElementById('cart-body');
  const wishlistBody = document.getElementById('wishlist-body');
  const cartCount = document.getElementById('cart-count');
  const wishlistCount = document.getElementById('wishlist-count');

  // Cart Summary
  const couponInput = document.getElementById('coupon-code');
  const applyCouponBtn = document.getElementById('apply-coupon-btn');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const cartDiscount = document.getElementById('cart-discount');
  const cartTax = document.getElementById('cart-tax');
  const cartTotal = document.getElementById('cart-total');
  const proceedCheckoutBtn = document.getElementById('proceed-checkout-btn');

  // Modals
  const quickviewOverlay = document.getElementById('quickview-overlay');
  const closeQuickviewBtn = document.getElementById('close-quickview-btn');
  const qvImg = document.getElementById('qv-img');
  const qvCategory = document.getElementById('qv-category');
  const qvTitle = document.getElementById('qv-title');
  const qvRating = document.getElementById('qv-rating');
  const qvDesc = document.getElementById('qv-desc');
  const qvSpecs = document.getElementById('qv-specs');
  const qvPrice = document.getElementById('qv-price');
  const qvAddCartBtn = document.getElementById('qv-add-cart-btn');

  // Checkout Modal
  const checkoutOverlay = document.getElementById('checkout-overlay');
  const closeCheckoutBtn = document.getElementById('close-checkout-btn');
  const checkoutForm = document.getElementById('checkout-form');
  const step1Content = document.getElementById('step-1-content');
  const step2Content = document.getElementById('step-2-content');
  const step3Content = document.getElementById('step-3-content');
  const step1Ind = document.getElementById('step-1-indicator');
  const step2Ind = document.getElementById('step-2-indicator');
  const step3Ind = document.getElementById('step-3-indicator');

  // Step Navigation Buttons
  const nextToPaymentBtn = document.getElementById('next-to-payment-btn');
  const backToShippingBtn = document.getElementById('back-to-shipping-btn');
  const nextToReviewBtn = document.getElementById('next-to-review-btn');
  const backToPaymentBtn = document.getElementById('back-to-payment-btn');
  const checkoutOrderSummary = document.getElementById('checkout-order-summary');

  // Order Success Modal
  const orderSuccessOverlay = document.getElementById('order-success-overlay');
  const printableInvoice = document.getElementById('printable-invoice');
  const printInvoiceBtn = document.getElementById('print-invoice-btn');
  const finishOrderBtn = document.getElementById('finish-order-btn');

  // --- INITIALIZATION ---
  initTheme();
  renderProducts();
  updateCartUI();
  updateWishlistUI();

  // --- THEME SYSTEM ---
  function initTheme() {
    const savedTheme = localStorage.getItem('auraluxe_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('auraluxe_theme', newTheme);
    updateThemeIcon(newTheme);
    showToast(`Switched to ${newTheme} mode`, 'info');
  });

  function updateThemeIcon(theme) {
    themeToggle.innerHTML = theme === 'dark' 
      ? '<i class="fa-solid fa-sun" style="color: #f59e0b;"></i>' 
      : '<i class="fa-solid fa-moon"></i>';
  }

  // --- PRODUCT FILTERING & RENDERING ---
  function getFilteredProducts() {
    return PRODUCTS.filter(product => {
      const matchCategory = activeCategory === 'all' || product.category === activeCategory;
      const matchPrice = product.price <= maxPrice;
      const matchSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchPrice && matchSearch;
    }).sort((a, b) => {
      if (sortMode === 'price-low') return a.price - b.price;
      if (sortMode === 'price-high') return b.price - a.price;
      if (sortMode === 'rating') return b.rating - a.rating;
      return b.reviewsCount - a.reviewsCount; // popular default
    });
  }

  function renderProducts() {
    const filtered = getFilteredProducts();
    resultsCount.textContent = `Showing ${filtered.length} Product${filtered.length !== 1 ? 's' : ''}`;

    if (filtered.length === 0) {
      productsGrid.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-magnifying-glass"></i>
          <h3>No matching products found</h3>
          <p>Try adjusting your search query, price slider, or category filters.</p>
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = filtered.map(product => {
      const isWishlisted = wishlist.includes(product.id);
      const starRating = Array.from({ length: 5 }, (_, i) => 
        `<i class="fa-${i < Math.floor(product.rating) ? 'solid' : 'regular'} fa-star"></i>`
      ).join('');

      return `
        <div class="product-card" data-id="${product.id}">
          <div class="product-thumb">
            <span class="card-badge badge-${product.badgeType}">${product.badge}</span>
            <img src="${product.image}" alt="${product.name}" loading="lazy">
            <div class="thumb-actions">
              <button class="icon-btn wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist(${product.id})" title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}">
                <i class="fa-${isWishlisted ? 'solid' : 'regular'} fa-heart"></i>
              </button>
              <button class="icon-btn" onclick="openQuickView(${product.id})" title="Quick View">
                <i class="fa-regular fa-eye"></i>
              </button>
            </div>
          </div>
          <div class="product-details">
            <div>
              <span class="product-category">${product.category}</span>
              <h3 class="product-title">${product.name}</h3>
              <div class="product-rating">
                ${starRating}
                <span>(${product.rating}) • ${product.reviewsCount} reviews</span>
              </div>
            </div>
            <div class="product-bottom">
              <div class="product-price">
                <span class="current-price">$${product.price.toFixed(2)}</span>
                ${product.originalPrice ? `<span class="old-price">$${product.originalPrice.toFixed(2)}</span>` : ''}
              </div>
              <button class="add-cart-btn" onclick="addToCart(${product.id})">
                <i class="fa-solid fa-plus"></i> Add
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- SEARCH & CONTROLS LISTENERS ---
  categoryPills.addEventListener('click', (e) => {
    const pill = e.target.closest('.category-pill');
    if (!pill) return;
    document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeCategory = pill.dataset.category;
    renderProducts();
  });

  priceRange.addEventListener('input', (e) => {
    maxPrice = parseFloat(e.target.value);
    priceVal.textContent = `$${maxPrice}`;
    renderProducts();
  });

  sortSelect.addEventListener('change', (e) => {
    sortMode = e.target.value;
    renderProducts();
  });

  globalSearch.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderProducts();
    renderSearchDropdown(searchQuery);
  });

  function renderSearchDropdown(query) {
    if (!query) {
      searchDropdown.classList.remove('active');
      return;
    }
    const matches = PRODUCTS.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
    if (matches.length === 0) {
      searchDropdown.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-secondary);">No products match "${query}"</div>`;
    } else {
      searchDropdown.innerHTML = matches.map(p => `
        <div class="search-item" onclick="openQuickView(${p.id})">
          <img src="${p.image}" alt="${p.name}">
          <div class="search-item-info">
            <h4>${p.name}</h4>
            <p>$${p.price.toFixed(2)}</p>
          </div>
        </div>
      `).join('');
    }
    searchDropdown.classList.add('active');
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      searchDropdown.classList.remove('active');
    }
  });

  // --- CART FUNCTIONS ---
  window.addToCart = function(productId, qty = 1) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ ...product, qty });
    }

    saveCart();
    updateCartUI();
    showToast(`Added "${product.name}" to cart!`, 'success');
  };

  window.updateCartQty = function(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(i => i.id !== productId);
    }
    saveCart();
    updateCartUI();
  };

  window.removeFromCart = function(productId) {
    cart = cart.filter(i => i.id !== productId);
    saveCart();
    updateCartUI();
    showToast('Item removed from cart', 'info');
  };

  function saveCart() {
    localStorage.setItem('auraluxe_cart', JSON.stringify(cart));
  }

  function updateCartUI() {
    const totalItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = totalItemsCount;

    if (cart.length === 0) {
      cartBody.innerHTML = `
        <div class="empty-state" style="padding: 2rem 1rem;">
          <i class="fa-solid fa-cart-flatbed" style="font-size: 2.5rem;"></i>
          <h4 style="margin-top: 0.5rem;">Your cart is empty</h4>
          <p style="font-size: 0.85rem;">Discover our latest arrivals and add items to your cart.</p>
        </div>
      `;
    } else {
      cartBody.innerHTML = cart.map(item => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
            <div class="qty-controls">
              <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)">-</button>
              <span class="qty-val">${item.qty}</span>
              <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
            </div>
          </div>
          <button class="remove-cart-item" onclick="removeFromCart(${item.id})"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      `).join('');
    }

    // Calculations
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discountAmt = subtotal * appliedDiscount;
    const taxAmt = (subtotal - discountAmt) * 0.05;
    const grandTotal = subtotal - discountAmt + taxAmt;

    cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    cartDiscount.textContent = `-$${discountAmt.toFixed(2)}`;
    cartTax.textContent = `$${taxAmt.toFixed(2)}`;
    cartTotal.textContent = `$${grandTotal.toFixed(2)}`;
  }

  // Coupon Code Handler
  applyCouponBtn.addEventListener('click', () => {
    const code = couponInput.value.trim().toUpperCase();
    if (code === 'AURA20' || code === 'LUXE20') {
      appliedDiscount = 0.20;
      showToast('Coupon applied! 20% discount added.', 'success');
      updateCartUI();
    } else if (code === '') {
      appliedDiscount = 0;
      updateCartUI();
    } else {
      showToast('Invalid promo code. Try "AURA20"', 'error');
    }
  });

  // --- WISHLIST FUNCTIONS ---
  window.toggleWishlist = function(productId) {
    const index = wishlist.indexOf(productId);
    const product = PRODUCTS.find(p => p.id === productId);

    if (index > -1) {
      wishlist.splice(index, 1);
      showToast(`Removed "${product.name}" from Wishlist`, 'info');
    } else {
      wishlist.push(productId);
      showToast(`Saved "${product.name}" to Wishlist`, 'success');
    }

    localStorage.setItem('auraluxe_wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
    renderProducts();
  };

  function updateWishlistUI() {
    wishlistCount.textContent = wishlist.length;

    if (wishlist.length === 0) {
      wishlistBody.innerHTML = `
        <div class="empty-state" style="padding: 2rem 1rem;">
          <i class="fa-regular fa-heart" style="font-size: 2.5rem;"></i>
          <h4 style="margin-top: 0.5rem;">No saved items yet</h4>
          <p style="font-size: 0.85rem;">Click the heart icon on any product to save it here.</p>
        </div>
      `;
    } else {
      const items = PRODUCTS.filter(p => wishlist.includes(p.id));
      wishlistBody.innerHTML = items.map(item => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <div class="cart-item-price">$${item.price.toFixed(2)}</div>
            <button class="add-cart-btn" style="margin-top: 0.5rem; padding: 0.35rem 0.8rem; font-size: 0.8rem;" onclick="addToCart(${item.id})">
              <i class="fa-solid fa-cart-plus"></i> Move to Cart
            </button>
          </div>
          <button class="remove-cart-item" onclick="toggleWishlist(${item.id})"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `).join('');
    }
  }

  // --- DRAWER TOGGLES ---
  cartTrigger.addEventListener('click', () => cartDrawer.classList.add('active'));
  closeCartBtn.addEventListener('click', () => cartDrawer.classList.remove('active'));

  wishlistTrigger.addEventListener('click', () => wishlistDrawer.classList.add('active'));
  closeWishlistBtn.addEventListener('click', () => wishlistDrawer.classList.remove('active'));

  // --- QUICK VIEW MODAL ---
  window.openQuickView = function(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    activeQuickViewId = product.id;
    qvImg.src = product.image;
    qvCategory.textContent = product.category;
    qvTitle.textContent = product.name;
    qvDesc.textContent = product.description;
    qvPrice.textContent = `$${product.price.toFixed(2)}`;

    qvRating.innerHTML = Array.from({ length: 5 }, (_, i) => 
      `<i class="fa-${i < Math.floor(product.rating) ? 'solid' : 'regular'} fa-star"></i>`
    ).join('') + ` <span>(${product.rating})</span>`;

    qvSpecs.innerHTML = product.specs.map(spec => `<span class="spec-tag">${spec}</span>`).join('');

    quickviewOverlay.classList.add('active');
  };

  closeQuickviewBtn.addEventListener('click', () => quickviewOverlay.classList.remove('active'));
  qvAddCartBtn.addEventListener('click', () => {
    if (activeQuickViewId) {
      addToCart(activeQuickViewId);
      quickviewOverlay.classList.remove('active');
    }
  });

  // --- MULTI-STEP CHECKOUT WORKFLOW ---
  proceedCheckoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
      showToast('Your cart is empty!', 'warning');
      return;
    }
    cartDrawer.classList.remove('active');
    checkoutOverlay.classList.add('active');
    showStep(1);
  });

  closeCheckoutBtn.addEventListener('click', () => checkoutOverlay.classList.remove('active'));

  function showStep(stepNum) {
    step1Content.style.display = stepNum === 1 ? 'block' : 'none';
    step2Content.style.display = stepNum === 2 ? 'block' : 'none';
    step3Content.style.display = stepNum === 3 ? 'block' : 'none';

    step1Ind.classList.toggle('active', stepNum >= 1);
    step2Ind.classList.toggle('active', stepNum >= 2);
    step3Ind.classList.toggle('active', stepNum >= 3);
  }

  nextToPaymentBtn.addEventListener('click', () => {
    const fname = document.getElementById('first-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const address = document.getElementById('address').value.trim();

    if (!fname || !email || !address) {
      showToast('Please fill in all required shipping fields', 'warning');
      return;
    }
    showStep(2);
  });

  backToShippingBtn.addEventListener('click', () => showStep(1));

  nextToReviewBtn.addEventListener('click', () => {
    renderCheckoutSummary();
    showStep(3);
  });

  backToPaymentBtn.addEventListener('click', () => showStep(2));

  function renderCheckoutSummary() {
    const fname = document.getElementById('first-name').value.trim();
    const lname = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const address = document.getElementById('address').value.trim();
    const city = document.getElementById('city').value.trim();

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discountAmt = subtotal * appliedDiscount;
    const taxAmt = (subtotal - discountAmt) * 0.05;
    const grandTotal = subtotal - discountAmt + taxAmt;

    checkoutOrderSummary.innerHTML = `
      <p><strong>Deliver To:</strong> ${fname} ${lname} (${email})</p>
      <p><strong>Address:</strong> ${address}, ${city}</p>
      <hr style="margin: 0.75rem 0; border: none; border-top: 1px solid var(--border-color);">
      <div style="display: flex; flex-direction: column; gap: 0.35rem;">
        ${cart.map(i => `<div style="display:flex; justify-between;"><span style="flex:1;">${i.name} x${i.qty}</span> <strong>$${(i.price * i.qty).toFixed(2)}</strong></div>`).join('')}
      </div>
      <hr style="margin: 0.75rem 0; border: none; border-top: 1px solid var(--border-color);">
      <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1.1rem; color: var(--accent-primary);">
        <span>Total Payable:</span>
        <span>$${grandTotal.toFixed(2)}</span>
      </div>
    `;
  }

  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    checkoutOverlay.classList.remove('active');

    const orderId = 'AL-' + Math.floor(100000 + Math.random() * 900000);
    const fname = document.getElementById('first-name').value.trim();
    const lname = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const address = document.getElementById('address').value.trim();

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discountAmt = subtotal * appliedDiscount;
    const taxAmt = (subtotal - discountAmt) * 0.05;
    const grandTotal = subtotal - discountAmt + taxAmt;

    // Populate Invoice
    printableInvoice.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem; border-bottom: 2px solid var(--border-color); padding-bottom: 1rem;">
        <div>
          <h2 style="color: var(--accent-primary); font-size: 1.5rem;">AURA LUXE INVOICE</h2>
          <p>Order ID: <strong>#${orderId}</strong></p>
          <p>Date: ${new Date().toLocaleDateString()}</p>
        </div>
        <div style="text-align: right;">
          <h4>Billed To:</h4>
          <p>${fname} ${lname}</p>
          <p>${email}</p>
          <p>${address}</p>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
        <thead>
          <tr style="border-bottom: 1px solid var(--border-color); text-align: left;">
            <th style="padding: 0.5rem 0;">Item</th>
            <th style="padding: 0.5rem 0;">Qty</th>
            <th style="padding: 0.5rem 0; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${cart.map(i => `
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 0.5rem 0;">${i.name}</td>
              <td style="padding: 0.5rem 0;">${i.qty}</td>
              <td style="padding: 0.5rem 0; text-align: right;">$${(i.price * i.qty).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="text-align: right; display: flex; flex-direction: column; gap: 0.35rem;">
        <p>Subtotal: <strong>$${subtotal.toFixed(2)}</strong></p>
        <p>Discount: <strong>-$${discountAmt.toFixed(2)}</strong></p>
        <p>Tax (5%): <strong>$${taxAmt.toFixed(2)}</strong></p>
        <h3 style="color: var(--accent-primary); font-size: 1.3rem;">Grand Total: $${grandTotal.toFixed(2)}</h3>
      </div>
    `;

    // Clear Cart
    cart = [];
    appliedDiscount = 0;
    saveCart();
    updateCartUI();

    orderSuccessOverlay.classList.add('active');
  });

  printInvoiceBtn.addEventListener('click', () => {
    window.print();
  });

  finishOrderBtn.addEventListener('click', () => {
    orderSuccessOverlay.classList.remove('active');
  });

  // --- TOAST NOTIFICATION GENERATOR ---
  function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = {
      success: '<i class="fa-solid fa-circle-check" style="color: var(--success);"></i>',
      error: '<i class="fa-solid fa-circle-xmark" style="color: var(--danger);"></i>',
      warning: '<i class="fa-solid fa-triangle-exclamation" style="color: var(--warning);"></i>',
      info: '<i class="fa-solid fa-circle-info" style="color: var(--accent-primary);"></i>'
    };

    toast.innerHTML = `${iconMap[type] || ''} <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
});
