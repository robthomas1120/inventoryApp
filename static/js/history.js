// static/js/history.js
function fetchHistory() {
    fetch('/history-data')
        .then(response => response.json())
        .then(data => {
            const historyBody = document.getElementById('history-body');
            historyBody.innerHTML = '';

            data.forEach(entry => {
                const row = document.createElement('tr');

                // Check if entry.items exists and is an array
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
        })
        .catch(error => {
            console.error('Error fetching history:', error);
        });
}

window.onload = fetchHistory;
