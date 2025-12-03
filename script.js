// ===================================
// GLOBAL VARIABLES
// ===================================

let map;
let markers = [];
let products = []; // Array to store products
const API_BASE_URL = 'https://ooh-system.kaike-458.workers.dev';

// ===================================
// MAP INITIALIZATION
// ===================================

function initMap() {
    // Initialize Leaflet map centered on Brazil
    map = L.map('map').setView([-15.7801, -47.9292], 4);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Load existing points
    loadPoints();
}

// ===================================
// LOAD POINTS FROM API
// ===================================

async function loadPoints() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/ooh`);

        if (!response.ok) {
            throw new Error('Erro ao carregar pontos');
        }

        const points = await response.json();

        // Clear existing markers
        markers.forEach(marker => marker.remove());
        markers = [];

        // Add markers for each point
        if (points.length > 0) {
            const bounds = [];

            points.forEach(point => {
                if (point.latitude && point.longitude) {
                    const marker = L.marker([point.latitude, point.longitude], {
                        icon: createCustomIcon()
                    }).addTo(map);

                    // Create popup content
                    const popupContent = `
                        <div class="popup-content">
                            <h3>${point.codigo_ooh}</h3>
                            <p><strong>Endereço:</strong> ${point.endereco || 'N/A'}</p>
                            <p><strong>Exibidora:</strong> ${point.exibidora_nome || 'N/A'}</p>
                            <p><strong>Cidade:</strong> ${point.cidade || 'N/A'} - ${point.uf || 'N/A'}</p>
                            ${point.medidas ? `<p><strong>Medidas:</strong> ${point.medidas}</p>` : ''}
                        </div>
                    `;

                    marker.bindPopup(popupContent);
                    markers.push(marker);
                    bounds.push([point.latitude, point.longitude]);
                }
            });

            // Fit map to show all markers
            if (bounds.length > 0) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    } catch (error) {
        console.error('Erro ao carregar pontos:', error);
        // Show user-friendly error message
        // alert('Não foi possível carregar os pontos. Verifique sua conexão e tente novamente.');
    }
}

// ===================================
// CUSTOM MARKER ICON
// ===================================

function createCustomIcon() {
    return L.icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
                <path fill="#2563eb" d="M12 0C7.802 0 4 3.403 4 7.602C4 11.8 7.469 16.812 12 24C16.531 16.812 20 11.8 20 7.602C20 3.403 16.199 0 12 0z"/>
                <circle cx="12" cy="8" r="3" fill="white"/>
            </svg>
        `),
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
}

// ===================================
// MODAL MANAGEMENT (MAIN)
// ===================================

const modal = document.getElementById('modal-cadastro');
const addPointBtn = document.getElementById('add-point');
const closeModalBtn = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');
const modalBackdrop = document.querySelector('.modal-backdrop');

function openModal() {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    resetForm();
}

addPointBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (modalExibidora.classList.contains('active')) {
            closeModalExibidoraFunc();
        } else if (modal.classList.contains('active')) {
            closeModal();
        }
    }
});

// ===================================
// EXHIBITOR MODAL MANAGEMENT
// ===================================

const modalExibidora = document.getElementById('modal-exibidora');
const closeModalExibidoraBtn = document.getElementById('close-modal-exibidora');
const cancelExibBtn = document.getElementById('cancel-exib-btn');
const formExibidora = document.getElementById('form-exibidora');
const exibidoraSelect = document.getElementById('id_exibidora');

function openModalExibidora() {
    modalExibidora.classList.add('active');
}

function closeModalExibidoraFunc() {
    modalExibidora.classList.remove('active');
    formExibidora.reset();
    document.getElementById('logo-file-name').textContent = 'Escolher logo';
    // Reset select if cancelled
    if (exibidoraSelect.value === 'nova') {
        exibidoraSelect.value = '';
    }
}

closeModalExibidoraBtn.addEventListener('click', closeModalExibidoraFunc);
cancelExibBtn.addEventListener('click', closeModalExibidoraFunc);

// Handle "Nova Exibidora" selection
exibidoraSelect.addEventListener('change', (e) => {
    if (e.target.value === 'nova') {
        openModalExibidora();
    }
});

// CNPJ Auto-fill
const cnpjInput = document.getElementById('cnpj_exib');
cnpjInput.addEventListener('blur', async () => {
    const cnpj = cnpjInput.value.replace(/\D/g, '');
    if (cnpj.length === 14) {
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
            if (response.ok) {
                const data = await response.json();
                document.getElementById('razao_social_exib').value = data.razao_social;
                document.getElementById('nome_exib').value = data.nome_fantasia || data.razao_social;

                // Address construction
                const address = `${data.logradouro}, ${data.numero} ${data.complemento || ''} - ${data.bairro}, ${data.municipio} - ${data.uf}`;
                document.getElementById('endereco_exib').value = address;
            }
        } catch (error) {
            console.error('Erro ao buscar CNPJ:', error);
        }
    }
});

// Logo file input
const logoInput = document.getElementById('logo_exib');
const logoFileName = document.getElementById('logo-file-name');
logoInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        logoFileName.textContent = e.target.files[0].name;
    } else {
        logoFileName.textContent = 'Escolher logo';
    }
});

// Save Exhibitor
formExibidora.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('save-exib-btn');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Salvando...';

        const formData = new FormData(formExibidora);

        const response = await fetch(`${API_BASE_URL}/api/exibidoras`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Erro ao salvar exibidora');
        }

        const newExib = await response.json();

        // Add to select and select it
        const option = document.createElement('option');
        option.value = newExib.id;
        option.textContent = newExib.nome;
        exibidoraSelect.appendChild(option);
        exibidoraSelect.value = newExib.id;

        // Close modal
        modalExibidora.classList.remove('active');
        formExibidora.reset();
        alert('Exibidora cadastrada com sucesso!');

    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao salvar exibidora: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// ===================================
// COORDINATE LOCKING
// ===================================

const latInput = document.getElementById('latitude');
const lngInput = document.getElementById('longitude');
const toggleLatBtn = document.getElementById('toggle-lat');
const toggleLngBtn = document.getElementById('toggle-lng');

function toggleLock(input, btn) {
    const isReadOnly = input.hasAttribute('readonly');
    if (isReadOnly) {
        input.removeAttribute('readonly');
        btn.classList.add('unlocked');
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                <line x1="12" y1="13" x2="12" y2="17"></line>
            </svg>
        `; // Open lock icon (simplified visual change)
    } else {
        input.setAttribute('readonly', 'true');
        btn.classList.remove('unlocked');
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
        `; // Closed lock icon
    }
}

toggleLatBtn.addEventListener('click', () => toggleLock(latInput, toggleLatBtn));
toggleLngBtn.addEventListener('click', () => toggleLock(lngInput, toggleLngBtn));

// ===================================
// PRODUCTS MANAGEMENT
// ===================================

const newProdType = document.getElementById('new-prod-type');
const newProdPeriod = document.getElementById('new-prod-period');
const periodGroup = document.getElementById('period-group');
const addProductBtn = document.getElementById('add-product-btn');
const productsList = document.getElementById('products-list');
const productsJsonInput = document.getElementById('produtos-json');

// Toggle period visibility
newProdType.addEventListener('change', (e) => {
    if (e.target.value === 'Locação') {
        periodGroup.style.visibility = 'visible';
    } else {
        periodGroup.style.visibility = 'hidden';
    }
});

function renderProducts() {
    productsList.innerHTML = '';

    if (products.length === 0) {
        productsList.innerHTML = '<div class="empty-state">Nenhum produto adicionado</div>';
        productsJsonInput.value = '';
        return;
    }

    products.forEach((prod, index) => {
        const div = document.createElement('div');
        div.className = 'product-item';
        div.innerHTML = `
            <div class="product-info">
                <span class="product-type">${prod.produto}</span>
                ${prod.produto === 'Locação' ? `<span class="product-period">${prod.periodo}</span>` : ''}
                <span class="product-value">R$ ${parseFloat(prod.valor).toFixed(2)}</span>
            </div>
            <button type="button" class="btn-remove" onclick="removeProduct(${index})" title="Remover">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        productsList.appendChild(div);
    });

    productsJsonInput.value = JSON.stringify(products);
}

// Make removeProduct global
window.removeProduct = function (index) {
    products.splice(index, 1);
    renderProducts();
};

addProductBtn.addEventListener('click', () => {
    const type = newProdType.value;
    const value = document.getElementById('new-prod-value').value;
    const period = newProdPeriod.value;

    if (!value) {
        alert('Informe o valor do produto.');
        return;
    }

    const product = {
        produto: type,
        valor: parseFloat(value),
        periodo: type === 'Locação' ? period : 'Unitário'
    };

    // Check for duplicates (same type) - Requirement: "Ensure that the same product cannot be added multiple times"
    const exists = products.some(p => p.produto === type);
    if (exists) {
        alert('Este tipo de produto já foi adicionado.');
        return;
    }

    products.push(product);
    renderProducts();

    // Reset inputs
    document.getElementById('new-prod-value').value = '';
    newProdType.value = 'Locação';
    newProdPeriod.value = 'Bissemanal';
    periodGroup.style.visibility = 'visible';
});

// ===================================
// STREET VIEW & GEOCODING
// ===================================

const streetViewInput = document.getElementById('streetview_embed');

streetViewInput.addEventListener('input', (e) => {
    const iframeHTML = e.target.value;
    const regex = /!1d(-?\d+\.?\d*)!2d(-?\d+\.?\d*)/;
    const match = iframeHTML.match(regex);

    if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);

        // Only update if not locked (or force update? User said "allow manual editing... even if auto-filled". 
        // Usually auto-fill should happen unless user explicitly locked it or typed over it. 
        // But here we'll update inputs and user can edit them.)
        latInput.value = lat;
        lngInput.value = lng;

        getCityFromCoordinates(lat, lng);
    }
});

// State Mapping for UF correction
const STATE_MAP = {
    'Paraná': 'PR',
    'São Paulo': 'SP',
    'Rio de Janeiro': 'RJ',
    'Minas Gerais': 'MG',
    'Rio Grande do Sul': 'RS',
    'Santa Catarina': 'SC',
    'Bahia': 'BA',
    // Add others if needed, but PR was the specific issue
};

async function getCityFromCoordinates(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR`,
            { headers: { 'User-Agent': 'OOH System' } }
        );

        if (!response.ok) throw new Error('Erro ao buscar localização');

        const data = await response.json();

        if (data.address) {
            const cidade = data.address.city || data.address.town || data.address.village || data.address.municipality || '';
            let uf = data.address.state_code || '';
            const stateName = data.address.state || '';

            // Fallback/Correction for UF
            if (!uf && stateName) {
                uf = STATE_MAP[stateName] || stateName.substring(0, 2).toUpperCase();
            } else if (uf.length > 2) {
                uf = STATE_MAP[stateName] || uf.substring(0, 2).toUpperCase();
            }

            // Specific fix for the user reported issue where Nominatim might return wrong code
            if (stateName === 'Paraná' && uf !== 'PR') {
                uf = 'PR';
            }

            document.getElementById('cidade').value = cidade;
            document.getElementById('uf').value = uf.toUpperCase();
        }
    } catch (error) {
        console.error('Erro ao buscar cidade:', error);
    }
}

// Trigger geocoding on manual change
[latInput, lngInput].forEach(input => {
    input.addEventListener('change', () => {
        const lat = parseFloat(latInput.value);
        const lng = parseFloat(lngInput.value);
        if (lat && lng) getCityFromCoordinates(lat, lng);
    });
});

// ===================================
// IMAGE PREVIEW
// ===================================

const imageInput = document.getElementById('imagem');
const fileNameSpan = document.getElementById('file-name');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        fileNameSpan.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
            imagePreview.src = event.target.result;
            imagePreviewContainer.style.display = 'flex';
        };
        reader.readAsDataURL(file);
    } else {
        fileNameSpan.textContent = 'Escolher arquivo';
        imagePreviewContainer.style.display = 'none';
    }
});

// ===================================
// FORM SUBMISSION (MAIN)
// ===================================

const form = document.getElementById('form-cadastro');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    const originalBtnText = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Cadastrando...</span>';

        // Validate products
        if (products.length === 0) {
            alert('Adicione pelo menos um produto.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            return;
        }

        const formData = new FormData(form);

        // Ensure products are sent as JSON string (already in hidden input, but double check)
        formData.set('produtos', JSON.stringify(products));

        const response = await fetch(`${API_BASE_URL}/api/ooh`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao cadastrar ponto');
        }

        // Success
        const lat = parseFloat(latInput.value);
        const lng = parseFloat(lngInput.value);

        if (lat && lng) {
            const marker = L.marker([lat, lng], { icon: createCustomIcon() }).addTo(map);
            const popupContent = `
                <div class="popup-content">
                    <h3>${document.getElementById('codigo_ooh').value}</h3>
                    <p><strong>Endereço:</strong> ${document.getElementById('endereco').value}</p>
                    <p><strong>Cidade:</strong> ${document.getElementById('cidade').value} - ${document.getElementById('uf').value}</p>
                </div>
            `;
            marker.bindPopup(popupContent);
            markers.push(marker);
            map.setView([lat, lng], 15);
        }

        alert('Ponto cadastrado com sucesso!');
        closeModal();

    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao cadastrar ponto: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
});

// ===================================
// LOAD EXHIBITORS
// ===================================

async function loadExibidoras() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/exibidoras`);
        if (!response.ok) throw new Error('Erro ao carregar exibidoras');

        const exibidoras = await response.json();

        // Keep first option (Selecione...) and last (Nova Exibidora)
        // Actually, "Nova Exibidora" is hardcoded in HTML. 
        // We should clear everything except the first and last? 
        // Or just clear and rebuild, appending "Nova" at the end?
        // The HTML has: <option value="">Selecione...</option> <option value="nova">+ Nova Exibidora</option>

        // Let's clear options except the first one, then add API options, then add "Nova"
        exibidoraSelect.innerHTML = '<option value="">Selecione...</option>';

        exibidoras.forEach(exib => {
            const option = document.createElement('option');
            option.value = exib.id;
            option.textContent = exib.nome;
            exibidoraSelect.appendChild(option);
        });

        const novaOption = document.createElement('option');
        novaOption.value = 'nova';
        novaOption.textContent = '+ Nova Exibidora';
        exibidoraSelect.appendChild(novaOption);

    } catch (error) {
        console.error('Erro:', error);
    }
}

function resetForm() {
    form.reset();
    products = [];
    renderProducts();
    imagePreviewContainer.style.display = 'none';
    fileNameSpan.textContent = 'Escolher arquivo';
    // Reset locks
    latInput.setAttribute('readonly', 'true');
    lngInput.setAttribute('readonly', 'true');
    toggleLatBtn.classList.remove('unlocked');
    toggleLngBtn.classList.remove('unlocked');
}

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadExibidoras();
});
