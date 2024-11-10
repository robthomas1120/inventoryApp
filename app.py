from flask import Flask, request, jsonify, render_template, url_for, send_from_directory
import sqlite3
from datetime import datetime
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'  # Folder to store uploaded images

HTML_FILES_DIR = os.path.join(os.path.dirname(__file__), 'static')  # For example, use 'static' folder

@app.route('/checkout.html')
def checkout():
    return send_from_directory(HTML_FILES_DIR, 'checkout.html')

@app.route('/history.html')
def history():
    return send_from_directory(HTML_FILES_DIR, 'history.html')

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
            last_updated TEXT
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

# Route to add a new item with an image upload
@app.route('/items', methods=['POST'])
def add_item():
    name = request.form['name']
    description = request.form['description']
    picture = request.files['picture']

    if picture:
        filename = secure_filename(picture.filename)
        picture_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        picture.save(picture_path)
        
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('INSERT INTO items (name, description, picture) VALUES (?, ?, ?)',
                       (name, description, picture_path))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Item added successfully!'})

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

if __name__ == '__main__':
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])  # Create upload folder if it doesn't exist
    init_db()
    app.run(debug=True)
