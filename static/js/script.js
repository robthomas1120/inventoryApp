let inventory = [];
let filteredInventory = [];
let isDeleteMode = false;

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
        
        // Only add click handler if not in delete mode
        if (!isDeleteMode) {
            box.onclick = () => openQuantityWindow(item);
        }
        
        // Base HTML structure
        box.innerHTML = `
            <img src="${item[3]}" alt="${item[1]}" width="100" height="100">
            <h3>${item[1]}</h3>
            <p>${item[2]}</p>
            <div class="quantity-display">Qty: ${item[4] || 0}</div>
            <div class="price-display">Price: ₱${item[5].toFixed(2)}</div>
        `;

        // Add delete button only if in delete mode
        if (isDeleteMode) {
            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-btn');
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = (e) => {
                e.stopPropagation();
                deleteItem(item[0]);
            };
            box.appendChild(deleteButton);
        }
        
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

let trashItems = [];

// Function to view trash
async function viewTrash() {
    const trashContainer = document.querySelector('.trash-container');
    const mainInventory = document.getElementById('inventory-container');
    
    try {
        const response = await fetch('/trash');
        if (!response.ok) {
            throw new Error('Failed to fetch trash items');
        }
        trashItems = await response.json();
        displayTrashItems();
        
        // Toggle visibility
        trashContainer.style.display = 'block';
        mainInventory.style.display = 'none';
    } catch (error) {
        console.error('Error fetching trash items:', error);
    }
}

// Function to toggle trash view
function toggleTrash() {
    const trashContainer = document.querySelector('.trash-container');
    const mainInventory = document.getElementById('inventory-container');
    
    trashContainer.style.display = 'none';
    mainInventory.style.display = 'grid';
}

// Function to display trash items
function displayTrashItems() {
    const container = document.getElementById('trash-items-container');
    container.innerHTML = '';  // Clear previous items

    trashItems.forEach(item => {
        const box = document.createElement('div');
        box.classList.add('item-box');
        box.innerHTML = `
            <img src="${item[4]}" alt="${item[2]}" width="100" height="100">
            <h3>${item[2]}</h3>
            <p>${item[3]}</p>
            <div class="price-display">Price: ₱${item[5].toFixed(2)}</div>
            <div class="deleted-at">Deleted: ${new Date(item[6]).toLocaleString()}</div>
            <button onclick="restoreItem(${item[1]})" class="restore-btn">Restore</button>
        `;
        container.appendChild(box);
    });
}

// Updated delete item function
async function deleteItem(itemId) {
    // Create and show delete confirmation modal
    const modal = document.createElement('div');
    modal.classList.add('delete-modal');
    modal.innerHTML = `
        <div class="delete-modal-content">
            <h2>Confirm Delete</h2>
            <p>Are you sure you want to move this item to trash?</p>
            <p>Items in trash will be automatically deleted after one week.</p>
            <div class="delete-modal-buttons">
                <button onclick="confirmDelete(${itemId})" class="confirm-delete">Delete</button>
                <button onclick="closeDeleteModal()" class="cancel-delete">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

// Function to confirm deletion
async function confirmDelete(itemId) {
    try {
        const response = await fetch(`/items/${itemId}/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        if (response.ok) {
            closeDeleteModal();
            fetchItems();
            // Show success message
            alert("Item moved to trash successfully");
        } else {
            // Show specific error message from server
            alert(data.error || "Failed to delete the item.");
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        alert("Error deleting the item. Please try again.");
    }
}

// Function to close delete modal
function closeDeleteModal() {
    const modal = document.querySelector('.delete-modal');
    if (modal) {
        modal.remove();
    }
}

// Function to restore item from trash
async function restoreItem(itemId) {
    try {
        const response = await fetch(`/trash/${itemId}/restore`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            // Refresh both trash and main inventory
            await viewTrash();
            await fetchItems();
        } else {
            alert("Failed to restore the item.");
        }
    } catch (error) {
        console.error('Error restoring item:', error);
        alert("Error restoring the item.");
    }
}

function toggleDeleteMode() {
    isDeleteMode = !isDeleteMode;
    const deleteButton = document.getElementById('delete-mode-btn');
    if (isDeleteMode) {
        deleteButton.textContent = 'Cancel Delete';
        deleteButton.style.background = 'linear-gradient(145deg, #3a3a3a, #2a2a2a)';
    } else {
        deleteButton.textContent = 'Delete Items';
        deleteButton.style.background = '';
    }
    displayItems(filteredInventory);
}

async function exportInventory(fileType) {
    const sortBy = document.getElementById('filterAttribute')?.value || 'Name';
    const sortOrder = document.getElementById('sortOrder')?.value || 'asc';

    try {
        const response = await fetch(`/export/${fileType}?sort_by=${sortBy}&order=${sortOrder}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to export inventory as ${fileType}. Server response: ${errorText}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `inventory.${fileType}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        console.error(`Error exporting inventory: ${error.message}`);
        alert(`Error exporting inventory: ${error.message}`);
    }
}

function openExportDialog() {
    document.getElementById('export-dialog').style.display = 'block';
}

function closeExportDialog() {
    document.getElementById('export-dialog').style.display = 'none';
}

// Handle changes in date range selection
document.getElementById('dateRange').addEventListener('change', function() {
    const dateRange = this.value;
    const specificDateInputs = document.getElementById('specific-date-inputs');
    specificDateInputs.style.display = (dateRange === 'specific_day' || dateRange === 'specific_month' || dateRange === 'specific_year') ? 'block' : 'none';
});

// Submit export request
async function submitExport() {
    const fileType = document.getElementById('fileType').value;
    const sortBy = document.getElementById('sortBy').value;
    const dateRange = document.getElementById('dateRange').value;

    let dateParams = {};
    if (dateRange === 'specific_day') {
        dateParams.specificDate = document.getElementById('specificDate').value;
    } else if (dateRange === 'specific_month') {
        dateParams.specificMonth = document.getElementById('specificMonth').value;
    } else if (dateRange === 'specific_year') {
        dateParams.specificYear = document.getElementById('specificYear').value;
    }

    const queryParams = new URLSearchParams({
        sort_by: sortBy,
        date_range: dateRange,
        ...dateParams,
    }).toString();

    try {
        const response = await fetch(`/export/${fileType}?${queryParams}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to export inventory as ${fileType}. Server response: ${errorText}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `inventory.${fileType === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        closeExportDialog();
    } catch (error) {
        console.error(`Error exporting inventory: ${error.message}`);
        alert(`Error exporting inventory: ${error.message}`);
    }
}

// Add event listener for escape key to close modals
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeDeleteModal();
    }
});

window.onload = fetchItems;