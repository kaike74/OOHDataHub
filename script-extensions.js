
// ===================================
// EXHIBITOR MODAL MANAGEMENT
// ===================================

const modalExibidora = document.getElementById('modal-exibidora');
const closeModalExibidoraBtn = document.getElementById('close-modal-exibidora');
const cancelExibidoraBtn = document.getElementById('cancel-exibidora-btn');
const formExibidora = document.getElementById('form-exibidora');
const exibidoraBackdrop = document.querySelector('#modal-exibidora .modal-backdrop');

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
        return '<div class="product-item">' +
            '<div class="product-item-info">' +
            '<div class="product-item-name">' + product.tipo + '</div>' +
            '<div class="product-item-details">R$ ' + product.valor.toFixed(2).replace('.', ',') + periodoText + '</div>' +
            '</div>' +
            '<button type="button" class="product-remove-btn" onclick="removeProduct(' + index + ')">Remover</button>' +
            '</div>';
    }).join('');
}

// Initialize empty list
renderProductList();
