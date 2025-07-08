document.addEventListener('DOMContentLoaded', () => {
    // -----------------------------------------------------------
    // Elementos do DOM
    // -----------------------------------------------------------
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

    // -----------------------------------------------------------
    // Mapeamento de Preços e Configurações
    // -----------------------------------------------------------
    const PRECOS = {
        splitao: {
            '5': 17299.00, // aparelho de climatização splitão 5TR
            '7.5': 20209.00, // aparelho de climatização splitão 7,5TR
            '10': 23844.00, // aparelho de climatização splitão 10TR
            '15': 35372.00, // aparelho de climatização splitão 15TR
        },
        // Valor do duto por m² (material + fabricação) - manter o cálculo anterior
        duto_m2: 10.87 * 5.12 + 42.72, // R$ 55.59 / m²
        isolamento: {
            vidro_m2: 2.65, // Manta de Lã de Vidro Aluminizada c/ Reforço (Isoflex 4+) por m²
            rocha_m2: 34.00, // Manta de Lã de Rocha por m²
        },
        difusor_50x50: 350.00, // Difusor 50cm x 50cm
        grelha_retorno_50x40: 365.00, // Grelha de retorno 50cm x 40cm
        grelha_retorno_40x20: 224.00, // Grelha de retorno 40cm x 20cm
        tae_100x100: 150.00, // Tomada de ar externo 100 x 100
        tubo_cobre_5m: 150.00, // Tubo de cobre - 5m de comprimento
        suporte_unidade: 200.37, // Média de suporte para condensadora de grande porte
        mao_obra: {
            instalacao_unidade_central: { min: 800, max: 1000 }, // Para o splitão
            fabricacao_montagem_dutos: { min: 1000, max: 2000 }, // Para toda a rede de dutos
            instalacao_terminais_ar: { min: 250, max: 700 }, // Para difusores, grelhas, TAEs (custo por projeto ou fator)
            carga_gas_refrigerante: 1000.00, // Custo do gás e mão de obra para preenchimento do sistema
            infraestrutura_do_zero: { min: 2000, max: 3000 }, // Custo adicional se não houver pré-instalação
            instalacao_tubo_cobre_por_unidade: 50.00 // Custo de mão de obra para instalação de cada tubo de 5m
        }
    };

    // -----------------------------------------------------------
    // Funções Auxiliares
    // -----------------------------------------------------------

    /**
     * Formata um valor numérico para o padrão de moeda BRL (Real Brasileiro).
     * @param {number} value - O valor a ser formatado.
     * @returns {string} O valor formatado como moeda.
     */
    const formatCurrency = (value) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // -----------------------------------------------------------
    // Lógica da Interface (Event Listeners)
    // -----------------------------------------------------------

    // Listener para o tipo de isolamento (mostra/esconde campo de m²)
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

    // Listener para o botão de Calcular Orçamento
    calcularOrcamentoBtn.addEventListener('click', () => {
        const metragem = parseFloat(metragemInput.value);
        const cargaTermicaTR = parseFloat(cargaTermicaInput.value);
        const preInstalacao = preInstalacaoCheckbox.checked;

        // Validação inicial dos campos obrigatórios
        if (isNaN(metragem) || metragem <= 0) {
            alert('Por favor, preencha a Metragem Quadrada corretamente.');
            return;
        }
        if (isNaN(cargaTermicaTR) || cargaTermicaTR <= 0) {
            alert('Por favor, preencha a Carga Térmica (TR) corretamente.');
            return;
        }
        if (splitaoCapacidadeSelect.value === "") {
            alert('Por favor, selecione a capacidade do Splitão.');
            return;
        }

        let custoEquipamentos = 0;
        let custoMateriais = 0;
        let custoMaoObra = 0;
        let detalhamento = []; // Array para armazenar os itens detalhados do orçamento

        // 1. Custo do Splitão (Equipamento Principal)
        const splitaoCapacidade = splitaoCapacidadeSelect.value;
        const custoSplitao = PRECOS.splitao[splitaoCapacidade];
        custoEquipamentos += custoSplitao;
        detalhamento.push({ item: `Aparelho de Climatização Splitão (${splitaoCapacidade} TR)`, custo: custoSplitao });

        // 2. Custo de Materiais e Componentes

        // Dutos
        const dutosM2 = parseFloat(dutosM2Input.value);
        if (isNaN(dutosM2) || dutosM2 < 0) { alert('Verifique a quantidade de Dutos (m²).'); return; }
        const custoDutos = dutosM2 * PRECOS.duto_m2;
        custoMateriais += custoDutos;
        detalhamento.push({ item: `Dutos (${dutosM2} m²)`, custo: custoDutos });

        // Isolamento Térmico
        const isolamentoTipo = isolamentoTipoSelect.value;
        const isolamentoM2 = parseFloat(isolamentoM2Input.value);
        let custoIsolamento = 0;
        if (isolamentoTipo !== 'nenhum') {
            if (isNaN(isolamentoM2) || isolamentoM2 < 0) { alert('Verifique a metragem do Isolamento Térmico.'); return; }
            if (isolamentoTipo === 'vidro') {
                custoIsolamento = isolamentoM2 * PRECOS.isolamento.vidro_m2;
                detalhamento.push({ item: `Isolamento Térmico (Lã de Vidro, ${isolamentoM2} m²)`, custo: custoIsolamento });
            } else if (isolamentoTipo === 'rocha') {
                custoIsolamento = isolamentoM2 * PRECOS.isolamento.rocha_m2;
                detalhamento.push({ item: `Isolamento Térmico (Lã de Rocha, ${isolamentoM2} m²)`, custo: custoIsolamento });
            }
            custoMateriais += custoIsolamento;
        }

        // Difusores
        const difusoresQtd = parseFloat(difusoresQtdInput.value);
        if (isNaN(difusoresQtd) || difusoresQtd < 0) { alert('Verifique a quantidade de Difusores.'); return; }
        const custoDifusores = difusoresQtd * PRECOS.difusor_50x50;
        custoMateriais += custoDifusores;
        detalhamento.push({ item: `Difusor (50x50cm) (${difusoresQtd} unidades)`, custo: custoDifusores });

        // Grelhas de Retorno (50x40cm)
        const grelhasRetorno50x40Qtd = parseFloat(grelhasRetorno50x40QtdInput.value);
        if (isNaN(grelhasRetorno50x40Qtd) || grelhasRetorno50x40Qtd < 0) { alert('Verifique a quantidade de Grelhas de Retorno (50x40cm).'); return; }
        const custoGrelhasRetorno50x40 = grelhasRetorno50x40Qtd * PRECOS.grelha_retorno_50x40;
        custoMateriais += custoGrelhasRetorno50x40;
        detalhamento.push({ item: `Grelha de Retorno (50x40cm) (${grelhasRetorno50x40Qtd} unidades)`, custo: custoGrelhasRetorno50x40 });

        // Grelhas de Retorno (40x20cm)
        const grelhasRetorno40x20Qtd = parseFloat(grelhasRetorno40x20QtdInput.value);
        if (isNaN(grelhasRetorno40x20Qtd) || grelhasRetorno40x20Qtd < 0) { alert('Verifique a quantidade de Grelhas de Retorno (40x20cm).'); return; }
        const custoGrelhasRetorno40x20 = grelhasRetorno40x20Qtd * PRECOS.grelha_retorno_40x20;
        custoMateriais += custoGrelhasRetorno40x20;
        detalhamento.push({ item: `Grelha de Retorno (40x20cm) (${grelhasRetorno40x20Qtd} unidades)`, custo: custoGrelhasRetorno40x20 });

        // Tomadas de Ar Externo (TAEs)
        const taesQtd = parseFloat(taesQtdInput.value);
        if (isNaN(taesQtd) || taesQtd < 0) { alert('Verifique a quantidade de Tomadas de Ar Externo (TAEs).'); return; }
        const custoTAEs = taesQtd * PRECOS.tae_100x100;
        custoMateriais += custoTAEs;
        detalhamento.push({ item: `Tomada de Ar Externo (100x100) (${taesQtd} unidades)`, custo: custoTAEs });

        // Tubos de Cobre
        const tuboCobreQtd = parseFloat(tuboCobreQtdInput.value);
        if (isNaN(tuboCobreQtd) || tuboCobreQtd < 0) { alert('Verifique a quantidade de Tubos de Cobre.'); return; }
        const custoTuboCobre = tuboCobreQtd * PRECOS.tubo_cobre_5m;
        custoMateriais += custoTuboCobre;
        detalhamento.push({ item: `Tubo de Cobre (5m) (${tuboCobreQtd} unidades)`, custo: custoTuboCobre });

        // Suportes para Condensadora
        const suportesQtd = parseFloat(suportesQtdInput.value);
        if (isNaN(suportesQtd) || suportesQtd < 0) { alert('Verifique a quantidade de Suportes para Condensadora.'); return; }
        const custoSuportes = suportesQtd * PRECOS.suporte_unidade;
        custoMateriais += custoSuportes;
        detalhamento.push({ item: `Suportes para Condensadora (${suportesQtd} unidades)`, custo: custoSuportes });

        // 3. Custo de Mão de Obra

        // Instalação da Unidade Central
        const custoMoUnidadeCentral = (PRECOS.mao_obra.instalacao_unidade_central.min + PRECOS.mao_obra.instalacao_unidade_central.max) / 2;
        custoMaoObra += custoMoUnidadeCentral;
        detalhamento.push({ item: 'Mão de Obra: Instalação da Unidade Central', custo: custoMoUnidadeCentral });

        // Fabricação e Montagem de Dutos (assumindo que varia com a complexidade, pegamos a média)
        const custoMoDutos = (PRECOS.mao_obra.fabricacao_montagem_dutos.min + PRECOS.mao_obra.fabricacao_montagem_dutos.max) / 2;
        custoMaoObra += custoMoDutos;
        detalhamento.push({ item: 'Mão de Obra: Fabricação e Montagem de Dutos', custo: custoMoDutos });

        // Instalação de Terminais de Ar (Difusores, Grelhas, TAEs) - assume-se um custo por projeto, ou por ponto se detalhado
        const custoMoTerminaisAr = (PRECOS.mao_obra.instalacao_terminais_ar.min + PRECOS.mao_obra.instalacao_terminais_ar.max) / 2;
        custoMaoObra += custoMoTerminaisAr;
        detalhamento.push({ item: 'Mão de Obra: Instalação de Difusores, Grelhas e TAEs', custo: custoMoTerminaisAr });
        
        // Instalação de Tubos de Cobre
        const custoMoTuboCobre = tuboCobreQtd * PRECOS.mao_obra.instalacao_tubo_cobre_por_unidade;
        custoMaoObra += custoMoTuboCobre;
        detalhamento.push({ item: `Mão de Obra: Instalação de Tubos de Cobre (${tuboCobreQtd} unidades)`, custo: custoMoTuboCobre });

        // Carga de Gás Refrigerante
        custoMaoObra += PRECOS.mao_obra.carga_gas_refrigerante;
        detalhamento.push({ item: 'Mão de Obra: Carga de Gás Refrigerante', custo: PRECOS.mao_obra.carga_gas_refrigerante });

        // Infraestrutura "do zero" (se não houver pré-instalação)
        if (!preInstalacao) {
            const custoMoInfraestrutura = (PRECOS.mao_obra.infraestrutura_do_zero.min + PRECOS.mao_obra.infraestrutura_do_zero.max) / 2;
            custoMaoObra += custoMoInfraestrutura;
            detalhamento.push({ item: 'Mão de Obra: Infraestrutura (Instalação "do zero")', custo: custoMoInfraestrutura });
        }

        // Calcula o custo total do projeto
        const custoTotal = custoEquipamentos + custoMateriais + custoMaoObra;

        // -----------------------------------------------------------
        // Exibir Resultados na Tela
        // -----------------------------------------------------------
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

        resultadoSection.style.display = 'block'; // Mostra a seção de resultados

        // Configura o botão de gerar PDF com os dados calculados
        gerarPDFBtn.onclick = () => gerarPDF(metragem, cargaTermicaTR, preInstalacao, custoEquipamentos, custoMateriais, custoMaoObra, custoTotal, detalhamento);
    });

    // -----------------------------------------------------------
    // Função de Geração de PDF
    // -----------------------------------------------------------

    /**
     * Gera e baixa um arquivo PDF com o orçamento detalhado.
     * @param {number} metragem - Metragem quadrada do ambiente.
     * @param {number} cargaTermicaTR - Carga térmica em TR.
     * @param {boolean} preInstalacao - Indica se há pré-instalação.
     * @param {number} custoEquipamentos - Custo total dos equipamentos.
     * @param {number} custoMateriais - Custo total dos materiais.
     * @param {number} custoMaoObra - Custo total da mão de obra.
     * @param {number} custoTotal - Custo total estimado do projeto.
     * @param {Array<Object>} detalhamento - Array com os detalhes de cada item e custo.
     */
    function gerarPDF(metragem, cargaTermicaTR, preInstalacao, custoEquipamentos, custoMateriais, custoMaoObra, custoTotal, detalhamento) {
        // Verifica se jsPDF está carregado
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            console.error("Erro: jsPDF não está carregado. Verifique o CDN no index.html.");
            alert("Não foi possível gerar o PDF. A biblioteca de PDF pode não ter sido carregada. Tente novamente ou verifique o console do navegador.");
            return;
        }
        if (typeof window.autoTable === 'undefined' && typeof window.jsPDF.autoTable === 'undefined') {
            console.error("Erro: jspdf-autotable não está carregado. Verifique o CDN no index.html.");
            alert("Não foi possível gerar a tabela do PDF. A biblioteca jspdf-autotable pode não ter sido carregada.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Configura a fonte para melhor compatibilidade com caracteres especiais (Helvética é segura)
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(33, 33, 33); // Cor de texto padrão

        let y = 20; // Posição inicial Y no documento

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
        const splitText = doc.splitTextToSize(executiveSummary, 180); // Quebra o texto para caber na largura da página
        doc.text(splitText, 15, y);
        y += doc.getTextDimensions(splitText).h + 10; // Atualiza Y com a altura do texto

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

        // Cria a tabela usando jspdf-autotable
        doc.autoTable({
            startY: y,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped', // Estilo da tabela
            headStyles: { fillColor: [44, 62, 80], textColor: 255, font: 'helvetica', fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3, font: 'helvetica', textColor: [33, 33, 33] },
            columnStyles: {
                0: { cellWidth: 120 }, // Largura da coluna Item
                1: { cellWidth: 50, halign: 'right' } // Largura e alinhamento da coluna Custo
            },
            margin: { left: 15, right: 15 }, // Margens da tabela
            didDrawPage: function (data) {
                // Adiciona número de página no rodapé
                let str = 'Página ' + doc.internal.getNumberOfPages();
                doc.setFontSize(9);
                doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        // Atualiza a posição Y após a tabela
        y = doc.autoTable.previous.finalY + 15;
        if (y > doc.internal.pageSize.height - 40) { // Se não houver espaço, adiciona nova página
            doc.addPage();
            y = 20;
        }

        // Adiciona texto de conclusões/recomendações
        doc.setFontSize(12);
        doc.text('Conclusões e Recomendações:', 15, y);
        y += 7;
        doc.setFontSize(10);
        const conclusions = `A instalação de um sistema de climatização dutada com splitão em Florianópolis representa um investimento significativo, justificado pela sua capacidade de atender a grandes áreas com eficiência e conforto. O custo total é uma composição complexa de equipamentos de alta capacidade, materiais especializados para dutos e isolamento, e uma mão de obra altamente qualificada. Para os interessados, é crucial solicitar orçamentos detalhados, priorizar empresas qualificadas, avaliar o custo-benefício a longo prazo e compreender a importância da pré-instalação.`;
        const splitConclusions = doc.splitTextToSize(conclusions, 180);
        doc.text(splitConclusions, 15, y);

        // Salva o documento PDF
        doc.save('orcamento_climatizacao.pdf');
    }
});
