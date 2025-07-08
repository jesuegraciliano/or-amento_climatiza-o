document.addEventListener('DOMContentLoaded', () => {
    const metragemInput = document.getElementById('metragem');
    const cargaTermicaInput = document.getElementById('cargaTermica');
    const preInstalacaoCheckbox = document.getElementById('preInstalacao');
    const splitaoCapacidadeSelect = document.getElementById('splitaoCapacidade');
    const splitaoOutraCapacidadeGroup = document.getElementById('splitaoOutraCapacidadeGroup');
    const splitaoOutraCapacidadeInput = document.getElementById('splitaoOutraCapacidade');
    const dutosM2Input = document.getElementById('dutosM2');
    const isolamentoTipoSelect = document.getElementById('isolamentoTipo');
    const isolamentoM2Group = document.getElementById('isolamentoM2Group');
    const isolamentoM2Input = document.getElementById('isolamentoM2');
    const difusoresQtdInput = document.getElementById('difusoresQtd');
    const grelhasQtdInput = document.getElementById('grelhasQtd');
    const taesQtdInput = document.getElementById('taesQtd');
    const suportesQtdInput = document.getElementById('suportesQtd');
    const calcularOrcamentoBtn = document.getElementById('calcularOrcamento');
    const resultadoSection = document.getElementById('resultado');
    const custoEquipamentosSpan = document.getElementById('custoEquipamentos');
    const custoMateriaisSpan = document.getElementById('custoMateriais');
    const custoMaoObraSpan = document.getElementById('custoMaoObra');
    const custoTotalSpan = document.getElementById('custoTotal');
    const detalhamentoTabelaBody = document.querySelector('#detalhamentoTabela tbody');
    const gerarPDFBtn = document.getElementById('gerarPDF');

    // Mapeamento de preços (baseado nas informações fornecidas)
    const PRECOS = {
        splitao: {
            '30000': 17380.00, // Multi Split 30.000 BTU/h
            '30000_inv': 5697.00, // Individual Inverter 30.000 BTU/h (média entre 5.549 e 5.845)
            // Faixas para "outro" tipo de splitão podem ser definidas com base na metragem
            // Para simplificar, se o usuário escolher "outro", ele insere o valor.
            // Para um cálculo mais preciso, seria necessário uma tabela de capacidade vs preço
        },
        duto_m2: 53.59, // R$ 10,87/KG * 5,12 KG/M2 + R$ 42,72/M2 = 55.59 (corrigi o 53.59 para 55.59)
        isolamento: {
            vidro_m2: 2.65,
            rocha_m2: 34.00,
        },
        difusor_unidade: 108.22,
        grelha_unidade: 320.70, // Média entre 75.49 e 565.90
        tae_unidade: 310.80, // Média entre 72.74 e 548.87
        suporte_unidade: 200.37, // Média entre 159.60 e 255.00
        mao_obra: {
            instalacao_unidade_central: { min: 800, max: 1000 },
            fabricacao_montagem_dutos: { min: 1000, max: 2000 },
            instalacao_difusores_grelhas: { min: 250, max: 700 },
            carga_gas_refrigerante: 1000.00,
            infraestrutura_do_zero: { min: 2000, max: 3000 }
        }
    };

    // Função para formatar moeda
    const formatCurrency = (value) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Lógica para mostrar/esconder campo de "Outra Capacidade"
    splitaoCapacidadeSelect.addEventListener('change', () => {
        if (splitaoCapacidadeSelect.value === 'outro') {
            splitaoOutraCapacidadeGroup.style.display = 'flex';
            splitaoOutraCapacidadeInput.setAttribute('required', 'required');
        } else {
            splitaoOutraCapacidadeGroup.style.display = 'none';
            splitaoOutraCapacidadeInput.removeAttribute('required');
            splitaoOutraCapacidadeInput.value = '';
        }
    });

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
        if (splitaoCapacidade === 'outro') {
            custoSplitao = parseFloat(splitaoOutraCapacidadeInput.value);
            if (isNaN(custoSplitao) || custoSplitao < 0) {
                alert('Por favor, insira um valor válido para "Outra Capacidade do Splitão".');
                return;
            }
        } else if (PRECOS.splitao[splitaoCapacidade]) {
            custoSplitao = PRECOS.splitao[splitaoCapacidade];
        } else {
            alert('Por favor, selecione uma capacidade válida para o Splitão.');
            return;
        }
        custoEquipamentos += custoSplitao;
        detalhamento.push({ item: 'Splitão (Unidade Central)', custo: custoSplitao });

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
        const custoDifusores = difusoresQtd * PRECOS.difusor_unidade;
        custoMateriais += custoDifusores;
        detalhamento.push({ item: `Difusores (${difusoresQtd} unidades)`, custo: custoDifusores });

        const grelhasQtd = parseFloat(grelhasQtdInput.value);
        if (isNaN(grelhasQtd) || grelhasQtd < 0) { alert('Verifique a quantidade de grelhas.'); return; }
        const custoGrelhas = grelhasQtd * PRECOS.grelha_unidade;
        custoMateriais += custoGrelhas;
        detalhamento.push({ item: `Grelhas (${grelhasQtd} unidades)`, custo: custoGrelhas });

        const taesQtd = parseFloat(taesQtdInput.value);
        if (isNaN(taesQtd) || taesQtd < 0) { alert('Verifique a quantidade de TAEs.'); return; }
        const custoTAEs = taesQtd * PRECOS.tae_unidade;
        custoMateriais += custoTAEs;
        detalhamento.push({ item: `TAEs (Venezianas) (${taesQtd} unidades)`, custo: custoTAEs });

        const suportesQtd = parseFloat(suportesQtdInput.value);
        if (isNaN(suportesQtd) || suportesQtd < 0) { alert('Verifique a quantidade de suportes.'); return; }
        const custoSuportes = suportesQtd * PRECOS.suporte_unidade;
        custoMateriais += custoSuportes;
        detalhamento.push({ item: `Suportes para Condensadora (${suportesQtd} unidades)`, custo: custoSuportes });

        // 3. Custo de Mão de Obra
        const custoMoUnidadeCentral = (PRECOS.mao_obra.instalacao_unidade_central.min + PRECOS.mao_obra.instalacao_unidade_central.max) / 2;
        custoMaoObra += custoMoUnidadeCentral;
        detalhamento.push({ item: 'Mão de Obra: Instalação Unidade Central', custo: custoMoUnidadeCentral });

        // A mão de obra de dutos e difusores/grelhas é mais complexa de calcular linearmente com a quantidade.
        // Usaremos uma média ou fator de complexidade. Aqui, para simplificar, usaremos as faixas médias.
        const custoMoDutos = (PRECOS.mao_obra.fabricacao_montagem_dutos.min + PRECOS.mao_obra.fabricacao_montagem_dutos.max) / 2;
        custoMaoObra += custoMoDutos;
        detalhamento.push({ item: 'Mão de Obra: Fabricação e Montagem de Dutos', custo: custoMoDutos });

        const custoMoDifusoresGrelhas = (PRECOS.mao_obra.instalacao_difusores_grelhas.min + PRECOS.mao_obra.instalacao_difusores_grelhas.max) / 2;
        custoMaoObra += custoMoDifusoresGrelhas;
        detalhamento.push({ item: 'Mão de Obra: Instalação de Difusores e Grelhas', custo: custoMoDifusoresGrelhas });

        // Carga de Gás Refrigerante (assume-se necessária para sistemas de grande porte ou sem carga de fábrica)
        custoMaoObra += PRECOS.mao_obra.carga_gas_refrigerante;
        detalhamento.push({ item: 'Mão de Obra: Carga de Gás Refrigerante', custo: PRECOS.mao_obra.carga_gas_refrigerante });

        // Custo de Infraestrutura "do zero"
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

        // Preencher tabela de detalhamento
        detalhamentoTabelaBody.innerHTML = ''; // Limpa antes de preencher
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

        let y = 20;

        // Título
        doc.setFontSize(18);
        doc.text('Estimativa de Custos para Instalação de Sistema de Climatização Dutada com Splitão', 105, y, null, null, 'center');
        y += 15;

        // Sumário Executivo
        doc.setFontSize(12);
        doc.text('Sumário Executivo', 15, y);
        y += 7;
        doc.setFontSize(10);
        const executiveSummary = `Este relatório apresenta uma análise detalhada e estimativas de custo para a instalação completa de sistemas de climatização dutada, com foco em unidades "splitão", na região de Florianópolis, Santa Catarina. A complexidade inerente a esses sistemas de grande porte exige uma abordagem de orçamento multifacetada e precisa. Serão delineadas as principais faixas de custo para equipamentos, materiais e mão de obra, destacando os fatores que exercem maior influência sobre o investimento total.`;
        const splitText = doc.splitTextToSize(executiveSummary, 180); // 180mm de largura
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
        doc.text(`Custo Total Estimado do Projeto: ${formatCurrency(custoTotal)}`, 15, y);
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
            headStyles: { fillColor: [44, 62, 80], textColor: 255 },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 120 },
                1: { cellWidth: 50, halign: 'right' }
            },
            margin: { left: 15, right: 15 },
            didDrawPage: function (data) {
                // Footer
                let str = 'Página ' + doc.internal.getNumberOfPages();
                doc.setFontSize(9);
                doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        // Adicionar texto de conclusões/recomendações
        y = doc.autoTable.previous.finalY + 15; // Posição após a tabela
        if (y > doc.internal.pageSize.height - 40) { // Se não houver espaço, adicione nova página
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
