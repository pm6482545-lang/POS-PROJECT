// 1. FIREBASE CONFIGURATION (Replace with your keys from Firebase Console)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};

// 2. INITIALIZE FIREBASE (We use CDN imports for mobile compatibility)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 3. NAVIGATION LOGIC (Switching Tabs)
window.showTab = function(tabId) {
    // Remove active class from all tabs and buttons
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    // Add active class to selected tab and button
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
};

// 4. MODAL LOGIC
window.toggleModal = function(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
};

// 5. INVENTORY LOGIC: Saving a New Book
const addProductForm = document.getElementById('add-product-form');
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newProduct = {
        name: document.getElementById('modal-name').value,
        category: document.getElementById('modal-category').value,
        cost: parseFloat(document.getElementById('modal-cost').value),
        price: parseFloat(document.getElementById('modal-price').value),
        stock: parseInt(document.getElementById('modal-stock').value),
        timestamp: new Date()
    };

    try {
        await addDoc(collection(db, "products"), newProduct);
        alert("Book added to shelves successfully!");
        toggleModal('add-product-modal');
        addProductForm.reset();
    } catch (error) {
        console.error("Error adding product: ", error);
        alert("Failed to save. Check internet connection.");
    }
});

// 6. REAL-TIME INVENTORY SYNC
// This updates your Inventory table automatically when data changes in Firebase
onSnapshot(collection(db, "products"), (snapshot) => {
    const tableBody = document.getElementById('inventory-table-body');
    const productList = document.getElementById('product-list');
    tableBody.innerHTML = '';
    productList.innerHTML = '';

    snapshot.forEach((doc) => {
        const item = doc.data();
        
        // Update Inventory Table
        tableBody.innerHTML += `
            <tr>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>Ksh ${item.cost}</td>
                <td>Ksh ${item.price}</td>
                <td class="${item.stock < 5 ? 'text-danger' : ''}">${item.stock}</td>
                <td><button onclick="editItem('${doc.id}')">Edit</button></td>
            </tr>
        `;

        // Update Checkout Grid (The Selling UI)
        productList.innerHTML += `
            <div class="product-card" onclick="addToCart('${doc.id}', '${item.name}', ${item.price}, ${item.cost})">
                <h4>${item.name}</h4>
                <p>Ksh ${item.price}</p>
            </div>
        `;
    });
});

// 7. CART & PROFIT LOGIC
let cart = [];
window.addToCart = function(id, name, price, cost) {
    cart.push({ id, name, price, cost });
    updateCartUI();
};

function updateCartUI() {
    const cartItemsDiv = document.getElementById('cart-items');
    let subtotal = 0;
    
    cartItemsDiv.innerHTML = cart.map((item, index) => {
        subtotal += item.price;
        return `<div class="cart-item">${item.name} - Ksh ${item.price}</div>`;
    }).join('');

    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    document.getElementById('subtotal').innerText = `Ksh ${subtotal.toFixed(2)}`;
    document.getElementById('tax').innerText = `Ksh ${tax.toFixed(2)}`;
    document.getElementById('grand-total').innerText = `Total: Ksh ${total.toFixed(2)}`;
}

// 8. PAYMENT & M-PESA PLACEHOLDER
window.processPayment = function(method) {
    if (cart.length === 0) return alert("Cart is empty!");

    if (method === 'mpesa') {
        alert("Initiating M-Pesa STK Push... Please check your phone.");
        // Future Phase: Add Daraja API Trigger here
    } else {
        alert("Cash Payment Confirmed.");
        // Future Phase: Deduct stock and clear cart
        cart = [];
        updateCartUI();
    }
};
