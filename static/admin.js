/* ==========================================================================
   TERRACOTTA PAINTING - ADMIN INTERACTIVE CONTROLLER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  let state = {
    projects: [],
    selectedProjectId: null,
    searchQuery: ''
  };

  // DOM Elements
  const projectListContainer = document.getElementById('project-list-container');
  const projectSearchInput = document.getElementById('project-search-input');
  const btnNewProject = document.getElementById('btn-new-project');
  
  // Detail elements
  const detailEmptyState = document.getElementById('detail-empty-state');
  const detailActiveContent = document.getElementById('detail-active-content');
  const detProjectName = document.getElementById('det-project-name');
  const detProjectAddress = document.getElementById('det-project-address');
  const btnEditProject = document.getElementById('btn-edit-project');
  const btnDeleteProject = document.getElementById('btn-delete-project');
  
  // Card metrics
  const cardJobCharge = document.getElementById('card-job-charge');
  const cardTotalInvoice = document.getElementById('card-total-invoice');
  const cardBalanceDue = document.getElementById('card-balance-due');
  const cardFinalCost = document.getElementById('card-final-cost');
  const cardNetProfit = document.getElementById('card-net-profit');
  const cardHourlyRate = document.getElementById('card-hourly-rate');
  const cardExpenses = document.getElementById('card-expenses');
  const cardMaterials = document.getElementById('card-materials');
  const cardLabor = document.getElementById('card-labor');
  
  // Global stats elements
  const globalInvoiced = document.getElementById('global-invoiced');
  const globalBalance = document.getElementById('global-balance');
  const globalProfit = document.getElementById('global-profit');
  const globalHourly = document.getElementById('global-hourly');
  const globalHours = document.getElementById('global-hours');
  const globalExpenses = document.getElementById('global-expenses');
  const globalMaterials = document.getElementById('global-materials');
  const globalLabor = document.getElementById('global-labor');
  
  // Tab elements
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const expensesListContainer = document.getElementById('expenses-list-container');
  const hoursListContainer = document.getElementById('hours-list-container');
  const invoiceItemsContainer = document.getElementById('invoice-items-container');
  const invoiceDownloadList = document.getElementById('invoice-download-list');
  const generatedInvoicesStatus = document.getElementById('generated-invoices-status');
  const telegramInvoiceList = document.getElementById('telegram-invoice-list');
  const telegramInvoicesStatus = document.getElementById('telegram-invoices-status');
  
  // Invoice form fields
  const generateInvoiceForm = document.getElementById('generate-invoice-form');
  const invClientName = document.getElementById('inv-client-name');
  const invClientAddress = document.getElementById('inv-client-address');
  const invTaxRate = document.getElementById('inv-tax-rate');
  const invDownPayments = document.getElementById('inv-downpayments');
  const invDueDate = document.getElementById('inv-due-date');
  const invNotes = document.getElementById('inv-notes');
  const btnAddInvoiceItem = document.getElementById('btn-add-invoice-item');
  const sessionInvoices = {};

  // Global Invoices DOM
  const btnGlobalInvoices = document.getElementById('btn-global-invoices');
  const globalInvoicesContent = document.getElementById('global-invoices-content');
  const globalInvoicesList = document.getElementById('global-invoices-list');
  const globalInvoicesStatus = document.getElementById('global-invoices-status');
  
  // Forms
  const addExpenseForm = document.getElementById('add-expense-form');
  const expenseIdField = document.getElementById('expense-id-field');
  const expenseFormTitle = document.getElementById('expense-form-title');
  const btnSubmitExpense = document.getElementById('btn-submit-expense');
  const btnCancelExpenseEdit = document.getElementById('btn-cancel-expense-edit');
  
  const addHoursForm = document.getElementById('add-hours-form');
  const hoursIdField = document.getElementById('hours-id-field');
  const hoursFormTitle = document.getElementById('hours-form-title');
  const btnSubmitHours = document.getElementById('btn-submit-hours');
  const btnCancelHoursEdit = document.getElementById('btn-cancel-hours-edit');
  
  const expTypeSelect = document.getElementById('exp-type');
  const expSubtypeSelect = document.getElementById('exp-subtype');
  
  // Modal elements
  const modalProject = document.getElementById('modal-project');
  const modalProjectTitle = document.getElementById('modal-project-title');
  const modalProjectClose = document.getElementById('modal-project-close');
  const modalProjectCancel = document.getElementById('modal-project-cancel');
  const projectForm = document.getElementById('project-form');
  const projectIdField = document.getElementById('project-id-field');
  const projNameInput = document.getElementById('proj-name');
  const projAddressInput = document.getElementById('proj-address');
  const projChargeInput = document.getElementById('proj-charge');
  const projTaxInput = document.getElementById('proj-tax');
  const projDownpaymentInput = document.getElementById('proj-downpayment');
  const projFuturecostsInput = document.getElementById('proj-futurecosts');

  // Set default date for hours form to today
  const hoursDateInput = document.getElementById('hours-date');
  if (hoursDateInput) {
    hoursDateInput.value = new Date().toISOString().split('T')[0];
  }

  // --- Expense Subtype Dynamic Lists ---
  const materialSubtypes = [
    "Paint (Sherwin-Williams Kitchener)",
    "Paint (Benjamin Moore Waterloo)",
    "Paint (Dulux Paints Kitchener)",
    "Brushes & Rollers (Home Depot)",
    "Tape & Masking (Sherwin-Williams)",
    "Drywall & Compound (Home Depot Kitchener)",
    "Drop Sheets & Protection (Home Depot)",
    "Sandpaper & Prep (Sherwin-Williams)",
    "Tools & Ladders (Home Depot)",
    "Other / Miscellaneous Store"
  ];

  const subcontratadoSubtypes = [
    "Helper",
    "Taper",
    "Pro Painter",
    "New Painter"
  ];

  const devolucaoSubtypes = [
    "Material Refund / Return",
    "Subcontractor Refund",
    "Other Adjustment / Credit"
  ];

  const updateSubtypeOptions = () => {
    if (!expTypeSelect || !expSubtypeSelect) return;
    const selectedType = expTypeSelect.value;
    
    // Add default blank option
    expSubtypeSelect.innerHTML = '<option value="" disabled selected>Choose category/type...</option>';
    
    let options = [];
    if (selectedType === 'Material') {
      options = materialSubtypes;
    } else if (selectedType === 'Subcontratado') {
      options = subcontratadoSubtypes;
    } else if (selectedType === 'Devolução') {
      options = devolucaoSubtypes;
    }

    options.forEach(opt => {
      const el = document.createElement('option');
      el.value = opt;
      el.textContent = opt;
      expSubtypeSelect.appendChild(el);
    });
  };

  // --- Helper: Format Currency ---
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(value);
  };

  // --- API Functions ---
  
  // Fetch projects and reload UI
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      
      state.projects = await response.json();
      renderProjectsSidebar();
      calculateGlobalStats();
      
      // If we had a selected project, refresh its cards & contents
      if (state.selectedProjectId) {
        const updatedProject = state.projects.find(p => p.id === state.selectedProjectId);
        if (updatedProject) {
          selectProject(updatedProject);
        } else {
          // Selected project was deleted
          deselectProject();
        }
      }
    } catch (error) {
      console.error(error);
      alert('Error fetching project data. Please verify your connection.');
    }
  };

  // Fetch expenses for a project
  const fetchExpenses = async (projectId) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/expenses`);
      if (!response.ok) throw new Error('Failed to fetch expenses');
      
      const expenses = await response.json();
      renderExpenses(expenses);
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch hours logged for a project
  const fetchHours = async (projectId) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/hours`);
      if (!response.ok) throw new Error('Failed to fetch hours');
      
      const hoursList = await response.json();
      renderHours(hoursList);
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch Telegram invoices
  const fetchTelegramInvoices = async () => {
    if (!telegramInvoiceList) return;
    try {
      const response = await fetch('/api/invoices/telegram');
      if (!response.ok) throw new Error('Failed to fetch Telegram invoices.');
      const invoices = await response.json();
      
      if (invoices.length === 0) {
        telegramInvoicesStatus.innerHTML = `<p style="color: rgba(58,63,65,0.6); font-size: 0.9rem; text-align: center; padding: 1rem 0;">No invoices generated via Telegram yet.</p>`;
        telegramInvoicesStatus.style.display = 'block';
        telegramInvoiceList.innerHTML = '';
        return;
      }
      
      telegramInvoicesStatus.style.display = 'none';
      telegramInvoiceList.innerHTML = '';
      
      invoices.forEach(inv => {
        const li = document.createElement('li');
        const formattedDate = new Date(inv.created_at).toLocaleDateString('en-CA', {
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        li.innerHTML = `
          <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
            <a href="${inv.url}" target="_blank" download style="display: flex; align-items: center; text-decoration: none; color: var(--admin-accent);">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 0.3rem;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              <div style="display: flex; flex-direction: column;">
                <strong>${escapeHTML(inv.invoice_number)}</strong>
                <span style="font-size: 0.75rem; color: rgba(58,63,65,0.7);">${escapeHTML(inv.client_name)} - CAD $${inv.amount.toFixed(2)}</span>
              </div>
            </a>
            <div class="inv-actions" style="display: flex; align-items: center; gap: 0.35rem;">
              <span class="inv-date">${formattedDate}</span>
              <button type="button" class="btn-action-icon btn-edit" title="Edit/Reload details">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
              <button type="button" class="btn-action-icon btn-delete" title="Delete Telegram Invoice">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
        `;
        
        // Add Edit Listener
        li.querySelector('.btn-edit').addEventListener('click', () => {
          invClientName.value = inv.client_name;
          invClientAddress.value = "";
          invTaxRate.value = 13;
          invDownPayments.value = "0.00";
          invDueDate.value = "Upon Receipt";
          invNotes.value = `Telegram Invoice ${inv.invoice_number}`;
          
          invoiceItemsContainer.innerHTML = '';
          const subtotal = inv.amount / 1.13;
          addInvoiceItemRow("Painting Services (Telegram Import)", 1, parseFloat(subtotal.toFixed(2)));
        });
        
        // Add Delete Listener
        li.querySelector('.btn-delete').addEventListener('click', async () => {
          if (confirm(`Are you sure you want to delete Telegram invoice ${inv.invoice_number}?`)) {
            try {
              const deleteResp = await fetch(`/api/invoices/telegram/${inv.id}`, {
                method: 'DELETE'
              });
              if (deleteResp.ok) {
                li.remove();
                if (telegramInvoiceList.children.length === 0) {
                  telegramInvoicesStatus.style.display = 'block';
                }
              } else {
                alert('Failed to delete invoice.');
              }
            } catch (err) {
              console.error(err);
            }
          }
        });
        
        telegramInvoiceList.appendChild(li);
      });
    } catch (error) {
      console.error(error);
      if (telegramInvoicesStatus) {
        telegramInvoicesStatus.innerHTML = `<p style="color: var(--admin-error); font-size: 0.9rem; text-align: center; padding: 1rem 0;">Error loading Telegram invoices.</p>`;
      }
    }
  };

  // --- Rendering UI Functions ---

  // Render Projects list in sidebar
  const renderProjectsSidebar = () => {
    const filteredProjects = state.projects.filter(p => {
      const query = state.searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(query) || p.address.toLowerCase().includes(query);
    });

    if (filteredProjects.length === 0) {
      projectListContainer.innerHTML = `<p style="text-align: center; color: rgba(58,63,65,0.4); padding: 1.5rem;">No projects found.</p>`;
      return;
    }

    projectListContainer.innerHTML = '';
    filteredProjects.forEach(proj => {
      const isSelected = state.selectedProjectId === proj.id;
      const projectItem = document.createElement('button');
      projectItem.className = `project-item ${isSelected ? 'active' : ''}`;
      projectItem.type = 'button';
      
      projectItem.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
          <div class="project-item-name" style="text-align: left;">${escapeHTML(proj.name)}</div>
          <button type="button" class="btn-delete-project-sidebar" title="Delete Project" style="background: none; border: none; padding: 0.2rem; cursor: pointer; color: rgba(58,63,65,0.4); transition: color 0.2s ease;">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
        <div class="project-item-address" style="text-align: left;">${escapeHTML(proj.address)}</div>
        <div class="project-item-charge">
          <span>${formatCurrency(proj.job_charge)}</span>
          <span class="project-item-hours">${proj.total_hours} hrs</span>
        </div>
      `;

      projectItem.addEventListener('click', () => {
        // Toggle active styling
        document.querySelectorAll('.project-item').forEach(el => el.classList.remove('active'));
        projectItem.classList.add('active');
        selectProject(proj);
      });

      // Hook up sidebar project delete action
      const deleteBtn = projectItem.querySelector('.btn-delete-project-sidebar');
      if (deleteBtn) {
        deleteBtn.addEventListener('mouseenter', () => {
          deleteBtn.style.color = 'var(--admin-error)';
        });
        deleteBtn.addEventListener('mouseleave', () => {
          deleteBtn.style.color = 'rgba(58,63,65,0.4)';
        });
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation(); // Avoid activating the project card
          
          if (!confirm(`Are you absolutely sure you want to delete the project "${proj.name}"? This will permanently delete all logged hours, expenses, and invoices.`)) {
            return;
          }
          
          try {
            const response = await fetch(`/api/projects/${proj.id}`, {
              method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete project');
            
            if (state.selectedProjectId === proj.id) {
              deselectProject();
            }
            fetchProjects();
          } catch (error) {
            alert(`Error deleting project: ${error.message}`);
          }
        });
      }

      projectListContainer.appendChild(projectItem);
    });
  };

  // Calculate Global Summary Stats
  const calculateGlobalStats = () => {
    let totalInvoiced = 0;
    let totalBalance = 0;
    let totalProfit = 0;
    let totalHours = 0;
    let totalExpensesVal = 0;
    let totalMaterialsVal = 0;
    let totalLaborVal = 0;

    state.projects.forEach(p => {
      totalInvoiced += p.invoice_total;
      totalBalance += p.balance_due;
      totalProfit += p.net_profit;
      totalHours += p.total_hours;
      totalExpensesVal += p.total_expenses || 0;
      totalMaterialsVal += p.total_materials || 0;
      totalLaborVal += p.total_labor || 0;
    });

    const averageHourly = totalHours > 0 ? (totalProfit / totalHours) : 0;

    globalInvoiced.textContent = formatCurrency(totalInvoiced);
    globalBalance.textContent = formatCurrency(totalBalance);
    globalProfit.textContent = formatCurrency(totalProfit);
    globalHourly.textContent = `${formatCurrency(averageHourly)}/hr`;
    globalHours.textContent = `${totalHours.toFixed(1)}h`;
    globalExpenses.textContent = formatCurrency(totalExpensesVal);
    globalMaterials.textContent = formatCurrency(totalMaterialsVal);
    globalLabor.textContent = formatCurrency(totalLaborVal);
  };

  // Add invoice item row helper
  const addInvoiceItemRow = (desc = '', qty = 1, price = 0) => {
    if (!invoiceItemsContainer) return;
    const row = document.createElement('div');
    row.className = 'invoice-item-row';
    row.innerHTML = `
      <div class="form-group col-desc">
        <input type="text" class="form-control item-desc" required placeholder="e.g. Painting Services" value="${escapeHTML(desc)}">
      </div>
      <div class="form-group col-qty">
        <input type="number" class="form-control item-qty" required min="1" step="1" value="${qty}">
      </div>
      <div class="form-group col-price">
        <input type="number" class="form-control item-price" required min="0" step="0.01" value="${price}">
      </div>
      <div class="col-delete">
        <button type="button" class="btn-icon-delete btn-remove-item" title="Remove Item" style="padding: 0.35rem; cursor: pointer;">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    `;
    
    row.querySelector('.btn-remove-item').addEventListener('click', () => {
      row.remove();
    });
    
    invoiceItemsContainer.appendChild(row);
  };

  // Select project to display in main panel
  const selectProject = (project) => {
    state.selectedProjectId = project.id;
    
    // UI layout toggle
    detailEmptyState.style.display = 'none';
    if (globalInvoicesContent) globalInvoicesContent.style.display = 'none';
    detailActiveContent.style.display = 'block';
    if (btnGlobalInvoices) btnGlobalInvoices.classList.remove('active');

    // Set Text Values
    detProjectName.textContent = project.name;
    detProjectAddress.textContent = project.address;
    
    // Set Metric Cards
    cardJobCharge.textContent = formatCurrency(project.job_charge);
    cardTotalInvoice.textContent = formatCurrency(project.invoice_total);
    cardBalanceDue.textContent = formatCurrency(project.balance_due);
    cardFinalCost.textContent = formatCurrency(project.estimated_final_cost);
    cardNetProfit.textContent = formatCurrency(project.net_profit);
    cardHourlyRate.textContent = `${formatCurrency(project.avg_hourly_earning)}/hr`;
    cardExpenses.textContent = formatCurrency(project.total_expenses || 0);
    cardMaterials.textContent = formatCurrency(project.total_materials || 0);
    cardLabor.textContent = formatCurrency(project.total_labor || 0);
    
    // Pre-populate invoice form
    if (invClientName && invClientAddress && invTaxRate && invDownPayments && invDueDate && invoiceItemsContainer) {
      invClientName.value = project.name;
      invClientAddress.value = project.address;
      invTaxRate.value = Math.round(project.tax_rate);
      invDownPayments.value = project.down_payments.toFixed(2);
      invDueDate.value = "Upon Receipt";
      if (invNotes) invNotes.value = "";
      
      // Clear items container
      invoiceItemsContainer.innerHTML = '';
      
      // Add default item for job charge
      addInvoiceItemRow("Painting Services", 1, project.job_charge);
    }
    
    // Fetch associated lists
    fetchExpenses(project.id);
    fetchHours(project.id);
    fetchProjectInvoices(project.id);
  };

  // Deselect project
  const deselectProject = () => {
    state.selectedProjectId = null;
    detailActiveContent.style.display = 'none';
    if (globalInvoicesContent) globalInvoicesContent.style.display = 'none';
    detailEmptyState.style.display = 'flex';
    document.querySelectorAll('.project-item').forEach(el => el.classList.remove('active'));
    if (btnGlobalInvoices) btnGlobalInvoices.classList.remove('active');
  };

  // Render expenses table
  const renderExpenses = (expenses) => {
    if (expenses.length === 0) {
      expensesListContainer.innerHTML = `<tr><td colspan="6" style="text-align: center; color: rgba(58,63,65,0.4); padding: 1.5rem;">No expenses registered.</td></tr>`;
      return;
    }

    expensesListContainer.innerHTML = '';
    expenses.forEach(exp => {
      const tr = document.createElement('tr');
      
      // Determine badge class
      let badgeClass = 'badge-material';
      let typeText = 'Material';
      if (exp.type === 'Subcontratado') {
        badgeClass = 'badge-sub';
        typeText = 'Subcontractor';
      } else if (exp.type === 'Devolução') {
        badgeClass = 'badge-return';
        typeText = 'Return';
      }

      const formattedDate = new Date(exp.created_at).toLocaleDateString('en-CA');
      const amountVal = exp.type === 'Devolução' ? -exp.amount : exp.amount;

      tr.innerHTML = `
        <td style="text-align: center;">
          <div style="display: flex; gap: 0.4rem; justify-content: center;">
            <button class="btn-icon-edit" title="Edit Expense">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
            </button>
            <button class="btn-icon-delete" data-id="${exp.id}" title="Delete Expense">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </td>
        <td style="font-weight: 500; color: ${exp.type === 'Devolução' ? 'var(--admin-success)' : 'var(--admin-dark)'}">
          ${formatCurrency(amountVal)}
        </td>
        <td><span class="badge ${badgeClass}">${typeText}</span></td>
        <td style="color: rgba(58, 63, 65, 0.85);">${escapeHTML(exp.subtype || 'N/A')}</td>
        <td>${exp.tax_included ? 'Yes' : 'No'}</td>
        <td>${formattedDate}</td>
      `;

      // Wire edit & delete handlers
      tr.querySelector('.btn-icon-edit').addEventListener('click', () => {
        startExpenseEdit(exp);
      });
      tr.querySelector('.btn-icon-delete').addEventListener('click', () => {
        deleteExpense(exp.id);
      });

      expensesListContainer.appendChild(tr);
    });
  };

  // Render hours table
  const renderHours = (hoursList) => {
    if (hoursList.length === 0) {
      hoursListContainer.innerHTML = `<tr><td colspan="4" style="text-align: center; color: rgba(58,63,65,0.4); padding: 1.5rem;">No hours logged yet.</td></tr>`;
      return;
    }

    hoursListContainer.innerHTML = '';
    hoursList.forEach(item => {
      const tr = document.createElement('tr');
      const dateLogged = new Date(item.created_at).toLocaleDateString('en-CA');
      
      tr.innerHTML = `
        <td style="text-align: center;">
          <div style="display: flex; gap: 0.4rem; justify-content: center;">
            <button class="btn-icon-edit" title="Edit Hours">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
            </button>
            <button class="btn-icon-delete" data-id="${item.id}" title="Delete Hours Record">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </td>
        <td style="font-weight: 500;">${item.date}</td>
        <td>${item.hours.toFixed(2)} hrs</td>
        <td>${dateLogged}</td>
      `;

      // Wire edit & delete handlers
      tr.querySelector('.btn-icon-edit').addEventListener('click', () => {
        startHoursEdit(item);
      });
      tr.querySelector('.btn-icon-delete').addEventListener('click', () => {
        deleteHoursRecord(item.id);
      });

      hoursListContainer.appendChild(tr);
    });
  };

  // --- Modals and Submissions handlers ---
  
  // Show modal helper
  const openProjectModal = (project = null) => {
    if (project) {
      modalProjectTitle.textContent = "Edit Project Details";
      projectIdField.value = project.id;
      projNameInput.value = project.name;
      projAddressInput.value = project.address;
      projChargeInput.value = project.job_charge;
      projTaxInput.value = project.tax_rate;
      projDownpaymentInput.value = project.down_payments;
      projFuturecostsInput.value = project.future_costs_estimate;
    } else {
      modalProjectTitle.textContent = "Create New Project";
      projectIdField.value = "";
      projectForm.reset();
      projTaxInput.value = "13.0";
      projDownpaymentInput.value = "0.00";
      projFuturecostsInput.value = "0.00";
    }
    modalProject.classList.add('active');
  };

  const closeProjectModal = () => {
    modalProject.classList.remove('active');
  };

  // Submit project create/edit
  projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = projectIdField.value;
    const projectData = {
      name: projNameInput.value.trim(),
      address: projAddressInput.value.trim(),
      job_charge: parseFloat(projChargeInput.value) || 0,
      tax_rate: parseFloat(projTaxInput.value) || 0,
      down_payments: parseFloat(projDownpaymentInput.value) || 0,
      future_costs_estimate: parseFloat(projFuturecostsInput.value) || 0
    };

    const isEdit = id !== "";
    const url = isEdit ? `/api/projects/${id}` : '/api/projects';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      const resJson = await response.json();
      if (!response.ok) throw new Error(resJson.error || 'Operation failed');

      closeProjectModal();
      
      if (!isEdit) {
        // If created, auto-select it later.
        state.selectedProjectId = resJson.id;
      }
      
      fetchProjects();
    } catch (error) {
      alert(`Error saving project: ${error.message}`);
    }
  });

  // Delete project
  const deleteActiveProject = async () => {
    if (!state.selectedProjectId) return;
    
    const activeProject = state.projects.find(p => p.id === state.selectedProjectId);
    if (!activeProject) return;

    if (!confirm(`Are you absolutely sure you want to delete the project "${activeProject.name}"? This will permanently delete all logged hours and expense history.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${state.selectedProjectId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete project');
      
      deselectProject();
      fetchProjects();
    } catch (error) {
      alert(`Error deleting project: ${error.message}`);
    }
  };

  // Submit new expense (Add or Edit)
  addExpenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.selectedProjectId) return;

    const expAmountInput = document.getElementById('exp-amount');
    const expTypeInput = document.getElementById('exp-type');
    const expSubtypeSelect = document.getElementById('exp-subtype');
    const expTaxCheckbox = document.getElementById('exp-tax-included');
    
    const expenseId = expenseIdField.value;
    const isEdit = expenseId !== "";

    const expenseData = {
      amount: parseFloat(expAmountInput.value) || 0,
      type: expTypeInput.value,
      subtype: expSubtypeSelect ? expSubtypeSelect.value : '',
      tax_included: expTaxCheckbox.checked
    };

    const url = isEdit ? `/api/expenses/${expenseId}` : `/api/projects/${state.selectedProjectId}/expenses`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      });

      const resJson = await response.json();
      if (!response.ok) throw new Error(resJson.error || 'Failed to save expense');

      cancelExpenseEdit();
      fetchProjects();
    } catch (error) {
      alert(`Error saving expense: ${error.message}`);
    }
  });

  // Delete expense
  const deleteExpense = async (expenseId) => {
    if (!confirm('Delete this expense?')) return;

    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete expense');
      fetchProjects();
    } catch (error) {
      alert(error.message);
    }
  };

  // Submit hours logging (Add or Edit)
  addHoursForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.selectedProjectId) return;

    const hoursAmountInput = document.getElementById('hours-amount');
    
    const hoursId = hoursIdField.value;
    const isEdit = hoursId !== "";

    const hoursData = {
      date: hoursDateInput.value,
      hours: parseFloat(hoursAmountInput.value) || 0
    };

    const url = isEdit ? `/api/hours/${hoursId}` : `/api/projects/${state.selectedProjectId}/hours`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hoursData)
      });

      const resJson = await response.json();
      if (!response.ok) throw new Error(resJson.error || 'Failed to save hours record');

      cancelHoursEdit();
      fetchProjects();
    } catch (error) {
      alert(`Error saving hours record: ${error.message}`);
    }
  });

  // Delete hours record
  const deleteHoursRecord = async (hoursId) => {
    if (!confirm('Delete this hours log?')) return;

    try {
      const response = await fetch(`/api/hours/${hoursId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete hours record');
      fetchProjects();
    } catch (error) {
      alert(error.message);
    }
  };

  // --- Inline Edit Setup Helpers ---
  const startExpenseEdit = (exp) => {
    expenseIdField.value = exp.id;
    document.getElementById('exp-amount').value = exp.amount;
    
    if (expTypeSelect) expTypeSelect.value = exp.type;
    
    // Update options first to display the subtype dropdown correctly
    updateSubtypeOptions();
    
    if (expSubtypeSelect) expSubtypeSelect.value = exp.subtype || '';
    
    document.getElementById('exp-tax-included').checked = exp.tax_included;
    
    expenseFormTitle.textContent = "Edit Expense";
    btnSubmitExpense.textContent = "Save Expense";
    btnCancelExpenseEdit.style.display = 'block';
  };

  const cancelExpenseEdit = () => {
    expenseIdField.value = "";
    addExpenseForm.reset();
    updateSubtypeOptions();
    
    expenseFormTitle.textContent = "Record Expense";
    btnSubmitExpense.textContent = "Add Expense";
    btnCancelExpenseEdit.style.display = 'none';
  };

  const startHoursEdit = (item) => {
    hoursIdField.value = item.id;
    hoursDateInput.value = item.date;
    document.getElementById('hours-amount').value = item.hours;
    
    hoursFormTitle.textContent = "Edit Hours";
    btnSubmitHours.textContent = "Save Changes";
    btnCancelHoursEdit.style.display = 'block';
  };

  const cancelHoursEdit = () => {
    hoursIdField.value = "";
    addHoursForm.reset();
    hoursDateInput.value = new Date().toISOString().split('T')[0];
    
    hoursFormTitle.textContent = "Log Hours";
    btnSubmitHours.textContent = "Log Hours";
    btnCancelHoursEdit.style.display = 'none';
  };

  // --- UI Interactivity Event Listeners ---

  // Search input change
  projectSearchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderProjectsSidebar();
  });

  // Create Project buttons wire
  btnNewProject.addEventListener('click', () => openProjectModal());
  btnEditProject.addEventListener('click', () => {
    const current = state.projects.find(p => p.id === state.selectedProjectId);
    if (current) openProjectModal(current);
  });
  btnDeleteProject.addEventListener('click', deleteActiveProject);

  // Close modals
  modalProjectClose.addEventListener('click', closeProjectModal);
  modalProjectCancel.addEventListener('click', closeProjectModal);
  
  // Close modals clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === modalProject) closeProjectModal();
  });

  // Tab Navigation switching
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
      
      if (tabId === 'tab-invoices') {
        fetchTelegramInvoices();
      }
    });
  });

  // Add invoice item row button
  if (btnAddInvoiceItem) {
    btnAddInvoiceItem.addEventListener('click', () => {
      addInvoiceItemRow('', 1, 0);
    });
  }

  // Generate Invoice Form submit handler
  if (generateInvoiceForm) {
    generateInvoiceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!state.selectedProjectId) {
        alert('Please select a project first.');
        return;
      }
      
      // Collect items
      const items = [];
      const itemRows = invoiceItemsContainer.querySelectorAll('.invoice-item-row');
      itemRows.forEach(row => {
        const desc = row.querySelector('.item-desc').value;
        const qty = parseInt(row.querySelector('.item-qty').value) || 1;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        items.push({ desc, qty, price });
      });
      
      if (items.length === 0) {
        alert('At least one line item is required.');
        return;
      }
      
      const payload = {
        client_name: invClientName.value,
        client_address: invClientAddress.value,
        tax_rate: parseFloat(invTaxRate.value) || 0,
        down_payments: parseFloat(invDownPayments.value) || 0,
        due_date: invDueDate.value,
        notes: invNotes ? invNotes.value : '',
        items: items
      };
      
      try {
        const submitBtn = document.getElementById('btn-generate-pdf');
        if (submitBtn) submitBtn.disabled = true;
        
        const response = await fetch(`/api/projects/${state.selectedProjectId}/generate_invoice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        if (submitBtn) submitBtn.disabled = false;
        
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to generate invoice.');
        }
        
        // Hide empty status
        if (generatedInvoicesStatus) {
          generatedInvoicesStatus.style.display = 'none';
        }
        
        // Save details in memory for editing
        sessionInvoices[result.filename] = {
          client_name: payload.client_name,
          client_address: payload.client_address,
          tax_rate: payload.tax_rate,
          down_payments: payload.down_payments,
          due_date: payload.due_date,
          notes: payload.notes,
          items: payload.items
        };
        
        // Refresh project invoices list from database
        fetchProjectInvoices(state.selectedProjectId);
        
      } catch (error) {
        console.error(error);
        alert(error.message || 'An error occurred while generating the invoice.');
      }
    });
  }

  // --- General Utilities ---
  
  // Basic HTML Escaper
  const escapeHTML = (str) => {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  };

  // --- Expense Subtype Dynamic Lists ---
  if (expTypeSelect) {
    expTypeSelect.addEventListener('change', updateSubtypeOptions);
    updateSubtypeOptions(); // Run once at start
  }

  // Wire Cancel Edit Buttons
  if (btnCancelExpenseEdit) btnCancelExpenseEdit.addEventListener('click', cancelExpenseEdit);
  if (btnCancelHoursEdit) btnCancelHoursEdit.addEventListener('click', cancelHoursEdit);

  // Fetch project-specific invoices
  const fetchProjectInvoices = async (projectId) => {
    if (!invoiceDownloadList) return;
    try {
      const response = await fetch(`/api/projects/${projectId}/invoices`);
      if (!response.ok) throw new Error('Failed to fetch project invoices.');
      const invoices = await response.json();
      
      if (invoices.length === 0) {
        generatedInvoicesStatus.innerHTML = `<p style="color: rgba(58,63,65,0.6); font-size: 0.9rem; text-align: center; padding: 1rem 0;">No invoices generated for this project yet.</p>`;
        generatedInvoicesStatus.style.display = 'block';
        invoiceDownloadList.innerHTML = '';
        return;
      }
      
      generatedInvoicesStatus.style.display = 'none';
      invoiceDownloadList.innerHTML = '';
      
      invoices.forEach(inv => {
        const li = document.createElement('li');
        const formattedDate = new Date(inv.created_at).toLocaleDateString('en-CA', {
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        li.innerHTML = `
          <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
            <a href="${inv.url}" target="_blank" download style="display: flex; align-items: center; text-decoration: none; color: var(--admin-accent);">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 0.3rem;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              <div style="display: flex; flex-direction: column;">
                <strong>${escapeHTML(inv.invoice_number)}</strong>
                <span style="font-size: 0.75rem; color: rgba(58,63,65,0.7);">${escapeHTML(inv.client_name)} - CAD $${inv.amount.toFixed(2)}</span>
              </div>
            </a>
            <div class="inv-actions" style="display: flex; align-items: center; gap: 0.35rem;">
              <span class="inv-date">${formattedDate}</span>
              <button type="button" class="btn-action-icon btn-edit" title="Edit/Reload details">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
              <button type="button" class="btn-action-icon btn-delete" title="Delete Invoice">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
        `;
        
        // Add Edit Listener
        li.querySelector('.btn-edit').addEventListener('click', () => {
          const details = sessionInvoices[inv.filename];
          if (details) {
            invClientName.value = details.client_name;
            invClientAddress.value = details.client_address;
            invTaxRate.value = Math.round(details.tax_rate);
            invDownPayments.value = details.down_payments.toFixed(2);
            invDueDate.value = details.due_date;
            invNotes.value = details.notes || "";
            
            invoiceItemsContainer.innerHTML = '';
            details.items.forEach(item => {
              addInvoiceItemRow(item.desc, item.qty, item.price);
            });
          } else {
            invClientName.value = inv.client_name;
            invClientAddress.value = "";
            invTaxRate.value = 13;
            invDownPayments.value = "0.00";
            invDueDate.value = "Upon Receipt";
            invNotes.value = "";
            
            invoiceItemsContainer.innerHTML = '';
            const subtotal = inv.amount / 1.13;
            addInvoiceItemRow("Painting Services", 1, parseFloat(subtotal.toFixed(2)));
          }
        });
        
        // Add Delete Listener
        li.querySelector('.btn-delete').addEventListener('click', async () => {
          if (confirm(`Are you sure you want to delete invoice ${inv.invoice_number}?`)) {
            try {
              const deleteResp = await fetch(`/api/invoices/project/${inv.id}`, {
                method: 'DELETE'
              });
              if (deleteResp.ok) {
                li.remove();
                delete sessionInvoices[inv.filename];
                if (invoiceDownloadList.children.length === 0) {
                  generatedInvoicesStatus.style.display = 'block';
                }
              } else {
                alert('Failed to delete invoice.');
              }
            } catch (err) {
              console.error(err);
            }
          }
        });
        
        invoiceDownloadList.appendChild(li);
      });
    } catch (error) {
      console.error(error);
      if (generatedInvoicesStatus) {
        generatedInvoicesStatus.innerHTML = `<p style="color: var(--admin-error); font-size: 0.9rem; text-align: center; padding: 1rem 0;">Error loading project invoices.</p>`;
      }
    }
  };

  // Fetch all global invoices (Website + Telegram)
  const fetchGlobalInvoices = async () => {
    if (!globalInvoicesList) return;
    try {
      const response = await fetch('/api/invoices/all');
      if (!response.ok) throw new Error('Failed to fetch global invoices.');
      const invoices = await response.json();
      
      if (invoices.length === 0) {
        globalInvoicesStatus.innerHTML = `<p style="color: rgba(58,63,65,0.6); font-size: 0.9rem; text-align: center; padding: 2rem 0;">No invoices generated yet.</p>`;
        globalInvoicesStatus.style.display = 'block';
        globalInvoicesList.innerHTML = '';
        return;
      }
      
      globalInvoicesStatus.style.display = 'none';
      globalInvoicesList.innerHTML = '';
      
      invoices.forEach(inv => {
        const li = document.createElement('li');
        const formattedDate = new Date(inv.created_at).toLocaleDateString('en-CA', {
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        const badgeColor = inv.source === 'Telegram' ? 'rgba(74, 144, 226, 0.15)' : 'rgba(46, 204, 113, 0.15)';
        const badgeText = inv.source === 'Telegram' ? 'Telegram' : 'Website';
        const badgeTextColor = inv.source === 'Telegram' ? '#2980b9' : '#27ae60';
        
        li.innerHTML = `
          <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
            <a href="${inv.url}" target="_blank" download style="display: flex; align-items: center; text-decoration: none; color: var(--admin-accent);">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 0.3rem;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              <div style="display: flex; flex-direction: column;">
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                  <strong>${escapeHTML(inv.invoice_number)}</strong>
                  <span style="font-size: 0.7rem; padding: 0.1rem 0.3rem; border-radius: 4px; background-color: ${badgeColor}; color: ${badgeTextColor}; font-weight: 600;">${badgeText}</span>
                </div>
                <span style="font-size: 0.75rem; color: rgba(58,63,65,0.7);">Billed to: ${escapeHTML(inv.client_name)} - CAD $${inv.amount.toFixed(2)}</span>
                <span style="font-size: 0.7rem; color: rgba(58,63,65,0.5);">Project: ${escapeHTML(inv.project_name)}</span>
              </div>
            </a>
            <div class="inv-actions" style="display: flex; align-items: center; gap: 0.35rem;">
              <span class="inv-date">${formattedDate}</span>
              <button type="button" class="btn-action-icon btn-delete" title="Delete Invoice">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
        `;
        
        // Add Delete Listener
        li.querySelector('.btn-delete').addEventListener('click', async () => {
          if (confirm(`Are you sure you want to delete invoice ${inv.invoice_number}?`)) {
            try {
              const url = inv.source === 'Telegram' 
                ? `/api/invoices/telegram/${inv.id}` 
                : `/api/invoices/project/${inv.id}`;
                
              const deleteResp = await fetch(url, { method: 'DELETE' });
              if (deleteResp.ok) {
                li.remove();
                if (globalInvoicesList.children.length === 0) {
                  globalInvoicesStatus.style.display = 'block';
                }
              } else {
                alert('Failed to delete invoice.');
              }
            } catch (err) {
              console.error(err);
            }
          }
        });
        
        globalInvoicesList.appendChild(li);
      });
    } catch (error) {
      console.error(error);
      if (globalInvoicesStatus) {
        globalInvoicesStatus.innerHTML = `<p style="color: var(--admin-error); font-size: 0.9rem; text-align: center; padding: 2rem 0;">Error loading global invoices.</p>`;
      }
    }
  };

  // Wire Global Invoices Button click event
  if (btnGlobalInvoices) {
    btnGlobalInvoices.addEventListener('click', () => {
      state.selectedProjectId = null;
      document.querySelectorAll('.project-item').forEach(el => el.classList.remove('active'));
      btnGlobalInvoices.classList.add('active');
      
      detailEmptyState.style.display = 'none';
      detailActiveContent.style.display = 'none';
      if (globalInvoicesContent) globalInvoicesContent.style.display = 'block';
      
      fetchGlobalInvoices();
    });
  }

  // --- Initial Launch ---
  fetchProjects();
});
