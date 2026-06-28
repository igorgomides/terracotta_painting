import sqlite3
import os
import hashlib

DATABASE = 'database.db'

def hash_password(password: str) -> str:
    salt = os.urandom(16)
    iterations = 100000
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, iterations)
    return f"{iterations}${salt.hex()}${dk.hex()}"

def init_db():
    print("Initializing database...")
    conn = sqlite3.connect(DATABASE)
    
    # Read and execute schema
    with open('schema.sql', 'r') as f:
        schema = f.read()
    
    conn.executescript(schema)
    
    # Check if a user already exists, if not, create default admin
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users")
    count = cursor.fetchone()[0]
    
    if count == 0:
        default_user = "admin"
        default_pass = "terracotta_secure_2026"
        hashed = hash_password(default_pass)
        
        cursor.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            (default_user, hashed)
        )
        conn.commit()
        print(f"Default admin user created successfully!")
        print(f"Username: {default_user}")
        print(f"Password: {default_pass}")
        print("Please change this password after logging in.")
    else:
        print("Users already exist in database. Skipping seed.")
        
    conn.close()
    print("Database initialization complete.")

if __name__ == '__main__':
    init_db()
