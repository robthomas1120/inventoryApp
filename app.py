from flask import Flask, request, jsonify, render_template, url_for
import sqlite3
from datetime import datetime
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'  # Folder to store uploaded images

# Initialize SQLite database
def init_db():
    conn = sqlite3.connect('inventory.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            picture TEXT NOT NULL,
            quantity INTEGER DEFAULT 0,
            price REAL NOT NULL,  -- Added price column
            last_updated TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            total REAL NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

# Route to get all items
@app.route('/items', methods=['GET'])
def get_items():
    conn = sqlite3.connect('inventory.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM items')
    items = cursor.fetchall()
    conn.close()
    return jsonify(items)

# route to delete items
@app.route('/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    try:
        # Assuming you are using SQLite
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute("DELETE FROM items WHERE id = ?", (item_id,))
        conn.commit()
        conn.close()
        return '', 200  # Return empty response with 200 status code
    except Exception as e:
        return str(e), 500

# Route to add a new item with an image upload
@app.route('/items', methods=['POST'])
def add_item():
    name = request.form['name']
    description = request.form['description']
    price = float(request.form['price'])  # Get price from the form
    picture = request.files['picture']

    if picture:
        filename = secure_filename(picture.filename)
        picture_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        picture.save(picture_path)
        
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('INSERT INTO items (name, description, picture, price) VALUES (?, ?, ?, ?)',
                       (name, description, picture_path, price))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Item added successfully!'})

# Route to update item quantity
@app.route('/items/<int:item_id>', methods=['PUT'])
def update_quantity(item_id):
    data = request.get_json()
    conn = sqlite3.connect('inventory.db')
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE items
        SET quantity = quantity + ?,
            last_updated = ?
        WHERE id = ?
    ''', (data['quantity_change'], datetime.now().strftime("%Y-%m-%d %H:%M:%S"), item_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Quantity updated successfully!'})

# Route to render checkout page (GET request)
@app.route('/checkout', methods=['GET'])
def render_checkout_page():
    return render_template('checkout.html')  # Render checkout.html from the templates folder

# Route to handle checkout logic (POST request)
@app.route('/checkout', methods=['POST'])
def checkout():
    data = request.get_json()

    customer_name = data['customer_name']
    phone_number = data['phone_number']
    items = data['items']
    total = data['total']
    timestamp = data['timestamp']

    # Save to history table
    conn = sqlite3.connect('inventory.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO history (customer_name, phone_number, total, timestamp)
        VALUES (?, ?, ?, ?)
    ''', (customer_name, phone_number, total, timestamp))

    # Update inventory and subtract the items
    for item in items:
        cursor.execute('''
            UPDATE items
            SET quantity = quantity - ?
            WHERE id = ?
        ''', (item['quantity'], item['id']))

    conn.commit()
    conn.close()

    return jsonify({'message': 'Checkout successful!'})

# Route to render history page (GET request)
@app.route('/history', methods=['GET'])
def render_history_page():
    return render_template('history.html')  # Render history.html from the templates folder

# Route to fetch checkout history
@app.route('/history-data', methods=['GET'])
def history_data():
    conn = sqlite3.connect('inventory.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM history')
    rows = cursor.fetchall()
    conn.close()

    # Prepare the data in a JSON-compatible format
    history = []
    for row in rows:
        history.append({
            'customer_name': row[1],
            'phone_number': row[2],
            'total': row[3],
            'timestamp': row[4],
        })

    return jsonify(history)

if __name__ == '__main__':
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])  # Create upload folder if it doesn't exist
    init_db()
    app.run(debug=True)
