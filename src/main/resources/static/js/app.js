document.addEventListener("DOMContentLoaded", () => {
    fetchUsers();

    // Setup Event Listeners
    document.getElementById('user-form').addEventListener('submit', handleUserFormSubmit);
});

// ==========================================
// Estado Global
// ==========================================
let currentUserIdToDelete = null;

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
        // Limpar o formulário se for o modal de usuário
        if (modalId === 'user-modal') {
            document.getElementById('user-form').reset();
            document.getElementById('user-id').value = '';
            document.getElementById('modal-title').textContent = 'Novo Paciente';
        }
    }
}

// Fechar modal ao clicar fora do conteúdo
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal(overlay.id);
        }
    });
});

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
    
    // Animação de entrada
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remover após 4 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); // Aguardar transição CSS
    }, 4000);
}

// ==========================================
// Operações da API (CRUD)
// ==========================================
async function fetchUsers() {
    const tableBody = document.getElementById('users-table-body');
    const totalUsersEl = document.getElementById('total-users');
    
    try {
        const response = await fetch('/usuarios');
        
        if (!response.ok) {
            throw new Error('Falha ao conectar com a API Backend');
        }
        
        const users = await response.json();
        
        // Atualiza a estatística
        totalUsersEl.textContent = users.length;
        
        // Limpa a tabela
        tableBody.innerHTML = '';
        
        if (users.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">
                        Nenhum paciente cadastrado no momento.
                    </td>
                </tr>
            `;
            return;
        }

        // Renderiza os usuários
        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${user.idUsuario.toString().padStart(4, '0')}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 30px; height: 30px; border-radius: 50%; background: var(--accent-primary); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; color: white;">
                            ${user.nome.charAt(0).toUpperCase()}
                        </div>
                        ${user.nome}
                    </div>
                </td>
                <td style="color: var(--text-muted);">${user.email}</td>
                <td>${user.telefone}</td>
                <td><span class="status-badge">Ativo</span></td>
                <td>
                    <div class="action-btns">
                        <button title="Excluir" onclick="confirmDeleteUser(${user.idUsuario})" class="delete-btn" style="color: #ef4444;"><i class='bx bx-trash'></i></button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });

    } catch (error) {
        console.error('Erro:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #ef4444; padding: 30px;">
                    <i class='bx bx-error-circle' style="font-size: 24px; vertical-align: middle;"></i> 
                    Erro ao carregar dados. Verifique se o Backend Spring Boot está rodando.
                </td>
            </tr>
        `;
    }
}

async function handleUserFormSubmit(event) {
    event.preventDefault();
    
    const btnSave = document.getElementById('btn-save-user');
    const originalText = btnSave.innerHTML;
    btnSave.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Salvando...`;
    btnSave.disabled = true;

    const user = {
        nome: document.getElementById('user-name').value,
        email: document.getElementById('user-email').value,
        telefone: document.getElementById('user-phone').value
    };

    try {
        const response = await fetch('/usuarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        });

        if (!response.ok) {
            throw new Error('Falha ao salvar paciente');
        }

        closeModal('user-modal');
        showToast('Sucesso!', 'Paciente cadastrado com sucesso.', 'success');
        fetchUsers(); // Atualiza a tabela
        
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro!', 'Ocorreu um erro ao salvar o paciente.', 'error');
    } finally {
        btnSave.innerHTML = originalText;
        btnSave.disabled = false;
    }
}

function confirmDeleteUser(id) {
    currentUserIdToDelete = id;
    
    // Atualiza o listener do botão de confirmação para evitar múltiplos bindings
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

        if (!response.ok) {
            throw new Error('Falha ao excluir paciente');
        }

        closeModal('delete-modal');
        showToast('Sucesso!', 'Paciente excluído com sucesso.', 'success');
        fetchUsers(); // Atualiza a tabela
        
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro!', 'Ocorreu um erro ao excluir o paciente.', 'error');
    } finally {
        btnConfirm.innerHTML = originalText;
        btnConfirm.disabled = false;
        currentUserIdToDelete = null;
    }
}
