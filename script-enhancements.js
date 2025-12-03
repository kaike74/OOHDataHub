// ===================================
// SCRIPT FIXES AND ENHANCEMENTS
// This file contains fixes and enhancements to be loaded after script.js
// ===================================

// Store selected images globally
let selectedImages = [];

// Override image input handler for multi-image support
document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imagem');
    const fileNameSpan = document.getElementById('file-name');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');

    // Remove old event listener by cloning
    const newImageInput = imageInput.cloneNode(true);
    imageInput.parentNode.replaceChild(newImageInput, imageInput);

    // Add new multi-image handler
    newImageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);

        if (files.length > 0) {
            selectedImages = files;
            fileNameSpan.textContent = files.length === 1 ? files[0].name : `${files.length} imagens selecionadas`;

            // Show preview of first image
            const reader = new FileReader();
            reader.onload = (event) => {
                imagePreview.src = event.target.result;
                imagePreviewContainer.style.display = 'flex';
            };
            reader.readAsDataURL(files[0]);
        } else {
            selectedImages = [];
            fileNameSpan.textContent = 'Escolher arquivo';
            imagePreviewContainer.style.display = 'none';
        }
    });

    // Fix product value input to handle Brazilian currency format
    const produtoValorInput = document.getElementById('produto_valor');
    const addProductBtn = document.getElementById('add-product-btn');
    const produtoTipoSelect = document.getElementById('produto_tipo');
    const produtoPeriodoSelect = document.getElementById('produto_periodo');

    // Clone to remove old listeners
    const newAddProductBtn = addProductBtn.cloneNode(true);
    addProductBtn.parentNode.replaceChild(newAddProductBtn, addProductBtn);

    newAddProductBtn.addEventListener('click', () => {
        const tipo = produtoTipoSelect.value;
        let valorStr = produtoValorInput.value;

        if (!tipo) {
            alert('Selecione o tipo de produto');
            return;
        }

        if (!valorStr) {
            alert('Informe um valor');
            return;
        }

        // Parse Brazilian currency format: 10000 -> 10000.00, 1000,50 or 1000.5 -> 1000.50
        valorStr = valorStr.replace(/\./g, '').replace(',', '.');
        const valor = parseFloat(valorStr);

        if (!valor || valor <= 0) {
            alert('Informe um valor válido');
            return;
        }

        // Check for duplicates
        if (window.products.some(p => p.tipo === tipo)) {
            alert('Este tipo de produto já foi adicionado');
            return;
        }

        // Determine período
        const periodo = tipo === 'Locação' ? produtoPeriodoSelect.value : 'Unitário';

        // Add to list
        window.products.push({ tipo, valor, periodo });

        // Render list
        window.renderProductList();

        // Clear inputs
        produtoTipoSelect.value = '';
        produtoValorInput.value = '';
        produtoPeriodoSelect.value = 'Mensal';
        document.getElementById('produto_periodo_field').style.display = 'none';
    });

    // Fix edit button to populate form
    const editPointBtn = document.getElementById('edit-point-btn');
    const newEditPointBtn = editPointBtn.cloneNode(true);
    editPointBtn.parentNode.replaceChild(newEditPointBtn, editPointBtn);

    newEditPointBtn.addEventListener('click', () => {
        const currentDrawerPoint = window.currentDrawerPoint;
        if (!currentDrawerPoint) return;

        // Close drawer
        document.getElementById('details-drawer').classList.remove('active');

        // Populate form with current point data
        document.getElementById('codigo_ooh').value = currentDrawerPoint.codigo_ooh || '';
        document.getElementById('id_exibidora').value = currentDrawerPoint.id_exibidora || '';
        document.getElementById('endereco').value = currentDrawerPoint.endereco || '';
        document.getElementById('ponto_referencia').value = currentDrawerPoint.ponto_referencia || '';
        document.getElementById('streetview_embed').value = currentDrawerPoint.streetview_embed || '';
        document.getElementById('latitude').value = currentDrawerPoint.latitude || '';
        document.getElementById('longitude').value = currentDrawerPoint.longitude || '';
        document.getElementById('cidade').value = currentDrawerPoint.cidade || '';
        document.getElementById('uf').value = currentDrawerPoint.uf || '';
        document.getElementById('medidas').value = currentDrawerPoint.medidas || '';
        document.getElementById('fluxo').value = currentDrawerPoint.fluxo || '';
        document.getElementById('observacoes').value = currentDrawerPoint.observacoes || '';

        // Open modal
        document.getElementById('modal-cadastro').classList.add('active');
        document.body.style.overflow = 'hidden';
    });
});

// Override setupCarousel to fix placeholder
window.originalSetupCarousel = window.setupCarousel;
window.setupCarousel = function (point) {
    window.drawerImagesList = [];

    // Use a data URI placeholder to avoid network requests
    const placeholderSvg = 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
            <rect width="400" height="200" fill="#f3f4f6"/>
            <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial" font-size="16">Sem Imagem</text>
        </svg>
    `);

    window.drawerImagesList.push(placeholderSvg);

    if (window.renderCarousel) {
        window.renderCarousel();
    }
};

// Expose selectedImages globally for form submission
window.getSelectedImages = function () {
    return selectedImages;
};
