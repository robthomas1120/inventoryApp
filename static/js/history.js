// static/js/history.js
let historyData = [];

function fetchHistory() {
    fetch('/history-data')
        .then(response => response.json())
        .then(data => {
            historyData = data;
            displayHistory(historyData);
        })
        .catch(error => {
            console.error('Error fetching history:', error);
        });
}

function displayHistory(data) {
    const historyBody = document.getElementById('history-body');
    historyBody.innerHTML = '';

    data.forEach(entry => {
        const row = document.createElement('tr');

        const itemsBreakdown = Array.isArray(entry.items)
            ? entry.items.map(item => {
                const itemTotalPrice = (item.price * item.quantity).toFixed(2);
                return `${item.name} x${item.quantity} = ₱${itemTotalPrice}`;
            }).join('<br>')
            : 'No items available';

        row.innerHTML = `
            <td>${entry.customer_name}</td>
            <td>${entry.phone_number}</td>
            <td>${itemsBreakdown}</td>
            <td>₱${entry.total.toFixed(2)}</td>
            <td>${entry.timestamp}</td>
        `;
        historyBody.appendChild(row);
    });
}

function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredData = historyData.filter(entry => 
        entry.customer_name.toLowerCase().includes(searchTerm)
    );
    displayHistory(filteredData);
}

function applyFilter() {
    const filterAttribute = document.getElementById('filterAttribute').value;
    const sortOrder = document.getElementById('sortOrder').value;
    
    const sortedData = [...historyData].sort((a, b) => {
        let comparison = 0;
        
        switch(filterAttribute) {
            case 'customer_name':
                comparison = a.customer_name.localeCompare(b.customer_name);
                break;
            case 'total':
                comparison = a.total - b.total;
                break;
            case 'timestamp':
                comparison = new Date(a.timestamp) - new Date(b.timestamp);
                break;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    displayHistory(sortedData);
}

window.onload = fetchHistory;