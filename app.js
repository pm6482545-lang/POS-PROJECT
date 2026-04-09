3// 1. Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAc1vaJz5-Vp4uVNq_1U4MYbS79GyaW3Cs",
  authDomain: "elevation-pillar-pos.firebaseapp.com",
  projectId: "elevation-pillar-pos",
  storageBucket: "elevation-pillar-pos.firebasestorage.app",
  messagingSenderId: "260101635045",
  appId: "1:260101635045:web:effcf6f4c69dc96b6d4d0c",
  measurementId: "G-QMCLQ1377J"
};

// 2. Import SDKs (Database + App)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Initialize Firebase & Database
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 3. NAVIGATION (Switching Tabs) ---
window.showTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    if (event) event.currentTarget.classList.add('active');
};

// --- 4. MODAL LOGIC ---
window.toggleModal = function(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
};

// --- 5. INVENTORY: Save Book to Cloud ---
const addProductForm = document.getElementById('add-product-form');
if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const saveBtn = e.target.querySelector('.save-btn');
        saveBtn.innerText = "Saving...";
        saveBtn.disabled = true;

        const product = {
            name: document.getElementById('modal-name').value,
            category: document.getElementById('modal-category').value,
            cost: parseFloat(document.getElementById('modal-cost').value),
            price: parseFloat(document.getElementById('modal-price').value),
            stock: parseInt(document.getElementById('modal-stock').value),
            created: new Date()
        };

        try {
            await addDoc(collection(db, "products"), product);
            alert("✅ Book added to shelves!");
            toggleModal('add-product-modal');
            addProductForm.reset();
        } catch (err) {
            alert("❌ Error: " + err.message);
        } finally {
            saveBtn.innerText = "Save Product";
            saveBtn.disabled = false;
        }
    });
}

// --- 6. REAL-TIME SYNC: Update UI when Database changes ---
onSnapshot(query(collection(db, "products"), orderBy("created", "desc")), (snapshot) => {
    const tableBody = document.getElementById('inventory-table-body');
    const productGrid = document.getElementById('product-list');
    
    if (tableBody) tableBody.innerHTML = '';
    if (productGrid) productGrid.innerHTML = '';

    snapshot.forEach((doc) => {
        const item = doc.data();
        
        // Add to Inventory Management Table
        if (tableBody) {
            tableBody.innerHTML += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.category}</td>
                    <td>Ksh ${item.cost}</td>
                    <td>Ksh ${item.price}</td>
                    <td>${item.stock}</td>
                    <td><button style="border:none; background:none; cursor:pointer;">🗑️</button></td>
                </tr>
            `;
        }

        // Add to Point of Sale (Checkout Grid)
        if (productGrid) {
            productGrid.innerHTML += `
                <div class="product-card" style="background:white; padding:15px; border-radius:10px; border:1px solid #eee; text-align:center; cursor:pointer;" onclick="addToCart('${doc.id}', '${item.name}', ${item.price})">
                    <h4 style="margin-bottom:5px;">${item.name}</h4>
                    <p style="color:#2563eb; font-weight:bold;">Ksh ${item.price}</p>
                    <small style="color:#64748b;">${item.stock} in stock</small>
                </div>
            `;
        }
    });
});
let cart = [];

// This function runs when you click a book card
window.addToCart = function(id, name, price) {
    cart.push({ id, name, price });
    updateCartUI();
};

function updateCartUI() {
    const cartItemsDiv = document.getElementById('cart-items');
    let subtotal = 0;
    
    // Clear current cart view and rebuild it
    if(cartItemsDiv) {
        cartItemsDiv.innerHTML = cart.map((item, index) => {
            subtotal += item.price;
            return `<div class="cart-row" style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #eee;">
                        <span>${item.name}</span>
                        <span>Ksh ${item.price}</span>
                    </div>`;
        }).join('');
    }

    // Calculate Taxes and Totals
    const tax = subtotal * 0.16; // 16% VAT
    const total = subtotal + tax;

    // Update the numbers in your UI
    document.getElementById('subtotal').innerText = `Ksh ${subtotal.toFixed(2)}`;
    document.getElementById('tax').innerText = `Ksh ${tax.toFixed(2)}`;
    document.getElementById('grand-total').innerText = `Total: Ksh ${total.toFixed(2)}`;
}
import { doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

window.processPayment = async function(method) {
    if (cart.length === 0) return alert("Cart is empty!");

    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const total = subtotal * 1.16;

    try {
        // 1. Save Sale to Firebase
        await addDoc(collection(db, "sales"), {
            items: cart,
            total: total,
            method: method,
            timestamp: new Date()
        });

        // 2. Update Stock for each item
        for (const item of cart) {
            const productRef = doc(db, "products", item.id);
            await updateDoc(productRef, {
                stock: increment(-1)
            });
        }

        alert(`✅ ${method.toUpperCase()} Payment Successful!`);
        
        // 3. Reset Cart
        cart = [];
        updateCartUI();

    } catch (err) {
        alert("Payment Error: " + err.message);
    }
};
