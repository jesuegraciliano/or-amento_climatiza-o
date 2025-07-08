document.addEventListener('DOMContentLoaded', () => {
    const metragemInput = document.getElementById('metragem');
    const cargaTermicaInput = document.getElementById('cargaTermica');
    const preInstalacaoCheckbox = document.getElementById('preInstalacao');
    const splitaoCapacidadeSelect = document.getElementById('splitaoCapacidade');
    const dutosM2Input = document.getElementById('dutosM2');
    const isolamentoTipoSelect = document.getElementById('isolamentoTipo');
    const isolamentoM2Group = document.getElementById('isolamentoM2Group');
    const isolamentoM2Input = document.getElementById('isolamentoM2');
    const difusoresQtdInput = document.getElementById('difusoresQtd');
    const grelhasRetorno50x40QtdInput = document.getElementById('grelhasRetorno50x40Qtd');
    const grelhasRetorno40x20QtdInput = document.getElementById('grelhasRetorno40x20Qtd');
    const taesQtdInput = document.getElementById('taesQtd');
    const tuboCobreQtdInput = document.getElementById('tuboCobreQtd');
    const suportesQtdInput = document.getElementById('suportesQtd');
    const calcularOrcamentoBtn = document.getElementById('calcularOrcamento');
    const resultadoSection = document.getElementById('resultado');
    const custoEquipamentosSpan = document.getElementById('custoEquipamentos');
    const custoMateriaisSpan = document.getElementById('custoMateriais');
    const custoMaoObraSpan = document.getElementById('custoMaoObra');
    const custoTotalSpan = document.getElementById('custoTotal');
    const detalhamentoTabelaBody = document.querySelector('#detalhamentoTabela tbody');
    const gerarPDFBtn = document.getElementById('gerarPDF');

    // Mapeamento de preços
    const PRECOS = {
        splitao: {
            '5': 17299.00, // aparelho de climatização splitão 5TR
            '7.5': 20209.00, // aparelho de climatização splitão 7,5TR
            '10': 23844.00, // aparelho de climatização splitão 10TR
            '15': 35372.00, // aparelho de climatização splitão 15TR
        },
        duto_m2: 55.59,
        isolamento: {
            vidro_m2: 2.65,
            rocha_m2: 34.00,
        },
        difusor_50x50: 350.00,
        grelha_retorno_50x40: 365.00,
        grelha_retorno_40x20: 224.00,
        tae_100x100: 150.00,
        tubo_cobre_5m: 150.00,
        suporte_unidade: 200.37,
        mao_obra: {
            instalacao_unidade_central: { min: 800, max: 1000 },
            fabricacao_montagem_dutos: { min: 1000, max: 2000 },
            instalacao_terminais_ar: { min: 250, max: 700 },
            carga_gas_refrigerante: 1000.00,
            infraestrutura_do_zero: { min: 2000, max: 3000 },
            instalacao_tubo_cobre: 50.00
        }
    };

    // Função para formatar moeda
    const formatCurrency = (value) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Lógica para mostrar/esconder campo de metragem do isolamento
    isolamentoTipoSelect.addEventListener('change', () => {
        if (isolamentoTipoSelect.value !== 'nenhum') {
            isolamentoM2Group.style.display = 'flex';
            isolamentoM2Input.setAttribute('required', 'required');
        } else {
            isolamentoM2Group.style.display = 'none';
            isolamentoM2Input.removeAttribute('required');
            isolamentoM2Input.value = '0';
        }
    });

    calcularOrcamentoBtn.addEventListener('click', () => {
        const metragem = parseFloat(metragemInput.value);
        const cargaTermicaTR = parseFloat(cargaTermicaInput.value);
        const preInstalacao = preInstalacaoCheckbox.checked;

        if (isNaN(metragem) || metragem <= 0 || isNaN(cargaTermicaTR) || cargaTermicaTR <= 0) {
            alert('Por favor, preencha a metragem quadrada e a carga térmica corretamente.');
            return;
        }

        let custoEquipamentos = 0;
        let custoMateriais = 0;
        let custoMaoObra = 0;
        let detalhamento = [];

        // 1. Custo do Splitão
        const splitaoCapacidade = splitaoCapacidadeSelect.value;
        let custoSplitao = 0;
        if (PRECOS.splitao[splitaoCapacidade]) {
            custoSplitao = PRECOS.splitao[splitaoCapacidade];
            detalhamento.push({ item: `Splitão (${splitaoCapacidade} TR)`, custo: custoSplitao });
        } else {
            alert('Por favor, selecione uma capacidade válida para o Splitão.');
            return;
        }
        custoEquipamentos += custoSplitao;

        // 2. Custo de Materiais e Componentes
        const dutosM2 = parseFloat(dutosM2Input.value);
        if (isNaN(dutosM2) || dutosM2 < 0) { alert('Verifique a metragem dos dutos.'); return; }
        const custoDutos = dutosM2 * PRECOS.duto_m2;
        custoMateriais += custoDutos;
        detalhamento.push({ item: `Dutos (${dutosM2} m²)`, custo: custoDutos });

        const isolamentoTipo = isolamentoTipoSelect.value;
        const isolamentoM2 = parseFloat(isolamentoM2Input.value);
        let custoIsolamento = 0;
        if (isolamentoTipo !== 'nenhum') {
            if (isNaN(isolamentoM2) || isolamentoM2 < 0) { alert('Verifique a metragem do isolamento.'); return; }
            if (isolamentoTipo === 'vidro') {
                custoIsolamento = isolamentoM2 * PRECOS.isolamento.vidro_m2;
            } else if (isolamentoTipo === 'rocha') {
                custoIsolamento = isolamentoM2 * PRECOS.isolamento.rocha_m2;
            }
            custoMateriais += custoIsolamento;
            detalhamento.push({ item: `Isolamento Térmico (${isolamentoM2} m² - ${isolamentoTipo === 'vidro' ? 'Lã de Vidro' : 'Lã de Rocha'})`, custo: custoIsolamento });
        }

        const difusoresQtd = parseFloat(difusoresQtdInput.value);
        if (isNaN(difusoresQtd) || difusoresQtd < 0) { alert('Verifique a quantidade de difusores.'); return; }
        const custoDifusores = difusoresQtd * PRECOS.difusor_50x50;
        custoMateriais += custoDifusores;
        detalhamento.push({ item: `Difusores (50x50cm) (${difusoresQtd} unidades)`, custo: custoDifusores });

        const grelhasRetorno50x40Qtd = parseFloat(grelhasRetorno50x40QtdInput.value);
        if (isNaN(grelhasRetorno50x40Qtd) || grelhasRetorno50x40Qtd < 0) { alert('Verifique a quantidade de grelhas 50x40cm.'); return; }
        const custoGrelhasRetorno50x40 = grelhasRetorno50x40Qtd * PRECOS.grelha_retorno_50x40;
        custoMateriais += custoGrelhasRetorno50x40;
        detalhamento.push({ item: `Grelhas de Retorno (50x40cm) (${grelhasRetorno50x40Qtd} unidades)`, custo: custoGrelhasRetorno50x40 });

        const grelhasRetorno40x20Qtd = parseFloat(grelhasRetorno40x20QtdInput.value);
        if (isNaN(grelhasRetorno40x20Qtd) || grelhasRetorno40x20Qtd < 0) { alert('Verifique a quantidade de grelhas 40x20cm.'); return; }
        const custoGrelhasRetorno40x20 = grelhasRetorno40x20Qtd * PRECOS.grelha_retorno_40x20;
        custoMateriais += custoGrelhasRetorno40x20;
        detalhamento.push({ item: `Grelhas de Retorno (40x20cm) (${grelhasRetorno40x20Qtd} unidades)`, custo: custoGrelhasRetorno40x20 });

        const taesQtd = parseFloat(taesQtdInput.value);
        if (isNaN(taesQtd) || taesQtd < 0) { alert('Verifique a quantidade de TAEs.'); return; }
        const custoTAEs = taesQtd * PRECOS.tae_100x100;
        custoMateriais += custoTAEs;
        detalhamento.push({ item: `TAEs (100x100cm) (${taesQtd} unidades)`, custo: custoTAEs });

        const tuboCobreQtd = parseFloat(tuboCobreQtdInput.value);
        if (isNaN(tuboCobreQtd) || tuboCobreQtd < 0) { alert('Verifique a quantidade de Tubos de Cobre.'); return; }
        const custoTuboCobre = tuboCobreQtd * PRECOS.tubo_cobre_5m;
        custoMateriais += custoTuboCobre;
        detalhamento.push({ item: `Tubos de Cobre (5m) (${tuboCobreQtd} unidades)`, custo: custoTuboCobre });

        const suportesQtd = parseFloat(suportesQtdInput.value);
        if (isNaN(suportesQtd) || suportesQtd < 0) { alert('Verifique a quantidade de suportes.'); return; }
        const custoSuportes = suportesQtd * PRECOS.suporte_unidade;
        custoMateriais += custoSuportes;
        detalhamento.push({ item: `Suportes para Condensadora (${suportesQtd} unidades)`, custo: custoSuportes });

        // 3. Custo de Mão de Obra
        const custoMoUnidadeCentral = (PRECOS.mao_obra.instalacao_unidade_central.min + PRECOS.mao_obra.instalacao_unidade_central.max) / 2;
        custoMaoObra += custoMoUnidadeCentral;
        detalhamento.push({ item: 'Mão de Obra: Instalação Unidade Central', custo: custoMoUnidadeCentral });

        const custoMoDutos = (PRECOS.mao_obra.fabricacao_montagem_dutos.min + PRECOS.mao_obra.fabricacao_montagem_dutos.max) / 2;
        custoMaoObra += custoMoDutos;
        detalhamento.push({ item: 'Mão de Obra: Fabricação e Montagem de Dutos', custo: custoMoDutos });

        const custoMoTerminaisAr = (PRECOS.mao_obra.instalacao_terminais_ar.min + PRECOS.mao_obra.instalacao_terminais_ar.max) / 2;
        custoMaoObra += custoMoTerminaisAr;
        detalhamento.push({ item: 'Mão de Obra: Instalação de Difusores, Grelhas e TAEs', custo: custoMoTerminaisAr });
        
        const custoMoTuboCobre = tuboCobreQtd * PRECOS.mao_obra.instalacao_tubo_cobre;
        custoMaoObra += custoMoTuboCobre;
        detalhamento.push({ item: `Mão de Obra: Instalação de Tubos de Cobre (${tuboCobreQtd} unidades)`, custo: custoMoTuboCobre });

        custoMaoObra += PRECOS.mao_obra.carga_gas_refrigerante;
        detalhamento.push({ item: 'Mão de Obra: Carga de Gás Refrigerante', custo: PRECOS.mao_obra.carga_gas_refrigerante });

        if (!preInstalacao) {
            const custoMoInfraestrutura = (PRECOS.mao_obra.infraestrutura_do_zero.min + PRECOS.mao_obra.infraestrutura_do_zero.max) / 2;
            custoMaoObra += custoMoInfraestrutura;
            detalhamento.push({ item: 'Mão de Obra: Infraestrutura (Instalação "do zero")', custo: custoMoInfraestrutura });
        }

        const custoTotal = custoEquipamentos + custoMateriais + custoMaoObra;

        custoEquipamentosSpan.textContent = formatCurrency(custoEquipamentos);
        custoMateriaisSpan.textContent = formatCurrency(custoMateriais);
        custoMaoObraSpan.textContent = formatCurrency(custoMaoObra);
        custoTotalSpan.textContent = formatCurrency(custoTotal);

        detalhamentoTabelaBody.innerHTML = '';
        detalhamento.forEach(item => {
            const row = detalhamentoTabelaBody.insertRow();
            const cellItem = row.insertCell();
            const cellCusto = row.insertCell();
            cellItem.textContent = item.item;
            cellCusto.textContent = formatCurrency(item.custo);
        });

        resultadoSection.style.display = 'block';

        gerarPDFBtn.onclick = () => gerarPDF(metragem, cargaTermicaTR, preInstalacao, custoEquipamentos, custoMateriais, custoMaoObra, custoTotal, detalhamento);
    });

    function gerarPDF(metragem, cargaTermicaTR, preInstalacao, custoEquipamentos, custoMateriais, custoMaoObra, custoTotal, detalhamento) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Adicionar fonte (Helvética é uma boa base para compatibilidade)
        doc.setFont('helvetica', 'normal');

        let y = 20;

        // Título
        doc.setFontSize(18);
        doc.text('Estimativa de Custos para Instalação de Sistema de Climatização Dutada com Splitão', 105, y, { align: 'center' });
        y += 15;

        // Sumário Executivo
        doc.setFontSize(12);
        doc.text('Sumário Executivo', 15, y);
        y += 7;
        doc.setFontSize(10);
        const executiveSummary = `Este relatório apresenta uma análise detalhada e estimativas de custo para a instalação completa de sistemas de climatização dutada, com foco em unidades "splitão", na região de Florianópolis, Santa Catarina. A complexidade inerente a esses sistemas de grande porte exige uma abordagem de orçamento multifacetada e precisa. Serão delineadas as principais faixas de custo para equipamentos, materiais e mão de obra, destacando os fatores que exercem maior influência sobre o investimento total.`;
        const splitText = doc.splitTextToSize(executiveSummary, 180);
        doc.text(splitText, 15, y);
        y += doc.getTextDimensions(splitText).h + 10;

        // Dados do Projeto
        doc.setFontSize(12);
        doc.text('Dados do Projeto:', 15, y);
        y += 7;
        doc.setFontSize(10);
        doc.text(`Metragem Quadrada: ${metragem} m²`, 15, y);
        y += 7;
        doc.text(`Carga Térmica: ${cargaTermicaTR} TR`, 15, y);
        y += 7;
        doc.text(`Pré-instalação existente: ${preInstalacao ? 'Sim' : 'Não'}`, 15, y);
        y += 10;

        // Resumo de Custos
        doc.setFontSize(12);
        doc.text('Resumo da Estimativa de Custos:', 15, y);
        y += 7;
        doc.setFontSize(10);
        doc.text(`Custo Total de Equipamentos: ${formatCurrency(custoEquipamentos)}`, 15, y);
        y += 7;
        doc.text(`Custo Total de Materiais: ${formatCurrency(custoMateriais)}`, 15, y);
        y += 7;
        doc.text(`Custo Total de Mão de Obra: ${formatCurrency(custoMaoObra)}`, 15, y);
        y += 10;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold'); // Negrito para o total
        doc.text(`Custo Total Estimado do Projeto: ${formatCurrency(custoTotal)}`, 15, y);
        doc.setFont('helvetica', 'normal'); // Volta ao normal
        y += 15;

        // Detalhamento da Tabela
        doc.setFontSize(12);
        doc.text('Detalhamento dos Custos:', 15, y);
        y += 7;

        const tableColumn = ["Item", "Custo Estimado (R$)"];
        const tableRows = detalhamento.map(item => [item.item, formatCurrency(item.custo)]);

        doc.autoTable({
            startY: y,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [44, 62, 80], textColor: 255, font: 'helvetica', fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3, font: 'helvetica', textColor: [33, 33, 33] },
            columnStyles: {
                0: { cellWidth: 120 },
                1: { cellWidth: 50, halign: 'right' }
            },
            margin: { left: 15, right: 15 },
            didDrawPage: function (data) {
                let str = 'Página ' + doc.internal.getNumberOfPages();
                doc.setFontSize(9);
                doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        y = doc.autoTable.previous.finalY + 15;
        if (y > doc.internal.pageSize.height - 40) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(12);
        doc.text('Conclusões e Recomendações:', 15, y);
        y += 7;
        doc.setFontSize(10);
        const conclusions = `A instalação de um sistema de climatização dutada com splitão em Florianópolis representa um investimento significativo, justificado pela sua capacidade de atender a grandes áreas com eficiência e conforto. O custo total é uma composição complexa de equipamentos de alta capacidade, materiais especializados para dutos e isolamento, e uma mão de obra altamente qualificada. Para os interessados, é crucial solicitar orçamentos detalhados, priorizar empresas qualificadas, avaliar o custo-benefício a longo prazo e compreender a importância da pré-instalação.`;
        const splitConclusions = doc.splitTextToSize(conclusions, 180);
        doc.text(splitConclusions, 15, y);

        doc.save('orcamento_climatizacao.pdf');
    }
});
