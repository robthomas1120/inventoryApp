async function fetchItems() {
    try {
        const response = await fetch('/items');
        if (!response.ok) {
            throw new Error('Failed to fetch items');
        }
        const items = await response.json();

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
    } catch (error) {
        console.error('Error fetching items:', error);
    }
}

// Open the modal to adjust quantity
function openQuantityWindow(item) {
    const modal = document.getElementById('quantity-modal');
    document.getElementById('modal-item-name').innerText = `Update Quantity for ${item[1]}`;
    modal.style.display = 'block';
    modal.dataset.itemId = item[0]; // Save item ID to modal for later
    modal.dataset.currentQuantity = item[4] || 0; // Save current quantity for validation

    // Reset the input field and ensure it's enabled
    const quantityInput = document.getElementById('quantityChange');
    quantityInput.value = 0;  // Reset the value
    quantityInput.disabled = false;  // Enable the input field if it was disabled
}

// Close the modal when the close button (×) is clicked
document.getElementById('close-modal').addEventListener('click', function() {
    const modal = document.getElementById('quantity-modal');
    modal.style.display = 'none';

    // Reset the input value when closing the modal
    const quantityInput = document.getElementById('quantityChange');
    quantityInput.value = 0;  // Reset the value
    quantityInput.disabled = false;  // Ensure the input is enabled
});

// Close the modal if clicking outside the modal content
window.addEventListener('click', function(event) {
    const modal = document.getElementById('quantity-modal');
    if (event.target === modal) {
        modal.style.display = 'none';

        // Reset the input value when closing the modal
        const quantityInput = document.getElementById('quantityChange');
        quantityInput.value = 0;  // Reset the value
        quantityInput.disabled = false;  // Ensure the input is enabled
    }
});


// Submit the quantity change (either add or subtract)
async function submitQuantityChange(changeFactor) {
    const modal = document.getElementById('quantity-modal');
    const itemId = modal.dataset.itemId;
    const currentQuantity = parseInt(modal.dataset.currentQuantity);
    const quantityChange = parseInt(document.getElementById('quantityChange').value) * changeFactor;

    if (isNaN(quantityChange) || quantityChange === 0) {
        alert('Please enter a valid quantity change.');
        return;
    }

    // Check if the new quantity would be negative
    if (currentQuantity + quantityChange < 0) {
        alert("Quantity cannot go below zero. Please enter a valid quantity change.");
        return;
    }

    // Update quantity if valid
    await updateQuantity(itemId, quantityChange);
    modal.style.display = 'none';
}

// Update quantity for an item
async function updateQuantity(itemId, quantityChange) {
    await fetch(`/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity_change: quantityChange })
    });

    fetchItems(); // Refresh items after update
}

// Add a new item to the database
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

// Delete an item from the inventory
async function deleteItem(itemId) {
    const confirmDelete = confirm("Are you sure you want to delete this item?");
    if (!confirmDelete) return;

    try {
        const response = await fetch(`/items/${itemId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            // Hide the quantity modal if it was open
            const modal = document.getElementById('quantity-modal');
            modal.style.display = 'none';

            fetchItems(); // Refresh the inventory after deletion
            alert("Item deleted successfully.");
        } else {
            alert("Failed to delete the item.");
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        alert("Error deleting the item.");
    }
}
// Initialize items on page load
window.onload = fetchItems;
