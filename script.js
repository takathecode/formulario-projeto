// Classe para gerenciar as viagens
class TripManager {
    constructor() {
        this.trips = this.loadTrips();
        this.currentEditId = null;
        this.init();
    }

    // Inicializar
    init() {
        this.renderTrips();
        this.updateStats();
        this.updateStorageInfo();
        this.setupEventListeners();
        this.setupFormValidation();
    }

    // Carregar viagens do localStorage
    loadTrips() {
        const tripsJSON = localStorage.getItem('travelTrips');
        return tripsJSON ? JSON.parse(tripsJSON) : [];
    }

    // Salvar viagens no localStorage
    saveTrips() {
        localStorage.setItem('travelTrips', JSON.stringify(this.trips));
        this.updateLastUpdate();
        this.updateStorageInfo();
    }

    // Adicionar nova viagem
    addTrip(tripData) {
        const newTrip = {
            id: Date.now().toString(),
            ...tripData,
            createdAt: new Date().toISOString()
        };
        
        this.trips.push(newTrip);
        this.saveTrips();
        this.renderTrips();
        this.updateStats();
        this.showNotification('Viagem adicionada com sucesso!', 'success');
    }

    // Editar viagem existente
    editTrip(id, updatedData) {
        const index = this.trips.findIndex(trip => trip.id === id);
        if (index !== -1) {
            this.trips[index] = {
                ...this.trips[index],
                ...updatedData,
                updatedAt: new Date().toISOString()
            };
            this.saveTrips();
            this.renderTrips();
            this.updateStats();
            this.showNotification('Viagem atualizada com sucesso!', 'success');
        }
    }

    // Excluir viagem
    deleteTrip(id) {
        if (confirm('Tem certeza que deseja excluir esta viagem?')) {
            this.trips = this.trips.filter(trip => trip.id !== id);
            this.saveTrips();
            this.renderTrips();
            this.updateStats();
            this.showNotification('Viagem excluída!', 'error');
        }
    }

    // Limpar todas as viagens
    clearAllTrips() {
        if (this.trips.length === 0) {
            this.showNotification('Não há viagens para limpar.', 'info');
            return;
        }
        
        if (confirm('Tem certeza que deseja excluir TODAS as viagens? Esta ação não pode ser desfeita.')) {
            this.trips = [];
            this.saveTrips();
            this.renderTrips();
            this.updateStats();
            this.showNotification('Todas as viagens foram removidas!', 'error');
        }
    }

    // Exportar dados
    exportData() {
        if (this.trips.length === 0) {
            this.showNotification('Não há dados para exportar.', 'info');
            return;
        }
        
        const dataStr = JSON.stringify(this.trips, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'viagens_' + new Date().toISOString().split('T')[0] + '.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showNotification('Dados exportados com sucesso!', 'success');
    }

    // Renderizar lista de viagens
    renderTrips() {
        const tripsList = document.getElementById('tripsList');
        const totalTripsElement = document.getElementById('totalTrips');
        
        totalTripsElement.textContent = this.trips.length;
        
        if (this.trips.length === 0) {
            tripsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-suitcase-rolling empty-icon"></i>
                    <h3>Nenhuma viagem cadastrada</h3>
                    <p>Adicione sua primeira viagem usando o formulário ao lado.</p>
                </div>
            `;
            return;
        }
        
        // Ordenar por data mais próxima
        const sortedTrips = [...this.trips].sort((a, b) => 
            new Date(a.travelDate) - new Date(b.travelDate)
        );
        
        tripsList.innerHTML = sortedTrips.map(trip => this.createTripCard(trip)).join('');
    }

    // Criar card de viagem
    createTripCard(trip) {
        const formattedDate = new Date(trip.travelDate).toLocaleDateString('pt-BR');
        const formattedBudget = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(trip.budget);
        
        return `
            <div class="trip-card" data-id="${trip.id}">
                <div class="trip-card-header">
                    <div class="trip-destination">${trip.destination}</div>
                    <div class="trip-date">${formattedDate}</div>
                </div>
                
                <div class="trip-details">
                    <div class="detail-item">
                        <span class="detail-label">Viajante:</span>
                        <span class="detail-value">${trip.travelerName}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">E-mail:</span>
                        <span class="detail-value">${trip.travelerEmail}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Orçamento:</span>
                        <span class="detail-value">${formattedBudget}</span>
                    </div>
                </div>
                
                ${trip.notes ? `
                    <div class="trip-notes">
                        <strong>Observações:</strong> ${trip.notes}
                    </div>
                ` : ''}
                
                <div class="trip-actions">
                    <button class="action-btn edit-btn" data-id="${trip.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="action-btn delete-btn" data-id="${trip.id}">
                        <i class="fas fa-trash-alt"></i> Excluir
                    </button>
                </div>
            </div>
        `;
    }

    // Atualizar estatísticas
    updateStats() {
        const summaryCount = document.getElementById('summaryCount');
        const summaryBudget = document.getElementById('summaryBudget');
        const nextTrip = document.getElementById('nextTrip');
        
        summaryCount.textContent = this.trips.length;
        
        // Calcular orçamento total
        const totalBudget = this.trips.reduce((sum, trip) => sum + Number(trip.budget), 0);
        summaryBudget.textContent = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(totalBudget);
        
        // Encontrar próxima viagem
        const futureTrips = this.trips
            .filter(trip => new Date(trip.travelDate) >= new Date())
            .sort((a, b) => new Date(a.travelDate) - new Date(b.travelDate));
        
        if (futureTrips.length > 0) {
            const nextTripDate = new Date(futureTrips[0].travelDate).toLocaleDateString('pt-BR');
            nextTrip.textContent = `${futureTrips[0].destination} - ${nextTripDate}`;
        } else {
            nextTrip.textContent = 'Nenhuma';
        }
    }

    // Atualizar informação de armazenamento
    updateStorageInfo() {
        const storageUsed = document.getElementById('storageUsed');
        const tripsJSON = JSON.stringify(this.trips);
        const sizeInKB = (new Blob([tripsJSON]).size / 1024).toFixed(2);
        storageUsed.textContent = `${sizeInKB} KB`;
    }

    // Atualizar última atualização
    updateLastUpdate() {
        const lastUpdateElement = document.getElementById('lastUpdate');
        const now = new Date();
        lastUpdateElement.textContent = now.toLocaleTimeString('pt-BR');
    }

    // Configurar listeners de eventos
    setupEventListeners() {
        // Formulário de nova viagem
        document.getElementById('tripForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
        
        // Limpar formulário
        document.getElementById('clearForm').addEventListener('click', () => {
            document.getElementById('tripForm').reset();
            this.showNotification('Formulário limpo!', 'info');
        });
        
        // Limpar todas as viagens
        document.getElementById('clearAll').addEventListener('click', () => {
            this.clearAllTrips();
        });
        
        // Exportar dados
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });
        
        // Delegar eventos para botões de editar/excluir
        document.getElementById('tripsList').addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            
            const id = target.dataset.id;
            if (target.classList.contains('edit-btn')) {
                this.openEditModal(id);
            } else if (target.classList.contains('delete-btn')) {
                this.deleteTrip(id);
            }
        });
        
        // Modal de edição
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeEditModal();
        });
        
        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.closeEditModal();
        });
        
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditSubmit();
        });
        
        // Fechar modal ao clicar fora
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') {
                this.closeEditModal();
            }
        });
    }

    // Configurar validação do formulário
    setupFormValidation() {
        const form = document.getElementById('tripForm');
        const dateInput = document.getElementById('travelDate');
        
        // Configurar data mínima como hoje
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        
        // Validação personalizada para orçamento
        const budgetInput = document.getElementById('budget');
        budgetInput.addEventListener('input', (e) => {
            if (e.target.value < 0) {
                e.target.value = 0;
            }
        });
    }

    // Manipular envio do formulário
    handleFormSubmit() {
        const form = document.getElementById('tripForm');
        
        // Coletar dados do formulário
        const tripData = {
            destination: document.getElementById('destination').value.trim(),
            travelDate: document.getElementById('travelDate').value,
            travelerName: document.getElementById('travelerName').value.trim(),
            travelerEmail: document.getElementById('travelerEmail').value.trim(),
            budget: document.getElementById('budget').value,
            notes: document.getElementById('notes').value.trim()
        };
        
        // Validação adicional
        if (tripData.destination === '' || tripData.travelerName === '' || tripData.travelerEmail === '') {
            this.showNotification('Preencha todos os campos obrigatórios!', 'error');
            return;
        }
        
        if (!this.validateEmail(tripData.travelerEmail)) {
            this.showNotification('Digite um e-mail válido!', 'error');
            return;
        }
        
        // Adicionar viagem
        this.addTrip(tripData);
        
        // Limpar formulário
        form.reset();
        
        // Foco no primeiro campo
        document.getElementById('destination').focus();
    }

    // Abrir modal de edição
    openEditModal(id) {
        const trip = this.trips.find(t => t.id === id);
        if (!trip) return;
        
        this.currentEditId = id;
        
        // Preencher formulário de edição
        document.getElementById('editDestination').value = trip.destination;
        document.getElementById('editDate').value = trip.travelDate;
        document.getElementById('editBudget').value = trip.budget;
        document.getElementById('editNotes').value = trip.notes || '';
        
        // Mostrar modal
        document.getElementById('editModal').style.display = 'flex';
    }

    // Fechar modal de edição
    closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
        this.currentEditId = null;
        document.getElementById('editForm').reset();
    }

    // Manipular envio do formulário de edição
    handleEditSubmit() {
        if (!this.currentEditId) return;
        
        const updatedData = {
            destination: document.getElementById('editDestination').value.trim(),
            travelDate: document.getElementById('editDate').value,
            budget: document.getElementById('editBudget').value,
            notes: document.getElementById('editNotes').value.trim()
        };
        
        if (updatedData.destination === '') {
            this.showNotification('O destino é obrigatório!', 'error');
            return;
        }
        
        this.editTrip(this.currentEditId, updatedData);
        this.closeEditModal();
    }

    // Validar e-mail
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Mostrar notificação
    showNotification(message, type) {
        // Remover notificação anterior se existir
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Criar nova notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        // Adicionar ao corpo
        document.body.appendChild(notification);
        
        // Mostrar com animação
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Configurar botão de fechar
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }
}

// Estilos para notificações
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        padding: 1rem 1.5rem;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        z-index: 10000;
        transform: translateX(150%);
        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        max-width: 400px;
        border-left: 4px solid #3498db;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-success {
        border-left-color: #2ecc71;
    }
    
    .notification-error {
        border-left-color: #e74c3c;
    }
    
    .notification-info {
        border-left-color: #3498db;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        flex: 1;
    }
    
    .notification-content i {
        font-size: 1.2rem;
    }
    
    .notification-success .notification-content i {
        color: #2ecc71;
    }
    
    .notification-error .notification-content i {
        color: #e74c3c;
    }
    
    .notification-info .notification-content i {
        color: #3498db;
    }
    
    .notification-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #95a5a6;
        cursor: pointer;
        line-height: 1;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.3s;
    }
    
    .notification-close:hover {
        background-color: #f8f9fa;
        color: #e74c3c;
    }
`;

document.head.appendChild(notificationStyles);

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    const tripManager = new TripManager();
    
    // Atualizar última atualização
    tripManager.updateLastUpdate();
    
    // Adicionar estilo para data futura
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('travelDate').min = today;
    
    // Demonstrar funcionalidade com dados de exemplo se localStorage estiver vazio
    if (localStorage.getItem('travelTrips') === null) {
        // Adicionar algumas viagens de exemplo
        const exampleTrips = [
            {
                destination: "Florianópolis, Brasil",
                travelDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                travelerName: "João Silva",
                travelerEmail: "joao@exemplo.com",
                budget: 3500,
                notes: "Quero conhecer as praias do norte da ilha"
            },
            {
                destination: "Buenos Aires, Argentina",
                travelDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                travelerName: "Maria Santos",
                travelerEmail: "maria@exemplo.com",
                budget: 5000,
                notes: "Vou para ver um show de tango"
            }
        ];
        
        // Adicionar após um breve delay para não interferir na experiência do usuário
        setTimeout(() => {
            if (tripManager.trips.length === 0) {
                exampleTrips.forEach(trip => {
                    tripManager.addTrip(trip);
                });
                tripManager.showNotification('Foram adicionadas viagens de exemplo para demonstração!', 'info');
            }
        }, 1000);
    }
});