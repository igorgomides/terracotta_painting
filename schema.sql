-- Schema definition for Terracotta Painting Admin Portal

-- Table for Admin Users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Projects/Clients
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    job_charge REAL NOT NULL, -- The cost of the job (excluding tax)
    tax_rate REAL NOT NULL DEFAULT 13.0, -- Default HST of 13%
    down_payments REAL NOT NULL DEFAULT 0.0, -- Adiantamentos
    future_costs_estimate REAL NOT NULL DEFAULT 0.0, -- Estimativa de Custos Futuros
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Material', 'Subcontratado', 'Devolução')),
    subtype TEXT, -- Category/store for materials, or type for subcontractors
    tax_included INTEGER NOT NULL DEFAULT 0, -- 1 = Yes, 0 = No
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Table for tracking hours worked
CREATE TABLE IF NOT EXISTS hours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    date TEXT NOT NULL, -- Date in format YYYY-MM-DD
    hours REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Table for tracking invoices generated via Telegram Bot
CREATE TABLE IF NOT EXISTS telegram_invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL,
    client_name TEXT NOT NULL,
    amount REAL NOT NULL,
    filename TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
