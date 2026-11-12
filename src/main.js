import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ---------- Áreas do CD ----------
const ZONAS = [
  { id: 'entrada', nome: 'Doca de Entrada', x0: -30, x1: -18.5, z0: -18, z1: 5, etapa: 1,
    resumo: 'Recebe os produtos com agilidade e segurança.',
    texto: 'É por aqui que os caminhões dos fornecedores chegam com arroz, feijão e outros alimentos. A carga é descarregada com empilhadeiras e paleteiras e segue para a conferência.',
    conceitos: ["Agendamento de descarga: cada caminhão tem hora marcada para evitar fila no pátio.", "Caminhão encosta de ré na doca, com calço nas rodas e rampa niveladora.", "Área de staging: a carga fica aqui, separada, até ser conferida.", "Cross-docking: carga que já tem destino vai direto para a expedição, sem passar pelo estoque."] },
  { id: 'recebimento', nome: 'Recebimento e Conferência', x0: -2.5, x1: 7, z0: -18, z1: -8.5, etapa: 2,
    resumo: 'Confere qualidade e quantidade de cada entrega.',
    texto: 'Cada entrega é comparada com a nota fiscal: quantidade, validade, lote e estado das embalagens. Só depois de aprovada a mercadoria entra no estoque do CD.',
    conceitos: ["Conferência cega: o conferente conta sem ver a quantidade da nota, para não ser induzido.", "Confronto entre nota fiscal, pedido de compra e carga física.", "Em alimentos: validade, lote e integridade da embalagem.", "Avarias e divergências vão para a área de quarentena, fora do estoque.", "Etiqueta e entrada no WMS (sistema de gerenciamento do armazém)."] },
  { id: 'armazenagem', nome: 'Armazenagem', x0: -17.5, x1: -3, z0: -15, z1: 3, etapa: 3,
    resumo: 'Guarda os itens em locais organizados e estratégicos.',
    texto: 'Os paletes são guardados em estruturas porta-paletes, com endereço para cada posição. A organização mantém a integridade dos alimentos e facilita encontrar cada produto.',
    conceitos: ["Endereçamento: rua, módulo, nível e posição — todo palete tem endereço.", "FEFO (PVPS): primeiro que vence, primeiro que sai — a regra para alimentos.", "Curva ABC: itens de maior giro ficam nos locais de acesso mais fácil.", "Alimentos sempre sobre paletes, afastados do chão e das paredes.", "Inventário cíclico para manter a acuracidade do estoque."] },
  { id: 'separacao', nome: 'Separação de Pedidos', x0: 8, x1: 19, z0: -15, z1: -4.5, etapa: 4,
    resumo: 'Prepara os pedidos conforme as necessidades dos clientes.',
    texto: 'Também chamada de picking. Os operadores retiram do estoque exatamente os itens e as quantidades de cada pedido e montam os volumes nas bancadas.',
    conceitos: ["Picking: retirada dos itens do estoque para montar cada pedido.", "Tipos: por pedido (discreto), por lote ou por zona.", "Lista de separação ou coletor de dados guia o operador.", "Posições de picking no nível do chão, ressupridas pelo estoque aéreo.", "É a atividade que mais consome mão de obra em um CD."] },
  { id: 'expedicao', nome: 'Expedição', x0: 9, x1: 19, z0: -1, z1: 9, etapa: 5,
    resumo: 'Organiza e libera os pedidos para envio.',
    texto: 'Os pedidos separados são conferidos de novo, embalados, identificados e agrupados por rota de entrega, prontos para o carregamento.',
    conceitos: ["Segunda conferência: pedido separado confere com o pedido do cliente.", "Packing: embalagem, identificação e etiqueta de cada volume.", "Consolidação por rota de entrega.", "Emissão da nota fiscal e do romaneio de carga."] },
  { id: 'saida', nome: 'Doca de Saída', x0: 20, x1: 30, z0: -18, z1: 5, etapa: 6,
    resumo: 'Realiza o carregamento e a saída das mercadorias.',
    texto: 'Os caminhões são carregados na ordem inversa das entregas e saem com controle de prazos e condições, levando os alimentos até os clientes.',
    conceitos: ["Roteirização: define a sequência das entregas.", "Carregamento na ordem inversa da entrega (o último a entregar entra primeiro).", "Conferência de embarque e lacre do caminhão.", "Indicador OTIF: entrega no prazo e completa."] },
  { id: 'administracao', nome: 'Administração', x0: -5, x1: 7, z0: 5, z1: 13.5, etapa: 0,
    resumo: 'Garante a gestão e o suporte de todas as operações.',
    texto: 'A equipe administrativa acompanha estoque, notas fiscais, pessoas e indicadores. É o apoio que mantém todas as outras áreas funcionando.',
    conceitos: ["WMS: controla endereços, estoque e tarefas do armazém.", "Indicadores (KPIs): acuracidade de estoque, OTIF, produtividade e avarias.", "Gestão de pessoas, treinamentos e escalas.", "Segurança: EPIs e NR-11 para operação de empilhadeiras.", "Sinalização: extintores demarcados no piso, faixa de pedestres separada da rota das empilhadeiras."] },
];
const FLUXO = ['entrada', 'recebimento', 'armazenagem', 'separacao', 'expedicao', 'saida'];
const zonaPorId = Object.fromEntries(ZONAS.map(z => [z.id, z]));
ZONAS.forEach(z => { z.cx = (z.x0 + z.x1) / 2; z.cz = (z.z0 + z.z1) / 2; z.tam = Math.max(z.x1 - z.x0, z.z1 - z.z0); });

// ---------- Cena ----------
const canvas = document.getElementById('cena');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfd9ee);
scene.fog = new THREE.Fog(0xbfd9ee, 300, 800);

const camera = new THREE.PerspectiveCamera(42, 1, 0.3, 1500);
const VISAO_GERAL = { pos: new THREE.Vector3(0, 52, 62), alvo: new THREE.Vector3(0, 0, 0) };
camera.position.copy(VISAO_GERAL.pos);

const controls = new OrbitControls(camera, canvas);
controls.target.copy(VISAO_GERAL.alvo);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 8;
controls.maxDistance = 380;
controls.maxPolarAngle = Math.PI / 2 - 0.06;
controls.zoomToCursor = true;
controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f7a, 1.15));
const sol = new THREE.DirectionalLight(0xfff1dc, 2.1);
sol.position.set(-35, 60, 40);
sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048);
Object.assign(sol.shadow.camera, { left: -55, right: 55, top: 50, bottom: -50, near: 1, far: 160 });
sol.shadow.bias = -0.0004;
scene.add(sol);

// ---------- Utilitários ----------
const geoCaixa = new THREE.BoxGeometry(1, 1, 1);
const mats = {};
function mat(cor, opt = {}) {
  const k = cor + JSON.stringify(opt);
  return mats[k] || (mats[k] = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.75, ...opt }));
}
function caixa(w, h, d, cor, x, y, z, pai = scene, opt) {
  const m = new THREE.Mesh(geoCaixa, mat(cor, opt));
  m.scale.set(w, h, d); m.position.set(x, y + h / 2, z);
  m.castShadow = true; m.receiveShadow = true;
  pai.add(m); return m;
}
const geoCil = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
function cilindro(r, h, cor, x, y, z, pai = scene) {
  const m = new THREE.Mesh(geoCil, mat(cor));
  m.scale.set(r * 2, h, r * 2); m.position.set(x, y + h / 2, z);
  m.castShadow = true; pai.add(m); return m;
}
const COR = { azul: 0x1d4f9c, azulEsc: 0x12356b, laranja: 0xf28a1e, amarelo: 0xf6c21c, branco: 0xf1f2f0,
  papelao: 0xc49a62, papelao2: 0xb0844c, madeira: 0x9a7444, cinza: 0x8d949b, escuro: 0x23272e };

// ---------- Terreno ----------
const chao = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), mat(0xb9b3a7, { roughness: 1 }));
chao.rotation.x = -Math.PI / 2; chao.position.y = -0.06; chao.receiveShadow = true; scene.add(chao);
caixa(84, 0.1, 14, 0x3b4047, 0, -0.1, 26);        // estacionamento / rua
caixa(66, 0.12, 4, 0xb9bcc0, 0, -0.1, 20);        // calçada
caixa(14, 0.1, 24, 0x3b4047, -24.25, -0.1, -30);  // acesso doca de entrada
caixa(10, 0.1, 24, 0x3b4047, 25, -0.1, -30);      // acesso doca de saída
for (let i = 0; i < 12; i++) caixa(0.15, 0.02, 5, 0xffffff, 8 + i * 2.6, 0, 26); // vagas
for (let i = 0; i < 7; i++) caixa(0.5, 0.02, 3, 0xffffff, -4 + i * 1.1, 0, 23.5); // faixa de pedestres

// Piso do galpão
caixa(60, 0.2, 36, 0xc9ccce, 0, -0.2, 0, scene, { roughness: 0.35, metalness: 0.05 });

// ---------- Paredes ----------
const H = 5.2, T = 0.4;
function paredeX(x0, x1, z, h = H, cor = COR.branco) { return caixa(x1 - x0, h, T, cor, (x0 + x1) / 2, 0, z); }
function paredeZ(z0, z1, x, h = H, cor = COR.branco) { return caixa(T, h, z1 - z0, cor, x, 0, (z0 + z1) / 2); }
// fundo, com vãos para as docas
paredeX(-30, -27.2, -18); paredeX(-21.3, 22, -18); paredeX(28, 30, -18);
caixa(5.9, 0.9, T, COR.branco, -24.25, H - 0.9, -18); caixa(6, 0.9, T, COR.branco, 25, H - 0.9, -18);
paredeZ(-18, 14, -30); paredeZ(-18, 14, 30);
// faixa azul no topo das paredes
caixa(60.5, 0.35, T + 0.1, COR.azul, 0, H, -18); caixa(T + 0.1, 0.35, 32.2, COR.azul, -30, H, -2); caixa(T + 0.1, 0.35, 32.2, COR.azul, 30, H, -2);
// divisórias internas das docas
paredeZ(-18, -7, -18.2, 4); paredeZ(-18, -7, 19.8, 4);
// proteções amarelas e pretas
for (const x of [-18.2, 19.8]) for (let i = 0; i < 4; i++) caixa(0.5, 1, 0.5, i % 2 ? COR.escuro : COR.amarelo, x, 0, -6.5 + i * 0.5);

// ---------- Fachada (bloco frontal) ----------
caixa(60.4, 5.8, 4, COR.branco, 0, 0, 16);
caixa(11, 3.4, 0.2, COR.laranja, -22, 0, 18.05); caixa(10, 3.4, 0.2, COR.laranja, 19, 0, 18.05);
caixa(4.4, 5.8, 0.25, COR.azul, 27.9, 0, 18.05);
const vidro = { color: 0x29455e, roughness: 0.1, metalness: 0.6, emissive: 0xffc46b, emissiveIntensity: 0.18 };
caixa(8, 2.4, 0.15, 0x29455e, -11.5, 0.3, 18.1, scene, vidro); caixa(8, 2.4, 0.15, 0x29455e, 9.5, 0.3, 18.1, scene, vidro);
caixa(9, 2.8, 0.15, 0x29455e, 0, 0, 18.1, scene, vidro);
caixa(11, 0.35, 2.2, COR.azul, 0, 3, 19); // marquise
caixa(60.6, 0.3, 4.2, 0xdfe2e5, 0, 5.8, 16); caixa(60.6, 0.35, 0.2, COR.azul, 0, 5.8, 18.1);
// canteiros e arbustos
for (const x of [-22, 19]) { caixa(11, 0.35, 1, 0x5c4a36, x, 0, 18.9); for (let i = -4; i <= 4; i += 2) { const a = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), mat(0x3f7d3a)); a.position.set(x + i, 0.7, 18.9); a.castShadow = true; scene.add(a); } }

function placaTexto(linhas, w, h, cores = { fundo: '#ffffff', texto: '#12356b' }) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * h / w);
  const g = c.getContext('2d'); g.fillStyle = cores.fundo; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = cores.texto; g.textAlign = 'center'; g.textBaseline = 'middle';
  linhas.forEach((l, i) => { g.font = `${l.peso || 800} ${l.tam}px Arial, Helvetica, sans-serif`; g.fillText(l.t, c.width / 2, c.height * l.y); });
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tx }));
}
const letreiro = placaTexto([{ t: 'SENAC IMPERATRIZ', tam: 104, y: 0.36 }, { t: 'CENTRO DE DISTRIBUIÇÃO', tam: 70, y: 0.72, peso: 700 }], 12, 2.2);
letreiro.position.set(0, 4.5, 18.07); scene.add(letreiro);

// ---------- Marcações no piso ----------
function linha(x0, z0, x1, z1, cor = COR.amarelo) {
  const w = Math.abs(x1 - x0) || 0.14, d = Math.abs(z1 - z0) || 0.14;
  const m = caixa(w, 0.02, d, cor, (x0 + x1) / 2, 0.001, (z0 + z1) / 2); m.castShadow = false; return m;
}
function contorno(x0, z0, x1, z1) { linha(x0, z0, x1, z0); linha(x0, z1, x1, z1); linha(x0, z0, x0, z1); linha(x1, z0, x1, z1); }
ZONAS.forEach(z => contorno(z.x0 + 0.5, z.z0 + 0.6, z.x1 - 0.5, z.z1 - 0.5));

// ---------- Portas das docas ----------
function portaDoca(x) {
  caixa(6.2, 0.5, 0.5, COR.cinza, x, H - 1.4, -18.1);
  for (let i = 0; i < 3; i++) caixa(5.8, 0.28, 0.12, 0x70777f, x, H - 1.35 + i * 0.3 - 0.9, -18.2);
}
portaDoca(-24.25); portaDoca(25);

const addCaixaDepois = [];
// ---------- Caminhão ----------
function caminhao(x, z, aberto) {
  const g = new THREE.Group();
  caixa(2.7, 3, 9, 0xf4f4f2, 0, 1.15, -1.2, g);
  caixa(2.5, 0.25, 11.5, COR.escuro, 0, 0.8, 0, g);
  caixa(2.6, 2.3, 2.2, 0xfafafa, 0, 1.05, 4.6, g);
  caixa(2.4, 0.9, 0.1, 0x1b2a3a, 0, 2.2, 5.72, g, { roughness: 0.1, metalness: 0.5 });
  caixa(2.6, 0.45, 0.3, 0x5a6068, 0, 0.75, 5.75, g);
  for (const sx of [-1.25, 1.25]) for (const sz of [4.4, -2.6, -4]) {
    const r = cilindro(0.55, 0.45, 0x16181b, sx, 0, sz, g); r.rotation.z = Math.PI / 2; r.position.y = 0.55;
  }
  if (aberto) caixa(2.3, 2.6, 0.08, 0x2a2f36, 0, 1.3, -5.72, g);
  g.position.set(x, 0, z); scene.add(g); return g;
}
for (const x of [-24.25, 25]) {
  const c = caminhao(x, -10.5, true); c.rotation.y = Math.PI;        // encostado de ré
  caixa(2.6, 0.12, 1.6, COR.amarelo, x, 0, -3.9).rotation.x = 0.0;   // rampa niveladora
  for (const sx of [-1.7, 1.7]) caixa(0.35, 0.3, 0.5, COR.amarelo, x + sx, 0, -6.2); // calços de roda
  for (const [dx, dy] of [[-0.6, 1.2], [0.6, 1.2], [-0.6, 1.75], [0.6, 1.75]]) addCaixaDepois.push([x + dx, dy, -5.4]);
}

// ---------- Caixas instanciadas ----------
const caixasInst = [];
function addCaixa(x, y, z, w = 1.1, h = 0.8, d = 1.1, cor) {
  caixasInst.push({ x, y: y + h / 2, z, w, h, d, cor: cor ?? (Math.random() < 0.5 ? COR.papelao : COR.papelao2) });
}
function palete(x, z, niveis = 2, pai) {
  caixa(1.3, 0.14, 1.3, COR.madeira, x, 0, z);
  for (let n = 0; n < niveis; n++) for (const dx of [-0.31, 0.31]) for (const dz of [-0.31, 0.31])
    addCaixa(x + dx, 0.14 + n * 0.52, z + dz, 0.58, 0.5, 0.58);
}

addCaixaDepois.forEach(([x, y, z]) => addCaixa(x, y, z, 1, 0.5, 1));
// ---------- Porta-paletes (Armazenagem) ----------
function estante(x, z0, z1, niveis = 4) {
  const prof = 1.5, alt = niveis * 1.25;
  for (let z = z0; z <= z1 + 0.01; z += (z1 - z0) / 4) for (const dx of [-prof / 2, prof / 2]) caixa(0.14, alt + 0.3, 0.14, COR.azul, x + dx, 0, z);
  for (let n = 0; n < niveis; n++) {
    const y = n * 1.25 + 0.12;
    for (const dx of [-prof / 2, prof / 2]) caixa(0.1, 0.14, z1 - z0, COR.laranja, x + dx, y, (z0 + z1) / 2);
    for (let z = z0 + 0.9; z < z1 - 0.3; z += 1.55) {
      if (Math.random() < 0.08) continue;
      const hh = 0.7 + Math.random() * 0.3;
      addCaixa(x, y + 0.14, z, 1.25, hh, 1.3);
    }
  }
}
for (const x of [-15.6, -12.4, -9.2, -6]) estante(x, -13.6, 1.6);
// paletes aguardando no chão
for (const [x, z] of [[-1.5, -5], [-1.5, -3], [0.5, -5], [0.5, -3], [2.5, -5]]) palete(x, z, 3);

// ---------- Doca de entrada / saída: cargas ----------
for (const [x, z] of [[-21, -1.5], [-22.6, 0.6], [-20.8, 1.2], [-27, 1.2], [-27.6, -1]]) palete(x, z, 2);
for (const [x, z] of [[21.5, 1.5], [21.5, -0.5], [23.5, 2.5], [28.3, 0.5]]) palete(x, z, 2);

// ---------- Sinalização de logística ----------
function textoPiso(t, x, z, w, cor = '#f6c21c', rot = 0) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 160; const g = c.getContext('2d');
  g.fillStyle = cor; g.font = '800 96px Arial, Helvetica, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 512, 84, 1000);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.156), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.rotation.z = rot; m.position.set(x, 0.03, z); scene.add(m); return m;
}
textoPiso('STAGING — AGUARDANDO CONFERÊNCIA', -24.2, 3.6, 9.5);
// área de avarias / quarentena (vermelha)
for (const [a, b, c2, d] of [[5.2, -11, 6.6, -11], [5.2, -9.2, 6.6, -9.2], [5.2, -11, 5.2, -9.2], [6.6, -11, 6.6, -9.2]]) linha(a, b, c2, d, 0xd23b2f);
textoPiso('AVARIAS', 5.9, -8.9, 1.6, '#d23b2f');
caixa(0.6, 0.45, 0.6, COR.papelao2, 5.7, 0, -10.3).rotation.y = 0.4; caixa(0.55, 0.4, 0.5, COR.papelao, 6.2, 0, -9.8).rotation.set(0.25, 1, 0.1);
// rota de cross-docking (tracejado azul): doca de entrada -> expedição / doca de saída
function tracejado(x0, z0, x1, z1) { const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.2); for (let i = 0; i < n; i++) { const k = (i + 0.25) / n, k2 = (i + 0.75) / n; linha(x0 + (x1 - x0) * k, z0 + (z1 - z0) * k, x0 + (x1 - x0) * k2 + (x0 === x1 ? 0.14 : 0), z0 + (z1 - z0) * k2 + (z0 === z1 ? 0.14 : 0), 0x2f7fe0).scale.y = 0.03; } }
tracejado(-18, 4.2, -5.6, 4.2); tracejado(-5.6, 4.2, 7.6, 4.2); tracejado(7.6, 4.2, 7.6, -2.9); tracejado(7.6, -2.9, 19.6, -2.9);
textoPiso('CROSS-DOCKING  ➜', -11.5, 4.9, 7, '#2f7fe0');
// identificação das ruas do porta-paletes (endereçamento)
['A', 'B', 'C', 'D'].forEach((r, i) => { const p = placaTexto([{ t: 'RUA ' + r, tam: 300, y: 0.54 }], 1.5, 0.75, { fundo: '#f6c21c', texto: '#12356b' }); p.position.set(-15.6 + i * 3.2, 5.6, 1.75); scene.add(p); const q = p.clone(); q.rotation.y = Math.PI; q.position.z = 1.73; scene.add(q); });

// ---------- Mesas, bancadas e computadores ----------
function mesa(x, z, w = 2.4, d = 1.1, cor = 0xe9e4da, rot = 0) {
  const g = new THREE.Group();
  caixa(w, 0.08, d, cor, 0, 0.82, 0, g);
  for (const sx of [-w / 2 + 0.1, w / 2 - 0.1]) for (const sz of [-d / 2 + 0.1, d / 2 - 0.1]) caixa(0.08, 0.82, 0.08, 0x6d737a, sx, 0, sz, g);
  g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); return g;
}
function computador(x, z, rot = 0) {
  const g = new THREE.Group();
  caixa(0.7, 0.45, 0.05, 0x15181c, 0, 1.05, 0, g); caixa(0.62, 0.37, 0.02, 0x7fc4ff, 0, 1.09, 0.03, g, { emissive: 0x3d8fd6, emissiveIntensity: 0.9 });
  caixa(0.08, 0.16, 0.08, 0x15181c, 0, 0.9, 0, g);
  g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
}
function cadeira(x, z) { caixa(0.5, 0.1, 0.5, 0x22262c, x, 0.45, z); caixa(0.5, 0.55, 0.08, 0x22262c, x, 0.55, z + 0.25); cilindro(0.05, 0.45, 0x444, x, 0, z); }

// Recebimento e conferência
mesa(0, -15.5); computador(0, -15.7); mesa(4, -15.5); computador(4, -15.7);
caixa(2, 2.2, 0.5, COR.azul, -1, 0, -17.3); caixa(2, 2.2, 0.5, 0xdfe3e6, 5.5, 0, -17.3);
for (const [x, z] of [[-1, -12], [1.2, -11.5], [3.4, -12]]) palete(x, z, 2);
addCaixa(-0.5, 0.9, -15.4, 0.45, 0.35, 0.45); addCaixa(4.6, 0.9, -15.4, 0.45, 0.35, 0.45);

// Separação de pedidos: bancadas e prateleiras baixas
for (const z of [-12.5, -9.5, -6.5]) {
  for (const x of [10.6, 14.2]) {
    mesa(x, z, 3, 1.1, 0xdad5c9);
    for (let i = 0; i < 3; i++) if (Math.random() < 0.8) addCaixa(x - 1 + i, 0.9, z + (Math.random() - 0.5) * 0.3, 0.55, 0.42, 0.5);
  }
  computador(17.4, z, -Math.PI / 2); mesa(17.4, z, 1, 0.9, 0xdad5c9);
}
function prateleira(x, z, w, niveis = 3, rot = 0) {
  const g = new THREE.Group();
  for (const sx of [-w / 2, w / 2]) caixa(0.1, niveis * 0.8 + 0.2, 0.7, COR.azul, sx, 0, 0, g);
  for (let n = 0; n <= niveis; n++) caixa(w, 0.06, 0.7, 0xd9dde0, 0, n * 0.8 + 0.1, 0, g);
  g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
  for (let n = 0; n < niveis; n++) for (let i = 0.45; i < w - 0.3; i += 0.75) {
    const px = rot ? x : x - w / 2 + i, pz = rot ? z - w / 2 + i : z;
    if (Math.random() < 0.85) addCaixa(px, n * 0.8 + 0.16, pz, 0.6, 0.5, 0.55);
  }
}
prateleira(13.5, -14.3, 9);

// Expedição
prateleira(11, 7.8, 3.5); prateleira(16, 7.8, 3.5);
for (const [x, z] of [[11, 4], [15.5, 4]]) { mesa(x, z, 3.2, 1.2, 0xc9d3e2); for (let i = 0; i < 3; i++) addCaixa(x - 1 + i, 0.9, z, 0.6, 0.45, 0.6); }
for (const [x, z] of [[10.5, 0.8], [12.6, 0.8], [14.7, 0.8], [16.8, 0.8]]) palete(x, z, 3);

// Administração: sala com divisórias de vidro
const mVidro = { transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.3, color: 0x9fd0ef };
function vidroX(x0, x1, z) { const m = caixa(x1 - x0, 2.7, 0.08, 0x9fd0ef, (x0 + x1) / 2, 0, z, scene, mVidro); m.castShadow = false; caixa(x1 - x0, 0.1, 0.14, 0xe9ecee, (x0 + x1) / 2, 2.7, z); }
function vidroZ(z0, z1, x) { const m = caixa(0.08, 2.7, z1 - z0, 0x9fd0ef, x, 0, (z0 + z1) / 2, scene, mVidro); m.castShadow = false; caixa(0.14, 0.1, z1 - z0, 0xe9ecee, x, 2.7, (z0 + z1) / 2); }
vidroX(-5, -0.2, 5); vidroX(1.6, 7, 5); vidroZ(5, 14, -5); vidroZ(5, 14, 7); vidroZ(5, 10.5, 1);
caixa(11.8, 0.03, 8.8, 0x8fa3b8, 1, 0, 9.5).castShadow = false;
for (const [x, z] of [[-3, 7.5], [-3, 11], [3.2, 7.5], [5.2, 11], [2.8, 11.2]]) { mesa(x, z, 1.7, 0.9, 0xf3efe6); computador(x, z - 0.2); cadeira(x, z + 0.8); }
for (const [x, z] of [[-4.4, 13.2], [6.4, 13.2], [0.3, 5.6]]) { cilindro(0.3, 0.5, 0xe6e6e6, x, 0, z); const p = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), mat(0x3f8a3f)); p.position.set(x, 1.1, z); p.castShadow = true; scene.add(p); }

// Finaliza caixas instanciadas
{
  const im = new THREE.InstancedMesh(geoCaixa, new THREE.MeshStandardMaterial({ roughness: 0.85 }), caixasInst.length);
  const o = new THREE.Object3D(), c = new THREE.Color();
  caixasInst.forEach((b, i) => { o.position.set(b.x, b.y, b.z); o.scale.set(b.w, b.h, b.d); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, c.set(b.cor).offsetHSL(0, 0, (Math.random() - 0.5) * 0.06)); });
  im.castShadow = true; im.receiveShadow = true; scene.add(im);
}

// ---------- Placas suspensas das áreas (como na imagem) ----------
ZONAS.forEach(z => {
  const w = Math.max(5, z.nome.length * 0.36);
  const p = placaTexto([{ t: z.nome.toUpperCase(), tam: Math.min(120, 1500 / z.nome.length), y: 0.52 }], w, 0.9, { fundo: '#12356b', texto: '#ffffff' });
  const g = new THREE.Group(); g.add(p);
  const costas = p.clone(); costas.rotation.y = Math.PI; g.add(costas);
  g.position.set(z.cx, 5.6, z.z0 + 0.8); if (z.id === 'administracao') g.position.set(z.cx, 3.4, z.z0);
  scene.add(g);
});

// ---------- Carros e árvores ----------
function carro(x, z, cor) { const g = new THREE.Group(); caixa(1.8, 0.6, 4.2, cor, 0, 0.35, 0, g, { roughness: 0.3, metalness: 0.4 }); caixa(1.6, 0.55, 2.2, 0x1b2a3a, 0, 0.95, -0.2, g, { roughness: 0.1, metalness: 0.5 }); for (const sx of [-0.9, 0.9]) for (const sz of [-1.3, 1.3]) { const r = cilindro(0.35, 0.25, 0x16181b, sx, 0, sz, g); r.rotation.z = Math.PI / 2; r.position.y = 0.35; } g.position.set(x, 0, z); scene.add(g); }
carro(9.3, 26, 0xf2f2f2); carro(14.5, 26, 0x24272c); carro(27.5, 26, 0xe9e9e9);
function arvore(x, z, s = 1) { cilindro(0.3 * s, 2.4 * s, 0x6b4a2d, x, 0, z); for (const [dy, r] of [[3.2, 2.1], [4.6, 1.6]]) { const c = new THREE.Mesh(new THREE.SphereGeometry(r * s, 10, 8), mat(0x2f6b34, { roughness: 1 })); c.position.set(x + (Math.random() - 0.5), dy * s, z + (Math.random() - 0.5)); c.castShadow = true; scene.add(c); } }

// ---------- Pessoas (com pernas e braços articulados) ----------
function pessoa(corColete = COR.amarelo, capacete = 0xffffff, pai = scene) {
  const g = new THREE.Group(), pernas = [], bracos = [];
  for (const sx of [-0.13, 0.13]) { const p = new THREE.Group(); p.position.set(sx, 0.85, 0); caixa(0.2, 0.8, 0.24, 0x1e2f55, 0, -0.8, 0, p); caixa(0.21, 0.1, 0.32, 0x15181c, 0, -0.88, 0.04, p); g.add(p); pernas.push(p); }
  caixa(0.52, 0.7, 0.3, corColete, 0, 0.85, 0, g);
  if (corColete === COR.amarelo) caixa(0.54, 0.08, 0.32, 0xdfe3e6, 0, 1.15, 0, g); // faixa refletiva
  for (const sx of [-0.33, 0.33]) { const p = new THREE.Group(); p.position.set(sx, 1.5, 0); caixa(0.14, 0.42, 0.16, corColete, 0, -0.42, 0, p); caixa(0.12, 0.26, 0.14, 0xd9a57b, 0, -0.68, 0, p); g.add(p); bracos.push(p); }
  const cab = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), mat(0xd9a57b)); cab.position.y = 1.74; g.add(cab);
  if (capacete !== null) { const cp = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(capacete)); cp.position.y = 1.78; g.add(cp); }
  pai.add(g); return { g, pernas, bracos };
}
function sentar(p) { p.pernas.forEach(l => l.rotation.x = -Math.PI / 2); p.bracos.forEach(b => b.rotation.x = -1.1); }
// [de, para, leva: 'caixa' | 'paleteira' | null]
const andarilhos = [
  [[-24.25, -2.6], [-22.6, 2.4], 'paleteira'], [[-27.5, 3.5], [-27.5, -3], null], [[0, -13.8], [5, -13.8], null], [[2, -9.6], [-1.5, -9.6], 'caixa'],
  [[9.2, -11], [9.2, -6], 'caixa'], [[12.4, -11], [12.4, -8], null], [[15.8, -8], [15.8, -5.4], 'caixa'], [[10, 2.6], [17, 2.6], 'caixa'],
  [[13.2, 6.2], [17.5, 6.2], null], [[22, 3.5], [25, -3.2], 'paleteira'], [[-10.8, 2.6], [-10.8, -12], null], [[-2.2, 3.4], [7.2, 3.4], null],
  [[-7.6, -12], [-7.6, 1], 'caixa'], [[19.4, -13], [9, -13.4], null], [[-19.6, -4], [-3, -16.4], null],
].map(([a, b, leva], i) => {
  const p = pessoa(i % 3 === 2 ? COR.azul : COR.amarelo, i % 4 === 1 ? COR.azul : 0xffffff);
  if (leva === 'caixa') caixa(0.45, 0.35, 0.4, COR.papelao, 0, 0.95, 0.42, p.g);
  if (leva === 'paleteira') { caixa(0.06, 0.9, 0.06, 0xd23b2f, 0, 0.25, 0.55, p.g).rotation.x = 0.5; caixa(0.9, 0.12, 1.3, 0xd23b2f, 0, 0.05, 1.5, p.g); caixa(1.1, 0.12, 1.2, COR.madeira, 0, 0.17, 1.55, p.g); caixa(1, 0.8, 1.05, COR.papelao2, 0, 0.29, 1.55, p.g); }
  return { ...p, leva, a: new THREE.Vector3(a[0], 0, a[1]), b: new THREE.Vector3(b[0], 0, b[1]), fase: Math.random() * 10, vel: 0.9 + Math.random() * 0.5 };
});
// equipe sentada na administração
for (const [x, z] of [[-3, 8.3], [3.2, 8.3], [5.2, 11.8]]) { const p = pessoa(COR.azul, null); p.g.position.set(x, -0.35, z); p.g.rotation.y = Math.PI; sentar(p); }

// ---------- Segurança: extintores e faixas de pedestre ----------
function extintor(x, z, rot = 0) {
  const g = new THREE.Group();
  cilindro(0.13, 0.55, 0xd2231f, 0, 0.75, 0.16, g); cilindro(0.05, 0.14, 0x15181c, 0, 1.3, 0.16, g);
  const pl = placaTexto([{ t: 'EXTINTOR', tam: 190, y: 0.3 }, { t: '▼', tam: 330, y: 0.72 }], 0.6, 0.6, { fundo: '#d2231f', texto: '#ffffff' }); pl.position.set(0, 2.1, 0.03); g.add(pl);
  for (const [a, b, c, d] of [[-0.5, 0.05, 0.5, 0.05], [-0.5, 1, 0.5, 1], [-0.5, 0.05, -0.5, 1], [0.5, 0.05, 0.5, 1]]) { const w = Math.abs(c - a) || 0.1, dd = Math.abs(d - b) || 0.1; const m = caixa(w, 0.02, dd, 0xd2231f, (a + c) / 2, 0.001, (b + d) / 2, g); m.castShadow = false; }
  g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
}
[[-12, -17.8, 0], [2, -17.8, 0], [13.5, -17.8, 0]].forEach(p => extintor(...p));
[[-29.8, -4, Math.PI / 2], [-29.8, 9, Math.PI / 2]].forEach(p => extintor(...p));
[[29.8, -4, -Math.PI / 2], [29.8, 9, -Math.PI / 2]].forEach(p => extintor(...p));
[[-12, 13.8, Math.PI], [14, 13.8, Math.PI], [-18, -12, Math.PI / 2], [19.6, -12, -Math.PI / 2]].forEach(p => extintor(...p));
// faixa de pedestres verde, com zebra onde cruza a rota das empilhadeiras
function faixaPedestre(x0, z0, x1, z1) {
  const horiz = z0 === z1, comp = horiz ? x1 - x0 : z1 - z0;
  const m = caixa(horiz ? comp : 1, 0.015, horiz ? 1 : comp, 0x2e9b57, (x0 + x1) / 2, 0.001, (z0 + z1) / 2); m.castShadow = false;
  for (const o of [-0.5, 0.5]) { const b = caixa(horiz ? comp : 0.08, 0.02, horiz ? 0.08 : comp, 0xffffff, (x0 + x1) / 2 + (horiz ? 0 : o), 0.001, (z0 + z1) / 2 + (horiz ? o : 0)); b.castShadow = false; }
}
function zebra(x0, z0, x1, z1) { const horiz = z0 === z1, n = Math.round(Math.abs(horiz ? x1 - x0 : z1 - z0) / 0.7); for (let i = 0; i < n; i++) { const k = (i + 0.5) / n; const m = caixa(horiz ? 0.35 : 1.3, 0.022, horiz ? 1.3 : 0.35, 0xffffff, x0 + (x1 - x0) * k, 0.001, z0 + (z1 - z0) * k); m.castShadow = false; } }
faixaPedestre(-29, 13, -5.6, 13); faixaPedestre(7.6, 13, 29, 13);       // junto à fachada interna
faixaPedestre(-18.9, 5.6, -18.9, 12.5); zebra(-18.9, 2.6, -18.9, 5.6);
faixaPedestre(7.5, -17.4, 7.5, -4.4); zebra(7.5, -4.4, 7.5, -1.2); faixaPedestre(8.1, -1.2, 8.1, 12.5);
textoPiso('PEDESTRES', -24, 13, 3.2, '#ffffff'); textoPiso('PEDESTRES', 24, 13, 3.2, '#ffffff');

// ---------- Entorno real: Rua Rui Barbosa, Praça Mané Garrincha, Estádio (base: OpenStreetMap) ----------
function plano(w, d, cor, x, z, y = -0.06, h = 0.04) { const m = caixa(w, h, d, cor, x, y, z, scene, { roughness: 1 }); m.castShadow = false; return m; }
const ASF = 0x3b4047, CALC = 0xc9c5bd, GRAMA = 0x6f9a55;
function rua(x0, z0, x1, z1, larg = 9, cor = ASF) {
  const h = z0 === z1; plano(h ? x1 - x0 : larg + 5, h ? larg + 5 : z1 - z0, CALC, (x0 + x1) / 2, (z0 + z1) / 2, -0.07);
  plano(h ? x1 - x0 : larg, h ? larg : z1 - z0, cor, (x0 + x1) / 2, (z0 + z1) / 2);
  const n = Math.floor((h ? x1 - x0 : z1 - z0) / 8);
  for (let i = 0; i < n; i++) { const k = (i + 0.5) / n; const m = caixa(h ? 3 : 0.2, 0.01, h ? 0.2 : 3, 0xffffff, x0 + (x1 - x0) * k, -0.02, z0 + (z1 - z0) * k); m.castShadow = false; }
}
plano(107, 147, CALC, 0, -38, -0.07);                    // quadra do Senac / praça
rua(-320, 40, 330, 40);                                   // Rua Rui Barbosa
rua(58, -330, 58, 300);                                   // Rua Coriolano Milhomem
rua(-58, -111, -58, 35.5, 7);                             // rua lateral da praça
rua(-320, -116, 330, -116);                               // Rua Gonçalves Dias
rua(-100, -330, -100, 300, 13);                           // Rua Simplício Moreira
rua(-320, 95, 330, 95, 8); rua(-320, -200, 330, -200, 8); rua(225, -330, 225, 300, 8); rua(-190, -330, -190, 300, 8);
plano(84, 7, ASF, 11.5, -40, -0.1, 0.1);                  // via de serviço das docas
// Praça Mané Garrincha
plano(100, 62, GRAMA, 0, -77, -0.03, 0.03); plano(16, 60, GRAMA, -42, -13, -0.03, 0.03); plano(14, 46, GRAMA, 43, -13, -0.03, 0.03);
plano(100, 3, 0xd8cfb8, 0, -77, -0.02, 0.03); plano(3, 62, 0xd8cfb8, -2, -77, -0.02, 0.03);
function quadraEsportiva(x, z, w, d, cor) { plano(w, d, cor, x, z, -0.01, 0.03); const l = (a, b, c, e) => { const m = caixa(Math.abs(c - a) || 0.15, 0.01, Math.abs(e - b) || 0.15, 0xffffff, (a + c) / 2, 0.02, (b + e) / 2); m.castShadow = false; };
  l(x - w / 2 + 1, z - d / 2 + 1, x + w / 2 - 1, z - d / 2 + 1); l(x - w / 2 + 1, z + d / 2 - 1, x + w / 2 - 1, z + d / 2 - 1); l(x - w / 2 + 1, z - d / 2 + 1, x - w / 2 + 1, z + d / 2 - 1); l(x + w / 2 - 1, z - d / 2 + 1, x + w / 2 - 1, z + d / 2 - 1); l(x - w / 2 + 1, z, x + w / 2 - 1, z); }
quadraEsportiva(-28, -92, 20, 28, 0x3f9d8f); quadraEsportiva(-28, -60, 20, 26, 0x3f9d8f); quadraEsportiva(24, -62, 16, 16, 0x4a86b8); quadraEsportiva(26, -93, 22, 24, 0xc7a36a);
for (const [x, z] of [[-8, -75], [4, -75], [-8, -79], [4, -79], [-40, -77], [40, -77]]) { caixa(2, 0.12, 0.6, 0x8a623a, x, 0.4, z); caixa(0.15, 0.4, 0.5, 0x555, x - 0.8, 0, z); caixa(0.15, 0.4, 0.5, 0x555, x + 0.8, 0, z); }
for (const [x, z] of [[-2, -52], [-2, -102], [-46, -77], [46, -77], [12, -77], [-14, -77]]) { cilindro(0.1, 5, 0x444a52, x, 0, z); const l = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), mat(0xfff3c4, { emissive: 0xffe9a0, emissiveIntensity: 0.6 })); l.position.set(x, 5.2, z); scene.add(l); }
{ let sem = 7; const rnd = () => (sem = (sem * 16807) % 2147483647) / 2147483647;
  const livre = (x, z) => !(Math.abs(x + 28) < 12 && z < -45 && z > -108) && !(x > 13 && x < 39 && z < -52 && z > -107) && Math.abs(z + 77) > 3 && Math.abs(x + 2) > 3;
  for (let i = 0; i < 46; i++) { const x = -48 + rnd() * 96, z = -106 + rnd() * 58; if (livre(x, z)) arvore(x, z, 0.9 + rnd() * 0.6); }
  for (let i = 0; i < 9; i++) { arvore(-42 + (rnd() - 0.5) * 10, -40 + i * 6.5, 0.9 + rnd() * 0.5); if (i < 7) arvore(43 + (rnd() - 0.5) * 8, -33 + i * 6.5, 0.9 + rnd() * 0.5); }
  for (let i = 0; i < 9; i++) { arvore(-46 + i * 11.5, 34.2, 0.7); }
  // Estádio Frei Epifânio d'Abadia
  const ex = 142, ez = -34;
  plano(150, 112, 0x9aa0a6, ex, ez, -0.05); plano(105, 68, 0x3f9a4a, ex, ez, 0, 0.05); plano(113, 76, 0xb8704a, ex, ez, -0.02, 0.04);
  for (const [a, b, c, e] of [[-52.5, -34, 52.5, -34], [-52.5, 34, 52.5, 34], [-52.5, -34, -52.5, 34], [52.5, -34, 52.5, 34], [0, -34, 0, 34]]) { const m = caixa(Math.abs(c - a) || 0.3, 0.01, Math.abs(e - b) || 0.3, 0xffffff, ex + (a + c) / 2, 0.05, ez + (b + e) / 2); m.castShadow = false; }
  for (let d = 0; d < 5; d++) { const o = 41 + d * 2.6, h = 1.2 + d * 1.5; caixa(118, h, 2.6, 0xc9ccd0, ex, 0, ez - o); caixa(118, h, 2.6, 0xc9ccd0, ex, 0, ez + o); caixa(2.6, h, 78, 0xc9ccd0, ex - 59.5 - d * 2.6, 0, ez); caixa(2.6, h, 78, 0xc9ccd0, ex + 59.5 + d * 2.6, 0, ez); }
  caixa(118, 0.5, 14, 0x3b6fb3, ex, 9.5, ez + 49); for (let i = -5; i <= 5; i++) caixa(0.5, 9.5, 0.5, 0xe6e8ea, ex + i * 11, 0, ez + 55);
  // prédios vizinhos conhecidos
  const predio = (x, z, w, d, h, cor, telhado = 0xb5562f) => { caixa(w, h, d, cor, x, 0, z); caixa(w + 0.8, 0.5, d + 0.8, telhado, x, h, z); };
  predio(28, 68, 44, 30, 9, 0xe9e4d8, 0x8f9499);      // Receita Federal
  predio(-38, 70, 40, 34, 11, 0xdcd6c6, 0x8f9499);    // Fórum
  predio(-80, -62, 22, 34, 6, 0xe7dfcf);              // Prato Cidadão
  for (let i = 0; i < 4; i++) predio(-30 + i * 4, -140 - i * 14, 96, 9, 6, 0xe9e2d2); // Centro de Ensino Dorgival Pinheiro de Sousa
  plano(22, 40, GRAMA, -80, 68, -0.03, 0.03); for (let i = 0; i < 6; i++) arvore(-86 + rnd() * 14, 54 + i * 5.5, 1);
  // casario do Centro (telhados de barro)
  const casas = [];
  const quadraCasas = (x0, x1, z0, z1) => { for (let z = z0 + 5; z < z1 - 4; z += 11) for (let x = x0 + 5; x < x1 - 4;) { const w = 7 + rnd() * 6; if (rnd() < 0.93) casas.push([x + w / 2, z + (rnd() - 0.5), w - 0.8, 8.5 + rnd() * 1.5, 3 + rnd() * 2.5]); x += w; } };
  [[66, 220, 48, 90], [-93, -66, 48, 90], [-93, 220, 100, 190], [66, 220, 100, 190], [-93, -66, -108, -5], [66, 220, -195, -124], [-93, 52, -195, -180], [-185, -108, -195, 190], [230, 300, -195, 190], [-93, 220, -290, -205], [-300, -195, -195, 190], [-185, -108, -290, -205]]
    .forEach(q => { if (q[0] === -93 && q[2] === -108) { quadraCasas(-93, -66, -40, 34); quadraCasas(-93, -66, -108, -84); } else if (q[0] === -93 && q[1] === 220 && q[2] === 100) { quadraCasas(-93, 52, 100, 190); } else quadraCasas(...q); });
  const paredes = new THREE.InstancedMesh(geoCaixa, new THREE.MeshStandardMaterial({ roughness: 0.9 }), casas.length), telhas = new THREE.InstancedMesh(geoCaixa, new THREE.MeshStandardMaterial({ roughness: 0.9 }), casas.length);
  const o = new THREE.Object3D(), c = new THREE.Color(), tons = [0xf1e9da, 0xe6dcc8, 0xd9e2e6, 0xf2d9c4, 0xe3e8d6];
  casas.forEach(([x, z, w, d, h], i) => { o.position.set(x, h / 2, z); o.scale.set(w, h, d); o.updateMatrix(); paredes.setMatrixAt(i, o.matrix); paredes.setColorAt(i, c.set(tons[i % 5]));
    o.position.set(x, h + 0.25, z); o.scale.set(w + 0.6, 0.5, d + 0.6); o.updateMatrix(); telhas.setMatrixAt(i, o.matrix); telhas.setColorAt(i, c.set(rnd() < 0.85 ? 0xb5562f : 0xd9dcdf).offsetHSL(0, 0, (rnd() - 0.5) * 0.08)); });
  scene.add(paredes, telhas);
}
// nomes das ruas e dos pontos de referência
[['RUA RUI BARBOSA', 0, 40, 0], ['RUA RUI BARBOSA', 140, 40, 0], ['RUA CORIOLANO MILHOMEM', 58, -20, Math.PI / 2], ['RUA GONÇALVES DIAS', 0, -116, 0], ['RUA SIMPLÍCIO MOREIRA', -100, -30, Math.PI / 2]]
  .forEach(([t, x, z, r]) => textoPiso(t, x, z, 30, '#ffffff', r));
function marco(t, x, y, z, esc = 26) { const c = document.createElement('canvas'); c.width = 1024; c.height = 128; const g = c.getContext('2d'); g.fillStyle = 'rgba(15,27,45,.88)'; g.beginPath(); g.roundRect(4, 4, 1016, 120, 60); g.fill(); g.fillStyle = '#fff'; g.font = '700 64px Arial, Helvetica, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 512, 68, 980);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, depthTest: false, fog: false })); sp.scale.set(esc, esc / 8, 1); sp.position.set(x, y, z); sp.renderOrder = 5; scene.add(sp); return sp; }
const marcos = [marco('Praça Mané Garrincha', 0, 12, -77), marco('Estádio Frei Epifânio d\'Abadia', 142, 22, -34, 34), marco('Receita Federal', 28, 15, 68, 20), marco('Fórum Henrique de La Rocque', -38, 17, 70), marco('Prato Cidadão', -80, 11, -62, 18), marco('C. E. Dorgival Pinheiro de Sousa', -24, 13, -160, 34)];
// pedestres passando ao redor
const ROUPAS = [0xc0392b, 0x2e86c1, 0x27ae60, 0x8e44ad, 0xe67e22, 0xf4f4f4, 0x34495e, 0xe84393];
[[[-50, 34.4], [50, 34.4]], [[45, 34.4], [-45, 34.4]], [[52.2, 30], [52.2, -105]], [[52.2, -90], [52.2, 20]], [[-52.5, -100], [-52.5, 30]], [[-48, -77], [48, -77]], [[30, -77], [-40, -77]],
 [[-2, -106], [-2, -48]], [[-2, -50], [-2, -100]], [[-45, 46.2], [50, 46.2]], [[63.8, 30], [63.8, -100]], [[-36, 20], [-36, -40]], [[-12, 20.5], [14, 20.5]], [[-45, -109.5], [45, -109.5]]]
  .forEach(([a, b], i) => { const p = pessoa(ROUPAS[i % 8], null); andarilhos.push({ ...p, leva: null, civil: true, a: new THREE.Vector3(a[0], 0, a[1]), b: new THREE.Vector3(b[0], 0, b[1]), fase: i * 7.3, vel: 1.1 + (i % 4) * 0.15 }); });
// carros circulando
const transito = [[-1, 0, 38, 0xd23b2f, 9], [-1, 0, 42, 0xf2f2f2, 12], [-1, 0, 38, 0x2e86c1, 10, 150], [0, -1, 56, 0x24272c, 10], [0, -1, 60, 0xf6c21c, 8, 120], [0, 1, -103, 0xc0c4c8, 11], [0, 1, -97, 0x27ae60, 9, 200], [1, 0, -118, 0xf2f2f2, 10]]
  .map(([dx, dz, fixo, cor, vel, ini = 0]) => { const g = new THREE.Group(); scene.add(g); const antes = scene.children.length; carro(0, 0, cor); const c = scene.children.pop(); g.add(c); g.rotation.y = Math.atan2(dx, dz); return { g, dx, dz, fixo, vel, p: ini }; });

// ---------- Empilhadeiras ----------
function empilhadeira() {
  const g = new THREE.Group();
  caixa(1.1, 0.7, 1.8, COR.amarelo, 0, 0.3, -0.2, g); caixa(1.1, 0.5, 0.5, 0x2b2f35, 0, 0.3, -1.2, g);
  for (const sx of [-0.5, 0.5]) for (const sz of [-0.85, 0.45]) caixa(0.07, 1.3, 0.07, 0x2b2f35, sx, 1, sz, g);
  caixa(1.15, 0.07, 1.45, 0x2b2f35, 0, 2.3, -0.2, g);
  for (const sx of [-0.35, 0.35]) caixa(0.1, 2.6, 0.1, 0x3a3f46, sx, 0.2, 0.8, g);
  const garfo = new THREE.Group();
  for (const sx of [-0.3, 0.3]) caixa(0.12, 0.06, 1.1, 0x3a3f46, sx, 0, 0.5, garfo);
  caixa(1.2, 0.12, 1.2, COR.madeira, 0, 0.06, 0.7, garfo); caixa(1.1, 0.8, 1.1, COR.papelao, 0, 0.18, 0.7, garfo);
  garfo.position.set(0, 0.35, 0.85); g.add(garfo);
  for (const sx of [-0.55, 0.55]) for (const sz of [-0.8, 0.5]) { const r = cilindro(0.28, 0.2, 0x16181b, sx, 0, sz, g); r.rotation.z = Math.PI / 2; r.position.y = 0.28; }
  caixa(0.5, 0.12, 0.5, 0x15181c, 0, 1, -0.35, g);
  const op = pessoa(COR.amarelo, 0xffffff, g); op.g.position.set(0, 0.25, -0.4); op.g.scale.setScalar(0.85); sentar(op);
  const luz = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshStandardMaterial({ color: 0xff8a00, emissive: 0xff6a00 })); luz.position.set(0, 2.45, -0.2); g.add(luz);
  scene.add(g); return { g, garfo, luz };
}
function rota(pontos) {
  const pts = pontos.map(p => new THREE.Vector3(p[0], 0, p[1])); const seg = []; let total = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], d = a.distanceTo(b); seg.push({ a, b, d, ini: total }); total += d; }
  return { seg, total };
}
const empilhadeiras = [
  { ...empilhadeira(), rota: rota([[-21, 2.6], [-14, 3.6], [-14, -12.5], [-10.8, -12.5]].concat([[-10.8, 3.6]])), vel: 3.2, t: 0 },
  { ...empilhadeira(), rota: rota([[-1, 3.6], [8, -2.6], [19.5, -2.6], [22.6, 2.2], [19.5, -3.4], [8, -3.4], [1.5, -1.5]]), vel: 3.6, t: 12 },
  { ...empilhadeira(), rota: rota([[-19.5, 1.2], [-4, 4.2], [-2.8, -7.4], [-2.8, 3.2]]), vel: 2.8, t: 30 },
];
const tmpDir = new THREE.Vector3();
function moverNaRota(e, dt) {
  e.t = (e.t + e.vel * dt) % e.rota.total;
  const s = e.rota.seg.find(s => e.t >= s.ini && e.t < s.ini + s.d) || e.rota.seg[0];
  e.g.position.lerpVectors(s.a, s.b, (e.t - s.ini) / s.d);
  tmpDir.subVectors(s.b, s.a);
  const alvo = Math.atan2(tmpDir.x, tmpDir.z);
  let dif = alvo - e.g.rotation.y; dif = Math.atan2(Math.sin(dif), Math.cos(dif));
  e.g.rotation.y += dif * Math.min(1, dt * 6);
}

// ---------- Destaque de zona e carga do tour ----------
const destaque = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xf7941d, transparent: true, opacity: 0.0, depthWrite: false }));
destaque.rotation.x = -Math.PI / 2; destaque.position.y = 0.04; scene.add(destaque);
const carga = new THREE.Group();
caixa(1.1, 1.1, 1.1, 0xf7941d, 0, 0, 0, carga, { emissive: 0xf7941d, emissiveIntensity: 0.7 });
const seta = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.1, 4), mat(0xf7941d, { emissive: 0xf7941d, emissiveIntensity: 0.8 })); seta.rotation.x = Math.PI; seta.position.y = 3; carga.add(seta);
carga.visible = false; scene.add(carga);

// zonas clicáveis (invisíveis)
const alvos = ZONAS.map(z => { const m = new THREE.Mesh(new THREE.BoxGeometry(z.x1 - z.x0, 4, z.z1 - z.z0), new THREE.MeshBasicMaterial({ visible: false })); m.position.set(z.cx, 2, z.cz); m.userData.zona = z; scene.add(m); return m; });

// ---------- Interface ----------
const $ = id => document.getElementById(id);
const elRotulos = $('rotulos'), elLista = $('lista'), elPainel = $('painel');
ZONAS.forEach(z => {
  const r = document.createElement('button'); r.className = 'rotulo'; r.textContent = z.nome; r.onclick = () => selecionar(z.id); elRotulos.appendChild(r); z.rotulo = r;
  const b = document.createElement('button'); b.className = 'chip'; b.innerHTML = (z.etapa ? `<i>${z.etapa}</i>` : '<i>★</i>') + z.nome; b.onclick = () => selecionar(z.id); elLista.appendChild(b); z.chip = b;
});

let voo = null, selecionada = null, tour = null;
function voar(pos, alvo, dur = 1.3) { voo = { p0: camera.position.clone(), a0: controls.target.clone(), p1: pos.clone(), a1: alvo.clone(), t: 0, dur }; }
function selecionar(id, doTour = false) {
  if (andar) sairAndar();
  if (!doTour && tour) pararTour();
  const z = zonaPorId[id]; selecionada = z;
  const d = 13 + z.tam * 0.95;
  voar(new THREE.Vector3(z.cx + d * 0.25, d * 0.8, z.cz + d * 0.85), new THREE.Vector3(z.cx, 1, z.cz));
  destaque.scale.set(z.x1 - z.x0 - 1, z.z1 - z.z0 - 1.1, 1); destaque.position.set(z.cx, 0.04, z.cz + 0.05);
  ZONAS.forEach(o => { o.chip.classList.toggle('ativo', o === z); o.rotulo.classList.toggle('ativo', o === z); });
  $('p-etapa').textContent = z.etapa ? `Etapa ${z.etapa} de 6 do fluxo` : 'Área de apoio';
  $('p-titulo').textContent = z.nome; $('p-resumo').textContent = z.resumo; $('p-texto').textContent = z.texto; $('p-conceitos').innerHTML = z.conceitos.map(c => { const i = c.indexOf(':'); return '<li>' + (i > 0 ? '<b>' + c.slice(0, i) + '</b>' + c.slice(i) : c) + '</li>'; }).join(''); elPainel.scrollTop = 0;
  elPainel.classList.add('aberto'); $('dica').classList.add('oculta');
}
function visaoGeral() {
  if (andar) sairAndar();
  if (tour) pararTour(); selecionada = null; voar(VISAO_GERAL.pos, VISAO_GERAL.alvo);
  ZONAS.forEach(o => { o.chip.classList.remove('ativo'); o.rotulo.classList.remove('ativo'); }); elPainel.classList.remove('aberto');
}
const DUR_ETAPA = 8;
function irEtapa(i) {
  const de = tour.i >= 0 ? zonaPorId[FLUXO[tour.i]] : null;
  tour.i = i; tour.t = 0; const z = zonaPorId[FLUXO[i]];
  tour.de = de ? new THREE.Vector3(de.cx, 0.2, de.cz) : new THREE.Vector3(z.cx, 0.2, z.z0 - 8);
  tour.para = new THREE.Vector3(z.cx, 0.2, z.cz);
  selecionar(z.id, true);
}
function iniciarTour() { if (andar) sairAndar(); tour = { i: -1, t: 0 }; carga.visible = true; document.body.classList.add('em-tour'); $('btn-tour').textContent = '■ Parar tour'; irEtapa(0); }
function pararTour() { tour = null; carga.visible = false; document.body.classList.remove('em-tour'); $('btn-tour').textContent = '▶ Tour do fluxo'; $('barra').style.width = '0'; }
$('btn-tour').onclick = () => tour ? pararTour() : iniciarTour();
$('btn-geral').onclick = visaoGeral;
$('btn-entorno').onclick = () => { visaoGeral(); voar(new THREE.Vector3(30, 190, 215), new THREE.Vector3(30, 0, -30), 1.8); };
$('p-fechar').onclick = visaoGeral;
$('t-ant').onclick = () => tour && irEtapa((tour.i + FLUXO.length - 1) % FLUXO.length);
$('t-prox').onclick = () => tour && irEtapa((tour.i + 1) % FLUXO.length);
controls.addEventListener('start', () => { voo = null; $('dica').classList.add('oculta'); });

// ---------- Teto de galpão (estrutura aparente, só no modo andar) ----------
const teto = new THREE.Group(); teto.visible = false; scene.add(teto);
{
  const aco = mat(0x4a5058, { roughness: 0.6, metalness: 0.5 }), telha = new THREE.MeshStandardMaterial({ color: 0xaeb5bb, roughness: 0.55, metalness: 0.4, side: THREE.DoubleSide });
  const Z0 = -18, Z1 = 14, ZC = -2, YB = 6.3, YC = 9.3, yTopo = z => YB + (YC - YB) * (1 - Math.abs(z - ZC) / 16);
  const A = new THREE.Vector3(), B = new THREE.Vector3();
  function barra(x0, y0, z0, x1, y1, z1, esp = 0.14, m = aco) { A.set(x0, y0, z0); B.set(x1, y1, z1); const b = new THREE.Mesh(geoCaixa, m); b.scale.set(esp, esp, A.distanceTo(B)); b.position.copy(A).add(B).multiplyScalar(0.5); b.lookAt(B); teto.add(b); return b; }
  for (let x = -30; x <= 30; x += 6) {                      // tesouras metálicas
    barra(x, YB, Z0, x, YB, Z1, 0.2); barra(x, YB, Z0, x, YC, ZC, 0.2); barra(x, YC, ZC, x, YB, Z1, 0.2);
    for (let z = Z0 + 4; z < Z1; z += 4) { barra(x, YB, z, x, yTopo(z), z, 0.1); const zn = z < ZC ? z - 4 : z + 4; if (z !== ZC) barra(x, yTopo(z), z, x, YB, zn, 0.09); }
    barra(x, 0, Z0 + 0.35, x, YB, Z0 + 0.35, 0.28); barra(x, 0, Z1 - 0.35, x, YB, Z1 - 0.35, 0.28);   // pilares
  }
  for (let z = Z0; z <= Z1; z += 2) barra(-30, yTopo(z) + 0.14, z, 30, yTopo(z) + 0.14, z, 0.1);        // terças
  for (let x = -27; x < 30; x += 12) for (const [za, zb] of [[Z0, ZC], [ZC, Z1]]) { barra(x - 3, yTopo(za) + 0.1, za, x + 3, yTopo(zb) + 0.1, zb, 0.05); barra(x + 3, yTopo(za) + 0.1, za, x - 3, yTopo(zb) + 0.1, zb, 0.05); } // contraventamento
  const comp = Math.hypot(16, YC - YB), inc = Math.atan2(YC - YB, 16);
  for (const [zc, r] of [[(Z0 + ZC) / 2, -inc], [(ZC + Z1) / 2, inc]]) {                                   // telhas metálicas + telhas translúcidas
    const p = new THREE.Mesh(new THREE.PlaneGeometry(60.6, comp + 0.3), telha); p.rotation.x = Math.PI / 2 + r; p.position.set(0, (YB + YC) / 2 + 0.25, zc); teto.add(p);
    for (let x = -24; x <= 24; x += 12) { const c = new THREE.Mesh(new THREE.PlaneGeometry(1.6, comp * 0.7), new THREE.MeshBasicMaterial({ color: 0xf4fbff, side: THREE.DoubleSide })); c.rotation.x = Math.PI / 2 + r; c.position.set(x, (YB + YC) / 2 + 0.2, zc); teto.add(c); }
    for (let x = -30; x <= 30; x += 0.75) { const n = new THREE.Mesh(geoCaixa, mat(0x8d949b, { roughness: 0.6, metalness: 0.4 })); n.scale.set(0.06, 0.05, comp); n.rotation.x = r; n.position.set(x, (YB + YC) / 2 + 0.21, zc); teto.add(n); } // ondulação da telha
  }
  // fechamento lateral em telha e oitões
  const fech = mat(0xc2c7cc, { roughness: 0.6, metalness: 0.3 });
  for (const [w, d, x, z] of [[60.8, 0.15, 0, Z0], [60.8, 0.15, 0, Z1], [0.15, 32, -30, -2], [0.15, 32, 30, -2]]) { const b = new THREE.Mesh(geoCaixa, fech); b.scale.set(w, 1.2, d); b.position.set(x, 5.75, z); teto.add(b); }
  const tri = new THREE.Shape(); tri.moveTo(Z0, YB); tri.lineTo(Z1, YB); tri.lineTo(ZC, YC + 0.3); tri.closePath();
  for (const x of [-30, 30]) { const o = new THREE.Mesh(new THREE.ShapeGeometry(tri), new THREE.MeshStandardMaterial({ color: 0xc2c7cc, roughness: 0.6, metalness: 0.3, side: THREE.DoubleSide })); o.rotation.y = -Math.PI / 2; o.position.x = x; teto.add(o); }
  // instalações aparentes: eletrocalha, tubulação de incêndio (vermelha) e duto
  barra(-30, 6.05, -5.5, 30, 6.05, -5.5, 0.3, mat(0x9aa0a6, { metalness: 0.5, roughness: 0.5 })); barra(-30, 6.05, 9, 30, 6.05, 9, 0.3, mat(0x9aa0a6, { metalness: 0.5, roughness: 0.5 }));
  for (const z of [-12, 3]) { const t = new THREE.Mesh(geoCil, mat(0xd2231f)); t.scale.set(0.16, 60, 0.16); t.rotation.z = Math.PI / 2; t.position.set(0, 6.0, z); teto.add(t); for (let x = -27; x <= 27; x += 6) barra(x, 6.0, z, x, 5.8, z, 0.05, mat(0xd2231f)); }
  { const d = new THREE.Mesh(geoCil, mat(0xb9c0c6, { metalness: 0.6, roughness: 0.4 })); d.scale.set(0.7, 44, 0.7); d.rotation.z = Math.PI / 2; d.position.set(4, 6.9, -9); teto.add(d); }
  // luminárias industriais pendentes
  const lum = new THREE.MeshBasicMaterial({ color: 0xfff6d8 });
  for (let x = -24; x <= 24; x += 12) for (const z of [-12, -2, 8]) { barra(x, yTopo(z), z, x, 5.9, z, 0.03); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.45, 0.35, 12), mat(0x30353b, { metalness: 0.6 })); c.position.set(x, 5.85, z); teto.add(c); const l = new THREE.Mesh(new THREE.CircleGeometry(0.42, 12), lum); l.rotation.x = Math.PI / 2; l.position.set(x, 5.67, z); teto.add(l); }
}

// ---------- Modo andar (primeira pessoa) ----------
let andar = null; const teclas = new Set();
const OBST = [[-16.55, -14.65], [-13.35, -11.45], [-10.15, -8.25], [-6.95, -5.05]].map(([a, b]) => [a, b, -13.9, 1.9]).concat([[-25.8, -22.7, -16.6, -4.5], [23.4, 26.6, -16.6, -4.5]]);
function livreEm(x, z) { const r = 0.35; if (x < -29.4 || x > 29.4 || z < -17.4 || z > 13.5) return false; return !OBST.some(([x0, x1, z0, z1]) => x > x0 - r && x < x1 + r && z > z0 - r && z < z1 + r); }
function entrarAndar() {
  if (tour) pararTour(); voo = null; selecionada = null; elPainel.classList.remove('aberto');
  ZONAS.forEach(o => { o.chip.classList.remove('ativo'); o.rotulo.classList.remove('ativo'); });
  andar = { x: 0, z: 3.6, yaw: 0, pitch: -0.05, olhar: null, joy: null, mv: { x: 0, y: 0 } };
  teto.visible = true; controls.enabled = false; camera.rotation.order = 'YXZ'; document.body.classList.add('andando'); $('btn-andar').textContent = '✕ Sair'; $('dica').classList.add('oculta'); ajustar();
}
function sairAndar() {
  andar = null; teto.visible = false; controls.enabled = true; camera.rotation.order = 'XYZ'; document.body.classList.remove('andando'); $('btn-andar').textContent = '🚶 Andar'; $('joy').style.display = 'none'; ajustar();
  camera.position.copy(VISAO_GERAL.pos); controls.target.copy(VISAO_GERAL.alvo);
}
$('btn-andar').onclick = () => andar ? (sairAndar()) : entrarAndar();
window.addEventListener('keydown', e => { teclas.add(e.key.toLowerCase()); if (andar && e.key.startsWith('Arrow')) e.preventDefault(); });
window.addEventListener('keyup', e => teclas.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => teclas.clear());
canvas.addEventListener('pointerdown', e => { if (!andar) return; canvas.setPointerCapture(e.pointerId);
  if (e.pointerType === 'touch' && e.clientX < window.innerWidth / 2 && !andar.joy) { andar.joy = { id: e.pointerId, x: e.clientX, y: e.clientY }; const j = $('joy'); j.style.display = 'block'; j.style.left = e.clientX + 'px'; j.style.top = e.clientY + 'px'; $('joy-p').style.transform = 'translate(-50%,-50%)'; }
  else if (!andar.olhar) andar.olhar = { id: e.pointerId, x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointermove', e => { if (!andar) return;
  if (andar.joy && e.pointerId === andar.joy.id) { let dx = (e.clientX - andar.joy.x) / 50, dy = (e.clientY - andar.joy.y) / 50; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } andar.mv = { x: dx, y: dy }; $('joy-p').style.transform = `translate(-50%,-50%) translate(${dx * 40}px,${dy * 40}px)`; }
  else if (andar.olhar && e.pointerId === andar.olhar.id) { andar.yaw -= (e.clientX - andar.olhar.x) * 0.005; andar.pitch = Math.max(-1.2, Math.min(1.2, andar.pitch - (e.clientY - andar.olhar.y) * 0.004)); andar.olhar.x = e.clientX; andar.olhar.y = e.clientY; } });
const soltar = e => { if (!andar) return; if (andar.joy && e.pointerId === andar.joy.id) { andar.joy = null; andar.mv = { x: 0, y: 0 }; $('joy').style.display = 'none'; } if (andar.olhar && e.pointerId === andar.olhar.id) andar.olhar = null; };
canvas.addEventListener('pointerup', soltar); canvas.addEventListener('pointercancel', soltar);
function atualizarAndar(dt, T) {
  const t = k => teclas.has(k) ? 1 : 0;
  let fr = t('w') + t('arrowup') - t('s') - t('arrowdown') - andar.mv.y, la = t('d') - t('a') + andar.mv.x;
  andar.yaw += (t('arrowleft') + t('q') - t('arrowright') - t('e')) * dt * 1.8;
  const l = Math.hypot(fr, la); if (l > 1) { fr /= l; la /= l; }
  const v = (teclas.has('shift') ? 7 : 3.6) * dt, sn = Math.sin(andar.yaw), cs = Math.cos(andar.yaw);
  const nx = andar.x + (-sn * fr + cs * la) * v, nz = andar.z + (-cs * fr - sn * la) * v;
  if (livreEm(nx, andar.z)) andar.x = nx; if (livreEm(andar.x, nz)) andar.z = nz;
  camera.position.set(andar.x, 1.68 + (l > 0.05 ? Math.sin(T * 9) * 0.04 : 0), andar.z); camera.rotation.set(andar.pitch, andar.yaw, 0);
}

// clique / toque nas áreas
const raio = new THREE.Raycaster(), pt = new THREE.Vector2(); let baixo = null;
canvas.addEventListener('pointerdown', e => { baixo = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener('pointerup', e => {
  if (andar) return;
  if (!baixo || Math.hypot(e.clientX - baixo.x, e.clientY - baixo.y) > 6 || performance.now() - baixo.t > 500) return;
  const r = canvas.getBoundingClientRect(); pt.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raio.setFromCamera(pt, camera); const h = raio.intersectObjects(alvos)[0]; if (h) selecionar(h.object.userData.zona.id);
});
window.addEventListener('keydown', e => { if (e.key === 'Escape') { visaoGeral(); } if (tour && e.key === 'ArrowRight') $('t-prox').onclick(); if (tour && e.key === 'ArrowLeft') $('t-ant').onclick(); });

function ajustar() {
  const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.fov = andar ? (w < h ? 85 : 70) : (w < h ? 60 : 42); camera.updateProjectionMatrix();
}
window.addEventListener('resize', ajustar); ajustar();

// ---------- Loop ----------
const relogio = new THREE.Clock(), v = new THREE.Vector3();
const suave = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function quadro() {
  const dt = Math.min(relogio.getDelta(), 0.05), T = relogio.elapsedTime;
  empilhadeiras.forEach(e => { moverNaRota(e, dt); e.garfo.position.y = 0.35 + (Math.sin(T * 0.6 + e.vel) * 0.5 + 0.5) * 0.5; e.luz.material.emissiveIntensity = Math.sin(T * 8 + e.vel) > 0 ? 2.5 : 0.2; });
  andarilhos.forEach(a => {
    const d = a.a.distanceTo(a.b), ciclo = (T * a.vel + a.fase) % (2 * d + 6);
    let k, indo = true;
    if (ciclo < d) k = ciclo / d; else if (ciclo < d + 3) k = 1; else if (ciclo < 2 * d + 3) { k = 1 - (ciclo - d - 3) / d; indo = false; } else { k = 0; indo = false; }
    a.g.position.lerpVectors(a.a, a.b, k);
    const andando = k > 0 && k < 1, passo = Math.sin(T * 7 * a.vel + a.fase);
    a.g.position.y = andando ? Math.abs(passo) * 0.04 : 0;
    const bal = andando ? passo * 0.65 : 0;
    a.pernas[0].rotation.x = bal; a.pernas[1].rotation.x = -bal;
    if (a.leva) { a.bracos[0].rotation.x = a.bracos[1].rotation.x = a.leva === 'caixa' ? -1.25 : -0.7; }
    else if (andando) { a.bracos[0].rotation.x = -bal * 0.8; a.bracos[1].rotation.x = bal * 0.8; }
    else if (a.civil) { a.bracos[0].rotation.x = a.bracos[1].rotation.x = 0; }
    else { a.bracos[0].rotation.x = -0.9 + Math.sin(T * 3 + a.fase) * 0.35; a.bracos[1].rotation.x = -0.9 + Math.cos(T * 3.4 + a.fase) * 0.35; } // trabalhando parado
    v.subVectors(indo ? a.b : a.a, indo ? a.a : a.b); a.g.rotation.y = Math.atan2(v.x, v.z);
  });
  transito.forEach(c => { c.p = (c.p + c.vel * dt) % 520; const q = -260 + c.p; c.g.position.set(c.dx ? c.dx * q : c.fixo, 0, c.dz ? c.dz * q : c.fixo); });
  const longe = !andar && camera.position.distanceTo(controls.target) > 110; marcos.forEach(m => m.visible = longe); elRotulos.style.opacity = longe ? 0 : 1;
  if (voo) { voo.t += dt / voo.dur; const k = suave(Math.min(1, voo.t)); camera.position.lerpVectors(voo.p0, voo.p1, k); controls.target.lerpVectors(voo.a0, voo.a1, k); if (voo.t >= 1) voo = null; }
  destaque.material.opacity = selecionada ? 0.16 + Math.sin(T * 3) * 0.07 : 0;
  if (tour) {
    tour.t += dt; const k = suave(Math.min(1, tour.t / 3));
    carga.position.lerpVectors(tour.de, tour.para, k); carga.position.y = 0.2 + Math.sin(k * Math.PI) * 2.5; carga.rotation.y = T * 1.5; seta.position.y = 3 + Math.sin(T * 4) * 0.25;
    $('barra').style.width = Math.min(100, tour.t / DUR_ETAPA * 100) + '%';
    if (tour.t >= DUR_ETAPA) { if (tour.i + 1 < FLUXO.length) irEtapa(tour.i + 1); else { pararTour(); visaoGeral(); } }
  }
  if (andar) atualizarAndar(dt, T); else controls.update();
  // rótulos HTML
  const w = canvas.clientWidth, h = canvas.clientHeight;
  ZONAS.forEach(z => {
    v.set(z.cx, 7.2, z.cz).project(camera);
    const vis = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
    z.rotulo.style.display = vis ? '' : 'none';
    if (vis) z.rotulo.style.transform = `translate(-50%,-50%) translate(${(v.x * 0.5 + 0.5) * w}px,${(-v.y * 0.5 + 0.5) * h}px)`;
  });
  renderer.render(scene, camera);
  requestAnimationFrame(quadro);
}
quadro();
document.body.classList.add('pronto');
window.__cd = { selecionar, iniciarTour, visaoGeral, entrarAndar };
