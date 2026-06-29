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
        <div class="project-item-name">${escapeHTML(proj.name)}</div>
        <div class="project-item-address">${escapeHTML(proj.address)}</div>
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

  // Select project to display in main panel
  const selectProject = (project) => {
    state.selectedProjectId = project.id;
    
    // UI layout toggle
    detailEmptyState.style.display = 'none';
    detailActiveContent.style.display = 'block';

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
    
    // Fetch associated lists
    fetchExpenses(project.id);
    fetchHours(project.id);
  };

  // Deselect project
  const deselectProject = () => {
    state.selectedProjectId = null;
    detailActiveContent.style.display = 'none';
    detailEmptyState.style.display = 'flex';
    document.querySelectorAll('.project-item').forEach(el => el.classList.remove('active'));
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
    });
  });

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

  // --- Initial Launch ---
  fetchProjects();
});
