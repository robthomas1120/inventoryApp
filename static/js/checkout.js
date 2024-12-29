let inventory = [];
let cart = [];

function fetchInventory() {
    fetch('/items')
        .then(response => response.json())
        .then(data => {
            inventory = data;
            displayInventory();
        });
}

function displayInventory() {
    const inventoryList = document.getElementById('inventory');
    inventoryList.innerHTML = '';

    inventory.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item[1]} - ${item[2]} (Stock: ${item[4]})</span>
            <button onclick="addToCart(${item[0]})">Add to Cart</button>
        `;
        inventoryList.appendChild(li);
    });
}

function addToCart(itemId) {
    const item = inventory.find(item => item[0] === itemId);
    if (item && item[4] > 0) {
        const cartItem = cart.find(i => i.id === itemId);
        if (cartItem) {
            cartItem.quantity++;
        } else {
            cart.push({
                id: itemId,
                name: item[1],
                type: item[2].toLowerCase(),
                quantity: 1,
                price: item[5] || 0 // Use the price from the inventory item
            });
        }
        item[4]--; // Decrease the stock in the inventory
        updateCart();
    }
}

function removeFromCart(itemId) {
    const cartItem = cart.find(i => i.id === itemId);
    if (cartItem) {
        cartItem.quantity--;
        if (cartItem.quantity === 0) {
            cart = cart.filter(i => i.id !== itemId);
        }
    }
    const inventoryItem = inventory.find(i => i[0] === itemId);
    if (inventoryItem) {
        inventoryItem[4]++; // Return stock to the inventory
    }
    updateCart();
}

function updateCart() {
    const cartItems = document.getElementById('cart-items');
    const totalPrice = document.getElementById('total-price');
    
    cartItems.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${item.name} - ${item.quantity} x ₱${item.price.toFixed(2)} 
            = ₱${(item.quantity * item.price).toFixed(2)}
            <button onclick="removeFromCart(${item.id})">Remove</button>
        `;
        cartItems.appendChild(li);
        total += item.quantity * item.price;
    });

    totalPrice.textContent = total.toFixed(2);
}

function checkout() {
    const customerName = document.getElementById('customer-name').value;
    const phoneNumber = document.getElementById('phone-number').value;

    if (!customerName || !phoneNumber) {
        alert('Please enter customer information.');
        return;
    }

    const itemsCheckedOut = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
    }));

    const data = {
        customer_name: customerName,
        phone_number: phoneNumber,
        items: itemsCheckedOut,
        total: parseFloat(document.getElementById('total-price').textContent),
        timestamp: new Date().toISOString(),
    };

    fetch('/checkout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        alert('Checkout successful!');
        window.location.href = '/history';
    });
}

// Load inventory on page load
window.onload = fetchInventory;
