let inventory = [];
let filteredInventory = [];

async function fetchItems() {
    try {
        const response = await fetch('/items');
        if (!response.ok) {
            throw new Error('Failed to fetch items');
        }
        inventory = await response.json();
        filteredInventory = [...inventory];
        displayItems(filteredInventory);
    } catch (error) {
        console.error('Error fetching items:', error);
    }
}

function displayItems(items) {
    const container = document.getElementById('inventory-container');
    container.innerHTML = '';  // Clear previous items

    items.forEach(item => {
        const box = document.createElement('div');
        box.classList.add('item-box');
        box.onclick = () => openQuantityWindow(item);
        box.innerHTML = `
            <img src="${item[3]}" alt="${item[1]}" width="100" height="100">
            <h3>${item[1]}</h3>
            <p>${item[2]}</p>
            <div class="quantity-display">Qty: ${item[4] || 0}</div>
            <div class="price-display">Price: ₱${item[5].toFixed(2)}</div>
            <button onclick="deleteItem(${item[0]})">Delete</button>
        `;
        container.appendChild(box);
    });
}

// Search functionality
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredInventory = inventory.filter(item => 
        item[1].toLowerCase().includes(searchTerm) // Search by name
    );
    displayItems(filteredInventory);
}

// Filter functionality
function applyFilter() {
    const filterAttribute = document.getElementById('filterAttribute').value;
    const sortOrder = document.getElementById('sortOrder').value;
    
    let sortedItems = [...filteredInventory];
    
    sortedItems.sort((a, b) => {
        let valueA, valueB;
        
        switch(filterAttribute) {
            case 'name':
                valueA = a[1].toLowerCase();
                valueB = b[1].toLowerCase();
                break;
            case 'price':
                valueA = a[5];
                valueB = b[5];
                break;
            case 'quantity':
                valueA = a[4] || 0;
                valueB = b[4] || 0;
                break;
            default:
                return 0;
        }
        
        if (sortOrder === 'asc') {
            return valueA > valueB ? 1 : -1;
        } else {
            return valueA < valueB ? 1 : -1;
        }
    });
    
    displayItems(sortedItems);
}

// Open the modal to adjust quantity
function openQuantityWindow(item) {
    const modal = document.getElementById('quantity-modal');
    document.getElementById('modal-item-name').innerText = `Update Quantity for ${item[1]}`;
    modal.style.display = 'block';
    modal.dataset.itemId = item[0];
    modal.dataset.currentQuantity = item[4] || 0;

    const quantityInput = document.getElementById('quantityChange');
    quantityInput.value = 0;
    quantityInput.disabled = false;
}

// Close modal handlers
document.getElementById('close-modal').addEventListener('click', function() {
    const modal = document.getElementById('quantity-modal');
    modal.style.display = 'none';
    const quantityInput = document.getElementById('quantityChange');
    quantityInput.value = 0;
    quantityInput.disabled = false;
});

window.addEventListener('click', function(event) {
    const modal = document.getElementById('quantity-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
        const quantityInput = document.getElementById('quantityChange');
        quantityInput.value = 0;
        quantityInput.disabled = false;
    }
});

async function submitQuantityChange(changeFactor) {
    const modal = document.getElementById('quantity-modal');
    const itemId = modal.dataset.itemId;
    const currentQuantity = parseInt(modal.dataset.currentQuantity);
    const quantityChange = parseInt(document.getElementById('quantityChange').value) * changeFactor;

    if (isNaN(quantityChange) || quantityChange === 0) {
        alert('Please enter a valid quantity change.');
        return;
    }

    if (currentQuantity + quantityChange < 0) {
        alert("Quantity cannot go below zero. Please enter a valid quantity change.");
        return;
    }

    await updateQuantity(itemId, quantityChange);
    modal.style.display = 'none';
}

async function updateQuantity(itemId, quantityChange) {
    await fetch(`/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity_change: quantityChange })
    });

    fetchItems();
}

async function addItem() {
    const name = document.getElementById('name').value;
    const description = document.getElementById('description').value;
    const price = parseFloat(document.getElementById('price').value);
    const picture = document.getElementById('picture').files[0];

    if (isNaN(price) || price <= 0) {
        alert('Please enter a valid price.');
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('picture', picture);

    await fetch('/items', {
        method: 'POST',
        body: formData
    });
    fetchItems();
}

async function deleteItem(itemId) {
    const confirmDelete = confirm("Are you sure you want to delete this item?");
    if (!confirmDelete) return;

    try {
        const response = await fetch(`/items/${itemId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            const modal = document.getElementById('quantity-modal');
            modal.style.display = 'none';
            fetchItems();
            alert("Item deleted successfully.");
        } else {
            alert("Failed to delete the item.");
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        alert("Error deleting the item.");
    }
}

window.onload = fetchItems;