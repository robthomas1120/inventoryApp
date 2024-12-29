let inventory = [];
let cart = [];
let filteredInventory = [];

function fetchInventory() {
    fetch('/items')
        .then(response => response.json())
        .then(data => {
            inventory = data;
            filteredInventory = [...inventory];
            displayInventory();
        });
}

function displayInventory() {
    const inventoryList = document.getElementById('inventory');
    inventoryList.innerHTML = '';

    filteredInventory.forEach(item => {
        const li = document.createElement('li');
        li.className = 'inventory-item';
        li.innerHTML = `
            <img src="${item[3]}" alt="${item[1]}" class="item-image">
            <div class="item-details">
                <h3>${item[1]} - ${item[2]}</h3>
                <p>Price: ₱${item[5].toFixed(2)}</p>
                <p>Stock: ${item[4]}</p>
            </div>
            <input type="number" 
                   min="0" 
                   max="${item[4]}" 
                   value="0" 
                   class="quantity-input"
                   onchange="updateCart(${item[0]}, this.value)">
        `;
        inventoryList.appendChild(li);
    });
}

function updateCart(itemId, quantity) {
    quantity = parseInt(quantity);
    const item = inventory.find(item => item[0] === itemId);
    
    // Remove existing item from cart
    cart = cart.filter(i => i.id !== itemId);
    
    // Add new quantity if greater than 0
    if (quantity > 0 && item) {
        cart.push({
            id: itemId,
            name: item[1],
            type: item[2].toLowerCase(),
            quantity: quantity,
            price: item[5] || 0
        });
    }
    
    displayCart();
}

function displayCart() {
    const cartItems = document.getElementById('cart-items');
    const totalPrice = document.getElementById('total-price');
    
    cartItems.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const li = document.createElement('li');
        const itemTotal = item.quantity * item.price;
        li.innerHTML = `
            <div>
                <strong>${item.name}</strong><br>
                ${item.quantity} x ₱${item.price.toFixed(2)}
            </div>
            <div>₱${itemTotal.toFixed(2)}</div>
        `;
        cartItems.appendChild(li);
        total += itemTotal;
    });

    totalPrice.textContent = total.toFixed(2);
}

function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredInventory = inventory.filter(item => 
        item[1].toLowerCase().includes(searchTerm) || 
        item[2].toLowerCase().includes(searchTerm)
    );
    displayInventory();
}

function applyFilter() {
    const filterAttribute = document.getElementById('filterAttribute').value;
    const sortOrder = document.getElementById('sortOrder').value;
    
    filteredInventory.sort((a, b) => {
        let comparison = 0;
        
        switch(filterAttribute) {
            case 'name':
                comparison = a[1].localeCompare(b[1]);
                break;
            case 'price':
                comparison = a[5] - b[5];
                break;
            case 'quantity':
                comparison = a[4] - b[4];
                break;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    displayInventory();
}

function formatDateTime(date) {
    return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function checkout() {
    const customerName = document.getElementById('customer-name').value;
    const phoneNumber = document.getElementById('phone-number').value;

    if (!customerName || !phoneNumber) {
        alert('Please enter customer information.');
        return;
    }

    if (cart.length === 0) {
        alert('Cart is empty!');
        return;
    }

    const data = {
        customer_name: customerName,
        phone_number: phoneNumber,
        items: cart,
        total: parseFloat(document.getElementById('total-price').textContent),
        timestamp: formatDateTime(new Date()),
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
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error during checkout. Please try again.');
    });
}

window.onload = fetchInventory;