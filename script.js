// API Configuration - UPDATE THIS WITH YOUR ACTUAL API URL
const API_CONFIG = {
    baseURL: 'http://localhost:8080', // Replace with your actual API URL
    endpoints: {
        login: '/auth/login',
        categories: '/categories',
        stockProducts: '/stock/products',
        stockProductsAvailable: '/stock/products/available',
        inventoryProducts: '/inventory/products',
        purchases: '/product/purchases',
        dailyReport: '/reports/daily-summary'
    }
};

// Auth state management
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// Application state
let categories = [];
let stockProducts = [];
let inventoryProducts = [];
let cart = [];
let transactions = [];
let settings = {
    storeName: "Mini Mart",
    storeAddress: "123 Main Street, City, State 12345",
    storePhone: "",
    taxRate: 0,
    currency: "USD",
    lowStockAlert: 10
};

// API Service Class
class ApiService {
    static async request(endpoint, options = {}) {
        const url = `${API_CONFIG.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.logout();
                    throw new Error('Authentication required');
                }
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    static async login(email, password) {
        const response = await this.request(API_CONFIG.endpoints.login, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response.token || response.accessToken) {
            authToken = response.token || response.accessToken;
            localStorage.setItem('authToken', authToken);
            currentUser = response.user || { email };
            return response;
        }
        throw new Error('Invalid login response');
    }

    static logout() {
        authToken = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        window.location.href = './pages/login.html';
    }

    // Categories API
    static async getCategories() {
        return await this.request(API_CONFIG.endpoints.categories);
    }

    static async createCategory(categoryData) {
        return await this.request(API_CONFIG.endpoints.categories, {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
    }

    static async updateCategory(id, categoryData) {
        return await this.request(`${API_CONFIG.endpoints.categories}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData)
        });
    }

    static async deleteCategory(id) {
        return await this.request(`${API_CONFIG.endpoints.categories}/${id}`, {
            method: 'DELETE'
        });
    }

    // Stock Products API
    static async getStockProducts() {
        return await this.request(API_CONFIG.endpoints.stockProducts);
    }

    static async getAvailableStockProducts() {
        return await this.request(API_CONFIG.endpoints.stockProductsAvailable);
    }

    static async createStockProduct(productData) {
        return await this.request(API_CONFIG.endpoints.stockProducts, {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    static async updateStockProduct(id, productData) {
        return await this.request(`${API_CONFIG.endpoints.stockProducts}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    }

    static async deleteStockProduct(id) {
        return await this.request(`${API_CONFIG.endpoints.stockProducts}/${id}`, {
            method: 'DELETE'
        });
    }

    // Inventory Products API
    static async getInventoryProducts() {
        return await this.request(API_CONFIG.endpoints.inventoryProducts);
    }

    static async createInventoryProduct(productData) {
        return await this.request(API_CONFIG.endpoints.inventoryProducts, {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    static async updateInventoryProduct(id, productData) {
        return await this.request(`${API_CONFIG.endpoints.inventoryProducts}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    }

    static async returnInventoryToStock(id) {
        return await this.request(`${API_CONFIG.endpoints.inventoryProducts}/return-to-stock/${id}`, {
            method: 'DELETE'
        });
    }

    // Purchase API
    static async createPurchase(purchaseData) {
        return await this.request(API_CONFIG.endpoints.purchases, {
            method: 'POST',
            body: JSON.stringify(purchaseData)
        });
    }

    // Reports API
    static async getDailyReport() {
        return await this.request(API_CONFIG.endpoints.dailyReport);
    }
}

// Authentication Functions
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        showLoading(true);
        await ApiService.login(email, password);
        window.location.href = '../index.html';
    } catch (error) {
        alert('Login failed: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function checkAuth() {
    if (!authToken && !window.location.pathname.includes('login.html')) {
        window.location.href = './pages/login.html';
        return false;
    }
    return true;
}

// Data Initialization
async function initializeData() {
    try {
        showLoading(true);
        
        const [categoriesData, stockData, inventoryData] = await Promise.all([
            ApiService.getCategories(),
            ApiService.getStockProducts(),
            ApiService.getInventoryProducts()
        ]);
        
        categories = categoriesData;
        stockProducts = stockData;
        inventoryProducts = inventoryData;
        
        updateCategoryDropdowns();
        updateProductGrid();
        updateInventoryTable();
        updateStockTable();
        
    } catch (error) {
        console.error('Failed to initialize data:', error);
        alert('Failed to load data: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Product Grid Management
function updateProductGrid(productsToShow = inventoryProducts) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (productsToShow.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #6b7280;">No products available</div>';
        return;
    }
    
    productsToShow.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.onclick = () => addToCart(product);
        
        const finalPrice = product.salePrice * (1 - (product.discount || 0));
        
        productCard.innerHTML = `
            <div class="product-name">${product.stockProduct?.name || 'Unknown Product'}</div>
            <div class="product-price">$${finalPrice.toFixed(2)}</div>
            ${product.discount > 0 ? `<div style="font-size: 0.8rem; color: #dc2626; text-decoration: line-through;">$${product.salePrice.toFixed(2)}</div>` : ''}
            <div style="font-size: 0.8rem; color: #6b7280; margin-top: 5px;">Stock: ${product.saleQuantity || 0}</div>
        `;
        
        grid.appendChild(productCard);
    });
}

function searchProducts(query) {
    const filtered = inventoryProducts.filter(product => {
        const name = product.stockProduct?.name || '';
        const category = product.stockProduct?.category?.name || '';
        return name.toLowerCase().includes(query.toLowerCase()) ||
               category.toLowerCase().includes(query.toLowerCase());
    });
    updateProductGrid(filtered);
}

// Cart Management
function addToCart(product) {
    const availableStock = product.saleQuantity || 0;
    
    if (availableStock <= 0) {
        alert('Product out of stock!');
        return;
    }
    
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        if (existingItem.quantity < availableStock) {
            existingItem.quantity++;
        } else {
            alert('Not enough stock available!');
            return;
        }
    } else {
        const finalPrice = product.salePrice * (1 - (product.discount || 0));
        cart.push({
            id: product.id,
            productInventoryId: product.id,
            name: product.stockProduct?.name || 'Unknown Product',
            price: finalPrice,
            originalPrice: product.salePrice,
            discount: product.discount || 0,
            quantity: 1,
            maxStock: availableStock
        });
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
    
    // Add tax
    const tax = total * (settings.taxRate / 100);
    const totalWithTax = total + tax;
    
    totalAmount.textContent = `$${totalWithTax.toFixed(2)}`;
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        const newQuantity = item.quantity + change;
        
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else if (newQuantity <= item.maxStock) {
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

// Checkout Functions
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

async function completeSale() {
    const total = parseFloat(document.getElementById('modalTotal').textContent);
    const received = parseFloat(document.getElementById('amountReceived').value);
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    if (received < total) {
        alert('Insufficient payment amount!');
        return;
    }
    
    try {
        showLoading(true);
        
        // Prepare purchase data according to API format
        const purchaseData = {
            items: cart.map(item => ({
                productInventoryId: item.productInventoryId,
                quantity: item.quantity
            }))
        };
        
        // Submit purchase to API
        await ApiService.createPurchase(purchaseData);
        
        const change = received - total;
        
        // Add to local transactions for immediate UI update
        transactions.push({
            time: new Date().toLocaleString(),
            items: cart.length,
            total: total,
            paymentMethod: paymentMethod,
            products: [...cart]
        });
        
        // Clear cart and close modal
        clearCart();
        closeModal();
        
        // Refresh inventory data
        await initializeData();
        
        alert(`Sale completed successfully! Change: $${change.toFixed(2)}`);
        
    } catch (error) {
        console.error('Purchase failed:', error);
        alert('Sale failed: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function closeModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.style.display = 'none';
}

// Stock Product Management
async function addStockProduct(event) {
    event.preventDefault();
    
    const name = document.getElementById('stockProductName').value;
    const basePrice = parseFloat(document.getElementById('stockBasePrice').value);
    const quantity = parseInt(document.getElementById('stockQuantity').value);
    const categoryId = parseInt(document.getElementById('stockCategory').value);
    
    const productData = {
        name,
        description: `Added on ${new Date().toLocaleDateString()}`,
        basePrice,
        quantity,
        categoryId
    };
    
    try {
        showLoading(true);
        await ApiService.createStockProduct(productData);
        
        document.getElementById('stockForm').reset();
        await initializeData();
        
        alert('Product added to stock successfully!');
    } catch (error) {
        alert('Failed to add product: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function editStockProduct(id) {
    const product = stockProducts.find(p => p.id === id);
    if (!product) return;
    
    const newName = prompt('Enter new name:', product.name);
    const newBasePrice = prompt('Enter new base price:', product.basePrice);
    const newQuantity = prompt('Enter new quantity:', product.quantity);
    
    if (newName && newBasePrice && newQuantity) {
        const updateData = {
            name: newName,
            description: product.description,
            basePrice: parseFloat(newBasePrice),
            quantity: parseInt(newQuantity),
            categoryId: product.categoryId
        };
        
        try {
            showLoading(true);
            await ApiService.updateStockProduct(id, updateData);
            await initializeData();
            alert('Stock product updated successfully!');
        } catch (error) {
            alert('Failed to update product: ' + error.message);
        } finally {
            showLoading(false);
        }
    }
}

async function deleteStockProduct(id) {
    if (!confirm('Are you sure you want to delete this stock product?')) return;
    
    try {
        showLoading(true);
        await ApiService.deleteStockProduct(id);
        await initializeData();
        alert('Stock product deleted successfully!');
    } catch (error) {
        alert('Failed to delete product: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Inventory Product Management
async function addInventoryProduct(event) {
    event.preventDefault();
    
    const stockProductId = parseInt(document.getElementById('inventoryStockProduct').value);
    const salePrice = parseFloat(document.getElementById('inventorySalePrice').value);
    const saleQuantity = parseInt(document.getElementById('inventorySaleQuantity').value);
    const discount = parseFloat(document.getElementById('inventoryDiscount').value) || 0;
    
    const productData = {
        stockProductId,
        salePrice,
        saleQuantity,
        discount
    };
    
    try {
        showLoading(true);
        await ApiService.createInventoryProduct(productData);
        
        document.getElementById('inventoryForm').reset();
        await initializeData();
        
        alert('Product added to inventory successfully!');
    } catch (error) {
        alert('Failed to add to inventory: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function editInventoryProduct(id) {
    const product = inventoryProducts.find(p => p.id === id);
    if (!product) return;
    
    const newSalePrice = prompt('Enter new sale price:', product.salePrice);
    const newSaleQuantity = prompt('Enter new sale quantity:', product.saleQuantity);
    const newDiscount = prompt('Enter new discount (0-1):', product.discount || 0);
    
    if (newSalePrice && newSaleQuantity && newDiscount !== null) {
        const updateData = {
            stockProductId: product.stockProductId,
            salePrice: parseFloat(newSalePrice),
            saleQuantity: parseInt(newSaleQuantity),
            discount: parseFloat(newDiscount)
        };
        
        try {
            showLoading(true);
            await ApiService.updateInventoryProduct(id, updateData);
            await initializeData();
            alert('Product updated successfully!');
        } catch (error) {
            alert('Failed to update product: ' + error.message);
        } finally {
            showLoading(false);
        }
    }
}

async function returnToStock(id) {
    if (!confirm('Are you sure you want to return this product to stock?')) return;
    
    try {
        showLoading(true);
        await ApiService.returnInventoryToStock(id);
        await initializeData();
        alert('Product returned to stock successfully!');
    } catch (error) {
        alert('Failed to return product to stock: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Table Updates
function updateInventoryTable() {
    const table = document.getElementById('inventoryTable');
    if (!table) return;
    
    if (inventoryProducts.length === 0) {
        table.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No inventory products found</td></tr>';
        return;
    }
    
    table.innerHTML = '';
    
    inventoryProducts.forEach(product => {
        const finalPrice = product.salePrice * (1 - (product.discount || 0));
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.stockProduct?.name || 'Unknown'}</td>
            <td>$${product.salePrice.toFixed(2)}</td>
            <td>${((product.discount || 0) * 100).toFixed(1)}%</td>
            <td>$${finalPrice.toFixed(2)}</td>
            <td>${product.saleQuantity}</td>
            <td>${product.stockProduct?.category?.name || 'Unknown'}</td>
            <td>
                <button class="btn" onclick="editInventoryProduct(${product.id})" style="padding: 5px 10px; margin-right: 5px;">Edit</button>
                <button class="btn btn-danger" onclick="returnToStock(${product.id})" style="padding: 5px 10px;">Return to Stock</button>
            </td>
        `;
        table.appendChild(row);
    });
}

function updateStockTable() {
    const table = document.getElementById('stockTable');
    if (!table) return;
    
    if (stockProducts.length === 0) {
        table.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No stock products found</td></tr>';
        return;
    }
    
    table.innerHTML = '';
    
    stockProducts.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>$${product.basePrice.toFixed(2)}</td>
            <td>${product.quantity}</td>
            <td>${product.category?.name || 'Unknown'}</td>
            <td>
                <button class="btn" onclick="editStockProduct(${product.id})" style="padding: 5px 10px; margin-right: 5px;">Edit</button>
                <button class="btn btn-danger" onclick="deleteStockProduct(${product.id})" style="padding: 5px 10px;">Delete</button>
            </td>
        `;
        table.appendChild(row);
    });
}

function updateCategoryDropdowns() {
    const dropdowns = document.querySelectorAll('#stockCategory, #inventoryCategory');
    dropdowns.forEach(dropdown => {
        if (dropdown) {
            dropdown.innerHTML = '';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                dropdown.appendChild(option);
            });
        }
    });
    
    // Update stock product dropdown for inventory form
    const stockProductDropdown = document.getElementById('inventoryStockProduct');
    if (stockProductDropdown) {
        stockProductDropdown.innerHTML = '<option value="">Select a stock product...</option>';
        stockProducts.forEach(product => {
            if (product.quantity > 0) {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} (Available: ${product.quantity}) - $${product.basePrice}`;
                stockProductDropdown.appendChild(option);
            }
        });
    }
}

// Reports
async function updateReports() {
    try {
        const reportData = await ApiService.getDailyReport();
        
        const todaySalesElement = document.getElementById('todaySales');
        const totalTransactionsElement = document.getElementById('totalTransactions');
        const topProductElement = document.getElementById('topProduct');
        const lowStockElement = document.getElementById('lowStock');
        const totalProfitElement = document.getElementById('totalProfit');
        
        if (todaySalesElement) todaySalesElement.textContent = `$${(reportData.totalSales || 0).toFixed(2)}`;
        if (totalTransactionsElement) totalTransactionsElement.textContent = reportData.transactionCount || 0;
        if (topProductElement) topProductElement.textContent = reportData.topSellingProduct || '-';
        if (lowStockElement) lowStockElement.textContent = reportData.lowStockCount || 0;
        if (totalProfitElement) totalProfitElement.textContent = `$${(reportData.totalProfit || 0).toFixed(2)}`;
        
        // Update transaction table
        updateTransactionTable();
        
    } catch (error) {
        console.error('Failed to load reports:', error);
    }
}

function updateTransactionTable() {
    const transactionTable = document.getElementById('transactionTable');
    if (transactionTable && transactions.length > 0) {
        transactionTable.innerHTML = '';
        transactions.slice(-10).reverse().forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.time}</td>
                <td>${transaction.items} items</td>
                <td>$${transaction.total.toFixed(2)}</td>
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
    settings.taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    settings.currency = document.getElementById('currency').value;
    settings.lowStockAlert = parseInt(document.getElementById('lowStockAlert').value) || 10;
    alert('Payment settings updated!');
}

// Utility Functions
function showLoading(show) {
    let loader = document.getElementById('loadingIndicator');
    
    if (show && !loader) {
        loader = document.createElement('div');
        loader.id = 'loadingIndicator';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: white;
            font-size: 1.2rem;
        `;
        loader.innerHTML = '<div>Loading...</div>';
        document.body.appendChild(loader);
    } else if (!show && loader) {
        loader.remove();
    }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication first
    if (!checkAuth()) return;
    
    // Initialize data from API
    await initializeData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load reports if on reports page
    if (window.location.pathname.includes('report.html')) {
        await updateReports();
    }
    
    // Populate settings
    populateSettings();
});

function setupEventListeners() {
    // Change calculation for checkout
    const amountReceived = document.getElementById('amountReceived');
    if (amountReceived) {
        amountReceived.addEventListener('input', function() {
            const total = parseFloat(document.getElementById('modalTotal').textContent);
            const received = parseFloat(this.value) || 0;
            const change = Math.max(0, received - total);
            document.getElementById('changeAmount').textContent = change.toFixed(2);
        });
    }
    
    // Stock product selection for inventory
    const stockProductSelect = document.getElementById('inventoryStockProduct');
    if (stockProductSelect) {
        stockProductSelect.addEventListener('change', function() {
            const selectedProductId = parseInt(this.value);
            const stockProduct = stockProducts.find(p => p.id === selectedProductId);
            
            if (stockProduct) {
                const quantityInput = document.getElementById('inventorySaleQuantity');
                quantityInput.max = stockProduct.quantity;
                quantityInput.placeholder = `Max: ${stockProduct.quantity}`;
                
                const salePriceInput = document.getElementById('inventorySalePrice');
                if (!salePriceInput.value) {
                    salePriceInput.value = (stockProduct.basePrice * 1.3).toFixed(2);
                }
            }
        });
    }
}

function populateSettings() {
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
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('checkoutModal');
    if (modal && event.target === modal) {
        closeModal();
    }
}

// Error handling
window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
    if (event.reason.message.includes('Authentication required')) {
        ApiService.logout();
    }
});