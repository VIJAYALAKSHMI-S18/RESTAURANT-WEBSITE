// --- STATE & INITIALIZATION ---

let state = {
  menuItems: [],
  cart: [],
  orders: [],
  activeTab: 'tab-order',
  activeFilter: 'all',
  searchQuery: '',
  editingItemId: null,
  salesSearchQuery: ''
};

// Curated Unsplash images that look highly premium and Appetizing
const defaultFoodImages = {
  'Idly': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=600',
  'Puttu': 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=600',
  'Poori': 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=600',
  'Pongal': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=600',
  'Vada': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=600',
  'Coffee': 'assets/images/coffee_cup_1780637290578.png',
  'Tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=600',
  'Default': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600'
};

// Seed Menu Items
const initialMenuItems = [
  { id: 'm1', name: 'Idly', price: 40, category: 'Mains', image: defaultFoodImages['Idly'] },
  { id: 'm2', name: 'Puttu', price: 60, category: 'Mains', image: defaultFoodImages['Puttu'] },
  { id: 'm3', name: 'Poori', price: 50, category: 'Mains', image: defaultFoodImages['Poori'] },
  { id: 'm4', name: 'Pongal', price: 55, category: 'Mains', image: defaultFoodImages['Pongal'] },
  { id: 'm5', name: 'Vada', price: 15, category: 'Sides', image: defaultFoodImages['Vada'] },
  { id: 'm6', name: 'Coffee', price: 25, category: 'Beverages', image: defaultFoodImages['Coffee'] },
  { id: 'm7', name: 'Tea', price: 20, category: 'Beverages', image: defaultFoodImages['Tea'] }
];

// Seed Mock Orders spread over current month (June 2026)
function generateMockOrders() {
  const mockOrders = [];
  const itemsList = initialMenuItems;
  
  // Create 24 mock sales spanning June 1 to June 5, 2026
  const ordersCount = 24;
  for (let i = 1; i <= ordersCount; i++) {
    // Generate dates: 2026-06-01 to 2026-06-05
    const day = Math.min(5, Math.ceil(i / 5)); 
    const hour = 8 + (i % 6) * 2; // Hours: 8, 10, 12, 14, 16, 18
    const dateStr = `2026-06-0${day}T${hour.toString().padStart(2, '0')}:${(i * 12 % 60).toString().padStart(2, '0')}:00`;
    
    // Pick 1 to 3 random items
    const numItems = (i % 3) + 1;
    const selectedItems = [];
    let subtotal = 0;
    
    for (let j = 0; j < numItems; j++) {
      const randomItem = itemsList[(i + j * 2) % itemsList.length];
      const quantity = (j === 0 && i % 4 === 0) ? 2 : 1;
      selectedItems.push({
        name: randomItem.name,
        price: randomItem.price,
        quantity: quantity
      });
      subtotal += randomItem.price * quantity;
    }
    
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const total = subtotal + tax;
    
    mockOrders.push({
      id: `ORD10${100 + i}`,
      timestamp: dateStr,
      items: selectedItems,
      subtotal: subtotal,
      tax: tax,
      total: total,
      paymentMethod: i % 3 === 0 ? 'Cash' : 'UPI'
    });
  }
  
  return mockOrders;
}

// App Entry Point
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Load Menu Items from Local Storage or Seed
  const storedMenu = localStorage.getItem('restaurant_menu_items');
  if (storedMenu) {
    state.menuItems = JSON.parse(storedMenu);
  } else {
    state.menuItems = initialMenuItems;
    localStorage.setItem('restaurant_menu_items', JSON.parse(JSON.stringify(initialMenuItems)));
  }

  // Load Orders from Local Storage or Seed
  const storedOrders = localStorage.getItem('restaurant_orders');
  if (storedOrders) {
    state.orders = JSON.parse(storedOrders);
  } else {
    state.orders = generateMockOrders();
    localStorage.setItem('restaurant_orders', JSON.stringify(state.orders));
  }

  // Set up Event Listeners
  setupEventListeners();
  
  // Live Clock Trigger
  setInterval(updateClock, 1000);
  updateClock();

  // Render initial view
  renderMenuItems();
  renderCart();
  renderCRUDMenuTable();
  renderSalesDashboard();
  
  // Initialize Lucide Icons
  lucide.createIcons();
}

function updateClock() {
  const clockEl = document.getElementById('live-clock');
  if (clockEl) {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}

// --- EVENT LISTENERS ---

function setupEventListeners() {
  // Tab Navigation switching
  document.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', (e) => {
      const tabId = button.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Category filters inside Order Screen
  const filtersContainer = document.getElementById('category-filters');
  if (filtersContainer) {
    filtersContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-pill')) {
        document.querySelectorAll('.filter-pill').forEach(pill => pill.classList.remove('active'));
        e.target.classList.add('active');
        state.activeFilter = e.target.getAttribute('data-category');
        renderMenuItems();
      }
    });
  }

  // Search input in POS menu
  const searchMenu = document.getElementById('search-menu');
  if (searchMenu) {
    searchMenu.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase();
      renderMenuItems();
    });
  }

  // Search sales history
  const searchSales = document.getElementById('search-transactions');
  if (searchSales) {
    searchSales.addEventListener('input', (e) => {
      state.salesSearchQuery = e.target.value.toLowerCase();
      renderSalesHistoryTable();
    });
  }

  // Cart actions
  document.getElementById('btn-clear-cart').addEventListener('click', clearCart);
  document.getElementById('btn-print-bill').addEventListener('click', printCurrentBillDirectly);
  document.getElementById('btn-pay-now').addEventListener('click', openPaymentModal);

  // Menu Modal controls
  document.getElementById('btn-add-item').addEventListener('click', () => openMenuModal());
  document.getElementById('btn-close-menu-modal').addEventListener('click', closeMenuModal);
  document.getElementById('btn-cancel-menu-modal').addEventListener('click', closeMenuModal);
  document.getElementById('menu-item-form').addEventListener('submit', handleSaveMenuItem);

  // Payment Modal controls
  document.getElementById('btn-close-payment-modal').addEventListener('click', closePaymentModal);
  document.getElementById('btn-cancel-payment').addEventListener('click', closePaymentModal);
  document.getElementById('btn-confirm-payment').addEventListener('click', handleConfirmPayment);
}

// Switch SPA Tabs
function switchTab(tabId) {
  state.activeTab = tabId;
  
  // Update nav UI active class
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  // Toggle sections visibility
  document.querySelectorAll('.tab-pane').forEach(pane => {
    if (pane.id === tabId) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  // Update specific layouts when entering dashboard/CRUD
  if (tabId === 'tab-reports') {
    renderSalesDashboard();
  } else if (tabId === 'tab-menu') {
    renderCRUDMenuTable();
  }
}

// --- RENDERING POS ORDER ITEMS ---

function renderMenuItems() {
  const gridEl = document.getElementById('items-grid');
  if (!gridEl) return;

  gridEl.innerHTML = '';
  
  // Filter menu items
  const filtered = state.menuItems.filter(item => {
    const matchesCategory = state.activeFilter === 'all' || item.category === state.activeFilter;
    const matchesSearch = item.name.toLowerCase().includes(state.searchQuery);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    gridEl.innerHTML = `
      <div class="empty-cart-state" style="grid-column: 1 / -1;">
        <i data-lucide="search-slash"></i>
        <p>No menu items match your search.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.addEventListener('click', () => addToCart(item.id));
    
    card.innerHTML = `
      <div class="img-wrapper">
        <img src="${item.image || defaultFoodImages['Default']}" alt="${item.name}" onerror="this.src='${defaultFoodImages['Default']}'">
        <span class="category-badge">${item.category}</span>
      </div>
      <div class="details">
        <h4>${item.name}</h4>
        <div class="card-footer">
          <span class="price">₹${item.price.toFixed(2)}</span>
          <button class="btn-add">
            <i data-lucide="plus" style="width:14px; height:14px;"></i>
          </button>
        </div>
      </div>
    `;
    gridEl.appendChild(card);
  });
  
  lucide.createIcons();
}

// --- BILLING CART SYSTEM ---

function renderCart() {
  const cartItemsEl = document.getElementById('cart-items');
  const countBadge = document.getElementById('cart-count-badge');
  const subtotalEl = document.getElementById('bill-subtotal');
  const taxEl = document.getElementById('bill-tax');
  const totalEl = document.getElementById('bill-total');
  
  if (!cartItemsEl) return;

  if (state.cart.length === 0) {
    cartItemsEl.innerHTML = `
      <div class="empty-cart-state">
        <i data-lucide="shopping-cart"></i>
        <p>Cart is empty.<br>Tap items to add.</p>
      </div>
    `;
    countBadge.textContent = '0 items';
    subtotalEl.textContent = '₹0.00';
    taxEl.textContent = '₹0.00';
    totalEl.textContent = '₹0.00';
    lucide.createIcons();
    return;
  }

  cartItemsEl.innerHTML = '';
  let subtotal = 0;
  let itemCount = 0;

  state.cart.forEach(cartItem => {
    const menuItem = state.menuItems.find(m => m.id === cartItem.itemId);
    if (!menuItem) return;

    const itemTotal = menuItem.price * cartItem.quantity;
    subtotal += itemTotal;
    itemCount += cartItem.quantity;

    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div class="item-info">
        <span class="name">${menuItem.name}</span>
        <span class="price">₹${menuItem.price.toFixed(2)}</span>
      </div>
      <div class="qty-controls">
        <button class="qty-btn" onclick="event.stopPropagation(); updateCartQty('${menuItem.id}', ${cartItem.quantity - 1})">-</button>
        <span class="qty-num">${cartItem.quantity}</span>
        <button class="qty-btn" onclick="event.stopPropagation(); updateCartQty('${menuItem.id}', ${cartItem.quantity + 1})">+</button>
      </div>
      <span class="total-price">₹${itemTotal.toFixed(2)}</span>
      <button class="btn-remove" onclick="event.stopPropagation(); updateCartQty('${menuItem.id}', 0)">
        <i data-lucide="x-circle"></i>
      </button>
    `;
    cartItemsEl.appendChild(row);
  });

  const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
  const grandTotal = subtotal + tax;

  countBadge.textContent = `${itemCount} item${itemCount > 1 ? 's' : ''}`;
  subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
  taxEl.textContent = `₹${tax.toFixed(2)}`;
  totalEl.textContent = `₹${grandTotal.toFixed(2)}`;
  
  lucide.createIcons();
}

function addToCart(itemId) {
  const existing = state.cart.find(c => c.itemId === itemId);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ itemId, quantity: 1 });
  }
  renderCart();
}

function updateCartQty(itemId, newQty) {
  const index = state.cart.findIndex(c => c.itemId === itemId);
  if (index === -1) return;

  if (newQty <= 0) {
    state.cart.splice(index, 1);
  } else {
    state.cart[index].quantity = newQty;
  }
  renderCart();
}

function clearCart() {
  state.cart = [];
  renderCart();
}

// Print Bill helper functions
function getReceiptHTML(receiptId, date, cartItems, subtotal, tax, grandTotal, paymentMethod) {
  let itemsRows = '';
  cartItems.forEach(ci => {
    const menuItem = state.menuItems.find(m => m.id === ci.itemId) || { name: ci.name, price: ci.price };
    const itemTotal = menuItem.price * ci.quantity;
    itemsRows += `
      <tr>
        <td>${menuItem.name}</td>
        <td class="qty">${ci.quantity}</td>
        <td class="price">₹${menuItem.price.toFixed(2)}</td>
        <td class="total">₹${itemTotal.toFixed(2)}</td>
      </tr>
    `;
  });

  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  return `
    <div class="receipt-header">
      <h2>DAKSHIN FLAVORS</h2>
      <p>128 Temple Road, Chennai</p>
      <p>Tel: +91 44 2345 6789</p>
      <p>GSTIN: 33AAAAA0000A1Z2</p>
    </div>
    
    <div class="receipt-info">
      <div class="receipt-row">
        <span>Bill No: ${receiptId}</span>
        <span>Date: ${formattedDate}</span>
      </div>
      <div class="receipt-row">
        <span>Cashier: Counter 1</span>
        <span>Method: ${paymentMethod}</span>
      </div>
    </div>
    
    <table class="receipt-table">
      <thead>
        <tr>
          <th style="text-align: left;">Item</th>
          <th class="qty" style="width: 30px;">Qty</th>
          <th class="price" style="width: 50px;">Rate</th>
          <th class="total" style="width: 60px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>
    
    <div class="receipt-summary">
      <div class="receipt-row">
        <span>Subtotal</span>
        <span>₹${subtotal.toFixed(2)}</span>
      </div>
      <div class="receipt-row">
        <span>CGST (2.5%)</span>
        <span>₹${(tax/2).toFixed(2)}</span>
      </div>
      <div class="receipt-row">
        <span>SGST (2.5%)</span>
        <span>₹${(tax/2).toFixed(2)}</span>
      </div>
      <div class="receipt-row grand-total">
        <span>GRAND TOTAL</span>
        <span>₹${grandTotal.toFixed(2)}</span>
      </div>
    </div>
    
    <div class="receipt-footer">
      <p>Thank you for dining with us!</p>
      <p>Visit again soon.</p>
      <div class="receipt-barcode"></div>
      <p style="font-size: 8px; margin-top: 4px;">Powered by Dakshin POS</p>
    </div>
  `;
}

function printCurrentBillDirectly() {
  if (state.cart.length === 0) {
    alert('Cannot print an empty bill. Please add items to the cart.');
    return;
  }
  
  // Simply compile active receipt data and trigger print without completing order
  const mockReceiptId = `TMP-${Date.now().toString().slice(-6)}`;
  const date = new Date().toISOString();
  
  let subtotal = 0;
  state.cart.forEach(ci => {
    const menuItem = state.menuItems.find(m => m.id === ci.itemId);
    if (menuItem) subtotal += menuItem.price * ci.quantity;
  });
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const grandTotal = subtotal + tax;
  
  const container = document.getElementById('print-receipt-container');
  container.innerHTML = getReceiptHTML(mockReceiptId, date, state.cart, subtotal, tax, grandTotal, 'PENDING');
  
  window.print();
}

// --- PAYMENTS & CHECKOUT MODAL ---

function openPaymentModal() {
  if (state.cart.length === 0) {
    alert('Your cart is empty.');
    return;
  }
  
  // Calculate Grand Total
  let subtotal = 0;
  state.cart.forEach(ci => {
    const menuItem = state.menuItems.find(m => m.id === ci.itemId);
    if (menuItem) subtotal += menuItem.price * ci.quantity;
  });
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const grandTotal = subtotal + tax;

  const txnRef = `DFTXN${Date.now().toString().slice(-6)}`;
  document.getElementById('qr-ref-id').textContent = txnRef;
  document.getElementById('qr-total-amount').textContent = `₹${grandTotal.toFixed(2)}`;

  // Generate UPI QR Code URL using QRServer API
  const upiString = `upi://pay?pa=dakshinflavors@okaxis&pn=Dakshin%20Flavors%20Restaurant&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(txnRef)}`;
  
  // Set up the dynamic image/QR
  const qrSvgEl = document.getElementById('payment-qr-svg');
  qrSvgEl.innerHTML = `
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiString)}&color=0f172a" 
         alt="UPI QR Code" 
         style="width: 180px; height: 180px;"
         onerror="renderFallbackQR(this)">
  `;

  // Display overlay
  document.getElementById('modal-payment').classList.add('active');
}

function renderFallbackQR(imgEl) {
  // If the user lacks internet access, fallback to a beautiful SVG QR Mock
  const parent = imgEl.parentElement;
  parent.innerHTML = `
    <svg width="180" height="180" viewBox="0 0 100 100" style="background:#fff; padding: 10px; border-radius: 8px;">
      <!-- Corner Squares -->
      <rect x="0" y="0" width="25" height="25" fill="#111827" />
      <rect x="3" y="3" width="19" height="19" fill="#fff" />
      <rect x="7" y="7" width="11" height="11" fill="#111827" />
      
      <rect x="75" y="0" width="25" height="25" fill="#111827" />
      <rect x="78" y="3" width="19" height="19" fill="#fff" />
      <rect x="82" y="7" width="11" height="11" fill="#111827" />
      
      <rect x="0" y="75" width="25" height="25" fill="#111827" />
      <rect x="3" y="75" width="19" height="19" fill="#fff" />
      <rect x="7" y="79" width="11" height="11" fill="#111827" />
      
      <!-- Random noise mock QR -->
      <rect x="30" y="5" width="10" height="5" fill="#111827" />
      <rect x="50" y="10" width="15" height="10" fill="#111827" />
      <rect x="35" y="25" width="20" height="5" fill="#111827" />
      <rect x="10" y="35" width="5" height="15" fill="#111827" />
      <rect x="30" y="40" width="30" height="5" fill="#111827" />
      <rect x="70" y="30" width="10" height="15" fill="#111827" />
      <rect x="40" y="55" width="25" height="25" fill="#111827" />
      <rect x="15" y="60" width="10" height="5" fill="#111827" />
      <rect x="75" y="60" width="20" height="10" fill="#111827" />
      <rect x="75" y="80" width="10" height="15" fill="#111827" />
      <rect x="55" y="85" width="10" height="5" fill="#111827" />
    </svg>
  `;
}

function closePaymentModal() {
  document.getElementById('modal-payment').classList.remove('active');
}

// Complete the purchase flow
function handleConfirmPayment() {
  if (state.cart.length === 0) return;

  const orderId = `ORD${Math.floor(100000 + Math.random() * 900000)}`;
  const timestamp = new Date().toISOString();
  
  let subtotal = 0;
  const items = state.cart.map(ci => {
    const menuItem = state.menuItems.find(m => m.id === ci.itemId);
    subtotal += menuItem.price * ci.quantity;
    return {
      name: menuItem.name,
      price: menuItem.price,
      quantity: ci.quantity
    };
  });
  
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + tax;

  const newOrder = {
    id: orderId,
    timestamp: timestamp,
    items: items,
    subtotal: subtotal,
    tax: tax,
    total: total,
    paymentMethod: 'UPI'
  };

  // Add order, save to local storage
  state.orders.unshift(newOrder); // Add to beginning of history
  localStorage.setItem('restaurant_orders', JSON.stringify(state.orders));

  // Prepare Receipt formatting
  const printContainer = document.getElementById('print-receipt-container');
  printContainer.innerHTML = getReceiptHTML(orderId, timestamp, state.cart, subtotal, tax, total, 'UPI / COMPLETED');

  // Close payment dialog and clear cart
  closePaymentModal();
  clearCart();

  // Trigger browser print dialog for thermal receipt printing
  setTimeout(() => {
    window.print();
  }, 300);
}

// --- MANAGE MENU (CRUD) MANAGEMENT ---

function renderCRUDMenuTable() {
  const tableBody = document.getElementById('crud-menu-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '';
  
  state.menuItems.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <img class="table-img" src="${item.image || defaultFoodImages['Default']}" alt="${item.name}" onerror="this.src='${defaultFoodImages['Default']}'">
      </td>
      <td><strong>${item.name}</strong></td>
      <td><span class="badge ${item.category.toLowerCase()}">${item.category}</span></td>
      <td class="text-right font-display" style="font-weight: 600;">₹${item.price.toFixed(2)}</td>
      <td>
        <div class="table-actions">
          <button class="btn-icon edit" onclick="openMenuModal('${item.id}')" title="Edit item details">
            <i data-lucide="edit-3" style="width:16px; height:16px;"></i>
          </button>
          <button class="btn-icon delete" onclick="handleDeleteMenuItem('${item.id}')" title="Remove item">
            <i data-lucide="trash-2" style="width:16px; height:16px;"></i>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  lucide.createIcons();
}

function openMenuModal(itemId = null) {
  state.editingItemId = itemId;
  const modalTitle = document.getElementById('modal-menu-title');
  const nameInput = document.getElementById('menu-item-name');
  const catInput = document.getElementById('menu-item-category');
  const priceInput = document.getElementById('menu-item-price');
  const imgInput = document.getElementById('menu-item-image');
  
  if (itemId) {
    // Edit Mode
    modalTitle.textContent = 'Edit Menu Item';
    const item = state.menuItems.find(m => m.id === itemId);
    if (item) {
      nameInput.value = item.name;
      catInput.value = item.category;
      priceInput.value = item.price;
      // Don't show raw unsplash urls in edit if it's default to avoid clutter, else show it
      const defaultMatch = Object.values(defaultFoodImages).includes(item.image);
      imgInput.value = defaultMatch ? '' : item.image;
    }
  } else {
    // Add Mode
    modalTitle.textContent = 'Add Menu Item';
    nameInput.value = '';
    catInput.value = 'Mains';
    priceInput.value = '';
    imgInput.value = '';
  }

  document.getElementById('modal-menu-form').classList.add('active');
  nameInput.focus();
}

function closeMenuModal() {
  document.getElementById('modal-menu-form').classList.remove('active');
  state.editingItemId = null;
}

function handleSaveMenuItem(e) {
  e.preventDefault();
  
  const name = document.getElementById('menu-item-name').value.trim();
  const category = document.getElementById('menu-item-category').value;
  const price = parseFloat(document.getElementById('menu-item-price').value);
  let image = document.getElementById('menu-item-image').value.trim();
  
  if (!image) {
    // Check if we have a default premium food photography asset, otherwise use placeholder
    image = defaultFoodImages[name] || defaultFoodImages['Default'];
  }

  if (state.editingItemId) {
    // Update Operation
    const index = state.menuItems.findIndex(m => m.id === state.editingItemId);
    if (index !== -1) {
      state.menuItems[index] = {
        ...state.menuItems[index],
        name,
        category,
        price,
        image
      };
    }
  } else {
    // Create Operation
    const newId = `m_${Date.now()}`;
    state.menuItems.push({
      id: newId,
      name,
      category,
      price,
      image
    });
  }

  // Persist & Refresh UI
  localStorage.setItem('restaurant_menu_items', JSON.stringify(state.menuItems));
  
  closeMenuModal();
  renderMenuItems();
  renderCRUDMenuTable();
}

function handleDeleteMenuItem(itemId) {
  const item = state.menuItems.find(m => m.id === itemId);
  if (!item) return;

  const confirmed = confirm(`Are you sure you want to delete "${item.name}" from the menu?`);
  if (!confirmed) return;

  state.menuItems = state.menuItems.filter(m => m.id !== itemId);
  localStorage.setItem('restaurant_menu_items', JSON.stringify(state.menuItems));

  // If item is in cart, remove it
  const cartIndex = state.cart.findIndex(c => c.itemId === itemId);
  if (cartIndex !== -1) {
    state.cart.splice(cartIndex, 1);
    renderCart();
  }

  renderMenuItems();
  renderCRUDMenuTable();
}

// --- SALES REPORT DASHBOARD ---

function renderSalesDashboard() {
  renderSalesHistoryTable();
  
  // Calculate summary metrics
  const now = new Date();
  const currentMonthOrders = state.orders.filter(ord => {
    const orderDate = new Date(ord.timestamp);
    // Filter by year 2026, month June (5)
    return orderDate.getFullYear() === 2026 && orderDate.getMonth() === 5;
  });

  let totalRevenue = 0;
  let totalOrdersCount = currentMonthOrders.length;
  
  const itemFrequencies = {};

  currentMonthOrders.forEach(ord => {
    totalRevenue += ord.total;
    ord.items.forEach(it => {
      itemFrequencies[it.name] = (itemFrequencies[it.name] || 0) + it.quantity;
    });
  });

  const avgBill = totalOrdersCount > 0 ? (totalRevenue / totalOrdersCount) : 0;
  
  // Find top selling item name
  let topItemName = '-';
  let topItemQty = 0;
  for (const [name, qty] of Object.entries(itemFrequencies)) {
    if (qty > topItemQty) {
      topItemQty = qty;
      topItemName = `${name} (${qty} sold)`;
    }
  }

  // Update DOM metrics
  document.getElementById('stat-revenue').textContent = `₹${totalRevenue.toFixed(2)}`;
  document.getElementById('stat-orders').textContent = totalOrdersCount.toString();
  document.getElementById('stat-avg-bill').textContent = `₹${avgBill.toFixed(2)}`;
  document.getElementById('stat-top-item').textContent = topItemName;

  // Render Charts
  renderTrendLineChart(currentMonthOrders);
  renderCategoryBreakdownChart(currentMonthOrders);
}

function renderSalesHistoryTable() {
  const tableBody = document.getElementById('sales-history-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  const filtered = state.orders.filter(ord => {
    const idMatch = ord.id.toLowerCase().includes(state.salesSearchQuery);
    const itemsMatch = ord.items.some(it => it.name.toLowerCase().includes(state.salesSearchQuery));
    const paymentMatch = ord.paymentMethod.toLowerCase().includes(state.salesSearchQuery);
    return idMatch || itemsMatch || paymentMatch;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center" style="color: var(--text-muted); padding: 32px 0;">
          No matching transactions found.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(ord => {
    const dateObj = new Date(ord.timestamp);
    const dateFormatted = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const itemsSummary = ord.items.map(it => `${it.name} x${it.quantity}`).join(', ');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${ord.id}</strong></td>
      <td style="color: var(--text-muted); font-size: 0.8rem;">${dateFormatted}</td>
      <td>${itemsSummary}</td>
      <td class="text-right font-display" style="font-weight: 600; color: var(--primary);">₹${ord.total.toFixed(2)}</td>
      <td><span class="badge status-completed">${ord.paymentMethod}</span></td>
    `;
    tableBody.appendChild(tr);
  });
}

// Draw dynamic SVG charts
function renderTrendLineChart(juneOrders) {
  const container = document.getElementById('trend-chart-container');
  if (!container) return;

  // Track daily sales for June 1 to June 5, 2026
  const dailySales = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  juneOrders.forEach(ord => {
    const day = new Date(ord.timestamp).getDate();
    if (dailySales[day] !== undefined) {
      dailySales[day] += ord.total;
    }
  });

  const width = 500;
  const height = 180;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const days = [1, 2, 3, 4, 5];
  const maxRevenue = Math.max(...Object.values(dailySales), 100) * 1.1; // Add 10% ceiling padding

  // Generate line points
  const points = days.map((day, idx) => {
    const x = paddingLeft + (idx / (days.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (dailySales[day] / maxRevenue) * chartHeight;
    return { x, y, value: dailySales[day], label: `June ${day}` };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return acc + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
  }, '');

  const areaD = pathD + ` L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

  // Draw grid lines
  let gridLines = '';
  const divisions = 4;
  for (let i = 0; i <= divisions; i++) {
    const y = paddingTop + (i / divisions) * chartHeight;
    const val = (maxRevenue * (divisions - i) / divisions).toFixed(0);
    gridLines += `
      <line class="chart-grid-line" x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" />
      <text class="chart-axis-text" x="${paddingLeft - 8}" y="${y + 3}" text-anchor="end">₹${val}</text>
    `;
  }

  // Draw labels
  let labels = '';
  points.forEach(p => {
    labels += `
      <text class="chart-axis-text" x="${p.x}" y="${height - 8}" text-anchor="middle">${p.label}</text>
      <!-- hover circle -->
      <circle cx="${p.x}" cy="${p.y}" r="4" fill="var(--primary)" stroke="var(--bg-sidebar)" stroke-width="2" />
    `;
  });

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="svg-chart">
      <defs>
        <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      ${gridLines}
      <path class="chart-line-area" d="${areaD}" />
      <path class="chart-line" d="${pathD}" />
      ${labels}
    </svg>
  `;
}

function renderCategoryBreakdownChart(juneOrders) {
  const container = document.getElementById('category-chart-container');
  if (!container) return;

  // Calculate totals by category
  const catTotals = { Mains: 0, Sides: 0, Beverages: 0 };
  juneOrders.forEach(ord => {
    ord.items.forEach(it => {
      // Find item category from menu items
      const menuMatch = state.menuItems.find(m => m.name === it.name);
      const category = menuMatch ? menuMatch.category : 'Mains';
      catTotals[category] += it.price * it.quantity;
    });
  });

  const totalSales = Object.values(catTotals).reduce((a, b) => a + b, 0);

  if (totalSales === 0) {
    container.innerHTML = `<span class="text-muted" style="font-size:0.85rem">No data to display</span>`;
    return;
  }

  // Build high-fidelity donut/pie chart using dynamic SVG
  // Radius = 35, center = (50, 50)
  const colors = { Mains: '#f97316', Sides: '#10b981', Beverages: '#3b82f6' };
  let currentAngle = 0;
  let strokeDashAccumulator = 0;
  
  const segments = [];
  const radius = 25;
  const circumference = 2 * Math.PI * radius; // 157.08
  
  for (const [cat, val] of Object.entries(catTotals)) {
    const percent = totalSales > 0 ? (val / totalSales) : 0;
    const strokeLength = percent * circumference;
    const strokeOffset = circumference - strokeDashAccumulator;
    
    strokeDashAccumulator += strokeLength;
    
    if (percent > 0) {
      segments.push({
        category: cat,
        value: val,
        percent: (percent * 100).toFixed(1),
        strokeLength,
        strokeOffset,
        color: colors[cat]
      });
    }
  }

  // Draw SVG segments
  let svgSegmentsHtml = '';
  segments.forEach(seg => {
    svgSegmentsHtml += `
      <circle class="donut-segment" cx="45" cy="45" r="${radius}"
              fill="transparent"
              stroke="${seg.color}"
              stroke-width="12"
              stroke-dasharray="${seg.strokeLength} ${circumference - seg.strokeLength}"
              stroke-dashoffset="${seg.strokeOffset}"
              transform="rotate(-90 45 45)" />
    `;
  });

  // Compile Legend
  let legendHtml = '<div class="chart-legend">';
  segments.forEach(seg => {
    legendHtml += `
      <div class="legend-item">
        <div class="legend-label-group">
          <span class="legend-color" style="background-color: ${seg.color}"></span>
          <span>${seg.category} (${seg.percent}%)</span>
        </div>
        <span class="legend-val">₹${seg.value.toFixed(0)}</span>
      </div>
    `;
  });
  legendHtml += '</div>';

  container.style.flexDirection = 'row';
  container.style.gap = '16px';
  container.style.justifyContent = 'space-around';

  container.innerHTML = `
    <svg viewBox="0 0 90 90" style="width: 110px; height: 110px;">
      <circle cx="45" cy="45" r="${radius}" fill="transparent" stroke="var(--border-color)" stroke-width="12" />
      ${svgSegmentsHtml}
      <circle cx="45" cy="45" r="19" fill="var(--bg-sidebar)" />
    </svg>
    ${legendHtml}
  `;
}
