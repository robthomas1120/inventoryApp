// Fetch all items from the database
async function fetchItems() {
    try {
        const response = await fetch('/items');
        if (!response.ok) {
            throw new Error('Failed to fetch items');
        }
        const items = await response.json();

        // Check if the items are received correctly
        if (!items || items.length === 0) {
            console.log('No items found');
        }

        const container = document.getElementById('inventory-container');
        container.innerHTML = '';  // Clear previous items
        items.forEach(item => {
            const box = document.createElement('div');
            box.classList.add('item-box');
            box.onclick = () => openQuantityWindow(item[0]); // Using item[0] as the ID
            box.innerHTML = `
                <img src="${item[3]}" alt="${item[1]}" width="100" height="100">
                <h3>${item[1]}</h3>
                <p>${item[2]}</p>
            `;
            container.appendChild(box);
        });
    } catch (error) {
        console.error('Error fetching items:', error);
    }
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
