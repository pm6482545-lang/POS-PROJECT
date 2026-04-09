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
