// Dados iniciais padrão
let servicos = JSON.parse(localStorage.getItem('af_servicos')) || [
  { nome: 'Corte Feminino', preco: 60 },
  { nome: 'Manicure e Pedicure', preco: 55 },
  { nome: 'Design de Sobrancelhas', preco: 40 },
  { nome: 'Corte Masculino + Barba', preco: 50 }
];

let agendamentos = JSON.parse(localStorage.getItem('af_agendamentos')) || [];
let nomeLoja = localStorage.getItem('af_nome_loja') || 'Studio Beleza & Estilo';

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('nome-estabelecimento').innerText = nomeLoja;
  
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('data').value = hoje;
  document.getElementById('filtro-data').value = hoje;

  atualizarSelectServicos();
  renderizarAgenda();
});

function editarEstabelecimento() {
  const novoNome = prompt('Digite o nome do Salão, Barbearia ou Estúdio:', nomeLoja);
  if (novoNome && novoNome.trim() !== '') {
    nomeLoja = novoNome.trim();
    localStorage.setItem('af_nome_loja', nomeLoja);
    document.getElementById('nome-estabelecimento').innerText = nomeLoja;
  }
}

function atualizarSelectServicos() {
  const select = document.getElementById('servico');
  select.innerHTML = '';
  servicos.forEach((s, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${s.nome} - R$ ${s.preco.toFixed(2)}`;
    select.appendChild(option);
  });
}

function adicionarServico() {
  const nome = document.getElementById('novo-servico-nome').value.trim();
  const preco = parseFloat(document.getElementById('novo-servico-preco').value);

  if (!nome || isNaN(preco) || preco <= 0) {
    alert('Preencha o nome e um valor válido para o serviço.');
    return;
  }

  servicos.push({ nome, preco });
  localStorage.setItem('af_servicos', JSON.stringify(servicos));
  atualizarSelectServicos();

  document.getElementById('novo-servico-nome').value = '';
  document.getElementById('novo-servico-preco').value = '';
  alert('Serviço cadastrado com sucesso!');
}

document.getElementById('form-agendamento').addEventListener('submit', function(e) {
  e.preventDefault();

  const cliente = document.getElementById('cliente').value.trim();
  const whatsapp = document.getElementById('whatsapp').value.replace(/\D/g, '');
  const servicoIndex = document.getElementById('servico').value;
  const data = document.getElementById('data').value;
  const hora = document.getElementById('hora').value;

  // Bloqueio de horário duplicado
  const conflito = agendamentos.some(a => a.data === data && a.hora === hora);
  if (conflito) {
    alert('⚠️ Já existe um cliente agendado neste mesmo dia e horário!');
    return;
  }

  const servicoEscolhido = servicos[servicoIndex];

  const novo = {
    id: Date.now(),
    cliente,
    whatsapp,
    servico: servicoEscolhido.nome,
    preco: servicoEscolhido.preco,
    data,
    hora,
    concluido: false
  };

  agendamentos.push(novo);
  salvarERenderizar();

  document.getElementById('cliente').value = '';
  document.getElementById('whatsapp').value = '';
  document.getElementById('hora').value = '';
  document.getElementById('filtro-data').value = data;
  renderizarAgenda();
});

function salvarERenderizar() {
  localStorage.setItem('af_agendamentos', JSON.stringify(agendamentos));
  renderizarAgenda();
}

function renderizarAgenda() {
  const lista = document.getElementById('lista-agendamentos');
  const dataFiltro = document.getElementById('filtro-data').value;
  const hoje = new Date().toISOString().split('T')[0];

  // Atualizar Dashboard
  const agendamentosHoje = agendamentos.filter(a => a.data === hoje);
  const faturamentoHoje = agendamentosHoje.reduce((acc, item) => acc + item.preco, 0);

  document.getElementById('total-hoje').innerText = agendamentosHoje.length;
  document.getElementById('faturamento-hoje').innerText = `R$ ${faturamentoHoje.toFixed(2).replace('.', ',')}`;
  document.getElementById('total-geral').innerText = agendamentos.length;

  // Filtrar e ordenar por horário
  const filtrados = agendamentos
    .filter(a => !dataFiltro || a.data === dataFiltro)
    .sort((a, b) => a.hora.localeCompare(b.hora));

  lista.innerHTML = '';

  if (filtrados.length === 0) {
    lista.innerHTML = '<p style="color: #64748b; text-align: center; padding: 20px;">Nenhum agendamento para esta data.</p>';
    return;
  }

  filtrados.forEach(item => {
    const dataFormatada = item.data.split('-').reverse().join('/');
    const div = document.createElement('div');
    div.className = `item-agenda ${item.concluido ? 'concluido' : ''}`;

    div.innerHTML = `
      <div class="item-info">
        <h4>${item.hora} - ${item.cliente} ${item.concluido ? '✅' : ''}</h4>
        <p>${item.servico} • <strong>R$ ${item.preco.toFixed(2)}</strong> • 📅 ${dataFormatada}</p>
      </div>
      <div class="acoes">
        <button class="btn-acao btn-whats" onclick="enviarWhatsApp('${item.cliente}', '${item.whatsapp}', '${item.servico}', '${dataFormatada}', '${item.hora}')">WhatsApp</button>
        <button class="btn-acao btn-ok" onclick="alternarStatus(${item.id})">${item.concluido ? 'Reabrir' : 'Concluir'}</button>
        <button class="btn-acao btn-del" onclick="excluirAgendamento(${item.id})">Excluir</button>
      </div>
    `;
    lista.appendChild(div);
  });
}

function enviarWhatsApp(cliente, telefone, servico, data, hora) {
  const mensagem = `Olá ${cliente}! Passando para confirmar seu horário de *${servico}* no *${nomeLoja}* dia *${data}* às *${hora}*. Podemos confirmar?`;
  const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}

function alternarStatus(id) {
  agendamentos = agendamentos.map(a => a.id === id ? { ...a, concluido: !a.concluido } : a);
  salvarERenderizar();
}

function excluirAgendamento(id) {
  if (confirm('Deseja cancelar e remover este agendamento?')) {
    agendamentos = agendamentos.filter(a => a.id !== id);
    salvarERenderizar();
  }
}