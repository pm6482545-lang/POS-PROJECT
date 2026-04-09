// 1. Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAc1vaJz5-Vp4uVNq_1U4MYbS79GyaW3Cs",
  authDomain: "elevation-pillar-pos.firebaseapp.com",
  projectId: "elevation-pillar-pos",
  storageBucket: "elevation-pillar-pos.firebasestorage.app",
  messagingSenderId: "260101635045",
  appId: "1:260101635045:web:effcf6f4c69dc96b6d4d0c",
  measurementId: "G-QMCLQ1377J"
};

// 2. Import SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, increment, deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 3. NAVIGATION ---
window.showTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    // Finds the button that was clicked to add active class
    const activeBtn = Array.from(document.querySelectorAll('.nav-btn')).find(btn => btn.getAttribute('onclick').includes(tabId));
    if (activeBtn) activeBtn.classList.add('active');
};

// --- 4. MODAL LOGIC ---
window.toggleModal = function(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
};

// --- 5. INVENTORY ACTIONS (Add & Delete) ---
const addProductForm = document.getElementById('add-product-form');
if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = e.target.querySelector('.save-btn');
        saveBtn.innerText = "Processing...";
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
            toggleModal('add-product-modal');
            addProductForm.reset();
        } catch (err) { alert("Error adding product: " + err.message); }
        finally { saveBtn.innerText = "Confirm and Add to Shelves"; saveBtn.disabled = false; }
    });
}

window.deleteProduct = async function(id) {
    if(confirm("Are you sure you want to remove this book from inventory?")) {
        await deleteDoc(doc(db, "products", id));
    }
};

// --- 6. REAL-TIME DATA SYNC ---
onSnapshot(query(collection(db, "products"), orderBy("created", "desc")), (snapshot) => {
    const tableBody = document.getElementById('inventory-table-body');
    const productGrid = document.getElementById('product-list');
    let lowStock = 0;
    
    if (tableBody) tableBody.innerHTML = '';
    if (productGrid) productGrid.innerHTML = '';

    snapshot.forEach((doc) => {
        const item = doc.data();
        if (item.stock <= 5) lowStock++;
        
        // Populate Inventory Table
        if (tableBody) {
            tableBody.innerHTML += `
                <tr>
                    <td><strong>${item.name}</strong></td>
                    <td>${item.category}</td>
                    <td>Ksh ${item.cost}</td>
                    <td>Ksh ${item.price}</td>
                    <td>${item.stock}</td>
                    <td><span class="status-badge ${item.stock > 5 ? 'online' : 'warning'}"></span> ${item.stock > 5 ? 'In Stock' : 'Low'}</td>
                    <td><button onclick="deleteProduct('${doc.id}')" style="cursor:pointer; font-size:1.2rem; border:none; background:none;">🗑️</button></td>
                </tr>`;
        }

        // Populate Checkout Grid (The Books)
        if (productGrid) {
            productGrid.innerHTML += `
                <div class="product-card" onclick="addToCart('${doc.id}', '${item.name}', ${item.price})">
                    <div class="card-icon">📚</div>
                    <h4>${item.name}</h4>
                    <p class="price-tag">Ksh ${item.price}</p>
                    <small class="stock-tag">${item.stock} left</small>
                </div>`;
        }
    });
    
    if(document.getElementById('low-stock-count')) {
        document.getElementById('low-stock-count').innerText = lowStock;
    }
});

// --- 7. CART & PAYMENT LOGIC ---
let cart = [];

window.addToCart = function(id, name, price) {
    cart.push({ id, name, price });
    updateCartUI();
};

window.clearCart = function() {
    cart = [];
    updateCartUI();
};

function updateCartUI() {
    const cartItemsDiv = document.getElementById('cart-items');
    let subtotal = 0;
    
    if(cartItemsDiv) {
        cartItemsDiv.innerHTML = cart.map((item) => {
            subtotal += item.price;
            return `<div class="summary-line"><span>${item.name}</span><span>Ksh ${item.price}</span></div>`;
        }).join('');
    }

    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    document.getElementById('subtotal').innerText = `Ksh ${subtotal.toFixed(2)}`;
    document.getElementById('tax').innerText = `Ksh ${tax.toFixed(2)}`;
    document.getElementById('grand-total').innerText = `Ksh ${total.toFixed(2)}`;
}

window.processPayment = async function(method) {
    if (cart.length === 0) return alert("Please select a book first!");

    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const total = subtotal * 1.16;

    try {
        await addDoc(collection(db, "sales"), {
            items: cart,
            total: total,
            method: method,
            timestamp: new Date()
        });

        for (const item of cart) {
            await updateDoc(doc(db, "products", item.id), { stock: increment(-1) });
        }

        alert(`✅ ${method.toUpperCase()} Payment Recorded!`);
        clearCart();
    } catch (err) { alert("Payment Error: " + err.message); }
};

// --- 8. REPORTS & ANALYTICS ---
onSnapshot(collection(db, "sales"), (snapshot) => {
    let revenue = 0;
    let transactions = 0;
    const historyDiv = document.getElementById('sales-history-list');
    if(historyDiv) historyDiv.innerHTML = '';

    snapshot.forEach((doc) => {
        const sale = doc.data();
        revenue += sale.total;
        transactions++;

        if(historyDiv) {
            const time = sale.timestamp?.toDate().toLocaleTimeString() || "Just now";
            historyDiv.innerHTML += `
                <div style="background:white; padding:12px; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; border:1px solid #eee;">
                    <div><strong>${sale.method.toUpperCase()}</strong><br><small>${time}</small></div>
                    <span style="color:#22c55e; font-weight:700;">+Ksh ${sale.total.toFixed(2)}</span>
                </div>`;
        }
    });

    if(document.getElementById('report-sales')) document.getElementById('report-sales').innerText = `Ksh ${revenue.toFixed(2)}`;
    if(document.getElementById('report-orders')) document.getElementById('report-orders').innerText = transactions;
    if(document.getElementById('report-profit')) document.getElementById('report-profit').innerText = `Ksh ${(revenue * 0.25).toFixed(2)}`;
});
