let products = [
    {id: 1, name: "Coca Cola", price: 1.99, stock: 50, category: "Beverages"},
    {id: 2, name: "Pepsi", price: 1.89, stock: 45, category: "Beverages"},
    {id: 3, name: "Chips", price: 2.49, stock: 30, category: "Snacks"},
    {id: 4, name: "Bread", price: 2.99, stock: 20, category: "Bakery"},
    {id: 5, name: "Milk", price: 3.49, stock: 25, category: "Dairy"},
    {id: 6, name: "Energy Drink", price: 2.99, stock: 35, category: "Beverages"},
    {id: 7, name: "Chocolate Bar", price: 1.79, stock: 40, category: "Snacks"},
    {id: 8, name: "Water Bottle", price: 0.99, stock: 60, category: "Beverages"}
];

let supplierStock = [];
let cart = [];
let transactions = [];
let settings = {
    storeName: "",
    storeAddress: "123 Main Street, City, State 12345",
    storePhone: "",
    taxRate: 0,
    currency: "USD",
    lowStockAlert: 10
};

let currentId = products.length + 1;
let stockId = 1;

// Login functionality
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Simple hardcoded credentials (replace with secure backend in production)
    if (username === "admin" && password === "password123") {
        sessionStorage.setItem('isLoggedIn', 'true');
        window.location.href = 'index.html';
    } else {
        alert('Invalid username or password!');
    }
}

// Check login status
function checkLogin() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const currentPage = window.location.pathname.split('/').pop();
    
    if (!isLoggedIn && currentPage !== 'login.html') {
        window.location.href = 'login.html';
    }
}

// Product grid
function updateProductGrid(productsToShow = products) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    productsToShow.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.onclick = () => addToCart(product);
        
        productCard.innerHTML = `
            <div class="product-name">${product.name}</div>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            <div style="font-size: 0.8rem; color: #6b7280; margin-top: 5px;">Stock: ${product.stock}</div>
        `;
        
        grid.appendChild(productCard);
    });
}

// Search products
function searchProducts(query) {
    const filtered = products.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
    );
    updateProductGrid(filtered);
}

// Cart management
function addToCart(product) {
    if (product.stock <= 0) {
        alert('Product out of stock!');
        return;
    }
    
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            alert('Not enough stock available!');
            return;
        }
    } else {
        cart.push({...product, quantity: 1});
    }
    
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const totalAmount = document.getElementById('totalAmount');
    if (!cartItems || !totalAmount) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div style="text-align: center; color: #6b7280; padding: 20px;">Cart is empty</div>';
        totalAmount.textContent = '$0.00';
        return;
    }
    
    let total = 0;
    cartItems.innerHTML = '';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="item-info">
                <div style="font-weight: 600;">${item.name}</div>
                <div style="color: #6b7280; font-size: 0.9rem;">$${item.price.toFixed(2)} x ${item.quantity}</div>
            </div>
            <div class="item-controls">
                <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                <span style="margin: 0 10px; font-weight: 600;">${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                <button class="qty-btn" onclick="removeFromCart(${item.id})" style="background: #dc2626; margin-left: 10px;">×</button>
            </div>
        `;
        
        cartItems.appendChild(cartItem);
    });
    
    totalAmount.textContent = `$${total.toFixed(2)}`;
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);
    
    if (item) {
        const newQuantity = item.quantity + change;
        
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else if (newQuantity <= product.stock) {
            item.quantity = newQuantity;
            updateCartDisplay();
        } else {
            alert('Not enough stock available!');
        }
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
}

function clearCart() {
    cart = [];
    updateCartDisplay();
}

// Checkout
function checkout() {
    if (cart.length === 0) {
        alert('Cart is empty!');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = total * (settings.taxRate / 100);
    const totalWithTax = total + tax;
    document.getElementById('modalTotal').textContent = totalWithTax.toFixed(2);
    document.getElementById('amountReceived').value = totalWithTax.toFixed(2);
    document.getElementById('changeAmount').textContent = '0.00';
    document.getElementById('checkoutModal').style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.style.display = 'none';
}

function completeSale() {
    const total = parseFloat(document.getElementById('modalTotal').textContent);
    const received = parseFloat(document.getElementById('amountReceived').value);
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    if (received < total) {
        alert('Insufficient payment amount!');
        return;
    }
    
    const change = received - total;
    document.getElementById('changeAmount').textContent = change.toFixed(2);
    
    // Calculate profit
    let profit = 0;
    cart.forEach(item => {
        const stockItem = supplierStock.find(s => s.name === item.name && s.category === item.category);
        const basePrice = stockItem ? stockItem.basePrice : item.price;
        profit += (item.price - basePrice) * item.quantity;
    });
    
    // Update stock
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
            product.stock -= item.quantity;
        }
    });
    
    // Add transaction
    transactions.push({
        time: new Date().toLocaleString(),
        items: cart.length,
        total: total,
        paymentMethod: paymentMethod,
        products: [...cart],
        profit: profit
    });
    
    // Clear cart and close modal
    clearCart();
    closeModal();
    updateProductGrid();
    
    alert(`Sale completed! Change: $${change.toFixed(2)}`);
}

// Calculate change
function setupChangeCalculation() {
    const amountReceived = document.getElementById('amountReceived');
    if (amountReceived) {
        amountReceived.addEventListener('input', function() {
            const total = parseFloat(document.getElementById('modalTotal').textContent);
            const received = parseFloat(this.value) || 0;
            const change = Math.max(0, received - total);
            document.getElementById('changeAmount').textContent = change.toFixed(2);
        });
    }
}

// Inventory management
function addProduct(event) {
    event.preventDefault();
    
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const category = document.getElementById('productCategory').value;
    
    // Check if product exists in supplier stock
    const stockItem = supplierStock.find(s => s.name === name && s.category === category);
    if (!stockItem) {
        alert('Product not found in supplier stock. Please add to stock first.');
        return;
    }
    
    products.push({
        id: currentId++,
        name: name,
        price: price,
        stock: stock,
        category: category
    });
    
    // Remove from supplier stock
    stockItem.quantity -= stock;
    if (stockItem.quantity <= 0) {
        supplierStock = supplierStock.filter(s => s.id !== stockItem.id);
    }
    
    // Clear form
    document.getElementById('productForm').reset();
    
    updateProductGrid();
    updateInventoryTable();
    updateStockTable();
    alert('Product added successfully!');
}

function updateInventoryTable() {
    const table = document.getElementById('inventoryTable');
    if (!table) return;
    
    table.innerHTML = '';
    
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>
                <button class="btn" onclick="editProduct(${product.id})" style="padding: 5px 10px; margin-right: 5px;">Edit</button>
                <button class="btn btn-danger" onclick="deleteProduct(${product.id})" style="padding: 5px 10px;">Delete</button>
            </td>
        `;
        table.appendChild(row);
    });
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        const newName = prompt('Enter new name:', product.name);
        const newPrice = prompt('Enter new price:', product.price);
        const newStock = prompt('Enter new stock:', product.stock);
        
        if (newName && newPrice && newStock) {
            product.name = newName;
            product.price = parseFloat(newPrice);
            product.stock = parseInt(newStock);
            
            updateInventoryTable();
            updateProductGrid();
            alert('Product updated successfully!');
        }
    }
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== id);
        updateInventoryTable();
        updateProductGrid();
        alert('Product deleted successfully!');
    }
}

// Supplier stock management
function addStockProduct(event) {
    event.preventDefault();
    
    const name = document.getElementById('stockProductName').value;
    const basePrice = parseFloat(document.getElementById('stockBasePrice').value);
    const quantity = parseInt(document.getElementById('stockQuantity').value);
    const category = document.getElementById('stockCategory').value;
    
    supplierStock.push({
        id: stockId++,
        name: name,
        basePrice: basePrice,
        quantity: quantity,
        category: category
    });
    
    // Clear form
    document.getElementById('stockForm').reset();
    
    updateStockTable();
    alert('Product added to stock successfully!');
}

function updateStockTable() {
    const table = document.getElementById('stockTable');
    if (!table) return;
    
    table.innerHTML = '';
    
    supplierStock.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.basePrice.toFixed(2)}</td>
            <td>${product.quantity}</td>
            <td>${product.category}</td>
            <td>
                <button class="btn" onclick="editStockProduct(${product.id})" style="padding: 5px 10px; margin-right: 5px;">Edit</button>
                <button class="btn btn-danger" onclick="deleteStockProduct(${product.id})" style="padding: 5px 10px;">Delete</button>
            </td>
        `;
        table.appendChild(row);
    });
}

function editStockProduct(id) {
    const product = supplierStock.find(p => p.id === id);
    if (product) {
        const newName = prompt('Enter new name:', product.name);
        const newBasePrice = prompt('Enter new base price:', product.basePrice);
        const newQuantity = prompt('Enter new quantity:', product.quantity);
        
        if (newName && newBasePrice && newQuantity) {
            product.name = newName;
            product.basePrice = parseFloat(newBasePrice);
            product.quantity = parseInt(newQuantity);
            
            updateStockTable();
            alert('Stock product updated successfully!');
        }
    }
}

function deleteStockProduct(id) {
    if (confirm('Are you sure you want to delete this stock product?')) {
        supplierStock = supplierStock.filter(p => p.id !== id);
        updateStockTable();
        alert('Stock product deleted successfully!');
    }
}

// Reports
function updateReports() {
    const today = new Date().toDateString();
    const todayTransactions = transactions.filter(t => 
        new Date(t.time).toDateString() === today
    );
    
    const todaySales = todayTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalProfit = todayTransactions.reduce((sum, t) => sum + (t.profit || 0), 0);
    const totalTransactions = todayTransactions.length;
    
    // Find top selling product
    const productSales = {};
    todayTransactions.forEach(transaction => {
        transaction.products.forEach(product => {
            if (productSales[product.name]) {
                productSales[product.name] += product.quantity;
            } else {
                productSales[product.name] = product.quantity;
            }
        });
    });
    
    const topProduct = Object.keys(productSales).length > 0 
        ? Object.keys(productSales).reduce((a, b) => productSales[a] > productSales[b] ? a : b)
        : '-';
    
    const lowStock = products.filter(p => p.stock <= settings.lowStockAlert).length;
    
    const todaySalesElement = document.getElementById('todaySales');
    const totalTransactionsElement = document.getElementById('totalTransactions');
    const topProductElement = document.getElementById('topProduct');
    const lowStockElement = document.getElementById('lowStock');
    const totalProfitElement = document.getElementById('totalProfit');
    
    if (todaySalesElement) todaySalesElement.textContent = `${todaySales.toFixed(2)}`;
    if (totalTransactionsElement) totalTransactionsElement.textContent = totalTransactions;
    if (topProductElement) topProductElement.textContent = topProduct;
    if (lowStockElement) lowStockElement.textContent = lowStock;
    if (totalProfitElement) totalProfitElement.textContent = `${totalProfit.toFixed(2)}`;
    
    // Update transaction table
    const transactionTable = document.getElementById('transactionTable');
    if (transactionTable) {
        transactionTable.innerHTML = '';
        transactions.slice(-10).reverse().forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.time}</td>
                <td>${transaction.items} items</td>
                <td>${transaction.total.toFixed(2)}</td>
                <td>${transaction.paymentMethod}</td>
            `;
            transactionTable.appendChild(row);
        });
    }
}

// Settings
function saveStoreSettings(event) {
    event.preventDefault();
    settings.storeName = document.getElementById('storeName').value;
    settings.storeAddress = document.getElementById('storeAddress').value;
    settings.storePhone = document.getElementById('storePhone').value;
    alert('Store settings saved!');
}

function updatePaymentSettings(event) {
    event.preventDefault();
    settings.taxRate = parseFloat(document.getElementById('taxRate').value);
    settings.currency = document.getElementById('currency').value;
    settings.lowStockAlert = parseInt(document.getElementById('lowStockAlert').value);
    alert('Payment settings updated!');
    updateReports();
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkLogin();
    
    updateProductGrid();
    updateInventoryTable();
    updateStockTable();
    updateReports();
    setupChangeCalculation();
    
    // Populate settings
    const storeName = document.getElementById('storeName');
    const storeAddress = document.getElementById('storeAddress');
    const storePhone = document.getElementById('storePhone');
    const taxRate = document.getElementById('taxRate');
    const currency = document.getElementById('currency');
    const lowStockAlert = document.getElementById('lowStockAlert');
    
    if (storeName) storeName.value = settings.storeName;
    if (storeAddress) storeAddress.value = settings.storeAddress;
    if (storePhone) storePhone.value = settings.storePhone;
    if (taxRate) taxRate.value = settings.taxRate;
    if (currency) currency.value = settings.currency;
    if (lowStockAlert) lowStockAlert.value = settings.lowStockAlert;
    
    // Sample transactions for demo
    transactions.push(
        {
            time: new Date(Date.now() - 1000 * 60 * 30).toLocaleString(),
            items: 3,
            total: 8.47,
            paymentMethod: 'Cash',
            products: [],
            profit: 0
        },
        {
            time: new Date(Date.now() - 1000 * 60 * 60).toLocaleString(),
            items: 2,
            total: 5.98,
            paymentMethod: 'Credit Card',
            products: [],
            profit: 0
        },
        {
            time: new Date(Date.now() - 1000 * 60 * 90).toLocaleString(),
            items: 1,
            total: 2.99,
            paymentMethod: 'Cash',
            products: [],
            profit: 0
        }
    );
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('checkoutModal');
    if (modal && event.target === modal) {
        closeModal();
    }
}