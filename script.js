// Configurações da API
const API_URL = 'https://apisimpsons.fly.dev/api/personajes?limit=50';
let allCharacters = [];
let currentPage = 1;
const itemsPerPage = 9;

// Elementos DOM
const charactersGrid = document.getElementById('characters-grid');
const loadingElement = document.getElementById('loading');
const loadButton = document.getElementById('load-characters');
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.filter-btn');
const paginationElement = document.getElementById('pagination');

// Função para mostrar/ocultar loading
function showLoading(show) {
    loadingElement.style.display = show ? 'flex' : 'none';
}

// Função para buscar dados da API
async function fetchCharacters() {
    showLoading(true);
    
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }
        
        const data = await response.json();
        allCharacters = data.docs;
        
        // Se a API não retornar imagens, adicionamos imagens de fallback
        allCharacters = allCharacters.map(char => {
            if (!char.Imagen || char.Imagen === "") {
                // Imagem de fallback baseada no nome
                const fallbackImages = [
                    'https://static.wikia.nocookie.net/simpsons/images/6/65/No_Image_Available.png',
                    'https://static.wikia.nocookie.net/simpsons/images/b/bd/Homer_Simpson.png',
                    'https://static.wikia.nocookie.net/simpsons/images/4/4d/MargeSimpson.png',
                    'https://static.wikia.nocookie.net/simpsons/images/9/9d/Bart_Simpson.png'
                ];
                const randomIndex = Math.floor(Math.random() * fallbackImages.length);
                char.Imagen = fallbackImages[randomIndex];
            }
            return char;
        });
        
        displayCharacters();
        setupPagination();
        
    } catch (error) {
        console.error('Erro ao buscar personagens:', error);
        charactersGrid.innerHTML = `
            <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <h3>Erro ao carregar personagens</h3>
                <p>${error.message}</p>
                <button onclick="fetchCharacters()" class="btn">Tentar novamente</button>
            </div>
        `;
    } finally {
        showLoading(false);
    }
}

// Função para criar um card de personagem
function createCharacterCard(character) {
    const card = document.createElement('div');
    card.className = 'character-card';
    
    // Determinar categoria para filtro
    const mainCharacters = ['Homer Simpson', 'Marge Simpson', 'Bart Simpson', 'Lisa Simpson', 'Maggie Simpson'];
    const familyCharacters = ['Abraham Simpson', 'Mona Simpson', 'Patty Bouvier', 'Selma Bouvier'];
    
    let category = 'secondary';
    if (mainCharacters.includes(character.Nombre)) {
        category = 'family';
    } else if (familyCharacters.includes(character.Nombre)) {
        category = 'family';
    } else if (character.Nombre && (character.Nombre.includes('Simpson') || character.Nombre.includes('Bouvier'))) {
        category = 'family';
    } else if (character.Nombre && (character.Nombre === 'Ned Flanders' || character.Nombre === 'Milhouse Van Houten' || 
               character.Nombre === 'Moe Szyslak' || character.Nombre === 'Principal Skinner')) {
        category = 'friends';
    }
    
    card.dataset.category = category;
    
    // Extrair informações
    const name = character.Nombre || 'Nome desconhecido';
    const image = character.Imagen || '';
    const description = character.Historia ? 
        character.Historia.substring(0, 150) + '...' : 
        'Informações sobre este personagem não disponíveis.';
    const occupation = character.Ocupacion || 'Desconhecida';
    const status = character.Estado || 'Desconhecido';
    
    // Função para gerar cor baseada no nome (para fallback)
    const nameToColor = (name) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
            '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
        ];
        return colors[Math.abs(hash) % colors.length];
    };
    
    // HTML do card com fallback de imagem melhorado
    card.innerHTML = `
        <div class="card-image">
            ${image ? 
                `<img src="${image}" alt="${name}" 
                      onerror="this.onerror=null; this.src=''; this.style.display='none'; 
                               this.parentElement.innerHTML='<div class=\"no-image\" style=\"background-color: ${nameToColor(name)};\">${name.substring(0, 15)}${name.length > 15 ? '...' : ''}</div>';" />` :
                `<div class="no-image" style="background-color: ${nameToColor(name)};">
                    ${name.substring(0, 15)}${name.length > 15 ? '...' : ''}
                </div>`
            }
        </div>
        <div class="card-content">
            <h3>${name}</h3>
            <p>${description}</p>
            <div class="card-details">
                <div class="detail">
                    <i class="fas fa-briefcase"></i>
                    <span>${occupation}</span>
                </div>
                <div class="detail">
                    <i class="fas fa-heartbeat"></i>
                    <span>${status}</span>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Função para exibir personagens na página atual
function displayCharacters() {
    charactersGrid.innerHTML = '';
    
    // Filtrar personagens baseado na busca e filtro ativo
    const searchTerm = searchInput.value.toLowerCase();
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
    
    let filteredCharacters = allCharacters.filter(character => {
        const name = character.Nombre ? character.Nombre.toLowerCase() : '';
        const matchesSearch = name.includes(searchTerm);
        
        // Determinar categoria do personagem (lógica simplificada)
        const mainCharacters = ['Homer Simpson', 'Marge Simpson', 'Bart Simpson', 'Lisa Simpson', 'Maggie Simpson'];
        const familyCharacters = ['Abraham Simpson', 'Mona Simpson', 'Patty Bouvier', 'Selma Bouvier'];
        
        let category = 'secondary';
        if (mainCharacters.includes(character.Nombre)) {
            category = 'family';
        } else if (familyCharacters.includes(character.Nombre)) {
            category = 'family';
        } else if (character.Nombre && (character.Nombre.includes('Simpson') || character.Nombre.includes('Bouvier'))) {
            category = 'family';
        } else if (character.Nombre && (character.Nombre === 'Ned Flanders' || character.Nombre === 'Milhouse Van Houten' || 
                   character.Nombre === 'Moe Szyslak' || character.Nombre === 'Principal Skinner')) {
            category = 'friends';
        }
        
        const matchesFilter = activeFilter === 'all' || category === activeFilter;
        
        return matchesSearch && matchesFilter;
    });
    
    // Paginação
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const charactersToShow = filteredCharacters.slice(startIndex, endIndex);
    
    if (charactersToShow.length === 0) {
        charactersGrid.innerHTML = `
            <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <h3>Nenhum personagem encontrado</h3>
                <p>Tente ajustar sua busca ou filtro.</p>
            </div>
        `;
        return;
    }
    
    // Criar e adicionar cards
    charactersToShow.forEach(character => {
        const card = createCharacterCard(character);
        charactersGrid.appendChild(card);
    });
}

// Configurar paginação
function setupPagination() {
    paginationElement.innerHTML = '';
    
    const searchTerm = searchInput.value.toLowerCase();
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
    
    let filteredCharacters = allCharacters.filter(character => {
        const name = character.Nombre ? character.Nombre.toLowerCase() : '';
        const matchesSearch = name.includes(searchTerm);
        
        // Determinar categoria do personagem (mesma lógica de displayCharacters)
        const mainCharacters = ['Homer Simpson', 'Marge Simpson', 'Bart Simpson', 'Lisa Simpson', 'Maggie Simpson'];
        const familyCharacters = ['Abraham Simpson', 'Mona Simpson', 'Patty Bouvier', 'Selma Bouvier'];
        
        let category = 'secondary';
        if (mainCharacters.includes(character.Nombre)) {
            category = 'family';
        } else if (familyCharacters.includes(character.Nombre)) {
            category = 'family';
        } else if (character.Nombre && (character.Nombre.includes('Simpson') || character.Nombre.includes('Bouvier'))) {
            category = 'family';
        } else if (character.Nombre && (character.Nombre === 'Ned Flanders' || character.Nombre === 'Milhouse Van Houten' || 
                   character.Nombre === 'Moe Szyslak' || character.Nombre === 'Principal Skinner')) {
            category = 'friends';
        }
        
        const matchesFilter = activeFilter === 'all' || category === activeFilter;
        
        return matchesSearch && matchesFilter;
    });
    
    const pageCount = Math.ceil(filteredCharacters.length / itemsPerPage);
    
    if (pageCount <= 1) return;
    
    // Botão anterior
    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.className = 'page-btn';
        prevButton.innerHTML = '<i class="fas fa-chevron-left"></i> Anterior';
        prevButton.addEventListener('click', () => {
            currentPage--;
            displayCharacters();
            setupPagination();
            window.scrollTo({ top: charactersGrid.offsetTop - 100, behavior: 'smooth' });
        });
        paginationElement.appendChild(prevButton);
    }
    
    // Números das páginas
    for (let i = 1; i <= pageCount; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => {
            currentPage = i;
            displayCharacters();
            setupPagination();
            window.scrollTo({ top: charactersGrid.offsetTop - 100, behavior: 'smooth' });
        });
        paginationElement.appendChild(pageButton);
    }
    
    // Botão próximo
    if (currentPage < pageCount) {
        const nextButton = document.createElement('button');
        nextButton.className = 'page-btn';
        nextButton.innerHTML = 'Próximo <i class="fas fa-chevron-right"></i>';
        nextButton.addEventListener('click', () => {
            currentPage++;
            displayCharacters();
            setupPagination();
            window.scrollTo({ top: charactersGrid.offsetTop - 100, behavior: 'smooth' });
        });
        paginationElement.appendChild(nextButton);
    }
}

// Função para filtrar personagens
function filterCharacters(filter) {
    // Atualizar botões ativos
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    
    currentPage = 1;
    displayCharacters();
    setupPagination();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Carregar personagens automaticamente após 1 segundo
    setTimeout(fetchCharacters, 1000);
    
    // Botão de carregar personagens
    loadButton.addEventListener('click', fetchCharacters);
    
    // Busca em tempo real
    searchInput.addEventListener('input', () => {
        currentPage = 1;
        displayCharacters();
        setupPagination();
    });
    
    // Filtros
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterCharacters(button.dataset.filter);
        });
    });
    
    // Navegação suave
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Exibir informações no console para demonstração técnica
console.log('Aplicação Front-End para API de Desenhos iniciada!');
console.log('API utilizada: Simpsons API (https://apisimpsons.fly.dev/)');
console.log('Método de consumo: Fetch API com JavaScript puro');