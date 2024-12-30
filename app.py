from flask import Flask, request, jsonify, render_template, url_for
import sqlite3
from datetime import datetime, timedelta
import os
from werkzeug.utils import secure_filename
import json
from flask import send_file
import pandas as pd
import openpyxl
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'

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
            price REAL NOT NULL,
            last_updated TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            items_json TEXT NOT NULL,  -- Store items as JSON string
            total REAL NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS trash_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            picture TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            deleted_at TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/items', methods=['GET'])
def get_items():
    conn = sqlite3.connect('inventory.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM items')
    items = cursor.fetchall()
    conn.close()
    return jsonify(items)

@app.route('/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute("DELETE FROM items WHERE id = ?", (item_id,))
        conn.commit()
        conn.close()
        return '', 200
    except Exception as e:
        return str(e), 500

@app.route('/items', methods=['POST'])
def add_item():
    name = request.form['name']
    description = request.form['description']
    price = float(request.form['price'])
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

@app.route('/checkout', methods=['GET'])
def render_checkout_page():
    return render_template('checkout.html')

@app.route('/export/<string:file_type>', methods=['GET'])
def export_inventory(file_type):
    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()

        # Base query
        query = "SELECT name, description, quantity, price, last_updated FROM items"
        params = []

        # Get sorting and filtering parameters
        sort_by = request.args.get('sort_by', 'name')  # Default to sorting by 'name'
        order = request.args.get('order', 'asc')  # Default to ascending order
        date_range = request.args.get('date_range', 'all')

        # Filtering by date range
        if date_range == 'today':
            today = datetime.now().strftime("%Y-%m-%d")
            query += " WHERE date(last_updated) = ?"
            params.append(today)
        elif date_range == 'specific_day':
            specific_date = request.args.get('specificDate')
            query += " WHERE date(last_updated) = ?"
            params.append(specific_date)
        elif date_range == 'specific_month':
            specific_month = request.args.get('specificMonth')
            query += " WHERE strftime('%Y-%m', last_updated) = ?"
            params.append(specific_month)
        elif date_range == 'specific_year':
            specific_year = request.args.get('specificYear')
            query += " WHERE strftime('%Y', last_updated) = ?"
            params.append(specific_year)

        # Sorting
        valid_sort_columns = {
            'name': 'name',
            'description': 'description',
            'quantity': 'quantity',
            'price': 'price',
            'last_updated': 'last_updated'
        }

        # Validate and add sorting
        if sort_by in valid_sort_columns:
            sort_column = valid_sort_columns[sort_by]
            sort_order = 'ASC' if order.lower() == 'asc' else 'DESC'
            query += f" ORDER BY {sort_column} {sort_order}"

        # Execute query
        cursor.execute(query, params)
        items = cursor.fetchall()
        conn.close()

        columns = ['Name', 'Description', 'Quantity', 'Price', 'Last Updated']

        if file_type == 'pdf':
            # Generate PDF file
            file_path = 'static/inventory.pdf'
            pdf = SimpleDocTemplate(file_path, pagesize=landscape(letter))
            elements = []

            # Create table data (header + rows)
            data = [columns]  # Add column headers
            data.extend(items)  # Add rows from the database

            # Create table
            table = Table(data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),  # Header background color
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),  # Header text color
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),  # Center-align all cells
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),  # Header font
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),  # Header padding
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),  # Row background color
                ('GRID', (0, 0), (-1, -1), 1, colors.black),  # Add grid lines
                ('ALIGN', (1, 1), (-1, -1), 'LEFT'),  # Align Name and Description to the left
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),  # Regular font for all rows
                ('WRAP', (0, 0), (-1, -1)),  # Enable text wrapping
            ]))

            elements.append(table)
            pdf.build(elements)
            return send_file(file_path, as_attachment=True, download_name='inventory.pdf')

        elif file_type == 'excel':
            # Generate Excel file
            file_path = 'static/inventory.xlsx'
            df = pd.DataFrame(items, columns=columns)
            df.to_excel(file_path, index=False, engine='openpyxl')
            return send_file(file_path, as_attachment=True, download_name='inventory.xlsx')

        return jsonify({'error': 'Unsupported file type'}), 400

    except Exception as e:
        print(f"Error exporting inventory: {str(e)}")
        return jsonify({'error': 'Failed to export inventory', 'details': str(e)}), 500


    
@app.route('/checkout', methods=['POST'])
def checkout():
    data = request.get_json()

    customer_name = data['customer_name']
    phone_number = data['phone_number']
    items = data['items']
    total = data['total']
    timestamp = data['timestamp']

    # Convert items list to JSON string for storage
    items_json = json.dumps(items)

    conn = sqlite3.connect('inventory.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO history (customer_name, phone_number, items_json, total, timestamp)
        VALUES (?, ?, ?, ?, ?)
    ''', (customer_name, phone_number, items_json, total, timestamp))

    for item in items:
        cursor.execute('''
            UPDATE items
            SET quantity = quantity - ?
            WHERE id = ?
        ''', (item['quantity'], item['id']))

    conn.commit()
    conn.close()

    return jsonify({'message': 'Checkout successful!'})

@app.route('/history', methods=['GET'])
def render_history_page():
    return render_template('history.html')

@app.route('/history-data', methods=['GET'])
def history_data():
    conn = sqlite3.connect('inventory.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM history')
    rows = cursor.fetchall()
    conn.close()

    history = []
    for row in rows:
        history.append({
            'customer_name': row[1],
            'phone_number': row[2],
            'items': json.loads(row[3]),  # Parse JSON string back to list
            'total': row[4],
            'timestamp': row[5],
        })

    return jsonify(history)


# Add these new routes for trash management
@app.route('/trash', methods=['GET'])
def get_trash():
    conn = sqlite3.connect('inventory.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM trash_items')
    items = cursor.fetchall()
    conn.close()
    return jsonify(items)

@app.route('/items/<int:item_id>/delete', methods=['DELETE'])
def move_to_trash(item_id):
    conn = None
    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        
        # First check if item exists
        cursor.execute("SELECT * FROM items WHERE id = ?", (item_id,))
        item = cursor.fetchone()
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404
            
        # Move item to trash with quantity
        cursor.execute('''
            INSERT INTO trash_items 
            (item_id, name, description, picture, quantity, price, deleted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            item[0],               # item_id
            item[1],               # name
            item[2],               # description
            item[3],               # picture
            item[4] if item[4] is not None else 0,  # quantity with null check
            item[5],               # price
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")  # deleted_at
        ))
        
        # Delete from items table
        cursor.execute("DELETE FROM items WHERE id = ?", (item_id,))
        
        # Clean up old trash items (older than 1 week)
        week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("DELETE FROM trash_items WHERE deleted_at < ?", (week_ago,))
        
        conn.commit()
        return jsonify({'message': 'Item moved to trash successfully'})
        
    except sqlite3.Error as e:
        # Log the actual SQL error
        print(f"Database error: {str(e)}")
        if conn:
            conn.rollback()
        return jsonify({'error': 'Database error occurred'}), 500
        
    except Exception as e:
        # Log any other errors
        print(f"Unexpected error: {str(e)}")
        if conn:
            conn.rollback()
        return jsonify({'error': 'An unexpected error occurred'}), 500
        
    finally:
        if conn:
            conn.close()

@app.route('/trash/<int:item_id>/restore', methods=['POST'])
def restore_from_trash(item_id):
    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        
        # Get item from trash
        cursor.execute("SELECT * FROM trash_items WHERE item_id = ?", (item_id,))
        trash_item = cursor.fetchone()
        
        if trash_item:
            # Restore to items table with original quantity
            cursor.execute('''
                INSERT INTO items (name, description, picture, quantity, price)
                VALUES (?, ?, ?, ?, ?)
            ''', (trash_item[2], trash_item[3], trash_item[4], trash_item[5], trash_item[6]))
            
            # Remove from trash
            cursor.execute("DELETE FROM trash_items WHERE item_id = ?", (item_id,))
            
            conn.commit()
            return jsonify({'message': 'Item restored successfully!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    init_db()
    app.run(debug=True, host='0.0.0.0')