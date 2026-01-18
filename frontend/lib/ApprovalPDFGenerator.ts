/**
 * PDF Generator for Approval Summary
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Proposta, PropostaItem, MaterialSelection } from './types';
import { formatPeriodExtended, calculateDuration } from './dateUtils';
import { generateStaticMapUrl, mapUrlToDataUrl } from './mapUtils';
import { formatCurrency } from './utils';

/**
 * Generates a PDF for the approval summary
 * @param proposta - The proposal
 * @param itens - The proposal items
 * @param materialSelection - Material selection data
 */
export async function generateApprovalPDF(
    proposta: Proposta,
    itens: PropostaItem[],
    materialSelection: MaterialSelection
): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Filter only approved items
    const approvedItems = itens.filter(item => item.status_validacao === 'APPROVED');

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo da Compra', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Proposta: ${proposta.nome}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;

    if (proposta.cliente?.nome) {
        doc.text(`Cliente: ${proposta.cliente.nome}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
    }

    const currentDate = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    doc.text(`Data: ${currentDate}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Map Section
    try {
        const mapUrl = generateStaticMapUrl(approvedItems, 800, 400);
        if (mapUrl) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Pontos Selecionados', 14, yPos);
            yPos += 5;

            const mapDataUrl = await mapUrlToDataUrl(mapUrl);
            if (mapDataUrl) {
                const imgWidth = pageWidth - 28;
                const imgHeight = (imgWidth * 400) / 800; // Maintain aspect ratio

                // Check if we need a new page
                if (yPos + imgHeight > doc.internal.pageSize.getHeight() - 20) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.addImage(mapDataUrl, 'PNG', 14, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 10;
            }
        }
    } catch (error) {
        console.error('Failed to add map to PDF:', error);
    }

    // Check if we need a new page for the table
    if (yPos > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage();
        yPos = 20;
    }

    // Points Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhamento dos Pontos', 14, yPos);
    yPos += 5;

    const tableData = approvedItems.map((item, index) => {
        // Calculate rental quantity
        let qtd = 1;
        if (item.periodo_inicio && item.periodo_fim) {
            const start = new Date(item.periodo_inicio);
            const end = new Date(item.periodo_fim);
            const diffMs = end.getTime() - start.getTime();
            const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            qtd = item.periodo_comercializado === 'mensal' ? 1 : Math.ceil(diffDays / 14);
        }

        const locacaoTotal = (item.valor_locacao || 0) * qtd;

        let materialTotal = 0;
        if (materialSelection.wantsMaterial) {
            const papelQty = materialSelection.papelQuantities[item.id] || 0;
            const lonaQty = materialSelection.lonaQuantities[item.id] || 0;
            materialTotal = ((item.valor_papel || 0) * papelQty) + ((item.valor_lona || 0) * lonaQty);
        }

        const periodo = item.periodo_inicio && item.periodo_fim
            ? `${formatPeriodExtended(item.periodo_inicio, item.periodo_fim)}\n(${calculateDuration(item.periodo_inicio, item.periodo_fim)})`
            : 'N/A';

        const row = [
            (index + 1).toString(),
            item.endereco || 'N/A',
            periodo,
            formatCurrency(locacaoTotal)
        ];

        if (materialSelection.wantsMaterial) {
            row.push(formatCurrency(materialTotal));
        }

        return row;
    });

    const headers = ['#', 'Endereço', 'Período', 'Locação'];
    if (materialSelection.wantsMaterial) {
        headers.push('Material');
    }

    autoTable(doc, {
        startY: yPos,
        head: [headers],
        body: tableData,
        theme: 'grid',
        styles: {
            fontSize: 8,
            cellPadding: 2
        },
        headStyles: {
            fillColor: [59, 130, 246], // Blue
            textColor: 255,
            fontStyle: 'bold'
        },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 50 },
            3: { cellWidth: 30, halign: 'right' },
            ...(materialSelection.wantsMaterial ? { 4: { cellWidth: 30, halign: 'right' } } : {})
        }
    });

    // Get the final Y position after the table
    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Check if we need a new page for totals
    if (yPos > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        yPos = 20;
    }

    // Calculate totals
    let totalLocacao = 0;
    let totalMaterial = 0;

    approvedItems.forEach(item => {
        let qtd = 1;
        if (item.periodo_inicio && item.periodo_fim) {
            const start = new Date(item.periodo_inicio);
            const end = new Date(item.periodo_fim);
            const diffMs = end.getTime() - start.getTime();
            const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            qtd = item.periodo_comercializado === 'mensal' ? 1 : Math.ceil(diffDays / 14);
        }
        totalLocacao += (item.valor_locacao || 0) * qtd;

        if (materialSelection.wantsMaterial) {
            const papelQty = materialSelection.papelQuantities[item.id] || 0;
            const lonaQty = materialSelection.lonaQuantities[item.id] || 0;
            totalMaterial += ((item.valor_papel || 0) * papelQty) + ((item.valor_lona || 0) * lonaQty);
        }
    });

    const grandTotal = totalLocacao + totalMaterial;

    // Totals Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Totais da Campanha', 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Locação:', 14, yPos);
    doc.text(formatCurrency(totalLocacao), pageWidth - 14, yPos, { align: 'right' });
    yPos += 6;

    if (materialSelection.wantsMaterial) {
        doc.text('Total Material:', 14, yPos);
        doc.text(formatCurrency(totalMaterial), pageWidth - 14, yPos, { align: 'right' });
        yPos += 6;
    }

    // Draw line
    doc.setLineWidth(0.5);
    doc.line(14, yPos, pageWidth - 14, yPos);
    yPos += 6;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total da Compra:', 14, yPos);
    doc.text(formatCurrency(grandTotal), pageWidth - 14, yPos, { align: 'right' });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text(
        'Este documento é um resumo da proposta aprovada. Nossa equipe entrará em contato para formalização.',
        pageWidth / 2,
        footerY,
        { align: 'center' }
    );

    // Save PDF
    const fileName = `Proposta_${proposta.nome.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
}
