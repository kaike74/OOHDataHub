
// ===================================
// GLOBAL VARIABLES
// ===================================

let map;
let markers = [];
let currentPoints = []; // Store loaded points data
const API_BASE_URL = 'https://ooh-system.kaike-458.workers.dev';

// Brazilian state name to code mapping
const brazilStates = {
    'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM',
    'Bahia': 'BA', 'Ceará': 'CE', 'Distrito Federal': 'DF',
    'Espírito Santo': 'ES', 'Goiás': 'GO', 'Maranhão': 'MA',
    'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS', 'Minas Gerais': 'MG',
    'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR', 'Pernambuco': 'PE',
    'Piauí': 'PI', 'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
    'Rio Grande do Sul': 'RS', 'Rondônia': 'RO', 'Roraima': 'RR',
    'Santa Catarina': 'SC', 'São Paulo': 'SP', 'Sergipe': 'SE', 'Tocantins': 'TO'
};

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadExibidoras();
    renderProductList(); // Initialize empty product list
});

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

        currentPoints = await response.json();

        // Clear existing markers
        markers.forEach(marker => marker.remove());
        markers = [];

        // Add markers for each point
        if (currentPoints.length > 0) {
            const bounds = [];

            currentPoints.forEach(point => {
                if (point.latitude && point.longitude) {
                    const marker = L.marker([point.latitude, point.longitude], {
                        icon: createCustomIcon()
                    }).addTo(map);

                    // Click event to open drawer instead of popup
                    marker.on('click', () => {
                        openDrawer(point);
                    });

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
        alert('Não foi possível carregar os pontos. Verifique sua conexão e tente novamente.');
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
// DETAILS DRAWER
// ===================================

const drawer = document.getElementById('details-drawer');
const closeDrawerBtn = document.getElementById('close-drawer');
const editPointBtn = document.getElementById('edit-point-btn');
const drawerExhibitorSection = document.getElementById('drawer-exhibitor-section');

// Drawer elements
const drawerCode = document.getElementById('drawer-code');
const drawerAddress = document.getElementById('drawer-address');
const drawerCity = document.getElementById('drawer-city');
const drawerMeasures = document.getElementById('drawer-measures');
const drawerFlow = document.getElementById('drawer-flow');
const drawerExhibitor = document.getElementById('drawer-exhibitor');
const drawerProducts = document.getElementById('drawer-products');
const drawerImages = document.getElementById('drawer-images');
const carouselDots = document.getElementById('carousel-dots');
const prevImageBtn = document.getElementById('prev-image');
const nextImageBtn = document.getElementById('next-image');

let currentDrawerPoint = null;
let currentImageIndex = 0;
let drawerImagesList = [];

function openDrawer(point) {
    currentDrawerPoint = point;

    // Populate basic info
    drawerCode.textContent = point.codigo_ooh || '-';
    drawerAddress.textContent = point.endereco || '-';
    drawerCity.textContent = `${point.cidade || ''} - ${point.uf || ''}`;
    drawerMeasures.textContent = point.medidas || '-';
    drawerFlow.textContent = point.fluxo || '-';
    drawerExhibitor.textContent = point.exibidora_nome || 'N/A';

    // Populate products
    let productsHtml = '<div class="product-list-empty">Nenhum produto cadastrado</div>';

    // Try to parse products JSON or handle legacy data
    try {
        // Note: The API currently returns products as a JSON string in the 'produtos' column
        // But we also have a separate 'produtos' table. For now, let's use what's available.
        // If the point has a 'produtos' field that is a JSON string array of types
        if (point.produtos) {
            let productsData = [];
            try {
                productsData = JSON.parse(point.produtos);
            } catch (e) {
                productsData = [point.produtos]; // Treat as single string if parse fails
            }

            if (Array.isArray(productsData) && productsData.length > 0) {
                productsHtml = productsData.map(p => `
                    <div class="product-item">
                        <div class="product-item-info">
                            <div class="product-item-name">${p}</div>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (e) {
        console.error('Error parsing products:', e);
    }
    drawerProducts.innerHTML = productsHtml;

    // Setup Images Carousel
    setupCarousel(point);

    // Open drawer
    drawer.classList.add('active');
}

function closeDrawer() {
    drawer.classList.remove('active');
}

closeDrawerBtn.addEventListener('click', closeDrawer);

// Edit button logic
editPointBtn.addEventListener('click', () => {
    // Close drawer
    closeDrawer();

    // Open modal with data populated (TODO: Implement full edit mode)
    // For now, we'll just open the modal as if adding new, but we could populate it
    alert('Funcionalidade de edição completa será implementada em breve. Por enquanto, você pode cadastrar novos pontos.');
    openModal();
});

// Exhibitor click logic
drawerExhibitorSection.addEventListener('click', () => {
    if (currentDrawerPoint && currentDrawerPoint.id_exibidora) {
        // TODO: Open exhibitor details
        alert(`Detalhes da exibidora: ${currentDrawerPoint.exibidora_nome}`);
    }
});

// Carousel Logic
function setupCarousel(point) {
    drawerImagesList = [];

    // Add main image if exists (assuming API returns image URL or key)
    // For now, we'll use a placeholder if no image
    // In a real scenario, we would fetch images from the 'imagens' table via API

    // Placeholder logic since we don't have the full image list in the point object yet
    // We would need to fetch images for this point
    drawerImagesList.push('https://via.placeholder.com/400x200?text=Sem+Imagem');

    renderCarousel();
}

function renderCarousel() {
    drawerImages.innerHTML = drawerImagesList.map(src =>
        `<img src="${src}" class="carousel-img" alt="Ponto OOH">`
    ).join('');

    carouselDots.innerHTML = drawerImagesList.map((_, idx) =>
        `<div class="carousel-dot ${idx === 0 ? 'active' : ''}" onclick="goToImage(${idx})"></div>`
    ).join('');

    currentImageIndex = 0;
    updateCarouselPosition();
}

function updateCarouselPosition() {
    drawerImages.style.transform = `translateX(-${currentImageIndex * 100}%)`;

    // Update dots
    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach((dot, idx) => {
        if (idx === currentImageIndex) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

window.goToImage = function (index) {
    currentImageIndex = index;
    updateCarouselPosition();
};

prevImageBtn.addEventListener('click', () => {
    if (currentImageIndex > 0) {
        currentImageIndex--;
        updateCarouselPosition();
    }
});

nextImageBtn.addEventListener('click', () => {
    if (currentImageIndex < drawerImagesList.length - 1) {
        currentImageIndex++;
        updateCarouselPosition();
    }
});


// ===================================
// MODAL MANAGEMENT (OOH)
// ===================================

const modal = document.getElementById('modal-cadastro');
const addPointBtn = document.getElementById('add-point');
const closeModalBtn = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');
const modalBackdrop = document.querySelector('#modal-cadastro .modal-backdrop');

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
        if (modal.classList.contains('active')) closeModal();
        if (modalExibidora.classList.contains('active')) closeExibidoraModal();
        if (drawer.classList.contains('active')) closeDrawer();
    }
});

// ===================================
// EXHIBITOR MODAL MANAGEMENT
// ===================================

const modalExibidora = document.getElementById('modal-exibidora');
const closeModalExibidoraBtn = document.getElementById('close-modal-exibidora');
const cancelExibidoraBtn = document.getElementById('cancel-exibidora-btn');
const formExibidora = document.getElementById('form-exibidora');
const exibidoraBackdrop = document.querySelector('#modal-exibidora .modal-backdrop');
const exibidoraSelect = document.getElementById('id_exibidora');

// Store OOH form data when opening exhibitor modal
let tempOOHFormData = {};

// Open exhibitor modal when "Nova Exibidora" is selected
exibidoraSelect.addEventListener('change', (e) => {
    if (e.target.value === 'nova') {
        // Save current OOH form data
        tempOOHFormData = getFormData('form-cadastro');

        // Open exhibitor modal
        modalExibidora.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
});

function closeExibidoraModal(saved = false) {
    modalExibidora.classList.remove('active');

    // If we're not closing because we saved, restore overflow only if main modal is also closed
    // But main modal is likely open behind it, so we keep overflow hidden

    if (saved) {
        // Reload exhibitors list
        loadExibidoras();
    } else {
        // Reset exhibitor select to empty
        exibidoraSelect.value = '';
    }

    // Restore OOH form data
    setFormData('form-cadastro', tempOOHFormData);
}

closeModalExibidoraBtn.addEventListener('click', () => closeExibidoraModal(false));
cancelExibidoraBtn.addEventListener('click', () => closeExibidoraModal(false));
exibidoraBackdrop.addEventListener('click', () => closeExibidoraModal(false));

// Helper functions to save/restore form data
function getFormData(formId) {
    const form = document.getElementById(formId);
    const formData = {};
    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            if (!formData[input.name]) formData[input.name] = [];
            if (input.checked) formData[input.name].push(input.value);
        } else if (input.type !== 'file') {
            formData[input.id || input.name] = input.value;
        }
    });

    return formData;
}

function setFormData(formId, data) {
    const form = document.getElementById(formId);

    Object.keys(data).forEach(key => {
        const element = form.querySelector('#' + key + ', [name="' + key + '"]');
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = data[key].includes(element.value);
            } else {
                element.value = data[key];
            }
        }
    });
}

// ===================================
// CNPJ AUTO-FILL
// ===================================

const cnpjInput = document.getElementById('cnpj_exib');
const razaoSocialInput = document.getElementById('razao_social_exib');

cnpjInput.addEventListener('blur', async (e) => {
    const cnpj = e.target.value.replace(/\D/g, '');

    if (cnpj.length === 14) {
        try {
            razaoSocialInput.value = 'Buscando...';

            const response = await fetch('https://brasilapi.com.br/api/cnpj/v1/' + cnpj);

            if (!response.ok) {
                throw new Error('CNPJ não encontrado');
            }

            const data = await response.json();

            if (data.razao_social) {
                razaoSocialInput.value = data.razao_social;
            } else {
                razaoSocialInput.value = '';
            }
        } catch (error) {
            console.error('Erro ao buscar CNPJ:', error);
            razaoSocialInput.value = '';
            alert('Não foi possível buscar os dados do CNPJ. Preencha manualmente.');
        }
    }
});

// ===================================
// LOGO PREVIEW
// ===================================

const logoInput = document.getElementById('logo_exib');
const logoFileNameSpan = document.getElementById('logo-file-name');
const logoPreviewContainer = document.getElementById('logo-preview-container');
const logoPreview = document.getElementById('logo-preview');

logoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];

    if (file) {
        logoFileNameSpan.textContent = file.name;

        const reader = new FileReader();
        reader.onload = (event) => {
            logoPreview.src = event.target.result;
            logoPreviewContainer.style.display = 'flex';
        };
        reader.readAsDataURL(file);
    } else {
        logoFileNameSpan.textContent = 'Escolher arquivo';
        logoPreviewContainer.style.display = 'none';
    }
});

// ===================================
// EXHIBITOR FORM SUBMISSION
// ===================================

formExibidora.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submit-exibidora-btn');
    const originalBtnText = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Salvando...</span>';

        const formData = new FormData();
        formData.append('nome', document.getElementById('nome_exib').value);
        formData.append('cnpj', document.getElementById('cnpj_exib').value);
        formData.append('razao_social', document.getElementById('razao_social_exib').value);
        formData.append('endereco_faturamento', document.getElementById('endereco_faturamento_exib').value);
        formData.append('observacoes', document.getElementById('observacoes_exib').value);

        const logoFile = logoInput.files[0];
        if (logoFile) {
            formData.append('logo', logoFile);
        }

        const response = await fetch(API_BASE_URL + '/api/exibidoras', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao cadastrar exibidora');
        }

        const data = await response.json();

        alert('Exibidora cadastrada com sucesso!');

        // Reset form
        formExibidora.reset();
        logoPreviewContainer.style.display = 'none';
        logoFileNameSpan.textContent = 'Escolher arquivo';

        // Close modal and reload exhibitors
        closeExibidoraModal(true);

        // Select the newly created exhibitor
        await loadExibidoras();
        exibidoraSelect.value = data.id;

    } catch (error) {
        console.error('Erro ao cadastrar exibidora:', error);
        alert('Erro ao cadastrar exibidora: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
});

// ===================================
// STREET VIEW COORDINATE EXTRACTION
// ===================================

const streetViewInput = document.getElementById('streetview_embed');
const latitudeInput = document.getElementById('latitude');
const longitudeInput = document.getElementById('longitude');

streetViewInput.addEventListener('input', (e) => {
    const iframeHTML = e.target.value;

    // Regex to extract coordinates from Google Street View iframe
    const regex = /!1d(-?\d+\.?\d*)!2d(-?\d+\.?\d*)/;
    const match = iframeHTML.match(regex);

    if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);

        latitudeInput.value = lat;
        longitudeInput.value = lng;

        // Fetch city and state from coordinates
        getCityFromCoordinates(lat, lng);
    }
});

// ===================================
// REVERSE GEOCODING (Nominatim)
// ===================================

async function getCityFromCoordinates(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=pt-BR`,
            { headers: { 'User-Agent': 'OOH System' } }
        );

        if (!response.ok) {
            throw new Error('Erro ao buscar localização');
        }

        const data = await response.json();

        if (data.address) {
            const cidade = data.address.city ||
                data.address.town ||
                data.address.village ||
                data.address.municipality || '';

            // Fix UF: Use ISO3166-2-lvl4 format (BR-XX) or map state name
            let uf = '';
            if (data.address['ISO3166-2-lvl4']) {
                uf = data.address['ISO3166-2-lvl4'].split('-')[1];
            } else if (data.address.state) {
                uf = brazilStates[data.address.state] || data.address.state.substring(0, 2).toUpperCase();
            }

            document.getElementById('cidade').value = cidade;
            document.getElementById('uf').value = uf;
        }
    } catch (error) {
        console.error('Erro ao buscar cidade:', error);
    }
}

// Also trigger geocoding when coordinates are manually changed
latitudeInput.addEventListener('change', () => {
    const lat = parseFloat(latitudeInput.value);
    const lng = parseFloat(longitudeInput.value);
    if (lat && lng) getCityFromCoordinates(lat, lng);
});

longitudeInput.addEventListener('change', () => {
    const lat = parseFloat(latitudeInput.value);
    const lng = parseFloat(longitudeInput.value);
    if (lat && lng) getCityFromCoordinates(lat, lng);
});

// ===================================
// COORDINATE EDITING
// ===================================

const editLatBtn = document.getElementById('edit-latitude');
const editLngBtn = document.getElementById('edit-longitude');

function toggleCoordinateEdit() {
    const isReadonly = latitudeInput.readOnly;
    latitudeInput.readOnly = !isReadonly;
    longitudeInput.readOnly = !isReadonly;

    const newIcon = isReadonly ?
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>` :
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;

    editLatBtn.innerHTML = newIcon;
    editLngBtn.innerHTML = newIcon;

    if (!isReadonly) latitudeInput.focus();
}

editLatBtn.addEventListener('click', toggleCoordinateEdit);
editLngBtn.addEventListener('click', toggleCoordinateEdit);

// ===================================
// IMAGE PREVIEW (OOH)
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
// MULTI-PRODUCT SYSTEM
// ===================================

let products = [];

const produtoTipoSelect = document.getElementById('produto_tipo');
const produtoValorInput = document.getElementById('produto_valor');
const produtoPeriodoField = document.getElementById('produto_periodo_field');
const produtoPeriodoSelect = document.getElementById('produto_periodo');
const addProductBtn = document.getElementById('add-product-btn');
const productListContainer = document.getElementById('product-list');

// Show/hide período field based on product type
produtoTipoSelect.addEventListener('change', (e) => {
    if (e.target.value === 'Locação') {
        produtoPeriodoField.style.display = 'block';
    } else {
        produtoPeriodoField.style.display = 'none';
    }
});

// Add product to list
addProductBtn.addEventListener('click', () => {
    const tipo = produtoTipoSelect.value;
    const valor = parseFloat(produtoValorInput.value);

    if (!tipo) {
        alert('Selecione o tipo de produto');
        return;
    }

    if (!valor || valor <= 0) {
        alert('Informe um valor válido');
        return;
    }

    // Check for duplicates
    if (products.some(p => p.tipo === tipo)) {
        alert('Este tipo de produto já foi adicionado');
        return;
    }

    // Determine período
    const periodo = tipo === 'Locação' ? produtoPeriodoSelect.value : 'Unitário';

    // Add to list
    products.push({ tipo, valor, periodo });

    // Render list
    renderProductList();

    // Clear inputs
    produtoTipoSelect.value = '';
    produtoValorInput.value = '';
    produtoPeriodoSelect.value = 'Mensal';
    produtoPeriodoField.style.display = 'none';
});

// Remove product from list
window.removeProduct = function (index) {
    products.splice(index, 1);
    renderProductList();
};

// Render product list
function renderProductList() {
    if (products.length === 0) {
        productListContainer.innerHTML = '<div class="product-list-empty">Nenhum produto adicionado</div>';
        return;
    }

    productListContainer.innerHTML = products.map((product, index) => {
        const periodoText = product.periodo !== 'Unitário' ? ' - ' + product.periodo : '';
        return `<div class="product-item">
            <div class="product-item-info">
                <div class="product-item-name">${product.tipo}</div>
                <div class="product-item-details">R$ ${product.valor.toFixed(2).replace('.', ',')}${periodoText}</div>
            </div>
            <button type="button" class="product-remove-btn" onclick="removeProduct(${index})">Remover</button>
        </div>`;
    }).join('');
}

// ===================================
// FORM SUBMISSION (OOH)
// ===================================

const form = document.getElementById('form-cadastro');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submit-btn');
    const originalBtnText = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Cadastrando...</span>';

        // Prepare FormData
        const formData = new FormData();

        // Basic fields
        formData.append('codigo_ooh', document.getElementById('codigo_ooh').value);
        formData.append('id_exibidora', exibidoraSelect.value);
        formData.append('endereco', document.getElementById('endereco').value);
        formData.append('ponto_referencia', document.getElementById('ponto_referencia').value);
        formData.append('streetview_embed', document.getElementById('streetview_embed').value);
        formData.append('latitude', document.getElementById('latitude').value);
        formData.append('longitude', document.getElementById('longitude').value);
        formData.append('cidade', document.getElementById('cidade').value);
        formData.append('uf', document.getElementById('uf').value);
        formData.append('medidas', document.getElementById('medidas').value);
        formData.append('fluxo', document.getElementById('fluxo').value);
        formData.append('observacoes', document.getElementById('observacoes').value);

        // Products (checkboxes - legacy)
        const produtosCheckboxes = Array.from(document.querySelectorAll('input[name="produtos"]:checked'))
            .map(cb => cb.value);

        // Combine legacy checkboxes with new product system for 'produtos' field
        // Ideally we should move away from checkboxes if we have the new system
        // For now, let's send the new products array as JSON
        formData.append('produtos', JSON.stringify(products.map(p => p.tipo)));

        // Also send the full products data with prices for the backend to handle
        // We'll send this as a separate field or handle it in the backend
        // The current backend expects 'produtos' as a JSON array of strings and 'valor' as a single value
        // We need to update the backend to handle the new structure, but for now let's adapt:

        // If we have products, use the first one's value as the main value (fallback)
        if (products.length > 0) {
            formData.append('valor', products[0].valor);
        }

        // Image
        const imageFile = imageInput.files[0];
        if (imageFile) {
            formData.append('imagem', imageFile);
        }

        // Submit form
        const response = await fetch(`${API_BASE_URL}/api/ooh`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao cadastrar ponto');
        }

        const data = await response.json();

        // Success!
        alert('Ponto cadastrado com sucesso!');
        closeModal();
        loadPoints(); // Reload map points

    } catch (error) {
        console.error('Erro ao cadastrar ponto:', error);
        alert('Erro ao cadastrar ponto: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
});

// ===================================
// RESET FORM
// ===================================

function resetForm() {
    form.reset();
    imagePreviewContainer.style.display = 'none';
    fileNameSpan.textContent = 'Escolher arquivo';
    products = []; // Clear products list
    renderProductList();
}

// ===================================
// LOAD EXHIBITORS
// ===================================

async function loadExibidoras() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/exibidoras`);
        if (!response.ok) throw new Error('Erro ao carregar exibidoras');
        const exibidoras = await response.json();

        while (exibidoraSelect.options.length > 2) {
            exibidoraSelect.remove(2);
        }

        exibidoras.forEach(exibidora => {
            const option = document.createElement('option');
            option.value = exibidora.id;
            option.textContent = exibidora.nome;
            exibidoraSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar exibidoras:', error);
    }
}
