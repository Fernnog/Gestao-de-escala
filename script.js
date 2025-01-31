// Estrutura de dados
let membros = [];
let ultimoId = 0;
let restricoesPermanentes = {};
let restricoesMensais = {};
const cacheDisponibilidade = new Map();

// Função para exibir a seção correta
function showSection(sectionId) {
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
}

// Função para validar dados de membros
function validarMembro(nome, sexo) {
    if (!nome || !sexo) return false;
    if (membros.some(m => m.nome === nome)) return false;
    return true;
}

// Função para adicionar um membro
document.getElementById('membrosForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const nome = sanitizarInput(document.getElementById('nome').value);
    const sexo = sanitizarInput(document.getElementById('sexo').value);
    const ministerios = sanitizarInput(document.getElementById('ministerios').value);

    if (!validarMembro(nome, sexo)) {
        mostrarFeedback('Dados inválidos ou membro já cadastrado', 'erro');
        return;
    }

    membros.push({
        id: ultimoId++,
        nome,
        sexo,
        ministerios
    });

    atualizarListaMembros();
    salvarEstado();
    this.reset();
    mostrarFeedback('Membro adicionado com sucesso', 'sucesso');
});

// Função para atualizar a lista de membros (com paginação)
function atualizarListaMembros(pagina = 1) {
    const membrosList = document.getElementById('membrosList');
    membrosList.innerHTML = '';
    const itensPorPagina = 10;
    const inicio = (pagina - 1) * itensPorPagina;
    const membrosPaginados = membros.slice(inicio, inicio + itensPorPagina);
    membrosPaginados.forEach((membro, index) => {
        const membroDiv = document.createElement('div');
        membroDiv.innerHTML = `
            <p>${membro.nome} - ${membro.sexo} - ${membro.ministerios}</p>
            <button onclick="editarMembro(${index + inicio})">Editar</button>
            <button onclick="excluirMembro(${index + inicio})">Excluir</button>
        `;
        membrosList.appendChild(membroDiv);
    });

    // Paginação
    const totalPaginas = Math.ceil(membros.length / itensPorPagina);
    if (totalPaginas > 1) {
        const paginacao = document.createElement('div');
        paginacao.className = 'paginacao';
        for (let i = 1; i <= totalPaginas; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = i === pagina ? 'active' : '';
            btn.onclick = () => atualizarListaMembros(i);
            paginacao.appendChild(btn);
        }
        membrosList.appendChild(paginacao)
    }
    atualizarSelectMembros();
}

// Função para editar um membro
function editarMembro(index) {
    const membro = membros[index];
    document.getElementById('nome').value = membro.nome;
    document.getElementById('sexo').value = membro.sexo;
    document.getElementById('ministerios').value = membro.ministerios;
    membros.splice(index, 1);
    atualizarListaMembros();
    salvarEstado();
}

// Função para excluir um membro
function excluirMembro(index) {
    membros.splice(index, 1);
    atualizarListaMembros();
    salvarEstado();
}

// Função para atualizar o select de membros nas restrições
function atualizarSelectMembros() {
    const membroSelectDiasSemana = document.getElementById('membroDiasSemana');
    const membroSelectDatas = document.getElementById('membroDatas');
    membroSelectDiasSemana.innerHTML = '';
    membroSelectDatas.innerHTML = '';

    membros.forEach(membro => {
        const optionDiasSemana = document.createElement('option');
        optionDiasSemana.value = membro.id;
        optionDiasSemana.textContent = membro.nome;
        membroSelectDiasSemana.appendChild(optionDiasSemana);

        const optionDatas = document.createElement('option');
        optionDatas.value = membro.id;
        optionDatas.textContent = membro.nome;
        membroSelectDatas.appendChild(optionDatas);
    });
}

// Função para adicionar restrições de dia da semana
document.getElementById('restricoesDiasSemanaForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const membroId = parseInt(document.getElementById('membroDiasSemana').value, 10);
    const membro = membros.find(m => m.id === membroId)
    const restricoesDiasSemana = Array.from(document.querySelectorAll('input[name="restricoesDiasSemana"]:checked')).map(input => input.value);
    restricoesPermanentes[membro.id] = restricoesDiasSemana;
    atualizarListaRestricoesPermanentes();
    salvarEstado();
    this.reset();
    mostrarFeedback('Restrições de dias da semana adicionada com sucesso', 'sucesso');
});

// Função para atualizar a lista de restrições permanentes (dias da semana)
function atualizarListaRestricoesPermanentes() {
    const restricoesDiasSemanaList = document.getElementById('restricoesDiasSemanaList');
    restricoesDiasSemanaList.innerHTML = '';
    for (const membroId in restricoesPermanentes) {
        const membro = membros.find(m => m.id === parseInt(membroId, 10))
        if (membro) {
            const restricaoDiv = document.createElement('div');
            restricaoDiv.innerHTML = `
                <p>${membro.nome} - Dias da Semana: ${restricoesPermanentes[membroId].join(', ')}</p>
                <button onclick="editarRestricaoPermanente('${membro.id}')">Editar</button>
                <button onclick="excluirRestricaoPermanente('${membro.id}')">Excluir</button>
            `;
            restricoesDiasSemanaList.appendChild(restricaoDiv);
        }
    }
}

// Função para editar restrições permanentes (dias da semana)
function editarRestricaoPermanente(membroId) {
    const membro = membros.find(m => m.id === parseInt(membroId, 10))
    const restricoesDiasSemana = restricoesPermanentes[membroId];
    document.getElementById('membroDiasSemana').value = membro.id;
    document.querySelectorAll('input[name="restricoesDiasSemana"]').forEach(input => {
        input.checked = restricoesDiasSemana.includes(input.value);
    });
    excluirRestricaoPermanente(membro.id);
}

// Função para excluir restrições permanentes (dias da semana)
function excluirRestricaoPermanente(membroId) {
    delete restricoesPermanentes[membroId];
    atualizarListaRestricoesPermanentes();
    salvarEstado();
}

// Função para adicionar restrições mensais (datas específicas)
document.getElementById('restricoesDatasForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const mesAno = sanitizarInput(document.getElementById('mesAno').value);
    const membroId = parseInt(document.getElementById('membroDatas').value, 10);
    const membro = membros.find(m => m.id === membroId);
    const datasRestritasInput = sanitizarInput(document.getElementById('datasRestritas').value);
    const datasRestritas = [];
    const [dataInicial, dataFinal] = datasRestritasInput.split(' - ');

    if (dataInicial && dataFinal) {
        const [diaInicial, mesInicial, anoInicial] = dataInicial.split('/').map(Number);
        const [diaFinal, mesFinal, anoFinal] = dataFinal.split('/').map(Number);
        const dataInicio = new Date(anoInicial, mesInicial - 1, diaInicial);
        const dataFim = new Date(anoFinal, mesFinal - 1, diaFinal);

        if (!isNaN(dataInicio) && !isNaN(dataFim) && dataInicio <= dataFim) {
            for (let data = dataInicio; data <= dataFim; data.setDate(data.getDate() + 1)) {
                datasRestritas.push(new Date(data).toLocaleDateString('pt-BR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }));
            }
        } else {
            mostrarFeedback('Formato inválido para período de datas', 'erro')
            return
        }

    } else {
        datasRestritas.push(...datasRestritasInput.split(',').map(data => data.trim()));
    }

    if (!restricoesMensais[mesAno]) {
        restricoesMensais[mesAno] = {};
    }
    if (!restricoesMensais[mesAno][membro.id]) {
        restricoesMensais[mesAno][membro.id] = [];
    }

    restricoesMensais[mesAno][membro.id] = restricoesMensais[mesAno][membro.id].concat(datasRestritas);

    atualizarListaRestricoesMensais(mesAno);
    salvarEstado();
    this.reset();
    mostrarFeedback('Restrições de datas adicionadas com sucesso', 'sucesso');
});

// Função para atualizar a lista de restrições mensais
function atualizarListaRestricoesMensais(mesAno) {
    const restricoesDatasList = document.getElementById('restricoesDatasList');
    restricoesDatasList.innerHTML = '';

    if (restricoesMensais[mesAno]) {
        for (const membroId in restricoesMensais[mesAno]) {
            const membro = membros.find(m => m.id === parseInt(membroId, 10));
            if (membro) {
                const restricaoDiv = document.createElement('div');
                restricaoDiv.innerHTML = `
                    <p>${membro.nome} - Datas: ${restricoesMensais[mesAno][membroId].join(', ')}</p>
                    <button onclick="editarRestricaoMensal('${mesAno}', '${membro.id}')">Editar</button>
                    <button onclick="excluirRestricaoMensal('${mesAno}', '${membro.id}')">Excluir</button>
                `;
                restricoesDatasList.appendChild(restricaoDiv);
            }

        }
    }
}

// Função para editar uma restrição mensal
function editarRestricaoMensal(mesAno, membroId) {
    const datasRestritas = restricoesMensais[mesAno][membroId];
    document.getElementById('mesAno').value = mesAno;
    document.getElementById('membroDatas').value = membroId;
    document.getElementById('datasRestritas').value = datasRestritas.join(', ');
    excluirRestricaoMensal(mesAno, membroId);
}

// Função para excluir uma restrição mensal
function excluirRestricaoMensal(mesAno, membroId) {
    delete restricoesMensais[mesAno][membroId];
    atualizarListaRestricoesMensais(mesAno);
    salvarEstado();
}

// Função para gerar a escala
document.getElementById('gerarEscalaForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const mesAno = sanitizarInput(document.getElementById('mesAnoEscala').value);

    // Critérios do Painel 1
    const diasSemanaEscala1 = Array.from(document.querySelectorAll('input[name="diasSemanaEscala1"]:checked')).map(input => input.value);
    const usarMesmoSexo1 = sanitizarInput(document.getElementById('usarMesmoSexo1').value);
    const membrosPorDia1 = parseInt(document.getElementById('membrosPorDia1').value, 10);

    // Critérios do Painel 2
    const diasSemanaEscala2 = Array.from(document.querySelectorAll('input[name="diasSemanaEscala2"]:checked')).map(input => input.value);
    const usarMesmoSexo2 = sanitizarInput(document.getElementById('usarMesmoSexo2').value);
    const membrosPorDia2 = parseInt(document.getElementById('membrosPorDia2').value, 10);

    gerarEscala(mesAno, diasSemanaEscala1, usarMesmoSexo1, membrosPorDia1, diasSemanaEscala2, usarMesmoSexo2, membrosPorDia2);
});

function gerarEscala(mesAno, diasSemanaEscala1, usarMesmoSexo1, membrosPorDia1, diasSemanaEscala2, usarMesmoSexo2, membrosPorDia2) {
    try {
        if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(mesAno)) {
            mostrarFeedback('Formato inválido. Por favor, insira no formato MM/AAAA.', 'erro');
            return;
        }

        const partes = mesAno.split('/');
        const mes = parseInt(partes[0], 10) - 1;
        const ano = parseInt(partes[1], 10);
        const data = new Date(ano, mes, 1);
        let datas = [];
        let tiposCulto = [];

        while (data.getMonth() === mes) {
            const diaSemana = data.getDay();
            const dia = ['domingoManha', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][diaSemana];
            if (diaSemana === 0) {
                if (diasSemanaEscala1.includes('domingoManha')) {
                    datas.push(new Date(data));
                    tiposCulto.push("Culto de Domingo (Manhã) - Painel 1");
                }
                if (diasSemanaEscala1.includes('domingoNoite')) {
                    datas.push(new Date(data));
                    tiposCulto.push("Culto de Domingo (Noite) - Painel 1");
                }
                if (diasSemanaEscala2.includes('domingoManha')) {
                    datas.push(new Date(data));
                    tiposCulto.push("Culto de Domingo (Manhã) - Painel 2");
                }
                if (diasSemanaEscala2.includes('domingoNoite')) {
                    datas.push(new Date(data));
                    tiposCulto.push("Culto de Domingo (Noite) - Painel 2");
                }
            } else if (diasSemanaEscala1.includes(dia)) {
                datas.push(new Date(data));
                tiposCulto.push(`Culto de ${dia.charAt(0).toUpperCase() + dia.slice(1)} - Painel 1`);
            } else if (diasSemanaEscala2.includes(dia)) {
                datas.push(new Date(data));
                tiposCulto.push(`Culto de ${dia.charAt(0).toUpperCase() + dia.slice(1)} - Painel 2`);
            }
            data.setDate(data.getDate() + 1);
        }

        const escalaContainer = document.getElementById('escalaContainer');
        escalaContainer.innerHTML = '<h2>Escala Gerada</h2>';
        const tabela = document.createElement('table');
        let headerRow = '<tr><th>Data</th><th>Tipo de Culto</th>';

        // Definir o máximo de membros por dia para o cabeçalho
        const maxMembrosPorDia = Math.max(membrosPorDia1, membrosPorDia2);
        for (let i = 1; i <= maxMembrosPorDia; i++) {
            headerRow += `<th>Membro ${i}</th>`;
        }
        headerRow += '</tr>';
        tabela.innerHTML = `<thead>${headerRow}</thead><tbody></tbody>`;

        const participacoes = {};
        membros.forEach(membro => participacoes[membro.id] = 0);

        const escalaGerada = distribuirMembros(mesAno, datas, tiposCulto, usarMesmoSexo1, membrosPorDia1, usarMesmoSexo2, membrosPorDia2, participacoes);

        escalaGerada.forEach(escalaDia => {
            const dataFormatada = escalaDia.data.toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            let linha = `<td>${dataFormatada}</td><td>${escalaDia.tipoCulto}</td>`;

            // Preencher a linha com os membros, ajustando para o máximo de membros por dia
            for (let i = 0; i < maxMembrosPorDia; i++) {
                linha += `<td>${escalaDia.membros[i] || ''}</td>`;
            }

            const row = document.createElement('tr');
            row.innerHTML = linha;
            tabela.querySelector('tbody').appendChild(row);
        });

        escalaContainer.appendChild(tabela);

        const relatorio = document.createElement('div');
        relatorio.innerHTML = '<h3>Relatório de Participações</h3>';
        const listaParticipacoes = document.createElement('ul');
        for (const membro in participacoes) {
            const membroNome = membros.find(m => m.id === parseInt(membro, 10));
            if (membroNome) {
                const item = document.createElement('li');
                item.textContent = `${membroNome.nome}: ${participacoes[membro]} participações`;
                listaParticipacoes.appendChild(item);
            }
        }
        relatorio.appendChild(listaParticipacoes);
        escalaContainer.appendChild(relatorio);
        mostrarFeedback('Escala gerada com sucesso', 'sucesso');
    } catch (erro) {
        console.error('Falha na geração:', erro);
        mostrarFeedback('Erro ao gerar escala', 'erro');
    }
}

function distribuirMembros(mesAno, datas, tiposCulto, usarMesmoSexo1, membrosPorDia1, usarMesmoSexo2, membrosPorDia2, participacoes) {
    const escalaGerada = [];
    const membrosPorSexo = {
        Masculino: membros.filter(m => m.sexo === 'Masculino'),
        Feminino: membros.filter(m => m.sexo === 'Feminino')
    };

    for (let i = 0; i < datas.length; i++) {
        const data = datas[i];
        const tipoCulto = tiposCulto[i];
        const isPainel1 = tipoCulto.includes('Painel 1');
        const usarMesmoSexo = isPainel1 ? usarMesmoSexo1 : usarMesmoSexo2;
        const membrosPorDia = isPainel1 ? membrosPorDia1 : membrosPorDia2;

        const diaSemana = data.getDay();
        const diasSemana = ['domingoManha', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        let dia = diasSemana[diaSemana];
        if (diaSemana === 0) {
            dia = tipoCulto.includes('Manhã') ? 'domingoManha' : 'domingoNoite';
        }

        let membrosDisponiveisMasculino = membrosPorSexo.Masculino.filter(membro =>
            (!restricoesPermanentes[membro.id] || !restricoesPermanentes[membro.id].includes(dia)) &&
            (!restricoesMensais[mesAno] || !restricoesMensais[mesAno][membro.id] || !restricoesMensais[mesAno][membro.id].includes(data.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })))
        );
        let membrosDisponiveisFeminino = membrosPorSexo.Feminino.filter(membro =>
            (!restricoesPermanentes[membro.id] || !restricoesPermanentes[membro.id].includes(dia)) &&
            (!restricoesMensais[mesAno] || !restricoesMensais[mesAno][membro.id] || !restricoesMensais[mesAno][membro.id].includes(data.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })))
        );

        let membrosSelecionados = [];
        if (usarMesmoSexo === 'sim') {
            const sexoDoDia = Math.random() < 0.5 ? 'Masculino' : 'Feminino';
            let membrosDisponiveis = sexoDoDia === 'Masculino' ? membrosDisponiveisMasculino : membrosDisponiveisFeminino;

            membrosDisponiveis.sort((a, b) => participacoes[a.id] - participacoes[b.id]);
            for (let j = 0; j < membrosPorDia && membrosDisponiveis.length > 0; j++) {
                let membroSelecionado = membrosDisponiveis.shift();
                membrosSelecionados.push(membroSelecionado.nome);
                participacoes[membroSelecionado.id]++;
            }
        } else {
            let membrosDisponiveis = [...membrosDisponiveisMasculino, ...membrosDisponiveisFeminino];
            membrosDisponiveis.sort((a, b) => participacoes[a.id] - participacoes[b.id]);

            for (let j = 0; j < membrosPorDia && membrosDisponiveis.length > 0; j++) {
                let membroSelecionado = membrosDisponiveis.shift();
                membrosSelecionados.push(membroSelecionado.nome);
                participacoes[membroSelecionado.id]++;
            }
        }

        escalaGerada.push({
            data: data,
            tipoCulto: tipoCulto,
            membros: membrosSelecionados
        });
    }

    return escalaGerada;
}

// Função para exportar dados
function exportarDados() {
    const dados = {
        membros,
        ultimoId,
        restricoesPermanentes,
        restricoesMensais
    };

    // --- Adicionado para formatar o nome do arquivo ---
    const dataExportacao = new Date();
    const ano = dataExportacao.getFullYear();
    const mes = (dataExportacao.getMonth() + 1).toString().padStart(2, '0');
    const dia = dataExportacao.getDate().toString().padStart(2, '0');
    const hora = dataExportacao.getHours().toString().padStart(2, '0');
    const minutos = dataExportacao.getMinutes().toString().padStart(2, '0');
    const nomeArquivo = `${ano}${mes}${dia}_${hora}${minutos}_Gestao_de_Escala.json`;
    // --------------------------------------------------

    const blob = new Blob([JSON.stringify(dados, null, 2)], {
        type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo; // Usar o nome formatado aqui
    a.click();
    URL.revokeObjectURL(url);
}

// Função para importar dados
function importarDados() {
    const input = document.getElementById('importarArquivo');
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            try {
                const dados = JSON.parse(event.target.result);
                membros = dados.membros;
                ultimoId = dados.ultimoId;
                restricoesPermanentes = dados.restricoesPermanentes;
                restricoesMensais = dados.restricoesMensais;
                atualizarListaMembros();
                salvarEstado();

                // --- Extrair data e hora do nome do arquivo ---
                const nomeArquivo = file.name;
                const regex = /(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})/; // Regex para o padrão AAAAMMDD_HHHH
                const match = nomeArquivo.match(regex);

                if (match) {
                    const ano = match[1];
                    const mes = match[2];
                    const dia = match[3];
                    const hora = match[4];
                    const minutos = match[5];

                    // Criar objeto Date a partir dos componentes extraídos
                    const dataArquivo = new Date(ano, mes - 1, dia, hora, minutos); // -1 em mês porque os meses começam em 0 no JavaScript

                    localStorage.setItem('ultimoBackup', dataArquivo.toISOString());
                    atualizarDataUltimoBackup();
                } else {
                    // Se o nome do arquivo não seguir o padrão, poderia:
                    // 1. Usar a data/hora atual (como antes)
                    // 2. Ou exibir uma mensagem de erro
                    // Para este exemplo, vamos usar a data/hora atual:
                    const dataImportacao = new Date();
                    localStorage.setItem('ultimoBackup', dataImportacao.toISOString());
                    atualizarDataUltimoBackup();
                    console.warn("Nome do arquivo não segue o padrão esperado. Usando data/hora atual.");
                }
                // ------------------------------------------------

                mostrarFeedback('Dados importados com sucesso', 'sucesso');
            } catch (erro) {
                console.error('Falha na importação:', erro);
                mostrarFeedback('Erro ao importar dados', 'erro');
            }
        };
        reader.readAsText(file);
    }
}

// Função para limpar dados
function limparDados() {
    membros = [];
    ultimoId = 0;
    restricoesPermanentes = {};
    restricoesMensais = {};
    cacheDisponibilidade.clear();
    atualizarListaMembros();
    salvarEstado();
    mostrarFeedback('Dados limpos com sucesso', 'sucesso');
}

// Função para sanitizar inputs
function sanitizarInput(texto) {
    return texto ? texto.replace(/[<>]/g, '') : '';
}

// Função para mostrar feedback visual
function mostrarFeedback(mensagem, tipo = 'sucesso') {
    const div = document.createElement('div');
    div.className = `feedback ${tipo}`;
    div.textContent = mensagem;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// Função para salvar o estado
function salvarEstado() {
    localStorage.setItem('estado', JSON.stringify({
        membros,
        ultimoId,
        restricoesPermanentes,
        restricoesMensais
    }));
}

// Função para carregar o estado
function carregarEstado() {
    const estado = localStorage.getItem('estado');
    if (estado) {
        try {
            const { membros: membrosSalvos, ultimoId: ultimoIdSalvo, restricoesPermanentes: restricoesPermanentesSalvas, restricoesMensais: restricoesMensaisSalvas } = JSON.parse(estado);
            membros = membrosSalvos;
            ultimoId = ultimoIdSalvo;
            restricoesPermanentes = restricoesPermanentesSalvas;
            restricoesMensais = restricoesMensaisSalvas;
            atualizarListaMembros();

        } catch (erro) {
            console.error('Falha ao carregar estado:', erro);
            mostrarFeedback('Erro ao carregar dados salvos', 'erro');
        }
    }
}

// --- Nova função para exportar para Excel ---
function exportarParaExcel() {
    // 1. Obter os dados da tabela
    const tabela = document.querySelector('#escalaContainer table');
    const dadosTabela = [];

    // Iterar pelas linhas da tabela
    for (let i = 0; i < tabela.rows.length; i++) {
        const linha = tabela.rows[i];
        const dadosLinha = [];

        // Iterar pelas células da linha
        for (let j = 0; j < linha.cells.length; j++) {
            dadosLinha.push(linha.cells[j].innerText);
        }

        dadosTabela.push(dadosLinha);
    }

    // 2. Criar uma nova planilha (workbook)
    const wb = XLSX.utils.book_new();

    // 3. Adicionar uma nova folha (worksheet) à planilha
    const ws = XLSX.utils.aoa_to_sheet(dadosTabela);

    // 4. Adicionar a folha à planilha
    XLSX.utils.book_append_sheet(wb, ws, 'Escala');

    // 5. Exportar a planilha como um arquivo XLSX
    XLSX.writeFile(wb, 'escala.xlsx');
}

// Função para atualizar a data do último backup
function atualizarDataUltimoBackup() {
    const ultimoBackupDiv = document.getElementById('ultimoBackup');
    const dataUltimoBackup = localStorage.getItem('ultimoBackup');

    if (dataUltimoBackup) {
        const data = new Date(dataUltimoBackup);
        const dia = data.getDate().toString().padStart(2, '0');
        const mes = (data.getMonth() + 1).toString().padStart(2, '0'); // +1 porque os meses começam em 0
        const ano = data.getFullYear();
        const hora = data.getHours().toString().padStart(2, '0'); // Adiciona a hora
        const minuto = data.getMinutes().toString().padStart(2, '0'); // Adiciona os minutos

        ultimoBackupDiv.textContent = `Último backup: ${dia}/${mes}/${ano} ${hora}:${minuto}`; // Formato com data e hora
    } else {
        ultimoBackupDiv.textContent = ''; // Oculta o div se não houver backup
    }
}

// Carregar ao iniciar
carregarEstado();
atualizarListaMembros();
atualizarDataUltimoBackup(); // <-- Adicionado aqui
