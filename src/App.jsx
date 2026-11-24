import { useEffect, useMemo, useRef, useState } from "react";
import EfeitoRelevoPastel from "./EfeitoRelevoPastel";
import { supabase } from "./supabase";

const DIAS_SEMANA = [
  { chave: "seg", rotulo: "Seg", letra: "S", nome: "Segunda-feira" },
  { chave: "ter", rotulo: "Ter", letra: "T", nome: "Terça-feira" },
  { chave: "qua", rotulo: "Qua", letra: "Q", nome: "Quarta-feira" },
  { chave: "qui", rotulo: "Qui", letra: "Q", nome: "Quinta-feira" },
  { chave: "sex", rotulo: "Sex", letra: "S", nome: "Sexta-feira" },
  { chave: "sab", rotulo: "Sáb", letra: "S", nome: "Sábado" },
  { chave: "dom", rotulo: "Dom", letra: "D", nome: "Domingo" },
];

const MESES_CURTOS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

const ROTINA_INICIAL = {
  seg: [
    { id: 101, nome: "Supino Reto", seriesReps: "4x10", descanso: 60, carga: 60 },
    { id: 102, nome: "Crucifixo", seriesReps: "3x12", descanso: 45, carga: 40 },
  ],
  ter: [
    { id: 201, nome: "Puxada Alta", seriesReps: "4x10", descanso: 60, carga: 55 },
    { id: 202, nome: "Remada Baixa", seriesReps: "4x12", descanso: 60, carga: 50 },
  ],
  qua: [
    { id: 301, nome: "Leg Press", seriesReps: "4x12", descanso: 75, carga: 140 },
    { id: 302, nome: "Extensora", seriesReps: "3x15", descanso: 45, carga: 45 },
  ],
  qui: [],
  sex: [
    { id: 401, nome: "Desenvolvimento", seriesReps: "4x10", descanso: 60, carga: 24 },
    { id: 402, nome: "Tríceps Corda", seriesReps: "3x12", descanso: 45, carga: 30 },
  ],
  sab: [],
  dom: [],
};

const PRESETS_INICIAIS = [
  {
    id: "preset-push",
    nome: "Push (Peito / Ombro / Tríceps)",
    exercicios: [
      { nome: "Supino Reto", seriesReps: "4x10", descanso: 60, carga: 60 },
      { nome: "Crucifixo", seriesReps: "3x12", descanso: 45, carga: 40 },
      { nome: "Desenvolvimento", seriesReps: "4x10", descanso: 60, carga: 24 },
      { nome: "Tríceps Corda", seriesReps: "3x12", descanso: 45, carga: 30 },
    ],
  },
  {
    id: "preset-pull",
    nome: "Pull (Costas / Bíceps)",
    exercicios: [
      { nome: "Puxada Alta", seriesReps: "4x10", descanso: 60, carga: 55 },
      { nome: "Remada Baixa", seriesReps: "4x12", descanso: 60, carga: 50 },
      { nome: "Rosca Direta", seriesReps: "3x12", descanso: 45, carga: 25 },
    ],
  },
  {
    id: "preset-legs",
    nome: "Pernas",
    exercicios: [
      { nome: "Leg Press", seriesReps: "4x12", descanso: 75, carga: 140 },
      { nome: "Extensora", seriesReps: "3x15", descanso: 45, carga: 45 },
      { nome: "Mesa Flexora", seriesReps: "3x12", descanso: 45, carga: 40 },
    ],
  },
];

const REFEICOES_PADRAO_INICIAIS = [
  { id: "ref-1", nome: "Café da manhã padrão" },
  { id: "ref-2", nome: "Lanche / vitamina da tarde" },
  { id: "ref-3", nome: "Pós-treino / jantar" },
];

const MOCHILA_PADRAO_INICIAIS = [
  { id: "moch-1", nome: "Garrafa d'água" },
  { id: "moch-2", nome: "Fone de ouvido" },
  { id: "moch-3", nome: "Pré-treino / snack" },
  { id: "moch-4", nome: "Toalha / troca de roupa" },
];

const QUALIDADE_SONO = ["Sono bom", "Sono ok", "Dormi pouco"];
const MOTIVOS_SEM_TREINO = ["Correria/trabalho", "Cansaço", "Folga"];
const SINAIS_CORPO = ["Sono curto", "Treino cedo", "Energia alta", "Pernas pesadas", "Sem tempo"];
const STATUS_SUPLEMENTO = ["Ativo", "Acabando", "Pausado"];
const TIPOS_CARDIO = ["Caminhada", "Corrida", "Bike", "Alongamento"];
const ANILHAS_DISPONIVEIS = [25, 20, 15, 10, 5, 2.5, 1.25];
const HORAS_OPCOES = Array.from({ length: 13 }, (_, i) => i);
const MIN_SEG_OPCOES = Array.from({ length: 60 }, (_, i) => i);
const ALTURA_ITEM_ROLETA = 36;

function getDataHojeISO() {
  // O fechamento diário segue sempre o fuso de São Paulo, mesmo se o
  // dispositivo estiver configurado em outro fuso horário.
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const valores = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${valores.year}-${valores.month}-${valores.day}`;
}

function getHoraAtualHHMM() {
  const agora = new Date();
  return `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
}

function formatarDataISO(dataObj) {
  const ano = dataObj.getFullYear();
  const mes = String(dataObj.getMonth() + 1).padStart(2, "0");
  const dia = String(dataObj.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function getChaveDiaDaData(dataISO) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const d = new Date(ano, mes - 1, dia);
  return DIAS_SEMANA[(d.getDay() + 6) % 7].chave;
}

function getJanelaDiasEmVolta(dataBaseISO, hojeISO) {
  const [ano, mes, dia] = dataBaseISO.split("-").map(Number);
  const base = new Date(ano, mes - 1, dia, 12, 0, 0);
  const offsets = [-1, 0, 1, 2, 3, 4, 5];

  return offsets.map((offset) => {
    const d = new Date(base);
    d.setDate(base.getDate() + offset);
    const chave = DIAS_SEMANA[(d.getDay() + 6) % 7].chave;
    const info = DIAS_SEMANA.find((item) => item.chave === chave);
    const dataISO = formatarDataISO(d);

    return {
      chave,
      letra: info?.letra || "D",
      rotulo: info?.rotulo || "Dia",
      dataISO,
      numeroDia: d.getDate(),
      ehHoje: dataISO === hojeISO,
    };
  });
}

function calcularVolumeExercicio(seriesReps, carga) {
  const cargaNum = Number(carga) || 0;
  if (!cargaNum) return 0;
  const match = String(seriesReps || "").match(/(\d+)\s*[xX×]\s*(\d+)/);
  if (!match) return cargaNum;
  const series = Number(match[1]) || 0;
  const reps = Number(match[2]) || 0;
  return series * reps * cargaNum;
}

function ajustarSeriesNoTexto(texto, deltaSeries) {
  const match = String(texto || "").match(/^(\d+)\s*([xX×])\s*(.+)$/);
  if (!match) return texto;
  const novasSeries = Math.max(1, Number(match[1]) + deltaSeries);
  return `${novasSeries}${match[2]}${match[3]}`;
}

function formatarDuracao(segTotal) {
  const s = Math.max(0, Number(segTotal) || 0);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const segs = s % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(segs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(segs).padStart(2, "0")}`;
}

function segParaHMS(totalSeg) {
  const safe = Math.max(0, Math.floor(Number(totalSeg) || 0));
  const h = Math.min(12, Math.floor(safe / 3600));
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return { h, m, s };
}

function hmsParaSeg(h, m, s) {
  return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
}

function calcularAnilhasPorLado(pesoTotal, pesoBarra) {
  const total = Math.max(0, Number(pesoTotal) || 0);
  const barra = Math.max(0, Number(pesoBarra) || 0);
  let restantePorLado = Math.max(0, (total - barra) / 2);
  const itens = [];

  for (const anilha of ANILHAS_DISPONIVEIS) {
    const qtd = Math.floor((restantePorLado + 0.0001) / anilha);
    if (qtd > 0) {
      itens.push({ anilha, qtd });
      restantePorLado = Math.max(0, Number((restantePorLado - qtd * anilha).toFixed(2)));
    }
  }

  return { itens, sobraPorLado: restantePorLado };
}

function comprimirImagemParaBase64(arquivo, maxLargura = 560, qualidade = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, maxLargura / (img.width || maxLargura));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * escala));
        canvas.height = Math.max(1, Math.round(img.height * escala));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", qualidade));
      };
      img.onerror = reject;
      img.src = String(reader.result || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(arquivo);
  });
}

// Cache offline por conta. IndexedDB evita os limites pequenos do localStorage
// e mantém os dados do usuário isolados pelo ID autenticado.
const CAVEIRA_DB_OFFLINE = "caveira-app-offline-v1";
const CAVEIRA_STORE_OFFLINE = "snapshots";

function abrirBancoOffline() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Este navegador não oferece armazenamento offline."));
      return;
    }
    const request = indexedDB.open(CAVEIRA_DB_OFFLINE, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CAVEIRA_STORE_OFFLINE)) {
        db.createObjectStore(CAVEIRA_STORE_OFFLINE, { keyPath: "userId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Falha ao abrir o armazenamento offline."));
  });
}

async function lerSnapshotOffline(userId) {
  const db = await abrirBancoOffline();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CAVEIRA_STORE_OFFLINE, "readonly");
    const request = tx.objectStore(CAVEIRA_STORE_OFFLINE).get(userId);
    request.onsuccess = () => { db.close(); resolve(request.result || null); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

async function gravarSnapshotOffline(registro) {
  const db = await abrirBancoOffline();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CAVEIRA_STORE_OFFLINE, "readwrite");
    tx.objectStore(CAVEIRA_STORE_OFFLINE).put(registro);
    tx.oncomplete = () => { db.close(); resolve(true); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error("Não foi possível guardar os dados neste dispositivo.")); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error("O armazenamento offline foi interrompido.")); };
  });
}


function RoletaColuna({ label, opcoes, valor, aoMudar }) {
  const refLista = useRef(null);
  const ignorarScrollRef = useRef(false);

  useEffect(() => {
    const el = refLista.current;
    if (!el) return;
    const idx = Math.max(0, opcoes.indexOf(Number(valor)));
    const destino = idx * ALTURA_ITEM_ROLETA;
    if (Math.abs(el.scrollTop - destino) > 2) {
      ignorarScrollRef.current = true;
      el.scrollTo({ top: destino, behavior: "smooth" });
      setTimeout(() => {
        ignorarScrollRef.current = false;
      }, 220);
    }
  }, [valor, opcoes]);

  function aoRolar() {
    if (ignorarScrollRef.current) return;
    const el = refLista.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / ALTURA_ITEM_ROLETA);
    const clamped = Math.max(0, Math.min(opcoes.length - 1, idx));
    const escolhido = opcoes[clamped];
    if (escolhido !== undefined && escolhido !== valor) {
      aoMudar(escolhido);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      <span style={{ fontSize: "10px", color: "#a8b6ca", letterSpacing: "0.06em" }}>{label}</span>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: `${ALTURA_ITEM_ROLETA * 3}px`,
          borderRadius: "10px",
          background: "rgba(38, 54, 75, 0.62)",
          border: "1px solid rgba(148, 190, 215, 0.19)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "6px",
            right: "6px",
            top: `${ALTURA_ITEM_ROLETA}px`,
            height: `${ALTURA_ITEM_ROLETA}px`,
            borderRadius: "7px",
            background: "rgba(125, 211, 252, 0.12)",
            border: "1px solid rgba(125, 211, 252, 0.38)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        <div
          ref={refLista}
          onScroll={aoRolar}
          style={{
            height: "100%",
            overflowY: "auto",
            scrollSnapType: "y mandatory",
            paddingTop: `${ALTURA_ITEM_ROLETA}px`,
            paddingBottom: `${ALTURA_ITEM_ROLETA}px`,
            boxSizing: "border-box",
            scrollbarWidth: "none",
          }}
        >
          {opcoes.map((num) => {
            const ativo = num === Number(valor);
            return (
              <button
                key={num}
                type="button"
                onClick={() => aoMudar(num)}
                style={{
                  width: "100%",
                  height: `${ALTURA_ITEM_ROLETA}px`,
                  scrollSnapAlign: "center",
                  background: "transparent",
                  border: "none",
                  color: ativo ? "#bae6fd" : "#a8b6ca",
                  fontSize: ativo ? "16px" : "13px",
                  fontWeight: ativo ? 700 : 400,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                {String(num).padStart(2, "0")}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [hojeISO, setHojeISO] = useState(() => getDataHojeISO());

  useEffect(() => {
    const id = setInterval(() => {
      const dataAtual = getDataHojeISO();
      setHojeISO((anterior) => (anterior === dataAtual ? anterior : dataAtual));
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const [larguraTela, setLarguraTela] = useState(
    typeof window !== "undefined" ? window.innerWidth : 480
  );
  const ehDesktop = larguraTela >= 640;

  const [menuAberto, setMenuAberto] = useState(false);
  const [authSession, setAuthSession] = useState(null);
  const [authCarregando, setAuthCarregando] = useState(true);
  const [authModo, setAuthModo] = useState("login");
  const [authNome, setAuthNome] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authSenha, setAuthSenha] = useState("");
  const [authCodigo, setAuthCodigo] = useState("");
  const [authNovaSenha, setAuthNovaSenha] = useState("");
  const [authMostrarSenha, setAuthMostrarSenha] = useState(false);
  const [authErro, setAuthErro] = useState("");
  const [authMensagem, setAuthMensagem] = useState("");
  const [authEnviando, setAuthEnviando] = useState(false);
  const [dadosNuvemCarregados, setDadosNuvemCarregados] = useState(false);
  const [erroDadosNuvem, setErroDadosNuvem] = useState("");
  const [statusDadosNuvem, setStatusDadosNuvem] = useState("Sincronizando dados...");
  const [tentativaNuvem, setTentativaNuvem] = useState(0);
  const [estaOnline, setEstaOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [statusOffline, setStatusOffline] = useState("Conectado");
  const salvamentoPendenteRef = useRef(null);
  const salvamentoTimerRef = useRef(null);
  const salvamentoEmAndamentoRef = useRef(false);
  const ultimoUsuarioNuvemRef = useRef(null);

  useEffect(() => {
    function aoRedimensionar() {
      setLarguraTela(window.innerWidth);
    }
    window.addEventListener("resize", aoRedimensionar);
    return () => window.removeEventListener("resize", aoRedimensionar);
  }, []);

  // Detecta perda e retorno da conexão sem interromper os registros em tela.
  useEffect(() => {
    const aoFicarOnline = () => { setEstaOnline(true); setStatusOffline("Conexão restabelecida"); };
    const aoFicarOffline = () => { setEstaOnline(false); setStatusOffline("Modo offline"); };
    window.addEventListener("online", aoFicarOnline);
    window.addEventListener("offline", aoFicarOffline);
    return () => {
      window.removeEventListener("online", aoFicarOnline);
      window.removeEventListener("offline", aoFicarOffline);
    };
  }, []);

  // Registra o Service Worker e o manifesto para permitir carregar a interface
  // já visitada mesmo quando a conexão cair ou a página for reaberta offline.
  useEffect(() => {
    if (typeof document !== "undefined" && !document.querySelector('link[rel="manifest"]')) {
      const manifesto = document.createElement("link");
      manifesto.rel = "manifest";
      manifesto.href = "/manifest.webmanifest";
      document.head.appendChild(manifesto);
    }
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // O app continua funcional online; a cache de dados usa IndexedDB.
      });
    }
  }, []);

  // Sessão Supabase: mantém o usuário conectado e acompanha alterações de autenticação.
  useEffect(() => {
    let ativo = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!ativo) return;
      if (error) setAuthErro("Não foi possível verificar sua sessão. Tente novamente.");
      setAuthSession(data?.session || null);
      setAuthCarregando(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_evento, session) => {
      setAuthSession(session || null);
      setAuthCarregando(false);
    });
    return () => {
      ativo = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);


  async function enviarFormularioAuth(event) {
    event.preventDefault();
    setAuthErro("");
    setAuthMensagem("");
    setAuthEnviando(true);
    try {
      if (authModo === "cadastro") {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authSenha,
          options: { data: { nome: authNome.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          setAuthMensagem("Cadastro realizado. Confira seu email para confirmar a conta e depois faça login.");
          setAuthModo("login");
        } else {
          setAuthMensagem("Conta criada com sucesso!");
        }
      } else if (authModo === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authSenha });
        if (error) throw error;
      } else if (authModo === "recuperar") {
        const { error } = await supabase.auth.resetPasswordForEmail(authEmail.trim());
        if (error) throw error;
        setAuthModo("novaSenha");
        setAuthMensagem("Enviamos um código para seu email. Digite o código recebido e escolha uma nova senha.");
      } else if (authModo === "novaSenha") {
        const { error: codigoError } = await supabase.auth.verifyOtp({
          email: authEmail.trim(), token: authCodigo.trim(), type: "recovery",
        });
        if (codigoError) throw codigoError;
        const { error: senhaError } = await supabase.auth.updateUser({ password: authNovaSenha });
        if (senhaError) throw senhaError;
        setAuthModo("login");
        setAuthSenha("");
        setAuthCodigo("");
        setAuthNovaSenha("");
        setAuthMensagem("Senha alterada com sucesso. Entre com sua nova senha.");
        await supabase.auth.signOut();
      }
    } catch (error) {
      setAuthErro(error?.message || "Ocorreu um erro. Confira os dados e tente novamente.");
    } finally {
      setAuthEnviando(false);
    }
  }

  async function sairDaConta() {
    setAuthErro("");
    if (salvamentoTimerRef.current) { clearTimeout(salvamentoTimerRef.current); salvamentoTimerRef.current = null; }
    const { error } = await supabase.auth.signOut();
    if (error) setAuthErro("Não foi possível sair da conta. Tente novamente.");
    setMenuAberto(false);
  }

  const [modoFocoLimpo, setModoFocoLimpo] = useState(false);
  const [logoQuebrou, setLogoQuebrou] = useState(false);

  const calcRef = useRef(null);
  const backupRef = useRef(null);
  const timerEstavaRodandoRef = useRef(false);
  const wakeLockRef = useRef(null);
  const audioCtxRef = useRef(null);
  const alarmeIntervalRef = useRef(null);

  // Páginas disponíveis: "hoje" | "montar" | "timer" | "dashboard" | "suplementos" | "alimentacao" | "mochila"
  const [abaAtiva, setAbaAtiva] = useState("hoje");
  const [dataSelecionada, setDataSelecionada] = useState(hojeISO);
  const [rotina, setRotina] = useState(ROTINA_INICIAL);
  const [focoDiasPorChave, setFocoDiasPorChave] = useState({});
  const [presets, setPresets] = useState(PRESETS_INICIAIS);
  const [logsPorData, setLogsPorData] = useState({});
  const [observacoes, setObservacoes] = useState({});
  const [duracaoPorData, setDuracaoPorData] = useState({});
  const [tempoAtivoPorData, setTempoAtivoPorData] = useState({});
  const [aquecimentoPorData, setAquecimentoPorData] = useState({});
  const [estadoDiaPorData, setEstadoDiaPorData] = useState({});
  const [checklistPorData, setChecklistPorData] = useState({});
  const [sinaisCorpoPorData, setSinaisCorpoPorData] = useState({});
  const [sonoPorData, setSonoPorData] = useState({});
  const [motivoSemTreinoPorData, setMotivoSemTreinoPorData] = useState({});

  // Alimentação & rotina extra (página "alimentacao")
  const [refeicoesModelos, setRefeicoesModelos] = useState(REFEICOES_PADRAO_INICIAIS);
  const [refeicoesFeitasPorData, setRefeicoesFeitasPorData] = useState({});
  const [refeicaoLivrePorData, setRefeicaoLivrePorData] = useState({});
  const [janelaTreinoPorData, setJanelaTreinoPorData] = useState({});
  const [cafeinaPorData, setCafeinaPorData] = useState({});
  const [cardioPorData, setCardioPorData] = useState({});
  const [novoNomeRefeicao, setNovoNomeRefeicao] = useState("");
  const [novoRotuloCafeina, setNovoRotuloCafeina] = useState("Café");
  const [novoTipoCardio, setNovoTipoCardio] = useState("Caminhada");
  const [novoMinCardio, setNovoMinCardio] = useState(20);

  // Suplementos (página "suplementos")
  const [suplementos, setSuplementos] = useState([]);
  const [novoSupNome, setNovoSupNome] = useState("");
  const [novoSupDose, setNovoSupDose] = useState("");
  const [novoSupDetalhe, setNovoSupDetalhe] = useState("");
  const [novoSupStatus, setNovoSupStatus] = useState("Ativo");
  const [novoSupFoto, setNovoSupFoto] = useState("");
  const [avisoSupFoto, setAvisoSupFoto] = useState("");
  const [formSuplementoAberto, setFormSuplementoAberto] = useState(false);

  // Mochila & Ritmo (página "mochila")
  const [itensMochila, setItensMochila] = useState(MOCHILA_PADRAO_INICIAIS);
  const [mochilaMarcadaPorData, setMochilaMarcadaPorData] = useState({});
  const [novoItemMochila, setNovoItemMochila] = useState("");
  const [metaTreinosSemana, setMetaTreinosSemana] = useState(4);
  const [diaOrigemSemanaCopia, setDiaOrigemSemanaCopia] = useState("seg");
  const [diaDestinoSemanaCopia, setDiaDestinoSemanaCopia] = useState("qui");

  const [ultimoBackupISO, setUltimoBackupISO] = useState(null);

  // Modos de tempo: "cronometro" | "timer" | "intervalo"
  const [modoTempo, setModoTempo] = useState("cronometro");
  const [cronometroRodando, setCronometroRodando] = useState(false);
  useEffect(() => {
    if (dataSelecionada !== hojeISO && cronometroRodando) setCronometroRodando(false);
  }, [hojeISO, dataSelecionada, cronometroRodando]);


  const inicialHMS = segParaHMS(60);
  const [timerHoras, setTimerHoras] = useState(inicialHMS.h);
  const [timerMinutos, setTimerMinutos] = useState(inicialHMS.m);
  const [timerSegundos, setTimerSegundos] = useState(inicialHMS.s);
  const [timerRestante, setTimerRestante] = useState(0);
  const [timerRodando, setTimerRodando] = useState(false);
  const [alarmeTocando, setAlarmeTocando] = useState(false);

  // Intervalo / Circuito
  const [intervaloTrabalhoSeg, setIntervaloTrabalhoSeg] = useState(40);
  const [intervaloDescansoSeg, setIntervaloDescansoSeg] = useState(20);
  const [intervaloRodadasTotal, setIntervaloRodadasTotal] = useState(4);
  const [intervaloRodadaAtual, setIntervaloRodadaAtual] = useState(1);
  const [intervaloFase, setIntervaloFase] = useState("trabalho");
  const [intervaloRestante, setIntervaloRestante] = useState(40);
  const [intervaloRodando, setIntervaloRodando] = useState(false);

  // Calculadora de anilhas
  const [calcAberta, setCalcAberta] = useState(false);
  const [calcPesoTotal, setCalcPesoTotal] = useState(60);
  const [calcPesoBarra, setCalcPesoBarra] = useState(20);

  const [pesoKg, setPesoKg] = useState(75);
  const [aguaPorData, setAguaPorData] = useState({});
  const [aguaEntradaMl, setAguaEntradaMl] = useState("");
  const [metaTreinosMes, setMetaTreinosMes] = useState(16);

  const [exercicioHistoricoAberto, setExercicioHistoricoAberto] = useState(null);

  // Recursos Premium adicionais: desempenho, medidas, metas e biblioteca.
  const [registrosPR, setRegistrosPR] = useState([]);
  const [medidasCorporais, setMedidasCorporais] = useState([]);
  const [metasPessoais, setMetasPessoais] = useState([]);
  const [buscaBiblioteca, setBuscaBiblioteca] = useState("");
  const [novoPRExercicio, setNovoPRExercicio] = useState("");
  const [novoPRCarga, setNovoPRCarga] = useState("");
  const [novaMedidaPeso, setNovaMedidaPeso] = useState("");
  const [novaMedidaCintura, setNovaMedidaCintura] = useState("");
  const [novaMedidaPeito, setNovaMedidaPeito] = useState("");
  const [novaMetaNome, setNovaMetaNome] = useState("");
  const [novaMetaAlvo, setNovaMetaAlvo] = useState("");

  const [diaMontagem, setDiaMontagem] = useState(getChaveDiaDaData(hojeISO));
  const [diaOrigemCopia, setDiaOrigemCopia] = useState("seg");
  const [modoAplicacaoRotina, setModoAplicacaoRotina] = useState("somar");
  const [presetSelecionadoId, setPresetSelecionadoId] = useState(PRESETS_INICIAIS[0].id);
  const [novoPresetNome, setNovoPresetNome] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({ nome: "", seriesReps: "", descanso: 60, carga: 0 });

  const [novoNome, setNovoNome] = useState("");
  const [novoSeriesReps, setNovoSeriesReps] = useState("4x10");
  const [novoDescanso, setNovoDescanso] = useState(60);
  const [novoCarga, setNovoCarga] = useState(20);

  const [exercicioFiltro, setExercicioFiltro] = useState("TODOS");
  const [diaSemanaFiltro, setDiaSemanaFiltro] = useState("TODOS");
  const [periodoFiltro, setPeriodoFiltro] = useState("4w");
  const [buscaNota, setBuscaNota] = useState("");
  const [textoBackup, setTextoBackup] = useState("");
  const [statusBackup, setStatusBackup] = useState("");
  const [statusResumo, setStatusResumo] = useState("");

  function pararSomAlarme() {
    if (alarmeIntervalRef.current) {
      clearInterval(alarmeIntervalRef.current);
      alarmeIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setAlarmeTocando(false);
  }

  function tocarPulsoSonoro(freq = 987.77) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      const agora = ctx.currentTime;
      [0, 0.2, 0.4].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, agora + offset);
        gain.gain.setValueAtTime(0.001, agora + offset);
        gain.gain.exponentialRampToValueAtTime(0.18, agora + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, agora + offset + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(agora + offset);
        osc.stop(agora + offset + 0.17);
      });
    } catch {
      // ignora bloqueio de áudio
    }
  }

  function dispararAlarmeTimer(freq = 987.77, repeticoes = 4) {
    setAlarmeTocando(true);
    try {
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate([260, 120, 260, 120, 320]);
      }
    } catch {
      // ignora
    }
    tocarPulsoSonoro(freq);
    if (alarmeIntervalRef.current) clearInterval(alarmeIntervalRef.current);
    let pulsos = 1;
    alarmeIntervalRef.current = setInterval(() => {
      pulsos += 1;
      tocarPulsoSonoro(freq);
      if (pulsos >= repeticoes) {
        clearInterval(alarmeIntervalRef.current);
        alarmeIntervalRef.current = null;
      }
    }, 1100);
  }

  useEffect(() => {
    return () => {
      if (alarmeIntervalRef.current) clearInterval(alarmeIntervalRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, []);

  const totalConfigTimerSeg = hmsParaSeg(timerHoras, timerMinutos, timerSegundos);

  const estadoPersistido = {
    rotina,
    focoDiasPorChave,
    presets,
    logsPorData,
    observacoes,
    duracaoPorData,
    tempoAtivoPorData,
    aquecimentoPorData,
    estadoDiaPorData,
    checklistPorData,
    sinaisCorpoPorData,
    sonoPorData,
    motivoSemTreinoPorData,
    refeicoesModelos,
    refeicoesFeitasPorData,
    refeicaoLivrePorData,
    janelaTreinoPorData,
    cafeinaPorData,
    cardioPorData,
    suplementos,
    itensMochila,
    mochilaMarcadaPorData,
    metaTreinosSemana,
    ultimoBackupISO,
    modoTempo,
    duracaoTimerConfig: totalConfigTimerSeg,
    intervaloTrabalhoSeg,
    intervaloDescansoSeg,
    intervaloRodadasTotal,
    pesoKg,
    aguaPorData,
    metaTreinosMes,
    registrosPR,
    medidasCorporais,
    metasPessoais,
  };

  // Aplica um snapshot tanto vindo da nuvem quanto do cache offline.
  function aplicarSnapshotPersistido(dados) {
    const d = dados || {};
    if (d.rotina) setRotina(d.rotina);
    if (d.focoDiasPorChave) setFocoDiasPorChave(d.focoDiasPorChave);
    if (Array.isArray(d.presets)) setPresets(d.presets);
    if (d.logsPorData) setLogsPorData(d.logsPorData);
    if (d.observacoes) setObservacoes(d.observacoes);
    if (d.duracaoPorData) setDuracaoPorData(d.duracaoPorData);
    if (d.tempoAtivoPorData) setTempoAtivoPorData(d.tempoAtivoPorData);
    if (d.aquecimentoPorData) setAquecimentoPorData(d.aquecimentoPorData);
    if (d.estadoDiaPorData) setEstadoDiaPorData(d.estadoDiaPorData);
    if (d.checklistPorData) setChecklistPorData(d.checklistPorData);
    if (d.sinaisCorpoPorData) setSinaisCorpoPorData(d.sinaisCorpoPorData);
    if (d.sonoPorData) setSonoPorData(d.sonoPorData);
    if (d.motivoSemTreinoPorData) setMotivoSemTreinoPorData(d.motivoSemTreinoPorData);
    if (Array.isArray(d.refeicoesModelos)) setRefeicoesModelos(d.refeicoesModelos);
    if (d.refeicoesFeitasPorData) setRefeicoesFeitasPorData(d.refeicoesFeitasPorData);
    if (d.refeicaoLivrePorData) setRefeicaoLivrePorData(d.refeicaoLivrePorData);
    if (d.janelaTreinoPorData) setJanelaTreinoPorData(d.janelaTreinoPorData);
    if (d.cafeinaPorData) setCafeinaPorData(d.cafeinaPorData);
    if (d.cardioPorData) setCardioPorData(d.cardioPorData);
    if (Array.isArray(d.suplementos)) setSuplementos(d.suplementos);
    if (Array.isArray(d.itensMochila)) setItensMochila(d.itensMochila);
    if (d.mochilaMarcadaPorData) setMochilaMarcadaPorData(d.mochilaMarcadaPorData);
    if (d.metaTreinosSemana !== undefined) setMetaTreinosSemana(d.metaTreinosSemana);
    if (d.ultimoBackupISO !== undefined) setUltimoBackupISO(d.ultimoBackupISO);
    if (d.modoTempo) setModoTempo(d.modoTempo);
    if (d.duracaoTimerConfig !== undefined) {
      const hms = segParaHMS(d.duracaoTimerConfig);
      setTimerHoras(hms.h);
      setTimerMinutos(hms.m);
      setTimerSegundos(hms.s);
    }
    if (d.intervaloTrabalhoSeg !== undefined) {
      setIntervaloTrabalhoSeg(d.intervaloTrabalhoSeg);
      setIntervaloRestante(d.intervaloTrabalhoSeg);
    }
    if (d.intervaloDescansoSeg !== undefined) setIntervaloDescansoSeg(d.intervaloDescansoSeg);
    if (d.intervaloRodadasTotal !== undefined) setIntervaloRodadasTotal(d.intervaloRodadasTotal);
    if (d.pesoKg !== undefined) setPesoKg(d.pesoKg);
    if (d.aguaPorData) setAguaPorData(d.aguaPorData);
    if (d.metaTreinosMes !== undefined) setMetaTreinosMes(d.metaTreinosMes);
    if (Array.isArray(d.registrosPR)) setRegistrosPR(d.registrosPR);
    if (Array.isArray(d.medidasCorporais)) setMedidasCorporais(d.medidasCorporais);
    if (Array.isArray(d.metasPessoais)) setMetasPessoais(d.metasPessoais);
  }

  // Carrega primeiro a nuvem; se não houver conexão, usa o último snapshot local.
  useEffect(() => {
    const userId = authSession?.user?.id;
    if (!userId) {
      setDadosNuvemCarregados(false);
      ultimoUsuarioNuvemRef.current = null;
      return;
    }

    let cancelado = false;
    setDadosNuvemCarregados(false);
    setErroDadosNuvem("");
    setStatusDadosNuvem(estaOnline ? "Carregando seus dados..." : "Abrindo seus dados salvos neste dispositivo...");

    async function carregarDadosDaNuvem() {
      let cache = null;
      try { cache = await lerSnapshotOffline(userId); } catch { /* cache indisponível: tenta a nuvem */ }
      if (cancelado) return;

      if (!estaOnline) {
        if (cache?.data) {
          aplicarSnapshotPersistido(cache.data);
          ultimoUsuarioNuvemRef.current = userId;
          setDadosNuvemCarregados(true);
          setStatusDadosNuvem(cache.pendente ? "Offline • alterações aguardando sincronização" : "Offline • dados locais carregados");
          setStatusOffline("Modo offline");
        } else {
          setErroDadosNuvem("Este dispositivo ainda não possui uma cópia offline. Conecte-se à internet uma vez para carregar seus dados.");
          setStatusDadosNuvem("Sem dados offline disponíveis");
        }
        return;
      }

      try {
        const { data: registro, error } = await supabase
          .from("caveira_app_data")
          .select("data, updated_at")
          .eq("user_id", userId)
          .maybeSingle();
        if (error) throw error;

        let dados = registro?.data || null;
        if (!dados) {
          let legado = null;
          try {
            const bruto = window.localStorage.getItem("caveira_app_clean_v1");
            legado = bruto ? JSON.parse(bruto) : null;
          } catch { legado = null; }
          dados = legado && typeof legado === "object" ? legado : null;
          const { error: inserirError } = await supabase
            .from("caveira_app_data")
            .upsert({ user_id: userId, data: dados || {}, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
          if (inserirError) throw inserirError;
          if (legado) {
            try { window.localStorage.removeItem("caveira_app_clean_v1"); } catch { /* migração concluída na nuvem */ }
          }
        }

        // Se havia alterações offline, não as descarta silenciosamente.
        // O snapshot pendente permanece local e será enviado pelo fluxo de gravação.
        if (cache?.pendente && cache.data) {
          aplicarSnapshotPersistido(cache.data);
          ultimoUsuarioNuvemRef.current = userId;
          setDadosNuvemCarregados(true);
          setStatusDadosNuvem("Alterações offline encontradas • preparando sincronização");
        } else {
          aplicarSnapshotPersistido(dados || {});
          await gravarSnapshotOffline({ userId, data: dados || {}, salvoEm: new Date().toISOString(), cloudUpdatedAt: registro?.updated_at || null, pendente: false });
          ultimoUsuarioNuvemRef.current = userId;
          setDadosNuvemCarregados(true);
          setStatusDadosNuvem("Dados sincronizados");
        }
        setStatusOffline("Conectado");
      } catch (error) {
        if (cancelado) return;
        if (cache?.data) {
          aplicarSnapshotPersistido(cache.data);
          ultimoUsuarioNuvemRef.current = userId;
          setDadosNuvemCarregados(true);
          setStatusDadosNuvem("Sem conexão com a nuvem • usando cópia local");
          setStatusOffline("Modo offline");
          setErroDadosNuvem("");
        } else {
          setErroDadosNuvem(error?.message || "Não foi possível carregar os dados do Supabase.");
          setStatusDadosNuvem("Falha na sincronização");
        }
      }
    }

    carregarDadosDaNuvem();
    return () => { cancelado = true; };
  }, [authSession?.user?.id, tentativaNuvem, estaOnline]);

  // Salva primeiro no dispositivo e depois sincroniza com o Supabase.
  // Se a internet cair, o último snapshot fica marcado como pendente no IndexedDB.
  useEffect(() => {
    const userId = authSession?.user?.id;
    if (!userId || !dadosNuvemCarregados || ultimoUsuarioNuvemRef.current !== userId) return;

    salvamentoPendenteRef.current = estadoPersistido;
    if (salvamentoTimerRef.current) return;

    salvamentoTimerRef.current = setTimeout(async () => {
      salvamentoTimerRef.current = null;
      if (salvamentoEmAndamentoRef.current) return;
      salvamentoEmAndamentoRef.current = true;
      try {
        while (salvamentoPendenteRef.current) {
          const dadosParaSalvar = salvamentoPendenteRef.current;
          salvamentoPendenteRef.current = null;
          const cacheAnterior = await lerSnapshotOffline(userId).catch(() => null);
          await gravarSnapshotOffline({
            userId,
            data: dadosParaSalvar,
            salvoEm: new Date().toISOString(),
            cloudUpdatedAt: cacheAnterior?.cloudUpdatedAt || null,
            pendente: true,
          });

          if (!navigator.onLine) {
            setEstaOnline(false);
            setStatusOffline("Modo offline");
            setStatusDadosNuvem("Salvo neste dispositivo • aguardando internet");
            continue;
          }

          const updatedAt = new Date().toISOString();
          const { error } = await supabase
            .from("caveira_app_data")
            .upsert({ user_id: userId, data: dadosParaSalvar, updated_at: updatedAt }, { onConflict: "user_id" });
          if (error) throw error;
          await gravarSnapshotOffline({ userId, data: dadosParaSalvar, salvoEm: updatedAt, cloudUpdatedAt: updatedAt, pendente: false });
        }
        setErroDadosNuvem("");
        if (navigator.onLine) {
          setStatusOffline("Conectado");
          setStatusDadosNuvem("Dados sincronizados");
        }
      } catch (error) {
        // Falha de rede nunca apaga a cópia local nem a marcação de pendência.
        setErroDadosNuvem(error?.message || "Não foi possível sincronizar agora. Seus dados continuam salvos neste dispositivo.");
        setStatusDadosNuvem("Salvo localmente • sincronização pendente");
      } finally {
        salvamentoEmAndamentoRef.current = false;
      }
    }, 700);

    return () => {};
  }, [authSession?.user?.id, dadosNuvemCarregados, estaOnline, rotina, focoDiasPorChave, presets, logsPorData,
    observacoes, duracaoPorData, tempoAtivoPorData, aquecimentoPorData, estadoDiaPorData,
    checklistPorData, sinaisCorpoPorData, sonoPorData, motivoSemTreinoPorData,
    refeicoesModelos, refeicoesFeitasPorData, refeicaoLivrePorData, janelaTreinoPorData,
    cafeinaPorData, cardioPorData, suplementos, itensMochila, mochilaMarcadaPorData,
    metaTreinosSemana, ultimoBackupISO, modoTempo, totalConfigTimerSeg, intervaloTrabalhoSeg,
    intervaloDescansoSeg, intervaloRodadasTotal, pesoKg, aguaPorData, metaTreinosMes, registrosPR, medidasCorporais, metasPessoais]);

  // Ao voltar a conexão, o efeito de persistência envia o snapshot pendente.
  useEffect(() => {
    if (estaOnline && authSession?.user?.id && dadosNuvemCarregados) {
      setStatusOffline("Conexão disponível • verificando sincronização");
    }
  }, [estaOnline, authSession?.user?.id, dadosNuvemCarregados]);

  useEffect(() => () => {
    if (salvamentoTimerRef.current) clearTimeout(salvamentoTimerRef.current);
  }, []);

  // Cronômetro da sessão + tempo ativo
  useEffect(() => {
    if (!cronometroRodando || dataSelecionada !== hojeISO) return;
    const id = setInterval(() => {
      setDuracaoPorData((prev) => ({
        ...prev,
        [dataSelecionada]: (Number(prev[dataSelecionada]) || 0) + 1,
      }));
      if (!timerRodando && !(modoTempo === "intervalo" && intervaloRodando && intervaloFase === "descanso")) {
        setTempoAtivoPorData((prev) => ({
          ...prev,
          [dataSelecionada]: (Number(prev[dataSelecionada]) || 0) + 1,
        }));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [cronometroRodando, dataSelecionada, hojeISO, timerRodando, modoTempo, intervaloRodando, intervaloFase]);

  // Contagem regressiva do Timer + Wake Lock + Som ao zerar
  useEffect(() => {
    let cancelado = false;

    async function gerenciarWakeLock() {
      try {
        if ((timerRodando || intervaloRodando) && "wakeLock" in navigator && navigator.wakeLock?.request) {
          if (!wakeLockRef.current) {
            const lock = await navigator.wakeLock.request("screen");
            if (!cancelado) wakeLockRef.current = lock;
            else lock.release().catch(() => {});
          }
        } else if (wakeLockRef.current) {
          await wakeLockRef.current.release().catch(() => {});
          wakeLockRef.current = null;
        }
      } catch {
        // ignora
      }
    }

    gerenciarWakeLock();

    if (timerRodando && timerRestante > 0) {
      timerEstavaRodandoRef.current = true;
      const id = setInterval(() => {
        setTimerRestante((s) => (s > 1 ? s - 1 : 0));
      }, 1000);
      return () => {
        cancelado = true;
        clearInterval(id);
      };
    }

    if (timerRodando && timerRestante === 0 && timerEstavaRodandoRef.current) {
      timerEstavaRodandoRef.current = false;
      setTimerRodando(false);
      dispararAlarmeTimer(987.77, 4);
    }

    return () => {
      cancelado = true;
    };
  }, [timerRodando, timerRestante, intervaloRodando]);

  // Timer por etapas (Intervalo / Circuito)
  useEffect(() => {
    if (!intervaloRodando) return;
    const id = setInterval(() => {
      setIntervaloRestante((atual) => {
        if (atual > 1) return atual - 1;

        if (intervaloFase === "trabalho") {
          tocarPulsoSonoro(783.99);
          setIntervaloFase("descanso");
          return Math.max(5, Number(intervaloDescansoSeg) || 20);
        }

        if (intervaloRodadaAtual < Math.max(1, Number(intervaloRodadasTotal) || 1)) {
          tocarPulsoSonoro(1046.5);
          setIntervaloRodadaAtual((r) => r + 1);
          setIntervaloFase("trabalho");
          return Math.max(5, Number(intervaloTrabalhoSeg) || 40);
        }

        setIntervaloRodando(false);
        setIntervaloFase("trabalho");
        setIntervaloRodadaAtual(1);
        dispararAlarmeTimer(1174.66, 4);
        return Math.max(5, Number(intervaloTrabalhoSeg) || 40);
      });
    }, 1000);

    return () => clearInterval(id);
  }, [
    intervaloRodando,
    intervaloFase,
    intervaloRodadaAtual,
    intervaloRodadasTotal,
    intervaloTrabalhoSeg,
    intervaloDescansoSeg,
  ]);

  function aplicarAtalhoTimer(seg) {
    pararSomAlarme();
    const { h, m, s } = segParaHMS(seg);
    setTimerHoras(h);
    setTimerMinutos(m);
    setTimerSegundos(s);
    setTimerRestante(seg);
    setTimerRodando(true);
  }

  function iniciarOuPausarTimer() {
    pararSomAlarme();
    if (timerRodando) {
      setTimerRodando(false);
      return;
    }
    const base = timerRestante > 0 ? timerRestante : totalConfigTimerSeg;
    if (base <= 0) return;
    setTimerRestante(base);
    setTimerRodando(true);
  }

  function resetarTimer() {
    pararSomAlarme();
    timerEstavaRodandoRef.current = false;
    setTimerRodando(false);
    setTimerRestante(totalConfigTimerSeg);
  }

  function acionarDescansoDeExercicio(seg) {
    const safeSeg = Math.max(5, Number(seg) || 60);
    setDataSelecionada(hojeISO);
    setAbaAtiva("timer");
    setModoTempo("timer");
    setIntervaloRodando(false);
    const { h, m, s } = segParaHMS(safeSeg);
    setTimerHoras(h);
    setTimerMinutos(m);
    setTimerSegundos(s);
    setTimerRestante(safeSeg);
    pararSomAlarme();
    setTimerRodando(true);
  }

  function abrirPagina(pagina) {
    setModoFocoLimpo(false);
    if (pagina === "timer") setDataSelecionada(hojeISO);
    setAbaAtiva(pagina);
    setMenuAberto(false);
  }

  function abrirCalculadoraMenu() {
    setModoFocoLimpo(false);
    setCalcAberta(true);
    setAbaAtiva("hoje");
    setMenuAberto(false);
    setTimeout(() => {
      calcRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  }

  function abrirBackupMenu() {
    setModoFocoLimpo(false);
    setAbaAtiva("dashboard");
    setMenuAberto(false);
    setTimeout(() => {
      backupRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 80);
  }

  function resetarDados() {
    const mapasDiarios = [
      logsPorData, observacoes, duracaoPorData, tempoAtivoPorData, aquecimentoPorData,
      estadoDiaPorData, checklistPorData, sinaisCorpoPorData, sonoPorData,
      motivoSemTreinoPorData, refeicoesFeitasPorData, refeicaoLivrePorData,
      janelaTreinoPorData, cafeinaPorData, cardioPorData, mochilaMarcadaPorData, aguaPorData,
    ];
    const existeHistoricoFechado = mapasDiarios.some((mapa) =>
      Object.entries(mapa || {}).some(([dataISO, valor]) => {
        if (dataISO === hojeISO) return false;
        if (Array.isArray(valor)) return valor.length > 0;
        if (valor && typeof valor === "object") return Object.keys(valor).length > 0;
        return valor !== undefined && valor !== null && valor !== "" && valor !== 0 && valor !== false;
      })
    );
    if (existeHistoricoFechado) {
      window.alert("O histórico de dias fechados não pode ser apagado. O reset geral foi cancelado.");
      return;
    }
    pararSomAlarme();
    setCronometroRodando(false);
    setTimerRodando(false);
    setIntervaloRodando(false);
    setTimerRestante(0);
    setRotina(ROTINA_INICIAL);
    setFocoDiasPorChave({});
    setPresets(PRESETS_INICIAIS);
    setLogsPorData({});
    setObservacoes({});
    setDuracaoPorData({});
    setTempoAtivoPorData({});
    setAquecimentoPorData({});
    setEstadoDiaPorData({});
    setChecklistPorData({});
    setSinaisCorpoPorData({});
    setSonoPorData({});
    setMotivoSemTreinoPorData({});
    setRefeicoesModelos(REFEICOES_PADRAO_INICIAIS);
    setRefeicoesFeitasPorData({});
    setRefeicaoLivrePorData({});
    setJanelaTreinoPorData({});
    setCafeinaPorData({});
    setCardioPorData({});
    setSuplementos([]);
    setItensMochila(MOCHILA_PADRAO_INICIAIS);
    setMochilaMarcadaPorData({});
    setMetaTreinosSemana(4);
    setUltimoBackupISO(null);
    setPesoKg(75);
    setAguaPorData({});
    setMetaTreinosMes(16);
    setDataSelecionada(hojeISO);
    setExercicioHistoricoAberto(null);
    setEditandoId(null);
    setMenuAberto(false);
  }

  const diaPodeEditar = dataSelecionada === hojeISO;
  const chaveDia = getChaveDiaDaData(dataSelecionada);
  const infoDia = DIAS_SEMANA.find((d) => d.chave === chaveDia);
  const [anoSel, mesSel, diaSel] = dataSelecionada.split("-").map(Number);

  const janelaDias = useMemo(
    () => getJanelaDiasEmVolta(dataSelecionada, hojeISO),
    [dataSelecionada, hojeISO]
  );

  const baseDia = rotina[chaveDia] || [];
  const logsDia = logsPorData[dataSelecionada] || {};
  const aquecimentoDia = aquecimentoPorData[dataSelecionada] || { feito: false, minutos: 5 };
  const estadoDia = estadoDiaPorData[dataSelecionada] || "normal";
  const checklistDia = checklistPorData[dataSelecionada] || {
    agua: false,
    aquecimento: false,
    foco: false,
  };
  const sinaisDia = sinaisCorpoPorData[dataSelecionada] || [];
  const sonoDia = sonoPorData[dataSelecionada] || "";
  const motivoSemTreinoDia = motivoSemTreinoPorData[dataSelecionada] || "";
  const refeicoesFeitasDia = refeicoesFeitasPorData[dataSelecionada] || [];
  const refeicaoLivreDia = Boolean(refeicaoLivrePorData[dataSelecionada]);
  const janelaTreinoDia = janelaTreinoPorData[dataSelecionada] || { pre: false, pos: false };
  const cafeinaDia = cafeinaPorData[dataSelecionada] || [];
  const cardioDia = cardioPorData[dataSelecionada] || [];
  const mochilaMarcadaDia = mochilaMarcadaPorData[dataSelecionada] || [];

  const exercicios = baseDia.map((ex) => ({
    ...ex,
    cargaAtual: logsDia[ex.id]?.carga ?? ex.carga,
    feito: Boolean(logsDia[ex.id]?.feito),
    esforcoNota: logsDia[ex.id]?.esforcoNota || "",
  }));

  const proximoExercicio = exercicios.find((ex) => !ex.feito) || exercicios[0] || null;
  const concluidosHoje = exercicios.filter((e) => e.feito).length;
  const duracaoSessaoSeg = Number(duracaoPorData[dataSelecionada] || 0);
  const tempoAtivoSeg = Number(tempoAtivoPorData[dataSelecionada] ?? duracaoSessaoSeg);
  const tempoDescansoSeg = Math.max(0, duracaoSessaoSeg - tempoAtivoSeg);

  const volumeSessaoKg = useMemo(() => {
    return exercicios.reduce(
      (total, ex) => total + calcularVolumeExercicio(logsDia[ex.id]?.seriesReps ?? ex.seriesReps, ex.cargaAtual),
      0
    );
  }, [exercicios]);

  const metaAguaMl = Math.max(1000, Math.round((Number(pesoKg) || 0) * 35));
  const aguaHojeMl = Number(aguaPorData[dataSelecionada] || 0);
  const aguaPct = Math.min(100, Math.round((aguaHojeMl / metaAguaMl) * 100));

  const resultadoAnilhas = useMemo(
    () => calcularAnilhasPorLado(calcPesoTotal, calcPesoBarra),
    [calcPesoTotal, calcPesoBarra]
  );

  // Última sessão parecida (mesmo dia da semana anterior com registros)
  const ultimoTreinoParecido = useMemo(() => {
    const datasOrdenadas = Object.keys(logsPorData)
      .filter((d) => d < dataSelecionada && getChaveDiaDaData(d) === chaveDia)
      .sort((a, b) => b.localeCompare(a));

    const dataRef = datasOrdenadas[0];
    if (!dataRef) return null;

    const cargasMap = {};
    Object.values(logsPorData[dataRef] || {}).forEach((reg) => {
      if (reg?.nome) {
        cargasMap[reg.nome.trim().toLowerCase()] = {
          carga: Number(reg.carga) || 0,
          esforcoNota: reg.esforcoNota || "",
        };
      }
    });

    return {
      dataISO: dataRef,
      obs: observacoes[dataRef] || "",
      cargasMap,
    };
  }, [logsPorData, dataSelecionada, chaveDia, observacoes]);

  function duplicarUltimoTreinoParecido() {
    if (!diaPodeEditar) return;
    if (!ultimoTreinoParecido) return;

    setLogsPorData((prev) => {
      const atualDia = { ...(prev[dataSelecionada] || {}) };
      baseDia.forEach((ex) => {
        const refEx = ultimoTreinoParecido.cargasMap[ex.nome.trim().toLowerCase()];
        if (refEx) {
          atualDia[ex.id] = {
            ...(atualDia[ex.id] || {}),
            exercicioId: ex.id,
            nome: ex.nome,
            seriesReps: ex.seriesReps,
            carga: refEx.carga,
            feito: Boolean(atualDia[ex.id]?.feito),
            esforcoNota: atualDia[ex.id]?.esforcoNota || refEx.esforcoNota,
            dataISO: dataSelecionada,
          };
        }
      });
      return { ...prev, [dataSelecionada]: atualDia };
    });

    if (ultimoTreinoParecido.obs && !observacoes[dataSelecionada]) {
      setObservacoes((prev) => ({ ...prev, [dataSelecionada]: ultimoTreinoParecido.obs }));
    }
  }

  function definirEstadoDia(novoEstado) {
    if (!diaPodeEditar) return;
    setEstadoDiaPorData((prev) => ({
      ...prev,
      [dataSelecionada]: novoEstado,
    }));
  }

  function alternarChecklist(chaveItem) {
    if (!diaPodeEditar) return;
    setChecklistPorData((prev) => {
      const atual = prev[dataSelecionada] || { agua: false, aquecimento: false, foco: false };
      return {
        ...prev,
        [dataSelecionada]: {
          ...atual,
          [chaveItem]: !atual[chaveItem],
        },
      };
    });
  }

  function alternarSinalCorpo(sinal) {
    if (!diaPodeEditar) return;
    setSinaisCorpoPorData((prev) => {
      const lista = prev[dataSelecionada] || [];
      const existe = lista.includes(sinal);
      return {
        ...prev,
        [dataSelecionada]: existe ? lista.filter((item) => item !== sinal) : [...lista, sinal],
      };
    });
  }

  function selecionarSono(qualidade) {
    if (!diaPodeEditar) return;
    setSonoPorData((prev) => ({
      ...prev,
      [dataSelecionada]: prev[dataSelecionada] === qualidade ? "" : qualidade,
    }));
    if (qualidade === "Dormi pouco") {
      setEstadoDiaPorData((prev) => ({ ...prev, [dataSelecionada]: "cansado" }));
    }
  }

  function selecionarMotivoSemTreino(motivo) {
    if (!diaPodeEditar) return;
    setMotivoSemTreinoPorData((prev) => ({
      ...prev,
      [dataSelecionada]: prev[dataSelecionada] === motivo ? "" : motivo,
    }));
  }

  function alternarRefeicaoFeita(refId) {
    if (!diaPodeEditar) return;
    setRefeicoesFeitasPorData((prev) => {
      const lista = prev[dataSelecionada] || [];
      const existe = lista.includes(refId);
      return {
        ...prev,
        [dataSelecionada]: existe ? lista.filter((id) => id !== refId) : [...lista, refId],
      };
    });
  }

  function adicionarModeloRefeicao(e) {
    if (!diaPodeEditar) { e.preventDefault(); return; }
    e.preventDefault();
    const limpo = novoNomeRefeicao.trim();
    if (!limpo) return;
    setRefeicoesModelos((prev) => [...prev, { id: `ref-${Date.now()}`, nome: limpo }]);
    setNovoNomeRefeicao("");
  }

  function alternarJanelaTreino(campo) {
    if (!diaPodeEditar) return;
    setJanelaTreinoPorData((prev) => {
      const atual = prev[dataSelecionada] || { pre: false, pos: false };
      return {
        ...prev,
        [dataSelecionada]: {
          ...atual,
          [campo]: !atual[campo],
        },
      };
    });
  }

  function registrarCafeina() {
    if (!diaPodeEditar) return;
    const rotulo = (novoRotuloCafeina || "Café").trim();
    const hora = getHoraAtualHHMM();
    setCafeinaPorData((prev) => ({
      ...prev,
      [dataSelecionada]: [...(prev[dataSelecionada] || []), { id: Date.now(), rotulo, hora }],
    }));
  }

  function removerCafeina(id) {
    if (!diaPodeEditar) return;
    setCafeinaPorData((prev) => ({
      ...prev,
      [dataSelecionada]: (prev[dataSelecionada] || []).filter((item) => item.id !== id),
    }));
  }

  function adicionarCardio(e) {
    if (!diaPodeEditar) { e.preventDefault(); return; }
    e.preventDefault();
    const mins = Math.max(1, Number(novoMinCardio) || 0);
    if (!mins) return;
    setCardioPorData((prev) => ({
      ...prev,
      [dataSelecionada]: [
        ...(prev[dataSelecionada] || []),
        { id: Date.now(), tipo: novoTipoCardio, minutos: mins },
      ],
    }));
  }

  function removerCardio(id) {
    if (!diaPodeEditar) return;
    setCardioPorData((prev) => ({
      ...prev,
      [dataSelecionada]: (prev[dataSelecionada] || []).filter((item) => item.id !== id),
    }));
  }

  async function aoEscolherFotoSuplemento(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    try {
      const base64 = await comprimirImagemParaBase64(arquivo);
      setNovoSupFoto(base64);
      setAvisoSupFoto("");
    } catch {
      setAvisoSupFoto("Não foi possível carregar a imagem.");
    }
    e.target.value = "";
  }

  function adicionarSuplemento(e) {
    e.preventDefault();
    const nomeLimpo = novoSupNome.trim();
    if (!nomeLimpo) return;
    setSuplementos((prev) => [
      {
        id: `sup-${Date.now()}`,
        nome: nomeLimpo,
        dose: novoSupDose.trim(),
        detalhe: novoSupDetalhe.trim(),
        status: novoSupStatus,
        fotoDataUrl: novoSupFoto,
      },
      ...prev,
    ]);
    setNovoSupNome("");
    setNovoSupDose("");
    setNovoSupDetalhe("");
    setNovoSupStatus("Ativo");
    setNovoSupFoto("");
    setAvisoSupFoto("");
    setFormSuplementoAberto(false);
  }

  function alterarStatusSuplemento(id, novoStatus) {
    setSuplementos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: novoStatus } : item))
    );
  }

  function removerSuplemento(id) {
    setSuplementos((prev) => prev.filter((item) => item.id !== id));
  }

  function alternarItemMochila(itemId) {
    if (!diaPodeEditar) return;
    setMochilaMarcadaPorData((prev) => {
      const lista = prev[dataSelecionada] || [];
      const existe = lista.includes(itemId);
      return {
        ...prev,
        [dataSelecionada]: existe ? lista.filter((id) => id !== itemId) : [...lista, itemId],
      };
    });
  }

  function adicionarItemMochila(e) {
    if (!diaPodeEditar) { e.preventDefault(); return; }
    e.preventDefault();
    const limpo = novoItemMochila.trim();
    if (!limpo) return;
    setItensMochila((prev) => [...prev, { id: `moch-${Date.now()}`, nome: limpo }]);
    setNovoItemMochila("");
  }

  function removerItemMochila(id) {
    if (!diaPodeEditar) return;
    setItensMochila((prev) => prev.filter((item) => item.id !== id));
  }

  function duplicarDiaNaSemana() {
    if (diaOrigemSemanaCopia === diaDestinoSemanaCopia) return;
    const origem = rotina[diaOrigemSemanaCopia] || [];
    if (origem.length === 0) return;
    const copias = origem.map((item, idx) => ({
      ...item,
      id: Date.now() + idx + Math.random(),
    }));
    setRotina((prev) => ({
      ...prev,
      [diaDestinoSemanaCopia]: copias,
    }));
    if (focoDiasPorChave[diaOrigemSemanaCopia]) {
      setFocoDiasPorChave((prev) => ({
        ...prev,
        [diaDestinoSemanaCopia]: prev[diaOrigemSemanaCopia],
      }));
    }
  }

  function limparDiaRotina(chaveAlvo) {
    setRotina((prev) => ({
      ...prev,
      [chaveAlvo]: [],
    }));
  }

  function remanejarTreinoParaProximoDia() {
    const listaAtual = rotina[chaveDia] || [];
    if (listaAtual.length === 0) return;

    const idxAtual = DIAS_SEMANA.findIndex((d) => d.chave === chaveDia);
    const proximoDia = DIAS_SEMANA[(idxAtual + 1) % DIAS_SEMANA.length];

    const copias = listaAtual.map((item, idx) => ({
      ...item,
      id: Date.now() + idx + Math.random(),
    }));

    setRotina((prev) => ({
      ...prev,
      [chaveDia]: [],
      [proximoDia.chave]: [...(prev[proximoDia.chave] || []), ...copias],
    }));
  }

  function alterarCarga(ex, delta) {
    if (!diaPodeEditar) return;
    const atual = logsDia[ex.id]?.carga ?? ex.carga;
    setLogsPorData((prev) => ({
      ...prev,
      [dataSelecionada]: {
        ...(prev[dataSelecionada] || {}),
        [ex.id]: {
          ...(prev[dataSelecionada]?.[ex.id] || {}),
          exercicioId: ex.id,
          nome: ex.nome,
          seriesReps: ex.seriesReps,
          carga: Math.max(0, atual + delta),
          feito: Boolean(prev[dataSelecionada]?.[ex.id]?.feito),
          dataISO: dataSelecionada,
        },
      },
    }));
  }

  function atualizarEsforcoExercicio(ex, valor) {
    if (!diaPodeEditar) return;
    setLogsPorData((prev) => ({
      ...prev,
      [dataSelecionada]: {
        ...(prev[dataSelecionada] || {}),
        [ex.id]: {
          ...(prev[dataSelecionada]?.[ex.id] || {}),
          exercicioId: ex.id,
          nome: ex.nome,
          seriesReps: ex.seriesReps,
          carga: logsDia[ex.id]?.carga ?? ex.carga,
          feito: Boolean(prev[dataSelecionada]?.[ex.id]?.feito),
          esforcoNota: valor,
          dataISO: dataSelecionada,
        },
      },
    }));
  }

  function alternarFeito(ex) {
    if (!diaPodeEditar) return;
    const atual = logsDia[ex.id];
    const vaiConcluir = !atual?.feito;
    setLogsPorData((prev) => ({
      ...prev,
      [dataSelecionada]: {
        ...(prev[dataSelecionada] || {}),
        [ex.id]: {
          ...(atual || {}),
          exercicioId: ex.id,
          nome: ex.nome,
          seriesReps: ex.seriesReps,
          carga: atual?.carga ?? ex.carga,
          feito: vaiConcluir,
          dataISO: dataSelecionada,
        },
      },
    }));

    if (vaiConcluir && ex.descanso) {
      acionarDescansoDeExercicio(ex.descanso);
    }
  }

  function somarAgua(ml) {
    if (!diaPodeEditar) return;
    setAguaPorData((prev) => ({
      ...prev,
      [dataSelecionada]: Math.max(0, (Number(prev[dataSelecionada]) || 0) + ml),
    }));
  }

  function adicionarAguaDigitada(e) {
    e?.preventDefault?.();
    if (!diaPodeEditar) return;
    const quantidade = Number(String(aguaEntradaMl).replace(",", "."));
    if (!Number.isFinite(quantidade) || quantidade <= 0) return;
    somarAgua(Math.round(quantidade));
    setAguaEntradaMl("");
  }

  function adicionarExercicio(e) {
    e.preventDefault();
    if (!novoNome.trim()) return;
    setRotina((prev) => ({
      ...prev,
      [diaMontagem]: [
        ...(prev[diaMontagem] || []),
        {
          id: Date.now() + Math.random(),
          nome: novoNome.trim(),
          seriesReps: novoSeriesReps.trim() || "4x10",
          descanso: Math.max(5, Number(novoDescanso) || 60),
          carga: Math.max(0, Number(novoCarga) || 0),
        },
      ],
    }));
    setNovoNome("");
  }

  function iniciarEdicao(item) {
    setEditandoId(item.id);
    setEditForm({
      nome: item.nome,
      seriesReps: item.seriesReps,
      descanso: item.descanso,
      carga: item.carga,
    });
  }

  function salvarEdicao(dia, id) {
    if (!editForm.nome.trim()) return;
    setRotina((prev) => ({
      ...prev,
      [dia]: (prev[dia] || []).map((item) =>
        item.id === id
          ? {
              ...item,
              nome: editForm.nome.trim(),
              seriesReps: editForm.seriesReps.trim() || "4x10",
              descanso: Math.max(5, Number(editForm.descanso) || 60),
              carga: Math.max(0, Number(editForm.carga) || 0),
            }
          : item
      ),
    }));
    setEditandoId(null);
  }

  function moverExercicio(dia, index, direcao) {
    const lista = [...(rotina[dia] || [])];
    const alvo = index + direcao;
    if (alvo < 0 || alvo >= lista.length) return;
    const temp = lista[index];
    lista[index] = lista[alvo];
    lista[alvo] = temp;
    setRotina((prev) => ({ ...prev, [dia]: lista }));
  }

  function copiarTreinoDeOutroDia() {
    if (diaOrigemCopia === diaMontagem) return;
    const origem = rotina[diaOrigemCopia] || [];
    if (origem.length === 0) return;

    const copias = origem.map((item, idx) => ({
      ...item,
      id: Date.now() + idx + Math.random(),
    }));

    setRotina((prev) => ({
      ...prev,
      [diaMontagem]:
        modoAplicacaoRotina === "substituir" ? copias : [...(prev[diaMontagem] || []), ...copias],
    }));
  }

  function salvarPresetDoDia() {
    const lista = rotina[diaMontagem] || [];
    const nomeLimpo = novoPresetNome.trim();
    if (!nomeLimpo || lista.length === 0) return;

    const novo = {
      id: `preset-${Date.now()}`,
      nome: nomeLimpo,
      exercicios: lista.map(({ nome, seriesReps, descanso, carga }) => ({
        nome,
        seriesReps,
        descanso,
        carga,
      })),
    };

    setPresets((prev) => [novo, ...prev]);
    setPresetSelecionadoId(novo.id);
    setNovoPresetNome("");
  }

  function aplicarPresetNoDia() {
    const preset = presets.find((p) => p.id === presetSelecionadoId);
    if (!preset) return;
    const itens = preset.exercicios.map((ex, idx) => ({
      ...ex,
      id: Date.now() + idx + Math.random(),
    }));
    setRotina((prev) => ({
      ...prev,
      [diaMontagem]:
        modoAplicacaoRotina === "substituir" ? itens : [...(prev[diaMontagem] || []), ...itens],
    }));
  }

  function removerExercicio(dia, id) {
    if (editandoId === id) setEditandoId(null);
    setRotina((prev) => ({
      ...prev,
      [dia]: (prev[dia] || []).filter((item) => item.id !== id),
    }));
  }

  const { historicoPorExercicio, recordePorExercicio } = useMemo(() => {
    const histMapa = {};
    const prMapa = {};

    Object.entries(logsPorData).forEach(([dataISO, registros]) => {
      Object.values(registros || {}).forEach((item) => {
        if (!item?.nome) return;
        const chave = item.nome.trim().toLowerCase();
        const cargaNum = Number(item.carga) || 0;
        if (!histMapa[chave]) histMapa[chave] = [];
        histMapa[chave].push({
          dataISO: item.dataISO || dataISO,
          carga: cargaNum,
          feito: Boolean(item.feito),
          esforcoNota: item.esforcoNota || "",
        });
        if (cargaNum > (prMapa[chave] ?? -1)) {
          prMapa[chave] = cargaNum;
        }
      });
    });

    Object.keys(histMapa).forEach((chave) => {
      histMapa[chave].sort((a, b) => b.dataISO.localeCompare(a.dataISO));
    });

    return { historicoPorExercicio: histMapa, recordePorExercicio: prMapa };
  }, [logsPorData]);

  const comparadorMelhorDia = useMemo(() => {
    let melhorVolume = 0;
    let melhorData = null;

    Object.entries(logsPorData).forEach(([dataISO, mapa]) => {
      if (dataISO === dataSelecionada) return;
      const ch = getChaveDiaDaData(dataISO);
      const lista = rotina[ch] || [];
      const vol = Object.entries(mapa || {}).reduce((soma, [id, reg]) => {
        if (!reg?.feito) return soma;
        const ex = lista.find((item) => String(item.id) === String(id));
        return soma + calcularVolumeExercicio(reg.seriesReps ?? ex?.seriesReps ?? "0x0", reg.carga ?? ex?.carga ?? 0);
      }, 0);

      if (vol > melhorVolume) {
        melhorVolume = vol;
        melhorData = dataISO;
      }
    });

    if (!melhorData || melhorVolume <= 0) return null;
    const diff = volumeSessaoKg - melhorVolume;
    return { melhorData, melhorVolume, diff };
  }, [logsPorData, dataSelecionada, rotina, volumeSessaoKg]);

  const dashboardData = useMemo(() => {
    const feitos = [];
    const datasConcluidasSet = new Set();

    Object.entries(logsPorData).forEach(([dataISO, mapa]) => {
      Object.values(mapa || {}).forEach((item) => {
        if (item?.feito) {
          const dataItem = item.dataISO || dataISO;
          datasConcluidasSet.add(dataItem);
          feitos.push({
            ...item,
            dataISO: dataItem,
            diaChave: getChaveDiaDaData(dataItem),
            carga: Number(item.carga) || 0,
          });
        }
      });
    });

    const mesAtual = hojeISO.slice(0, 7);
    const treinosMes = new Set(
      feitos.filter((l) => l.dataISO.startsWith(mesAtual)).map((l) => l.dataISO)
    ).size;

    const metaMensalSegura = Math.max(1, Number(metaTreinosMes) || 1);
    const metaMensalPct = Math.min(100, Math.round((treinosMes / metaMensalSegura) * 100));

    let maiorCarga = null;
    feitos.forEach((l) => {
      if (!maiorCarga || l.carga > maiorCarga.carga) maiorCarga = l;
    });

    const datas = Array.from(datasConcluidasSet).sort();
    let streak = 0;
    if (datas.length > 0) {
      streak = 1;
      for (let i = datas.length - 1; i > 0; i--) {
        const d1 = new Date(datas[i] + "T12:00:00");
        const d2 = new Date(datas[i - 1] + "T12:00:00");
        if (Math.round((d1 - d2) / 86400000) === 1) streak += 1;
        else break;
      }
    }

    const foguinhoAtivo = datasConcluidasSet.has(hojeISO);

    const corte = new Date(hojeISO + "T12:00:00");
    if (periodoFiltro === "4w") corte.setDate(corte.getDate() - 28);
    if (periodoFiltro === "3m") corte.setMonth(corte.getMonth() - 3);

    const historico = feitos
      .filter((l) => (periodoFiltro === "all" ? true : new Date(l.dataISO + "T12:00:00") >= corte))
      .filter((l) => (diaSemanaFiltro === "TODOS" ? true : l.diaChave === diaSemanaFiltro))
      .filter((l) => (exercicioFiltro === "TODOS" ? true : l.nome === exercicioFiltro))
      .sort((a, b) => a.dataISO.localeCompare(b.dataISO));

    const exerciciosNomes = Array.from(new Set(feitos.map((l) => l.nome)));
    const maxCarga = Math.max(10, ...historico.map((h) => h.carga));

    const agua7Dias = [];
    const atividade7Dias = [];
    let somaAgua7Dias = 0;
    let volume7dAtual = 0;
    let volume7dAnterior = 0;
    let treinos7d = 0;
    let diasSonoRuim7d = 0;
    let minCardio7d = 0;

    const baseHoje = new Date(hojeISO + "T12:00:00");
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseHoje);
      d.setDate(baseHoje.getDate() - i);
      const iso = formatarDataISO(d);
      const ml = Number(aguaPorData[iso] || 0);
      somaAgua7Dias += ml;
      agua7Dias.push({ dataISO: iso, rotulo: iso.slice(5), ml });

      if (sonoPorData[iso] === "Dormi pouco") diasSonoRuim7d += 1;
      const treinoFeito = datasConcluidasSet.has(iso);
      if (treinoFeito) treinos7d += 1;

      const cardioDiaMin = (cardioPorData[iso] || []).reduce((soma, c) => soma + (Number(c.minutos) || 0), 0);
      minCardio7d += cardioDiaMin;
      const refeicoesDiaQtd = (refeicoesFeitasPorData[iso] || []).length + (refeicaoLivrePorData[iso] ? 1 : 0);
      const cafeinaDiaQtd = (cafeinaPorData[iso] || []).length;
      const mochilaDiaQtd = (mochilaMarcadaPorData[iso] || []).length;
      const mochilaPct = itensMochila.length ? Math.round((mochilaDiaQtd / itensMochila.length) * 100) : 0;
      const duracaoMin = Math.round((Number(tempoAtivoPorData[iso] ?? duracaoPorData[iso] ?? 0)) / 60);
      const aquecimentoFeito = Boolean(aquecimentoPorData[iso]?.feito);
      const sinaisDiaQtd = (sinaisCorpoPorData[iso] || []).length;

      const ch = getChaveDiaDaData(iso);
      const mapaDia = logsPorData[iso] || {};
      let volumeDia = 0;
      Object.entries(mapaDia).forEach(([id, reg]) => {
        if (!reg?.feito) return;
        const ex = (rotina[ch] || []).find((item) => String(item.id) === String(id));
        const volumeEx = calcularVolumeExercicio(reg.seriesReps ?? ex?.seriesReps ?? "0x0", reg.carga ?? ex?.carga ?? 0);
        volume7dAtual += volumeEx;
        volumeDia += volumeEx;
      });
      atividade7Dias.push({
        dataISO: iso,
        rotulo: iso.slice(5),
        aguaMl: ml,
        treino: treinoFeito,
        volumeKg: Math.round(volumeDia),
        cardioMin: cardioDiaMin,
        refeicoes: refeicoesDiaQtd,
        cafeina: cafeinaDiaQtd,
        mochilaPct,
        sono: sonoPorData[iso] || "Não registrado",
        duracaoMin,
        aquecimento: aquecimentoFeito,
        sinais: sinaisDiaQtd,
      });
    }

    for (let i = 7; i < 14; i++) {
      const d = new Date(baseHoje);
      d.setDate(baseHoje.getDate() - i);
      const iso = formatarDataISO(d);
      const ch = getChaveDiaDaData(iso);
      const mapaDia = logsPorData[iso] || {};
      Object.entries(mapaDia).forEach(([id, reg]) => {
        if (!reg?.feito) return;
        const ex = (rotina[ch] || []).find((item) => String(item.id) === String(id));
        volume7dAnterior += calcularVolumeExercicio(reg.seriesReps ?? ex?.seriesReps ?? "0x0", reg.carga ?? ex?.carga ?? 0);
      });
    }

    const mediaAgua7DiasMl = Math.round(somaAgua7Dias / 7);
    const diffVolumeSemanal = volume7dAtual - volume7dAnterior;
    const pctVolumeSemanal =
      volume7dAnterior > 0 ? Math.round((diffVolumeSemanal / volume7dAnterior) * 100) : null;

    const metaSemanalSegura = Math.max(1, Number(metaTreinosSemana) || 1);
    const metaSemanalPct = Math.min(100, Math.round((treinos7d / metaSemanalSegura) * 100));

    const estagnados = [];
    Object.entries(historicoPorExercicio).forEach(([chave, lista]) => {
      const feitosLista = lista.filter((item) => item.feito);
      if (feitosLista.length >= 3) {
        const ultimas3 = feitosLista.slice(0, 3);
        const todasIguaisOuCaindo =
          ultimas3[0].carga <= ultimas3[2].carga && ultimas3[0].carga === ultimas3[1].carga;
        if (todasIguaisOuCaindo) {
          estagnados.push({
            nome: ultimas3[0].esforcoNota ? `${chave} (${ultimas3[0].esforcoNota})` : chave,
            carga: ultimas3[0].carga,
          });
        }
      }
    });

    const contagemSinais = {};
    Object.values(sinaisCorpoPorData).forEach((lista) => {
      (lista || []).forEach((s) => {
        contagemSinais[s] = (contagemSinais[s] || 0) + 1;
      });
    });

    let diasSemBackup = null;
    if (ultimoBackupISO) {
      const dBackup = new Date(ultimoBackupISO + "T12:00:00");
      const dHoje = new Date(hojeISO + "T12:00:00");
      diasSemBackup = Math.max(0, Math.round((dHoje - dBackup) / 86400000));
    }

    return {
      treinosMes,
      metaMensalSegura,
      metaMensalPct,
      metaSemanalSegura,
      metaSemanalPct,
      maiorCarga,
      streak,
      foguinhoAtivo,
      datasConcluidasSet,
      historico,
      exerciciosNomes,
      maxCarga,
      mediaAgua7DiasMl,
      agua7Dias,
      atividade7Dias,
      refeicoes7d: atividade7Dias.reduce((soma, d) => soma + d.refeicoes, 0),
      cafeina7d: atividade7Dias.reduce((soma, d) => soma + d.cafeina, 0),
      mochilaMedia7d: Math.round(atividade7Dias.reduce((soma, d) => soma + d.mochilaPct, 0) / 7),
      suplementosAtivos: suplementos.filter((item) => item.status === "Ativo").length,
      volume7dAtual,
      diffVolumeSemanal,
      pctVolumeSemanal,
      treinos7d,
      diasSonoRuim7d,
      minCardio7d,
      estagnados,
      contagemSinais,
      diasSemBackup,
    };
  }, [
    logsPorData,
    hojeISO,
    periodoFiltro,
    diaSemanaFiltro,
    exercicioFiltro,
    metaTreinosMes,
    metaTreinosSemana,
    aguaPorData,
    sonoPorData,
    cardioPorData,
    refeicoesFeitasPorData,
    refeicaoLivrePorData,
    cafeinaPorData,
    mochilaMarcadaPorData,
    itensMochila,
    tempoAtivoPorData,
    duracaoPorData,
    aquecimentoPorData,
    suplementos,
    rotina,
    historicoPorExercicio,
    sinaisCorpoPorData,
    ultimoBackupISO,
  ]);

  const notas = useMemo(() => {
    const q = buscaNota.trim().toLowerCase();
    return Object.entries(observacoes)
      .filter(([, txt]) => txt && txt.trim())
      .map(([dataISO, texto]) => ({ dataISO, texto }))
      .filter((n) => (!q ? true : n.texto.toLowerCase().includes(q) || n.dataISO.includes(q)))
      .sort((a, b) => b.dataISO.localeCompare(a.dataISO));
  }, [observacoes, buscaNota]);

  function montarResumoTexto() {
    const nomesRefFeitas = refeicoesModelos
      .filter((r) => refeicoesFeitasDia.includes(r.id))
      .map((r) => r.nome);

    const linhas = [
      `CAVEIRA • ${infoDia?.nome || chaveDia} (${dataSelecionada})`,
      `Tempo: ${formatarDuracao(duracaoSessaoSeg)} (Ativo: ${formatarDuracao(tempoAtivoSeg)}) • Volume: ${volumeSessaoKg.toLocaleString("pt-BR")} kg • Água: ${aguaHojeMl} ml`,
      ...(sonoDia ? [`Sono: ${sonoDia}`] : []),
      ...(nomesRefFeitas.length > 0 ? [`Refeições: ${nomesRefFeitas.join(", ")}`] : []),
      ...(refeicaoLivreDia ? ["Refeição fora / livre: Sim"] : []),
      ...(cafeinaDia.length > 0
        ? [`Cafeína: ${cafeinaDia.map((c) => `${c.rotulo} (${c.hora})`).join(", ")}`]
        : []),
      ...(cardioDia.length > 0
        ? [`Cardio/extra: ${cardioDia.map((c) => `${c.tipo} ${c.minutos}min`).join(", ")}`]
        : []),
      ...(exercicios.length > 0
        ? exercicios.map(
            (ex) =>
              `${ex.feito ? "[x]" : "[ ]"} ${ex.nome} (${ex.seriesReps}) — ${ex.cargaAtual}kg${
                ex.esforcoNota ? ` • ${ex.esforcoNota}` : ""
              }`
          )
        : [motivoSemTreinoDia ? `Sem treino: ${motivoSemTreinoDia}` : "Dia de descanso"]),
      ...(observacoes[dataSelecionada]?.trim() ? [`Obs: ${observacoes[dataSelecionada].trim()}`] : []),
    ];
    return linhas.join("\n");
  }

  async function copiarResumoDoDia() {
    const resumoTxt = montarResumoTexto();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(resumoTxt);
        setStatusResumo("Resumo copiado.");
        return;
      }
    } catch {
      // ignora
    }
    setStatusResumo(resumoTxt);
  }

  async function concluirSessaoComResumo() {
    if (!diaPodeEditar) return;
    setCronometroRodando(false);
    setTimerRodando(false);
    setIntervaloRodando(false);
    pararSomAlarme();
    const resumoTxt = montarResumoTexto();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(resumoTxt);
        setStatusResumo(`Sessão concluída e resumo copiado.\n${resumoTxt}`);
        return;
      }
    } catch {
      // ignora
    }
    setStatusResumo(`Sessão concluída.\n${resumoTxt}`);
  }

  function gerarJsonBackup() {
    return JSON.stringify(
      {
        versao: 6,
        exportadoEm: new Date().toISOString(),
        rotina,
        focoDiasPorChave,
        presets,
        logsPorData,
        observacoes,
        duracaoPorData,
        tempoAtivoPorData,
        aquecimentoPorData,
        estadoDiaPorData,
        checklistPorData,
        sinaisCorpoPorData,
        sonoPorData,
        motivoSemTreinoPorData,
        refeicoesModelos,
        refeicoesFeitasPorData,
        refeicaoLivrePorData,
        janelaTreinoPorData,
        cafeinaPorData,
        cardioPorData,
        suplementos,
        itensMochila,
        mochilaMarcadaPorData,
        metaTreinosSemana: Number(metaTreinosSemana) || 4,
        ultimoBackupISO: hojeISO,
        pesoKg: Number(pesoKg) || 75,
        aguaPorData,
        metaTreinosMes: Number(metaTreinosMes) || 16,
        registrosPR,
        medidasCorporais,
        metasPessoais,
      },
      null,
      2
    );
  }

  async function copiarBackupJSON() {
    const json = gerarJsonBackup();
    setTextoBackup(json);
    setUltimoBackupISO(hojeISO);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(json);
        setStatusBackup("Backup copiado.");
      } else {
        setStatusBackup("JSON gerado no campo abaixo.");
      }
    } catch {
      setStatusBackup("JSON gerado no campo abaixo.");
    }
  }

  function baixarBackupJSON() {
    const json = gerarJsonBackup();
    setTextoBackup(json);
    setUltimoBackupISO(hojeISO);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `caveira-backup-${hojeISO}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusBackup("Arquivo JSON baixado.");
  }

  function aplicarObjetoBackup(parsed) {
    if (!parsed || typeof parsed !== "object") {
      setStatusBackup("JSON inválido.");
      return;
    }
    const mapasDiariosBackup = [
      ["logsPorData", logsPorData], ["observacoes", observacoes],
      ["duracaoPorData", duracaoPorData], ["tempoAtivoPorData", tempoAtivoPorData],
      ["aquecimentoPorData", aquecimentoPorData], ["estadoDiaPorData", estadoDiaPorData],
      ["checklistPorData", checklistPorData], ["sinaisCorpoPorData", sinaisCorpoPorData],
      ["sonoPorData", sonoPorData], ["motivoSemTreinoPorData", motivoSemTreinoPorData],
      ["refeicoesFeitasPorData", refeicoesFeitasPorData], ["refeicaoLivrePorData", refeicaoLivrePorData],
      ["janelaTreinoPorData", janelaTreinoPorData], ["cafeinaPorData", cafeinaPorData],
      ["cardioPorData", cardioPorData], ["mochilaMarcadaPorData", mochilaMarcadaPorData],
      ["aguaPorData", aguaPorData],
    ];
    for (const [campo, atual] of mapasDiariosBackup) {
      if (!parsed[campo] || typeof parsed[campo] !== "object") continue;
      const datas = new Set([...Object.keys(atual || {}), ...Object.keys(parsed[campo] || {})]);
      for (const dataISO of datas) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dataISO) || dataISO === hojeISO) continue;
        const anterior = JSON.stringify((atual || {})[dataISO] ?? null);
        const recebido = JSON.stringify((parsed[campo] || {})[dataISO] ?? null);
        if (anterior !== recebido) {
          setStatusBackup(`Backup recusado: ${dataISO} está fechado. A restauração não pode alterar dias anteriores ou futuros.`);
          return;
        }
      }
    }
    if (parsed.rotina && typeof parsed.rotina === "object") setRotina(parsed.rotina);
    if (parsed.focoDiasPorChave && typeof parsed.focoDiasPorChave === "object") {
      setFocoDiasPorChave(parsed.focoDiasPorChave);
    }
    if (Array.isArray(parsed.presets)) setPresets(parsed.presets);
    if (parsed.logsPorData && typeof parsed.logsPorData === "object") setLogsPorData(parsed.logsPorData);
    if (parsed.observacoes && typeof parsed.observacoes === "object") setObservacoes(parsed.observacoes);
    if (parsed.duracaoPorData && typeof parsed.duracaoPorData === "object") setDuracaoPorData(parsed.duracaoPorData);
    if (parsed.tempoAtivoPorData && typeof parsed.tempoAtivoPorData === "object") {
      setTempoAtivoPorData(parsed.tempoAtivoPorData);
    }
    if (parsed.aquecimentoPorData && typeof parsed.aquecimentoPorData === "object") {
      setAquecimentoPorData(parsed.aquecimentoPorData);
    }
    if (parsed.estadoDiaPorData && typeof parsed.estadoDiaPorData === "object") {
      setEstadoDiaPorData(parsed.estadoDiaPorData);
    }
    if (parsed.checklistPorData && typeof parsed.checklistPorData === "object") {
      setChecklistPorData(parsed.checklistPorData);
    }
    if (parsed.sinaisCorpoPorData && typeof parsed.sinaisCorpoPorData === "object") {
      setSinaisCorpoPorData(parsed.sinaisCorpoPorData);
    }
    if (parsed.sonoPorData && typeof parsed.sonoPorData === "object") {
      setSonoPorData(parsed.sonoPorData);
    }
    if (parsed.motivoSemTreinoPorData && typeof parsed.motivoSemTreinoPorData === "object") {
      setMotivoSemTreinoPorData(parsed.motivoSemTreinoPorData);
    }
    if (Array.isArray(parsed.refeicoesModelos)) {
      setRefeicoesModelos(parsed.refeicoesModelos);
    }
    if (parsed.refeicoesFeitasPorData && typeof parsed.refeicoesFeitasPorData === "object") {
      setRefeicoesFeitasPorData(parsed.refeicoesFeitasPorData);
    }
    if (parsed.refeicaoLivrePorData && typeof parsed.refeicaoLivrePorData === "object") {
      setRefeicaoLivrePorData(parsed.refeicaoLivrePorData);
    }
    if (parsed.janelaTreinoPorData && typeof parsed.janelaTreinoPorData === "object") {
      setJanelaTreinoPorData(parsed.janelaTreinoPorData);
    }
    if (parsed.cafeinaPorData && typeof parsed.cafeinaPorData === "object") {
      setCafeinaPorData(parsed.cafeinaPorData);
    }
    if (parsed.cardioPorData && typeof parsed.cardioPorData === "object") {
      setCardioPorData(parsed.cardioPorData);
    }
    if (Array.isArray(parsed.suplementos)) {
      setSuplementos(parsed.suplementos);
    }
    if (Array.isArray(parsed.itensMochila)) {
      setItensMochila(parsed.itensMochila);
    }
    if (parsed.mochilaMarcadaPorData && typeof parsed.mochilaMarcadaPorData === "object") {
      setMochilaMarcadaPorData(parsed.mochilaMarcadaPorData);
    }
    if (parsed.metaTreinosSemana !== undefined) setMetaTreinosSemana(parsed.metaTreinosSemana);
    if (parsed.ultimoBackupISO) setUltimoBackupISO(parsed.ultimoBackupISO);
    if (parsed.pesoKg !== undefined) setPesoKg(parsed.pesoKg);
    if (parsed.aguaPorData && typeof parsed.aguaPorData === "object") setAguaPorData(parsed.aguaPorData);
    if (parsed.metaTreinosMes !== undefined) setMetaTreinosMes(parsed.metaTreinosMes);
    if (Array.isArray(parsed.registrosPR)) setRegistrosPR(parsed.registrosPR);
    if (Array.isArray(parsed.medidasCorporais)) setMedidasCorporais(parsed.medidasCorporais);
    if (Array.isArray(parsed.metasPessoais)) setMetasPessoais(parsed.metasPessoais);
    setStatusBackup("Backup restaurado com sucesso.");
  }

  function importarBackupJSON() {
    try {
      aplicarObjetoBackup(JSON.parse(textoBackup));
    } catch {
      setStatusBackup("Erro ao ler JSON. Verifique o formato.");
    }
  }

  function aoSelecionarArquivoJson(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    const reader = new FileReader();
    reader.onload = () => {
      const conteudo = String(reader.result || "");
      setTextoBackup(conteudo);
      try {
        aplicarObjetoBackup(JSON.parse(conteudo));
      } catch {
        setStatusBackup("Arquivo JSON inválido.");
      }
    };
    reader.readAsText(arquivo);
    e.target.value = "";
  }

  const renderLogo = (tamanho = 34) => {
    if (!logoQuebrou) {
      return (
        <img
          src="/LogoCaveira.png"
          alt="Logo Caveira"
          onError={() => setLogoQuebrou(true)}
          style={{
            width: `${tamanho}px`,
            height: `${tamanho}px`,
            objectFit: "contain",
            borderRadius: "8px",
            display: "block",
            flexShrink: 0,
          }}
        />
      );
    }

    return (
      <div
        style={{
          width: `${tamanho}px`,
          height: `${tamanho}px`,
          borderRadius: "8px",
          background: "rgba(52, 70, 94, 0.72)",
          border: "1px solid rgba(148, 190, 215, 0.24)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          fontWeight: 700,
          color: "#c0cce0",
          flexShrink: 0,
        }}
      >
        CV
      </div>
    );
  };

  const larguraColunaFechada = 56;
  const larguraDrawer = ehDesktop ? 250 : 252;
  const larguraMenuDesktop = menuAberto ? larguraDrawer : larguraColunaFechada;
  const larguraContainer = ehDesktop ? "100%" : "460px";
  const paddingContainer = ehDesktop
    ? "28px 32px 96px"
    : `${menuAberto ? "20px" : "72px"} 14px 88px 14px`;

  const displayTimerSeg = timerRodando || timerRestante > 0 ? timerRestante : totalConfigTimerSeg;

  if (authCarregando) {
    return <div style={{ minHeight: "100vh", background: "rgba(38, 54, 75, 0.62)", color: "#c0cce0", display: "grid", placeItems: "center", fontFamily: "inherit" }}>Carregando sua conta...</div>;
  }

  if (!authSession) {
    const authInput = { width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: "9px", border: "1px solid rgba(148, 190, 215, 0.24)", background: "rgba(38, 54, 75, 0.62)", color: "#edf1f7", fontSize: "14px", outline: "none" };
    const authLabel = { display: "block", color: "#c0cce0", fontSize: "12px", marginBottom: "7px" };
    const authBotao = { width: "100%", padding: "13px", border: "0", borderRadius: "9px", background: "#7dd3fc", color: "#111827", fontWeight: 800, fontSize: "14px", cursor: authEnviando ? "wait" : "pointer", opacity: authEnviando ? 0.7 : 1 };
    const tituloAuth = authModo === "cadastro" ? "Criar sua conta" : authModo === "recuperar" ? "Recuperar senha" : authModo === "novaSenha" ? "Nova senha" : "Bem-vindo de volta";
    return (
      <main style={{ minHeight: "100vh", background: "radial-gradient(circle at 50% 0%, #26364B 0%, #202D40 70%)", color: "#edf1f7", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", boxSizing: "border-box", fontFamily: "inherit" }}>
        <style>{`html, body, #root { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; } button, a, [role="button"] { touch-action: manipulation; } @media (max-width: 639px) { input, select, textarea { font-size: 16px !important; } }`}</style>
        <section style={{ width: "100%", maxWidth: "420px", background: "rgba(38, 54, 75, 0.88)", border: "1px solid rgba(148, 190, 215, 0.24)", borderRadius: "18px", padding: "30px", boxShadow: "0 24px 80px rgba(0,0,0,.4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
            <img src="/LogoCaveira.png" alt="Caveira" onError={(e) => { e.currentTarget.style.display = "none"; }} style={{ width: "42px", height: "42px", objectFit: "contain" }} />
            <div><div style={{ fontSize: "15px", fontWeight: 900, letterSpacing: ".16em" }}>CAVEIRA</div><div style={{ color: "#a8b6ca", fontSize: "10px", letterSpacing: ".12em" }}>UM DIA DE CADA VEZ</div></div>
          </div>
          <h1 style={{ fontSize: "25px", margin: "0 0 8px", letterSpacing: "-.03em" }}>{tituloAuth}</h1>
          <p style={{ color: "#c0cce0", fontSize: "13px", lineHeight: 1.6, margin: "0 0 22px" }}>{authModo === "cadastro" ? "Preencha seus dados para começar." : authModo === "recuperar" ? "Informe seu email para receber as instruções de recuperação." : authModo === "novaSenha" ? "Use o código enviado ao seu email para definir uma nova senha." : "Entre para acessar seus treinos e sua rotina."}</p>
          <form onSubmit={enviarFormularioAuth} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {authModo === "cadastro" && <label style={authLabel}>Nome de usuário<input required value={authNome} onChange={(e) => setAuthNome(e.target.value)} placeholder="Como deseja ser chamado?" style={{ ...authInput, display: "block", marginTop: "7px" }} /></label>}
            {(authModo === "login" || authModo === "cadastro" || authModo === "recuperar" || authModo === "novaSenha") && <label style={authLabel}>Email<input required type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="seu@email.com" style={{ ...authInput, display: "block", marginTop: "7px" }} /></label>}
            {(authModo === "login" || authModo === "cadastro") && <label style={authLabel}>Senha<div style={{ position: "relative", marginTop: "7px" }}><input required minLength={6} type={authMostrarSenha ? "text" : "password"} value={authSenha} onChange={(e) => setAuthSenha(e.target.value)} placeholder="Mínimo de 6 caracteres" style={{ ...authInput, paddingRight: "62px" }} /><button type="button" onClick={() => setAuthMostrarSenha((v) => !v)} style={{ position: "absolute", right: "9px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: 0, color: "#7dd3fc", cursor: "pointer", fontSize: "11px" }}>{authMostrarSenha ? "Ocultar" : "Mostrar"}</button></div></label>}
            {authModo === "novaSenha" && <><label style={authLabel}>Código recebido por email<input required inputMode="numeric" value={authCodigo} onChange={(e) => setAuthCodigo(e.target.value)} placeholder="Digite o código" style={{ ...authInput, display: "block", marginTop: "7px" }} /></label><label style={authLabel}>Nova senha<input required minLength={6} type={authMostrarSenha ? "text" : "password"} value={authNovaSenha} onChange={(e) => setAuthNovaSenha(e.target.value)} placeholder="Mínimo de 6 caracteres" style={{ ...authInput, display: "block", marginTop: "7px" }} /></label></>}
            {authErro && <div role="alert" style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.25)", color: "#fca5a5", fontSize: "12px" }}>{authErro}</div>}
            {authMensagem && <div role="status" style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(125,211,252,.1)", border: "1px solid rgba(125,211,252,.25)", color: "#bae6fd", fontSize: "12px", lineHeight: 1.5 }}>{authMensagem}</div>}
            <button disabled={authEnviando} type="submit" style={authBotao}>{authEnviando ? "Aguarde..." : authModo === "cadastro" ? "Criar conta" : authModo === "recuperar" ? "Enviar código" : authModo === "novaSenha" ? "Alterar senha" : "Entrar"}</button>
          </form>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginTop: "20px", fontSize: "12px" }}>
            {authModo === "login" && <><button type="button" onClick={() => { setAuthModo("cadastro"); setAuthErro(""); setAuthMensagem(""); }} style={{ background: "none", border: 0, color: "#bae6fd", cursor: "pointer" }}>Criar cadastro</button><button type="button" onClick={() => { setAuthModo("recuperar"); setAuthErro(""); setAuthMensagem(""); }} style={{ background: "none", border: 0, color: "#c0cce0", cursor: "pointer" }}>Esqueci minha senha</button></>}
            {authModo !== "login" && <button type="button" onClick={() => { setAuthModo("login"); setAuthErro(""); setAuthMensagem(""); }} style={{ background: "none", border: 0, color: "#bae6fd", cursor: "pointer" }}>Voltar para login</button>}
          </div>
        </section>
      </main>
    );
  }

  if (authSession && !dadosNuvemCarregados) {
    return <div style={{ minHeight: "100vh", background: "rgba(38, 54, 75, 0.62)", color: "#c0cce0", display: "grid", placeItems: "center", padding: "24px", textAlign: "center", fontFamily: "inherit" }}>
      <div style={{ maxWidth: "440px" }}>
        <div style={{ fontSize: "15px", fontWeight: 800, color: "#bae6fd", marginBottom: "10px" }}>CAVEIRA APP</div>
        <div>{erroDadosNuvem ? "Não foi possível acessar seus dados na nuvem." : statusDadosNuvem}</div>
        {erroDadosNuvem && <><p style={{ color: "#fca5a5", fontSize: "12px", lineHeight: 1.5 }}>{erroDadosNuvem}</p><button onClick={() => { setErroDadosNuvem(""); setTentativaNuvem((n) => n + 1); }} style={{ marginTop: "8px", padding: "10px 16px", borderRadius: "8px", border: 0, background: "#7dd3fc", color: "#111827", fontWeight: 800, cursor: "pointer" }}>Tentar novamente</button></>}
      </div>
    </div>;
  }

  if (modoFocoLimpo) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "rgba(38, 54, 75, 0.62)",
          color: "#edf1f7",
          padding: "24px 18px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          maxWidth: "480px",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#c0cce0", letterSpacing: "0.08em" }}>
            MODO FOCO • {infoDia?.rotulo.toUpperCase()}
          </span>
          <button
            type="button"
            onClick={() => setModoFocoLimpo(false)}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(148, 190, 215, 0.24)",
              background: "rgba(52, 70, 94, 0.72)",
              color: "#edf1f7",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Sair do foco
          </button>
        </div>

        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#a8b6ca", letterSpacing: "0.1em" }}>
              {modoTempo === "timer"
                ? "TIMER"
                : modoTempo === "intervalo"
                ? `ETAPA: ${intervaloFase.toUpperCase()} (${intervaloRodadaAtual}/${intervaloRodadasTotal})`
                : "CRONÔMETRO"}
            </div>
            <div
              style={{
                fontSize: "54px",
                fontWeight: 800,
                color: "#bae6fd",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1.05,
                marginTop: "6px",
              }}
            >
              {modoTempo === "timer"
                ? formatarDuracao(displayTimerSeg)
                : modoTempo === "intervalo"
                ? formatarDuracao(intervaloRestante)
                : formatarDuracao(duracaoSessaoSeg)}
            </div>
          </div>

          {proximoExercicio && (
            <div style={{ ...cardClean, textAlign: "left" }}>
              <div style={{ fontSize: "10px", color: "#a8b6ca" }}>PRÓXIMO / ATUAL</div>
              <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "4px" }}>
                {proximoExercicio.nome}
              </div>
              <div style={{ fontSize: "13px", color: "#c0cce0", marginTop: "4px" }}>
                {proximoExercicio.seriesReps} • {proximoExercicio.cargaAtual}kg • Descanso{" "}
                {proximoExercicio.descanso}s
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={() => {
              if (modoTempo === "timer") iniciarOuPausarTimer();
              else if (modoTempo === "intervalo") setIntervaloRodando((r) => !r);
              else setCronometroRodando((r) => !r);
            }}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "10px",
              border: "none",
              background: "#7dd3fc",
              color: "#111827",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            {modoTempo === "timer"
              ? timerRodando
                ? "Pausar"
                : "Iniciar"
              : modoTempo === "intervalo"
              ? intervaloRodando
                ? "Pausar"
                : "Iniciar"
              : cronometroRodando
              ? "Pausar"
              : "Iniciar"}
          </button>

          {proximoExercicio && (
            <button
              type="button"
              onClick={() => alternarFeito(proximoExercicio)}
              style={{
                padding: "14px 16px",
                borderRadius: "10px",
                border: "none",
                background: "#22c55e",
                color: "#111827",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Concluir
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(145deg, #202D40 0%, #26364B 52%, #202D40 100%)",
        color: "#edf1f7",
        width: ehDesktop ? `calc(100% - ${larguraMenuDesktop}px)` : "100%",
        maxWidth: larguraContainer,
        margin: ehDesktop ? `0 0 0 ${larguraMenuDesktop}px` : "0 auto",
        padding: paddingContainer,
        position: "relative",
        isolation: "isolate",
        boxSizing: "border-box",
        transition: "width 0.2s ease, margin 0.2s ease, padding 0.2s ease",
      }}
    >
      <style>{`
        html, body, #root {
          min-height: 100%;
          background: linear-gradient(145deg, #202D40 0%, #26364B 52%, #202D40 100%);
          background-attachment: fixed;
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }
        body {
          margin: 0;
          min-height: 100vh;
        }
        /* Superfícies glass: transparência e desfoque discretos, sem alterar layout. */
        div[style*="rgba(38, 54, 75"],
        div[style*="rgba(52, 70, 94, 0.46)"] {
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 24px rgba(5, 12, 24, 0.12);
        }
        button, a, [role="button"] {
          touch-action: manipulation;
        }
        input:focus, select:focus, textarea:focus {
          outline: 2px solid rgba(96, 165, 250, 0.48);
          outline-offset: 1px;
        }
        @media print {
          body, html, #root { background: #fff !important; color: #111827 !important; }
          button, nav, aside, input { display: none !important; }
          main, section, div { box-shadow: none !important; }
        }
        @media (max-width: 639px) {
          input, select, textarea {
            font-size: 16px !important;
          }
          button, a, [role="button"] {
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
          }
        }
      `}</style>
      <div role="status" aria-live="polite" title={statusOffline} style={{ position: "fixed", top: 10, right: 12, zIndex: 80, display: "flex", alignItems: "center", gap: 7, padding: "6px 10px", borderRadius: 999, border: `1px solid ${estaOnline ? "rgba(96,165,250,.22)" : "rgba(251,191,36,.34)"}`, background: estaOnline ? "rgba(27,41,60,.84)" : "rgba(120,75,20,.9)", color: estaOnline ? "#bfdbfe" : "#fde68a", fontSize: 10, fontWeight: 700, backdropFilter: "blur(12px)", pointerEvents: "none" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: estaOnline ? "#60a5fa" : "#fbbf24" }} />
        {estaOnline ? (statusDadosNuvem.includes("pendente") || statusDadosNuvem.includes("aguardando") ? "Sincronização pendente" : "Online") : "Offline • salvando neste dispositivo"}
      </div>
      {/* Ondulações pastéis no canto inferior direito, atrás do conteúdo */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: "min(620px, 76%)",
          height: "56vh",
          minHeight: "340px",
          maxHeight: "720px",
          overflow: "hidden",
          background: "transparent",
          opacity: 0.13,
          pointerEvents: "none",
          zIndex: 0,
          // Dissolve as bordas do componente para não formar um retângulo/quadro.
          WebkitMaskImage: "radial-gradient(ellipse 78% 76% at 100% 100%, #000 18%, rgba(0,0,0,0.72) 48%, rgba(0,0,0,0.22) 76%, transparent 100%)",
          maskImage: "radial-gradient(ellipse 78% 76% at 100% 100%, #000 18%, rgba(0,0,0,0.72) 48%, rgba(0,0,0,0.22) 76%, transparent 100%)",
        }}
      >
        <EfeitoRelevoPastel modo="aberto" />
      </div>
      {/* Menu fechado: coluna compacta no PC e botão superior no celular */}
      {!menuAberto && ehDesktop && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${larguraColunaFechada}px`,
            zIndex: 40,
            background: "linear-gradient(145deg, #1B293C 0%, #223249 52%, #1B293C 100%)",
            borderRight: "1px solid rgba(186, 230, 253, 0.16)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "22px 0 18px",
            boxSizing: "border-box",
          }}
        >
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            title="Abrir menu"
            aria-label="Abrir menu"
            style={{
              background: "rgba(52, 70, 94, 0.72)",
              color: "#edf1f7",
              border: "1px solid rgba(148, 190, 215, 0.24)",
              borderRadius: "7px",
              width: "30px",
              height: "30px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            ☰
          </button>
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            title={`${authSession.user.user_metadata?.nome || "Usuário"} — ${authSession.user.email}`}
            aria-label={`Perfil de ${authSession.user.email}`}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background: "#24445D",
              border: "1px solid #4C7896",
              color: "#bae6fd",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {(authSession.user.user_metadata?.nome || authSession.user.email || "U").slice(0, 1).toUpperCase()}
          </button>
        </div>
      )}

      {!menuAberto && !ehDesktop && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "56px",
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "0 14px",
            boxSizing: "border-box",
            background: "rgba(17,24,36,0.98)",
            borderBottom: "1px solid rgba(148, 190, 215, 0.19)",
            boxShadow: "0 5px 18px rgba(0,0,0,0.2)",
          }}
        >
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            title="Abrir menu"
            aria-label="Abrir menu"
            style={{
              background: "rgba(52, 70, 94, 0.72)",
              color: "#edf1f7",
              border: "1px solid rgba(148, 190, 215, 0.24)",
              borderRadius: "8px",
              width: "38px",
              height: "36px",
              cursor: "pointer",
              fontSize: "20px",
              flexShrink: 0,
            }}
          >
            ☰
          </button>
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            title="Abrir perfil e menu"
            aria-label={`Usuário conectado: ${authSession.user.email}`}
            style={{
              minWidth: 0,
              maxWidth: "calc(100% - 52px)",
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "4px 8px",
              border: "1px solid rgba(148, 190, 215, 0.19)",
              borderRadius: "9px",
              background: "rgba(34, 50, 73, 0.88)",
              color: "#edf1f7",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                background: "#24445D",
                border: "1px solid #4C7896",
                color: "#bae6fd",
                fontWeight: 800,
                fontSize: "12px",
              }}
            >
              {(authSession.user.user_metadata?.nome || authSession.user.email || "U").slice(0, 1).toUpperCase()}
            </span>
            <span style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#edf1f7", fontSize: "11px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {authSession.user.user_metadata?.nome || "Usuário"}
              </span>
              <span style={{ color: "#c0cce0", fontSize: "9px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {authSession.user.email}
              </span>
            </span>
          </button>
        </div>
      )}

      {/* Menu lateral esquerdo profissional */}
      {menuAberto && (
        <div
          onClick={() => setMenuAberto(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: ehDesktop ? "transparent" : "rgba(5,8,13,0.58)",
            zIndex: 50,
            pointerEvents: ehDesktop ? "none" : "auto",
          }}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            style={{
              position: ehDesktop ? "fixed" : "relative",
              left: ehDesktop ? 0 : undefined,
              top: ehDesktop ? 0 : undefined,
              bottom: ehDesktop ? 0 : undefined,
              width: larguraDrawer,
              height: "100%",
              background: "linear-gradient(145deg, #1B293C 0%, #223249 52%, #1B293C 100%)",
              borderRight: "1px solid rgba(186, 230, 253, 0.16)",
              padding: "22px 14px 18px",
              boxShadow: "18px 0 48px rgba(0,0,0,0.28)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflow: "hidden",
              pointerEvents: "auto",
              boxSizing: "border-box",
            }}
          >
            <EfeitoRelevoPastel modo="aberto" />

            <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {renderLogo(28)}
                  <span style={{ fontWeight: 750, letterSpacing: "-0.02em", fontSize: "15px" }}>Caveira App</span>
                </div>

                <button
                  onClick={() => setMenuAberto(false)}
                  aria-label="Fechar menu"
                  style={{
                    background: "rgba(20,25,34,0.92)",
                    border: "1px solid rgba(148, 190, 215, 0.24)",
                    borderRadius: "7px",
                    color: "#e8edf5",
                    width: "28px",
                    height: "28px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={rotuloSecaoMenu}>Menu principal</span>
                <button type="button" onClick={() => abrirPagina("hoje")} style={estiloMenuAtivo("hoje", abaAtiva)}>♧　Treino de Hoje</button>
                <button type="button" onClick={() => abrirPagina("montar")} style={estiloMenuAtivo("montar", abaAtiva)}>☷　Montar Treinos</button>
                <button type="button" onClick={() => abrirPagina("dashboard")} style={estiloMenuAtivo("dashboard", abaAtiva)}>▥　Dashboard</button>
                <div style={{ height: "1px", background: "rgba(148, 163, 184, 0.20)", margin: "9px 2px 7px" }} />
                <span style={rotuloSecaoMenu}>Páginas e ferramentas</span>
                <button type="button" onClick={() => abrirPagina("suplementos")} style={estiloMenuAtivo("suplementos", abaAtiva)}>
                  Suplementos
                </button>
                <button type="button" onClick={() => abrirPagina("alimentacao")} style={estiloMenuAtivo("alimentacao", abaAtiva)}>
                  Alimentação & Rotina
                </button>
                <button type="button" onClick={() => abrirPagina("mochila")} style={estiloMenuAtivo("mochila", abaAtiva)}>
                  Mochila & Ritmo
                </button>
                <button type="button" onClick={() => abrirPagina("desempenho")} style={estiloMenuAtivo("desempenho", abaAtiva)}>Central de Desempenho</button>
                <button type="button" onClick={() => abrirPagina("exercicios")} style={estiloMenuAtivo("exercicios", abaAtiva)}>Biblioteca de Exercícios</button>
                <button type="button" onClick={() => abrirPagina("conquistas")} style={estiloMenuAtivo("conquistas", abaAtiva)}>Conquistas</button>
                <button type="button" onClick={() => abrirPagina("relatorios")} style={estiloMenuAtivo("relatorios", abaAtiva)}>Relatórios</button>
                <button type="button" onClick={abrirCalculadoraMenu} style={btnMenu}>
                  Calculadora de Anilhas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuAberto(false);
                    setModoFocoLimpo(true);
                  }}
                  style={btnMenu}
                >
                  Modo Foco
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={rotuloSecaoMenu}>SISTEMA</span>
                <button type="button" onClick={abrirBackupMenu} style={btnMenu}>
                  Backup & Dados
                </button>
              </div>
            </div>

            <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: "9px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 8px", background: "transparent", borderTop: "1px solid rgba(148, 190, 215, 0.16)", borderRadius: 0, minWidth: 0, paddingTop: "16px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", background: "#24445D", border: "1px solid #4C7896", color: "#bae6fd", fontWeight: 800, fontSize: "13px" }}>{(authSession.user.user_metadata?.nome || authSession.user.email || "U").slice(0, 1).toUpperCase()}</div>
                <div style={{ minWidth: 0, flex: 1 }}><div style={{ color: "#edf1f7", fontSize: "12px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{authSession.user.user_metadata?.nome || "Usuário"}</div><div style={{ color: "#c0cce0", fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{authSession.user.email}</div></div>
                <button type="button" onClick={sairDaConta} title="Sair da conta" aria-label="Sair da conta" style={{ border: 0, background: "transparent", color: "#c0cce0", cursor: "pointer", fontSize: "16px" }}>↪</button>
              </div>
              <button type="button" onClick={resetarDados} style={{ ...btnMenu, color: "#f87171", padding: "6px 8px", fontSize: "11px", opacity: 0.85 }}>Resetar dados do app</button>
            </div>
          </aside>
        </div>
      )}

      {/* Cabeçalho */}
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          paddingBottom: "18px",
          borderBottom: "1px solid rgba(148, 190, 215, 0.16)",
          marginBottom: "18px",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 10px",
              borderRadius: "8px",
              background: "rgba(52, 70, 94, 0.46)",
              border: "1px solid rgba(148, 190, 215, 0.16)",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "10px", letterSpacing: "0.14em", color: "#c0cce0" }}>
              CAVEIRA • UM DIA DE CADA VEZ
            </span>
          </div>

          <h1
            style={{
              fontSize: ehDesktop ? "32px" : "26px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            {abaAtiva === "hoje" && (
              <>
                Treino de hoje<span style={{ color: "#7dd3fc" }}>.</span>
              </>
            )}
            {abaAtiva === "montar" && "Montar treinos."}
            {abaAtiva === "dashboard" && "Dashboard."}
            {abaAtiva === "timer" && "Timer."}
            {abaAtiva === "suplementos" && "Suplementos."}
            {abaAtiva === "alimentacao" && "Alimentação & Rotina."}
            {abaAtiva === "mochila" && "Mochila & Ritmo."}
            {abaAtiva === "desempenho" && "Central de Desempenho."}
            {abaAtiva === "exercicios" && "Biblioteca de Exercícios."}
            {abaAtiva === "conquistas" && "Conquistas."}
            {abaAtiva === "relatorios" && "Relatórios."}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "#a8b6ca" }}>
              {infoDia?.nome}, {diaSel} de {MESES_CURTOS[(mesSel || 1) - 1]?.toLowerCase()}
              {focoDiasPorChave[chaveDia] ? ` • Foco: ${focoDiasPorChave[chaveDia]}` : ""}
            </span>
            {abaAtiva === "hoje" && dataSelecionada !== hojeISO && (
              <button
                type="button"
                onClick={() => setDataSelecionada(hojeISO)}
                style={{
                  background: "rgba(52, 70, 94, 0.72)",
                  border: "1px solid rgba(148, 190, 215, 0.24)",
                  borderRadius: "6px",
                  color: "#bae6fd",
                  fontSize: "11px",
                  padding: "2px 8px",
                  cursor: "pointer",
                }}
              >
                Voltar para hoje
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {renderLogo(ehDesktop ? 44 : 38)}
          <div
            style={{
              textAlign: "right",
              paddingLeft: "12px",
              borderLeft: "1px solid rgba(148, 190, 215, 0.16)",
              lineHeight: 1.1,
            }}
          >
            <div style={{ fontSize: "10px", color: "#a8b6ca", letterSpacing: "0.08em" }}>
              {MESES_CURTOS[(mesSel || 1) - 1]}
            </div>
            <div style={{ fontSize: ehDesktop ? "26px" : "22px", fontWeight: 800, marginTop: "2px" }}>
              {diaSel}
            </div>
            <div style={{ fontSize: "10px", color: "#a8b6ca", marginTop: "2px" }}>{anoSel}</div>
          </div>
        </div>
      </header>

      {/* Banner de alarme sonoro quando o timer termina */}
      {alarmeTocando && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 14px",
            borderRadius: "10px",
            background: "rgba(125, 211, 252, 0.14)",
            border: "1px solid #7dd3fc",
            marginBottom: "14px",
            fontSize: "12px",
          }}
        >
          <span>
            <strong>Tempo esgotado!</strong> Descanso concluído.
          </span>
          <button
            type="button"
            onClick={pararSomAlarme}
            style={{
              padding: "5px 10px",
              borderRadius: "7px",
              border: "none",
              background: "#7dd3fc",
              color: "#111827",
              fontWeight: 700,
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            Parar som
          </button>
        </div>
      )}

      {/* PÁGINA 1: HOJE (focada em treino, tempo, água e observação) */}
      {abaAtiva === "hoje" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: ehDesktop ? "24px" : "10px",
              paddingBottom: "16px",
              borderBottom: "1px solid rgba(148, 190, 215, 0.16)",
            }}
          >
            <div
              title={
                dashboardData.foguinhoAtivo
                  ? `Treino confirmado hoje • ${dashboardData.streak} dia(s) seguidos`
                  : "Confirme um treino hoje para acender o foguinho"
              }
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                minWidth: ehDesktop ? "64px" : "46px",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={dashboardData.foguinhoAtivo ? "#f97316" : "none"}
                  stroke={dashboardData.foguinhoAtivo ? "#fb923c" : "#52525b"}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    filter: dashboardData.foguinhoAtivo
                      ? "drop-shadow(0 0 7px rgba(249, 115, 22, 0.55))"
                      : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  <path d="M12 3c.5 3.4-1.8 5.6-3.5 7.4-1.5 1.6-2.5 3.2-2.5 5.3a6 6 0 0 0 12 0c0-2.5-1.3-4.3-2.6-5.8-1.1-1.3-2.1-2.5-1.9-4.5-1.3.4-1.6 1-1.6 1.6z" />
                </svg>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: dashboardData.foguinhoAtivo ? "#fb923c" : "#a8b6ca",
                    lineHeight: 1,
                  }}
                >
                  {dashboardData.streak}
                </span>
              </div>
              <span style={{ fontSize: "10px", fontWeight: 300, color: "#a8b6ca", letterSpacing: "0.02em" }}>
                {dashboardData.streak === 1 ? "Dia" : "Dias"}
              </span>
            </div>

            <div
              style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: ehDesktop ? "8px" : "2px",
                alignItems: "center",
              }}
            >
              {janelaDias.map((d) => {
                const selecionada = d.dataISO === dataSelecionada;
                const treinouNoDia = dashboardData.datasConcluidasSet.has(d.dataISO);

                return (
                  <button
                    key={d.dataISO}
                    type="button"
                    disabled={d.dataISO > hojeISO}
                    onClick={() => {
                      if (d.dataISO > hojeISO) return;
                      setCronometroRodando(false);
                      setDataSelecionada(d.dataISO);
                    }}
                    style={{
                      padding: ehDesktop ? "8px 4px" : "6px 1px",
                      borderRadius: "8px",
                      border: "none",
                      background: selecionada ? "rgba(255,255,255,0.04)" : "transparent",
                      color: selecionada || d.ehHoje ? "#edf1f7" : "#a8b6ca",
                      cursor: d.dataISO > hojeISO ? "not-allowed" : "pointer",
                      opacity: d.dataISO > hojeISO ? 0.25 : 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                      fontWeight: 300,
                    }}
                  >
                    <span
                      style={{
                        fontSize: ehDesktop ? "12px" : "11px",
                        fontWeight: d.ehHoje || selecionada ? 500 : 300,
                        color: d.ehHoje ? "#edf1f7" : "#c0cce0",
                        lineHeight: 1.1,
                      }}
                    >
                      {d.ehHoje ? "Hoje" : d.letra}
                    </span>
                    <span
                      style={{
                        fontSize: ehDesktop ? "14px" : "13px",
                        fontWeight: selecionada ? 600 : 300,
                        color: selecionada ? "#bae6fd" : "#d4d4d8",
                        lineHeight: 1.1,
                      }}
                    >
                      {d.numeroDia}
                    </span>
                    <span
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "999px",
                        background: treinouNoDia ? "#fb923c" : "transparent",
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {!diaPodeEditar && (
            <div style={{ padding: "10px 12px", borderRadius: "9px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.28)", color: "#fbbf24", fontSize: "12px" }}>
              Dia fechado para alterações. Você pode consultar os registros, mas somente a data de hoje pode ser editada.
            </div>
          )}
          <fieldset disabled={!diaPodeEditar} style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "inline-flex", gap: "6px", flexWrap: "wrap" }}>
              {[
                { id: "normal", label: "Dia normal" },
                { id: "cansado", label: "Dia cansado" },
                { id: "pesado", label: "Dia pesado" },
              ].map((st) => {
                const ativo = estadoDia === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => definirEstadoDia(st.id)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "7px",
                      border: "1px solid rgba(148, 190, 215, 0.24)",
                      background: ativo ? "rgba(148, 190, 215, 0.16)" : "#111827",
                      color: ativo ? "#bae6fd" : "#c0cce0",
                      fontSize: "11px",
                      fontWeight: ativo ? 700 : 400,
                      cursor: "pointer",
                    }}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>

            {exercicios.length > 0 && (
              <button
                type="button"
                onClick={remanejarTreinoParaProximoDia}
                style={{
                  padding: "5px 10px",
                  borderRadius: "7px",
                  border: "1px solid rgba(148, 190, 215, 0.24)",
                  background: "rgba(38, 54, 75, 0.62)",
                  color: "#c0cce0",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                Adiar para próximo dia
              </button>
            )}
          </div>

          {estadoDia === "cansado" && (
            <div
              style={{
                fontSize: "11px",
                color: "#fbbf24",
                background: "rgba(251, 191, 36, 0.08)",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(251, 191, 36, 0.25)",
              }}
            >
              Dia cansado: priorize execução limpa e evite forçar carga máxima hoje.
            </div>
          )}

          {/* Checklist pré-treino + Aquecimento */}
          <div style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "#c0cce0", fontWeight: 600 }}>Checklist pré-treino</span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {[
                  { key: "agua", label: "Água batida" },
                  { key: "aquecimento", label: "Aquecido" },
                  { key: "foco", label: "Foco alinhado" },
                ].map((item) => {
                  const marcado = Boolean(checklistDia[item.key]);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => alternarChecklist(item.key)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        border: "1px solid rgba(148, 190, 215, 0.24)",
                        background: marcado ? "rgba(34, 197, 94, 0.14)" : "#111827",
                        color: marcado ? "#4ade80" : "#c0cce0",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      {marcado ? "✓ " : ""}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap", paddingTop: "8px", borderTop: "1px solid rgba(148, 190, 215, 0.16)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                <span style={{ color: "#c0cce0", fontWeight: 600 }}>Aquecimento</span>
                <span style={{ color: "#a8b6ca" }}>({aquecimentoDia.minutos} min)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {[5, 10, 15].map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() =>
                      setAquecimentoPorData((prev) => ({
                        ...prev,
                        [dataSelecionada]: {
                          feito: prev[dataSelecionada]?.feito ?? true,
                          minutos: min,
                        },
                      }))
                    }
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid rgba(148, 190, 215, 0.24)",
                      background: aquecimentoDia.minutos === min ? "rgba(148, 190, 215, 0.16)" : "#111827",
                      color: aquecimentoDia.minutos === min ? "#bae6fd" : "#c0cce0",
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                  >
                    {min}m
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setAquecimentoPorData((prev) => ({
                      ...prev,
                      [dataSelecionada]: {
                        minutos: prev[dataSelecionada]?.minutos ?? 5,
                        feito: !prev[dataSelecionada]?.feito,
                      },
                    }))
                  }
                  style={{
                    padding: "5px 10px",
                    borderRadius: "7px",
                    border: "none",
                    background: aquecimentoDia.feito ? "#22c55e" : "rgba(148, 190, 215, 0.16)",
                    color: aquecimentoDia.feito ? "#111827" : "#e8edf5",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {aquecimentoDia.feito ? "Feito" : "Marcar"}
                </button>
              </div>
            </div>
          </div>

          {/* Calculadora de anilhas */}
          <div ref={calcRef} style={cardClean}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: 600 }}>Calculadora de anilhas</span>
              <button
                type="button"
                onClick={() => setCalcAberta((a) => !a)}
                style={{ ...btnSecundario, flex: "none", padding: "4px 9px", fontSize: "11px" }}
              >
                {calcAberta ? "Esconder" : "Abrir"}
              </button>
            </div>

            {calcAberta && (
              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <label style={{ fontSize: "11px", color: "#c0cce0" }}>
                    Peso total (kg)
                    <input
                      type="number"
                      step="2.5"
                      value={calcPesoTotal}
                      onChange={(e) => setCalcPesoTotal(e.target.value)}
                      style={{ ...campoTexto, marginTop: "4px", padding: "6px 8px" }}
                    />
                  </label>
                  <label style={{ fontSize: "11px", color: "#c0cce0" }}>
                    Peso da barra (kg)
                    <input
                      type="number"
                      step="1"
                      value={calcPesoBarra}
                      onChange={(e) => setCalcPesoBarra(e.target.value)}
                      style={{ ...campoTexto, marginTop: "4px", padding: "6px 8px" }}
                    />
                  </label>
                </div>

                <div style={{ fontSize: "12px", color: "#e8edf5" }}>
                  Por lado:{" "}
                  {resultadoAnilhas.itens.length === 0 ? (
                    <span style={{ color: "#a8b6ca" }}>Apenas a barra</span>
                  ) : (
                    resultadoAnilhas.itens.map((it) => `${it.qtd}x${it.anilha}kg`).join(" + ")
                  )}
                  {resultadoAnilhas.sobraPorLado > 0 && (
                    <span style={{ color: "#fbbf24", marginLeft: "6px" }}>
                      (restam {resultadoAnilhas.sobraPorLado}kg/lado)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Resumo da sessão + Puxar último treino parecido */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "#a8b6ca" }}>SEU TREINO</div>
              <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "3px" }}>
                {exercicios.length === 0 ? "Dia de descanso" : "Sessão programada"}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {ultimoTreinoParecido && exercicios.length > 0 && (
                <button
                  type="button"
                  onClick={duplicarUltimoTreinoParecido}
                  style={{
                    ...btnSecundario,
                    flex: "none",
                    padding: "5px 9px",
                    fontSize: "11px",
                    color: "#bae6fd",
                  }}
                >
                  Puxar último ({ultimoTreinoParecido.dataISO.slice(5)})
                </button>
              )}

              <div style={{ textAlign: "right", fontSize: "12px", color: "#c0cce0" }}>
                <div>
                  {concluidosHoje}/{exercicios.length} concluídos
                </div>
                {exercicios.length > 0 && (
                  <div style={{ fontSize: "11px", color: "#a8b6ca", marginTop: "2px" }}>
                    Volume: {volumeSessaoKg.toLocaleString("pt-BR")} kg
                    {comparadorMelhorDia && (
                      <span style={{ marginLeft: "6px", color: comparadorMelhorDia.diff >= 0 ? "#22c55e" : "#c0cce0" }}>
                        ({comparadorMelhorDia.diff >= 0 ? "+" : ""}
                        {comparadorMelhorDia.diff.toLocaleString("pt-BR")} vs melhor dia)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {exercicios.length === 0 ? (
            <div style={{ ...cardClean, textAlign: "center", padding: "20px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ color: "#a8b6ca", fontSize: "13px" }}>Sem exercícios para este dia.</div>
              <div style={{ display: "flex", justifyContent: "center", gap: "6px", flexWrap: "wrap" }}>
                {MOTIVOS_SEM_TREINO.map((motivo) => {
                  const ativo = motivoSemTreinoDia === motivo;
                  return (
                    <button
                      key={motivo}
                      type="button"
                      onClick={() => selecionarMotivoSemTreino(motivo)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: "7px",
                        border: "1px solid rgba(148, 190, 215, 0.24)",
                        background: ativo ? "rgba(148, 190, 215, 0.16)" : "#111827",
                        color: ativo ? "#bae6fd" : "#c0cce0",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      {motivo}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: ehDesktop ? "repeat(2, 1fr)" : "1fr",
                gap: "10px",
              }}
            >
              {exercicios.map((ex) => {
                const chaveHist = ex.nome.trim().toLowerCase();
                const histEx = (historicoPorExercicio[chaveHist] || []).filter(
                  (h) => h.dataISO !== dataSelecionada
                );
                const ultimoRegistro = histEx[0];
                const prEx = recordePorExercicio[chaveHist];
                const bateuPr = typeof prEx === "number" && prEx > 0 && ex.cargaAtual >= prEx;
                const sugestaoSubir =
                  ultimoRegistro &&
                  ultimoRegistro.feito &&
                  ex.feito &&
                  ex.cargaAtual <= ultimoRegistro.carga &&
                  ex.cargaAtual > 0;
                const histAberto = exercicioHistoricoAberto === ex.id;

                return (
                  <div
                    key={ex.id}
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      background: "rgba(52, 70, 94, 0.46)",
                      border: "1px solid rgba(148, 190, 215, 0.16)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      opacity: ex.feito ? 0.72 : 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => setExercicioHistoricoAberto(histAberto ? null : ex.id)}
                            title="Ver histórico de cargas"
                            style={{
                              background: "none",
                              border: "none",
                              padding: 0,
                              color: "#edf1f7",
                              fontSize: "14px",
                              fontWeight: 600,
                              cursor: "pointer",
                              textAlign: "left",
                            }}
                          >
                            {ex.nome}
                          </button>
                          {typeof prEx === "number" && prEx > 0 && (
                            <span
                              style={{
                                fontSize: "10px",
                                padding: "1px 6px",
                                borderRadius: "5px",
                                background: bateuPr ? "rgba(234, 179, 8, 0.16)" : "#243149",
                                color: bateuPr ? "#bae6fd" : "#c0cce0",
                                border: "1px solid rgba(148, 190, 215, 0.24)",
                              }}
                            >
                              PR {prEx}kg
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginTop: "6px",
                            fontSize: "12px",
                            color: "#c0cce0",
                            flexWrap: "wrap",
                          }}
                        >
                          <span>{ex.seriesReps}</span>
                          <button
                            type="button"
                            onClick={() => acionarDescansoDeExercicio(ex.descanso)}
                            title="Iniciar timer com este descanso"
                            style={{
                              background: "none",
                              border: "none",
                              color: "#bae6fd",
                              cursor: "pointer",
                              fontSize: "12px",
                              padding: 0,
                            }}
                          >
                            {ex.descanso}s
                          </button>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#edf1f7" }}>
                            <button type="button" onClick={() => alterarCarga(ex, -2)} style={btnCarga}>
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => setExercicioHistoricoAberto(histAberto ? null : ex.id)}
                              style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                color: "#edf1f7",
                                fontWeight: 700,
                                fontSize: "12px",
                                cursor: "pointer",
                              }}
                            >
                              {ex.cargaAtual}kg
                            </button>
                            <button type="button" onClick={() => alterarCarga(ex, 2)} style={btnCarga}>
                              +
                            </button>
                          </span>
                        </div>

                        {(ultimoRegistro || sugestaoSubir) && (
                          <div style={{ fontSize: "11px", color: "#a8b6ca", marginTop: "5px" }}>
                            {ultimoRegistro && (
                              <span>
                                Última: <strong style={{ color: "#c0cce0" }}>{ultimoRegistro.carga}kg</strong> ({ultimoRegistro.dataISO.slice(5)})
                              </span>
                            )}
                            {sugestaoSubir && estadoDia !== "cansado" && (
                              <span style={{ color: "#22c55e", marginLeft: ultimoRegistro ? "8px" : 0 }}>
                                • Subir +2kg?
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => alternarFeito(ex)}
                        style={{
                          padding: "7px 11px",
                          borderRadius: "8px",
                          border: "none",
                          background: ex.feito ? "#22c55e" : "rgba(148, 190, 215, 0.16)",
                          color: ex.feito ? "#111827" : "#e8edf5",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {ex.feito ? "Feito" : "Marcar"}
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Reps reais / RIR (ex.: 10,10,9,8 • RIR 1)"
                      value={ex.esforcoNota}
                      onChange={(e) => atualizarEsforcoExercicio(ex, e.target.value)}
                      style={{
                        ...campoTexto,
                        padding: "6px 8px",
                        fontSize: "11px",
                        background: "rgba(38, 54, 75, 0.72)",
                      }}
                    />

                    {histAberto && (
                      <div
                        style={{
                          paddingTop: "8px",
                          borderTop: "1px solid rgba(148, 190, 215, 0.16)",
                          fontSize: "11px",
                          color: "#c0cce0",
                        }}
                      >
                        <div style={{ marginBottom: "4px", color: "#a8b6ca" }}>Histórico de cargas:</div>
                        {histEx.length === 0 ? (
                          <div>Sem registros anteriores para este exercício.</div>
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {histEx.slice(0, 5).map((h, i) => (
                              <span
                                key={`${h.dataISO}-${i}`}
                                style={{
                                  padding: "3px 7px",
                                  borderRadius: "6px",
                                  background: "rgba(38, 54, 75, 0.62)",
                                  border: "1px solid rgba(148, 190, 215, 0.19)",
                                  color: "#e8edf5",
                                }}
                              >
                                {h.dataISO.slice(5)}: <strong>{h.carga}kg</strong>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Sinais do corpo */}
          <div style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "#c0cce0", fontWeight: 600 }}>Como o corpo respondeu</span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {SINAIS_CORPO.map((sinal) => {
                const ativo = sinaisDia.includes(sinal);
                return (
                  <button
                    key={sinal}
                    type="button"
                    onClick={() => alternarSinalCorpo(sinal)}
                    style={{
                      padding: "4px 9px",
                      borderRadius: "7px",
                      border: "1px solid rgba(148, 190, 215, 0.24)",
                      background: ativo ? "rgba(125, 211, 252, 0.14)" : "#111827",
                      color: ativo ? "#bae6fd" : "#c0cce0",
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                  >
                    {sinal}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Água + Observação */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: ehDesktop ? "repeat(2, 1fr)" : "1fr",
              gap: "12px",
            }}
          >
            <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(52, 70, 94, 0.46)", border: "1px solid rgba(148, 190, 215, 0.16)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>Água</span>
                <label style={{ fontSize: "12px", color: "#c0cce0" }}>
                  Peso{" "}
                  <input
                    type="number"
                    value={pesoKg}
                    onChange={(e) => setPesoKg(e.target.value)}
                    style={{
                      width: "52px",
                      background: "rgba(38, 54, 75, 0.62)",
                      color: "#edf1f7",
                      border: "1px solid rgba(148, 190, 215, 0.24)",
                      borderRadius: "6px",
                      padding: "3px 6px",
                      fontSize: "12px",
                    }}
                  />{" "}
                  kg
                </label>
              </div>

              <div style={{ fontSize: "12px", color: "#c0cce0", marginBottom: "8px" }}>
                {aguaHojeMl} ml de {metaAguaMl} ml ({aguaPct}%)
              </div>

              <div style={{ height: "4px", background: "rgba(148, 163, 184, 0.18)", borderRadius: "999px", overflow: "hidden", marginBottom: "10px" }}>
                <div style={{ width: `${aguaPct}%`, height: "100%", background: "#38bdf8" }} />
              </div>

              <form
                onSubmit={adicionarAguaDigitada}
                style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}
              >
                <input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  placeholder="Quantidade em ml"
                  aria-label="Quantidade de água em mililitros"
                  value={aguaEntradaMl}
                  onChange={(e) => setAguaEntradaMl(e.target.value)}
                  disabled={!diaPodeEditar}
                  style={{
                    ...campoTexto,
                    minWidth: 0,
                    flex: 1,
                    padding: "9px 10px",
                    opacity: diaPodeEditar ? 1 : 0.55,
                  }}
                />
                <button
                  type="submit"
                  disabled={!diaPodeEditar || !aguaEntradaMl || Number(aguaEntradaMl) <= 0}
                  style={{ ...btnSecundario, flex: "none", padding: "9px 12px", opacity: !diaPodeEditar || !aguaEntradaMl || Number(aguaEntradaMl) <= 0 ? 0.5 : 1 }}
                >
                  Adicionar
                </button>
              </form>

              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={() => somarAgua(250)} disabled={!diaPodeEditar} style={{ ...btnSecundario, opacity: diaPodeEditar ? 1 : 0.5 }}>
                  +250 ml
                </button>
                <button type="button" onClick={() => somarAgua(500)} disabled={!diaPodeEditar} style={{ ...btnSecundario, opacity: diaPodeEditar ? 1 : 0.5 }}>
                  +500 ml
                </button>
              </div>
            </div>

            <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(52, 70, 94, 0.46)", border: "1px solid rgba(148, 190, 215, 0.16)", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>Observação</span>
                <button
                  type="button"
                  onClick={copiarResumoDoDia}
                  style={{ ...btnSecundario, flex: "none", padding: "4px 9px", fontSize: "11px" }}
                >
                  Copiar resumo
                </button>
              </div>
              <textarea
                rows={3}
                placeholder="Observação do dia..."
                value={observacoes[dataSelecionada] || ""}
                onChange={(e) => setObservacoes((prev) => ({ ...prev, [dataSelecionada]: e.target.value }))}
                style={campoTexto}
              />
              {statusResumo && (
                <div style={{ fontSize: "11px", color: "#c0cce0", whiteSpace: "pre-wrap" }}>{statusResumo}</div>
              )}
            </div>
          </div>
          </fieldset>
        </div>
      )}

      {/* PÁGINA DEDICADA: TIMER */}
      {abaAtiva === "timer" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "760px", margin: "0 auto", width: "100%" }}>
          <div style={{ ...cardClean, padding: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700 }}>Central de tempo</div>
            <div style={{ fontSize: "11px", color: "#a8b6ca" }}>Cronômetro da sessão, contagem regressiva e intervalos de trabalho e descanso.</div>
          </div>
          {/* Central de Tempo */}
          <div style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <div style={{ display: "inline-flex", background: "rgba(38, 54, 75, 0.62)", border: "1px solid rgba(148, 190, 215, 0.19)", borderRadius: "8px", padding: "3px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    setModoTempo("cronometro");
                    setTimerRodando(false);
                    setIntervaloRodando(false);
                  }}
                  style={{
                    padding: "6px 11px",
                    borderRadius: "6px",
                    border: "none",
                    background: modoTempo === "cronometro" ? "#edf1f7" : "transparent",
                    color: modoTempo === "cronometro" ? "#111827" : "#c0cce0",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cronômetro
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModoTempo("timer");
                    setCronometroRodando(false);
                    setIntervaloRodando(false);
                  }}
                  style={{
                    padding: "6px 11px",
                    borderRadius: "6px",
                    border: "none",
                    background: modoTempo === "timer" ? "#7dd3fc" : "transparent",
                    color: modoTempo === "timer" ? "#111827" : "#c0cce0",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Timer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModoTempo("intervalo");
                    setTimerRodando(false);
                  }}
                  style={{
                    padding: "6px 11px",
                    borderRadius: "6px",
                    border: "none",
                    background: modoTempo === "intervalo" ? "#38bdf8" : "transparent",
                    color: modoTempo === "intervalo" ? "#111827" : "#c0cce0",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Intervalo
                </button>
              </div>

              <div style={{ fontSize: "11px", color: "#a8b6ca" }}>
                Ativo: <strong style={{ color: "#c0cce0" }}>{formatarDuracao(tempoAtivoSeg)}</strong> • Descanso:{" "}
                <strong style={{ color: "#c0cce0" }}>{formatarDuracao(tempoDescansoSeg)}</strong>
              </div>
            </div>

            {modoTempo === "cronometro" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                  padding: "6px 2px",
                }}
              >
                <div>
                  <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "#a8b6ca" }}>
                    DURAÇÃO TOTAL DA SESSÃO
                  </div>
                  <div
                    style={{
                      fontSize: ehDesktop ? "44px" : "36px",
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.05,
                      color: cronometroRodando ? "#bae6fd" : "#edf1f7",
                      fontVariantNumeric: "tabular-nums",
                      marginTop: "4px",
                    }}
                  >
                    {formatarDuracao(duracaoSessaoSeg)}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setCronometroRodando((r) => !r)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "9px",
                      border: "none",
                      background: cronometroRodando ? "#7dd3fc" : "#edf1f7",
                      color: "#111827",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    {cronometroRodando ? "Pausar" : "Iniciar"}
                  </button>
                  <button
                    type="button"
                    onClick={concluirSessaoComResumo}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "9px",
                      border: "1px solid #22c55e",
                      background: "rgba(34, 197, 94, 0.14)",
                      color: "#4ade80",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Concluir sessão
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCronometroRodando(false);
                      setDuracaoPorData((prev) => ({ ...prev, [dataSelecionada]: 0 }));
                      setTempoAtivoPorData((prev) => ({ ...prev, [dataSelecionada]: 0 }));
                    }}
                    style={{ ...btnSecundario, flex: "none", padding: "10px 12px" }}
                  >
                    Zerar
                  </button>
                </div>
              </div>
            )}

            {modoTempo === "timer" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "#a8b6ca" }}>
                      CONTAGEM REGRESSIVA
                    </div>
                    <div
                      style={{
                        fontSize: ehDesktop ? "42px" : "34px",
                        fontWeight: 800,
                        color: timerRodando || alarmeTocando ? "#bae6fd" : "#edf1f7",
                        fontVariantNumeric: "tabular-nums",
                        lineHeight: 1.05,
                        marginTop: "4px",
                      }}
                    >
                      {formatarDuracao(displayTimerSeg)}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={iniciarOuPausarTimer}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "9px",
                        border: "none",
                        background: timerRodando ? "#f97316" : "#7dd3fc",
                        color: "#111827",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      {timerRodando ? "Pausar" : "Iniciar Timer"}
                    </button>
                    <button
                      type="button"
                      onClick={resetarTimer}
                      style={{ ...btnSecundario, flex: "none", padding: "10px 12px" }}
                    >
                      Resetar
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  <RoletaColuna
                    label="HORAS"
                    opcoes={HORAS_OPCOES}
                    valor={timerHoras}
                    aoMudar={(h) => {
                      setTimerHoras(h);
                      if (!timerRodando) setTimerRestante(hmsParaSeg(h, timerMinutos, timerSegundos));
                    }}
                  />
                  <RoletaColuna
                    label="MINUTOS"
                    opcoes={MIN_SEG_OPCOES}
                    valor={timerMinutos}
                    aoMudar={(m) => {
                      setTimerMinutos(m);
                      if (!timerRodando) setTimerRestante(hmsParaSeg(timerHoras, m, timerSegundos));
                    }}
                  />
                  <RoletaColuna
                    label="SEGUNDOS"
                    opcoes={MIN_SEG_OPCOES}
                    valor={timerSegundos}
                    aoMudar={(s) => {
                      setTimerSegundos(s);
                      if (!timerRodando) setTimerRestante(hmsParaSeg(timerHoras, timerMinutos, s));
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {[
                    { rotulo: "30s", seg: 30 },
                    { rotulo: "1m", seg: 60 },
                    { rotulo: "1m30s", seg: 90 },
                    { rotulo: "2m", seg: 120 },
                    { rotulo: "3m", seg: 180 },
                  ].map((at) => (
                    <button
                      key={at.rotulo}
                      type="button"
                      onClick={() => aplicarAtalhoTimer(at.seg)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: "7px",
                        border: "1px solid rgba(148, 190, 215, 0.24)",
                        background: "rgba(38, 54, 75, 0.62)",
                        color: "#e8edf5",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      {at.rotulo}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {modoTempo === "intervalo" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: "10px", color: "#38bdf8", letterSpacing: "0.08em" }}>
                      {intervaloFase === "trabalho" ? "FASE DE AÇÃO" : "FASE DE DESCANSO"} • RODADA{" "}
                      {intervaloRodadaAtual}/{intervaloRodadasTotal}
                    </div>
                    <div
                      style={{
                        fontSize: "34px",
                        fontWeight: 800,
                        color: intervaloFase === "trabalho" ? "#edf1f7" : "#38bdf8",
                        fontVariantNumeric: "tabular-nums",
                        lineHeight: 1.05,
                        marginTop: "4px",
                      }}
                    >
                      {formatarDuracao(intervaloRestante)}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setIntervaloRodando((r) => !r)}
                      style={{
                        padding: "9px 14px",
                        borderRadius: "8px",
                        border: "none",
                        background: intervaloRodando ? "#f97316" : "#38bdf8",
                        color: "#111827",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {intervaloRodando ? "Pausar" : "Iniciar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIntervaloRodando(false);
                        setIntervaloFase("trabalho");
                        setIntervaloRodadaAtual(1);
                        setIntervaloRestante(Math.max(5, Number(intervaloTrabalhoSeg) || 40));
                      }}
                      style={{ ...btnSecundario, flex: "none", padding: "9px 12px" }}
                    >
                      Resetar
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  <label style={{ fontSize: "11px", color: "#c0cce0" }}>
                    Ação (s)
                    <input
                      type="number"
                      min={5}
                      value={intervaloTrabalhoSeg}
                      onChange={(e) => {
                        const v = Math.max(5, Number(e.target.value) || 5);
                        setIntervaloTrabalhoSeg(v);
                        if (!intervaloRodando && intervaloFase === "trabalho") setIntervaloRestante(v);
                      }}
                      style={{ ...campoTexto, marginTop: "4px", padding: "6px 8px" }}
                    />
                  </label>
                  <label style={{ fontSize: "11px", color: "#c0cce0" }}>
                    Pausa (s)
                    <input
                      type="number"
                      min={5}
                      value={intervaloDescansoSeg}
                      onChange={(e) => {
                        const v = Math.max(5, Number(e.target.value) || 5);
                        setIntervaloDescansoSeg(v);
                        if (!intervaloRodando && intervaloFase === "descanso") setIntervaloRestante(v);
                      }}
                      style={{ ...campoTexto, marginTop: "4px", padding: "6px 8px" }}
                    />
                  </label>
                  <label style={{ fontSize: "11px", color: "#c0cce0" }}>
                    Rodadas
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={intervaloRodadasTotal}
                      onChange={(e) => setIntervaloRodadasTotal(Math.max(1, Number(e.target.value) || 1))}
                      style={{ ...campoTexto, marginTop: "4px", padding: "6px 8px" }}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* PÁGINA DEDICADA: SUPLEMENTOS */}
      {abaAtiva === "suplementos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => setFormSuplementoAberto((aberto) => !aberto)}
              style={{ ...btnSecundario, background: "#3b82f6", color: "#071426", border: 0, fontWeight: 800, padding: "10px 18px" }}
            >
              {formSuplementoAberto ? "Fechar cadastro" : "＋ Registrar"}
            </button>
          </div>

          {formSuplementoAberto && (
          <form onSubmit={adicionarSuplemento} style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>Novo suplemento</div>

            <div style={{ display: "grid", gridTemplateColumns: ehDesktop ? "1fr 1fr" : "1fr", gap: "8px" }}>
              <div>
                <label style={rotuloCampo}>Nome do produto</label>
                <input
                  type="text"
                  placeholder="Ex.: Creatina Monohidratada"
                  value={novoSupNome}
                  onChange={(e) => setNovoSupNome(e.target.value)}
                  style={campoTexto}
                />
              </div>

              <div>
                <label style={rotuloCampo}>Dose / horário</label>
                <input
                  type="text"
                  placeholder="Ex.: 5g após o treino"
                  value={novoSupDose}
                  onChange={(e) => setNovoSupDose(e.target.value)}
                  style={campoTexto}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: ehDesktop ? "1fr 180px" : "1fr", gap: "8px" }}>
              <div>
                <label style={rotuloCampo}>Marca / sabor / observação</label>
                <input
                  type="text"
                  placeholder="Ex.: Neutro • pote de 300g"
                  value={novoSupDetalhe}
                  onChange={(e) => setNovoSupDetalhe(e.target.value)}
                  style={campoTexto}
                />
              </div>

              <div>
                <label style={rotuloCampo}>Status</label>
                <select
                  value={novoSupStatus}
                  onChange={(e) => setNovoSupStatus(e.target.value)}
                  style={campoTexto}
                >
                  {STATUS_SUPLEMENTO.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <label style={{ ...btnSecundario, flex: "none", padding: "7px 12px", cursor: "pointer" }}>
                {novoSupFoto ? "Trocar foto" : "Tirar foto / Escolher imagem"}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={aoEscolherFotoSuplemento}
                  style={{ display: "none" }}
                />
              </label>

              {novoSupFoto && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <img
                    src={novoSupFoto}
                    alt="Prévia do suplemento"
                    style={{ width: "44px", height: "44px", objectFit: "cover", borderRadius: "8px", border: "1px solid rgba(148, 190, 215, 0.24)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setNovoSupFoto("")}
                    style={{ background: "none", border: "none", color: "#f87171", fontSize: "11px", cursor: "pointer" }}
                  >
                    Remover foto
                  </button>
                </div>
              )}
            </div>

            {avisoSupFoto && <div style={{ fontSize: "11px", color: "#f87171" }}>{avisoSupFoto}</div>}

            <button
              type="submit"
              style={{
                padding: "9px",
                borderRadius: "8px",
                border: "none",
                background: "#edf1f7",
                color: "#111827",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Salvar suplemento
            </button>
          </form>
          )}

          {suplementos.length === 0 ? (
            <div style={{ ...cardClean, textAlign: "center", color: "#a8b6ca", fontSize: "13px" }}>
              Nenhum suplemento cadastrado ainda.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: ehDesktop ? "repeat(2, 1fr)" : "1fr",
                gap: "12px",
              }}
            >
              {suplementos.map((sup) => (
                <div
                  key={sup.id}
                  style={{
                    ...cardClean,
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  {sup.fotoDataUrl ? (
                    <img
                      src={sup.fotoDataUrl}
                      alt={sup.nome}
                      style={{
                        width: "76px",
                        height: "76px",
                        objectFit: "cover",
                        borderRadius: "10px",
                        border: "1px solid rgba(148, 190, 215, 0.24)",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "76px",
                        height: "76px",
                        borderRadius: "10px",
                        background: "rgba(38, 54, 75, 0.62)",
                        border: "1px solid rgba(148, 190, 215, 0.19)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        color: "#a8b6ca",
                        flexShrink: 0,
                      }}
                    >
                      Sem foto
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                      <strong style={{ fontSize: "14px", color: "#edf1f7" }}>{sup.nome}</strong>
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 7px",
                          borderRadius: "6px",
                          background:
                            sup.status === "Acabando"
                              ? "rgba(251, 191, 36, 0.15)"
                              : sup.status === "Ativo"
                              ? "rgba(34, 197, 94, 0.14)"
                              : "rgba(148, 190, 215, 0.16)",
                          color:
                            sup.status === "Acabando"
                              ? "#fbbf24"
                              : sup.status === "Ativo"
                              ? "#4ade80"
                              : "#c0cce0",
                          border: "1px solid rgba(148, 190, 215, 0.24)",
                        }}
                      >
                        {sup.status}
                      </span>
                    </div>

                    {sup.dose && <div style={{ fontSize: "12px", color: "#c0cce0" }}>{sup.dose}</div>}
                    {sup.detalhe && <div style={{ fontSize: "11px", color: "#a8b6ca" }}>{sup.detalhe}</div>}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {STATUS_SUPLEMENTO.map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => alterarStatusSuplemento(sup.id, st)}
                            style={{
                              padding: "3px 7px",
                              borderRadius: "6px",
                              border: "1px solid rgba(148, 190, 215, 0.24)",
                              background: sup.status === st ? "rgba(148, 190, 215, 0.16)" : "#111827",
                              color: sup.status === st ? "#bae6fd" : "#a8b6ca",
                              fontSize: "10px",
                              cursor: "pointer",
                            }}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => removerSuplemento(sup.id)}
                        style={{ background: "none", border: "none", color: "#a8b6ca", fontSize: "11px", cursor: "pointer" }}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PÁGINA DEDICADA: ALIMENTAÇÃO & ROTINA */}
      {abaAtiva === "alimentacao" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {!diaPodeEditar && <div style={{ padding: "10px 12px", borderRadius: "9px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.28)", color: "#fbbf24", fontSize: "12px" }}>Dia fechado para alterações. Os registros podem ser consultados, mas não modificados.</div>}
          <fieldset disabled={!diaPodeEditar} style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Qualidade do sono */}
          <div style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600 }}>Qualidade do sono ({dataSelecionada})</span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {QUALIDADE_SONO.map((q) => {
                const ativo = sonoDia === q;
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => selecionarSono(q)}
                    style={{
                      padding: "6px 11px",
                      borderRadius: "8px",
                      border: "1px solid rgba(148, 190, 215, 0.24)",
                      background: ativo ? "rgba(125, 211, 252, 0.14)" : "#111827",
                      color: ativo ? "#bae6fd" : "#c0cce0",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {q}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Janela pré/pós-treino + Refeição livre */}
          <div style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600 }}>Janela de treino & refeições</span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => alternarJanelaTreino("pre")}
                style={{
                  ...btnSecundario,
                  flex: "none",
                  padding: "7px 11px",
                  fontSize: "11px",
                  borderColor: janelaTreinoDia.pre ? "#22c55e" : "rgba(148, 190, 215, 0.24)",
                  color: janelaTreinoDia.pre ? "#4ade80" : "#c0cce0",
                }}
              >
                {janelaTreinoDia.pre ? "✓ Pré-treino feito" : "Pré-treino pendente"}
              </button>
              <button
                type="button"
                onClick={() => alternarJanelaTreino("pos")}
                style={{
                  ...btnSecundario,
                  flex: "none",
                  padding: "7px 11px",
                  fontSize: "11px",
                  borderColor: janelaTreinoDia.pos ? "#22c55e" : "rgba(148, 190, 215, 0.24)",
                  color: janelaTreinoDia.pos ? "#4ade80" : "#c0cce0",
                }}
              >
                {janelaTreinoDia.pos ? "✓ Pós-treino feito" : "Pós-treino pendente"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setRefeicaoLivrePorData((prev) => ({
                    ...prev,
                    [dataSelecionada]: !prev[dataSelecionada],
                  }))
                }
                style={{
                  ...btnSecundario,
                  flex: "none",
                  padding: "7px 11px",
                  fontSize: "11px",
                  borderColor: refeicaoLivreDia ? "#bae6fd" : "rgba(148, 190, 215, 0.24)",
                  color: refeicaoLivreDia ? "#bae6fd" : "#c0cce0",
                }}
              >
                {refeicaoLivreDia ? "✓ Refeição fora / livre" : "Marcar refeição fora / livre"}
              </button>
            </div>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {refeicoesModelos.map((ref) => {
                const feita = refeicoesFeitasDia.includes(ref.id);
                return (
                  <button
                    key={ref.id}
                    type="button"
                    onClick={() => alternarRefeicaoFeita(ref.id)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "8px",
                      border: "1px solid rgba(148, 190, 215, 0.24)",
                      background: feita ? "rgba(34, 197, 94, 0.14)" : "#111827",
                      color: feita ? "#4ade80" : "#e8edf5",
                      fontSize: "11px",
                      fontWeight: feita ? 600 : 400,
                      cursor: "pointer",
                    }}
                  >
                    {feita ? "✓ " : ""}
                    {ref.nome}
                  </button>
                );
              })}
            </div>

            <form onSubmit={adicionarModeloRefeicao} style={{ display: "flex", gap: "6px" }}>
              <input
                type="text"
                placeholder="Nova refeição-padrão..."
                value={novoNomeRefeicao}
                onChange={(e) => setNovoNomeRefeicao(e.target.value)}
                style={{ ...campoTexto, padding: "7px 9px", fontSize: "12px" }}
              />
              <button type="submit" style={{ ...btnSecundario, flex: "none", padding: "7px 12px" }}>
                Salvar
              </button>
            </form>
          </div>

          {/* Contador de cafeína / pré-treino */}
          <div style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600 }}>Cafeína & pré-treino</span>
            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={novoRotuloCafeina}
                onChange={(e) => setNovoRotuloCafeina(e.target.value)}
                style={{ ...campoTexto, width: "auto", padding: "7px 9px", fontSize: "12px" }}
              >
                <option value="Café">Café</option>
                <option value="Pré-treino">Pré-treino</option>
                <option value="Energético">Energético</option>
              </select>
              <button
                type="button"
                onClick={registrarCafeina}
                style={{ ...btnSecundario, flex: "none", padding: "7px 12px", color: "#bae6fd" }}
              >
                + Registrar agora ({cafeinaDia.length})
              </button>
            </div>

            {cafeinaDia.length > 0 && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {cafeinaDia.map((c) => (
                  <span
                    key={c.id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      background: "rgba(38, 54, 75, 0.62)",
                      border: "1px solid rgba(148, 190, 215, 0.24)",
                      fontSize: "11px",
                    }}
                  >
                    {c.rotulo} • {c.hora}
                    <button
                      type="button"
                      onClick={() => removerCafeina(c.id)}
                      style={{ background: "none", border: "none", color: "#a8b6ca", cursor: "pointer", padding: 0 }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Cardio e atividade extra */}
          <div style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600 }}>Cardio & atividade extra</span>
            <form onSubmit={adicionarCardio} style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <select
                value={novoTipoCardio}
                onChange={(e) => setNovoTipoCardio(e.target.value)}
                style={{ ...campoTexto, width: "auto", padding: "7px 9px", fontSize: "12px" }}
              >
                {TIPOS_CARDIO.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={novoMinCardio}
                onChange={(e) => setNovoMinCardio(e.target.value)}
                style={{ ...campoTexto, width: "80px", padding: "7px 9px", fontSize: "12px" }}
              />
              <button type="submit" style={{ ...btnSecundario, flex: "none", padding: "7px 12px" }}>
                + Adicionar min
              </button>
            </form>

            {cardioDia.length > 0 && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {cardioDia.map((c) => (
                  <span
                    key={c.id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      background: "rgba(38, 54, 75, 0.62)",
                      border: "1px solid rgba(148, 190, 215, 0.24)",
                      fontSize: "11px",
                    }}
                  >
                    {c.tipo}: {c.minutos} min
                    <button
                      type="button"
                      onClick={() => removerCardio(c.id)}
                      style={{ background: "none", border: "none", color: "#a8b6ca", cursor: "pointer", padding: 0 }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          </fieldset>
        </div>
      )}

      {/* PÁGINA DEDICADA: MOCHILA & RITMO */}
      {abaAtiva === "mochila" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {!diaPodeEditar && <div style={{ padding: "10px 12px", borderRadius: "9px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.28)", color: "#fbbf24", fontSize: "12px" }}>Dia fechado para alterações. Os registros podem ser consultados, mas não modificados.</div>}
          <fieldset disabled={!diaPodeEditar} style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Checklist da mochila */}
          <div style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600 }}>Checklist da mochila / saída</span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {itensMochila.map((item) => {
                const marcado = mochilaMarcadaDia.includes(item.id);
                return (
                  <div
                    key={item.id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 10px",
                      borderRadius: "8px",
                      border: "1px solid rgba(148, 190, 215, 0.24)",
                      background: marcado ? "rgba(34, 197, 94, 0.14)" : "#111827",
                      fontSize: "11px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => alternarItemMochila(item.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: marcado ? "#4ade80" : "#e8edf5",
                        cursor: "pointer",
                        padding: 0,
                        fontWeight: marcado ? 600 : 400,
                      }}
                    >
                      {marcado ? "✓ " : ""}
                      {item.nome}
                    </button>
                    <button
                      type="button"
                      onClick={() => removerItemMochila(item.id)}
                      style={{ background: "none", border: "none", color: "#a8b6ca", cursor: "pointer", padding: 0 }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            <form onSubmit={adicionarItemMochila} style={{ display: "flex", gap: "6px" }}>
              <input
                type="text"
                placeholder="Novo item da mochila..."
                value={novoItemMochila}
                onChange={(e) => setNovoItemMochila(e.target.value)}
                style={{ ...campoTexto, padding: "7px 9px", fontSize: "12px" }}
              />
              <button type="submit" style={{ ...btnSecundario, flex: "none", padding: "7px 12px" }}>
                Adicionar
              </button>
            </form>
          </div>

          {/* Meta semanal & Foco por dia */}
          <div style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600 }}>Meta semanal de treinos</span>
              <label style={{ fontSize: "12px", color: "#c0cce0" }}>
                Meta{" "}
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={metaTreinosSemana}
                  onChange={(e) => setMetaTreinosSemana(e.target.value)}
                  style={{
                    width: "44px",
                    background: "rgba(38, 54, 75, 0.62)",
                    color: "#edf1f7",
                    border: "1px solid rgba(148, 190, 215, 0.24)",
                    borderRadius: "6px",
                    padding: "3px 6px",
                    fontSize: "12px",
                  }}
                />{" "}
                x/semana
              </label>
            </div>
            <div style={{ fontSize: "12px", color: "#c0cce0" }}>
              Últimos 7 dias: <strong style={{ color: "#edf1f7" }}>{dashboardData.treinos7d}</strong>/{dashboardData.metaSemanalSegura} ({dashboardData.metaSemanalPct}%)
            </div>
            <div style={{ height: "4px", background: "rgba(148, 163, 184, 0.18)", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${dashboardData.metaSemanalPct}%`, height: "100%", background: "#bae6fd" }} />
            </div>

            <div style={{ paddingTop: "8px", borderTop: "1px solid rgba(148, 190, 215, 0.16)", display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "11px", color: "#c0cce0" }}>Foco por dia da semana</span>
              {DIAS_SEMANA.map((d) => (
                <div key={d.chave} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "36px", fontSize: "12px", color: "#c0cce0" }}>{d.rotulo}</span>
                  <input
                    type="text"
                    placeholder="Ex.: Peito/Tríceps, Pernas, Descanso..."
                    value={focoDiasPorChave[d.chave] || ""}
                    onChange={(e) =>
                      setFocoDiasPorChave((prev) => ({ ...prev, [d.chave]: e.target.value }))
                    }
                    style={{ ...campoTexto, padding: "6px 8px", fontSize: "11px" }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Duplicar dia na semana / Limpar dia */}
          <div style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600 }}>Reorganizar dias da semana</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <select
                value={diaOrigemSemanaCopia}
                onChange={(e) => setDiaOrigemSemanaCopia(e.target.value)}
                style={{ ...campoTexto, width: "auto", padding: "7px 9px", fontSize: "12px" }}
              >
                {DIAS_SEMANA.map((d) => (
                  <option key={d.chave} value={d.chave}>
                    Origem: {d.rotulo}
                  </option>
                ))}
              </select>
              <select
                value={diaDestinoSemanaCopia}
                onChange={(e) => setDiaDestinoSemanaCopia(e.target.value)}
                style={{ ...campoTexto, width: "auto", padding: "7px 9px", fontSize: "12px" }}
              >
                {DIAS_SEMANA.map((d) => (
                  <option key={d.chave} value={d.chave}>
                    Destino: {d.rotulo}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={duplicarDiaNaSemana}
                disabled={diaOrigemSemanaCopia === diaDestinoSemanaCopia || (rotina[diaOrigemSemanaCopia] || []).length === 0}
                style={{
                  ...btnSecundario,
                  flex: "none",
                  padding: "7px 11px",
                  opacity:
                    diaOrigemSemanaCopia === diaDestinoSemanaCopia || (rotina[diaOrigemSemanaCopia] || []).length === 0
                      ? 0.45
                      : 1,
                }}
              >
                Copiar ficha
              </button>
              <button
                type="button"
                onClick={() => limparDiaRotina(diaDestinoSemanaCopia)}
                style={{ ...btnSecundario, flex: "none", padding: "7px 11px", color: "#f87171" }}
              >
                Limpar {diaDestinoSemanaCopia.toUpperCase()}
              </button>
            </div>
          </div>
          </fieldset>
        </div>
      )}

      {/* MONTAR TREINOS */}
      {abaAtiva === "montar" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
              {DIAS_SEMANA.map((d) => {
                const ativa = d.chave === diaMontagem;
                return (
                  <button
                    key={d.chave}
                    type="button"
                    onClick={() => {
                      setEditandoId(null);
                      setDiaMontagem(d.chave);
                    }}
                    style={{
                      padding: "7px 10px",
                      borderRadius: "8px",
                      border: "none",
                      background: ativa ? "rgba(148, 190, 215, 0.16)" : "transparent",
                      color: ativa ? "#edf1f7" : "#a8b6ca",
                      fontSize: "12px",
                      fontWeight: ativa ? 700 : 500,
                      cursor: "pointer",
                    }}
                  >
                    {d.rotulo}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <select
                value={modoAplicacaoRotina}
                onChange={(e) => setModoAplicacaoRotina(e.target.value)}
                style={{ ...campoTexto, width: "auto", padding: "6px 8px", fontSize: "11px" }}
              >
                <option value="somar">Somar ao dia</option>
                <option value="substituir">Substituir dia</option>
              </select>

              <select
                value={diaOrigemCopia}
                onChange={(e) => setDiaOrigemCopia(e.target.value)}
                style={{ ...campoTexto, width: "auto", padding: "6px 8px", fontSize: "11px" }}
              >
                {DIAS_SEMANA.map((d) => (
                  <option key={d.chave} value={d.chave}>
                    Copiar {d.rotulo}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={copiarTreinoDeOutroDia}
                disabled={diaOrigemCopia === diaMontagem || (rotina[diaOrigemCopia] || []).length === 0}
                style={{
                  ...btnSecundario,
                  flex: "none",
                  padding: "6px 10px",
                  fontSize: "11px",
                  opacity: diaOrigemCopia === diaMontagem || (rotina[diaOrigemCopia] || []).length === 0 ? 0.45 : 1,
                }}
              >
                Duplicar dia
              </button>
            </div>
          </div>

          <div style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontSize: "11px", color: "#c0cce0" }}>Modelos de treino</div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <select
                value={presetSelecionadoId}
                onChange={(e) => setPresetSelecionadoId(e.target.value)}
                style={{ ...campoTexto, flex: 1, minWidth: "160px", padding: "7px 8px", fontSize: "11px" }}
              >
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} ({p.exercicios.length})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={aplicarPresetNoDia}
                style={{ ...btnSecundario, flex: "none", padding: "7px 10px", fontSize: "11px" }}
              >
                Aplicar no dia
              </button>
            </div>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Nome do modelo (ex.: Upper A)"
                value={novoPresetNome}
                onChange={(e) => setNovoPresetNome(e.target.value)}
                style={{ ...campoTexto, flex: 1, minWidth: "160px", padding: "7px 8px", fontSize: "11px" }}
              />
              <button
                type="button"
                onClick={salvarPresetDoDia}
                disabled={!novoPresetNome.trim() || (rotina[diaMontagem] || []).length === 0}
                style={{
                  ...btnSecundario,
                  flex: "none",
                  padding: "7px 10px",
                  fontSize: "11px",
                  opacity: !novoPresetNome.trim() || (rotina[diaMontagem] || []).length === 0 ? 0.45 : 1,
                }}
              >
                Salvar dia como modelo
              </button>
            </div>
          </div>

          <form onSubmit={adicionarExercicio} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <label style={rotuloCampo}>Exercício</label>
              <input
                type="text"
                placeholder="Ex.: Supino Reto"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                style={campoTexto}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              <div>
                <label style={rotuloCampo}>Séries x Reps</label>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setNovoSeriesReps((v) => ajustarSeriesNoTexto(v, -1))}
                    style={btnCarga}
                  >
                    -
                  </button>
                  <input
                    type="text"
                    placeholder="Ex.: 4x10"
                    value={novoSeriesReps}
                    onChange={(e) => setNovoSeriesReps(e.target.value)}
                    style={{ ...campoTexto, padding: "8px 6px", textAlign: "center" }}
                  />
                  <button
                    type="button"
                    onClick={() => setNovoSeriesReps((v) => ajustarSeriesNoTexto(v, 1))}
                    style={btnCarga}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label style={rotuloCampo}>Descanso (s)</label>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setNovoDescanso((v) => Math.max(5, (Number(v) || 0) - 5))}
                    style={btnCarga}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    placeholder="60"
                    value={novoDescanso}
                    onChange={(e) => setNovoDescanso(e.target.value)}
                    style={{ ...campoTexto, padding: "8px 6px", textAlign: "center" }}
                  />
                  <button
                    type="button"
                    onClick={() => setNovoDescanso((v) => (Number(v) || 0) + 5)}
                    style={btnCarga}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label style={rotuloCampo}>Carga (kg)</label>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setNovoCarga((v) => Math.max(0, (Number(v) || 0) - 2))}
                    style={btnCarga}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    placeholder="20"
                    value={novoCarga}
                    onChange={(e) => setNovoCarga(e.target.value)}
                    style={{ ...campoTexto, padding: "8px 6px", textAlign: "center" }}
                  />
                  <button
                    type="button"
                    onClick={() => setNovoCarga((v) => (Number(v) || 0) + 2)}
                    style={btnCarga}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              style={{
                padding: "9px",
                borderRadius: "8px",
                border: "none",
                background: "#edf1f7",
                color: "#111827",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Adicionar
            </button>
          </form>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: ehDesktop ? "repeat(2, 1fr)" : "1fr",
              gap: "8px",
            }}
          >
            {(rotina[diaMontagem] || []).map((item, idx) => {
              const estaEditando = editandoId === item.id;
              return (
                <div
                  key={item.id}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "rgba(52, 70, 94, 0.46)",
                    border: "1px solid rgba(148, 190, 215, 0.16)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    fontSize: "13px",
                  }}
                >
                  {estaEditando ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <input
                        type="text"
                        value={editForm.nome}
                        onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))}
                        style={{ ...campoTexto, padding: "6px 8px" }}
                      />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                        <input
                          type="text"
                          value={editForm.seriesReps}
                          onChange={(e) => setEditForm((f) => ({ ...f, seriesReps: e.target.value }))}
                          style={{ ...campoTexto, padding: "6px 8px" }}
                        />
                        <input
                          type="number"
                          value={editForm.descanso}
                          onChange={(e) => setEditForm((f) => ({ ...f, descanso: e.target.value }))}
                          style={{ ...campoTexto, padding: "6px 8px" }}
                        />
                        <input
                          type="number"
                          value={editForm.carga}
                          onChange={(e) => setEditForm((f) => ({ ...f, carga: e.target.value }))}
                          style={{ ...campoTexto, padding: "6px 8px" }}
                        />
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => setEditandoId(null)}
                          style={{ ...btnSecundario, flex: "none", padding: "5px 9px", fontSize: "11px" }}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => salvarEdicao(diaMontagem, item.id)}
                          style={{
                            padding: "5px 10px",
                            borderRadius: "7px",
                            border: "none",
                            background: "#edf1f7",
                            color: "#111827",
                            fontWeight: 700,
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                      <div>
                        <strong>{item.nome}</strong>{" "}
                        <span style={{ color: "#c0cce0", fontSize: "12px" }}>
                          • {item.seriesReps} • {item.descanso}s • {item.carga}kg
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button
                          type="button"
                          onClick={() => moverExercicio(diaMontagem, idx, -1)}
                          disabled={idx === 0}
                          style={{ ...btnCarga, opacity: idx === 0 ? 0.35 : 1 }}
                          title="Subir"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moverExercicio(diaMontagem, idx, 1)}
                          disabled={idx === (rotina[diaMontagem] || []).length - 1}
                          style={{
                            ...btnCarga,
                            opacity: idx === (rotina[diaMontagem] || []).length - 1 ? 0.35 : 1,
                          }}
                          title="Descer"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(item)}
                          style={{ background: "none", border: "none", color: "#c0cce0", cursor: "pointer", fontSize: "11px" }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => removerExercicio(diaMontagem, item.id)}
                          style={{ background: "none", border: "none", color: "#a8b6ca", cursor: "pointer", fontSize: "11px" }}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      {abaAtiva === "dashboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {(dashboardData.diasSemBackup === null || dashboardData.diasSemBackup >= 7) && (
            <div style={{ fontSize: "11px", color: "#fbbf24", background: "rgba(251, 191, 36, 0.08)", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(251, 191, 36, 0.25)" }}>
              {dashboardData.diasSemBackup === null
                ? "Dica: faça seu primeiro backup JSON abaixo para proteger seu histórico."
                : `Faz ${dashboardData.diasSemBackup} dias desde o último backup JSON.`}
            </div>
          )}

          {/* Resumo semanal automático */}
          <div style={cardClean}>
            <div style={{ ...labelMini, marginBottom: "6px" }}>Resumo da semana (7 dias)</div>
            <div style={{ fontSize: "12px", color: "#e8edf5", lineHeight: 1.5 }}>
              <strong>{dashboardData.treinos7d}</strong> treino(s) •{" "}
              <strong>{dashboardData.volume7dAtual.toLocaleString("pt-BR")} kg</strong> de volume • cardio{" "}
              <strong>{dashboardData.minCardio7d} min</strong> • média de{" "}
              <strong>{dashboardData.mediaAgua7DiasMl} ml/dia</strong> de água •{" "}
              <strong>{dashboardData.diasSonoRuim7d}</strong> dia(s) com sono curto.
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            <div style={cardClean}>
              <div style={labelMini}>Mês</div>
              <div style={valorMini}>{dashboardData.treinosMes}</div>
            </div>
            <div style={cardClean}>
              <div style={labelMini}>Maior carga</div>
              <div style={valorMini}>{dashboardData.maiorCarga ? `${dashboardData.maiorCarga.carga}kg` : "—"}</div>
            </div>
            <div style={cardClean}>
              <div style={labelMini}>Sequência</div>
              <div style={valorMini}>{dashboardData.streak}d</div>
            </div>
          </div>

          {(dashboardData.estagnados.length > 0 || Object.keys(dashboardData.contagemSinais).length > 0) && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: ehDesktop ? "repeat(2, 1fr)" : "1fr",
                gap: "12px",
              }}
            >
              {dashboardData.estagnados.length > 0 && (
                <div style={cardClean}>
                  <div style={{ ...labelMini, color: "#fbbf24", marginBottom: "6px" }}>Atenção à estagnação</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px" }}>
                    {dashboardData.estagnados.map((est, i) => (
                      <div key={i}>
                        <strong style={{ textTransform: "capitalize" }}>{est.nome}</strong> — parado em {est.carga}kg (varie reps ou estímulo)
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(dashboardData.contagemSinais).length > 0 && (
                <div style={cardClean}>
                  <div style={{ ...labelMini, marginBottom: "6px" }}>Sinais registrados no corpo</div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", fontSize: "11px" }}>
                    {Object.entries(dashboardData.contagemSinais).map(([sinal, qtd]) => (
                      <span
                        key={sinal}
                        style={{
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: "rgba(38, 54, 75, 0.62)",
                          border: "1px solid rgba(148, 190, 215, 0.24)",
                          color: "#e8edf5",
                        }}
                      >
                        {sinal}: <strong>{qtd}x</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: ehDesktop ? "repeat(2, 1fr)" : "1fr",
              gap: "12px",
            }}
          >
            <div style={cardClean}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={labelMini}>Meta mensal de treinos</span>
                <label style={{ fontSize: "11px", color: "#c0cce0" }}>
                  Meta{" "}
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={metaTreinosMes}
                    onChange={(e) => setMetaTreinosMes(e.target.value)}
                    style={{
                      width: "44px",
                      background: "rgba(38, 54, 75, 0.62)",
                      color: "#edf1f7",
                      border: "1px solid rgba(148, 190, 215, 0.24)",
                      borderRadius: "6px",
                      padding: "2px 5px",
                      fontSize: "11px",
                    }}
                  />{" "}
                  dias
                </label>
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                {dashboardData.treinosMes}/{dashboardData.metaMensalSegura} dias ({dashboardData.metaMensalPct}%)
              </div>
              <div style={{ height: "4px", background: "rgba(148, 163, 184, 0.18)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: `${dashboardData.metaMensalPct}%`, height: "100%", background: "#7dd3fc" }} />
              </div>
            </div>

            <div style={cardClean}>
              <div style={labelMini}>Volume nos últimos 7 dias</div>
              <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "6px" }}>
                {dashboardData.volume7dAtual.toLocaleString("pt-BR")} kg
              </div>
              <div style={{ fontSize: "11px", color: "#a8b6ca", marginTop: "4px" }}>
                vs 7d anteriores:{" "}
                <span style={{ color: dashboardData.diffVolumeSemanal >= 0 ? "#22c55e" : "#f87171" }}>
                  {dashboardData.diffVolumeSemanal >= 0 ? "+" : ""}
                  {dashboardData.diffVolumeSemanal.toLocaleString("pt-BR")} kg
                  {dashboardData.pctVolumeSemanal !== null
                    ? ` (${dashboardData.pctVolumeSemanal >= 0 ? "+" : ""}${dashboardData.pctVolumeSemanal}%)`
                    : ""}
                </span>
              </div>
            </div>
          </div>

          <div style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
              <span style={labelMini}>Água nos últimos 7 dias</span>
              <span style={{ fontSize: "12px", fontWeight: 600 }}>
                Média de {dashboardData.mediaAgua7DiasMl} ml/dia • Meta {metaAguaMl} ml/dia ({pesoKg} kg)
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
              {dashboardData.agua7Dias.map((item) => {
                const pct = Math.min(100, Math.round((item.ml / metaAguaMl) * 100));
                return (
                  <div
                    key={item.dataISO}
                    title={`${item.dataISO}: ${item.ml} ml`}
                    style={{
                      background: "rgba(38, 54, 75, 0.62)",
                      border: "1px solid rgba(148, 190, 215, 0.16)",
                      borderRadius: "7px",
                      padding: "6px 4px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span style={{ fontSize: "10px", color: "#a8b6ca" }}>{item.rotulo}</span>
                    <div
                      style={{
                        width: "100%",
                        maxWidth: "18px",
                        height: "36px",
                        background: "rgba(148, 163, 184, 0.20)",
                        borderRadius: "5px",
                        display: "flex",
                        alignItems: "flex-end",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ width: "100%", height: `${pct}%`, background: "#38bdf8" }} />
                    </div>
                    <span style={{ fontSize: "10px", color: "#c0cce0" }}>{item.ml}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700 }}>Painel geral de atividades</div>
              <div style={{ fontSize: "11px", color: "#a8b6ca", marginTop: "3px" }}>Visão dos registros dos últimos 7 dias. Cada linha mostra os dados disponíveis daquele dia.</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: ehDesktop ? "repeat(4, 1fr)" : "repeat(2, 1fr)", gap: "8px" }}>
              <div style={{ background: "rgba(38, 54, 75, 0.62)", border: "1px solid rgba(148, 190, 215, 0.16)", borderRadius: "8px", padding: "9px" }}><div style={labelMini}>Refeições marcadas</div><div style={{ fontSize: "18px", fontWeight: 800 }}>{dashboardData.refeicoes7d}</div></div>
              <div style={{ background: "rgba(38, 54, 75, 0.62)", border: "1px solid rgba(148, 190, 215, 0.16)", borderRadius: "8px", padding: "9px" }}><div style={labelMini}>Cafeína registrada</div><div style={{ fontSize: "18px", fontWeight: 800 }}>{dashboardData.cafeina7d}</div></div>
              <div style={{ background: "rgba(38, 54, 75, 0.62)", border: "1px solid rgba(148, 190, 215, 0.16)", borderRadius: "8px", padding: "9px" }}><div style={labelMini}>Mochila média</div><div style={{ fontSize: "18px", fontWeight: 800 }}>{dashboardData.mochilaMedia7d}%</div></div>
              <div style={{ background: "rgba(38, 54, 75, 0.62)", border: "1px solid rgba(148, 190, 215, 0.16)", borderRadius: "8px", padding: "9px" }}><div style={labelMini}>Suplementos ativos</div><div style={{ fontSize: "18px", fontWeight: 800 }}>{dashboardData.suplementosAtivos}</div></div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {dashboardData.atividade7Dias.map((dia) => {
                const barras = [
                  { nome: "Água", valor: dia.aguaMl, unidade: "ml", max: Math.max(metaAguaMl, ...dashboardData.atividade7Dias.map((x) => x.aguaMl), 1), cor: "#38bdf8" },
                  { nome: "Tempo ativo", valor: dia.duracaoMin, unidade: "min", max: Math.max(60, ...dashboardData.atividade7Dias.map((x) => x.duracaoMin), 1), cor: "#7dd3fc" },
                  { nome: "Cardio", valor: dia.cardioMin, unidade: "min", max: Math.max(30, ...dashboardData.atividade7Dias.map((x) => x.cardioMin), 1), cor: "#34d399" },
                  { nome: "Volume", valor: dia.volumeKg, unidade: "kg", max: Math.max(100, ...dashboardData.atividade7Dias.map((x) => x.volumeKg), 1), cor: "#f59e0b" },
                ];
                return (
                  <div key={dia.dataISO} style={{ padding: "9px", borderRadius: "8px", background: "rgba(38, 54, 75, 0.62)", border: "1px solid rgba(148, 190, 215, 0.16)", display: "grid", gridTemplateColumns: ehDesktop ? "58px 1fr 1fr" : "42px 1fr", gap: "8px", alignItems: "center" }}>
                    <div style={{ fontSize: "11px", color: "#c0cce0", fontWeight: 700 }}>{dia.rotulo}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "7px" }}>
                      {barras.map((barra) => <div key={barra.nome} style={{ minWidth: 0 }}><div style={{ display: "flex", justifyContent: "space-between", gap: "4px", fontSize: "9px", color: "#a8b6ca", marginBottom: "3px" }}><span>{barra.nome}</span><strong style={{ color: "#e8edf5" }}>{barra.valor}{barra.unidade}</strong></div><div style={{ height: "5px", borderRadius: "99px", background: "rgba(148, 163, 184, 0.20)", overflow: "hidden" }}><div style={{ width: `${Math.min(100, Math.round((barra.valor / barra.max) * 100))}%`, height: "100%", background: barra.cor, borderRadius: "99px" }} /></div></div>)}
                    </div>
                    <div style={{ gridColumn: ehDesktop ? "auto" : "2", display: "flex", flexWrap: "wrap", gap: "5px", fontSize: "9px", color: "#a8b6ca" }}>
                      <span>{dia.treino ? "✓ Treino" : "— Treino"}</span><span>• {dia.refeicoes} refeições</span><span>• {dia.cafeina} cafeína</span><span>• Mochila {dia.mochilaPct}%</span><span>• {dia.aquecimento ? "Aquecimento ✓" : "Sem aquecimento"}</span><span>• {dia.sinais} sinais</span><span>• Sono: {dia.sono}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: "10px", color: "#a8b6ca" }}>Os itens sem registro aparecem como zero ou “Não registrado”; suplementos ativos representam sua lista atual, não um consumo diário.</div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: ehDesktop ? "repeat(2, 1fr)" : "1fr",
              gap: "12px",
            }}
          >
            <div style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {[
                  { id: "4w", nome: "4 sem" },
                  { id: "3m", nome: "3 meses" },
                  { id: "all", nome: "Tudo" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriodoFiltro(p.id)}
                    style={{
                      padding: "5px 9px",
                      borderRadius: "6px",
                      border: "none",
                      background: periodoFiltro === p.id ? "#222228" : "#111827",
                      color: periodoFiltro === p.id ? "#edf1f7" : "#a8b6ca",
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                  >
                    {p.nome}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <select value={diaSemanaFiltro} onChange={(e) => setDiaSemanaFiltro(e.target.value)} style={campoTexto}>
                  <option value="TODOS">Todos os dias</option>
                  {DIAS_SEMANA.map((d) => (
                    <option key={d.chave} value={d.chave}>
                      {d.rotulo}
                    </option>
                  ))}
                </select>

                <select value={exercicioFiltro} onChange={(e) => setExercicioFiltro(e.target.value)} style={campoTexto}>
                  <option value="TODOS">Todos os exercícios</option>
                  {dashboardData.exerciciosNomes.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {dashboardData.historico.length === 0 ? (
                <div style={{ fontSize: "12px", color: "#a8b6ca" }}>Sem treinos concluídos no filtro.</div>
              ) : (
                dashboardData.historico.map((item, i) => (
                  <div key={`${item.dataISO}-${i}`}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "11px",
                        color: "#c0cce0",
                        marginBottom: "3px",
                      }}
                    >
                      <span>
                        {item.dataISO} • {item.nome}
                      </span>
                      <span>{item.carga}kg</span>
                    </div>
                    <div style={{ height: "4px", background: "rgba(148, 163, 184, 0.18)", borderRadius: "999px" }}>
                      <div
                        style={{
                          width: `${Math.max(10, Math.round((item.carga / dashboardData.maxCarga) * 100))}%`,
                          height: "100%",
                          background: "#edf1f7",
                          borderRadius: "999px",
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "8px" }}>
              <input
                type="text"
                placeholder="Buscar observação..."
                value={buscaNota}
                onChange={(e) => setBuscaNota(e.target.value)}
                style={campoTexto}
              />
              {notas.length === 0 ? (
                <div style={{ fontSize: "12px", color: "#a8b6ca" }}>Nenhuma nota.</div>
              ) : (
                notas.map((n) => (
                  <div key={n.dataISO} style={{ fontSize: "12px", paddingTop: "6px", borderTop: "1px solid rgba(148, 190, 215, 0.16)" }}>
                    <span style={{ color: "#c0cce0", marginRight: "8px" }}>{n.dataISO}</span>
                    <span>{n.texto}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div ref={backupRef} style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>Backup JSON</span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                <button type="button" onClick={copiarBackupJSON} style={{ ...btnSecundario, flex: "none", padding: "6px 10px", fontSize: "11px" }}>
                  Copiar JSON
                </button>
                <button type="button" onClick={baixarBackupJSON} style={{ ...btnSecundario, flex: "none", padding: "6px 10px", fontSize: "11px" }}>
                  Baixar .json
                </button>
                <label style={{ ...btnSecundario, flex: "none", padding: "6px 10px", fontSize: "11px", cursor: "pointer" }}>
                  Importar arquivo
                  <input type="file" accept="application/json,.json" onChange={aoSelecionarArquivoJson} style={{ display: "none" }} />
                </label>
                <button type="button" onClick={importarBackupJSON} style={{ ...btnSecundario, flex: "none", padding: "6px 10px", fontSize: "11px" }}>
                  Restaurar texto
                </button>
              </div>
            </div>
            <textarea
              rows={3}
              placeholder="Cole aqui um backup JSON para restaurar ou clique em Copiar/Baixar..."
              value={textoBackup}
              onChange={(e) => setTextoBackup(e.target.value)}
              style={campoTexto}
            />
            {statusBackup && <div style={{ fontSize: "11px", color: "#c0cce0" }}>{statusBackup}</div>}
          </div>

          {/* Gráficos integrados: evolução real dos registros */}
          {(() => {
            const painel = { ...cardClean, background: "rgba(44,67,96,.42)", border: "1px solid rgba(96,165,250,.20)", backdropFilter: "blur(14px)", display: "grid", gap: 12 };
            const barras = (titulo, dados, unidade = "", cor = "#60a5fa") => {
              const validos = (dados || []).filter((x) => Number.isFinite(Number(x.valor)));
              const max = Math.max(1, ...validos.map((x) => Number(x.valor)));
              return <div style={painel}><div style={{fontWeight:800,fontSize:13}}>{titulo}</div>{validos.length ? <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(validos.length,8)},minmax(0,1fr))`,gap:7,alignItems:"end",minHeight:125}}>{validos.slice(-8).map((x,i)=><div key={`${x.rotulo}-${i}`} title={`${x.rotulo}: ${x.valor}${unidade}`} style={{display:"grid",gap:5,justifyItems:"center",minWidth:0}}><strong style={{fontSize:9,color:"#dbeafe",whiteSpace:"nowrap"}}>{Number(x.valor).toLocaleString("pt-BR")}{unidade}</strong><div style={{height:78,width:"100%",maxWidth:34,display:"flex",alignItems:"end",background:"rgba(148,163,184,.12)",borderRadius:7,overflow:"hidden"}}><div style={{width:"100%",height:`${Math.max(3,Number(x.valor)/max*100)}%`,background:cor,borderRadius:7}}/></div><span style={{fontSize:9,color:"#aebed2",textAlign:"center",overflowWrap:"anywhere"}}>{x.rotulo}</span></div>)}</div> : <div style={{fontSize:11,color:"#aebed2"}}>Ainda não há registros suficientes para este gráfico.</div>}</div>;
            };
            const ultimosPR = registrosPR.slice().sort((a,b)=>(a.data||"").localeCompare(b.data||"")).slice(-8).map(x=>({rotulo:(x.exercicio||"PR").slice(0,9),valor:Number(x.carga)}));
            const medidas = medidasCorporais.slice().sort((a,b)=>(a.data||"").localeCompare(b.data||"")).slice(-8);
            const agua = dashboardData.agua7Dias.map(x=>({rotulo:x.rotulo,valor:Number(x.ml)||0}));
            const volume = dashboardData.atividade7Dias.map(x=>({rotulo:x.rotulo,valor:Number(x.volumeKg)||0}));
            const treinos = dashboardData.atividade7Dias.map(x=>({rotulo:x.rotulo,valor:x.treino?1:0}));
            const cardio = dashboardData.atividade7Dias.map(x=>({rotulo:x.rotulo,valor:Number(x.cardioMin)||0}));
            const cargasTreino = (dashboardData.historico || []).slice(-8).map(x=>({rotulo:(x.dataISO||x.nome||"Treino").slice(5,10),valor:Number(x.carga)||0}));
            return <div style={{display:"grid",gap:12}}><div><h3 style={{margin:"2px 0 4px",fontSize:16}}>Gráficos de evolução</h3><p style={{...labelMini,margin:0}}>Visualizações calculadas a partir dos registros reais. Os gráficos ganham histórico conforme você registra atividades.</p></div><div style={{display:"grid",gridTemplateColumns:ehDesktop?"repeat(2,minmax(0,1fr))":"1fr",gap:12}}>{barras("Recordes pessoais por exercício",ultimosPR," kg","#60a5fa")}{barras("Cargas dos treinos registrados",cargasTreino," kg","#818cf8")}{barras("Peso corporal (últimas medições)",medidas.filter(x=>x.peso).map(x=>({rotulo:x.data?.slice(5)||"Data",valor:Number(x.peso)}))," kg","#38bdf8")}{barras("Cintura (últimas medições)",medidas.filter(x=>x.cintura).map(x=>({rotulo:x.data?.slice(5)||"Data",valor:Number(x.cintura)}))," cm","#a78bfa")}{barras("Peito (últimas medições)",medidas.filter(x=>x.peito).map(x=>({rotulo:x.data?.slice(5)||"Data",valor:Number(x.peito)}))," cm","#34d399")}{barras("Hidratação diária — 7 dias",agua," ml","#38bdf8")}{barras("Volume de treino — 7 dias",volume," kg","#f59e0b")}{barras("Dias com treino — 7 dias",treinos,"","#34d399")}{barras("Cardio — 7 dias",cardio," min","#a78bfa")}</div><div style={painel}><strong style={{fontSize:13}}>Metas pessoais</strong>{metasPessoais.length?metasPessoais.map(m=><div key={m.id} style={{display:"flex",justifyContent:"space-between",gap:8,fontSize:11,borderTop:"1px solid rgba(148,190,215,.12)",paddingTop:7}}><span>{m.nome}</span><strong style={{color:m.concluida?"#86efac":"#93c5fd"}}>{m.concluida?"Concluída":"Em andamento"}</strong></div>):<span style={labelMini}>Nenhuma meta cadastrada.</span>}</div></div>;
          })()}
        </div>
      )}

      {/* ÁREAS PREMIUM ADICIONAIS */}
      {abaAtiva === "desempenho" && (() => {
        const totalTreinos = Object.values(estadoDiaPorData || {}).filter((v) => v === "treino" || v?.treino === true || v?.status === "treino").length;
        const ultimoPeso = medidasCorporais.length ? medidasCorporais[medidasCorporais.length - 1] : null;
        const card = { ...cardClean, background: "rgba(44, 67, 96, 0.48)", border: "1px solid rgba(96, 165, 250, 0.22)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderRadius: "14px", boxShadow: "0 12px 30px rgba(4, 12, 25, .16)" };
        const campo = { ...campoTexto, background: "rgba(19, 35, 55, .58)", border: "1px solid rgba(96,165,250,.25)", borderRadius: "10px" };
        return <div style={{ display: "grid", gap: "14px" }}>
          <div style={{ ...card, padding: "18px" }}><div style={{ color: "#93c5fd", fontSize: "11px", letterSpacing: ".12em", fontWeight: 800 }}>CAVEIRA • PERFORMANCE</div><h2 style={{ margin: "7px 0", fontSize: "22px" }}>Sua evolução em um só lugar</h2><p style={{ color: "#aebed2", fontSize: "12px", margin: 0 }}>Acompanhe seus recordes, medidas e metas com base nos registros que você inserir.</p></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))", gap: "10px" }}>
            {[{ t: "Recordes registrados", v: registrosPR.length }, { t: "Medições", v: medidasCorporais.length }, { t: "Metas pessoais", v: metasPessoais.length }, { t: "Peso mais recente", v: ultimoPeso?.peso ? `${ultimoPeso.peso} kg` : "—" }].map((x) => <div key={x.t} style={card}><div style={labelMini}>{x.t}</div><div style={{ fontSize: "22px", fontWeight: 800, color: "#bfdbfe", marginTop: "7px" }}>{x.v}</div></div>)}
          </div>
          <div style={card}><h3 style={{ margin: "0 0 12px", fontSize: "15px" }}>Registrar recorde pessoal</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "8px" }}><input value={novoPRExercicio} onChange={(e) => setNovoPRExercicio(e.target.value)} placeholder="Exercício" style={campo}/><input type="number" min="0" step="0.5" value={novoPRCarga} onChange={(e) => setNovoPRCarga(e.target.value)} placeholder="Carga (kg)" style={campo}/><button type="button" onClick={() => { if (!novoPRExercicio.trim() || !(Number(novoPRCarga) > 0) || dataSelecionada !== hojeISO) return; setRegistrosPR((p) => [...p, { id: `pr-${Date.now()}`, exercicio: novoPRExercicio.trim(), carga: Number(novoPRCarga), data: hojeISO }]); setNovoPRExercicio(""); setNovoPRCarga(""); }} style={{ ...btnSecundario, background: "#3b82f6", color: "#071426", border: 0, fontWeight: 800 }}>Salvar recorde</button></div><p style={{ ...labelMini, marginBottom: 0 }}>Novos registros respeitam o bloqueio de datas: só podem ser adicionados hoje.</p>{registrosPR.slice().reverse().map((r) => <div key={r.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, borderTop: "1px solid rgba(148,190,215,.14)", padding: "10px 0", fontSize: "12px" }}><span>{r.exercicio} • {r.data}</span><strong style={{ color: "#93c5fd" }}>{r.carga} kg</strong></div>)}</div>
          <div style={card}><h3 style={{ margin: "0 0 12px", fontSize: "15px" }}>Evolução corporal</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 8 }}><input type="number" min="0" step="0.1" value={novaMedidaPeso} onChange={(e) => setNovaMedidaPeso(e.target.value)} placeholder="Peso kg" style={campo}/><input type="number" min="0" step="0.1" value={novaMedidaCintura} onChange={(e) => setNovaMedidaCintura(e.target.value)} placeholder="Cintura cm" style={campo}/><input type="number" min="0" step="0.1" value={novaMedidaPeito} onChange={(e) => setNovaMedidaPeito(e.target.value)} placeholder="Peito cm" style={campo}/><button type="button" onClick={() => { if ((!novaMedidaPeso && !novaMedidaCintura && !novaMedidaPeito) || dataSelecionada !== hojeISO) return; setMedidasCorporais((p) => [...p, { id: `med-${Date.now()}`, data: hojeISO, peso: novaMedidaPeso ? Number(novaMedidaPeso) : null, cintura: novaMedidaCintura ? Number(novaMedidaCintura) : null, peito: novaMedidaPeito ? Number(novaMedidaPeito) : null }]); setNovaMedidaPeso(""); setNovaMedidaCintura(""); setNovaMedidaPeito(""); }} style={{ ...btnSecundario, background: "#3b82f6", color: "#071426", border: 0, fontWeight: 800 }}>Registrar medidas</button></div>{medidasCorporais.slice().reverse().map((m) => <div key={m.id} style={{ borderTop: "1px solid rgba(148,190,215,.14)", padding: "9px 0", fontSize: "12px", color: "#cbd5e1" }}>{m.data} • {m.peso ? `${m.peso} kg` : ""} {m.cintura ? `• Cintura ${m.cintura} cm` : ""} {m.peito ? `• Peito ${m.peito} cm` : ""}</div>)}</div>
          <div style={card}><h3 style={{ margin: "0 0 12px", fontSize: "15px" }}>Metas pessoais</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8 }}><input value={novaMetaNome} onChange={(e) => setNovaMetaNome(e.target.value)} placeholder="Ex.: Treinar 4x por semana" style={campo}/><input value={novaMetaAlvo} onChange={(e) => setNovaMetaAlvo(e.target.value)} placeholder="Alvo / observação" style={campo}/><button type="button" onClick={() => { if (!novaMetaNome.trim()) return; setMetasPessoais((p) => [...p, { id: `meta-${Date.now()}`, nome: novaMetaNome.trim(), alvo: novaMetaAlvo.trim(), concluida: false }]); setNovaMetaNome(""); setNovaMetaAlvo(""); }} style={{ ...btnSecundario, background: "#3b82f6", color: "#071426", border: 0, fontWeight: 800 }}>Adicionar meta</button></div>{metasPessoais.map((m) => <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, borderTop: "1px solid rgba(148,190,215,.14)", padding: "9px 0", fontSize: "12px" }}><input type="checkbox" checked={!!m.concluida} onChange={(e) => setMetasPessoais((p) => p.map((x) => x.id === m.id ? { ...x, concluida: e.target.checked } : x))}/><span style={{ flex: 1, textDecoration: m.concluida ? "line-through" : "none" }}>{m.nome} {m.alvo ? `— ${m.alvo}` : ""}</span><button type="button" onClick={() => setMetasPessoais((p) => p.filter((x) => x.id !== m.id))} style={{ ...btnCarga, color: "#fca5a5" }}>×</button></div>)}</div>
        </div>;
      })()}

      {abaAtiva === "exercicios" && (() => {
        const biblioteca = [
          ["Supino reto com barra", "Peito", "Barra e banco", "Deite com os pés firmes no chão, escápulas apoiadas e pegada um pouco além dos ombros. Desça a barra controladamente até a região média do peito e empurre sem perder a estabilidade."],
          ["Supino inclinado com barra", "Peito", "Barra e banco inclinado", "Ajuste o banco em inclinação moderada. Mantenha punhos alinhados aos cotovelos, desça a barra até a parte superior do peito e suba sem quicar."],
          ["Supino com halteres", "Peito", "Halteres e banco", "Comece com os halteres ao lado do peito. Empurre para cima mantendo antebraços estáveis e desça até uma amplitude confortável, sem bater os halteres."],
          ["Supino inclinado com halteres", "Peito", "Halteres e banco inclinado", "Mantenha os pés apoiados e o tronco firme. Desça os halteres ao lado da parte superior do peito e empurre acompanhando uma trajetória natural."],
          ["Crucifixo com halteres", "Peito", "Halteres e banco", "Com cotovelos levemente flexionados, abra os braços em arco até sentir alongamento confortável. Feche aproximando as mãos sem transformar o movimento em supino."],
          ["Crossover na polia", "Peito", "Polias", "Dê um passo à frente, mantenha o tronco estável e cotovelos suavemente flexionados. Traga as mãos à frente do peito e retorne devagar sem deixar os ombros avançarem."],
          ["Flexão de braços", "Peito", "Peso corporal", "Mãos um pouco além dos ombros e corpo alinhado. Desça o peito entre as mãos mantendo abdômen firme e empurre o chão. Apoie os joelhos ou eleve as mãos para facilitar."],
          ["Peck deck", "Peito", "Máquina", "Ajuste o banco para as manoplas ficarem na linha do peito. Feche os braços sem bater os apoios e retorne até alongamento confortável."],
          ["Puxada alta pela frente", "Costas", "Polia alta", "Segure a barra um pouco além dos ombros, incline levemente o tronco e puxe em direção à parte superior do peito. Suba controlando; não puxe atrás da nuca."],
          ["Barra fixa pronada", "Costas", "Barra fixa", "Pendure-se com pegada pronada, estabilize as escápulas e suba levando o peito em direção à barra. Desça controladamente; use elástico ou máquina assistida se necessário."],
          ["Barra fixa supinada", "Costas", "Barra fixa", "Use pegada com palmas voltadas para você. Suba sem balançar o corpo e desça até estender os braços de forma confortável."],
          ["Remada baixa sentada", "Costas", "Cabo e puxador", "Sente com coluna neutra e peito aberto. Puxe o acessório em direção ao abdômen levando os cotovelos para trás; retorne sem arredondar a lombar."],
          ["Remada curvada com barra", "Costas", "Barra", "Flexione quadril e joelhos, incline o tronco mantendo coluna neutra. Puxe a barra em direção ao abdômen e desça com controle, sem usar impulso."],
          ["Remada unilateral com halter", "Costas", "Halter e banco", "Apoie uma mão e um joelho no banco. Puxe o halter em direção ao quadril mantendo tronco estável e evite girar o corpo."],
          ["Remada cavalinho", "Costas", "Barra T", "Posicione o tronco firme e puxe o apoio em direção ao abdômen. Controle a volta e evite arredondar as costas."],
          ["Pullover na polia", "Costas", "Polia alta", "Com braços quase estendidos, leve a barra de cima até as coxas usando o movimento dos ombros. Mantenha abdômen firme e não transforme em extensão lombar."],
          ["Face pull", "Ombros", "Polia e corda", "Puxe a corda em direção ao rosto, separando as pontas e mantendo cotovelos elevados. Retorne devagar sem encolher os ombros."],
          ["Desenvolvimento com halteres", "Ombros", "Halteres", "Comece com halteres na altura dos ombros. Empurre acima da cabeça sem arquear a lombar e desça controladamente."],
          ["Desenvolvimento na máquina", "Ombros", "Máquina", "Ajuste as alças na altura dos ombros. Empurre sem travar bruscamente os cotovelos e retorne até amplitude confortável."],
          ["Elevação lateral", "Ombros", "Halteres", "Com cotovelos levemente flexionados, eleve os braços para os lados até próximo da linha dos ombros. Evite impulso e encolher o pescoço."],
          ["Elevação lateral na polia", "Ombros", "Polia baixa", "Segure a alça ao lado do corpo e eleve o braço lateralmente com controle. Mantenha o tronco estável e não use balanço."],
          ["Elevação frontal", "Ombros", "Halteres", "Eleve os halteres à frente até a altura dos ombros, mantendo cotovelos suaves. Desça lentamente sem balançar o tronco."],
          ["Crucifixo inverso", "Ombros", "Halteres ou máquina", "Incline o tronco ou ajuste o peck deck invertido. Abra os braços levando os cotovelos para fora e evite compensar com a lombar."],
          ["Encolhimento com halteres", "Trapézio", "Halteres", "Com braços estendidos, eleve os ombros em direção às orelhas e pause brevemente. Desça sem girar os ombros."],
          ["Rosca direta com barra", "Bíceps", "Barra", "Mantenha cotovelos próximos ao tronco. Flexione os cotovelos sem balançar o corpo e desça até quase estender os braços."],
          ["Rosca alternada", "Bíceps", "Halteres", "Alterne a flexão dos cotovelos mantendo punhos neutros ou girando a palma para cima durante a subida. Evite mover os ombros."],
          ["Rosca martelo", "Bíceps", "Halteres", "Segure os halteres com polegares apontados para cima. Flexione os cotovelos sem girar os punhos e retorne lentamente."],
          ["Rosca Scott", "Bíceps", "Banco Scott e barra", "Apoie os braços no encosto, mantenha axilas próximas à borda e flexione os cotovelos. Não estenda bruscamente no final da descida."],
          ["Rosca concentrada", "Bíceps", "Halter", "Sentado, apoie o braço na parte interna da coxa. Flexione o cotovelo sem tirar o braço do apoio e desça com controle."],
          ["Rosca na polia", "Bíceps", "Polia baixa", "Mantenha cotovelos junto ao corpo e puxe a barra em direção ao peito. Evite inclinar o tronco para gerar impulso."],
          ["Tríceps na corda", "Tríceps", "Polia alta e corda", "Mantenha cotovelos junto ao tronco. Estenda os braços e separe levemente as pontas da corda; retorne sem mover os ombros."],
          ["Tríceps testa", "Tríceps", "Barra EZ ou halteres", "Deitado, mantenha braços apontados para cima e flexione os cotovelos levando a carga perto da testa. Estenda sem abrir excessivamente os cotovelos."],
          ["Tríceps francês", "Tríceps", "Halter", "Com carga acima da cabeça, flexione os cotovelos levando o peso atrás da cabeça. Estenda mantendo cotovelos apontados para frente."],
          ["Mergulho em barras paralelas", "Tríceps", "Barras paralelas", "Sustente o corpo, flexione os cotovelos e desça apenas até amplitude confortável para os ombros. Empurre para retornar; use assistência se necessário."],
          ["Agachamento livre", "Quadríceps e glúteos", "Peso corporal", "Pés na largura confortável. Flexione quadris e joelhos mantendo o pé apoiado e coluna neutra; suba empurrando o chão."],
          ["Agachamento com barra", "Quadríceps e glúteos", "Barra e rack", "Ajuste a barra com travas de segurança. Desça entre os quadris mantendo joelhos acompanhando a direção dos pés e tronco firme; suba sem perder o apoio."],
          ["Agachamento frontal", "Quadríceps", "Barra", "Apoie a barra na frente dos ombros, cotovelos altos. Desça mantendo tronco ereto e pés firmes; use carga compatível com mobilidade."],
          ["Agachamento goblet", "Quadríceps e glúteos", "Halter ou kettlebell", "Segure a carga junto ao peito. Agache entre os joelhos mantendo cotovelos próximos e tronco estável; suba pressionando o chão."],
          ["Leg press 45 graus", "Quadríceps e glúteos", "Máquina", "Ajuste o encosto e posicione os pés na plataforma. Desça sem tirar o quadril do banco e empurre sem travar os joelhos."],
          ["Cadeira extensora", "Quadríceps", "Máquina", "Alinhe o eixo da máquina ao joelho e ajuste o rolo acima do peito do pé. Estenda e retorne lentamente, sem chutar a carga."],
          ["Mesa flexora", "Posterior de coxa", "Máquina", "Ajuste o rolo próximo aos tornozelos e mantenha quadril apoiado. Flexione os joelhos e retorne devagar."],
          ["Cadeira flexora", "Posterior de coxa", "Máquina", "Ajuste o eixo ao joelho e o apoio sobre as pernas. Flexione os joelhos sem tirar as costas do encosto."],
          ["Levantamento terra romeno", "Posterior e glúteos", "Barra ou halteres", "Com joelhos levemente flexionados, leve o quadril para trás e desça a carga rente às pernas mantendo coluna neutra. Suba contraindo glúteos."],
          ["Levantamento terra convencional", "Posterior e costas", "Barra", "Barra sobre o meio dos pés. Flexione quadril e joelhos, firme o tronco e empurre o chão para levantar. Mantenha a barra próxima ao corpo e não arredonde a lombar."],
          ["Hip thrust", "Glúteos", "Barra e banco", "Apoie as escápulas no banco, pés firmes e barra protegida sobre o quadril. Eleve até alinhar tronco e coxas sem hiperestender a lombar."],
          ["Avanço alternado", "Pernas e glúteos", "Peso corporal ou halteres", "Dê um passo à frente, desça com controle e mantenha o joelho alinhado ao pé. Empurre o chão para voltar e alterne as pernas."],
          ["Afundo búlgaro", "Quadríceps e glúteos", "Banco e halteres", "Apoie o pé de trás no banco e mantenha base estável. Desça verticalmente até amplitude confortável e suba sem deixar o joelho colapsar para dentro."],
          ["Step-up", "Pernas e glúteos", "Caixa ou banco baixo", "Suba em uma plataforma estável apoiando o pé inteiro. Empurre com a perna que está em cima e desça lentamente sem saltar."],
          ["Cadeira abdutora", "Glúteo médio", "Máquina", "Ajuste os apoios na parte externa das coxas. Afaste as pernas sem girar o tronco e retorne controlando."],
          ["Cadeira adutora", "Adutores", "Máquina", "Ajuste os apoios na parte interna das coxas. Aproxime as pernas de forma controlada e retorne sem deixar a máquina bater."],
          ["Coice na polia", "Glúteos", "Polia baixa e tornozeleira", "Prenda a tornozeleira, incline levemente o tronco e estenda a perna para trás sem arquear a lombar. Retorne devagar."],
          ["Panturrilha em pé", "Panturrilhas", "Máquina ou halteres", "Apoie a parte da frente dos pés, desça os calcanhares com controle e eleve o máximo confortável. Evite quicar."],
          ["Panturrilha sentada", "Sóleo", "Máquina", "Com joelhos apoiados sob o suporte, abaixe os calcanhares e eleve até a contração. Faça pausas curtas sem impulso."],
          ["Prancha frontal", "Core", "Peso corporal", "Apoie antebraços e pontas dos pés, alinhe cabeça, tronco e quadris. Contraia abdômen e glúteos sem prender a respiração."],
          ["Prancha lateral", "Core e oblíquos", "Peso corporal", "Apoie antebraço e lateral do pé, eleve o quadril e mantenha o corpo alinhado. Reduza a dificuldade apoiando os joelhos."],
          ["Abdominal crunch", "Abdômen", "Peso corporal", "Deite com joelhos flexionados. Eleve levemente os ombros aproximando costelas da pelve; não puxe a cabeça com as mãos."],
          ["Abdominal infra reverso", "Abdômen", "Peso corporal", "Deitado, traga os joelhos em direção ao tronco enrolando suavemente a pelve. Evite embalar as pernas."],
          ["Elevação de pernas", "Abdômen", "Banco ou barra", "Mantenha tronco estável e eleve as pernas sem balançar. Flexione os joelhos para facilitar e interrompa se a lombar perder posição."],
          ["Dead bug", "Core", "Peso corporal", "Deitado, mantenha lombar estável. Estenda lentamente braço e perna opostos e retorne; reduza a amplitude se a lombar arquear."],
          ["Bird dog", "Core e lombar", "Peso corporal", "Em quatro apoios, estenda braço e perna opostos sem girar a pelve. Pause e retorne lentamente, alternando lados."],
          ["Abdominal bicicleta", "Abdômen", "Peso corporal", "Deitado, aproxime cotovelo e joelho opostos alternadamente. Gire o tronco sem puxar o pescoço e mantenha o movimento controlado."],
          ["Mountain climber", "Core e cardio", "Peso corporal", "Em posição de prancha alta, traga um joelho de cada vez em direção ao peito mantendo quadris estáveis. Ajuste a velocidade ao condicionamento."],
          ["Burpee", "Corpo inteiro", "Peso corporal", "Agache, apoie as mãos, leve os pés para trás, retorne e fique em pé. O salto e a flexão são opcionais; mantenha ritmo seguro."],
          ["Polichinelo", "Cardio", "Peso corporal", "Salte abrindo pernas e elevando braços, depois retorne. Use passos laterais sem salto como versão de menor impacto."],
          ["Caminhada inclinada", "Cardio", "Esteira", "Comece em velocidade confortável, aumente a inclinação gradualmente e mantenha postura natural. Segure nos apoios apenas se necessário para segurança."],
          ["Bike ergométrica", "Cardio", "Bicicleta", "Ajuste o selim para manter leve flexão do joelho no ponto mais baixo. Pedale em ritmo sustentável e aumente a resistência progressivamente."],
          ["Remo ergométrico", "Cardio", "Remo", "Empurre primeiro com as pernas, depois incline levemente o tronco e puxe com os braços. Retorne na ordem inversa sem curvar as costas."],
          ["Alongamento de peitoral na parede", "Mobilidade", "Parede", "Apoie o antebraço na parede e gire o tronco suavemente para o lado oposto. Mantenha respiração natural e não force dor."],
          ["Mobilidade gato-vaca", "Mobilidade", "Peso corporal", "Em quatro apoios, alterne arredondar e estender suavemente a coluna acompanhando com a respiração. Faça movimentos confortáveis."],
          ["Alongamento de flexor do quadril", "Mobilidade", "Peso corporal", "Em meio-ajoelhado, contraia levemente o glúteo da perna de trás e avance o quadril sem arquear a lombar."],
          ["Rotação torácica em quatro apoios", "Mobilidade", "Peso corporal", "Com uma mão atrás da cabeça, gire o cotovelo em direção ao teto e depois ao chão. Mantenha quadris estáveis."],
          ["Face pull com elástico", "Ombros", "Elástico", "Prenda o elástico na altura do rosto. Puxe em direção à testa separando as mãos e controle o retorno."],
          ["Remada com elástico", "Costas", "Elástico", "Prenda o elástico à frente, mantenha tronco ereto e puxe cotovelos para trás. Retorne sem perder a postura."],
          ["Agachamento com elástico", "Pernas", "Elástico", "Posicione o elástico acima dos joelhos e faça agachamento mantendo joelhos alinhados aos pés. Não deixe o elástico puxar os joelhos para dentro."],
          ["Kettlebell swing", "Posterior e glúteos", "Kettlebell", "Inicie com dobradiça de quadril. Impulsione o kettlebell estendendo quadris, sem levantar com os braços ou hiperestender a lombar. Aprenda a técnica antes de acelerar."]
        ];
        const filtrados = biblioteca.filter((e) => e.join(" ").toLowerCase().includes(buscaBiblioteca.toLowerCase()));
        return <div style={{ display: "grid", gap: 12 }}><div style={{ ...cardClean, background: "rgba(44,67,96,.48)", border: "1px solid rgba(96,165,250,.22)", backdropFilter: "blur(16px)" }}><h2 style={{ margin: "0 0 6px", fontSize: 19 }}>Biblioteca de exercícios</h2><p style={labelMini}>Referência rápida de grupos musculares e execução. Ajuste exercícios à sua condição e orientação profissional.</p><input value={buscaBiblioteca} onChange={(e) => setBuscaBiblioteca(e.target.value)} placeholder="Buscar exercício ou grupo muscular..." style={campoTexto}/></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>{filtrados.map((e) => <div key={e[0]} style={{ ...cardClean, background: "rgba(44,67,96,.48)", border: "1px solid rgba(96,165,250,.18)", backdropFilter: "blur(14px)" }}><div style={{ color: "#93c5fd", fontSize: 10, fontWeight: 800, letterSpacing: ".08em" }}>{e[1].toUpperCase()}</div><strong style={{ display: "block", margin: "6px 0", fontSize: 14 }}>{e[0]}</strong><div style={{ color: "#93c5fd", fontSize: 10, marginBottom: 7 }}>Equipamento: {e[2]}</div><p style={{ color: "#aebed2", fontSize: 12, lineHeight: 1.55, margin: 0 }}>{e[3]}</p></div>)}</div>{!filtrados.length && <p style={labelMini}>Nenhum exercício encontrado.</p>}</div>;
      })()}

      {abaAtiva === "conquistas" && <div style={{ display: "grid", gap: 12 }}><div style={{ ...cardClean, background: "rgba(44,67,96,.48)", border: "1px solid rgba(96,165,250,.22)", backdropFilter: "blur(16px)" }}><h2 style={{ margin: "0 0 6px", fontSize: 19 }}>Suas conquistas</h2><p style={labelMini}>Marcos calculados a partir dos registros existentes.</p></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>{[{n:"Primeiro recorde",ok:registrosPR.length>=1,d:"Registre seu primeiro PR"},{n:"Colecionador",ok:registrosPR.length>=5,d:"Registre 5 recordes"},{n:"Acompanhamento",ok:medidasCorporais.length>=3,d:"Registre 3 medições"},{n:"Planejador",ok:metasPessoais.length>=3,d:"Crie 3 metas pessoais"},{n:"Hidratação",ok:Object.keys(aguaPorData||{}).length>=7,d:"Registre água em 7 dias"},{n:"Constância",ok:Object.keys(logsPorData||{}).length>=10,d:"Tenha registros em 10 dias"}].map((x)=><div key={x.n} style={{ ...cardClean, background:x.ok?"rgba(59,130,246,.18)":"rgba(44,67,96,.38)", border:`1px solid ${x.ok?"rgba(96,165,250,.45)":"rgba(148,190,215,.14)"}` }}><div style={{fontSize:24,marginBottom:8}}>{x.ok?"🏆":"◇"}</div><strong style={{fontSize:13}}>{x.n}</strong><div style={{fontSize:11,color:"#aebed2",marginTop:5}}>{x.ok?"Conquistado":x.d}</div></div>)}</div></div>}

      {abaAtiva === "relatorios" && (() => {
        const cardRel = { ...cardClean, background: "rgba(44,67,96,.46)", border: "1px solid rgba(96,165,250,.20)", backdropFilter: "blur(14px)", display: "grid", gap: 10 };
        const diasTreino = Object.keys(logsPorData || {}).length;
        const diasAgua = Object.keys(aguaPorData || {}).length;
        const totalAgua = Object.values(aguaPorData || {}).reduce((a,v)=>a+(Number(typeof v === "object" ? v?.total ?? v?.ml ?? 0 : v)||0),0);
        const refeicoesTotal = Object.values(refeicoesFeitasPorData || {}).reduce((a,v)=>a+(Array.isArray(v)?v.length:Object.values(v||{}).filter(Boolean).length),0);
        const cards = [{n:"Dias com registros de treino",v:diasTreino},{n:"Dias com hidratação",v:diasAgua},{n:"Água acumulada registrada",v:`${totalAgua.toLocaleString("pt-BR")} ml`},{n:"Recordes pessoais",v:registrosPR.length},{n:"Medições corporais",v:medidasCorporais.length},{n:"Metas concluídas",v:metasPessoais.filter(m=>m.concluida).length},{n:"Metas em andamento",v:metasPessoais.filter(m=>!m.concluida).length},{n:"Refeições marcadas",v:refeicoesTotal},{n:"Suplementos cadastrados",v:(suplementos||[]).length},{n:"Dias com cardio",v:Object.keys(cardioPorData||{}).length},{n:"Dias com sono registrado",v:Object.keys(sonoPorData||{}).length},{n:"Dias com mochila",v:Object.keys(mochilaMarcadaPorData||{}).length}];
        const chart=(titulo,dados,unidade="",cor="#60a5fa")=>{const xs=(dados||[]).filter(x=>Number.isFinite(Number(x.valor)));const max=Math.max(1,...xs.map(x=>Number(x.valor)));return <div style={cardRel}><strong style={{fontSize:13}}>{titulo}</strong>{xs.length?<div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(xs.length,10)},minmax(0,1fr))`,gap:6,alignItems:"end",minHeight:125}}>{xs.slice(-10).map((x,i)=><div key={`${x.rotulo}-${i}`} style={{display:"grid",gap:5,justifyItems:"center",minWidth:0}}><b style={{fontSize:9}}>{Number(x.valor).toLocaleString("pt-BR")}{unidade}</b><div style={{height:76,width:"100%",maxWidth:32,background:"rgba(148,163,184,.12)",borderRadius:6,display:"flex",alignItems:"end",overflow:"hidden"}}><div style={{height:`${Math.max(3,Number(x.valor)/max*100)}%`,width:"100%",background:cor}}/></div><span style={{fontSize:9,color:"#aebed2",textAlign:"center"}}>{x.rotulo}</span></div>)}</div>:<span style={labelMini}>Sem dados suficientes para gerar este gráfico.</span>}</div>};
        const med=medidasCorporais.slice().sort((a,b)=>(a.data||"").localeCompare(b.data||""));
        const pr=registrosPR.slice().sort((a,b)=>(a.data||"").localeCompare(b.data||""));
        const atividade=dashboardData.atividade7Dias||[];
        return <div style={{display:"grid",gap:14}}><div style={cardRel}><div style={{color:"#93c5fd",fontSize:10,fontWeight:800,letterSpacing:".12em"}}>CAVEIRA APP • RELATÓRIO COMPLETO</div><h2 style={{margin:0,fontSize:21}}>Relatório geral de desempenho</h2><p style={{...labelMini,margin:0}}>Consolidação dos dados disponíveis na sua conta. Períodos sem registro não são estimados nem preenchidos artificialmente.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(135px,1fr))",gap:9}}>{cards.map(x=><div key={x.n} style={{...cardClean,minWidth:0}}><div style={labelMini}>{x.n}</div><strong style={{fontSize:20,color:"#bfdbfe"}}>{x.v}</strong></div>)}</div><button type="button" onClick={()=>window.print()} style={{...btnSecundario,flex:"none",maxWidth:240,background:"#3b82f6",color:"#071426",border:0,fontWeight:800}}>Imprimir / Salvar relatório em PDF</button></div>
          <h3 style={{margin:"2px 0 -5px",fontSize:16}}>Gráficos de desempenho</h3><div style={{display:"grid",gridTemplateColumns:ehDesktop?"repeat(2,minmax(0,1fr))":"1fr",gap:10}}>{chart("Recordes pessoais — cargas registradas",pr.slice(-10).map(x=>({rotulo:(x.exercicio||"PR").slice(0,9),valor:Number(x.carga)}))," kg","#60a5fa")}{chart("Cargas dos treinos registrados",(dashboardData.historico||[]).slice(-10).map(x=>({rotulo:(x.dataISO||x.nome||"Treino").slice(5,10),valor:Number(x.carga)||0}))," kg","#818cf8")}{chart("Peso corporal",med.filter(x=>x.peso).map(x=>({rotulo:x.data?.slice(5)||"Data",valor:Number(x.peso)}))," kg","#38bdf8")}{chart("Cintura",med.filter(x=>x.cintura).map(x=>({rotulo:x.data?.slice(5)||"Data",valor:Number(x.cintura)}))," cm","#a78bfa")}{chart("Peito",med.filter(x=>x.peito).map(x=>({rotulo:x.data?.slice(5)||"Data",valor:Number(x.peito)}))," cm","#34d399")}{chart("Hidratação — últimos 7 dias",(dashboardData.agua7Dias||[]).map(x=>({rotulo:x.rotulo,valor:Number(x.ml)||0}))," ml","#38bdf8")}{chart("Volume de treino — últimos 7 dias",atividade.map(x=>({rotulo:x.rotulo,valor:Number(x.volumeKg)||0}))," kg","#f59e0b")}{chart("Cardio — últimos 7 dias",atividade.map(x=>({rotulo:x.rotulo,valor:Number(x.cardioMin)||0}))," min","#a78bfa")}{chart("Tempo ativo — últimos 7 dias",atividade.map(x=>({rotulo:x.rotulo,valor:Number(x.duracaoMin)||0}))," min","#34d399")}{chart("Refeições marcadas — últimos 7 dias",atividade.map(x=>({rotulo:x.rotulo,valor:Number(x.refeicoes)||0})),"","#fb923c")}{chart("Cafeína registrada — últimos 7 dias",atividade.map(x=>({rotulo:x.rotulo,valor:Number(x.cafeina)||0})),"","#fbbf24")}{chart("Mochila — percentual de preparo",atividade.map(x=>({rotulo:x.rotulo,valor:Number(x.mochilaPct)||0})),"%","#60a5fa")}{chart("Dias com treino — últimos 7 dias",atividade.map(x=>({rotulo:x.rotulo,valor:x.treino?1:0})),"","#34d399")}</div>
          <div style={cardRel}><h3 style={{margin:0,fontSize:14}}>Histórico de recordes</h3>{pr.length?pr.map(x=><div key={x.id} style={{display:"flex",justifyContent:"space-between",gap:8,borderTop:"1px solid rgba(148,190,215,.12)",paddingTop:7,fontSize:11}}><span>{x.data} • {x.exercicio}</span><strong>{x.carga} kg</strong></div>):<span style={labelMini}>Nenhum recorde cadastrado.</span>}</div>
          <div style={cardRel}><h3 style={{margin:0,fontSize:14}}>Histórico de medidas corporais</h3>{med.length?med.map(x=><div key={x.id} style={{borderTop:"1px solid rgba(148,190,215,.12)",paddingTop:7,fontSize:11}}>{x.data} • {x.peso?`Peso ${x.peso} kg`:""} {x.cintura?`• Cintura ${x.cintura} cm`:""} {x.peito?`• Peito ${x.peito} cm`:""}</div>):<span style={labelMini}>Nenhuma medição cadastrada.</span>}</div>
          <div style={cardRel}><h3 style={{margin:0,fontSize:14}}>Metas pessoais</h3>{metasPessoais.length?metasPessoais.map(m=><div key={m.id} style={{display:"flex",justifyContent:"space-between",gap:8,borderTop:"1px solid rgba(148,190,215,.12)",paddingTop:7,fontSize:11}}><span>{m.nome}{m.alvo?` — ${m.alvo}`:""}</span><strong style={{color:m.concluida?"#86efac":"#93c5fd"}}>{m.concluida?"Concluída":"Em andamento"}</strong></div>):<span style={labelMini}>Nenhuma meta cadastrada.</span>}</div>
          <p style={labelMini}>O relatório reúne os dados disponíveis: treino, volume, cardio, água, alimentação, cafeína, mochila, sono, suplementos, recordes, medidas e metas. Alguns detalhes antigos dependem de terem sido registrados no período e no formato atual do app.</p></div>;
      })()}

      {/* Barra Inferior */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: ehDesktop ? `${larguraMenuDesktop}px` : "50%",
          transform: ehDesktop ? "none" : "translateX(-50%)",
          width: ehDesktop ? `calc(100% - ${larguraMenuDesktop}px)` : "100%",
          maxWidth: larguraContainer,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          background: "rgba(34, 50, 73, 0.88)",
          borderTop: "1px solid rgba(148, 190, 215, 0.19)",
          padding: "8px 12px",
          boxSizing: "border-box",
          transition: "max-width 0.2s ease",
        }}
      >
        {[
          { id: "hoje", rotulo: "Hoje" },
          { id: "montar", rotulo: "Montar" },
          { id: "timer", rotulo: "Timer" },
          { id: "dashboard", rotulo: "Dashboard" },
        ].map((aba) => {
          const ativa = abaAtiva === aba.id;
          return (
            <button
              key={aba.id}
              type="button"
              onClick={() => abrirPagina(aba.id)}
              style={{
                padding: "8px",
                borderRadius: "8px",
                border: "none",
                background: ativa ? "#243149" : "transparent",
                color: ativa ? "#edf1f7" : "#a8b6ca",
                fontSize: "12px",
                fontWeight: ativa ? 700 : 500,
                cursor: "pointer",
              }}
            >
              {aba.rotulo}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

const rotuloSecaoMenu = {
  fontSize: "10px",
  letterSpacing: "0.02em",
  textTransform: "none",
  color: "#a8b6ca",
  padding: "0 10px 7px",
  fontWeight: 600,
};

const btnMenu = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  textAlign: "left",
  padding: "9px 10px",
  borderRadius: "8px",
  border: "1px solid transparent",
  background: "transparent",
  color: "#c0cce0",
  fontSize: "13px",
  fontWeight: 400,
  letterSpacing: "0.01em",
  cursor: "pointer",
};

const estiloMenuAtivo = (pagina, paginaAtiva) => ({
  ...btnMenu,
  background: paginaAtiva === pagina ? "rgba(96, 165, 250, 0.18)" : "transparent",
  color: paginaAtiva === pagina ? "#eff6ff" : "#c0cce0",
  border: paginaAtiva === pagina ? "1px solid rgba(125, 211, 252, 0.24)" : "1px solid transparent",
  borderLeft: paginaAtiva === pagina ? "3px solid #60a5fa" : "3px solid transparent",
  boxShadow: paginaAtiva === pagina ? "inset 0 0 18px rgba(96, 165, 250, 0.08)" : "none",
  fontWeight: paginaAtiva === pagina ? 650 : 400,
});

const btnCarga = {
  width: "22px",
  height: "22px",
  borderRadius: "6px",
  border: "1px solid rgba(148, 190, 215, 0.24)",
  background: "rgba(38, 54, 75, 0.62)",
  color: "#edf1f7",
  cursor: "pointer",
  fontSize: "12px",
  flexShrink: 0,
};

const btnSecundario = {
  flex: 1,
  padding: "8px",
  borderRadius: "8px",
  border: "1px solid rgba(148, 190, 215, 0.24)",
  background: "rgba(38, 54, 75, 0.62)",
  color: "#edf1f7",
  fontSize: "12px",
  cursor: "pointer",
};

const rotuloCampo = {
  display: "block",
  fontSize: "11px",
  fontWeight: 300,
  color: "#c0cce0",
  marginBottom: "5px",
  letterSpacing: "0.02em",
};

const campoTexto = {
  width: "100%",
  padding: "9px 10px",
  borderRadius: "8px",
  border: "1px solid rgba(148, 190, 215, 0.19)",
  background: "rgba(38, 54, 75, 0.62)",
  color: "#edf1f7",
  fontSize: "12px",
  boxSizing: "border-box",
};

const cardClean = {
  padding: "12px",
  borderRadius: "10px",
  background: "rgba(52, 70, 94, 0.46)",
  border: "1px solid rgba(148, 190, 215, 0.16)",
};

const labelMini = {
  fontSize: "11px",
  color: "#a8b6ca",
};

const valorMini = {
  fontSize: "16px",
  fontWeight: 700,
  marginTop: "3px",
};