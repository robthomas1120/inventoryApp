// Fetch all items from the database
async function fetchItems() {
    const response = await fetch('/items');
    const items = await response.json();
    const container = document.getElementById('inventory-container');
    container.innerHTML = '';
    items.forEach(item => {
        const box = document.createElement('div');
        box.classList.add('item-box');
        box.onclick = () => openQuantityWindow(item);  // Pass the whole item object
        box.innerHTML = `
            <img src="${item.picture}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>${item.description}</p>
        `;
        container.appendChild(box);
    });
}

// Add a new item to the database
async function addItem() {
    const name = document.getElementById('name').value;
    const description = document.getElementById('description').value;
    const picture = document.getElementById('picture').files[0];

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('picture', picture);

    await fetch('/items', {
        method: 'POST',
        body: formData
    });
    fetchItems();
}

// Open a new window to adjust quantity
function openQuantityWindow(item) {
    const quantityWindow = window.open("", "Update Quantity", "width=400,height=300");
    quantityWindow.document.write(`
        <html>
        <head><title>Update Quantity</title></head>
        <body>
            <h2>Update Quantity for ${item.name}</h2>
            <input type="number" id="quantityChange" placeholder="Quantity change" value="0" />
            <button onclick="window.opener.updateQuantity(${item.id}, document.getElementById('quantityChange').value)">Update</button>
        </body>
        </html>
    `);
}

// Update quantity for an item
async function updateQuantity(itemId, quantityChange) {
    const change = parseInt(quantityChange);
    if (isNaN(change)) {
        alert('Please enter a valid quantity change.');
        return;
    }

    await fetch(`/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity_change: change })
    });

    fetchItems();
}

window.onload = fetchItems;
