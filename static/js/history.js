// static/js/history.js
function fetchHistory() {
    fetch('/history-data')
        .then(response => response.json())
        .then(data => {
            const historyBody = document.getElementById('history-body');
            historyBody.innerHTML = '';

            data.forEach(entry => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${entry.customer_name}</td>
                    <td>${entry.phone_number}</td>
                    <td>$${entry.total}</td>
                    <td>${entry.timestamp}</td>
                `;
                historyBody.appendChild(row);
            });
        });
}

window.onload = fetchHistory;
