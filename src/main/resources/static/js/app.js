document.addEventListener("DOMContentLoaded", () => {
    fetchUsers();
    fetchMeds();
    fetchPrescricoes();
    setupNavigation();
    setupThemeToggle();
    setupNotifications();

    document.getElementById('user-form').addEventListener('submit', handleUserFormSubmit);
    document.getElementById('med-form').addEventListener('submit', handleMedFormSubmit);
    document.getElementById('prescricao-form').addEventListener('submit', handlePrescricaoFormSubmit);
});

// ==========================================
// Estado Global
// ==========================================
let currentUserIdToDelete = null;
let currentMedIdToDelete = null;
let currentPrescToDelete = null;
let medsData = [];
let usersList = []; // Para o select
let prescricoesData = [];

// ==========================================
// Modais
// ==========================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        if (modalId === 'user-modal') {
            document.getElementById('user-name').focus();
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        if (modalId === 'user-modal') {
            document.getElementById('user-form').reset();
            document.getElementById('user-id').value = '';
            document.getElementById('modal-title').textContent = 'Novo Paciente';
        } else if (modalId === 'med-modal') {
            document.getElementById('med-form').reset();
            document.getElementById('med-id').value = '';
            document.getElementById('med-modal-title').textContent = 'Novo Medicamento';
        } else if (modalId === 'prescricao-modal') {
            document.getElementById('prescricao-form').reset();
            document.getElementById('prescricao-modal-title').textContent = 'Nova Prescrição Médica';
            document.getElementById('presc-paciente').disabled = false;
            document.getElementById('presc-medicamento').disabled = false;
        }
    }
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal(overlay.id);
        }
    });
});

// ==========================================
// Navegação e Views (SPA)
// ==========================================
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));
            
            item.classList.add('active');
            
            const targetId = item.getAttribute('data-target');
            if (targetId) {
                document.getElementById(targetId).classList.add('active');
            }
        });
    });
}

// ==========================================
// Modo Noturno/Claro (Inverte o Neon)
// ==========================================
function setupThemeToggle() {
    const btnTheme = document.getElementById('btn-theme-toggle');
    const icon = btnTheme.querySelector('i');
    
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
        icon.classList.replace('bx-sun', 'bx-moon');
    }

    btnTheme.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        
        if (document.body.classList.contains('light-mode')) {
            localStorage.setItem('theme', 'light');
            icon.classList.replace('bx-sun', 'bx-moon');
        } else {
            localStorage.setItem('theme', 'dark');
            icon.classList.replace('bx-moon', 'bx-sun');
        }
    });
}

// ==========================================
// Notificações Dropdown
// ==========================================
function setupNotifications() {
    const btnNotif = document.getElementById('btn-notifications');
    const dropdown = document.getElementById('notifications-dropdown');

    btnNotif.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-wrapper')) {
            dropdown.classList.remove('active');
        }
    });
}

// ==========================================
// Toasts
// ==========================================
function showToast(title, message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'bx-check-circle' : 'bx-error-circle';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class='bx ${icon}'></i>
        </div>
        <div class="toast-content">
            <span class="toast-title">${title}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); 
    }, 4000);
}

// ==========================================
// Operações da API (CRUD e Dashboard Cálculos)
// ==========================================
async function fetchUsers() {
    const tableBody = document.getElementById('users-table-body');
    const dashTableBody = document.getElementById('dashboard-table-body');
    
    const totalUsersEl = document.getElementById('total-users');
    const totalAlertasEl = document.getElementById('total-alertas');
    const taxaAdesaoEl = document.getElementById('taxa-adesao');
    const badgeEl = document.getElementById('alerts-badge');
    const notifListEl = document.getElementById('notifications-list');
    
    try {
        const response = await fetch('/usuarios');
        if (!response.ok) throw new Error('Falha ao conectar com a API Backend');
        const users = await response.json();
        
        // Salva para uso global
        usersList = users;
        
        // 1. Cálculos do Dashboard baseados nos dados
        totalUsersEl.textContent = users.length;
        
        let perfilIncompleto = 0;
        
        users.forEach(u => {
            if (!u.telefone || !u.email) {
                perfilIncompleto++;
            }
        });
        
        // O resto dos alertas será preenchido por fetchPrescricoes()
        // Mas a adesão continua baseada no preenchimento de perfil:
        const adesao = users.length === 0 ? 0 : Math.round(((users.length - perfilIncompleto) / users.length) * 100);
        taxaAdesaoEl.textContent = `${adesao}%`;

        // 2. Renderizar Tabelas
        tableBody.innerHTML = '';
        dashTableBody.innerHTML = '';
        
        if (users.length === 0) {
            const emptyTr = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">Nenhum paciente cadastrado no momento.</td></tr>`;
            tableBody.innerHTML = emptyTr;
            dashTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">Nenhum paciente cadastrado.</td></tr>`;
            return;
        }

        users.forEach((user, index) => {
            const statusHtml = (user.telefone && user.email) ? `<span class="status-badge" style="background: rgba(16, 185, 129, 0.1); color: #34d399; border-color: rgba(16, 185, 129, 0.2);">Completo</span>` : `<span class="status-badge" style="background: rgba(245, 158, 11, 0.1); color: #fbbf24; border-color: rgba(245, 158, 11, 0.2);">Incompleto</span>`;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${user.idUsuario.toString().padStart(4, '0')}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="patient-avatar" style="width: 30px; height: 30px; border-radius: 50%; background: var(--neon-purple); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; color: #fff;">
                            ${user.nome.charAt(0).toUpperCase()}
                        </div>
                        <span style="font-weight: 500;">${user.nome}</span>
                    </div>
                </td>
                <td class="text-muted">${user.email || 'Sem email'}</td>
                <td>${user.telefone || 'Sem telefone'}</td>
                <td>${statusHtml}</td>
                <td>
                    <div class="action-btns">
                        <button title="Editar" onclick="editUser(${user.idUsuario})" class="edit-btn"><i class='bx bx-edit-alt'></i></button>
                        <button title="Excluir" onclick="confirmDeleteUser(${user.idUsuario})" class="delete-btn" style="color: #ef4444;"><i class='bx bx-trash'></i></button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);

            // Adicionar ao Dashboard apenas os 5 últimos
            if (index < 5) {
                const trDash = document.createElement('tr');
                trDash.innerHTML = `
                    <td>#${user.idUsuario.toString().padStart(4, '0')}</td>
                    <td style="font-weight: 500;">${user.nome}</td>
                    <td class="text-muted">${user.email || '-'}</td>
                    <td>${user.telefone || '-'}</td>
                    <td>${statusHtml}</td>
                `;
                dashTableBody.appendChild(trDash);
            }
        });

    } catch (error) {
        console.error('Erro:', error);
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444; padding: 30px;">Erro ao carregar dados.</td></tr>`;
        dashTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ef4444; padding: 30px;">Erro ao carregar dados.</td></tr>`;
    }
}

async function handleUserFormSubmit(event) {
    event.preventDefault();
    const btnSave = document.getElementById('btn-save-user');
    const originalText = btnSave.innerHTML;
    btnSave.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Salvando...`;
    btnSave.disabled = true;

    const id = document.getElementById('user-id').value;
    const user = {
        nome: document.getElementById('user-name').value,
        email: document.getElementById('user-email').value,
        telefone: document.getElementById('user-phone').value
    };
    
    if (id) {
        user.idUsuario = parseInt(id);
    }

    try {
        const response = await fetch('/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });

        if (!response.ok) throw new Error('Falha ao salvar paciente');

        closeModal('user-modal');
        showToast('Sucesso!', 'Paciente salvo com sucesso.', 'success');
        fetchUsers(); 
        
    } catch (error) {
        console.error('Erro ao salvar paciente:', error);
        showToast('Erro!', 'Ocorreu um erro ao salvar o paciente.', 'error');
    } finally {
        btnSave.innerHTML = originalText;
        btnSave.disabled = false;
    }
}

function editUser(id) {
    const user = usersList.find(u => u.idUsuario === id);
    if (user) {
        document.getElementById('user-id').value = user.idUsuario;
        document.getElementById('user-name').value = user.nome || '';
        document.getElementById('user-email').value = user.email || '';
        document.getElementById('user-phone').value = user.telefone || '';
        document.getElementById('modal-title').textContent = 'Editar Paciente';
        openModal('user-modal');
    }
}

function confirmDeleteUser(id) {
    currentUserIdToDelete = id;
    const btnConfirm = document.getElementById('btn-confirm-delete');
    btnConfirm.onclick = deleteUser;
    openModal('delete-modal');
}

async function deleteUser() {
    if (!currentUserIdToDelete) return;
    const btnConfirm = document.getElementById('btn-confirm-delete');
    const originalText = btnConfirm.innerHTML;
    btnConfirm.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Excluindo...`;
    btnConfirm.disabled = true;

    try {
        const response = await fetch(`/usuarios/${currentUserIdToDelete}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Falha ao excluir paciente');

        closeModal('delete-modal');
        showToast('Sucesso!', 'Paciente excluído com sucesso.', 'success');
        fetchUsers();
        
    } catch (error) {
        showToast('Erro!', 'Ocorreu um erro ao excluir o paciente.', 'error');
    } finally {
        btnConfirm.innerHTML = originalText;
        btnConfirm.disabled = false;
        currentUserIdToDelete = null;
    }
}

// ==========================================
// CRUD Medicamentos (API)
// ==========================================
async function fetchMeds() {
    const tableBody = document.getElementById('meds-table-body');
    
    try {
        const response = await fetch('/medicamentos');
        if (!response.ok) throw new Error('Falha na API de Medicamentos');
        
        medsData = await response.json();
        tableBody.innerHTML = '';
        
        if (medsData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">Nenhum medicamento cadastrado.</td></tr>`;
            return;
        }

        medsData.forEach(med => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${med.idMedicamento.toString().padStart(4, '0')}</td>
                <td>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 600; color: inherit;">${med.nomeComercial}</span>
                        <span style="font-size: 13px; color: var(--neon-cyan);">${med.nomeGenerico || 'Sem genérico'}</span>
                    </div>
                </td>
                <td>${med.formaUso || '-'}</td>
                <td><span class="status-badge" style="background: rgba(0, 242, 254, 0.1); color: var(--neon-cyan); border-color: rgba(0, 242, 254, 0.2);">${med.quantidade || '-'}</span></td>
                <td>
                    <div class="action-btns">
                        <button title="Editar" onclick="editMed(${med.idMedicamento})" class="edit-btn"><i class='bx bx-edit-alt'></i></button>
                        <button title="Excluir" onclick="confirmDeleteMed(${med.idMedicamento})" class="delete-btn" style="color: #ef4444;"><i class='bx bx-trash'></i></button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });

    } catch (error) {
        console.error('Erro:', error);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ef4444; padding: 30px;">Erro ao carregar medicamentos.</td></tr>`;
    }
}

async function handleMedFormSubmit(event) {
    event.preventDefault();
    const btnSave = document.getElementById('btn-save-med');
    const originalText = btnSave.innerHTML;
    btnSave.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Salvando...`;
    btnSave.disabled = true;

    const id = document.getElementById('med-id').value;
    const med = {
        nomeComercial: document.getElementById('med-nome').value,
        nomeGenerico: document.getElementById('med-generico').value,
        formaUso: document.getElementById('med-uso').value,
        quantidade: document.getElementById('med-qtd').value,
        observacao: document.getElementById('med-obs').value
    };
    
    if (id) {
        med.idMedicamento = parseInt(id);
    }

    try {
        const url = id ? `/medicamentos/${id}` : '/medicamentos';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(med)
        });

        if (!response.ok) throw new Error('Falha ao salvar medicamento');

        closeModal('med-modal');
        showToast('Sucesso!', 'Medicamento salvo com sucesso.', 'success');
        fetchMeds(); 
        
    } catch (error) {
        console.error('Erro ao salvar medicamento:', error);
        showToast('Erro!', 'Ocorreu um erro ao salvar o medicamento.', 'error');
    } finally {
        btnSave.innerHTML = originalText;
        btnSave.disabled = false;
    }
}

function editMed(id) {
    const med = medsData.find(m => m.idMedicamento === id);
    if (med) {
        document.getElementById('med-id').value = med.idMedicamento;
        document.getElementById('med-nome').value = med.nomeComercial || '';
        document.getElementById('med-generico').value = med.nomeGenerico || '';
        document.getElementById('med-uso').value = med.formaUso || '';
        document.getElementById('med-qtd').value = med.quantidade || '';
        document.getElementById('med-obs').value = med.observacao || '';
        document.getElementById('med-modal-title').textContent = 'Editar Medicamento';
        openModal('med-modal');
    }
}

function confirmDeleteMed(id) {
    currentMedIdToDelete = id;
    const btnConfirm = document.getElementById('btn-confirm-delete');
    btnConfirm.onclick = deleteMed;
    openModal('delete-modal');
}

async function deleteMed() {
    if (!currentMedIdToDelete) return;
    const btnConfirm = document.getElementById('btn-confirm-delete');
    const originalText = btnConfirm.innerHTML;
    btnConfirm.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Excluindo...`;
    btnConfirm.disabled = true;

    try {
        const response = await fetch(`/medicamentos/${currentMedIdToDelete}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Falha ao excluir medicamento');

        closeModal('delete-modal');
        showToast('Sucesso!', 'Medicamento excluído com sucesso.', 'success');
        fetchMeds();
        
    } catch (error) {
        showToast('Erro!', 'Ocorreu um erro ao excluir o medicamento.', 'error');
    } finally {
        btnConfirm.innerHTML = originalText;
        btnConfirm.disabled = false;
        currentMedIdToDelete = null;
    }
}

// ==========================================
// CRUD Prescrições e Motor de Alertas
// ==========================================
async function fetchPrescricoes() {
    const tableBody = document.getElementById('prescricoes-table-body');
    const badgeEl = document.getElementById('alerts-badge');
    const notifListEl = document.getElementById('notifications-list');
    const totalAlertasEl = document.getElementById('total-alertas');
    
    try {
        const response = await fetch('/prescricoes');
        if (!response.ok) throw new Error('Falha na API de Prescrições');
        
        prescricoesData = await response.json();
        tableBody.innerHTML = '';
        
        let alertasAtrasados = 0;
        let htmlAlertas = '';
        
        if (prescricoesData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">Nenhuma prescrição ativa.</td></tr>`;
        } else {
            const agora = new Date();
            
            prescricoesData.forEach(p => {
                const dataAlerta = new Date(p.dataHorarioAlerta);
                const isAtrasado = dataAlerta < agora && p.statusAlerta === 'PENDENTE';
                
                if (isAtrasado) {
                    alertasAtrasados++;
                    htmlAlertas += `
                        <div class="notification-item" style="border-left: 3px solid var(--neon-pink);">
                            <div style="font-size: 18px; color: var(--neon-pink); margin-right: 10px;"><i class='bx bx-alarm-exclamation'></i></div>
                            <div>
                                <p class="notif-desc"><b>${p.usuario.nome}</b> atrasou a medicação <b>${p.medicamento.nomeComercial}</b>.</p>
                                <p style="font-size: 11px; color: var(--text-muted);">Era para ${dataAlerta.toLocaleString()}</p>
                            </div>
                        </div>
                    `;
                }
                
                let statusHtml = '';
                if (p.statusAlerta === 'CONSUMIDO') {
                    statusHtml = `<span class="status-badge" style="background: rgba(16, 185, 129, 0.1); color: #34d399; border-color: rgba(16, 185, 129, 0.2);">Consumido</span>`;
                } else if (isAtrasado) {
                    statusHtml = `<span class="status-badge" style="background: rgba(247, 37, 133, 0.1); color: var(--neon-pink); border-color: rgba(247, 37, 133, 0.2);">Atrasado</span>`;
                } else {
                    statusHtml = `<span class="status-badge" style="background: rgba(245, 158, 11, 0.1); color: #fbbf24; border-color: rgba(245, 158, 11, 0.2);">Pendente</span>`;
                }
                
                let actionBtn = p.statusAlerta === 'PENDENTE' ? `<button title="Confirmar Consumo" onclick="confirmarConsumo(${p.usuario.idUsuario}, ${p.medicamento.idMedicamento})" class="edit-btn" style="color: #34d399;"><i class='bx bx-check'></i></button>` : '';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 500;">${p.usuario.nome}</td>
                    <td><span style="color: var(--neon-cyan);">${p.medicamento.nomeComercial}</span><br><small style="color: var(--text-muted);">${p.frequenciaUso || ''}</small></td>
                    <td>${dataAlerta.toLocaleString()}</td>
                    <td>${statusHtml}</td>
                    <td>
                        <div class="action-btns">
                            ${actionBtn}
                            <button title="Editar" onclick="editPrescricao(${p.usuario.idUsuario}, ${p.medicamento.idMedicamento})" class="edit-btn"><i class='bx bx-edit-alt'></i></button>
                            <button title="Excluir Prescrição" onclick="deletePrescricao(${p.usuario.idUsuario}, ${p.medicamento.idMedicamento})" class="delete-btn" style="color: #ef4444;"><i class='bx bx-trash'></i></button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        }
        
        // Atualiza Dashboard com Alertas Reais
        totalAlertasEl.textContent = alertasAtrasados;
        badgeEl.textContent = alertasAtrasados;
        
        if (alertasAtrasados > 0) {
            badgeEl.style.display = 'flex';
            notifListEl.innerHTML = htmlAlertas;
        } else {
            badgeEl.style.display = 'none';
            notifListEl.innerHTML = `<div class="notification-item"><p class="notif-desc">Nenhum alerta de medicação no momento.</p></div>`;
        }

    } catch (error) {
        console.error('Erro:', error);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ef4444; padding: 30px;">Erro ao carregar prescrições.</td></tr>`;
    }
}

async function handlePrescricaoFormSubmit(event) {
    event.preventDefault();
    const btnSave = document.getElementById('btn-save-prescricao');
    const originalText = btnSave.innerHTML;
    btnSave.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Ativando...`;
    btnSave.disabled = true;

    const payload = {
        usuario: { idUsuario: parseInt(document.getElementById('presc-paciente').value) },
        medicamento: { idMedicamento: parseInt(document.getElementById('presc-medicamento').value) },
        dataHorarioAlerta: document.getElementById('presc-data').value,
        frequenciaUso: document.getElementById('presc-freq').value,
        statusAlerta: "PENDENTE"
    };

    try {
        const response = await fetch('/prescricoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Falha ao salvar prescrição');

        closeModal('prescricao-modal');
        showToast('Sucesso!', 'Alerta ativado com sucesso.', 'success');
        fetchPrescricoes(); 
        
    } catch (error) {
        showToast('Erro!', 'Ocorreu um erro ao ativar o alerta.', 'error');
    } finally {
        btnSave.innerHTML = originalText;
        btnSave.disabled = false;
    }
}

async function confirmarConsumo(idUsuario, idMedicamento) {
    try {
        const response = await fetch(`/prescricoes/${idUsuario}/${idMedicamento}/consumir`, { method: 'POST' });
        if (response.ok) {
            showToast('Confirmado!', 'Medicamento registrado como consumido.', 'success');
            fetchPrescricoes();
        } else {
            throw new Error('Falha');
        }
    } catch (e) {
        showToast('Erro!', 'Não foi possível confirmar o consumo.', 'error');
    }
}

async function editPrescricao(idUsuario, idMedicamento) {
    const p = prescricoesData.find(x => x.usuario.idUsuario === idUsuario && x.medicamento.idMedicamento === idMedicamento);
    if (!p) return;
    
    openModal('prescricao-modal');
    populateSelects();
    
    document.getElementById('presc-paciente').value = p.usuario.idUsuario;
    document.getElementById('presc-medicamento').value = p.medicamento.idMedicamento;
    
    // Desabilitar chaves primárias para não criar um novo registro
    document.getElementById('presc-paciente').disabled = true;
    document.getElementById('presc-medicamento').disabled = true;
    
    document.getElementById('presc-data').value = p.dataHorarioAlerta.substring(0, 16); 
    document.getElementById('presc-freq').value = p.frequenciaUso || '';
    
    document.getElementById('prescricao-modal-title').textContent = 'Editar Prescrição';
}

async function deletePrescricao(idUsuario, idMedicamento) {
    if(!confirm('Deseja excluir esta prescrição?')) return;
    try {
        const response = await fetch(`/prescricoes/${idUsuario}/${idMedicamento}`, { method: 'DELETE' });
        if (response.ok) {
            showToast('Sucesso!', 'Prescrição excluída.', 'success');
            fetchPrescricoes();
        } else {
            throw new Error('Falha');
        }
    } catch (e) {
        showToast('Erro!', 'Não foi possível excluir.', 'error');
    }
}
