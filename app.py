import os
import sqlite3
import hashlib
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, g

DATABASE = 'database.db'

app = Flask(__name__)
# Secure random key for session encryption
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'terracotta_secret_key_2026_xYz987')

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
        # Enable foreign keys
        db.execute("PRAGMA foreign_keys = ON;")
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# Password verification using PBKDF2 SHA-256
def verify_password(stored_hash: str, password: str) -> bool:
    try:
        parts = stored_hash.split('$')
        if len(parts) != 3:
            return False
        iterations = int(parts[0])
        salt = bytes.fromhex(parts[1])
        key = bytes.fromhex(parts[2])
        dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, iterations)
        return dk == key
    except Exception:
        return False

# Password hashing helper (for admin user creation / password change)
def hash_password(password: str) -> str:
    salt = os.urandom(16)
    iterations = 100000
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, iterations)
    return f"{iterations}${salt.hex()}${dk.hex()}"

# Authentication check decorator
def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('logged_in'):
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Unauthorized. Please login.'}), 401
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

# --- WEB PAGE ROUTES ---

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/admin')
def admin_root():
    if session.get('logged_in'):
        return redirect(url_for('admin_dashboard'))
    return redirect(url_for('admin_login'))

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if session.get('logged_in'):
        return redirect(url_for('admin_dashboard'))
        
    error = None
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT password_hash FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        
        if user and verify_password(user['password_hash'], password):
            session['logged_in'] = True
            session['username'] = username
            return redirect(url_for('admin_dashboard'))
        else:
            error = "Invalid username or password."
            
    return render_template('login.html', error=error)

@app.route('/admin/logout')
def admin_logout():
    session.clear()
    return redirect(url_for('admin_login'))

@app.route('/admin/dashboard')
@login_required
def admin_dashboard():
    return render_template('admin.html', username=session.get('username'))

# --- RESTFUL JSON API ROUTES ---

@app.route('/api/projects', methods=['GET'])
@login_required
def get_projects():
    db = get_db()
    cursor = db.cursor()
    
    # Get all projects
    cursor.execute("SELECT * FROM projects ORDER BY created_at DESC")
    projects_rows = cursor.fetchall()
    
    projects_list = []
    
    for proj in projects_rows:
        project_id = proj['id']
        
        # Calculate sum of hours for this project
        cursor.execute("SELECT SUM(hours) FROM hours WHERE project_id = ?", (project_id,))
        total_hours = cursor.fetchone()[0] or 0.0
        
        # Get all expenses for this project
        cursor.execute("SELECT amount, type, subtype FROM expenses WHERE project_id = ?", (project_id,))
        expenses_rows = cursor.fetchall()
        
        # Calculate materials and subcontractor expenses (taking Devolução as negative)
        total_expenses = 0.0
        total_materials = 0.0
        total_labor = 0.0
        for exp in expenses_rows:
            amount = exp['amount']
            exp_type = exp['type']
            subtype = (exp['subtype'] or '').lower()
            
            if exp_type == 'Material':
                total_materials += amount
                total_expenses += amount
            elif exp_type == 'Subcontratado':
                total_labor += amount
                total_expenses += amount
            elif exp_type == 'Devolução':
                total_expenses -= amount
                # Attribute the return based on the subtype/category
                if 'subcontractor' in subtype or 'subcontratado' in subtype or 'helper' in subtype or 'painter' in subtype:
                    total_labor -= amount
                else:
                    total_materials -= amount
                
        materials_and_subcontracted = total_expenses
                
        # Financial Calculations (per requirements)
        job_charge = proj['job_charge']
        tax_rate = proj['tax_rate']
        down_payments = proj['down_payments']
        future_costs_estimate = proj['future_costs_estimate']
        
        # 1. Total da Fatura = Valor Cobrado + Imposto
        tax_amount = job_charge * (tax_rate / 100.0)
        invoice_total = job_charge + tax_amount
        
        # 2. Saldo a Receber = Total da Fatura - Adiantamentos
        balance_due = invoice_total - down_payments
        
        # 3. Custo Estimado Final = Soma de todas as despesas + Estimativa de custos futuros
        estimated_final_cost = materials_and_subcontracted + future_costs_estimate
        
        # 4. Lucro Líquido = Valor Cobrado (sem imposto) - Custo Estimado Final
        net_profit = job_charge - estimated_final_cost
        
        # 5. Ganho Médio por Hora = Lucro Líquido / Total de horas registradas
        avg_hourly_earning = (net_profit / total_hours) if total_hours > 0 else 0.0
        
        projects_list.append({
            'id': proj['id'],
            'name': proj['name'],
            'address': proj['address'],
            'job_charge': job_charge,
            'tax_rate': tax_rate,
            'down_payments': down_payments,
            'future_costs_estimate': future_costs_estimate,
            'created_at': proj['created_at'],
            
            # Calculated metrics
            'tax_amount': round(tax_amount, 2),
            'invoice_total': round(invoice_total, 2),
            'balance_due': round(balance_due, 2),
            'estimated_final_cost': round(estimated_final_cost, 2),
            'net_profit': round(net_profit, 2),
            'total_hours': round(total_hours, 2),
            'avg_hourly_earning': round(avg_hourly_earning, 2),
            'total_expenses': round(total_expenses, 2),
            'total_materials': round(total_materials, 2),
            'total_labor': round(total_labor, 2)
        })
        
    return jsonify(projects_list)

@app.route('/api/projects', methods=['POST'])
@login_required
def create_project():
    data = request.json or {}
    name = data.get('name')
    address = data.get('address')
    
    try:
        job_charge = float(data.get('job_charge', 0))
        tax_rate = float(data.get('tax_rate', 13.0))
        down_payments = float(data.get('down_payments', 0))
        future_costs_estimate = float(data.get('future_costs_estimate', 0))
    except (ValueError, TypeError):
        return jsonify({'error': 'Financial values must be numeric numbers.'}), 400
        
    if not name or not address:
        return jsonify({'error': 'Name and address are required.'}), 400
        
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO projects (name, address, job_charge, tax_rate, down_payments, future_costs_estimate) VALUES (?, ?, ?, ?, ?, ?)",
        (name, address, job_charge, tax_rate, down_payments, future_costs_estimate)
    )
    db.commit()
    project_id = cursor.lastrowid
    
    return jsonify({'success': True, 'id': project_id}), 201

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
@login_required
def update_project(project_id):
    data = request.json or {}
    name = data.get('name')
    address = data.get('address')
    
    try:
        job_charge = float(data.get('job_charge', 0))
        tax_rate = float(data.get('tax_rate', 13.0))
        down_payments = float(data.get('down_payments', 0))
        future_costs_estimate = float(data.get('future_costs_estimate', 0))
    except (ValueError, TypeError):
        return jsonify({'error': 'Financial values must be numeric.'}), 400
        
    if not name or not address:
        return jsonify({'error': 'Name and address are required.'}), 400
        
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        "UPDATE projects SET name = ?, address = ?, job_charge = ?, tax_rate = ?, down_payments = ?, future_costs_estimate = ? WHERE id = ?",
        (name, address, job_charge, tax_rate, down_payments, future_costs_estimate, project_id)
    )
    db.commit()
    
    if cursor.rowcount == 0:
        return jsonify({'error': 'Project not found.'}), 404
        
    return jsonify({'success': True})

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
@login_required
def delete_project(project_id):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    db.commit()
    
    if cursor.rowcount == 0:
        return jsonify({'error': 'Project not found.'}), 404
        
    return jsonify({'success': True})

# --- EXPENSES API ---

@app.route('/api/projects/<int:project_id>/expenses', methods=['GET'])
@login_required
def get_project_expenses(project_id):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM expenses WHERE project_id = ? ORDER BY created_at DESC", (project_id,))
    rows = cursor.fetchall()
    
    expenses = []
    for r in rows:
      expenses.append({
          'id': r['id'],
          'amount': r['amount'],
          'type': r['type'],
          'subtype': r['subtype'],
          'tax_included': bool(r['tax_included']),
          'created_at': r['created_at']
      })
    return jsonify(expenses)

@app.route('/api/projects/<int:project_id>/expenses', methods=['POST'])
@login_required
def add_project_expense(project_id):
    data = request.json or {}
    
    try:
        amount = float(data.get('amount', 0))
    except (ValueError, TypeError):
        return jsonify({'error': 'Expense amount must be numeric.'}), 400
        
    expense_type = data.get('type')
    subtype = data.get('subtype')
    tax_included = 1 if data.get('tax_included') else 0
    
    if expense_type not in ('Material', 'Subcontratado', 'Devolução'):
        return jsonify({'error': 'Invalid expense type. Must be Material, Subcontratado, or Devolução.'}), 400
        
    if amount <= 0:
        return jsonify({'error': 'Expense amount must be greater than zero.'}), 400
        
    db = get_db()
    cursor = db.cursor()
    
    # Verify project exists
    cursor.execute("SELECT id FROM projects WHERE id = ?", (project_id,))
    if not cursor.fetchone():
        return jsonify({'error': 'Project not found.'}), 404
        
    cursor.execute(
        "INSERT INTO expenses (project_id, amount, type, subtype, tax_included) VALUES (?, ?, ?, ?, ?)",
        (project_id, amount, expense_type, subtype, tax_included)
    )
    db.commit()
    expense_id = cursor.lastrowid
    
    return jsonify({'success': True, 'id': expense_id}), 201

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
@login_required
def delete_expense(expense_id):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    db.commit()
    
    if cursor.rowcount == 0:
        return jsonify({'error': 'Expense not found.'}), 404
        
    return jsonify({'success': True})

@app.route('/api/expenses/<int:expense_id>', methods=['PUT'])
@login_required
def update_expense(expense_id):
    data = request.json or {}
    try:
        amount = float(data.get('amount', 0))
    except (ValueError, TypeError):
        return jsonify({'error': 'Expense amount must be numeric.'}), 400
        
    expense_type = data.get('type')
    subtype = data.get('subtype')
    tax_included = 1 if data.get('tax_included') else 0
    
    if expense_type not in ('Material', 'Subcontratado', 'Devolução'):
        return jsonify({'error': 'Invalid expense type. Must be Material, Subcontratado, or Devolução.'}), 400
        
    if amount <= 0:
        return jsonify({'error': 'Expense amount must be greater than zero.'}), 400
        
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        "UPDATE expenses SET amount = ?, type = ?, subtype = ?, tax_included = ? WHERE id = ?",
        (amount, expense_type, subtype, tax_included, expense_id)
    )
    db.commit()
    
    if cursor.rowcount == 0:
        return jsonify({'error': 'Expense not found.'}), 404
        
    return jsonify({'success': True})

# --- HOURS API ---

@app.route('/api/projects/<int:project_id>/hours', methods=['GET'])
@login_required
def get_project_hours(project_id):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM hours WHERE project_id = ? ORDER BY date DESC, created_at DESC", (project_id,))
    rows = cursor.fetchall()
    
    hours_list = []
    for r in rows:
        hours_list.append({
            'id': r['id'],
            'date': r['date'],
            'hours': r['hours'],
            'created_at': r['created_at']
        })
    return jsonify(hours_list)

@app.route('/api/projects/<int:project_id>/hours', methods=['POST'])
@login_required
def add_project_hours(project_id):
    data = request.json or {}
    
    try:
        hours_val = float(data.get('hours', 0))
    except (ValueError, TypeError):
        return jsonify({'error': 'Hours must be numeric.'}), 400
        
    date = data.get('date')
    
    if not date:
        return jsonify({'error': 'Date is required.'}), 400
        
    if hours_val <= 0:
        return jsonify({'error': 'Hours must be greater than zero.'}), 400
        
    db = get_db()
    cursor = db.cursor()
    
    # Verify project exists
    cursor.execute("SELECT id FROM projects WHERE id = ?", (project_id,))
    if not cursor.fetchone():
        return jsonify({'error': 'Project not found.'}), 404
        
    cursor.execute(
        "INSERT INTO hours (project_id, date, hours) VALUES (?, ?, ?)",
        (project_id, date, hours_val)
    )
    db.commit()
    hours_id = cursor.lastrowid
    
    return jsonify({'success': True, 'id': hours_id}), 201

@app.route('/api/hours/<int:hours_id>', methods=['DELETE'])
@login_required
def delete_hours(hours_id):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("DELETE FROM hours WHERE id = ?", (hours_id,))
    db.commit()
    
    if cursor.rowcount == 0:
        return jsonify({'error': 'Hours record not found.'}), 404
        
    return jsonify({'success': True})

@app.route('/api/hours/<int:hours_id>', methods=['PUT'])
@login_required
def update_hours(hours_id):
    data = request.json or {}
    try:
        hours_val = float(data.get('hours', 0))
    except (ValueError, TypeError):
        return jsonify({'error': 'Hours must be numeric.'}), 400
        
    date = data.get('date')
    
    if not date:
        return jsonify({'error': 'Date is required.'}), 400
        
    if hours_val <= 0:
        return jsonify({'error': 'Hours must be greater than zero.'}), 400
        
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        "UPDATE hours SET date = ?, hours = ? WHERE id = ?",
        (date, hours_val, hours_id)
    )
    db.commit()
    
    if cursor.rowcount == 0:
        return jsonify({'error': 'Hours record not found.'}), 404
        
    return jsonify({'success': True})

# --- INVOICE GENERATOR API ---
import shutil

@app.route('/api/projects/<int:project_id>/generate_invoice', methods=['POST'])
@login_required
def generate_project_invoice(project_id):
    from generate_invoice import create_invoice
    data = request.json or {}
    client_name = data.get('client_name')
    client_address = data.get('client_address')
    items = data.get('items', [])
    due_date = data.get('due_date', 'Upon Receipt')
    
    try:
        tax_rate = float(data.get('tax_rate', 13.0)) / 100.0
    except (ValueError, TypeError):
        tax_rate = 0.13

    if not client_name or not client_address or not items:
        return jsonify({'error': 'Client name, address, and at least one item are required.'}), 400

    try:
        # Generate the PDF
        tmp_path = create_invoice(
            client_name=client_name,
            client_address=client_address,
            items=items,
            tax_rate=tax_rate,
            due_date=due_date
        )
        
        # Ensure target folder exists
        invoice_dir = os.path.join(app.root_path, 'static', 'invoices')
        if not os.path.exists(invoice_dir):
            os.makedirs(invoice_dir)
            
        # Move PDF from /tmp to static/invoices
        filename = os.path.basename(tmp_path)
        dest_path = os.path.join(invoice_dir, filename)
        shutil.move(tmp_path, dest_path)
        
        return jsonify({
            'success': True,
            'filename': filename,
            'url': f'/static/invoices/{filename}'
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to generate invoice: {str(e)}'}), 500

if __name__ == '__main__':
    # Default local dev port 8080
    app.run(host='0.0.0.0', port=8080, debug=True)
