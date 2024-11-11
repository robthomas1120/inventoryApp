import sqlite3

def initialize_db():
    connection = sqlite3.connect('inventory.db')
    cursor = connection.cursor()

    # Create the 'items' table if it does not exist
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            picture BLOB,
            price REAL NOT NULL,
            quantity INTEGER DEFAULT 0
        )
    ''')

    connection.commit()
    connection.close()

if __name__ == "__main__":
    initialize_db()
    print("Database initialized successfully.")