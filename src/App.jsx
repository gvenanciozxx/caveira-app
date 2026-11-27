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
      <span style={{ fontSize: "10px", color: "#9E96AD", letterSpacing: "0.06em" }}>{label}</span>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: `${ALTURA_ITEM_ROLETA * 3}px`,
          borderRadius: "10px",
          background: "rgba(29, 27, 39, 0.72)",
          border: "1px solid rgba(190, 170, 225, 0.15)",
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
                  color: ativo ? "#DCCCF5" : "#9E96AD",
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
  const ehDesktopPainel = larguraTela >= 900;

  const [menuAberto, setMenuAberto] = useState(false);
  const [perfilFoto, setPerfilFoto] = useState("");
  const [resetModalAberto, setResetModalAberto] = useState(false);
  const [resetSenha, setResetSenha] = useState("");
  const [resetErro, setResetErro] = useState("");
  const [resetProcessando, setResetProcessando] = useState(false);
  const [perfilFotoErro, setPerfilFotoErro] = useState("");
  const perfilFotoInputRef = useRef(null);
  const [authSession, setAuthSession] = useState(null);
  const [authCarregando, setAuthCarregando] = useState(true);
  const [authModo, setAuthModo] = useState("login");
  const [etapaEntrada, setEtapaEntrada] = useState("boas-vindas");
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
  const [sincronizacaoManualEmAndamento, setSincronizacaoManualEmAndamento] = useState(false);
  const [mensagemSincronizacaoManual, setMensagemSincronizacaoManual] = useState("");
  const [tentativaNuvem, setTentativaNuvem] = useState(0);
  const [estaOnline, setEstaOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [statusOffline, setStatusOffline] = useState("Conectado");
  const salvamentoPendenteRef = useRef(null);
  const salvamentoTimerRef = useRef(null);
  const sincronizacaoAutomaticaTimerRef = useRef(null);
  const sincronizacaoEmAndamentoRef = useRef(false);
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

  const backupRef = useRef(null);
  const timerEstavaRodandoRef = useRef(false);
  const wakeLockRef = useRef(null);
  const audioCtxRef = useRef(null);
  const alarmeIntervalRef = useRef(null);

  // Páginas disponíveis: "hoje" | "montar" | "timer" | "dashboard" | "suplementos" | "alimentacao" | "mochila"
  const [abaAtiva, setAbaAtiva] = useState("hoje");
  const historicoPaginasRef = useRef([]);
  const [preferenciaFonte, setPreferenciaFonte] = useState(() => {
    try { return localStorage.getItem("caveira-fonte") || "padrao"; } catch { return "padrao"; }
  });
  const [idiomaApp, setIdiomaApp] = useState(() => {
    try { return localStorage.getItem("caveira-idioma") || "pt"; } catch { return "pt"; }
  });
  const emIngles = idiomaApp === "en";
  const TRADUCOES_UI = {'PRÓXIMO / ATUAL': 'NEXT / CURRENT', 'Descanso concluído.': 'Rest completed.', 'SESSÃO DE HOJE': 'TODAY’S SESSION', 'concluídos': 'completed', 'séries': 'sets', 'PRÓXIMA SESSÃO': 'NEXT SESSION', 'FORÇA NA CONSTÂNCIA.': 'STRENGTH THROUGH CONSISTENCY.', 'Dia fechado para alterações. Você pode consultar os registros, mas somente a data de hoje pode ser editada.': 'This day is closed for changes. You can view records, but only today can be edited.', 'Adiar para próximo dia': 'Move to next day', 'Dia cansado: priorize execução limpa e evite forçar carga máxima hoje.': 'Low-energy day: prioritize clean form and avoid maximum loads today.', 'Sem exercícios para este dia.': 'No exercises for this day.', 'Histórico de cargas:': 'Load history:', 'Sem registros anteriores para este exercício.': 'No previous records for this exercise.', 'Água do dia': 'Daily water', 'Meta diária atingida!': 'Daily goal reached!', 'Observação': 'Note', 'Cronômetro da sessão, contagem regressiva e intervalos de trabalho e descanso.': 'Session timer, countdown, and work/rest intervals.', 'DURAÇÃO TOTAL DA SESSÃO': 'TOTAL SESSION DURATION', 'Concluir sessão': 'Finish session', 'FASE DE AÇÃO': 'WORK PHASE', 'FASE DE DESCANSO': 'REST PHASE', 'Dose / horário': 'Dose / time', 'Marca / sabor / observação': 'Brand / flavor / note', 'Janela de treino & refeições': 'Workout & meal window', '✓ Pré-treino feito': '✓ Pre-workout done', 'Pré-treino pendente': 'Pre-workout pending', '✓ Pós-treino feito': '✓ Post-workout done', 'Pós-treino pendente': 'Post-workout pending', '✓ Refeição fora / livre': '✓ Free meal logged', 'Marcar refeição fora / livre': 'Log a free meal', 'Cafeína & pré-treino': 'Caffeine & pre-workout', 'Café': 'Coffee', 'Pré-treino': 'Pre-workout', 'Energético': 'Energy drink', 'Checklist da mochila / saída': 'Gear / departure checklist', 'Fechar': 'Close', 'Adicionar exercício': 'Add exercise', 'Exercício': 'Exercise', 'Séries x Reps': 'Sets x Reps', 'Modelos e opções da rotina': 'Routine templates and options', 'USUÁRIO': 'USER', 'Atenção à estagnação': 'Plateau alert', 'Volume nos últimos 7 dias': 'Volume over the last 7 days', 'Água nos últimos 7 dias': 'Water over the last 7 days', 'Refeições marcadas': 'Meals logged', 'Cafeína registrada': 'Caffeine logged', 'Mochila média': 'Average gear checklist', 'Todos os exercícios': 'All exercises', 'Sem treinos concluídos no filtro.': 'No completed workouts in this filter.', 'Ainda não há registros suficientes para este gráfico.': 'Not enough records for this chart yet.', 'Gráficos de evolução': 'Progress charts', 'Sua evolução em um só lugar': 'Your progress in one place', 'Evolução corporal': 'Body progress', 'Biblioteca de exercícios': 'Exercise library', 'Nenhum exercício encontrado.': 'No exercises found.', 'Sem dados suficientes para gerar este gráfico.': 'Not enough data to generate this chart.', 'CAVEIRA APP • RELATÓRIO COMPLETO': 'CAVEIRA APP • FULL REPORT', 'Relatório geral de desempenho': 'Overall performance report', 'Imprimir / Salvar relatório em PDF': 'Print / Save report as PDF', 'Gráficos de desempenho': 'Performance charts', 'Histórico de recordes': 'Personal records history', 'Histórico de medidas corporais': 'Body measurements history', 'Nenhuma medição cadastrada.': 'No measurements recorded.', 'Sincronização de dados': 'Data synchronization', 'Envie seus dados salvos neste dispositivo para sua conta Supabase. A sincronização é manual, iniciada por você.': 'Upload the data saved on this device to your Supabase account. Sync is manual and started by you.', 'Sincronização pendente': 'Sync pending', 'Sincronizando...': 'Syncing...', 'Falha na sincronização': 'Sync failed', 'Sincronizado': 'Synced', 'Enviando dados...': 'Uploading data...', 'Sincronizar meus dados': 'Sync my data', 'Aparência e idioma': 'Appearance and language', 'Ajuste o tamanho da interface e o idioma dos elementos principais.': 'Adjust interface size and language of main UI elements.', 'Tamanho da fonte': 'Font size', 'Pequena': 'Small', 'Padrão': 'Standard', 'Grande': 'Large', 'Idioma': 'Language', 'Foto de perfil': 'Profile photo', 'Escolher foto': 'Choose photo', 'Remover foto': 'Remove photo', 'DADOS & SEGURANÇA': 'DATA & SECURITY', 'Resetar dados do aplicativo': 'Reset app data', 'Resetar dados do app': 'Reset app data', 'Configurações': 'Settings', 'Relatórios': 'Reports', 'Conquistas': 'Achievements', 'Modo Foco': 'Focus mode', 'Backup & Dados': 'Backup & Data', 'Alimentação & Rotina': 'Nutrition & Routine', 'Suplementos': 'Supplements', 'Mochila & Ritmo': 'Gear & Pace', 'Biblioteca de Exercícios': 'Exercise Library', 'Central de Desempenho': 'Performance Center', 'Treino de hoje': 'Today’s workout', 'Montar treinos.': 'Build workouts.', 'Alimentação & Rotina.': 'Nutrition & Routine.', 'Mochila & Ritmo.': 'Gear & Pace.', 'Central de Desempenho.': 'Performance Center.', 'Biblioteca de Exercícios.': 'Exercise Library.', 'Conquistas.': 'Achievements.', 'Relatórios.': 'Reports.', 'Configurações.': 'Settings.', 'Voltar página anterior': 'Go back', 'Voltar': 'Back', 'Hoje': 'Today', 'Montar': 'Build', 'Offline • salvo neste dispositivo': 'Offline • saved on this device', 'Sincronização pendente • falha no envio': 'Sync pending • upload failed', 'Dados sincronizados': 'Data synced', 'Conectado': 'Connected', 'Modo offline': 'Offline mode', 'Entre na conta para sincronizar': 'Sign in to sync', 'Offline • sincronização pendente': 'Offline • sync pending', 'Conecte-se à internet para enviar seus dados ao Supabase.': 'Connect to the internet to upload your data to Supabase.', 'Seus dados foram sincronizados com sucesso no Supabase.': 'Your data was successfully synced to Supabase.', 'Falha ao enviar dados ao Supabase.': 'Failed to upload data to Supabase.', 'Salvo neste dispositivo • aguardando internet': 'Saved on this device • waiting for internet', 'Alterações salvas localmente • sincronização pendente': 'Changes saved locally • sync pending', 'Sem dados offline disponíveis': 'No offline data available', 'Carregando seus dados...': 'Loading your data...', 'Abrindo seus dados salvos neste dispositivo...': 'Opening data saved on this device...', 'Este dispositivo ainda não possui uma cópia offline. Conecte-se à internet uma vez para carregar seus dados.': 'This device has no offline copy yet. Connect to the internet once to load your data.', 'Não foi possível carregar os dados do Supabase.': 'Could not load data from Supabase.', 'Não foi possível salvar os dados neste dispositivo.': 'Could not save data on this device.', 'Falha ao salvar localmente': 'Local save failed', 'Conexão disponível • verificando sincronização': 'Connection available • checking sync', 'Dia fechado para alterações. Os registros podem ser consultados, mas não modificados.': 'This day is closed for changes. Records can be viewed but not modified.', 'Nenhum registro encontrado': 'No records found', 'Sem registros': 'No records', 'Salvar': 'Save', 'Cancelar': 'Cancel', 'Editar': 'Edit', 'Excluir': 'Delete', 'Adicionar': 'Add', 'Buscar': 'Search', 'Pesquisar': 'Search', 'Confirmar': 'Confirm', 'Abrir': 'Open', 'Atualizar': 'Update', 'Registrar': 'Log', 'Concluído': 'Done', 'Concluída': 'Done', 'Não registrado': 'Not recorded', 'Carregando': 'Loading', 'Desempenho': 'Performance', 'Treino': 'Workout', 'Treinos': 'Workouts', 'Histórico': 'History', 'Meta': 'Goal', 'Metas': 'Goals', 'Data': 'Date', 'Peso': 'Weight', 'Água': 'Water', 'Sono': 'Sleep', 'Alimentação': 'Nutrition', 'Refeições': 'Meals', 'Observações': 'Notes', 'Tempo': 'Time', 'Duração': 'Duration', 'Estatísticas': 'Statistics', 'Progresso': 'Progress', 'Relatório': 'Report', 'Detalhes': 'Details', 'Nome': 'Name', 'Quantidade': 'Amount', 'Unidade': 'Unit', 'Horário': 'Time', 'Ativo': 'Active', 'Inativo': 'Inactive', 'Pronto': 'Ready', 'Pendente': 'Pending', 'Semana': 'Week', 'Mês': 'Month', 'Dia': 'Day', 'Ontem': 'Yesterday', 'Amanhã': 'Tomorrow', 'Domingo': 'Sunday', 'Segunda-feira': 'Monday', 'Terça-feira': 'Tuesday', 'Quarta-feira': 'Wednesday', 'Quinta-feira': 'Thursday', 'Sexta-feira': 'Friday', 'Sábado': 'Saturday', 'Janeiro': 'January', 'Fevereiro': 'February', 'Março': 'March', 'Abril': 'April', 'Maio': 'May', 'Junho': 'June', 'Julho': 'July', 'Agosto': 'August', 'Setembro': 'September', 'Outubro': 'October', 'Novembro': 'November', 'Dezembro': 'December', 'Carregando sua conta...': 'Loading your account...', 'Criar sua conta': 'Create your account', 'Recuperar senha': 'Recover password', 'Nova senha': 'New password', 'Bem-vindo de volta': 'Welcome back', 'Preencha seus dados para começar.': 'Fill in your details to get started.', 'Informe seu email para receber as instruções de recuperação.': 'Enter your email to receive recovery instructions.', 'Use o código enviado ao seu email para definir uma nova senha.': 'Use the code sent to your email to set a new password.', 'Entre para acessar seus treinos e sua rotina.': 'Sign in to access your workouts and routine.', 'Nome de usuário': 'Username', 'Como deseja ser chamado?': 'What should we call you?', 'Email': 'Email', 'seu@email.com': 'you@email.com', 'Senha': 'Password', 'Ocultar': 'Hide', 'Mostrar': 'Show', 'Código recebido por email': 'Code received by email', 'Digite o código': 'Enter the code', 'Mínimo de 6 caracteres': 'At least 6 characters', 'Aguarde...': 'Please wait...', 'Criar conta': 'Create account', 'Enviar código': 'Send code', 'Alterar senha': 'Change password', 'Entrar': 'Sign in', 'Criar cadastro': 'Create account', 'Esqueci minha senha': 'Forgot password', 'Voltar para login': 'Back to sign in', 'Voltar para hoje': 'Back to today', 'Puxar último': 'Load last', 'Dia de descanso': 'Rest day', 'Treino de': 'Workout:', 'Última:': 'Last:', 'Pausar': 'Pause', 'Iniciar': 'Start', 'Iniciar Timer': 'Start timer', '{textoUi("Ação (s)", "Work (s)")}': 'Work (s)', 'Salvar suplemento': 'Save supplement', 'Nenhum suplemento cadastrado ainda.': 'No supplements added yet.', 'Meta semanal de treinos': 'Weekly workout goal', 'Últimos 7 dias:': 'Last 7 days:', 'Fechar': 'Close', 'Descanso (s)': 'Rest (s)', 'séries no total': 'sets total', 'Salvar dia como modelo': 'Save day as template', 'Acompanhe seus recordes, medidas e metas com base nos registros que você inserir.': 'Track your records, measurements, and goals based on the data you enter.', 'Recordes registrados': 'Records logged', 'Medições': 'Measurements', 'Metas pessoais': 'Personal goals', 'Peso mais recente': 'Latest weight', 'Registrar recorde pessoal': 'Log personal record', 'Carga (kg)': 'Weight (kg)', 'Salvar recorde': 'Save record', 'Novos registros respeitam o bloqueio de datas: só podem ser adicionados hoje.': 'New records follow date restrictions and can only be added today.', 'Registrar medidas': 'Log measurements', 'Peso kg': 'Weight (kg)', 'Cintura cm': 'Waist (cm)', 'Peito cm': 'Chest (cm)', 'Ex.: Treinar 4x por semana': 'e.g. Train 4 times a week', 'Alvo / observação': 'Target / note', 'Adicionar meta': 'Add goal', 'Nenhum recorde cadastrado.': 'No records added.', 'Nenhuma meta cadastrada.': 'No goals added.', 'Concluída': 'Completed', 'Em andamento': 'In progress', 'Consolidação dos dados disponíveis na sua conta. Períodos sem registro não são estimados nem preenchidos artificialmente.': 'Summary of data available in your account. Periods without records are not estimated or artificially filled.', 'Recordes pessoais — cargas registradas': 'Personal records — logged weights', 'Cargas dos treinos registrados': 'Weights from logged workouts', 'Peso corporal': 'Body weight', 'Cintura': 'Waist', 'Peito': 'Chest', 'Hidratação — últimos 7 dias': 'Hydration — last 7 days', 'Volume de treino — últimos 7 dias': 'Workout volume — last 7 days', 'Cardio — últimos 7 dias': 'Cardio — last 7 days', 'Tempo ativo — últimos 7 dias': 'Active time — last 7 days', 'Refeições marcadas — últimos 7 dias': 'Meals logged — last 7 days', 'Cafeína registrada — últimos 7 dias': 'Caffeine logged — last 7 days', 'Mochila — percentual de preparo': 'Gear checklist completion', 'Dias com treino — últimos 7 dias': 'Workout days — last 7 days', 'Metas em andamento': 'Goals in progress', 'O relatório reúne os dados disponíveis: treino, volume, cardio, água, alimentação, cafeína, mochila, sono, suplementos, recordes, medidas e metas. Alguns detalhes antigos dependem de terem sido registrados no período e no formato atual do app.': 'The report includes available data: workouts, volume, cardio, water, nutrition, caffeine, gear, sleep, supplements, records, measurements, and goals. Some older details depend on whether they were recorded for that period and in the app’s current format.', 'Visão dos registros dos últimos 7 dias. Cada linha mostra os dados disponíveis daquele dia.': 'Overview of records from the last 7 days. Each row shows the data available for that day.', '{textoUi("Meta mensal de treinos", "Monthly workout goal")}': 'Monthly workout goal', 'Dia cansado': 'Low-energy day', 'Registrar': 'Log', 'Salvar dia': 'Save day', 'Adicionar min': 'Add minutes', 'Nenhum registro encontrado': 'No records found', 'Aquecimento': 'Warm-up', 'Concluir': 'Finish', 'Atenção': 'Attention', 'Refeição': 'Meal', 'Cardio': 'Cardio', 'Caminhada': 'Walking', 'Corrida': 'Running', 'Bicicleta': 'Cycling', 'Alongamento': 'Stretching', 'Tempo de descanso': 'Rest time', 'Voltar': 'Back', 'Selecionar': 'Select', 'Limpar': 'Clear', 'Aplicar': 'Apply', 'Atual': 'Current', 'Próximo': 'Next', 'Próxima': 'Next', 'Anterior': 'Previous', 'Todos': 'All', 'Nenhuma': 'None', 'Nenhum': 'None', 'Não': 'No', 'Sim': 'Yes', 'Opcional': 'Optional', 'Obrigatório': 'Required', 'Adicionar item': 'Add item', 'Remover': 'Remove', 'Confirmar exclusão': 'Confirm deletion', 'Salvar alterações': 'Save changes', 'Editar rotina': 'Edit routine', 'Nome do exercício': 'Exercise name', 'Buscar exercício': 'Search exercise', 'Sem resultados': 'No results', 'Escolha uma opção': 'Choose an option', 'Frequência': 'Frequency', 'Intensidade': 'Intensity', 'Leve': 'Light', 'Moderada': 'Moderate', 'Alta': 'High', 'Muito alta': 'Very high', 'Minutos': 'Minutes', 'Quilômetros': 'Kilometers', 'Distância': 'Distance', 'Velocidade': 'Speed', 'Calorias': 'Calories', 'Repetições': 'Reps', 'Séries': 'Sets', 'Carga': 'Weight', 'Descanso': 'Rest', 'Instruções': 'Instructions', 'Equipamento': 'Equipment', 'Grupo muscular': 'Muscle group', 'Salvar configuração': 'Save settings', 'Restaurar padrão': 'Restore default', 'Dados': 'Data', 'Segurança': 'Security', 'Sair': 'Sign out', 'Atualização': 'Update', 'Idioma global': 'Global language', 'Português': 'Portuguese', 'Inglês': 'English', 'Aparência': 'Appearance', 'Tela': 'Screen', 'Tamanho': 'Size', 'Fonte': 'Font', 'Pequeno': 'Small', 'Médio': 'Medium', 'Grande': 'Large', 'Relatórios': 'Reports', 'Resumo': 'Summary', 'Por dia': 'By day', 'Por semana': 'By week', 'Por mês': 'By month', 'Sem dados': 'No data', 'Ainda não': 'Not yet', 'Não há': 'There are no', 'Registro': 'Record', 'Registrado': 'Logged', 'Não informado': 'Not specified', 'Data de hoje': 'Today’s date', 'Dia selecionado': 'Selected day', 'Semana atual': 'Current week', 'Mês atual': 'Current month', 'Concluir': 'Finish', 'Voltar para hoje': 'Back to today', 'Puxar último': 'Load last', 'Dia de descanso': 'Rest day', 'concluídos': 'completed', 'Última:': 'Last:', 'Peso': 'Weight', 'Meta diária atingida!': 'Daily goal reached!', 'Faltam': 'Remaining', 'para a meta.': 'to reach the goal.', '{textoUi("Estimativa de 35 ml/kg por dia. Necessidades variam; siga orientação profissional em caso de restrição de líquidos.", "Estimated at 35 ml/kg per day. Needs vary; follow professional guidance if you have fluid restrictions.")}': 'Estimated at 35 ml/kg per day. Needs vary; follow professional guidance if you have fluid restrictions.', 'Ativo:': 'Active:', 'Descanso:': 'Rest:', '{textoUi("Ação (s)", "Work (s)")}': 'Work (s)', '✓ Pré-treino feito': '✓ Pre-workout completed', 'Pré-treino pendente': 'Pre-workout pending', '✓ Pós-treino feito': '✓ Post-workout completed', 'Pós-treino pendente': 'Post-workout pending', '✓ Refeição fora / livre': '✓ Free meal logged', 'Marcar refeição fora / livre': 'Log a free meal', 'Adicionar min': 'Add minutes', 'Meta': 'Goal', 'x/semana': 'x/week', 'Últimos 7 dias:': 'Last 7 days:', 'séries no total': 'sets total', 'Salvar dia como modelo': 'Save day as template', '{textoUi("Meta mensal de treinos", "Monthly workout goal")}': 'Monthly workout goal', 'Média de': 'Average', 'ml/dia': 'ml/day', 'Painel geral de atividades': 'Activity overview', 'Visão dos registros dos últimos 7 dias. Cada linha mostra os dados disponíveis daquele dia.': 'Overview of records from the last 7 days. Each row shows the data available for that day.', 'Treino': 'Workout', 'refeições': 'meals', 'cafeína': 'caffeine', 'Mochila': 'Gear', 'sinais': 'signals', 'Sono:': 'Sleep:', '{textoUi("Visualizações calculadas a partir dos registros reais. Os gráficos ganham histórico conforme você registra atividades.", "Charts are calculated from actual records. History grows as you log activities.")}': 'Charts are calculated from actual records. History grows as you log activities.', '{textoUi("Referência rápida de grupos musculares e execução. Ajuste exercícios à sua condição e orientação profissional.", "Quick reference for muscle groups and exercise form. Adapt exercises to your condition and professional guidance.")}': 'Quick reference for muscle groups and exercise form. Adapt exercises to your condition and professional guidance.', 'Buscar exercício ou grupo muscular...': 'Search exercise or muscle group...', 'Suas conquistas': 'Your achievements', 'Marcos calculados a partir dos registros existentes.': 'Milestones calculated from existing records.', 'Conquistado': 'Achieved', 'Registre seu primeiro PR': 'Log your first personal record', 'Registre 5 recordes': 'Log 5 personal records', 'Registre 3 medições': 'Log 3 measurements', 'Crie 3 metas pessoais': 'Create 3 personal goals', 'Registre água em 7 dias': 'Log water on 7 days', 'Tenha registros em 10 dias': 'Log activity on 10 days', 'Primeiro recorde': 'First record', 'Colecionador': 'Collector', 'Acompanhamento': 'Tracking', 'Planejador': 'Planner', 'Hidratação': 'Hydration', 'Constância': 'Consistency', 'CAVEIRA • PERFORMANCE': 'CAVEIRA • PERFORMANCE', 'CAVEIRA': 'CAVEIRA', 'UM DIA DE CADA VEZ': 'ONE DAY AT A TIME'};
  const textoUi = (pt, en) => emIngles ? (en ?? TRADUCOES_UI[pt] ?? pt) : pt;
  const nomeDiaUi = (nome) => emIngles ? ({ "Segunda-feira": "Monday", "Terça-feira": "Tuesday", "Quarta-feira": "Wednesday", "Quinta-feira": "Thursday", "Sexta-feira": "Friday", "Sábado": "Saturday", "Domingo": "Sunday" }[nome] || nome) : nome;
  const letraDiaUi = (chave, letra) => emIngles ? ({ seg: "M", ter: "T", qua: "W", qui: "T", sex: "F", sab: "S", dom: "S" }[chave] || letra) : letra;
  useEffect(() => { try { localStorage.setItem("caveira-fonte", preferenciaFonte); } catch {} }, [preferenciaFonte]);
  useEffect(() => { try { localStorage.setItem("caveira-idioma", idiomaApp); } catch {} }, [idiomaApp]);
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
  // Mini-timer de descanso dos exercícios: utiliza o mesmo contador/alarme do Timer principal.
  const [miniDescansoAberto, setMiniDescansoAberto] = useState(false);
  const [miniDescansoExercicio, setMiniDescansoExercicio] = useState("");
  const [miniDescansoDuracao, setMiniDescansoDuracao] = useState(60);

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
  const [grupoTreinoSelecionado, setGrupoTreinoSelecionado] = useState(null);
  const [exerciciosSalvosCards, setExerciciosSalvosCards] = useState([]);
  const [novoExercicioSalvoNome, setNovoExercicioSalvoNome] = useState("");
  const [novoExercicioSalvoGrupo, setNovoExercicioSalvoGrupo] = useState("superior");
  const [substituicaoCardAbertaId, setSubstituicaoCardAbertaId] = useState(null);
  const [substituicaoCardAlvoId, setSubstituicaoCardAlvoId] = useState("");

  // Recursos Premium adicionais: desempenho, medidas, metas e biblioteca.
  const [registrosPR, setRegistrosPR] = useState([]);
  const [medidasCorporais, setMedidasCorporais] = useState([]);
  const [metasPessoais, setMetasPessoais] = useState([]);
  const [buscaBiblioteca, setBuscaBiblioteca] = useState("");
  const [exercicioDemonstracaoAberto, setExercicioDemonstracaoAberto] = useState(null);
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
  const [editForm, setEditForm] = useState({ nome: "", grupoMuscular: "superior", seriesReps: "", descanso: 60, carga: 0 });

  const [novoNome, setNovoNome] = useState("");
  const [novoGrupoMuscular, setNovoGrupoMuscular] = useState("superior");
  const [novoSeriesReps, setNovoSeriesReps] = useState("4x10");
  const [novoDescanso, setNovoDescanso] = useState(60);
  const [novoCarga, setNovoCarga] = useState(20);
  const [formAdicionarExercicioAberto, setFormAdicionarExercicioAberto] = useState(false);

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
    exerciciosSalvosCards,
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
    perfilFoto,
  };

  // Aplica um snapshot tanto vindo da nuvem quanto do cache offline.
  function aplicarSnapshotPersistido(dados) {
    const d = dados || {};
    if (d.rotina) setRotina(d.rotina);
    if (Array.isArray(d.exerciciosSalvosCards)) {
      setExerciciosSalvosCards(d.exerciciosSalvosCards);
    } else {
      // Migração compatível: aproveita exercícios já existentes nas rotinas e modelos antigos.
      const exerciciosLegados = [
        ...Object.values(d.rotina || {}).flat(),
        ...(Array.isArray(d.presets) ? d.presets.flatMap((preset) => preset.exercicios || []) : []),
      ];
      const unicos = new Map();
      exerciciosLegados.forEach((item) => {
        const nome = String(item?.nome || "").trim();
        if (!nome) return;
        const chave = nome.toLowerCase();
        if (!unicos.has(chave)) unicos.set(chave, {
          id: `migrado-${chave.replace(/[^a-z0-9]+/gi, "-")}`,
          nome,
          grupoMuscular: identificarGrupoTreino(item),
          equipamento: item.equipamento || "",
          instrucoes: item.instrucoes || "",
        });
      });
      setExerciciosSalvosCards(Array.from(unicos.values()));
    }
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
    if (typeof d.perfilFoto === "string") setPerfilFoto(d.perfilFoto);
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

  // Nuvem como destino principal: estando online, alterações são enviadas diretamente ao Supabase.
  // O cache local é usado como contingência offline ou quando a nuvem rejeita a gravação.
  useEffect(() => {
    const userId = authSession?.user?.id;
    if (!userId || !dadosNuvemCarregados || ultimoUsuarioNuvemRef.current !== userId) return;
    if (salvamentoTimerRef.current) clearTimeout(salvamentoTimerRef.current);
    if (sincronizacaoAutomaticaTimerRef.current) clearTimeout(sincronizacaoAutomaticaTimerRef.current);
    salvamentoTimerRef.current = setTimeout(async () => {
      salvamentoTimerRef.current = null;
      const cacheAnterior = await lerSnapshotOffline(userId).catch(() => null);
      const mudou = JSON.stringify(cacheAnterior?.data || {}) !== JSON.stringify(estadoPersistido || {});
      if (!mudou && cacheAnterior?.pendente !== true) return;
      if (estaOnline && navigator.onLine) {
        setStatusDadosNuvem("Enviando alterações diretamente para a nuvem...");
        sincronizacaoAutomaticaTimerRef.current = setTimeout(() => {
          sincronizacaoAutomaticaTimerRef.current = null;
          sincronizarDadosManualmente();
        }, 600);
      } else {
        try {
          const salvoEm = new Date().toISOString();
          await gravarSnapshotOffline({ userId, data: estadoPersistido, salvoEm, cloudUpdatedAt: cacheAnterior?.cloudUpdatedAt || null, pendente: true });
          setStatusDadosNuvem("Offline • salvo neste dispositivo, aguardando envio à nuvem");
        } catch (error) {
          setErroDadosNuvem(error?.message || "Não foi possível preservar os dados offline.");
          setStatusDadosNuvem("Falha ao salvar dados offline");
        }
      }
    }, 300);
    return () => {};
  }, [authSession?.user?.id, dadosNuvemCarregados, estaOnline, rotina, focoDiasPorChave, presets, logsPorData,
    observacoes, duracaoPorData, tempoAtivoPorData, aquecimentoPorData, estadoDiaPorData,
    checklistPorData, sinaisCorpoPorData, sonoPorData, motivoSemTreinoPorData,
    refeicoesModelos, refeicoesFeitasPorData, refeicaoLivrePorData, janelaTreinoPorData,
    cafeinaPorData, cardioPorData, suplementos, itensMochila, mochilaMarcadaPorData,
    metaTreinosSemana, ultimoBackupISO, modoTempo, totalConfigTimerSeg, intervaloTrabalhoSeg,
    intervaloDescansoSeg, intervaloRodadasTotal, pesoKg, aguaPorData, metaTreinosMes, registrosPR, medidasCorporais, metasPessoais, perfilFoto]);

  async function sincronizarDadosManualmente() {
    const userId = authSession?.user?.id;
    if (sincronizacaoEmAndamentoRef.current) return;
    if (!userId || !dadosNuvemCarregados) {
      setStatusDadosNuvem("Entre na conta para sincronizar");
      return;
    }
    if (!navigator.onLine) {
      setEstaOnline(false);
      setStatusDadosNuvem("Offline • sincronização pendente");
      setErroDadosNuvem("Conecte-se à internet para enviar seus dados ao Supabase.");
      return;
    }
    sincronizacaoEmAndamentoRef.current = true;
    setSincronizacaoManualEmAndamento(true);
    setErroDadosNuvem("");
    setStatusDadosNuvem("Sincronizando dados com o Supabase...");
    try {
      const snapshotAtual = estadoPersistido;
      const timestamp = new Date().toISOString();
      // Online: envia o estado atual direto à nuvem primeiro. O cache local só é atualizado
      // depois do sucesso; em falha, grava como pendente para não perder alterações.
      // Esta gravação de snapshot não aciona handlers de edição de datas.
      const { data: existente, error: leituraErro } = await supabase.from("caveira_app_data").select("user_id").eq("user_id", userId).maybeSingle();
      if (leituraErro) throw leituraErro;
      const gravacao = existente
        ? await supabase.from("caveira_app_data").update({ data: snapshotAtual, updated_at: timestamp }).eq("user_id", userId)
        : await supabase.from("caveira_app_data").insert({ user_id: userId, data: snapshotAtual, updated_at: timestamp });
      if (gravacao.error) throw gravacao.error;
      await gravarSnapshotOffline({ userId, data: snapshotAtual, salvoEm: timestamp, cloudUpdatedAt: timestamp, pendente: false });
      setStatusOffline("Conectado");
      setStatusDadosNuvem("Dados sincronizados");
      setErroDadosNuvem("");
      setMensagemSincronizacaoManual(emIngles ? "Your data was successfully synced to Supabase." : "Seus dados foram sincronizados com sucesso no Supabase.");
    } catch (error) {
      const mensagemErro = error?.message || "Falha ao enviar dados ao Supabase.";
      const erroBloqueioData = /está fechada|está fechado|somente o dia atual|closed date|only today/i.test(mensagemErro);
      // Se a nuvem não aceitar, preserva cópia offline e sinaliza claramente que não sincronizou.
      await gravarSnapshotOffline({ userId, data: snapshotAtual, salvoEm: timestamp, cloudUpdatedAt: null, pendente: true }).catch(() => null);
      setErroDadosNuvem(erroBloqueioData
        ? (emIngles ? "The database is applying the past-day editing restriction to this sync. Changes were saved offline; a database-side sync-safe policy is required." : "O banco está aplicando a restrição de edição de dias passados à sincronização. As alterações foram preservadas offline; é necessária uma regra no banco que permita sincronizar sem editar datas.")
        : mensagemErro);
      setStatusDadosNuvem("Sincronização pendente • falha no envio");
      setMensagemSincronizacaoManual("");
    } finally {
      sincronizacaoEmAndamentoRef.current = false;
      setSincronizacaoManualEmAndamento(false);
    }
  }

  // Ao voltar a conexão, envia automaticamente os dados locais pendentes.
  // O botão manual permanece disponível para forçar uma sincronização.
  useEffect(() => {
    let cancelado = false;
    async function sincronizarPendenciasAoReconectar() {
      if (!estaOnline || !authSession?.user?.id || !dadosNuvemCarregados) return;
      setStatusOffline("Conexão disponível • verificando sincronização");
      const cache = await lerSnapshotOffline(authSession.user.id).catch(() => null);
      if (!cancelado && cache?.pendente === true) sincronizarDadosManualmente();
    }
    sincronizarPendenciasAoReconectar();
    return () => { cancelado = true; };
  }, [estaOnline, authSession?.user?.id, dadosNuvemCarregados]);

  useEffect(() => () => {
    if (salvamentoTimerRef.current) clearTimeout(salvamentoTimerRef.current);
    if (sincronizacaoAutomaticaTimerRef.current) clearTimeout(sincronizacaoAutomaticaTimerRef.current);
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

  function acionarDescansoDeExercicio(seg, nomeExercicio = "") {
    const safeSeg = Math.max(5, Number(seg) || 60);
    setMiniDescansoExercicio(nomeExercicio || "Exercício");
    setMiniDescansoDuracao(safeSeg);
    setMiniDescansoAberto(true);
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
    if (pagina !== abaAtiva) historicoPaginasRef.current.push(abaAtiva);
    if (pagina === "timer") setDataSelecionada(hojeISO);
    setAbaAtiva(pagina);
    setMenuAberto(false);
  }

  function voltarPaginaAnterior() {
    setModoFocoLimpo(false);
    const anterior = historicoPaginasRef.current.pop();
    setAbaAtiva(anterior && anterior !== abaAtiva ? anterior : "hoje");
    setMenuAberto(false);
  }

  function abrirBackupMenu() {
    setModoFocoLimpo(false);
    setAbaAtiva("dashboard");
    setMenuAberto(false);
    setTimeout(() => {
      backupRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 80);
  }

  async function resetarDados() {
    // Reset total do snapshot do usuário: histórico, rotina, Dashboard e métricas.
    if (salvamentoTimerRef.current) { clearTimeout(salvamentoTimerRef.current); salvamentoTimerRef.current = null; }
    salvamentoPendenteRef.current = null;
    pararSomAlarme();
    setCronometroRodando(false);
    setTimerRodando(false);
    setIntervaloRodando(false);
    setTimerRestante(0);
    setMiniDescansoAberto(false);
    setMiniDescansoExercicio("");
    setMiniDescansoDuracao(60);
    setCalcAberta(false);
    setModoTempo("cronometro");
    setTimerHoras(0);
    setTimerMinutos(1);
    setTimerSegundos(0);
    setIntervaloTrabalhoSeg(40);
    setIntervaloDescansoSeg(20);
    setIntervaloRodadasTotal(4);
    setIntervaloRodadaAtual(1);
    setIntervaloFase("trabalho");
    setIntervaloRestante(40);
    setRotina(ROTINA_INICIAL);
    setExerciciosSalvosCards([]);
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
    setRegistrosPR([]);
    setMedidasCorporais([]);
    setMetasPessoais([]);
    setDataSelecionada(hojeISO);
    setExercicioHistoricoAberto(null);
    setEditandoId(null);
    setTextoBackup("");
    setStatusBackup("Todos os dados do aplicativo foram resetados.");
    setAbaAtiva("hoje");
    setMenuAberto(false);
    setResetModalAberto(false);
    setResetSenha("");
    setResetErro("");
    setStatusDadosNuvem("Resetando e sincronizando seus dados...");
    const snapshotResetado = {
      rotina: ROTINA_INICIAL, exerciciosSalvosCards: [], focoDiasPorChave: {}, presets: PRESETS_INICIAIS,
      logsPorData: {}, observacoes: {}, duracaoPorData: {}, tempoAtivoPorData: {},
      aquecimentoPorData: {}, estadoDiaPorData: {}, checklistPorData: {}, sinaisCorpoPorData: {},
      sonoPorData: {}, motivoSemTreinoPorData: {}, refeicoesModelos: REFEICOES_PADRAO_INICIAIS,
      refeicoesFeitasPorData: {}, refeicaoLivrePorData: {}, janelaTreinoPorData: {}, cafeinaPorData: {},
      cardioPorData: {}, suplementos: [], itensMochila: MOCHILA_PADRAO_INICIAIS, mochilaMarcadaPorData: {},
      metaTreinosSemana: 4, ultimoBackupISO: null, modoTempo: "cronometro", duracaoTimerConfig: 60,
      intervaloTrabalhoSeg: 40, intervaloDescansoSeg: 20, intervaloRodadasTotal: 4,
      pesoKg: 75, aguaPorData: {}, metaTreinosMes: 16, registrosPR: [], medidasCorporais: [],
      metasPessoais: [], perfilFoto,
    };
    const userId = authSession?.user?.id;
    if (userId) {
      const timestampReset = new Date().toISOString();
      try {
        await gravarSnapshotOffline({ userId, data: snapshotResetado, salvoEm: timestampReset, cloudUpdatedAt: timestampReset, pendente: true });
        const { error: erroNuvemReset } = await supabase.from("caveira_app_data").upsert({ user_id: userId, data: snapshotResetado, updated_at: timestampReset }, { onConflict: "user_id" });
        if (erroNuvemReset) throw erroNuvemReset;
        await gravarSnapshotOffline({ userId, data: snapshotResetado, salvoEm: timestampReset, cloudUpdatedAt: timestampReset, pendente: false });
        setStatusDadosNuvem("Todos os dados foram resetados e sincronizados.");
      } catch (erroPersistenciaReset) {
        setErroDadosNuvem(erroPersistenciaReset?.message || "Reset aplicado localmente, mas a sincronização precisa ser conferida.");
        setStatusDadosNuvem("Reset aplicado localmente • sincronização pendente");
      }
    }
  }

  async function confirmarResetComSenha() {
    setResetErro("");
    if (!resetSenha.trim()) { setResetErro("Digite sua senha para confirmar."); return; }
    if (!estaOnline) { setResetErro("Para validar sua senha e sincronizar o reset completo, conecte-se à internet."); return; }
    setResetProcessando(true);
    try {
      const email = authSession?.user?.email;
      if (!email) throw new Error("Não foi possível identificar o email da conta.");
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: resetSenha });
      if (error) throw new Error("Senha incorreta. Nenhum dado foi apagado.");
      if (data?.user?.id !== authSession?.user?.id) throw new Error("A validação retornou uma conta diferente. Reset cancelado.");
      await resetarDados();
    } catch (error) {
      setResetErro(error?.message || "Não foi possível validar a senha. Nenhum dado foi apagado.");
    } finally {
      setResetProcessando(false);
    }
  }

  async function atualizarFotoPerfil(arquivo) {
    setPerfilFotoErro("");
    if (!arquivo) return;
    if (!arquivo.type?.startsWith("image/")) { setPerfilFotoErro("Escolha um arquivo de imagem."); return; }
    if (arquivo.size > 8 * 1024 * 1024) { setPerfilFotoErro("A imagem deve ter até 8 MB."); return; }
    try {
      const comprimida = await comprimirImagemParaBase64(arquivo, 420, 0.68);
      setPerfilFoto(comprimida);
      setPerfilFotoErro("Foto atualizada. Será sincronizada com seus dados.");
    } catch { setPerfilFotoErro("Não foi possível processar essa imagem."); }
    if (perfilFotoInputRef.current) perfilFotoInputRef.current.value = "";
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

  const gruposMuscularesCards = [
    { id: "superior", nome: "SUPERIOR", descricao: "Peito, costas, ombros, bíceps e tríceps.", cor: "#C7A9EF", figura: "superior" },
    { id: "inferior", nome: "INFERIOR", descricao: "Quadríceps, posteriores, glúteos, adutores e panturrilhas.", cor: "#A9C7F2", figura: "inferior" },
    { id: "core", nome: "ABDÔMEN E CORE", descricao: "Reto abdominal, oblíquos e estabilizadores do tronco.", cor: "#E9B6D0", figura: "core" },
    { id: "antebracos", nome: "ANTEBRAÇOS", descricao: "Flexores, extensores e pegada.", cor: "#D8C0F2", figura: "antebracos" },
    { id: "cardio", nome: "CARDIO", descricao: "Esteira, bicicleta, corrida, escada e condicionamento.", cor: "#A9DCCB", figura: "cardio" },
    { id: "mobilidade", nome: "MOBILIDADE E ALONGAMENTO", descricao: "Flexibilidade, mobilidade articular e alongamentos.", cor: "#EBC9A8", figura: "mobilidade" },
  ];
  const identificarGrupoTreino = (exercicio) => {
    // A categoria escolhida manualmente ao montar/editar o treino sempre prevalece.
    const grupoEscolhido = String(exercicio?.grupoMuscular || "").trim().toLowerCase();
    if (gruposMuscularesCards.some((grupo) => grupo.id === grupoEscolhido)) return grupoEscolhido;
    const texto = [exercicio?.nome, exercicio?.grupo, exercicio?.musculo, exercicio?.musculos, exercicio?.categoria]
      .filter(Boolean).join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (/antebraco|punho|wrist|rosca inversa|flexao de punho|extensao de punho|pegada|farmer/.test(texto)) return "antebracos";
    if (/abdomen|abdominal|core|prancha|obl(i|í)quo|dead bug|hollow|lombar/.test(texto)) return "core";
    if (/cardio|esteira|corrida|bicicleta|bike|escada|eliptico|remo erg|caminhada|transport/.test(texto)) return "cardio";
    if (/mobilidade|alongamento|stretch|flexibilidade|rotacao toracica|mobilizacao/.test(texto)) return "mobilidade";
    if (/quadriceps|posterior|glute|panturrilha|gemeos|adutor|abdutor|leg press|agachamento|extensora|flexora|stiff|terra|passada|afundo|hack|cadeira/.test(texto)) return "inferior";
    if (/peito|supino|crucifixo|costas|remada|puxada|barra fixa|ombro|desenvolvimento|elevacao lateral|biceps|triceps|rosca|pullover/.test(texto)) return "superior";
    // Exercícios sem grupo muscular informado permanecem acessíveis no card Superior,
    // evitando que qualquer item da rotina desapareça da visualização.
    return "superior";
  };
  const exerciciosPorGrupoTreino = gruposMuscularesCards.reduce((acc, grupo) => {
    acc[grupo.id] = exercicios.filter((ex) => identificarGrupoTreino(ex) === grupo.id);
    return acc;
  }, {});
  const exerciciosVisiveisTreino = grupoTreinoSelecionado
    ? (exerciciosPorGrupoTreino[grupoTreinoSelecionado] || [])
    : exercicios;
  const grupoTreinoAtual = gruposMuscularesCards.find((grupo) => grupo.id === grupoTreinoSelecionado);

  const proximoExercicio = exercicios.find((ex) => !ex.feito) || exercicios[0] || null;
  const concluidosHoje = exercicios.filter((e) => e.feito).length;
  // Resumo visual da sessão: usa as séries configuradas e o descanso de cada exercício.
  const totalSeriesTreino = exercicios.reduce((total, ex) => {
    const match = String(ex.seriesReps || "").match(/(\d+)\s*[xX×]/);
    return total + (match ? Math.max(0, Number(match[1]) || 0) : 0);
  }, 0);
  const estimativaSessaoSeg = exercicios.reduce((total, ex) => {
    const match = String(ex.seriesReps || "").match(/(\d+)\s*[xX×]\s*(\d+)/);
    const series = match ? Math.max(0, Number(match[1]) || 0) : 0;
    const descanso = Math.max(0, Number(ex.descanso) || 0);
    // Aproximação de 40 segundos de execução por série + descanso entre séries.
    return total + (series * 40) + (Math.max(0, series - 1) * descanso);
  }, 0);
  // Próxima sessão programada: procura o próximo dia com treino, a partir de amanhã.
  const proximaSessaoInfo = (() => {
    const dataBase = new Date(`${hojeISO}T12:00:00`);
    for (let deslocamento = 1; deslocamento <= 7; deslocamento += 1) {
      const dataCandidata = new Date(dataBase);
      dataCandidata.setDate(dataCandidata.getDate() + deslocamento);
      const dataISO = `${dataCandidata.getFullYear()}-${String(dataCandidata.getMonth() + 1).padStart(2, "0")}-${String(dataCandidata.getDate()).padStart(2, "0")}`;
      const chave = getChaveDiaDaData(dataISO);
      const diaInfo = DIAS_SEMANA.find((dia) => dia.chave === chave);
      const lista = rotina[chave] || [];
      if (lista.length > 0) {
        const resumo = lista.reduce((acc, item) => {
          const match = String(item.seriesReps || "").match(/(\d+)\s*[xX×]\s*(\d+)/);
          if (match) {
            acc.series += Number(match[1]) || 0;
            acc.repeticoes += (Number(match[1]) || 0) * (Number(match[2]) || 0);
          }
          return acc;
        }, { series: 0, repeticoes: 0 });
        return {
          dataISO,
          nomeDia: diaInfo?.nome || "Próximo treino",
          exercicios: lista.length,
          series: resumo.series,
          repeticoes: resumo.repeticoes,
        };
      }
    }
    return null;
  })();
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

    // Marcar o exercício registra somente a conclusão.
    // O descanso é iniciado manualmente no botão de segundos do próprio exercício.
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

  function salvarExercicioNosCards(exercicio, grupoForcado = null) {
    const nome = String(exercicio?.nome || exercicio?.[0] || "").trim();
    if (!nome) return;
    const grupo = grupoForcado || exercicio?.grupoMuscular || identificarGrupoTreino({ nome, grupo: exercicio?.grupo || exercicio?.[1] });
    setExerciciosSalvosCards((prev) => {
      if (prev.some((item) => item.nome.trim().toLowerCase() === nome.toLowerCase())) return prev;
      return [...prev, {
        id: `card-ex-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        nome,
        grupoMuscular: grupo,
        equipamento: exercicio?.equipamento || exercicio?.[2] || "",
        instrucoes: exercicio?.instrucoes || exercicio?.[3] || "",
      }];
    });
  }

  function adicionarExercicioSalvoManual(e) {
    e.preventDefault();
    if (!novoExercicioSalvoNome.trim()) return;
    salvarExercicioNosCards({ nome: novoExercicioSalvoNome.trim(), grupoMuscular: grupoTreinoSelecionado });
    setNovoExercicioSalvoNome("");
  }

  function substituirExercicioDaRotina(exercicioSalvo, dia, idAlvo) {
    if (!exercicioSalvo || !dia || !idAlvo) return;
    setRotina((prev) => ({
      ...prev,
      [dia]: (prev[dia] || []).map((item) => item.id === idAlvo
        ? { ...item, nome: exercicioSalvo.nome, grupoMuscular: exercicioSalvo.grupoMuscular }
        : item),
    }));
    setSubstituicaoCardAbertaId(null);
    setSubstituicaoCardAlvoId("");
    setAbaAtiva("hoje");
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
          grupoMuscular: novoGrupoMuscular,
          seriesReps: novoSeriesReps.trim() || "4x10",
          descanso: Math.max(5, Number(novoDescanso) || 60),
          carga: Math.max(0, Number(novoCarga) || 0),
        },
      ],
    }));
    setNovoNome("");
    setNovoGrupoMuscular("superior");
    setFormAdicionarExercicioAberto(false);
  }

  function iniciarEdicao(item) {
    setEditandoId(item.id);
    setEditForm({
      nome: item.nome,
      grupoMuscular: item.grupoMuscular || identificarGrupoTreino(item),
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
              grupoMuscular: editForm.grupoMuscular || "superior",
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
    // A sequência continua válida durante o dia seguinte ao último treino.
    // Assim, uma ausência só zera o contador depois que o dia sem treino termina.
    let streak = 0;
    const ultimaDataTreinada = datas[datas.length - 1] || "";
    const ontemDate = new Date(`${hojeISO}T12:00:00`);
    ontemDate.setDate(ontemDate.getDate() - 1);
    const ontemISO = formatarDataISO(ontemDate);
    const sequenciaAindaValida = ultimaDataTreinada === hojeISO || ultimaDataTreinada === ontemISO;
    if (datas.length > 0 && sequenciaAindaValida) {
      streak = 1;
      for (let i = datas.length - 1; i > 0; i--) {
        const d1 = new Date(`${datas[i]}T12:00:00`);
        const d2 = new Date(`${datas[i - 1]}T12:00:00`);
        if (Math.round((d1 - d2) / 86400000) === 1) streak += 1;
        else break;
      }
    }

    const foguinhoAtivo = streak > 0;

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
    if (Array.isArray(parsed.exerciciosSalvosCards)) setExerciciosSalvosCards(parsed.exerciciosSalvosCards);
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
          background: "rgba(49, 43, 63, 0.78)",
          border: "1px solid rgba(190, 170, 225, 0.19)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          fontWeight: 700,
          color: "#BEB7CA",
          flexShrink: 0,
        }}
      >
        CV
      </div>
    );
  };

  const renderIconeMenu = (tipo, tamanho = 18) => {
    const props = { width: tamanho, height: tamanho, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, style: { display: "block", flexShrink: 0 } };
    const caminhos = {
      hoje: <><path d="m6.5 6.5 11 11"/><path d="m7 3 4 4-3 3-4-4z"/><path d="m17 13 4 4-3 3-4-4z"/><path d="m8 10 6 6"/><path d="m4 14 6-6"/></>,
      montar: <><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/><path d="M8 4v4"/><path d="M15 10v4"/><path d="M11 16v4"/></>,
      dashboard: <><path d="M3 20h18"/><path d="m5 16 4-4 3 2 6-7"/><path d="M17 7h3v3"/></>,
      suplementos: <><path d="m4 7 13 10"/><path d="m7 4 4 4-3 3-4-4z"/><path d="m17 13 4 4-3 3-4-4z"/></>,
      alimentacao: <><path d="M4 3v7a3 3 0 0 0 3 3h1V3"/><path d="M6 3v7"/><path d="M8 3v7"/><path d="M7 13v8"/><path d="M16 3v18"/><path d="M16 3c3 2 4 5 4 8h-4"/></>,
      mochila: <><rect x="5" y="6" width="14" height="15" rx="3"/><path d="M9 6V4a3 3 0 0 1 6 0v2"/><path d="M5 11h14"/><path d="M9 11v3h6v-3"/></>,
      desempenho: <><path d="M3 20h18"/><path d="m5 16 4-4 3 2 6-7"/><path d="M17 7h3v3"/></>,
      biblioteca: <><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v18H7.5A2.5 2.5 0 0 1 5 17.5z"/><path d="M5 5h15"/><path d="M8 9h8"/><path d="M8 13h8"/><path d="M5 17.5A2.5 2.5 0 0 0 7.5 20"/></>,
      conquistas: <><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4v2a4 4 0 0 0 4 4"/><path d="M16 6h4v2a4 4 0 0 1-4 4"/><path d="M12 13v4"/><path d="M9 21h6"/><path d="M10 17h4"/></>,
      relatorios: <><path d="M5 3h10l4 4v14H5z"/><path d="M15 3v5h4"/><path d="M8 16v-3"/><path d="M11 16v-5"/><path d="M14 16v-2"/></>,
      foco: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v2M22 12h-2M12 22v-2M2 12h2"/></>,
      backup: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/></>,
      configuracoes: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-1.6 1.6-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.3v-.31a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06-1.6-1.6.06-.06A1.7 1.7 0 0 0 7.1 15a1.7 1.7 0 0 0-1.56-1.03H5.2v-2.3h.34A1.7 1.7 0 0 0 7.1 10a1.7 1.7 0 0 0-.34-1.87L6.7 8.07l1.6-1.6.06.06a1.7 1.7 0 0 0 1.87.34A1.7 1.7 0 0 0 11.26 5.3V5h2.3v.3a1.7 1.7 0 0 0 1.03 1.57 1.7 1.7 0 0 0 1.87-.34l.06-.06 1.6 1.6-.06.06A1.7 1.7 0 0 0 17.72 10a1.7 1.7 0 0 0 1.56 1.03h.34v2.3h-.34A1.7 1.7 0 0 0 19.4 15z"/></>,
      painel: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/><path d="m14 9 3 3-3 3"/></>,
      sair: <><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 3v18"/></>,
      pontos: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    };
    return <svg {...props}>{caminhos[tipo] || caminhos.painel}</svg>;
  };

  const larguraColunaFechada = 72;
  const larguraDrawer = ehDesktop ? 260 : "min(280px, 86vw)";
  const larguraMenuDesktop = menuAberto ? larguraDrawer : larguraColunaFechada;
  const larguraContainer = ehDesktop ? "100%" : "460px";
  const paddingContainer = ehDesktop
    ? "28px 32px 96px"
    : `${menuAberto ? "20px" : "60px"} 14px 88px 14px`;

  const displayTimerSeg = timerRodando || timerRestante > 0 ? timerRestante : totalConfigTimerSeg;

  if (authCarregando) {
    return <div style={{ minHeight: "100vh", background: "rgba(29, 27, 39, 0.72)", color: "#BEB7CA", display: "grid", placeItems: "center", fontFamily: "inherit" }}>{textoUi("Carregando sua conta...", "Loading your account...")}</div>;
  }

  if (!authSession && etapaEntrada !== "auth") {
    const entrarNaAutenticacao = (modo) => {
      setAuthModo(modo);
      setAuthErro("");
      setAuthMensagem("");
      setEtapaEntrada("auth");
    };

    return (
      <main
        style={{
          minHeight: "100vh",
          minHeight: "100dvh",
          height: "100dvh",
          width: "100vw",
          position: "fixed",
          inset: 0,
          overflow: "hidden",
          isolation: "isolate",
          background: "#050506",
          color: "#F4F2F7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          boxSizing: "border-box",
          fontFamily: "'DM Sans', 'Inter', ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;450;500;550;600;650;700&family=Manrope:wght@400;500;600;650;700;750&display=swap');
          @keyframes caveiraEntradaAparecer {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .caveira-entrada-card {
            position: relative;
            width: 100%;
            height: 100dvh;
            min-height: 100dvh;
            overflow: hidden;
            isolation: isolate;
            border: 0;
            border-radius: 0;
            background: #08080a;
            box-shadow: none;
            animation: caveiraEntradaAparecer .55s ease both;
          }
          .caveira-entrada-imagem {
            position: absolute;
            inset: 0;
            z-index: 0;
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center 43%;
            opacity: .82;
            filter: grayscale(1) brightness(.78);
          }
          .caveira-entrada-sombra {
            position: absolute;
            inset: 0;
            z-index: 1;
            pointer-events: none;
            background:
              linear-gradient(180deg, rgba(0,0,0,.43) 0%, rgba(0,0,0,.08) 32%, rgba(0,0,0,.30) 60%, rgba(0,0,0,.82) 100%),
              linear-gradient(90deg, rgba(0,0,0,.24), rgba(0,0,0,.02) 55%, rgba(0,0,0,.16));
          }
          .caveira-entrada-conteudo {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            width: 100%;
            height: 100%;
            min-height: 100%;
            box-sizing: border-box;
            padding: max(34px, env(safe-area-inset-top)) clamp(24px, 5vw, 76px) max(30px, env(safe-area-inset-bottom));
            font-family: 'DM Sans', 'Inter', ui-sans-serif, system-ui, sans-serif;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          }
          .caveira-entrada-conteudo h1 {
            font-family: 'Manrope', 'DM Sans', sans-serif !important;
            font-weight: 600 !important;
            letter-spacing: -.065em !important;
          }
          .caveira-entrada-conteudo p {
            font-weight: 400;
            letter-spacing: -.015em;
          }
          .caveira-entrada-conteudo header > div > div:first-child {
            font-family: 'Manrope', 'DM Sans', sans-serif;
            font-weight: 700 !important;
            letter-spacing: .16em !important;
          }
          .caveira-entrada-botao {
            width: 100%;
            min-height: 52px;
            border-radius: 999px;
            font-family: 'DM Sans', 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: .005em;
            cursor: pointer;
            touch-action: manipulation;
            transition: transform .18s ease, background .18s ease, border-color .18s ease;
          }
          .caveira-entrada-botao:active { transform: scale(.985); }
          .caveira-manual-area {
            flex: 1;
            min-height: 0;
            width: 100%;
            max-width: 1040px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            justify-content: center;
            overflow-y: auto;
            overscroll-behavior: contain;
            scrollbar-width: thin;
            padding: 18px 0;
            box-sizing: border-box;
          }
          .caveira-manual-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
            margin: 22px 0 24px;
          }
          .caveira-manual-item {
            padding: 17px 16px;
            border: 1px solid rgba(255,255,255,.14);
            border-radius: 16px;
            background: rgba(12,12,16,.48);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
          }
          .caveira-manual-item strong {
            display: block;
            margin: 0 0 7px;
            color: #F5F1FA;
            font-family: 'Manrope', 'DM Sans', sans-serif;
            font-size: 14px;
            font-weight: 650;
            letter-spacing: -.025em;
          }
          .caveira-manual-item span {
            display: block;
            color: rgba(245,242,248,.70);
            font-size: 12px;
            line-height: 1.55;
          }
          @media (max-width: 700px) {
            .caveira-manual-area { justify-content: flex-start; padding: 22px 0 16px; }
            .caveira-manual-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; margin: 17px 0 20px; }
            .caveira-manual-item { padding: 14px 12px; border-radius: 13px; }
            .caveira-manual-item strong { font-size: 12px; }
            .caveira-manual-item span { font-size: 11px; }
          }
          @media (max-width: 380px) {
            .caveira-manual-grid { grid-template-columns: 1fr 1fr; }
          }
          @media (max-width: 380px) {
            .caveira-entrada-conteudo { padding-left: 22px; padding-right: 22px; }
          }
          @media (min-width: 700px) {
            .caveira-entrada-conteudo { padding-left: clamp(56px, 8vw, 132px); padding-right: clamp(56px, 8vw, 132px); }
            .caveira-entrada-conteudo > div:nth-child(2) { max-width: 560px; margin-left: auto; margin-right: auto; }
            .caveira-entrada-botao { max-width: 320px; }
          }
          button, a { touch-action: manipulation; }
        `}</style>

        <section className="caveira-entrada-card">
          <img
            className="caveira-entrada-imagem"
            src="/CaveiraBoasVindas.jpeg"
            alt="Imagem de fundo da tela de boas-vindas do Caveira App"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const card = e.currentTarget.closest(".caveira-entrada-card");
              if (card) card.style.background = "radial-gradient(ellipse at 50% 32%, rgba(117,91,151,.32), transparent 58%), linear-gradient(145deg, #191722, #09090d)";
            }}
          />
          <div className="caveira-entrada-sombra" aria-hidden="true" />

          <div className="caveira-entrada-conteudo">
            <header style={{ display: "flex", alignItems: "center", gap: "11px" }}>
              <img
                src="/LogoCaveira.png"
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                style={{ width: "39px", height: "39px", objectFit: "contain" }}
              />
              <div>
                <div style={{ fontSize: "13px", fontWeight: 900, letterSpacing: ".19em" }}>CAVEIRA APP</div>
                <div style={{ color: "rgba(240,237,245,.68)", fontSize: "9px", letterSpacing: ".15em", marginTop: "4px" }}>UM DIA DE CADA VEZ</div>
              </div>
            </header>

            {etapaEntrada === "boas-vindas" ? (
              <div style={{ textAlign: "center", padding: "0 2px 8px" }}>
                <div style={{ color: "#D8C5F2", fontSize: "10px", fontWeight: 800, letterSpacing: ".22em", marginBottom: "13px" }}>
                  DISCIPLINA • CONSTÂNCIA • EVOLUÇÃO
                </div>
                <h1 style={{ fontSize: "clamp(34px, 9vw, 46px)", lineHeight: 1.04, letterSpacing: "-.055em", fontWeight: 850, margin: "0 0 14px" }}>
                  CAVEIRA
                </h1>
                <p style={{ maxWidth: "300px", margin: "0 auto 25px", color: "rgba(245,242,248,.82)", fontSize: "14px", lineHeight: 1.7 }}>
                  Seu espaço para organizar os treinos, acompanhar sua evolução e manter a constância.
                </p>
                <button
                  type="button"
                  className="caveira-entrada-botao"
                  onClick={() => setEtapaEntrada("manual")}
                  style={{
                    maxWidth: "290px",
                    border: "1px solid rgba(230,215,250,.42)",
                    background: "rgba(199,169,239,.88)",
                    color: "#17131F",
                    boxShadow: "0 10px 28px rgba(0,0,0,.24)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  Bem-vindo <span aria-hidden="true" style={{ marginLeft: "10px" }}>→</span>
                </button>
              </div>
            ) : etapaEntrada === "manual" ? (
              <div className="caveira-manual-area">
                <div style={{ textAlign: "center", maxWidth: "760px", width: "100%", margin: "0 auto" }}>
                  <div style={{ color: "#D8C5F2", fontSize: "10px", fontWeight: 700, letterSpacing: ".22em", marginBottom: "12px" }}>
                    CONHEÇA SUA NOVA ROTINA
                  </div>
                  <h1 style={{ fontSize: "clamp(29px, 5vw, 48px)", lineHeight: 1.08, margin: "0 0 12px" }}>
                    Mais organização. <span style={{ color: "#C7A9EF" }}>Mais evolução.</span>
                  </h1>
                  <p style={{ maxWidth: "620px", margin: "0 auto", color: "rgba(245,242,248,.82)", fontSize: "clamp(13px, 1.5vw, 16px)", lineHeight: 1.7 }}>
                    O Caveira App reúne ferramentas para você cuidar da sua rotina de treino, acompanhar seus resultados e construir constância — tudo em um só lugar.
                  </p>
                </div>

                <div className="caveira-manual-grid">
                  <article className="caveira-manual-item">
                    <strong>Treinos organizados</strong>
                    <span>Monte sua rotina, organize exercícios, séries e cargas e acompanhe o que já realizou.</span>
                  </article>
                  <article className="caveira-manual-item">
                    <strong>Timer e descanso</strong>
                    <span>Use cronômetros e intervalos para manter o ritmo durante cada sessão.</span>
                  </article>
                  <article className="caveira-manual-item">
                    <strong>Evolução visível</strong>
                    <span>Consulte seu painel, relatórios, recordes, medidas e metas pessoais.</span>
                  </article>
                  <article className="caveira-manual-item">
                    <strong>Hábitos e bem-estar</strong>
                    <span>Registre alimentação, hidratação, cafeína e suplementos na sua rotina.</span>
                  </article>
                  <article className="caveira-manual-item">
                    <strong>Planejamento prático</strong>
                    <span>Salve modelos de treino, consulte a biblioteca de exercícios e organize sua mochila.</span>
                  </article>
                  <article className="caveira-manual-item">
                    <strong>Seus dados com você</strong>
                    <span>Acesse recursos offline e sincronize seus registros quando estiver conectado.</span>
                  </article>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "9px", paddingBottom: "3px" }}>
                  <button
                    type="button"
                    className="caveira-entrada-botao"
                    onClick={() => setEtapaEntrada("acesso")}
                    style={{ maxWidth: "330px", border: "1px solid rgba(230,215,250,.42)", background: "rgba(199,169,239,.92)", color: "#17131F", boxShadow: "0 10px 28px rgba(0,0,0,.24)" }}
                  >
                    Prosseguir para acesso <span aria-hidden="true" style={{ marginLeft: "9px" }}>→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEtapaEntrada("boas-vindas")}
                    style={{ padding: "7px 12px", border: 0, background: "transparent", color: "rgba(245,242,248,.68)", fontSize: "12px", cursor: "pointer" }}
                  >
                    Voltar
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "23px 19px 19px",
                  borderRadius: "19px",
                  border: "1px solid rgba(255,255,255,.17)",
                  background: "rgba(12,12,16,.58)",
                  boxShadow: "0 16px 45px rgba(0,0,0,.22)",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                }}
              >
                <div style={{ color: "#D8C5F2", fontSize: "10px", fontWeight: 800, letterSpacing: ".2em", marginBottom: "10px" }}>CAVEIRA APP</div>
                <h1 style={{ fontSize: "27px", lineHeight: 1.12, letterSpacing: "-.04em", margin: "0 0 9px" }}>Vamos começar?</h1>
                <p style={{ color: "rgba(245,242,248,.73)", fontSize: "13px", lineHeight: 1.6, margin: "0 0 19px" }}>
                  Entre na sua conta ou crie seu cadastro para continuar.
                </p>
                <div style={{ display: "grid", gap: "10px" }}>
                  <button
                    type="button"
                    className="caveira-entrada-botao"
                    onClick={() => entrarNaAutenticacao("login")}
                    style={{ border: "0", background: "#C7A9EF", color: "#17131F" }}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    className="caveira-entrada-botao"
                    onClick={() => entrarNaAutenticacao("cadastro")}
                    style={{ border: "1px solid rgba(235,225,248,.34)", background: "rgba(255,255,255,.075)", color: "#F5F1FA" }}
                  >
                    Criar conta
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setEtapaEntrada("manual")}
                  style={{ display: "block", margin: "13px auto 0", padding: "8px 12px", border: 0, background: "transparent", color: "rgba(245,242,248,.68)", fontSize: "12px", cursor: "pointer" }}
                >
                  Voltar
                </button>
              </div>
            )}

            <div style={{ textAlign: "center", color: "rgba(240,237,245,.48)", fontSize: "9px", letterSpacing: ".16em" }}>
              FOCO NO PROCESSO · EVOLUA TODOS OS DIAS
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!authSession) {
    const authInput = { width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: "9px", border: "1px solid rgba(190, 170, 225, 0.19)", background: "rgba(29, 27, 39, 0.72)", color: "#F1EEF7", fontSize: "14px", outline: "none" };
    const authLabel = { display: "block", color: "#BEB7CA", fontSize: "12px", marginBottom: "7px" };
    const authBotao = { width: "100%", padding: "13px", border: "0", borderRadius: "9px", background: "#C7A9EF", color: "#111827", fontWeight: 800, fontSize: "14px", cursor: authEnviando ? "wait" : "pointer", opacity: authEnviando ? 0.7 : 1 };
    const tituloAuth = authModo === "cadastro" ? textoUi("Criar sua conta", "Create your account") : authModo === "recuperar" ? textoUi("Recuperar senha", "Recover password") : authModo === "novaSenha" ? textoUi("Nova senha", "New password") : textoUi("Bem-vindo de volta", "Welcome back");
    return (
      <main style={{ minHeight: "100vh", background: "radial-gradient(circle at 50% 0%, #1D1B27 0%, #17161F 70%)", color: "#F1EEF7", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", boxSizing: "border-box", fontFamily: "inherit" }}>
        <style>{`html, body, #root { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; } button, a, [role="button"] { touch-action: manipulation; } @media (max-width: 639px) { input, select, textarea { font-size: 16px !important; } }`}</style>
        <section style={{ width: "100%", maxWidth: "420px", background: "rgba(31, 29, 42, 0.91)", border: "1px solid rgba(190, 170, 225, 0.19)", borderRadius: "18px", padding: "30px", boxShadow: "0 24px 80px rgba(0,0,0,.4)" }}>
          <button
            type="button"
            onClick={() => { setAuthModo("login"); setEtapaEntrada("acesso"); setAuthErro(""); setAuthMensagem(""); }}
            aria-label="Voltar às opções de acesso"
            title="Voltar para Entrar ou Criar conta"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", margin: "-8px 0 18px -8px", padding: 0, borderRadius: "50%", border: "1px solid rgba(190,170,225,.18)", background: "rgba(255,255,255,.035)", color: "#DCCCF5", cursor: "pointer" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/><path d="M9 12h11"/></svg>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
            <img src="/LogoCaveira.png" alt="Caveira" onError={(e) => { e.currentTarget.style.display = "none"; }} style={{ width: "42px", height: "42px", objectFit: "contain" }} />
            <div><div style={{ fontSize: "15px", fontWeight: 900, letterSpacing: ".16em" }}>CAVEIRA</div><div style={{ color: "#9E96AD", fontSize: "10px", letterSpacing: ".12em" }}>UM DIA DE CADA VEZ</div></div>
          </div>
          <h1 style={{ fontSize: "25px", margin: "0 0 8px", letterSpacing: "-.03em" }}>{tituloAuth}</h1>
          <p style={{ color: "#BEB7CA", fontSize: "13px", lineHeight: 1.6, margin: "0 0 22px" }}>{authModo === "cadastro" ? textoUi("Preencha seus dados para começar.", "Fill in your details to get started.") : authModo === "recuperar" ? textoUi("Informe seu email para receber as instruções de recuperação.", "Enter your email to receive recovery instructions.") : authModo === "novaSenha" ? textoUi("Use o código enviado ao seu email para definir uma nova senha.", "Use the code sent to your email to set a new password.") : textoUi("Entre para acessar seus treinos e sua rotina.", "Sign in to access your workouts and routine.")}</p>
          <form onSubmit={enviarFormularioAuth} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {authModo === "cadastro" && <label style={authLabel}>{textoUi("Nome de usuário", "Username")}<input required value={authNome} onChange={(e) => setAuthNome(e.target.value)} placeholder={textoUi("Como deseja ser chamado?", "What should we call you?")} style={{ ...authInput, display: "block", marginTop: "7px" }} /></label>}
            {(authModo === "login" || authModo === "cadastro" || authModo === "recuperar" || authModo === "novaSenha") && <label style={authLabel}>Email<input required type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder={textoUi("seu@email.com", "you@email.com")} style={{ ...authInput, display: "block", marginTop: "7px" }} /></label>}
            {(authModo === "login" || authModo === "cadastro") && <label style={authLabel}>Senha<div style={{ position: "relative", marginTop: "7px" }}><input required minLength={6} type={authMostrarSenha ? "text" : "password"} value={authSenha} onChange={(e) => setAuthSenha(e.target.value)} placeholder={textoUi("Mínimo de 6 caracteres", "At least 6 characters")} style={{ ...authInput, paddingRight: "62px" }} /><button type="button" onClick={() => setAuthMostrarSenha((v) => !v)} style={{ position: "absolute", right: "9px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: 0, color: "#C7A9EF", cursor: "pointer", fontSize: "11px" }}>{authMostrarSenha ? textoUi("Ocultar", "Hide") : textoUi("Mostrar", "Show")}</button></div></label>}
            {authModo === "novaSenha" && <><label style={authLabel}>{textoUi("Código recebido por email", "Code received by email")}<input required inputMode="numeric" value={authCodigo} onChange={(e) => setAuthCodigo(e.target.value)} placeholder={textoUi("Digite o código", "Enter the code")} style={{ ...authInput, display: "block", marginTop: "7px" }} /></label><label style={authLabel}>Nova senha<input required minLength={6} type={authMostrarSenha ? "text" : "password"} value={authNovaSenha} onChange={(e) => setAuthNovaSenha(e.target.value)} placeholder={textoUi("Mínimo de 6 caracteres", "At least 6 characters")} style={{ ...authInput, display: "block", marginTop: "7px" }} /></label></>}
            {authErro && <div role="alert" style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.25)", color: "#F4B8C2", fontSize: "12px" }}>{authErro}</div>}
            {authMensagem && <div role="status" style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(199,169,239,.12)", border: "1px solid rgba(199,169,239,.26)", color: "#DCCCF5", fontSize: "12px", lineHeight: 1.5 }}>{authMensagem}</div>}
            <button disabled={authEnviando} type="submit" style={authBotao}>{authEnviando ? textoUi("Aguarde...", "Please wait...") : authModo === "cadastro" ? textoUi("Criar conta", "Create account") : authModo === "recuperar" ? textoUi("Enviar código", "Send code") : authModo === "novaSenha" ? textoUi("Alterar senha", "Change password") : textoUi("Entrar", "Sign in")}</button>
          </form>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginTop: "20px", fontSize: "12px" }}>
            {authModo === "login" && <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "5px" }}><button type="button" onClick={() => { setAuthModo("recuperar"); setAuthErro(""); setAuthMensagem(""); }} style={{ background: "none", border: 0, padding: 0, color: "#BEB7CA", cursor: "pointer" }}>Esqueci minha senha</button><span aria-hidden="true" style={{ display: "block", width: "34px", height: "1px", borderRadius: "2px", background: "rgba(199,169,239,.58)" }} /></span>}
            {authModo !== "login" && <button type="button" onClick={() => { setAuthModo("login"); setAuthErro(""); setAuthMensagem(""); }} style={{ background: "none", border: 0, color: "#DCCCF5", cursor: "pointer" }}>{textoUi("Voltar para login", "Back to sign in")}</button>}
          </div>
        </section>
      </main>
    );
  }

  if (authSession && !dadosNuvemCarregados) {
    return <div style={{ minHeight: "100vh", background: "rgba(29, 27, 39, 0.72)", color: "#BEB7CA", display: "grid", placeItems: "center", padding: "24px", textAlign: "center", fontFamily: "inherit" }}>
      <div style={{ maxWidth: "440px" }}>
        <div style={{ fontSize: "15px", fontWeight: 800, color: "#DCCCF5", marginBottom: "10px" }}>CAVEIRA APP</div>
        <div>{erroDadosNuvem ? "Não foi possível acessar seus dados na nuvem." : statusDadosNuvem}</div>
        {erroDadosNuvem && <><p style={{ color: "#F4B8C2", fontSize: "12px", lineHeight: 1.5 }}>{erroDadosNuvem}</p><button onClick={() => { setErroDadosNuvem(""); setTentativaNuvem((n) => n + 1); }} style={{ marginTop: "8px", padding: "10px 16px", borderRadius: "8px", border: 0, background: "#C7A9EF", color: "#111827", fontWeight: 800, cursor: "pointer" }}>Tentar novamente</button></>}
      </div>
    </div>;
  }

  if (modoFocoLimpo) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "rgba(29, 27, 39, 0.72)",
          color: "#F1EEF7",
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
          <span style={{ fontSize: "11px", color: "#BEB7CA", letterSpacing: "0.08em" }}>
            MODO FOCO • {infoDia?.rotulo.toUpperCase()}
          </span>
          <button
            type="button"
            onClick={() => setModoFocoLimpo(false)}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(190, 170, 225, 0.19)",
              background: "rgba(49, 43, 63, 0.78)",
              color: "#F1EEF7",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Sair do foco
          </button>
        </div>

        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#9E96AD", letterSpacing: "0.1em" }}>
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
                color: "#DCCCF5",
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
              <div style={{ fontSize: "10px", color: "#9E96AD" }}>{textoUi('PRÓXIMO / ATUAL', 'NEXT / CURRENT')}</div>
              <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "4px" }}>
                {proximoExercicio.nome}
              </div>
              <div style={{ fontSize: "13px", color: "#BEB7CA", marginTop: "4px" }}>
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
              background: "#C7A9EF",
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
                background: "#9ADFC2",
                color: "#111827",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              {textoUi("Concluir", "Finish")}
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
        background: "linear-gradient(145deg, #17161F 0%, #1D1B27 52%, #17161F 100%)",
        color: "#F1EEF7",
        width: ehDesktop ? `calc(100% - ${larguraMenuDesktop}px)` : "100%",
        maxWidth: larguraContainer,
        margin: ehDesktop ? `0 0 0 ${larguraMenuDesktop}px` : "0 auto",
        padding: paddingContainer,
        position: "relative",
        isolation: "isolate",
        boxSizing: "border-box",
        transition: "width 0.2s ease, margin 0.2s ease, padding 0.2s ease",
        zoom: preferenciaFonte === "pequena" ? (ehDesktop ? 0.94 : 0.88) : preferenciaFonte === "grande" ? (ehDesktop ? 1.06 : 0.98) : (ehDesktop ? 1 : 0.92),
      }}
    >
      <style>{`
        html, body, #root {
          min-height: 100%;
          background: linear-gradient(145deg, #17161F 0%, #1D1B27 52%, #17161F 100%);
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
        div[style*="rgba(49, 43, 63, 0.58)"] {
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 24px rgba(5, 12, 24, 0.12);
        }
        button, a, [role="button"] {
          touch-action: manipulation;
        }
        input:focus, select:focus, textarea:focus {
          outline: 2px solid rgba(190, 160, 232, 0.52);
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

        /* Caveira App — identidade visual Lovable (camada exclusivamente visual) */
        :root {
          color-scheme: dark;
          --caveira-bg: #17161f;
          --caveira-surface: rgba(35, 32, 46, .76);
          --caveira-surface-strong: rgba(31, 29, 42, .94);
          --caveira-border: rgba(190, 170, 225, .15);
          --caveira-lilac: #c7a9ef;
          --caveira-muted: #9e96ad;
          --caveira-text: #f1eef7;
        }
        html, body, #root {
          background: var(--caveira-bg) !important;
          color: var(--caveira-text);
          font-family: Geist, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        body {
          background-image:
            radial-gradient(ellipse 55% 42% at 100% 100%, rgba(199,169,239,.10), transparent 72%),
            radial-gradient(ellipse 40% 32% at 0% 100%, rgba(157,223,200,.045), transparent 72%);
          background-attachment: fixed;
        }
        /* Fundo principal e sidebar: grafite profundo, sem mexer nas dimensões ou eventos. */
        div[style*="linear-gradient(145deg, #17161F"],
        div[style*="linear-gradient(145deg, #191720"] {
          background: linear-gradient(145deg, #17161f 0%, #201d2a 52%, #17161f 100%) !important;
        }
        aside {
          background: linear-gradient(160deg, rgba(27,25,35,.98), rgba(32,29,43,.97)) !important;
          border-right-color: var(--caveira-border) !important;
          box-shadow: 18px 0 52px rgba(0,0,0,.32) !important;
          -webkit-backdrop-filter: blur(22px);
          backdrop-filter: blur(22px);
        }
        header {
          border-bottom-color: var(--caveira-border) !important;
        }
        /* Cartões e painéis com vidro discreto. */
        div[style*="border-radius"][style*="background"],
        section[style*="border-radius"][style*="background"] {
          -webkit-backdrop-filter: blur(16px);
          backdrop-filter: blur(16px);
        }
        div[style*="rgba(49, 43, 63"],
        div[style*="rgba(31, 29, 42"],
        div[style*="rgba(35, 32, 46"] {
          border-color: var(--caveira-border);
          box-shadow: 0 10px 30px rgba(0,0,0,.13);
        }
        button, a, [role="button"] {
          transition: background-color .18s ease, border-color .18s ease, color .18s ease, box-shadow .18s ease, transform .18s ease;
          -webkit-tap-highlight-color: transparent;
        }
        button:focus-visible, a:focus-visible, [role="button"]:focus-visible {
          outline: 2px solid rgba(199,169,239,.72) !important;
          outline-offset: 3px;
        }
        input, select, textarea {
          background-color: rgba(24, 22, 33, .72) !important;
          border-color: rgba(190,170,225,.20) !important;
          color: #f1eef7 !important;
          border-radius: 10px;
        }
        input::placeholder, textarea::placeholder { color: #8f879f !important; }
        input:focus, select:focus, textarea:focus {
          outline: 2px solid rgba(199,169,239,.42) !important;
          outline-offset: 1px;
          border-color: rgba(199,169,239,.55) !important;
        }
        ::selection { background: rgba(199,169,239,.28); color: #fff; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; }
        }
        @media (max-width: 639px) {
          input, select, textarea { font-size: 16px !important; }
        }

        /* Identidade visual Caveira App — alinhada à referência Lovable.
           Esta camada altera somente cores, superfícies, bordas e acabamento visual. */
        :root {
          --background: oklch(0.155 0.01 265);
          --card: oklch(0.19 0.014 268);
          --popover: oklch(0.21 0.014 268);
          --border: oklch(0.26 0.022 270);
          --input: oklch(0.3 0.022 270);
          --foreground: oklch(0.967 0.003 265);
          --muted-foreground: oklch(0.714 0.019 261);
          --secondary: oklch(0.24 0.016 268);
          --muted: oklch(0.21 0.014 268);
          --pastel-pink: oklch(0.82 0.11 345);
          --pastel-lilac: oklch(0.81 0.1 293);
          --pastel-sky: oklch(0.81 0.09 252);
          --pastel-mint: oklch(0.87 0.13 152);
          --pastel-peach: oklch(0.92 0.11 96);
          --primary: var(--pastel-lilac);
          --primary-foreground: oklch(0.18 0.03 285);
          --accent: color-mix(in oklab, var(--pastel-lilac) 12%, transparent);
          --accent-foreground: var(--pastel-lilac);
          --ring: var(--pastel-lilac);
          --success: var(--pastel-mint);
          --caveira-bg: oklch(0.155 0.01 265);
          --caveira-surface: rgba(35, 33, 45, .78);
          --caveira-surface-strong: rgba(31, 29, 42, .96);
          --caveira-border: rgba(190, 170, 225, .14);
          --caveira-lilac: oklch(0.81 0.1 293);
          --caveira-muted: oklch(0.714 0.019 261);
          --caveira-text: oklch(0.967 0.003 265);
        }
        html, body, #root {
          background: var(--caveira-bg) !important;
          color: var(--caveira-text) !important;
          font-family: Geist, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        body {
          background-image:
            radial-gradient(ellipse 58% 44% at 100% 100%, color-mix(in oklab, var(--pastel-lilac) 13%, transparent), transparent 72%),
            radial-gradient(ellipse 42% 34% at 0% 100%, color-mix(in oklab, var(--pastel-mint) 7%, transparent), transparent 72%);
          background-attachment: fixed;
        }
        /* Sidebar e menu compacto: grafite profundo e transparência suave. */
        aside {
          background: linear-gradient(160deg, rgba(27, 26, 35, .98), rgba(34, 31, 44, .97)) !important;
          border-right: 1px solid var(--caveira-border) !important;
          box-shadow: 18px 0 52px rgba(0, 0, 0, .30) !important;
          -webkit-backdrop-filter: blur(22px);
          backdrop-filter: blur(22px);
        }
        div[style*="linear-gradient(145deg, #191720"] {
          background: linear-gradient(160deg, rgba(27, 26, 35, .98), rgba(34, 31, 44, .97)) !important;
          border-right-color: var(--caveira-border) !important;
        }
        /* Cards azuis antigos passam a usar a superfície grafite/lilás da referência. */
        div[style*="rgba(44,67,96"],
        div[style*="rgba(44, 67, 96"],
        div[style*="rgba(38, 54, 75"],
        div[style*="rgba(34, 50, 73"],
        div[style*="rgba(27, 41, 60"] {
          background: var(--caveira-surface) !important;
          border-color: var(--caveira-border) !important;
          color: var(--caveira-text);
          -webkit-backdrop-filter: blur(16px);
          backdrop-filter: blur(16px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, .16);
        }
        div[style*="rgba(49, 43, 63"],
        div[style*="rgba(35, 32, 46"],
        div[style*="rgba(31, 29, 42"] {
          border-color: var(--caveira-border);
          -webkit-backdrop-filter: blur(16px);
          backdrop-filter: blur(16px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, .14);
        }
        /* Faixa inferior e cabeçalhos translúcidos. */
        nav[style*="position: fixed"] {
          background: rgba(25, 24, 33, .82) !important;
          border-top-color: var(--caveira-border) !important;
          -webkit-backdrop-filter: blur(18px);
          backdrop-filter: blur(18px);
          box-shadow: 0 -8px 30px rgba(0, 0, 0, .16);
        }
        header {
          background: rgba(25, 24, 33, .72) !important;
          border-bottom-color: var(--caveira-border) !important;
          -webkit-backdrop-filter: blur(14px);
          backdrop-filter: blur(14px);
        }
        button, a, [role="button"] {
          -webkit-tap-highlight-color: transparent;
          transition: background-color .18s ease, border-color .18s ease, color .18s ease, box-shadow .18s ease;
        }
        button:focus-visible, a:focus-visible, [role="button"]:focus-visible {
          outline: 2px solid color-mix(in oklab, var(--pastel-lilac) 72%, transparent) !important;
          outline-offset: 3px;
        }
        input, select, textarea {
          background: rgba(29, 27, 38, .78) !important;
          border-color: rgba(190, 170, 225, .18) !important;
          color: var(--caveira-text) !important;
          border-radius: 10px;
        }
        input::placeholder, textarea::placeholder { color: var(--caveira-muted) !important; }
        ::selection { background: color-mix(in oklab, var(--pastel-lilac) 28%, transparent); color: #fff; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { transition-duration: .01ms !important; animation-duration: .01ms !important; }
        }

        /* Ajuste visual final: reprodução da referência Caveira/Lovable.
           Somente apresentação; nenhum seletor altera estados, eventos ou dados. */
        :root {
          color-scheme: dark;
          --caveira-bg: #090a0e;
          --caveira-panel: #101218;
          --caveira-panel-soft: #141720;
          --caveira-border: #242832;
          --caveira-text: #f1f2f5;
          --caveira-muted: #9299a6;
          --caveira-lilac: #c5b2ff;
        }
        html, body, #root {
          background: #090a0e !important;
          color: var(--caveira-text) !important;
          font-family: Inter, Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        }
        body {
          background-image:
            radial-gradient(ellipse 34% 28% at 100% 100%, rgba(173, 139, 255, .10), transparent 75%),
            radial-gradient(ellipse 26% 22% at 0% 100%, rgba(111, 210, 173, .035), transparent 75%) !important;
          background-attachment: fixed !important;
        }
        /* Base escura neutra e sem o tom roxo dominante anterior. */
        div[style*="linear-gradient(145deg, #17161F"],
        div[style*="linear-gradient(145deg, #191720"],
        main[style*="radial-gradient"] {
          background: #090a0e !important;
        }
        aside,
        div[style*="position: fixed"][style*="left: 0"] {
          background: #11141a !important;
          border-color: #252a34 !important;
          box-shadow: none !important;
          -webkit-backdrop-filter: none !important;
          backdrop-filter: none !important;
        }
        header {
          background: rgba(9, 10, 14, .96) !important;
          border-bottom: 1px solid #242832 !important;
          -webkit-backdrop-filter: blur(14px);
          backdrop-filter: blur(14px);
        }
        /* Cards: superfícies planas, discretas e próximas à captura enviada. */
        div[style*="rgba(44,67,96"],
        div[style*="rgba(44, 67, 96"],
        div[style*="rgba(38, 54, 75"],
        div[style*="rgba(34, 50, 73"],
        div[style*="rgba(27, 41, 60"],
        div[style*="rgba(49, 43, 63"],
        div[style*="rgba(35, 32, 46"],
        div[style*="rgba(31, 29, 42"] {
          background-color: #101218 !important;
          border-color: #252a34 !important;
          box-shadow: none !important;
          -webkit-backdrop-filter: none !important;
          backdrop-filter: none !important;
        }
        /* Navegação fixa e superfícies de menu. */
        nav[style*="position: fixed"] {
          background: rgba(12, 14, 19, .96) !important;
          border-color: #252a34 !important;
          box-shadow: none !important;
          -webkit-backdrop-filter: blur(16px);
          backdrop-filter: blur(16px);
        }
        button, a, [role="button"] {
          -webkit-tap-highlight-color: transparent;
          transition: background-color .16s ease, border-color .16s ease, color .16s ease, box-shadow .16s ease !important;
        }
        button:focus-visible, a:focus-visible, [role="button"]:focus-visible {
          outline: 2px solid rgba(197, 178, 255, .78) !important;
          outline-offset: 3px;
        }
        input, select, textarea {
          background: #11141a !important;
          border: 1px solid #2a303b !important;
          color: #f1f2f5 !important;
          border-radius: 5px !important;
          font-family: inherit !important;
        }
        input::placeholder, textarea::placeholder { color: #858d9b !important; }
        input:focus, select:focus, textarea:focus {
          outline: 1px solid rgba(197, 178, 255, .55) !important;
          outline-offset: 1px;
          border-color: rgba(197, 178, 255, .65) !important;
        }
        /* Destaques pastel anteriores passam ao lilás suave da referência. */
        button[style*="#C7A9EF"], button[style*="#c7a9ef"],
        button[style*="#B99AE7"], button[style*="#b99ae7"] {
          background: #c5b2ff !important;
          color: #111218 !important;
        }
        ::selection { background: rgba(197, 178, 255, .30); color: #fff; }
        @media (max-width: 639px) {
          input, select, textarea { font-size: 16px !important; }
          body { overflow-x: hidden; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; }
        }

        /* Sessão de Hoje: painel transparente, sem o fundo global aplicado a todos os aside.
           Mobile: largura integral e conteúdo centralizado para não cortar o calendário/textos. */
        aside.caveira-sessao-hoje {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        aside.caveira-sessao-hoje > section {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
        }
        @media (max-width: 899px) {
          aside.caveira-sessao-hoje {
            width: 100% !important;
            max-width: none !important;
            margin-left: auto !important;
            margin-right: auto !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            align-items: stretch !important;
            gap: 24px !important;
            background: transparent !important;
            border: none !important;
          }
          aside.caveira-sessao-hoje > section {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          aside.caveira-sessao-hoje > section:first-child {
            align-items: center !important;
          }
          aside.caveira-sessao-hoje > section:first-child > div:first-child {
            text-align: center !important;
          }
          aside.caveira-sessao-hoje > section:last-child {
            width: 100% !important;
          }
          aside.caveira-sessao-hoje > section:last-child > div:nth-child(2),
          aside.caveira-sessao-hoje > section:last-child > div:nth-child(3) {
            width: 100% !important;
            grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
          }
          aside.caveira-sessao-hoje > section:last-child > button {
            align-self: flex-start !important;
          }
        }

        /* Correção de uniformidade: aplica a paleta escura também ao conteúdo
           que ainda possuía fundos inline herdados do tema anterior. */
        div[style*="linear-gradient(145deg"] {
          background: #090a0e !important;
        }
        div[style*="rgba(44,67,96"],
        div[style*="rgba(44, 67, 96"],
        div[style*="rgba(38,54,75"],
        div[style*="rgba(38, 54, 75"],
        /* Superfícies do dashboard: ficam integradas ao fundo, com transparência e sem caixas pesadas. */
        div[style*="rgba(34,50,73"],
        div[style*="rgba(34, 50, 73"],
        div[style*="rgba(27,41,60"],
        div[style*="rgba(27, 41, 60"],
        div[style*="rgba(49, 43, 63"],
        div[style*="rgba(35, 32, 46"],
        div[style*="rgba(31, 29, 42"],
        div[style*="rgba(38, 54, 75"],
        div[style*="rgba(25, 24, 33"],
        div[style*="rgba(29, 27, 38"] {
          background: rgba(13, 15, 21, .22) !important;
          border-color: rgba(190, 170, 225, .10) !important;
          box-shadow: 0 5px 18px rgba(0, 0, 0, .07) !important;
          -webkit-backdrop-filter: blur(10px) !important;
          backdrop-filter: blur(10px) !important;
        }
        /* Cards sem conteúdo de ação: reduzir presença, preservar espaço e leitura. */
        div[style*="borderRadius"][style*="background: rgba(49, 43, 63"],
        div[style*="border-radius"][style*="background: rgba(49, 43, 63"] {
          background: rgba(15, 17, 23, .18) !important;
          border: 1px solid rgba(190, 170, 225, .08) !important;
        }
        /* Listas e blocos informativos ganham acabamento leve; não altera controles. */
        section[style*="background: rgba(49, 43, 63"],
        section[style*="background: rgba(35, 32, 46"],
        article[style*="background: rgba(49, 43, 63"],
        article[style*="background: rgba(35, 32, 46"] {
          background: rgba(13, 15, 21, .20) !important;
          border-color: rgba(190, 170, 225, .10) !important;
          box-shadow: 0 5px 18px rgba(0, 0, 0, .07) !important;
          backdrop-filter: blur(10px) !important;
        }
        /* Padronização global das páginas do menu: superfícies viram camadas leves,
           mantendo ações, campos, estados coloridos e componentes de navegação intactos. */
        div[style*="linear-gradient(145deg, #17161F"],
        div[style*="linear-gradient(145deg, #1D1B27"],
        div[style*="linear-gradient(145deg, #11141a"],
        div[style*="background: rgba(29, 27, 39, 0.72)"],
        div[style*="background: rgba(49, 43, 63, 0.78)"],
        div[style*="background: rgba(49, 43, 63, 0.58)"],
        div[style*="background: rgba(35, 32, 46, 0.76)"],
        div[style*="background: rgba(31, 29, 42, 0.91)"],
        div[style*="background: rgba(28, 27, 34, 0.88)"],
        div[style*="background: rgba(24, 23, 31, .97)"],
        div[style*="background: rgba(17,20,26,.94)"],
        div[style*="background: rgba(17,20,26,.92)"],
        div[style*="background: rgba(13, 15, 21, 0.72)"],
        div[style*="background: rgba(20,22,28,.38)"],
        div[style*="background: rgba(19, 35, 55, .58)"],
        div[style*="background: rgba(44,67,96,.48)"],
        div[style*="background: rgba(44,67,96,.46)"],
        div[style*="background: rgba(44,67,96,.42)"],
        div[style*="background: rgba(38,54,75, .48)"],
        div[style*="background: rgba(38,54,75,.48)"] {
          background: rgba(13, 15, 21, .20) !important;
          border-color: rgba(190, 170, 225, .10) !important;
          box-shadow: 0 5px 18px rgba(0, 0, 0, .06) !important;
          -webkit-backdrop-filter: blur(10px) !important;
          backdrop-filter: blur(10px) !important;
        }
        /* Cabeçalhos das demais páginas adotam a mesma apresentação aberta do Montar Treinos. */
        header > div:first-child > div:first-child {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          border-radius: 0 !important;
        }
        /* Contêineres informativos com bordas muito marcadas ficam discretos. */
        div[style*="border: 1px solid rgba(190, 170, 225, 0.14)"],
        div[style*="border: 1px solid rgba(190, 170, 225, 0.19)"] {
          border-color: rgba(190, 170, 225, .10) !important;
        }
        /* Blocos "próxima sessão" e assinatura Caveira no rodapé do painel lateral. */
        .caveira-proxima-sessao {
          border-top: 1px solid rgba(148, 163, 184, .16);
          border-bottom: 1px solid rgba(148, 163, 184, .16);
          padding: 22px 0;
          margin-top: 8px;
        }
        .caveira-assinatura-painel {
          position: relative;
          overflow: hidden;
          min-height: 120px;
          padding-top: 18px;
          background: transparent !important;

        }
        .caveira-assinatura-painel img {
          opacity: .34;
          filter: grayscale(.18);
        }
        .caveira-assinatura-painel > * {
          position: relative;
          z-index: 1;
        }
        @media (max-width: 899px) {
          .caveira-proxima-sessao {
            width: 100%;
            box-sizing: border-box;
            margin-top: 6px;
            padding: 20px 0;
          }
          .caveira-assinatura-painel {
            min-height: 120px;
            margin-left: -2px;
            margin-right: -2px;
            padding-top: 22px;
            background: transparent !important;
          }
        }
        /* Mantém a barra de status legível, sem reintroduzir o fundo azulado. */
        div[role="status"] {
          background: rgba(16, 18, 24, .96) !important;
          border-color: #252a34 !important;
          color: #d9dce4 !important;
        }
      `}</style>
      <div role="status" aria-live="polite" title={statusOffline} style={{ position: "fixed", top: 10, right: 12, zIndex: 80, display: "flex", alignItems: "center", gap: 7, padding: "6px 10px", borderRadius: 999, border: `1px solid ${estaOnline ? "rgba(96,165,250,.22)" : "rgba(251,191,36,.34)"}`, background: estaOnline ? "rgba(27,41,60,.84)" : "rgba(120,75,20,.9)", color: estaOnline ? "#E4D8F7" : "#F1DCA8", fontSize: 10, fontWeight: 700, backdropFilter: "blur(12px)", pointerEvents: "none" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: estaOnline ? "#B99AE7" : "#E9C987" }} />
        {estaOnline ? (statusDadosNuvem.includes("pendente") || statusDadosNuvem.includes("aguardando") || statusDadosNuvem.includes("localmente") ? textoUi("Sincronização pendente", "Sync pending") : statusDadosNuvem.includes("Sincronizando") ? textoUi("Sincronizando...", "Syncing...") : textoUi("Sincronizado", "Synced")) : textoUi("Offline • salvo neste dispositivo", "Offline • saved on this device")}
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
      {/* Sidebar compacta no desktop — mantém acesso rápido e animações do app */}
      {!menuAberto && ehDesktop && (
        <aside
          aria-label="Navegação compacta"
          style={{
            position: "fixed", left: 0, top: 0, bottom: 0,
            width: `${larguraColunaFechada}px`, zIndex: 40,
            background: "linear-gradient(145deg, #11141a 0%, #101218 52%, #11141a 100%)",
            borderRight: "1px solid rgba(190,170,225,.14)",
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "18px 0 16px", boxSizing: "border-box",
          }}
        >
          <button type="button" onClick={() => setMenuAberto(true)} title="Expandir menu" aria-label="Expandir menu"
            style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", marginBottom: 24 }}>
            {renderLogo(34)}
          </button>
          {/* Faixa estreita do efeito ondulado na borda direita da sidebar compacta. */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute", top: 0, right: 0, bottom: 0,
              width: 18, overflow: "hidden", pointerEvents: "none",
              opacity: 0.42,
              borderRight: "1px solid rgba(197,178,255,.22)",
              WebkitMaskImage: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,.28) 22%, #000 100%)",
              maskImage: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,.28) 22%, #000 100%)",
            }}
          >
            <div style={{ position: "absolute", top: 0, right: -12, bottom: 0, width: 42, opacity: 0.7 }}>
              <EfeitoRelevoPastel modo="aberto" />
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ width: 42, borderTop: "1px solid rgba(148,163,184,.16)", marginBottom: 18 }} />
          <button type="button" onClick={() => setMenuAberto(true)} title={`${authSession.user.user_metadata?.nome || "Usuário"} — ${authSession.user.email}`}
            aria-label="Abrir perfil e menu"
            style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#d8a9ed,#a7b9ff)", border: 0, color: "#17141d", fontWeight: 800, cursor: "pointer", marginBottom: 14 }}>
            {perfilFoto ? <img src={perfilFoto} alt="Foto de perfil" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : (authSession.user.user_metadata?.nome || authSession.user.email || "U").slice(0, 1).toUpperCase()}
          </button>
          <button type="button" onClick={sairDaConta} title="Sair" aria-label="Sair da conta"
            style={{ border: 0, background: "transparent", color: "#89909c", cursor: "pointer", padding: 8 }}>
            {renderIconeMenu("sair", 18)}
          </button>
        </aside>
      )}

      {!menuAberto && !ehDesktop && (
        <button
          type="button"
          onClick={() => setMenuAberto(true)}
          title="Abrir menu"
          aria-label="Abrir menu"
          style={{
            position: "fixed", top: 10, left: 12, zIndex: 45,
            width: 38, height: 38, display: "grid", placeItems: "center",
            borderRadius: 10, border: "1px solid rgba(190,170,225,.2)",
            background: "rgba(17,20,26,.92)", color: "#d9dce4",
            cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,.24)",
            backdropFilter: "blur(12px)",
          }}
        >
          {renderIconeMenu("pontos", 20)}
        </button>
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
              maxWidth: "min(100vw, 280px)",
              height: "100dvh",
              background: "linear-gradient(145deg, #11141a 0%, #101218 52%, #11141a 100%)",
              borderRight: "1px solid rgba(190, 170, 225, 0.14)",
              padding: "18px 14px 16px",
              boxShadow: "18px 0 48px rgba(0,0,0,0.32)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflow: "hidden",
              pointerEvents: "auto",
              boxSizing: "border-box",
            }}
          >
            <EfeitoRelevoPastel modo="aberto" />

            <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: "14px", flex: 1, minHeight: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {renderLogo(28)}
                  <span style={{ fontWeight: 750, letterSpacing: "-0.02em", fontSize: "15px" }}>Caveira App</span>
                </div>

                <button
                  onClick={() => setMenuAberto(false)}
                  aria-label="Fechar menu"
                  style={{
                    background: "rgba(17,20,26,.94)",
                    border: "1px solid rgba(197,178,255,.55)",
                    borderRadius: "7px",
                    color: "#aeb5c2",
                    width: "36px",
                    height: "36px",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {renderIconeMenu("painel", 16)}
                </button>
              </div>

              <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: "4px", flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 2, scrollbarWidth: "thin", scrollbarColor: "rgba(148,163,184,.22) transparent" }}>
                <span style={rotuloSecaoMenu}>{textoUi("ROTINA", "ROUTINE")}</span>
                <button type="button" onClick={() => abrirPagina("alimentacao")} style={estiloMenuAtivo("alimentacao", abaAtiva)}>{renderIconeMenu("alimentacao", 17)}<span>{textoUi("Alimentação & Rotina", "Nutrition & Routine")}</span></button>
                <button type="button" onClick={() => abrirPagina("suplementos")} style={estiloMenuAtivo("suplementos", abaAtiva)}>{renderIconeMenu("suplementos", 17)}<span>{textoUi("Suplementos", "Supplements")}</span></button>
                <button type="button" onClick={() => abrirPagina("mochila")} style={estiloMenuAtivo("mochila", abaAtiva)}>{renderIconeMenu("mochila", 17)}<span>{textoUi("Mochila & Ritmo", "Gear & Pace")}</span></button>

                <div style={{ height: 1, background: "rgba(148,163,184,.14)", margin: "10px 2px 8px", flexShrink: 0 }} />
                <span style={rotuloSecaoMenu}>{textoUi("TREINO & DESEMPENHO", "TRAINING & PERFORMANCE")}</span>
                <button type="button" onClick={() => abrirPagina("cards")} style={estiloMenuAtivo("cards", abaAtiva)}>{renderIconeMenu("biblioteca", 17)}<span>{textoUi("Cards de Exercícios", "Exercise Cards")}</span></button>
                <button type="button" onClick={() => abrirPagina("exercicios")} style={estiloMenuAtivo("exercicios", abaAtiva)}>{renderIconeMenu("biblioteca", 17)}<span>{textoUi("Biblioteca de Exercícios", "Exercise Library")}</span></button>
                <button type="button" onClick={() => abrirPagina("desempenho")} style={estiloMenuAtivo("desempenho", abaAtiva)}>{renderIconeMenu("desempenho", 17)}<span>{textoUi("Central de Desempenho", "Performance Center")}</span></button>
                <button type="button" onClick={() => abrirPagina("relatorios")} style={estiloMenuAtivo("relatorios", abaAtiva)}>{renderIconeMenu("relatorios", 17)}<span>{textoUi("Relatórios", "Reports")}</span></button>
                <button type="button" onClick={() => abrirPagina("conquistas")} style={estiloMenuAtivo("conquistas", abaAtiva)}>{renderIconeMenu("conquistas", 17)}<span>{textoUi("Conquistas", "Achievements")}</span></button>
                <button type="button" onClick={() => { setMenuAberto(false); setModoFocoLimpo(true); }} style={btnMenu}>{renderIconeMenu("foco", 17)}<span>{textoUi("Modo Foco", "Focus Mode")}</span></button>

                <div style={{ height: 1, background: "rgba(148,163,184,.14)", margin: "10px 2px 8px", flexShrink: 0 }} />
                <span style={rotuloSecaoMenu}>{textoUi("SISTEMA", "SYSTEM")}</span>
                <button type="button" onClick={abrirBackupMenu} style={btnMenu}>{renderIconeMenu("backup", 17)}<span>{textoUi("Backup & Dados", "Backup & Data")}</span></button>
                <button type="button" onClick={() => abrirPagina("configuracoes")} style={estiloMenuAtivo("configuracoes", abaAtiva)}>{renderIconeMenu("configuracoes", 17)}<span>{textoUi("Configurações", "Settings")}</span></button>
              </div>
            </div>

            <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: "9px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 8px", background: "transparent", borderTop: "1px solid rgba(190, 170, 225, 0.14)", borderRadius: 0, minWidth: 0, paddingTop: "16px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0, overflow: "hidden", display: "grid", placeItems: "center", background: "#342B46", border: "1px solid #74618F", color: "#DCCCF5", fontWeight: 800, fontSize: "13px" }}>{perfilFoto ? <img src={perfilFoto} alt="Foto de perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (authSession.user.user_metadata?.nome || authSession.user.email || "U").slice(0, 1).toUpperCase()}</div>
                <div style={{ minWidth: 0, flex: 1 }}><div style={{ color: "#F1EEF7", fontSize: "12px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{authSession.user.user_metadata?.nome || "Usuário"}</div><div style={{ color: "#BEB7CA", fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{authSession.user.email}</div></div>
                <button type="button" onClick={sairDaConta} title="Sair da conta" aria-label="Sair da conta" style={{ border: 0, background: "transparent", color: "#89909c", cursor: "pointer", display: "grid", placeItems: "center", padding: 8 }}>{renderIconeMenu("sair", 18)}</button>
              </div>
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
          borderBottom: "1px solid rgba(190, 170, 225, 0.14)",
          marginBottom: "18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
          {abaAtiva !== "hoje" && <button type="button" onClick={voltarPaginaAnterior} aria-label={textoUi("Voltar página anterior", "Go back")} title={textoUi("Voltar", "Back")} style={{ marginTop: 2, flex: "none", width: 30, height: 30, display: "grid", placeItems: "center", border: "1px solid rgba(190,170,225,.14)", borderRadius: 8, background: "rgba(35,32,46,.28)", color: "#BEB7CA", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>‹</button>}
          <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: abaAtiva === "montar" ? "0" : "4px 10px",
              borderRadius: "8px",
              background: abaAtiva === "montar" ? "transparent" : "rgba(49, 43, 63, 0.58)",
              border: abaAtiva === "montar" ? "none" : "1px solid rgba(190, 170, 225, 0.14)",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "10px", letterSpacing: "0.14em", color: "#BEB7CA" }}>
              {abaAtiva === "montar" ? "SUA ROTINA, DO SEU JEITO" : "CAVEIRA • UM DIA DE CADA VEZ"}
            </span>
          </div>

          <h1
            style={{
              fontSize: abaAtiva === "montar" ? (ehDesktop ? "46px" : "32px") : (ehDesktop ? "32px" : "26px"),
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            {abaAtiva === "hoje" && (
              <>
                {textoUi("Treino de hoje", "Today’s workout")}<span style={{ color: "#C7A9EF" }}>.</span>
              </>
            )}
            {abaAtiva === "montar" && textoUi("Montar treinos.", "Build workouts.")}
            {abaAtiva === "dashboard" && "Dashboard."}
            {abaAtiva === "timer" && "Timer."}
            {abaAtiva === "suplementos" && textoUi("Suplementos.", "Supplements.")}
            {abaAtiva === "alimentacao" && textoUi("Alimentação & Rotina.", "Nutrition & Routine.")}
            {abaAtiva === "mochila" && textoUi("Mochila & Ritmo.", "Pack & Pace.")}
            {abaAtiva === "desempenho" && textoUi("Central de Desempenho.", "Performance Center.")}
            {abaAtiva === "exercicios" && textoUi("Biblioteca de Exercícios.", "Exercise Library.")}
            {abaAtiva === "cards" && textoUi("Cards de Exercícios.", "Exercise Cards.")}
            {abaAtiva === "conquistas" && textoUi("Conquistas.", "Achievements.")}
            {abaAtiva === "relatorios" && textoUi("Relatórios.", "Reports.")}
            {abaAtiva === "configuracoes" && textoUi("Configurações.", "Settings.")}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "#9E96AD" }}>
              {abaAtiva === "montar"
                ? "Uma semana bem planejada começa aqui."
                : abaAtiva === "configuracoes" ? textoUi("Gerencie seu perfil e as opções de segurança do aplicativo.", "Manage your profile and app security options.") : abaAtiva === "cards" ? "Seus exercícios guardados para montar e atualizar os treinos." : `${infoDia?.nome}, ${diaSel} de ${MESES_CURTOS[(mesSel || 1) - 1]?.toLowerCase()}${focoDiasPorChave[chaveDia] ? ` • Foco: ${focoDiasPorChave[chaveDia]}` : ""}`}
            </span>
            {abaAtiva === "hoje" && dataSelecionada !== hojeISO && (
              <button
                type="button"
                onClick={() => setDataSelecionada(hojeISO)}
                style={{
                  background: "rgba(49, 43, 63, 0.78)",
                  border: "1px solid rgba(190, 170, 225, 0.19)",
                  borderRadius: "6px",
                  color: "#DCCCF5",
                  fontSize: "11px",
                  padding: "2px 8px",
                  cursor: "pointer",
                }}
              >
                {textoUi("Voltar para hoje", "Back to today")}
              </button>
            )}
          </div>
          </div>
        </div>

        {abaAtiva === "montar" ? (
          <div style={{ flexShrink: 0, color: "#9E96AD", marginTop: "14px" }} aria-hidden="true">
            <svg width={ehDesktop ? "52" : "40"} height={ehDesktop ? "52" : "40"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6.5 6.5 11 11M3 8.5l5-5M16 21l5-5M2 11l3-3M19 16l3-3M7 2l3 3M14 19l3 3" />
              <rect x="2" y="7" width="5" height="3" rx="1" transform="rotate(-45 2 7)" />
              <rect x="17" y="14" width="5" height="3" rx="1" transform="rotate(-45 17 14)" />
            </svg>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {renderLogo(ehDesktop ? 44 : 38)}
            <div style={{ textAlign: "right", paddingLeft: "12px", borderLeft: "1px solid rgba(190, 170, 225, 0.14)", lineHeight: 1.1 }}>
              <div style={{ fontSize: "10px", color: "#9E96AD", letterSpacing: "0.08em" }}>{MESES_CURTOS[(mesSel || 1) - 1]}</div>
              <div style={{ fontSize: ehDesktop ? "26px" : "22px", fontWeight: 800, marginTop: "2px" }}>{diaSel}</div>
              <div style={{ fontSize: "10px", color: "#9E96AD", marginTop: "2px" }}>{anoSel}</div>
            </div>
          </div>
        )}
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
            border: "1px solid #C7A9EF",
            marginBottom: "14px",
            fontSize: "12px",
          }}
        >
          <span>
            <strong>Tempo esgotado!</strong> {textoUi('Descanso concluído.', 'Rest completed.')}
          </span>
          <button
            type="button"
            onClick={pararSomAlarme}
            style={{
              padding: "5px 10px",
              borderRadius: "7px",
              border: "none",
              background: "#C7A9EF",
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

      {resetModalAberto && (
        <div role="presentation" onClick={() => { if (!resetProcessando) { setResetModalAberto(false); setResetSenha(""); setResetErro(""); } }} style={{ position: "fixed", inset: 0, zIndex: 12000, background: "rgba(4,6,10,.76)", display: "grid", placeItems: "center", padding: 16, backdropFilter: "blur(8px)" }}>
          <section role="dialog" aria-modal="true" aria-labelledby="titulo-reset" onClick={(e) => e.stopPropagation()} style={{ width: "min(440px, 100%)", background: "#15171e", border: "1px solid rgba(241,168,184,.28)", borderRadius: 16, padding: 20, boxSizing: "border-box", boxShadow: "0 24px 70px rgba(0,0,0,.5)", display: "grid", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(241,168,184,.1)", display: "grid", placeItems: "center", color: "#F1A8B8" }}>{renderIconeMenu("configuracoes", 20)}</div>
              <h2 id="titulo-reset" style={{ margin: 0, fontSize: 17 }}>Confirmar reset completo</h2>
            </div>
            <p style={{ margin: 0, color: "#BEB7CA", fontSize: 12, lineHeight: 1.6 }}>Todos os dados do app serão apagados e o Dashboard voltará ao zero. A conta, login e foto de perfil serão mantidos. Esta ação não pode ser desfeita.</p>
            <label style={{ fontSize: 12, color: "#DCCCF5", display: "grid", gap: 6 }}>Senha da sua conta
              <input type="password" autoComplete="current-password" value={resetSenha} onChange={(e) => setResetSenha(e.target.value)} placeholder="Digite sua senha para autorizar" style={{ ...campoTexto, fontSize: 16, padding: "12px" }} />
            </label>
            {resetErro && <div role="alert" style={{ padding: 9, borderRadius: 8, background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.2)", color: "#F4B8C2", fontSize: 11 }}>{resetErro}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button type="button" disabled={resetProcessando} onClick={() => { setResetModalAberto(false); setResetSenha(""); setResetErro(""); }} style={{ ...btnSecundario, flex: "none", padding: "9px 12px" }}>{textoUi('Cancelar', 'Cancel')}</button>
              <button type="button" disabled={resetProcessando || !resetSenha || !estaOnline} onClick={confirmarResetComSenha} style={{ ...btnSecundario, flex: "none", padding: "9px 12px", background: "rgba(139,42,59,.4)", borderColor: "rgba(241,168,184,.3)", color: "#F1A8B8", opacity: resetProcessando || !resetSenha || !estaOnline ? .55 : 1 }}>{resetProcessando ? "Validando…" : "Confirmar e apagar tudo"}</button>
            </div>
          </section>
        </div>
      )}

      {/* Mini-timer flutuante de descanso: permanece independente da navegação entre páginas. */}
      {miniDescansoAberto && (
        <div
          role="dialog"
          aria-label={`Timer de descanso: ${miniDescansoExercicio}`}
          style={{
            position: "fixed",
            left: "50%",
            bottom: "20px",
            transform: "translateX(-50%)",
            width: "min(280px, calc(100vw - 24px))",
            zIndex: 10050,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 16px",
            borderRadius: "12px",
            background: "rgba(24, 23, 31, .97)",
            border: "1px solid rgba(199, 169, 239, .75)",
            boxShadow: "0 18px 48px rgba(0, 0, 0, .45)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          }}
        >
          <div style={{ color: "#C7A9EF", flexShrink: 0, display: "grid", placeItems: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: "9px", color: "#9E96AD", textTransform: "uppercase", letterSpacing: ".04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              DESCANSO · {miniDescansoExercicio}
            </div>
            <div style={{ fontSize: "26px", lineHeight: 1.1, fontWeight: 800, letterSpacing: "-.02em", color: "#F1EEF7", fontVariantNumeric: "tabular-nums", marginTop: "4px" }}>
              {formatarDuracao(timerRestante)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              pararSomAlarme();
              setTimerRodando((rodando) => !rodando && timerRestante > 0);
            }}
            aria-label={timerRodando ? "Pausar descanso" : "Continuar descanso"}
            title={timerRodando ? "Pausar" : "Continuar"}
            style={{ background: "transparent", border: "none", color: "#F1EEF7", padding: "5px", cursor: "pointer", flexShrink: 0 }}
          >
            {timerRodando ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 5v14M16 5v14" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 5 12 7-12 7z" /></svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              pararSomAlarme();
              setTimerRestante(miniDescansoDuracao);
              setTimerRodando(true);
            }}
            aria-label="Reiniciar descanso"
            title="Reiniciar"
            style={{ background: "transparent", border: "none", color: "#F1EEF7", padding: "5px", cursor: "pointer", flexShrink: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 2.6-6.35L3 8" /><path d="M3 3v5h5" /></svg>
          </button>
          <button
            type="button"
            onClick={() => setMiniDescansoAberto(false)}
            aria-label="Fechar mini-timer"
            title="Fechar (o timer continua rodando)"
            style={{ background: "transparent", border: "none", color: "#F1EEF7", padding: "5px", cursor: "pointer", flexShrink: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>
      )}

      {/* PÁGINA 1: HOJE (focada em treino, tempo, água e observação) */}
      {abaAtiva === "hoje" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative", paddingRight: ehDesktopPainel ? "min(294px, 31vw)" : "0px" }}>
          {/* Painel lateral da sessão e semana: adicionado sem remover o calendário original. */}
          {(
            <aside className="caveira-sessao-hoje" style={{ position: ehDesktopPainel ? "absolute" : "relative", top: ehDesktopPainel ? "0px" : "auto", right: ehDesktopPainel ? "0px" : "auto", width: ehDesktopPainel ? "270px" : "100%", maxWidth: ehDesktopPainel ? "none" : "none", minWidth: "0", minHeight: ehDesktopPainel ? "520px" : "0px", alignSelf: "center", boxSizing: "border-box", borderLeft: ehDesktopPainel ? "1px solid rgba(148,163,184,.12)" : "none", paddingLeft: ehDesktopPainel ? "24px" : "0px", paddingRight: ehDesktopPainel ? "0px" : "0px", margin: ehDesktopPainel ? "0px" : "0px auto 8px", color: "#9AA1AE", display: "flex", flexDirection: "column", gap: "24px", background: "transparent", backdropFilter: "none", WebkitBackdropFilter: "none", overflow: "visible" }}>
              <section style={{ display: "flex", width: "100%", minWidth: "0", boxSizing: "border-box", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <div style={{ alignSelf: "stretch", textAlign: ehDesktopPainel ? "left" : "center", fontSize: "10px", fontWeight: 700, color: "#9AA1AE", letterSpacing: ".04em" }}>{textoUi('SESSÃO DE HOJE', 'TODAY’S SESSION')}</div>
                <div style={{ position: "relative", width: "136px", height: "136px", flexShrink: 0, margin: "20px auto 8px", alignSelf: "center" }}>
                  <svg width="136" height="136" viewBox="0 0 136 136" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="68" cy="68" r="65" fill="none" stroke="#242833" strokeWidth="4" />
                    <circle cx="68" cy="68" r="65" fill="none" stroke="#C7A9EF" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(concluidosHoje / Math.max(1, exercicios.length)) * 408.4} 408.4`} style={{ transition: "stroke-dasharray .65s ease" }} />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                    <div style={{ color: "#E6E8ED", fontSize: "44px", fontWeight: 750, lineHeight: 1 }}>{concluidosHoje}<span style={{ color: "#9AA1AE", fontSize: "20px" }}>/{exercicios.length}</span></div>
                    <span style={{ fontSize: "10px", color: "#9AA1AE" }}>{textoUi('concluídos', 'completed')}</span>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", width: "100%", textAlign: "center", borderBottom: "1px solid rgba(148,163,184,.16)", paddingBottom: "22px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "7px", borderRight: "1px solid rgba(148,163,184,.16)" }}><strong style={{ color: "#E6E8ED", fontSize: "18px" }}>{totalSeriesTreino}</strong><span style={{ fontSize: "10px" }}>{textoUi('séries', 'sets')}</span></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}><strong style={{ color: "#E6E8ED", fontSize: "18px" }}>{Math.max(0, Math.ceil(estimativaSessaoSeg / 60))}<small style={{ fontSize: "10px", fontWeight: 500 }}> min</small></strong><span style={{ fontSize: "10px" }}>estimativa</span></div>
                </div>
              </section>
              <section style={{ display: "flex", width: "100%", minWidth: "0", boxSizing: "border-box", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><strong style={{ color: "#E6E8ED", fontSize: "13px" }}>Sua semana</strong><span style={{ color: "#C7A9EF", fontSize: "14px" }}>↗</span></div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: "5px" }}>
                  {janelaDias.map((d) => {
                    const treinouNoDia = dashboardData.datasConcluidasSet.has(d.dataISO);
                    const selecionada = d.dataISO === dataSelecionada;
                    return (
                      <button key={`semana-lateral-${d.dataISO}`} type="button" disabled={d.dataISO > hojeISO} onClick={() => { if (d.dataISO > hojeISO) return; setCronometroRodando(false); setDataSelecionada(d.dataISO); }} title={d.dataISO} style={{ minWidth: 0, height: "28px", borderRadius: "4px", border: treinouNoDia ? "1px solid rgba(199,169,239,.3)" : "1px solid rgba(148,163,184,.12)", background: treinouNoDia ? "#C7A9EF" : selecionada ? "rgba(199,169,239,.08)" : "rgba(20,22,29,.72)", color: treinouNoDia ? "#17131F" : "#9AA1AE", fontSize: "10px", cursor: d.dataISO > hojeISO ? "not-allowed" : "pointer", opacity: d.dataISO > hojeISO ? .25 : 1, display: "grid", placeItems: "center" }}>{treinouNoDia ? "✓" : d.numeroDia}</button>
                    );
                  })}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: "5px", textAlign: "center", fontSize: "9px", color: "#717987" }}>{janelaDias.map((d) => <span key={`letra-lateral-${d.dataISO}`}>{d.letra}</span>)}</div>
                <button type="button" onClick={() => abrirPagina("dashboard")} style={{ border: "none", background: "transparent", padding: "0", alignSelf: "flex-start", color: "#C7A9EF", fontSize: "10px", fontWeight: 650, cursor: "pointer" }}>Ver meu progresso ↗</button>
              </section>
              <section className="caveira-proxima-sessao" aria-label="Próxima sessão" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "#9299A6", fontSize: "10px", fontWeight: 750, letterSpacing: ".04em", marginBottom: "10px" }}>{textoUi('PRÓXIMA SESSÃO', 'NEXT SESSION')}</div>
                    <strong style={{ color: "#E6E8ED", fontSize: "14px", fontWeight: 700 }}>{proximaSessaoInfo?.nomeDia || "Descanso"}</strong>
                  </div>
                  <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#9AA1AE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <path d="m6.5 6.5 11 11M4 8l4-4 2 2-4 4zM14 18l4-4 2 2-4 4zM8 14l-3 3a2 2 0 0 0 3 3l3-3M16 10l3-3a2 2 0 0 0-3-3l-3 3" />
                  </svg>
                </div>
                <div style={{ color: "#9299A6", fontSize: "10px", display: "flex", flexWrap: "wrap", gap: "7px" }}>
                  {proximaSessaoInfo ? `${proximaSessaoInfo.exercicios} exercício${proximaSessaoInfo.exercicios === 1 ? "" : "s"} · ${proximaSessaoInfo.series} séries · ${proximaSessaoInfo.repeticoes} repetições` : "Nenhum treino programado para os próximos 7 dias"}
                  {proximaSessaoInfo && <span>· {proximaSessaoInfo.dataISO.slice(8, 10)}/{proximaSessaoInfo.dataISO.slice(5, 7)}</span>}
                </div>
              </section>
              <div className="caveira-assinatura-painel" aria-label="Caveira — Força na constância">
                <img src="/LogoCaveira.png" alt="Caveira" onError={(e) => { e.currentTarget.style.display = "none"; }} style={{ width: "40px", height: "40px", objectFit: "contain", display: "block", marginBottom: "12px" }} />
                <div style={{ color: "#9299A6", fontSize: "18px", fontWeight: 500, letterSpacing: ".04em", marginBottom: "5px" }}>CAVEIRA</div>
                <div style={{ color: "#727A88", fontSize: "9px", letterSpacing: ".08em", fontWeight: 650 }}>{textoUi('FORÇA NA CONSTÂNCIA.', 'STRENGTH THROUGH CONSISTENCY.')}</div>
              </div>
            </aside>
          )}
          <div
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "space-between",
              gap: ehDesktop ? "24px" : "10px",
              paddingBottom: "16px",
              borderBottom: "1px solid rgba(190, 170, 225, 0.14)",
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
                  fill={dashboardData.foguinhoAtivo ? "#E5A17E" : "none"}
                  stroke={dashboardData.foguinhoAtivo ? "#E9B18D" : "#52525b"}
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
                    color: dashboardData.foguinhoAtivo ? "#E9B18D" : "#9E96AD",
                    lineHeight: 1,
                  }}
                >
                  {dashboardData.streak}
                </span>
              </div>
              <span style={{ fontSize: "10px", fontWeight: 300, color: "#9E96AD", letterSpacing: "0.02em" }}>
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
                      color: selecionada || d.ehHoje ? "#F1EEF7" : "#9E96AD",
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
                        color: d.ehHoje ? "#F1EEF7" : "#BEB7CA",
                        lineHeight: 1.1,
                      }}
                    >
                      {d.ehHoje ? textoUi("Hoje", "Today") : letraDiaUi(d.chave, d.letra)}
                    </span>
                    <span
                      style={{
                        fontSize: ehDesktop ? "14px" : "13px",
                        fontWeight: selecionada ? 600 : 300,
                        color: selecionada ? "#DCCCF5" : "#d4d4d8",
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
                        background: treinouNoDia ? "#E9B18D" : "transparent",
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {!diaPodeEditar && (
            <div style={{ padding: "10px 12px", borderRadius: "9px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.28)", color: "#E9C987", fontSize: "12px" }}>
              {textoUi('Dia fechado para alterações. Você pode consultar os registros, mas somente a data de hoje pode ser editada.', 'This day is closed for changes. You can view records, but only today can be edited.')}
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
            {exercicios.length > 0 && (
              <button
                type="button"
                onClick={remanejarTreinoParaProximoDia}
                style={{
                  padding: "5px 10px",
                  borderRadius: "7px",
                  border: "1px solid rgba(190, 170, 225, 0.19)",
                  background: "rgba(29, 27, 39, 0.72)",
                  color: "#BEB7CA",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                {textoUi('Adiar para próximo dia', 'Move to next day')}
              </button>
            )}
          </div>

          {/* Checklist pré-treino e aquecimento removidos conforme solicitação visual/funcional. */}

          {/* Calculadora de anilhas removida da interface conforme solicitação. */}

          {/* Calendário flutuante de constância: substitui os antigos cards de programação semanal. */}
          <section aria-label="Sequência de treinos e calendário semanal" style={{ display: "flex", alignItems: "center", gap: ehDesktop ? "18px" : "9px", width: "100%", minWidth: 0, padding: "3px 0 7px", margin: "0 0 2px", background: "transparent", border: "none", boxShadow: "none", backdropFilter: "none", WebkitBackdropFilter: "none" }}>
            <div title={dashboardData.foguinhoAtivo ? `${dashboardData.streak} dia(s) consecutivo(s) de treino` : "Treine hoje para iniciar uma sequência"} style={{ width: ehDesktop ? "42px" : "34px", flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }}>
                <svg width={ehDesktop ? "20" : "18"} height={ehDesktop ? "20" : "18"} viewBox="0 0 24 24" fill={dashboardData.foguinhoAtivo ? "#F39A54" : "none"} stroke={dashboardData.foguinhoAtivo ? "#FFB36B" : "#77717F"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: dashboardData.foguinhoAtivo ? "drop-shadow(0 0 7px rgba(255,145,65,.72))" : "none", transition: "all .25s ease" }}>
                  <path d="M12 3c.5 3.4-1.8 5.6-3.5 7.4-1.5 1.6-2.5 3.2-2.5 5.3a6 6 0 0 0 12 0c0-2.5-1.3-4.3-2.6-5.8-1.1-1.3-2.1-2.5-1.9-4.5-1.3.4-1.6 1-1.6 1.6z" />
                </svg>
                <strong style={{ color: dashboardData.foguinhoAtivo ? "#F6B078" : "#A09AA8", fontSize: "13px", fontWeight: 750, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{dashboardData.streak}</strong>
              </div>
              <span style={{ color: "#85808D", fontSize: "8px", letterSpacing: ".04em" }}>Semanas</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", alignItems: "center", gap: ehDesktop ? "8px" : "2px", flex: 1, minWidth: 0 }}>
              {janelaDias.map((d) => {
                const selecionada = d.dataISO === dataSelecionada;
                const treinouNoDia = dashboardData.datasConcluidasSet.has(d.dataISO);
                const diaFuturo = d.dataISO > hojeISO;
                return <button key={`calendario-constancia-${d.dataISO}`} type="button" disabled={diaFuturo} onClick={() => { if (diaFuturo) return; setCronometroRodando(false); setDataSelecionada(d.dataISO); }} title={`${d.rotulo} ${d.numeroDia}${treinouNoDia ? " — treino concluído" : ""}`} style={{ minWidth: 0, padding: "5px 2px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "5px", border: selecionada ? "1px solid rgba(213,194,242,.24)" : "1px solid transparent", borderRadius: "10px", background: selecionada ? "rgba(255,255,255,.055)" : "transparent", color: d.ehHoje || selecionada ? "#F1EEF7" : "#AAA4B1", cursor: diaFuturo ? "default" : "pointer", opacity: diaFuturo ? .25 : 1, boxShadow: selecionada ? "0 5px 18px rgba(0,0,0,.12)" : "none", transition: "background .2s ease,border .2s ease" }}>
                  <span style={{ fontSize: ehDesktop ? "10px" : "9px", fontWeight: d.ehHoje || selecionada ? 700 : 450, lineHeight: 1.1, whiteSpace: "nowrap" }}>{d.ehHoje ? "Hoje" : letraDiaUi(d.chave, d.letra)}</span>
                  <span style={{ fontSize: ehDesktop ? "13px" : "12px", fontWeight: selecionada || treinouNoDia ? 700 : 450, lineHeight: 1.1, color: treinouNoDia ? "#F0C29E" : selecionada ? "#E5D8F5" : "#D0CBD4" }}>{d.numeroDia}</span>
                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: treinouNoDia ? "#F2A66E" : "transparent", boxShadow: treinouNoDia ? "0 0 7px rgba(242,166,110,.7)" : "none" }} />
                </button>;
              })}
            </div>
          </section>

          {/* Resumo da sessão + Puxar último treino parecido */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "10px", letterSpacing: "0.04em", color: "#9AA1AE", fontWeight: 700 }}>{textoUi("SEU TREINO", "YOUR WORKOUT")}</div>
              <div style={{ fontSize: ehDesktop ? "20px" : "18px", fontWeight: 750, marginTop: "5px", letterSpacing: "-0.025em", color: "#E6E8ED" }}>
                {exercicios.length === 0 ? "Dia de descanso" : `Treino de ${infoDia?.nome?.toLowerCase() || "hoje"}`}
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
                    color: "#DCCCF5",
                  }}
                >
                  {textoUi("Puxar último", "Load last")} ({ultimoTreinoParecido.dataISO.slice(5)})
                </button>
              )}

              <div style={{ textAlign: "right", fontSize: "12px", color: "#BEB7CA" }}>
                <div>
                  {concluidosHoje}/{exercicios.length} {textoUi("concluídos", "completed")}
                </div>
                {exercicios.length > 0 && (
                  <div style={{ fontSize: "11px", color: "#9E96AD", marginTop: "2px" }}>
                    Volume: {volumeSessaoKg.toLocaleString("pt-BR")} kg
                    {comparadorMelhorDia && (
                      <span style={{ marginLeft: "6px", color: comparadorMelhorDia.diff >= 0 ? "#9ADFC2" : "#BEB7CA" }}>
                        ({comparadorMelhorDia.diff >= 0 ? "+" : ""}
                        {comparadorMelhorDia.diff.toLocaleString("pt-BR")} vs melhor dia)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {true && (
            exercicios.length === 0 ? (
              <div style={{ ...cardClean, textAlign: "center", padding: "20px 14px", color: "#9E96AD", fontSize: "12px" }}>
                Nenhum exercício cadastrado para este dia.
                <button type="button" onClick={() => abrirPagina("montar")} style={{ ...btnSecundario, marginTop: 10 }}>Montar treino</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                {exercicios.map((ex, indiceExercicio) => {

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
                      padding: ehDesktop ? "15px 17px" : "12px 10px",
                      borderRadius: "9px",
                      background: ex.feito ? "rgba(17,19,26,.72)" : "#11131A",
                      border: `1px solid ${ex.feito ? "rgba(199,169,239,.25)" : "#252A35"}`,
                      boxSizing: "border-box",
                      width: "100%",
                      minWidth: "0",
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "10px",
                      opacity: ex.feito ? 0.82 : 1,
                    }}
                  >
                    <span style={{ color: "#9AA1AE", fontSize: "17px", fontWeight: 750, width: "32px", minWidth: "32px", flexShrink: 0, letterSpacing: "-.02em" }}>{String(indiceExercicio + 1).padStart(2, "0")}</span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        flex: "1 1 180px",
                        minWidth: "0",
                        boxSizing: "border-box",
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
                              color: "#F1EEF7",
                              fontSize: "13px",
                              fontWeight: 650,
                              cursor: "pointer",
                              textAlign: "left",
                            }}
                          >
                            {ex.nome}
                          </button>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "9px",
                            marginTop: "6px",
                            fontSize: "11px",
                            color: "#BEB7CA",
                            flexWrap: "wrap",
                            minWidth: "0",
                          }}
                        >
                          <span>{ex.seriesReps}</span>
                          <button
                            type="button"
                            onClick={() => acionarDescansoDeExercicio(ex.descanso, ex.nome)}
                            title={`Iniciar timer de descanso: ${ex.descanso} segundos`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              background: "rgba(199,169,239,.06)",
                              border: "1px solid rgba(199,169,239,.62)",
                              borderRadius: "5px",
                              color: "#AAB2C0",
                              cursor: "pointer",
                              fontSize: "11px",
                              padding: "3px 6px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                            {ex.descanso}s
                          </button>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#F1EEF7" }}>
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
                                color: "#F1EEF7",
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
                          <div style={{ fontSize: "11px", color: "#9E96AD", marginTop: "5px" }}>
                            {ultimoRegistro && (
                              <span>
                                {textoUi("Última:", "Last:")} <strong style={{ color: "#BEB7CA" }}>{ultimoRegistro.carga}kg</strong> ({ultimoRegistro.dataISO.slice(5)})
                              </span>
                            )}
                            {sugestaoSubir && (
                              <span style={{ color: "#9ADFC2", marginLeft: ultimoRegistro ? "8px" : 0 }}>
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
                          width: "34px",
                          height: "34px",
                          minWidth: "34px",
                          padding: "0",
                          borderRadius: "50%",
                          border: `1px solid ${ex.feito ? "rgba(154,223,194,.45)" : "#29303C"}`,
                          background: ex.feito ? "rgba(154,223,194,.16)" : "transparent",
                          color: ex.feito ? "#9ADFC2" : "#9AA1AE",
                          display: "grid",
                          placeItems: "center",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                        aria-label={ex.feito ? "Desmarcar exercício concluído" : "Marcar exercício como concluído"}
                        title={ex.feito ? "Exercício concluído" : "Marcar exercício"}
                      >
                        {ex.feito ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>}
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Reps reais / RIR (ex.: 10,10,9,8 • RIR 1)"
                      value={ex.esforcoNota}
                      onChange={(e) => atualizarEsforcoExercicio(ex, e.target.value)}
                      style={{
                        ...campoTexto,
                        width: "100%",
                        minWidth: "0",
                        boxSizing: "border-box",
                        padding: "6px 8px",
                        fontSize: "11px",
                        borderRadius: "6px",
                        background: "rgba(13, 15, 21, 0.72)",
                      }}
                    />

                    {histAberto && (
                      <div
                        style={{
                          paddingTop: "8px",
                          borderTop: "1px solid rgba(190, 170, 225, 0.14)",
                          fontSize: "11px",
                          color: "#BEB7CA",
                        }}
                      >
                        <div style={{ marginBottom: "4px", color: "#9E96AD" }}>{textoUi('Histórico de cargas:', 'Load history:')}</div>
                        {histEx.length === 0 ? (
                          <div>{textoUi('Sem registros anteriores para este exercício.', 'No previous records for this exercise.')}</div>
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {histEx.slice(0, 5).map((h, i) => (
                              <span
                                key={`${h.dataISO}-${i}`}
                                style={{
                                  padding: "3px 7px",
                                  borderRadius: "6px",
                                  background: "rgba(29, 27, 39, 0.72)",
                                  border: "1px solid rgba(190, 170, 225, 0.15)",
                                  color: "#EEEAF5",
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
            )
          )}

          {/* Observações do treino: anotações úteis para acompanhar a sessão e planejar ajustes. */}
          <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(49, 43, 63, 0.58)", border: "1px solid rgba(190, 170, 225, 0.14)", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", fontWeight: 650 }}>{textoUi('Observações do treino', 'Workout notes')}</span>
              <button
                type="button"
                onClick={copiarResumoDoDia}
                style={{ ...btnSecundario, flex: "none", padding: "4px 9px", fontSize: "11px" }}
              >
                Copiar resumo
              </button>
            </div>
            <div style={{ fontSize: "11px", lineHeight: 1.55, color: "#9E96AD" }}>
              Anote informações importantes desta sessão, como cargas utilizadas, dificuldades, evolução, recordes pessoais ou ajustes que deseja fazer nos próximos treinos.
            </div>
            <textarea
              rows={3}
              placeholder="Ex.: aumentei a carga no supino, senti dificuldade na última série..."
              aria-label="Observações do treino"
              value={observacoes[dataSelecionada] || ""}
              onChange={(e) => setObservacoes((prev) => ({ ...prev, [dataSelecionada]: e.target.value }))}
              style={campoTexto}
            />
            {statusResumo && (
              <div style={{ fontSize: "11px", color: "#BEB7CA", whiteSpace: "pre-wrap" }}>{statusResumo}</div>
            )}
          </div>

          {/* Controle de hidratação */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "12px",
            }}
          >
            <div style={{ padding: "14px", borderRadius: "7px", background: "#0D0F14", border: "1px solid #252A35", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "16px", fontWeight: 700, color: "#E6E8ED" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8FC7F4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3.5C9.2 7.1 6 10.2 6 14a6 6 0 0 0 12 0c0-3.8-3.2-6.9-6-10.5Z"/><path d="M4.5 10.5C3.2 12.2 2.5 13.6 2.5 15a4 4 0 0 0 4 4"/></svg>{textoUi('Água do dia', 'Daily water')}</span>
                <label style={{ fontSize: "12px", color: "#BEB7CA" }}>
                  {textoUi("Peso", "Weight")} {" "}
                  <input
                    type="number"
                    value={pesoKg}
                    onChange={(e) => setPesoKg(e.target.value)}
                    style={{
                      width: "52px",
                      background: "#11141B",
                      color: "#F1EEF7",
                      border: "1px solid #252A35",
                      borderRadius: "6px",
                      padding: "6px 8px",
                      fontSize: "12px",
                    }}
                  />{" "}
                  kg
                </label>
              </div>

              <div style={{ fontSize: "12px", color: "#BEB7CA", marginBottom: "8px", display: "flex", alignItems: "baseline", gap: "5px" }}>
                <strong style={{ fontSize: "32px", letterSpacing: "-0.04em", color: "#E6E8ED", lineHeight: 1 }}>{aguaHojeMl.toLocaleString("pt-BR")}</strong><span style={{ fontSize: "11px", color: "#9AA1AE" }}>ml</span><span style={{ marginLeft: "auto", fontSize: "11px", color: "#9AA1AE" }}>{aguaPct}% da meta</span>
              </div>

              <div style={{ height: "7px", background: "#252333", borderRadius: "999px", overflow: "hidden", marginBottom: "10px" }}>
                <div style={{ width: `${aguaPct}%`, height: "100%", background: "#C7A9EF", borderRadius: "999px", transition: "width .25s ease" }} />
              </div>

              <div style={{ fontSize: "10px", color: "#9AA1AE", marginTop: "-7px" }}>{aguaHojeMl >= metaAguaMl ? textoUi("Meta diária atingida!", "Daily goal reached!") : `${textoUi("Faltam", "Remaining")} ${(metaAguaMl - aguaHojeMl).toLocaleString("pt-BR")} ml ${textoUi("para a meta.", "to reach the goal.")}`}</div>
              <div style={{ fontSize: "10px", color: "#8D96A4", lineHeight: 1.5 }}>{textoUi("Estimativa de 35 ml/kg por dia. Necessidades variam; siga orientação profissional em caso de restrição de líquidos.", "Estimated at 35 ml/kg per day. Needs vary; follow professional guidance if you have fluid restrictions.")}</div>
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
                    background: "#11141B",
                    borderColor: "#252A35",
                    fontSize: "11px",
                    opacity: diaPodeEditar ? 1 : 0.55,
                  }}
                />
                <button
                  type="submit"
                  disabled={!diaPodeEditar || !aguaEntradaMl || Number(aguaEntradaMl) <= 0}
                  style={{ ...btnSecundario, flex: "none", padding: "9px 12px", opacity: !diaPodeEditar || !aguaEntradaMl || Number(aguaEntradaMl) <= 0 ? 0.5 : 1 }}
                >
                  ＋
                </button>
              </form>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button type="button" onClick={() => somarAgua(250)} disabled={!diaPodeEditar} style={{ ...btnSecundario, flex: 1, padding: "9px 6px", borderColor: "#252A35", background: "#0D0F14", fontSize: "11px", opacity: diaPodeEditar ? 1 : 0.5 }}>
                  ＋ 250 ml
                </button>
                <button type="button" onClick={() => somarAgua(500)} disabled={!diaPodeEditar} style={{ ...btnSecundario, flex: 1, padding: "9px 6px", borderColor: "#252A35", background: "#0D0F14", fontSize: "11px", opacity: diaPodeEditar ? 1 : 0.5 }}>
                  ＋ 500 ml
                </button>
                <button type="button" onClick={() => somarAgua(750)} disabled={!diaPodeEditar} style={{ ...btnSecundario, flex: 1, padding: "9px 6px", borderColor: "#252A35", background: "#0D0F14", fontSize: "11px", opacity: diaPodeEditar ? 1 : 0.5 }}>
                  ＋ 750 ml
                </button>
              </div>
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
            <div style={{ fontSize: "11px", color: "#9E96AD" }}>{textoUi('Cronômetro da sessão, contagem regressiva e intervalos de trabalho e descanso.', 'Session timer, countdown, and work/rest intervals.')}</div>
          </div>
          {/* Central de Tempo */}
          <div style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <div style={{ display: "inline-flex", background: "rgba(29, 27, 39, 0.72)", border: "1px solid rgba(190, 170, 225, 0.15)", borderRadius: "8px", padding: "3px", flexWrap: "wrap" }}>
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
                    background: modoTempo === "cronometro" ? "#F1EEF7" : "transparent",
                    color: modoTempo === "cronometro" ? "#111827" : "#BEB7CA",
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
                    background: modoTempo === "timer" ? "#C7A9EF" : "transparent",
                    color: modoTempo === "timer" ? "#111827" : "#BEB7CA",
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
                    background: modoTempo === "intervalo" ? "#C4A5EC" : "transparent",
                    color: modoTempo === "intervalo" ? "#111827" : "#BEB7CA",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Intervalo
                </button>
              </div>

              <div style={{ fontSize: "11px", color: "#9E96AD" }}>
                {textoUi("Ativo:", "Active:")} <strong style={{ color: "#BEB7CA" }}>{formatarDuracao(tempoAtivoSeg)}</strong> • Descanso:{" "}
                <strong style={{ color: "#BEB7CA" }}>{formatarDuracao(tempoDescansoSeg)}</strong>
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
                  <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "#9E96AD" }}>
                    {textoUi('DURAÇÃO TOTAL DA SESSÃO', 'TOTAL SESSION DURATION')}
                  </div>
                  <div
                    style={{
                      fontSize: ehDesktop ? "44px" : "36px",
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.05,
                      color: cronometroRodando ? "#DCCCF5" : "#F1EEF7",
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
                      background: cronometroRodando ? "#C7A9EF" : "#F1EEF7",
                      color: "#111827",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    {cronometroRodando ? textoUi("Pausar", "Pause") : textoUi("Iniciar", "Start")}
                  </button>
                  <button
                    type="button"
                    onClick={concluirSessaoComResumo}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "9px",
                      border: "1px solid #9ADFC2",
                      background: "rgba(34, 197, 94, 0.14)",
                      color: "#A9E8CB",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {textoUi('Concluir sessão', 'Finish session')}
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
                    <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "#9E96AD" }}>
                      CONTAGEM REGRESSIVA
                    </div>
                    <div
                      style={{
                        fontSize: ehDesktop ? "42px" : "34px",
                        fontWeight: 800,
                        color: timerRodando || alarmeTocando ? "#DCCCF5" : "#F1EEF7",
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
                        background: timerRodando ? "#E5A17E" : "#C7A9EF",
                        color: "#111827",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      {timerRodando ? textoUi("Pausar", "Pause") : textoUi("Iniciar Timer", "Start timer")}
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
                        border: "1px solid rgba(190, 170, 225, 0.19)",
                        background: "rgba(29, 27, 39, 0.72)",
                        color: "#EEEAF5",
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
                    <div style={{ fontSize: "10px", color: "#C4A5EC", letterSpacing: "0.08em" }}>
                      {intervaloFase === "trabalho" ? "FASE DE AÇÃO" : "FASE DE DESCANSO"} • RODADA{" "}
                      {intervaloRodadaAtual}/{intervaloRodadasTotal}
                    </div>
                    <div
                      style={{
                        fontSize: "34px",
                        fontWeight: 800,
                        color: intervaloFase === "trabalho" ? "#F1EEF7" : "#C4A5EC",
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
                        background: intervaloRodando ? "#E5A17E" : "#C4A5EC",
                        color: "#111827",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {intervaloRodando ? textoUi("Pausar", "Pause") : textoUi("Iniciar", "Start")}
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
                  <label style={{ fontSize: "11px", color: "#BEB7CA" }}>
                    {textoUi("Ação (s)", "Work (s)")}
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
                  <label style={{ fontSize: "11px", color: "#BEB7CA" }}>
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
                  <label style={{ fontSize: "11px", color: "#BEB7CA" }}>
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
              style={{ ...btnSecundario, background: "#A98BDD", color: "#15131C", border: 0, fontWeight: 800, padding: "10px 18px" }}
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
                <label style={rotuloCampo}>{textoUi('Dose / horário', 'Dose / time')}</label>
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
                <label style={rotuloCampo}>{textoUi('Marca / sabor / observação', 'Brand / flavor / note')}</label>
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
                    style={{ width: "44px", height: "44px", objectFit: "cover", borderRadius: "8px", border: "1px solid rgba(190, 170, 225, 0.19)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setNovoSupFoto("")}
                    style={{ background: "none", border: "none", color: "#F19AAB", fontSize: "11px", cursor: "pointer" }}
                  >
                    {textoUi('Remover foto', 'Remove photo')}
                  </button>
                </div>
              )}
            </div>

            {avisoSupFoto && <div style={{ fontSize: "11px", color: "#F19AAB" }}>{avisoSupFoto}</div>}

            <button
              type="submit"
              style={{
                padding: "9px",
                borderRadius: "8px",
                border: "none",
                background: "#F1EEF7",
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
            <div style={{ ...cardClean, textAlign: "center", color: "#9E96AD", fontSize: "13px" }}>
              {textoUi("Nenhum suplemento cadastrado ainda.", "No supplements added yet.")}
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
                        border: "1px solid rgba(190, 170, 225, 0.19)",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "76px",
                        height: "76px",
                        borderRadius: "10px",
                        background: "rgba(29, 27, 39, 0.72)",
                        border: "1px solid rgba(190, 170, 225, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        color: "#9E96AD",
                        flexShrink: 0,
                      }}
                    >
                      Sem foto
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                      <strong style={{ fontSize: "14px", color: "#F1EEF7" }}>{sup.nome}</strong>
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
                              : "rgba(190, 170, 225, 0.14)",
                          color:
                            sup.status === "Acabando"
                              ? "#E9C987"
                              : sup.status === "Ativo"
                              ? "#A9E8CB"
                              : "#BEB7CA",
                          border: "1px solid rgba(190, 170, 225, 0.19)",
                        }}
                      >
                        {sup.status}
                      </span>
                    </div>

                    {sup.dose && <div style={{ fontSize: "12px", color: "#BEB7CA" }}>{sup.dose}</div>}
                    {sup.detalhe && <div style={{ fontSize: "11px", color: "#9E96AD" }}>{sup.detalhe}</div>}

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
                              border: "1px solid rgba(190, 170, 225, 0.19)",
                              background: sup.status === st ? "rgba(190, 170, 225, 0.14)" : "#111827",
                              color: sup.status === st ? "#DCCCF5" : "#9E96AD",
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
                        style={{ background: "none", border: "none", color: "#9E96AD", fontSize: "11px", cursor: "pointer" }}
                      >
                        {textoUi('Excluir', 'Delete')}
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
          {!diaPodeEditar && <div style={{ padding: "10px 12px", borderRadius: "9px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.28)", color: "#E9C987", fontSize: "12px" }}>{textoUi('Dia fechado para alterações. Os registros podem ser consultados, mas não modificados.', 'This day is closed for changes. Records can be viewed but not modified.')}</div>}
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
                      border: "1px solid rgba(190, 170, 225, 0.19)",
                      background: ativo ? "rgba(125, 211, 252, 0.14)" : "#111827",
                      color: ativo ? "#DCCCF5" : "#BEB7CA",
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
            <span style={{ fontSize: "12px", fontWeight: 600 }}>{textoUi('Janela de treino & refeições', 'Workout & meal window')}</span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => alternarJanelaTreino("pre")}
                style={{
                  ...btnSecundario,
                  flex: "none",
                  padding: "7px 11px",
                  fontSize: "11px",
                  borderColor: janelaTreinoDia.pre ? "#9ADFC2" : "rgba(190, 170, 225, 0.19)",
                  color: janelaTreinoDia.pre ? "#A9E8CB" : "#BEB7CA",
                }}
              >
                {janelaTreinoDia.pre ? textoUi("✓ Pré-treino feito", "✓ Pre-workout completed") : textoUi("Pré-treino pendente", "Pre-workout pending")}
              </button>
              <button
                type="button"
                onClick={() => alternarJanelaTreino("pos")}
                style={{
                  ...btnSecundario,
                  flex: "none",
                  padding: "7px 11px",
                  fontSize: "11px",
                  borderColor: janelaTreinoDia.pos ? "#9ADFC2" : "rgba(190, 170, 225, 0.19)",
                  color: janelaTreinoDia.pos ? "#A9E8CB" : "#BEB7CA",
                }}
              >
                {janelaTreinoDia.pos ? textoUi("✓ Pós-treino feito", "✓ Post-workout completed") : textoUi("Pós-treino pendente", "Post-workout pending")}
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
                  borderColor: refeicaoLivreDia ? "#DCCCF5" : "rgba(190, 170, 225, 0.19)",
                  color: refeicaoLivreDia ? "#DCCCF5" : "#BEB7CA",
                }}
              >
                {refeicaoLivreDia ? textoUi("✓ Refeição fora / livre", "✓ Free meal logged") : textoUi("Marcar refeição fora / livre", "Log a free meal")}
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
                      border: "1px solid rgba(190, 170, 225, 0.19)",
                      background: feita ? "rgba(34, 197, 94, 0.14)" : "#111827",
                      color: feita ? "#A9E8CB" : "#EEEAF5",
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
                {textoUi('Salvar', 'Save')}
              </button>
            </form>
          </div>

          {/* Contador de cafeína / pré-treino */}
          <div style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600 }}>{textoUi('Cafeína & pré-treino', 'Caffeine & pre-workout')}</span>
            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={novoRotuloCafeina}
                onChange={(e) => setNovoRotuloCafeina(e.target.value)}
                style={{ ...campoTexto, width: "auto", padding: "7px 9px", fontSize: "12px" }}
              >
                <option value="Café">{textoUi('Café', 'Coffee')}</option>
                <option value="Pré-treino">{textoUi('Pré-treino', 'Pre-workout')}</option>
                <option value="Energético">{textoUi('Energético', 'Energy drink')}</option>
              </select>
              <button
                type="button"
                onClick={registrarCafeina}
                style={{ ...btnSecundario, flex: "none", padding: "7px 12px", color: "#DCCCF5" }}
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
                      background: "rgba(29, 27, 39, 0.72)",
                      border: "1px solid rgba(190, 170, 225, 0.19)",
                      fontSize: "11px",
                    }}
                  >
                    {c.rotulo} • {c.hora}
                    <button
                      type="button"
                      onClick={() => removerCafeina(c.id)}
                      style={{ background: "none", border: "none", color: "#9E96AD", cursor: "pointer", padding: 0 }}
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
                {textoUi("+ Adicionar min", "+ Add minutes")}
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
                      background: "rgba(29, 27, 39, 0.72)",
                      border: "1px solid rgba(190, 170, 225, 0.19)",
                      fontSize: "11px",
                    }}
                  >
                    {c.tipo}: {c.minutos} min
                    <button
                      type="button"
                      onClick={() => removerCardio(c.id)}
                      style={{ background: "none", border: "none", color: "#9E96AD", cursor: "pointer", padding: 0 }}
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
          {!diaPodeEditar && <div style={{ padding: "10px 12px", borderRadius: "9px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.28)", color: "#E9C987", fontSize: "12px" }}>{textoUi('Dia fechado para alterações. Os registros podem ser consultados, mas não modificados.', 'This day is closed for changes. Records can be viewed but not modified.')}</div>}
          <fieldset disabled={!diaPodeEditar} style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Checklist da mochila */}
          <div style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600 }}>{textoUi('Checklist da mochila / saída', 'Gear / departure checklist')}</span>
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
                      border: "1px solid rgba(190, 170, 225, 0.19)",
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
                        color: marcado ? "#A9E8CB" : "#EEEAF5",
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
                      style={{ background: "none", border: "none", color: "#9E96AD", cursor: "pointer", padding: 0 }}
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
                {textoUi('Adicionar', 'Add')}
              </button>
            </form>
          </div>

          {/* Meta semanal & Foco por dia */}
          <div style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600 }}>{textoUi("Meta semanal de treinos", "Weekly workout goal")}</span>
              <label style={{ fontSize: "12px", color: "#BEB7CA" }}>
                {textoUi("Meta", "Goal")} {" "}
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={metaTreinosSemana}
                  onChange={(e) => setMetaTreinosSemana(e.target.value)}
                  style={{
                    width: "44px",
                    background: "rgba(29, 27, 39, 0.72)",
                    color: "#F1EEF7",
                    border: "1px solid rgba(190, 170, 225, 0.19)",
                    borderRadius: "6px",
                    padding: "3px 6px",
                    fontSize: "12px",
                  }}
                />{" "}
                x/semana
              </label>
            </div>
            <div style={{ fontSize: "12px", color: "#BEB7CA" }}>
              {textoUi("Últimos 7 dias:", "Last 7 days:")} <strong style={{ color: "#F1EEF7" }}>{dashboardData.treinos7d}</strong>/{dashboardData.metaSemanalSegura} ({dashboardData.metaSemanalPct}%)
            </div>
            <div style={{ height: "4px", background: "rgba(148, 163, 184, 0.18)", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${dashboardData.metaSemanalPct}%`, height: "100%", background: "#DCCCF5" }} />
            </div>

            <div style={{ paddingTop: "8px", borderTop: "1px solid rgba(190, 170, 225, 0.14)", display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "11px", color: "#BEB7CA" }}>Foco por dia da semana</span>
              {DIAS_SEMANA.map((d) => (
                <div key={d.chave} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "36px", fontSize: "12px", color: "#BEB7CA" }}>{d.rotulo}</span>
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
                style={{ ...btnSecundario, flex: "none", padding: "7px 11px", color: "#F19AAB" }}
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "4px", width: "100%", borderTop: "1px solid rgba(190, 170, 225, 0.16)", borderBottom: "1px solid rgba(190, 170, 225, 0.16)", padding: "14px 0" }}>
              {DIAS_SEMANA.map((d) => {
                const ativa = d.chave === diaMontagem;
                return (
                  <button
                    key={d.chave}
                    type="button"
                    onClick={() => {
                      setEditandoId(null);
                      setDiaMontagem(d.chave);
                      setFormAdicionarExercicioAberto(false);
                    }}
                    style={{
                      padding: "10px 4px",
                      minHeight: "54px",
                      borderRadius: "5px",
                      border: "none",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      minWidth: 0,
                      background: ativa ? "rgba(190, 170, 225, 0.14)" : "transparent",
                      color: ativa ? "#F1EEF7" : "#9E96AD",
                      fontSize: "12px",
                      fontWeight: ativa ? 700 : 500,
                      cursor: "pointer",
                    }}
                  >
                    {d.rotulo}
                    <span style={{ height: "4px", color: "#C7A9EF", fontSize: "9px", lineHeight: 1 }}>
                      {(rotina[d.chave] || []).length > 0 ? "•" : " "}
                    </span>
                  </button>
                );
              })}
            </div>


          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginTop: "4px" }}>
            <div>
              <div style={{ fontSize: "10px", color: "#9E96AD", letterSpacing: "0.06em", marginBottom: "8px" }}>ROTINA SEMANAL</div>
              <h2 style={{ margin: 0, fontSize: "20px", lineHeight: 1.2, fontWeight: 750, color: "#F1EEF7" }}>
                {DIAS_SEMANA.find((d) => d.chave === diaMontagem)?.nome || diaMontagem}
              </h2>
            </div>
            <button type="button" onClick={() => setFormAdicionarExercicioAberto((aberto) => !aberto)}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "none", borderRadius: "5px", background: "#C7A9EF", color: "#15121D", padding: "11px 16px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
              <span style={{ fontSize: "18px", lineHeight: 1 }}>+</span>
              {formAdicionarExercicioAberto ? textoUi("Fechar", "Close") : textoUi("Adicionar exercício", "Add exercise")}
            </button>
          </div>

          {formAdicionarExercicioAberto && (
          <form onSubmit={adicionarExercicio} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <label style={rotuloCampo}>{textoUi('Exercício', 'Exercise')}</label>
              <input
                type="text"
                placeholder="Ex.: Supino Reto"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                style={campoTexto}
              />
            </div>

            <div>
              <label style={rotuloCampo}>Grupo muscular / categoria</label>
              <select value={novoGrupoMuscular} onChange={(e) => setNovoGrupoMuscular(e.target.value)} style={campoTexto}>
                <option value="superior">SUPERIOR — Peito, costas, ombros, bíceps e tríceps</option>
                <option value="inferior">INFERIOR — Quadríceps, posteriores, glúteos, adutores e panturrilhas</option>
                <option value="core">ABDÔMEN E CORE — Reto abdominal, oblíquos e estabilizadores do tronco</option>
                <option value="antebracos">ANTEBRAÇOS — Flexores, extensores e pegada</option>
                <option value="cardio">CARDIO — Esteira, bicicleta, corrida, escada e condicionamento</option>
                <option value="mobilidade">MOBILIDADE E ALONGAMENTO — Flexibilidade, mobilidade articular e alongamentos</option>
              </select>
              <span style={{ display: "block", marginTop: 5, color: "#9E96AD", fontSize: 10 }}>Essa escolha define em qual card o exercício será exibido.</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              <div>
                <label style={rotuloCampo}>{textoUi('Séries x Reps', 'Sets x Reps')}</label>
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
                <label style={rotuloCampo}>{textoUi("Descanso (s)", "Rest (s)")}</label>
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
                background: "#F1EEF7",
                color: "#111827",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {textoUi('Adicionar', 'Add')}
            </button>
          </form>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "8px",
            }}
          >
            {(rotina[diaMontagem] || []).map((item, idx) => {
              const estaEditando = editandoId === item.id;
              return (
                <div
                  key={item.id}
                  style={{
                    padding: "18px 0",
                    borderRadius: "0",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid rgba(190, 170, 225, 0.14)",
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
                      <select
                        value={editForm.grupoMuscular || "superior"}
                        onChange={(e) => setEditForm((f) => ({ ...f, grupoMuscular: e.target.value }))}
                        style={{ ...campoTexto, padding: "7px 8px" }}
                      >
                        <option value="superior">SUPERIOR — Peito, costas, ombros, bíceps e tríceps</option>
                        <option value="inferior">INFERIOR — Quadríceps, posteriores, glúteos, adutores e panturrilhas</option>
                        <option value="core">ABDÔMEN E CORE — Reto abdominal, oblíquos e estabilizadores do tronco</option>
                        <option value="antebracos">ANTEBRAÇOS — Flexores, extensores e pegada</option>
                        <option value="cardio">CARDIO — Esteira, bicicleta, corrida, escada e condicionamento</option>
                        <option value="mobilidade">MOBILIDADE E ALONGAMENTO — Flexibilidade, mobilidade articular e alongamentos</option>
                      </select>
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
                          {textoUi('Cancelar', 'Cancel')}
                        </button>
                        <button
                          type="button"
                          onClick={() => salvarEdicao(diaMontagem, item.id)}
                          style={{
                            padding: "5px 10px",
                            borderRadius: "7px",
                            border: "none",
                            background: "#F1EEF7",
                            color: "#111827",
                            fontWeight: 700,
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          {textoUi('Salvar', 'Save')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0, flex: 1 }}>
                        <span style={{ flex: "none", width: "24px", color: "#9E96AD", fontSize: "16px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{String(idx + 1).padStart(2, "0")}</span>
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ display: "block", color: "#F1EEF7", marginBottom: "8px", overflowWrap: "anywhere" }}>{item.nome}</strong>
                          <span style={{ color: "#9E96AD", fontSize: "11px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <span>{item.seriesReps.replace(/x/i, " × ")}</span><span>·</span><span>{item.descanso}s descanso</span><span>·</span><span>{item.carga} kg</span>
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button
                          type="button"
                          onClick={() => moverExercicio(diaMontagem, idx, -1)}
                          disabled={idx === 0}
                          style={{ ...btnCarga, opacity: idx === 0 ? 0.35 : 1 }}
                          title="Subir"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
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
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M18 13l-6 6-6-6" /></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(item)}
                          style={{ background: "none", border: "none", color: "#737B88", cursor: "pointer", padding: "5px" }}
                          title="Editar exercício"
                          aria-label={`Editar ${item.nome}`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" /></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => removerExercicio(diaMontagem, item.id)}
                          style={{ background: "none", border: "none", color: "#737B88", cursor: "pointer", padding: "5px" }}
                          title="Excluir exercício"
                          aria-label={`Excluir ${item.nome}`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" /></svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", borderTop: "1px solid rgba(190, 170, 225, 0.14)", paddingTop: "12px", color: "#9E96AD", fontSize: "11px" }}>
            <span>{(rotina[diaMontagem] || []).length} exercícios</span>
            <span>{(rotina[diaMontagem] || []).reduce((total, item) => total + (parseInt(String(item.seriesReps).match(/\d+/)?.[0] || "0", 10) || 0), 0)} {textoUi("séries no total", "sets total")}</span>
          </div>

                      <details style={{ width: "100%", borderBottom: "1px solid rgba(190, 170, 225, 0.12)", paddingBottom: "8px" }}>
              <summary style={{ cursor: "pointer", color: "#9E96AD", fontSize: "11px", fontWeight: 600, padding: "5px 0" }}>{textoUi('Modelos e opções da rotina', 'Routine templates and options')}</summary>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "12px" }}>
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
            <div style={{ fontSize: "11px", color: "#BEB7CA" }}>Modelos de treino</div>
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
                {textoUi("Salvar dia como modelo", "Save day as template")}
              </button>
            </div>
              </div>
            </details>
        </div>
      )}

      {/* DASHBOARD */}
      {abaAtiva === "configuracoes" && (
        <div style={{ display: "grid", gap: 14, maxWidth: 720 }}>
          <section style={{ ...cardClean, background: "rgba(20,22,28,.30)", border: "1px solid rgba(190,170,225,.13)", display: "grid", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: ".12em", color: "#BEB7CA", marginBottom: 5 }}>{textoUi("DADOS NA NUVEM", "CLOUD DATA")}</div>
              <h2 style={{ margin: 0, fontSize: 16 }}>{textoUi("Sincronização de dados", "Data synchronization")}</h2>
              <p style={{ color: "#9E96AD", fontSize: 12, margin: "6px 0 0", lineHeight: 1.5 }}>{textoUi("Envie seus dados salvos neste dispositivo para sua conta Supabase. A sincronização é manual, iniciada por você.", "Upload the data saved on this device to your Supabase account. Sync is manual and started by you.")}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12, color: statusDadosNuvem.includes("pendente") ? "#E9C987" : statusDadosNuvem.includes("Falha") ? "#F4B8C2" : "#B9E3C8" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusDadosNuvem.includes("pendente") ? "#E9C987" : statusDadosNuvem.includes("Falha") ? "#F4B8C2" : "#86D6A5" }} />
              {statusDadosNuvem.includes("pendente") ? textoUi("Sincronização pendente", "Sync pending") : sincronizacaoManualEmAndamento ? textoUi("Sincronizando...", "Syncing...") : statusDadosNuvem.includes("Falha") ? textoUi("Falha na sincronização", "Sync failed") : textoUi("Sincronizado", "Synced")}
            </div>
            <button type="button" onClick={sincronizarDadosManualmente} disabled={sincronizacaoManualEmAndamento || !estaOnline} style={{ ...btnSecundario, width: "fit-content", flex: "none", padding: "10px 14px", opacity: sincronizacaoManualEmAndamento || !estaOnline ? .55 : 1, cursor: sincronizacaoManualEmAndamento || !estaOnline ? "not-allowed" : "pointer" }}>
              {sincronizacaoManualEmAndamento ? textoUi("Enviando dados...", "Uploading data...") : textoUi("Sincronizar meus dados", "Sync my data")}
            </button>
            {mensagemSincronizacaoManual && <p role="status" style={{ margin: 0, color: "#B9E3C8", fontSize: 12 }}>{mensagemSincronizacaoManual}</p>}
            {erroDadosNuvem && <p role="alert" style={{ margin: 0, color: "#F4B8C2", fontSize: 12 }}>{erroDadosNuvem}</p>}
          </section>

          <section style={{ ...cardClean, background: "rgba(20,22,28,.24)", border: "1px solid rgba(190,170,225,.10)", display: "grid", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: ".12em", color: "#BEB7CA", marginBottom: 5 }}>{textoUi("PERSONALIZAÇÃO", "PERSONALIZATION")}</div>
              <h2 style={{ margin: 0, fontSize: 16 }}>{textoUi("Aparência e idioma", "Appearance and language")}</h2>
              <p style={{ color: "#9E96AD", fontSize: 12, margin: "6px 0 0", lineHeight: 1.5 }}>{textoUi("Ajuste o tamanho da interface e o idioma dos elementos principais.", "Adjust interface size and the language of main interface elements.")}</p>
            </div>
            <div style={{ display: "grid", gap: 7 }}>
              <label style={{ ...rotuloCampo, marginBottom: 0 }}>{textoUi("Tamanho da fonte", "Font size")}</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 7 }}>
                {[{id:"pequena",pt:"Pequena",en:"Small"},{id:"padrao",pt:"Padrão",en:"Standard"},{id:"grande",pt:"Grande",en:"Large"}].map(opt => <button key={opt.id} type="button" onClick={() => setPreferenciaFonte(opt.id)} style={{ ...btnSecundario, background: preferenciaFonte===opt.id ? "rgba(197,178,255,.16)" : "transparent", borderColor: preferenciaFonte===opt.id ? "rgba(197,178,255,.4)" : "rgba(190,170,225,.15)", color: preferenciaFonte===opt.id ? "#E6D8FA" : "#BEB7CA" }}>{textoUi(opt.pt,opt.en)}</button>)}
              </div>
            </div>
            <div style={{ display: "grid", gap: 7 }}>
              <label style={{ ...rotuloCampo, marginBottom: 0 }}>{textoUi("Idioma", "Language")}</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 7 }}>
                {[{id:"pt",label:"Português"},{id:"en",label:"English"}].map(opt => <button key={opt.id} type="button" onClick={() => setIdiomaApp(opt.id)} style={{ ...btnSecundario, background: idiomaApp===opt.id ? "rgba(197,178,255,.16)" : "transparent", borderColor: idiomaApp===opt.id ? "rgba(197,178,255,.4)" : "rgba(190,170,225,.15)", color: idiomaApp===opt.id ? "#E6D8FA" : "#BEB7CA" }}>{opt.label}</button>)}
              </div>
              {emIngles && <p style={{ ...labelMini, margin: 0 }}>User-entered data remains unchanged when switching languages.</p>}
            </div>
          </section>
          <section style={{ ...cardClean, background: "rgba(20,22,28,.38)", border: "1px solid rgba(190,170,225,.13)", display: "grid", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: ".12em", color: "#BEB7CA", marginBottom: 5 }}>{textoUi('USUÁRIO', 'USER')}</div>
              <h2 style={{ margin: 0, fontSize: 16 }}>{textoUi("Foto de perfil", "Profile photo")}</h2>
              <p style={{ color: "#9E96AD", fontSize: 12, margin: "6px 0 0", lineHeight: 1.5 }}>{textoUi("A imagem será exibida no avatar do menu lateral e sincronizada com seus dados do aplicativo.", "This photo will appear in the sidebar avatar and sync with your app data.")}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ width: 76, height: 76, borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(199,169,239,.5)", background: "#342B46", display: "grid", placeItems: "center", color: "#DCCCF5", fontWeight: 800, fontSize: 22, flexShrink: 0 }}>
                {perfilFoto ? <img src={perfilFoto} alt="Foto de perfil atual" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (authSession.user.user_metadata?.nome || authSession.user.email || "U").slice(0,1).toUpperCase()}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={() => perfilFotoInputRef.current?.click()} style={{ ...btnSecundario, flex: "none", padding: "9px 12px" }}>{textoUi("Escolher foto", "Choose photo")}</button>
                {perfilFoto && <button type="button" onClick={() => { setPerfilFoto(""); setPerfilFotoErro("Foto removida. A alteração será sincronizada."); }} style={{ ...btnSecundario, flex: "none", padding: "9px 12px", color: "#E9A8B6" }}>{textoUi('Remover foto', 'Remove photo')}</button>}
                <input ref={perfilFotoInputRef} type="file" accept="image/*" onChange={(e) => atualizarFotoPerfil(e.target.files?.[0])} style={{ display: "none" }} />
              </div>
            </div>
            {perfilFotoErro && <div role="status" style={{ fontSize: 11, color: perfilFotoErro.includes("Não") || perfilFotoErro.includes("Escolha") || perfilFotoErro.includes("8 MB") ? "#F4B8C2" : "#BEB7CA" }}>{perfilFotoErro}</div>}
            <div style={{ fontSize: 11, color: "#9E96AD" }}>{textoUi("Formatos de imagem aceitos · até 8 MB (a imagem é reduzida para economizar armazenamento).", "Accepted image formats · up to 8 MB (image is resized to save storage).")}</div>
          </section>

          <section style={{ ...cardClean, background: "rgba(20,22,28,.38)", border: "1px solid rgba(190,170,225,.13)", display: "grid", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: ".12em", color: "#BEB7CA", marginBottom: 5 }}>{textoUi("DADOS & SEGURANÇA", "DATA & SECURITY")}</div>
              <h2 style={{ margin: 0, fontSize: 16, color: "#F1EEF7" }}>{textoUi("Resetar dados do aplicativo", "Reset app data")}</h2>
              <p style={{ color: "#9E96AD", fontSize: 12, margin: "6px 0 0", lineHeight: 1.55 }}>Apaga treinos, registros, histórico, Dashboard, relatórios, recordes, metas, água e demais dados do aplicativo. Sua conta e foto de perfil serão preservadas. Esta ação é irreversível.</p>
            </div>
            <button type="button" onClick={() => { setResetModalAberto(true); setResetSenha(""); setResetErro(""); }} style={{ ...btnSecundario, flex: "none", width: "fit-content", padding: "10px 14px", color: "#F1A8B8", borderColor: "rgba(241,168,184,.25)" }}>{textoUi("Resetar dados do app", "Reset app data")}</button>
          </section>
        </div>
      )}

      {abaAtiva === "dashboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {(dashboardData.diasSemBackup === null || dashboardData.diasSemBackup >= 7) && (
            <div style={{ fontSize: "11px", color: "#E9C987", background: "rgba(251, 191, 36, 0.08)", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(251, 191, 36, 0.25)" }}>
              {dashboardData.diasSemBackup === null
                ? "Dica: faça seu primeiro backup JSON abaixo para proteger seu histórico."
                : `Faz ${dashboardData.diasSemBackup} dias desde o último backup JSON.`}
            </div>
          )}

          {/* Resumo semanal automático */}
          <div style={cardClean}>
            <div style={{ ...labelMini, marginBottom: "6px" }}>Resumo da semana (7 dias)</div>
            <div style={{ fontSize: "12px", color: "#EEEAF5", lineHeight: 1.5 }}>
              <strong>{dashboardData.treinos7d}</strong> treino(s) •{" "}
              <strong>{dashboardData.volume7dAtual.toLocaleString("pt-BR")} kg</strong> de volume • cardio{" "}
              <strong>{dashboardData.minCardio7d} min</strong> • {textoUi("média de", "average of")} {" "}
              <strong>{dashboardData.mediaAgua7DiasMl} ml/dia</strong> {textoUi("de água •", "of water •")} {" "}
              <strong>{dashboardData.diasSonoRuim7d}</strong> dia(s) com sono curto.
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            <div style={cardClean}>
              <div style={labelMini}>{textoUi('Mês', 'Month')}</div>
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
                  <div style={{ ...labelMini, color: "#E9C987", marginBottom: "6px" }}>{textoUi('Atenção à estagnação', 'Plateau alert')}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px" }}>
                    {dashboardData.estagnados.map((est, i) => (
                      <div key={i}>
                        <strong style={{ textTransform: "capitalize" }}>{est.nome}</strong> — {textoUi("parado em", "stuck at")} {est.carga}kg ({textoUi("varie reps ou estímulo", "vary reps or stimulus")})
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
                          background: "rgba(29, 27, 39, 0.72)",
                          border: "1px solid rgba(190, 170, 225, 0.19)",
                          color: "#EEEAF5",
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
                <span style={labelMini}>{textoUi("Meta mensal de treinos", "Monthly workout goal")}</span>
                <label style={{ fontSize: "11px", color: "#BEB7CA" }}>
                  {textoUi("Meta", "Goal")} {" "}
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={metaTreinosMes}
                    onChange={(e) => setMetaTreinosMes(e.target.value)}
                    style={{
                      width: "44px",
                      background: "rgba(29, 27, 39, 0.72)",
                      color: "#F1EEF7",
                      border: "1px solid rgba(190, 170, 225, 0.19)",
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
                <div style={{ width: `${dashboardData.metaMensalPct}%`, height: "100%", background: "#C7A9EF" }} />
              </div>
            </div>

            <div style={cardClean}>
              <div style={labelMini}>{textoUi('Volume nos últimos 7 dias', 'Volume over the last 7 days')}</div>
              <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "6px" }}>
                {dashboardData.volume7dAtual.toLocaleString("pt-BR")} kg
              </div>
              <div style={{ fontSize: "11px", color: "#9E96AD", marginTop: "4px" }}>
                vs 7d anteriores:{" "}
                <span style={{ color: dashboardData.diffVolumeSemanal >= 0 ? "#9ADFC2" : "#F19AAB" }}>
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
              <span style={labelMini}>{textoUi('Água nos últimos 7 dias', 'Water over the last 7 days')}</span>
              <span style={{ fontSize: "12px", fontWeight: 600 }}>
                {textoUi("Média de", "Average")} {dashboardData.mediaAgua7DiasMl} {textoUi("ml/dia", "ml/day")} • {textoUi("Meta", "Goal")} {metaAguaMl} {textoUi("ml/dia", "ml/day")} ({pesoKg} kg)
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
                      background: "rgba(29, 27, 39, 0.72)",
                      border: "1px solid rgba(190, 170, 225, 0.14)",
                      borderRadius: "7px",
                      padding: "6px 4px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span style={{ fontSize: "10px", color: "#9E96AD" }}>{item.rotulo}</span>
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
                      <div style={{ width: "100%", height: `${pct}%`, background: "#C4A5EC" }} />
                    </div>
                    <span style={{ fontSize: "10px", color: "#BEB7CA" }}>{item.ml}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ ...cardClean, display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700 }}>{textoUi("Painel geral de atividades", "Activity overview")}</div>
              <div style={{ fontSize: "11px", color: "#9E96AD", marginTop: "3px" }}>{textoUi("Visão dos registros dos últimos 7 dias. Cada linha mostra os dados disponíveis daquele dia.", "Overview of records from the last 7 days. Each row shows the data available for that day.")}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: ehDesktop ? "repeat(4, 1fr)" : "repeat(2, 1fr)", gap: "8px" }}>
              <div style={{ background: "rgba(29, 27, 39, 0.72)", border: "1px solid rgba(190, 170, 225, 0.14)", borderRadius: "8px", padding: "9px" }}><div style={labelMini}>{textoUi('Refeições marcadas', 'Meals logged')}</div><div style={{ fontSize: "18px", fontWeight: 800 }}>{dashboardData.refeicoes7d}</div></div>
              <div style={{ background: "rgba(29, 27, 39, 0.72)", border: "1px solid rgba(190, 170, 225, 0.14)", borderRadius: "8px", padding: "9px" }}><div style={labelMini}>{textoUi('Cafeína registrada', 'Caffeine logged')}</div><div style={{ fontSize: "18px", fontWeight: 800 }}>{dashboardData.cafeina7d}</div></div>
              <div style={{ background: "rgba(29, 27, 39, 0.72)", border: "1px solid rgba(190, 170, 225, 0.14)", borderRadius: "8px", padding: "9px" }}><div style={labelMini}>{textoUi('Mochila média', 'Average gear checklist')}</div><div style={{ fontSize: "18px", fontWeight: 800 }}>{dashboardData.mochilaMedia7d}%</div></div>
              <div style={{ background: "rgba(29, 27, 39, 0.72)", border: "1px solid rgba(190, 170, 225, 0.14)", borderRadius: "8px", padding: "9px" }}><div style={labelMini}>Suplementos ativos</div><div style={{ fontSize: "18px", fontWeight: 800 }}>{dashboardData.suplementosAtivos}</div></div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {dashboardData.atividade7Dias.map((dia) => {
                const barras = [
                  { nome: "Água", valor: dia.aguaMl, unidade: "ml", max: Math.max(metaAguaMl, ...dashboardData.atividade7Dias.map((x) => x.aguaMl), 1), cor: "#C4A5EC" },
                  { nome: "Tempo ativo", valor: dia.duracaoMin, unidade: "min", max: Math.max(60, ...dashboardData.atividade7Dias.map((x) => x.duracaoMin), 1), cor: "#C7A9EF" },
                  { nome: "Cardio", valor: dia.cardioMin, unidade: "min", max: Math.max(30, ...dashboardData.atividade7Dias.map((x) => x.cardioMin), 1), cor: "#9DDFC8" },
                  { nome: "Volume", valor: dia.volumeKg, unidade: "kg", max: Math.max(100, ...dashboardData.atividade7Dias.map((x) => x.volumeKg), 1), cor: "#E6C17C" },
                ];
                return (
                  <div key={dia.dataISO} style={{ padding: "9px", borderRadius: "8px", background: "rgba(29, 27, 39, 0.72)", border: "1px solid rgba(190, 170, 225, 0.14)", display: "grid", gridTemplateColumns: ehDesktop ? "58px 1fr 1fr" : "42px 1fr", gap: "8px", alignItems: "center" }}>
                    <div style={{ fontSize: "11px", color: "#BEB7CA", fontWeight: 700 }}>{dia.rotulo}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "7px" }}>
                      {barras.map((barra) => <div key={barra.nome} style={{ minWidth: 0 }}><div style={{ display: "flex", justifyContent: "space-between", gap: "4px", fontSize: "9px", color: "#9E96AD", marginBottom: "3px" }}><span>{barra.nome}</span><strong style={{ color: "#EEEAF5" }}>{barra.valor}{barra.unidade}</strong></div><div style={{ height: "5px", borderRadius: "99px", background: "rgba(148, 163, 184, 0.20)", overflow: "hidden" }}><div style={{ width: `${Math.min(100, Math.round((barra.valor / barra.max) * 100))}%`, height: "100%", background: barra.cor, borderRadius: "99px" }} /></div></div>)}
                    </div>
                    <div style={{ gridColumn: ehDesktop ? "auto" : "2", display: "flex", flexWrap: "wrap", gap: "5px", fontSize: "9px", color: "#9E96AD" }}>
                      <span>{dia.treino ? textoUi("✓ Treino", "✓ Workout") : textoUi("— Treino", "— Workout")}</span><span>• {dia.refeicoes} {textoUi("refeições", "meals")}</span><span>• {dia.cafeina} {textoUi("cafeína", "caffeine")}</span><span>• {textoUi("Mochila", "Gear")} {dia.mochilaPct}%</span><span>• {dia.sinais} {textoUi("sinais", "signals")}</span><span>• {textoUi("Sono:", "Sleep:")} {dia.sono}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: "10px", color: "#9E96AD" }}>{textoUi("Os itens sem registro aparecem como zero ou “Não registrado”; suplementos ativos representam sua lista atual, não um consumo diário.", "Unlogged items appear as zero or “Not recorded”; active supplements represent your current list, not daily intake.")}</div>
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
                      color: periodoFiltro === p.id ? "#F1EEF7" : "#9E96AD",
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
                  <option value="TODOS">{textoUi('Todos os exercícios', 'All exercises')}</option>
                  {dashboardData.exerciciosNomes.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {dashboardData.historico.length === 0 ? (
                <div style={{ fontSize: "12px", color: "#9E96AD" }}>{textoUi('Sem treinos concluídos no filtro.', 'No completed workouts in this filter.')}</div>
              ) : (
                dashboardData.historico.map((item, i) => (
                  <div key={`${item.dataISO}-${i}`}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "11px",
                        color: "#BEB7CA",
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
                          background: "#F1EEF7",
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
                <div style={{ fontSize: "12px", color: "#9E96AD" }}>Nenhuma nota.</div>
              ) : (
                notas.map((n) => (
                  <div key={n.dataISO} style={{ fontSize: "12px", paddingTop: "6px", borderTop: "1px solid rgba(190, 170, 225, 0.14)" }}>
                    <span style={{ color: "#BEB7CA", marginRight: "8px" }}>{n.dataISO}</span>
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
            {statusBackup && <div style={{ fontSize: "11px", color: "#BEB7CA" }}>{statusBackup}</div>}
          </div>

          {/* Gráficos integrados: evolução real dos registros */}
          {(() => {
            const painel = { ...cardClean, background: "rgba(44,67,96,.42)", border: "1px solid rgba(96,165,250,.20)", backdropFilter: "blur(14px)", display: "grid", gap: 12 };
            const barras = (titulo, dados, unidade = "", cor = "#B99AE7") => {
              const validos = (dados || []).filter((x) => Number.isFinite(Number(x.valor)));
              const max = Math.max(1, ...validos.map((x) => Number(x.valor)));
              return <div style={painel}><div style={{fontWeight:800,fontSize:13}}>{titulo}</div>{validos.length ? <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(validos.length,8)},minmax(0,1fr))`,gap:7,alignItems:"end",minHeight:125}}>{validos.slice(-8).map((x,i)=><div key={`${x.rotulo}-${i}`} title={`${x.rotulo}: ${x.valor}${unidade}`} style={{display:"grid",gap:5,justifyItems:"center",minWidth:0}}><strong style={{fontSize:9,color:"#E9DFFC",whiteSpace:"nowrap"}}>{Number(x.valor).toLocaleString("pt-BR")}{unidade}</strong><div style={{height:78,width:"100%",maxWidth:34,display:"flex",alignItems:"end",background:"rgba(148,163,184,.12)",borderRadius:7,overflow:"hidden"}}><div style={{width:"100%",height:`${Math.max(3,Number(x.valor)/max*100)}%`,background:cor,borderRadius:7}}/></div><span style={{fontSize:9,color:"#AAA1B8",textAlign:"center",overflowWrap:"anywhere"}}>{x.rotulo}</span></div>)}</div> : <div style={{fontSize:11,color:"#AAA1B8"}}>{textoUi('Ainda não há registros suficientes para este gráfico.', 'Not enough records for this chart yet.')}</div>}</div>;
            };
            const ultimosPR = registrosPR.slice().sort((a,b)=>(a.data||"").localeCompare(b.data||"")).slice(-8).map(x=>({rotulo:(x.exercicio||"PR").slice(0,9),valor:Number(x.carga)}));
            const medidas = medidasCorporais.slice().sort((a,b)=>(a.data||"").localeCompare(b.data||"")).slice(-8);
            const agua = dashboardData.agua7Dias.map(x=>({rotulo:x.rotulo,valor:Number(x.ml)||0}));
            const volume = dashboardData.atividade7Dias.map(x=>({rotulo:x.rotulo,valor:Number(x.volumeKg)||0}));
            const treinos = dashboardData.atividade7Dias.map(x=>({rotulo:x.rotulo,valor:x.treino?1:0}));
            const cardio = dashboardData.atividade7Dias.map(x=>({rotulo:x.rotulo,valor:Number(x.cardioMin)||0}));
            const cargasTreino = (dashboardData.historico || []).slice(-8).map(x=>({rotulo:(x.dataISO||x.nome||"Treino").slice(5,10),valor:Number(x.carga)||0}));
            return <div style={{display:"grid",gap:12}}><div><h3 style={{margin:"2px 0 4px",fontSize:16}}>{textoUi('Gráficos de evolução', 'Progress charts')}</h3><p style={{...labelMini,margin:0}}>{textoUi("Visualizações calculadas a partir dos registros reais. Os gráficos ganham histórico conforme você registra atividades.", "Charts are calculated from actual records. History grows as you log activities.")}</p></div><div style={{display:"grid",gridTemplateColumns:ehDesktop?"repeat(2,minmax(0,1fr))":"1fr",gap:12}}>{barras("Recordes pessoais por exercício",ultimosPR," kg","#B99AE7")}{barras("Cargas dos treinos registrados",cargasTreino," kg","#B89AE7")}{barras("Peso corporal (últimas medições)",medidas.filter(x=>x.peso).map(x=>({rotulo:x.data?.slice(5)||"Data",valor:Number(x.peso)}))," kg","#C4A5EC")}{barras("Cintura (últimas medições)",medidas.filter(x=>x.cintura).map(x=>({rotulo:x.data?.slice(5)||"Data",valor:Number(x.cintura)}))," cm","#a78bfa")}{barras("Peito (últimas medições)",medidas.filter(x=>x.peito).map(x=>({rotulo:x.data?.slice(5)||"Data",valor:Number(x.peito)}))," cm","#9DDFC8")}{barras("Hidratação diária — 7 dias",agua," ml","#C4A5EC")}{barras("Volume de treino — 7 dias",volume," kg","#E6C17C")}{barras("Dias com treino — 7 dias",treinos,"","#9DDFC8")}{barras("Cardio — 7 dias",cardio," min","#a78bfa")}</div><div style={painel}><strong style={{fontSize:13}}>{textoUi("Metas pessoais", "Personal goals")}</strong>{metasPessoais.length?metasPessoais.map(m=><div key={m.id} style={{display:"flex",justifyContent:"space-between",gap:8,fontSize:11,borderTop:"1px solid rgba(148,190,215,.12)",paddingTop:7}}><span>{m.nome}</span><strong style={{color:m.concluida?"#B7EBD0":"#D6C4F1"}}>{m.concluida?"Concluída":"Em andamento"}</strong></div>):<span style={labelMini}>{textoUi("Nenhuma meta cadastrada.", "No goals added.")}</span>}</div></div>;
          })()}
        </div>
      )}

      {/* ÁREAS PREMIUM ADICIONAIS */}
      {abaAtiva === "desempenho" && (() => {
        const totalTreinos = Object.values(estadoDiaPorData || {}).filter((v) => v === "treino" || v?.treino === true || v?.status === "treino").length;
        const ultimoPeso = medidasCorporais.length ? medidasCorporais[medidasCorporais.length - 1] : null;
        const card = { ...cardClean, background: "rgba(44, 67, 96, 0.48)", border: "1px solid rgba(190, 160, 232, 0.25)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderRadius: "14px", boxShadow: "0 12px 30px rgba(4, 12, 25, .16)" };
        const campo = { ...campoTexto, background: "rgba(19, 35, 55, .58)", border: "1px solid rgba(96,165,250,.25)", borderRadius: "10px" };
        return <div style={{ display: "grid", gap: "14px" }}>
          <div style={{ ...card, padding: "18px" }}><div style={{ color: "#D6C4F1", fontSize: "11px", letterSpacing: ".12em", fontWeight: 800 }}>CAVEIRA • PERFORMANCE</div><h2 style={{ margin: "7px 0", fontSize: "22px" }}>{textoUi('Sua evolução em um só lugar', 'Your progress in one place')}</h2><p style={{ color: "#AAA1B8", fontSize: "12px", margin: 0 }}>{textoUi("Acompanhe seus recordes, medidas e metas com base nos registros que você inserir.", "Track your records, measurements, and goals based on the data you enter.")}</p></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))", gap: "10px" }}>
            {[{ t: textoUi("Recordes registrados", "Records logged"), v: registrosPR.length }, { t: textoUi("Medições", "Measurements"), v: medidasCorporais.length }, { t: textoUi("Metas pessoais", "Personal goals"), v: metasPessoais.length }, { t: textoUi("Peso mais recente", "Latest weight"), v: ultimoPeso?.peso ? `${ultimoPeso.peso} kg` : "—" }].map((x) => <div key={x.t} style={card}><div style={labelMini}>{x.t}</div><div style={{ fontSize: "22px", fontWeight: 800, color: "#E4D8F7", marginTop: "7px" }}>{x.v}</div></div>)}
          </div>
          <div style={card}><h3 style={{ margin: "0 0 12px", fontSize: "15px" }}>{textoUi("Registrar recorde pessoal", "Log personal record")}</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "8px" }}><input value={novoPRExercicio} onChange={(e) => setNovoPRExercicio(e.target.value)} placeholder={textoUi("Exercício", "Exercise")} style={campo}/><input type="number" min="0" step="0.5" value={novoPRCarga} onChange={(e) => setNovoPRCarga(e.target.value)} placeholder={textoUi("Carga (kg)", "Weight (kg)")} style={campo}/><button type="button" onClick={() => { if (!novoPRExercicio.trim() || !(Number(novoPRCarga) > 0) || dataSelecionada !== hojeISO) return; setRegistrosPR((p) => [...p, { id: `pr-${Date.now()}`, exercicio: novoPRExercicio.trim(), carga: Number(novoPRCarga), data: hojeISO }]); setNovoPRExercicio(""); setNovoPRCarga(""); }} style={{ ...btnSecundario, background: "#A98BDD", color: "#15131C", border: 0, fontWeight: 800 }}>{textoUi("Salvar recorde", "Save record")}</button></div><p style={{ ...labelMini, marginBottom: 0 }}>{textoUi("Novos registros respeitam o bloqueio de datas: só podem ser adicionados hoje.", "New records follow date restrictions and can only be added today.")}</p>{registrosPR.slice().reverse().map((r) => <div key={r.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, borderTop: "1px solid rgba(148,190,215,.14)", padding: "10px 0", fontSize: "12px" }}><span>{r.exercicio} • {r.data}</span><strong style={{ color: "#D6C4F1" }}>{r.carga} kg</strong></div>)}</div>
          <div style={card}><h3 style={{ margin: "0 0 12px", fontSize: "15px" }}>{textoUi('Evolução corporal', 'Body progress')}</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 8 }}><input type="number" min="0" step="0.1" value={novaMedidaPeso} onChange={(e) => setNovaMedidaPeso(e.target.value)} placeholder={textoUi("Peso kg", "Weight (kg)")} style={campo}/><input type="number" min="0" step="0.1" value={novaMedidaCintura} onChange={(e) => setNovaMedidaCintura(e.target.value)} placeholder={textoUi("Cintura cm", "Waist (cm)")} style={campo}/><input type="number" min="0" step="0.1" value={novaMedidaPeito} onChange={(e) => setNovaMedidaPeito(e.target.value)} placeholder={textoUi("Peito cm", "Chest (cm)")} style={campo}/><button type="button" onClick={() => { if ((!novaMedidaPeso && !novaMedidaCintura && !novaMedidaPeito) || dataSelecionada !== hojeISO) return; setMedidasCorporais((p) => [...p, { id: `med-${Date.now()}`, data: hojeISO, peso: novaMedidaPeso ? Number(novaMedidaPeso) : null, cintura: novaMedidaCintura ? Number(novaMedidaCintura) : null, peito: novaMedidaPeito ? Number(novaMedidaPeito) : null }]); setNovaMedidaPeso(""); setNovaMedidaCintura(""); setNovaMedidaPeito(""); }} style={{ ...btnSecundario, background: "#A98BDD", color: "#15131C", border: 0, fontWeight: 800 }}>{textoUi("Registrar medidas", "Log measurements")}</button></div>{medidasCorporais.slice().reverse().map((m) => <div key={m.id} style={{ borderTop: "1px solid rgba(148,190,215,.14)", padding: "9px 0", fontSize: "12px", color: "#cbd5e1" }}>{m.data} • {m.peso ? `${m.peso} kg` : ""} {m.cintura ? `• Cintura ${m.cintura} cm` : ""} {m.peito ? `• Peito ${m.peito} cm` : ""}</div>)}</div>
          <div style={card}><h3 style={{ margin: "0 0 12px", fontSize: "15px" }}>{textoUi("Metas pessoais", "Personal goals")}</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8 }}><input value={novaMetaNome} onChange={(e) => setNovaMetaNome(e.target.value)} placeholder={textoUi("Ex.: Treinar 4x por semana", "e.g. Train 4 times a week")} style={campo}/><input value={novaMetaAlvo} onChange={(e) => setNovaMetaAlvo(e.target.value)} placeholder={textoUi("Alvo / observação", "Target / note")} style={campo}/><button type="button" onClick={() => { if (!novaMetaNome.trim()) return; setMetasPessoais((p) => [...p, { id: `meta-${Date.now()}`, nome: novaMetaNome.trim(), alvo: novaMetaAlvo.trim(), concluida: false }]); setNovaMetaNome(""); setNovaMetaAlvo(""); }} style={{ ...btnSecundario, background: "#A98BDD", color: "#15131C", border: 0, fontWeight: 800 }}>{textoUi("Adicionar meta", "Add goal")}</button></div>{metasPessoais.map((m) => <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, borderTop: "1px solid rgba(148,190,215,.14)", padding: "9px 0", fontSize: "12px" }}><input type="checkbox" checked={!!m.concluida} onChange={(e) => setMetasPessoais((p) => p.map((x) => x.id === m.id ? { ...x, concluida: e.target.checked } : x))}/><span style={{ flex: 1, textDecoration: m.concluida ? "line-through" : "none" }}>{m.nome} {m.alvo ? `— ${m.alvo}` : ""}</span><button type="button" onClick={() => setMetasPessoais((p) => p.filter((x) => x.id !== m.id))} style={{ ...btnCarga, color: "#F4B8C2" }}>×</button></div>)}</div>
        </div>;
      })()}


      {abaAtiva === "cards" && (() => {
        const grupoAtualCards = gruposMuscularesCards.find((grupo) => grupo.id === grupoTreinoSelecionado);
        const salvosDoGrupo = exerciciosSalvosCards.filter((item) => item.grupoMuscular === grupoTreinoSelecionado);
        return <div style={{ display: "grid", gap: 14 }}>
          <div style={{ ...cardClean, display: "grid", gap: 7 }}>
            <div style={{ color: "#C7A9EF", fontSize: 10, fontWeight: 800, letterSpacing: ".12em" }}>SUA BIBLIOTECA PESSOAL</div>
            <h2 style={{ margin: 0, fontSize: 19, color: "#F1EEF7" }}>Guarde exercícios para reutilizar</h2>
            <p style={{ ...labelMini, margin: 0 }}>Os exercícios salvos aqui ficam separados da programação semanal. Quando quiser trocar um movimento, encontre-o no card e substitua um exercício do dia escolhido, mantendo séries, repetições, descanso e carga já configurados.</p>
          </div>
          {!grupoAtualCards ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10 }}>
            {gruposMuscularesCards.map((grupo) => {
              const quantidade = exerciciosSalvosCards.filter((item) => item.grupoMuscular === grupo.id).length;
              return <button key={grupo.id} type="button" onClick={() => setGrupoTreinoSelecionado(grupo.id)} style={{ minHeight: 142, textAlign: "left", padding: 15, borderRadius: 14, border: "1px solid rgba(190,170,225,.18)", background: "linear-gradient(145deg, rgba(35,34,47,.94), rgba(17,19,27,.96))", color: "#E6E8ED", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 12, background: `${grupo.cor}18`, border: `1px solid ${grupo.cor}38`, color: grupo.cor, fontSize: 22, fontWeight: 800 }}>{grupo.id === "superior" ? "↗" : grupo.id === "inferior" ? "⌁" : grupo.id === "core" ? "◇" : grupo.id === "antebracos" ? "✳" : grupo.id === "cardio" ? "⌁" : "⤢"}</span>
                <strong style={{ fontSize: 12, letterSpacing: ".035em" }}>{grupo.nome}</strong>
                <span style={{ color: "#A8A4B2", fontSize: 10, lineHeight: 1.45 }}>{grupo.descricao}</span>
                <span style={{ color: grupo.cor, fontSize: 10, fontWeight: 800 }}>{quantidade} {quantidade === 1 ? "EXERCÍCIO SALVO" : "EXERCÍCIOS SALVOS"}</span>
              </button>;
            })}
          </div> : <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div><div style={{ color: "#9E96AD", fontSize: 10, letterSpacing: ".08em" }}>CARD DE EXERCÍCIOS</div><h2 style={{ margin: "4px 0", fontSize: 19, color: grupoAtualCards.cor }}>{grupoAtualCards.nome}</h2><p style={{ ...labelMini, margin: 0 }}>{grupoAtualCards.descricao}</p></div>
              <button type="button" onClick={() => { setGrupoTreinoSelecionado(null); setSubstituicaoCardAbertaId(null); }} style={btnSecundario}>← Voltar aos cards</button>
            </div>
            <form onSubmit={adicionarExercicioSalvoManual} style={{ ...cardClean, display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8 }}>
              <input value={novoExercicioSalvoNome} onChange={(e) => setNovoExercicioSalvoNome(e.target.value)} placeholder="Nome do exercício para guardar" style={campoTexto}/>
              <button type="submit" disabled={!novoExercicioSalvoNome.trim()} style={{ ...btnSecundario, background: "#C7A9EF", color: "#17131F", border: 0, opacity: novoExercicioSalvoNome.trim() ? 1 : .45 }}>Salvar exercício</button>
              <div style={{ gridColumn: "1 / -1", color: "#9E96AD", fontSize: 10 }}>O exercício será salvo diretamente em {grupoAtualCards.nome}.</div>
            </form>
            {salvosDoGrupo.length === 0 ? <div style={{ ...cardClean, textAlign: "center", padding: 20 }}><p style={labelMini}>Ainda não há exercícios salvos neste card. Você pode guardar um exercício acima ou usar “Salvar nos cards” na Biblioteca de Exercícios.</p></div> : <div style={{ display: "grid", gap: 9 }}>
              {salvosDoGrupo.map((item) => <div key={item.id} style={{ ...cardClean, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}><div style={{ minWidth: 0 }}><strong style={{ color: "#F1EEF7", fontSize: 14 }}>{item.nome}</strong>{item.equipamento && <div style={{ color: "#B9A8D2", fontSize: 10, marginTop: 4 }}>{item.equipamento}</div>}{item.instrucoes && <p style={{ color: "#AAA1B8", fontSize: 11, lineHeight: 1.5, margin: "6px 0 0" }}>{item.instrucoes}</p>}</div><button type="button" onClick={() => setExerciciosSalvosCards((prev) => prev.filter((x) => x.id !== item.id))} title="Remover dos cards" style={{ ...btnCarga, color: "#F19AAB", flexShrink: 0 }}>×</button></div>
                <button type="button" onClick={() => { setSubstituicaoCardAbertaId((atual) => atual === item.id ? null : item.id); setSubstituicaoCardAlvoId(""); }} style={{ ...btnSecundario, width: "100%", color: "#DCCCF5" }}>{substituicaoCardAbertaId === item.id ? "Fechar substituição" : "Substituir exercício do treino"}</button>
                {substituicaoCardAbertaId === item.id && <div style={{ display: "grid", gap: 8, padding: 10, borderRadius: 10, background: "rgba(199,169,239,.07)", border: "1px solid rgba(199,169,239,.16)" }}>
                  <label style={rotuloCampo}>Dia da semana</label>
                  <select value={diaMontagem} onChange={(e) => { setDiaMontagem(e.target.value); setSubstituicaoCardAlvoId(""); }} style={campoTexto}>{DIAS_SEMANA.map((dia) => <option key={dia.chave} value={dia.chave}>{dia.nome}</option>)}</select>
                  <label style={rotuloCampo}>Qual exercício deseja substituir?</label>
                  <select value={substituicaoCardAlvoId} onChange={(e) => setSubstituicaoCardAlvoId(e.target.value)} style={campoTexto}><option value="">Selecione um exercício do dia</option>{(rotina[diaMontagem] || []).map((alvo) => <option key={alvo.id} value={String(alvo.id)}>{alvo.nome}</option>)}</select>
                  <button type="button" disabled={!substituicaoCardAlvoId} onClick={() => substituirExercicioDaRotina(item, diaMontagem, (rotina[diaMontagem] || []).find((alvo) => String(alvo.id) === substituicaoCardAlvoId)?.id)} style={{ ...btnSecundario, background: "#C7A9EF", color: "#17131F", border: 0, opacity: substituicaoCardAlvoId ? 1 : .45 }}>Confirmar substituição</button>
                  <span style={{ color: "#9E96AD", fontSize: 10 }}>A troca mantém as séries, repetições, descanso, carga e histórico vinculado ao exercício da rotina.</span>
                </div>}
              </div>)}
            </div>}
          </div>}
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
        const tipoIlustracao = (nome) => {
          const n = nome.toLowerCase();
          if (/prancha|mountain climber|burpee|dead bug|bird dog|abdominal|elevação de pernas/.test(n)) return "core";
          if (/agachamento|leg press|avanço|afundo|step-up|cadeira extensora|mesa flexora|cadeira flexora|abdutora|adutora|panturrilha|coice/.test(n)) return "pernas";
          if (/terra|romeno|hip thrust|kettlebell swing/.test(n)) return "hinge";
          if (/rosca|bíceps/.test(n)) return "curl";
          if (/tríceps|mergulho/.test(n)) return "triceps";
          if (/elevação lateral|elevação frontal|desenvolvimento|encolhimento|face pull|crucifixo inverso/.test(n)) return "ombros";
          if (/remada|pullover/.test(n)) return "remada";
          if (/puxada|barra fixa/.test(n)) return "puxada";
          if (/supino|crucifixo|peck deck|flexão/.test(n)) return "empurrar";
          if (/bike|bicicleta/.test(n)) return "bike";
          if (/remo ergométrico/.test(n)) return "remo";
          if (/caminhada|polichinelo/.test(n)) return "cardio";
          if (/alongamento|mobilidade|rotação torácica/.test(n)) return "mobilidade";
          if (/elástico/.test(n)) return "elastico";
          return "geral";
        };
        const desenharExercicio = (exercicio, fase) => {
          const tipo = tipoIlustracao(exercicio[0]);
          const final = fase === "final";
          const pessoa = (tronco, braco1, braco2, perna1, perna2) => <g fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="88" cy="34" r="12" fill="#D9D2E5" stroke="none"/><path d={tronco} stroke="#D9D2E5" strokeWidth="13"/><path d={braco1} stroke="#D9D2E5" strokeWidth="9"/><path d={braco2} stroke="#D9D2E5" strokeWidth="9"/><path d={perna1} stroke="#D9D2E5" strokeWidth="10"/><path d={perna2} stroke="#D9D2E5" strokeWidth="10"/><path d="M77 52 Q88 47 99 52 L101 91 Q88 99 75 91Z" fill="#C7A9EF" stroke="none"/><path d="M79 58 Q88 53 97 58" stroke="#F0B8D0" strokeWidth="4"/></g>;
          let figura;
          if (tipo === "empurrar") figura = <>{/* banco e barra */}<path d="M22 139 H153 M39 139 V160 M140 139 V160" stroke="#9C8BB5" strokeWidth="5"/><path d="M37 119 L135 119" stroke="#9C8BB5" strokeWidth="7"/><path d="M49 114 L120 114" stroke="#D9D2E5" strokeWidth="10" strokeLinecap="round"/><circle cx="47" cy="105" r="10" fill="#D9D2E5"/><path d={final?"M56 105 L68 67 L108 67 L121 105":"M56 105 L70 88 L108 88 L121 105"} stroke="#D9D2E5" strokeWidth="9" fill="none" strokeLinecap="round"/><path d={final?"M70 67 L70 39 M108 67 L108 39":"M70 88 L55 64 M108 88 L124 64"} stroke="#D9D2E5" strokeWidth="8" strokeLinecap="round"/><path d={final?"M48 36 H130":"M48 61 H130"} stroke="#C7A9EF" strokeWidth="5"/><path d="M48 27 V45 M130 27 V45" stroke="#C7A9EF" strokeWidth="5"/></>;
          else if (tipo === "puxada") figura = <><path d="M35 18 V151 M35 18 H145 M145 18 V151" stroke="#9C8BB5" strokeWidth="5"/><path d="M88 22 V48" stroke="#C7A9EF" strokeWidth="4"/><circle cx="88" cy="56" r="11" fill="#D9D2E5"/><path d={`M88 68 V113 M88 78 L60 ${final ? 90 : 52} M88 78 L116 ${final ? 90 : 52} M88 113 L70 151 M88 113 L106 151`} stroke="#D9D2E5" strokeWidth="9" strokeLinecap="round"/><path d={final?"M60 90 L60 42 M116 90 L116 42":"M60 52 L60 36 M116 52 L116 36"} stroke="#D9D2E5" strokeWidth="8" strokeLinecap="round"/><path d={final?"M48 43 H128":"M48 30 H128"} stroke="#C7A9EF" strokeWidth="5"/></>;
          else if (tipo === "remada") figura = <><path d="M25 151 H155 M48 151 V164" stroke="#9C8BB5" strokeWidth="5"/><circle cx="91" cy="57" r="11" fill="#D9D2E5"/><path d="M88 69 L70 111 L112 120 M70 111 L48 148 M112 120 L139 145" stroke="#D9D2E5" strokeWidth="12" fill="none" strokeLinecap="round"/><path d={final?"M78 91 L105 105 L132 108":"M78 91 L54 122 L36 128"} stroke="#D9D2E5" strokeWidth="9" fill="none" strokeLinecap="round"/><path d={final?"M130 108 L151 108":"M36 128 L20 128"} stroke="#C7A9EF" strokeWidth="5"/><path d="M20 128 H30 M145 108 H155" stroke="#C7A9EF" strokeWidth="4"/></>;
          else if (tipo === "ombros") figura = <>{pessoa("M88 48 L88 105",final?"M78 60 L48 23":"M78 60 L45 88",final?"M98 60 L128 23":"M98 60 L131 88","M82 105 L68 151","M94 105 L108 151")}<path d={final?"M48 23 L48 8 M128 23 L128 8":"M45 88 L36 101 M131 88 L140 101"} stroke="#C7A9EF" strokeWidth="5"/><path d="M35 10 H61 M115 10 H141" stroke="#C7A9EF" strokeWidth="4"/></>;
          else if (tipo === "curl") figura = <>{pessoa("M88 48 L88 105", final ? "M78 60 L62 88 L62 51" : "M78 60 L62 88 L62 119", final ? "M98 60 L114 88 L114 51" : "M98 60 L114 88 L114 119", "M82 105 L68 151", "M94 105 L108 151")}<path d={final?"M62 51 H114":"M62 119 H114"} stroke="#C7A9EF" strokeWidth="5"/><path d="M58 45 V57 M118 45 V57" stroke="#C7A9EF" strokeWidth="4"/></>;
          else if (tipo === "triceps") figura = <>{pessoa("M88 48 L88 105",final?"M78 60 L69 20":"M78 60 L62 87",final?"M98 60 L107 20":"M98 60 L114 87","M82 105 L68 151","M94 105 L108 151")}<path d={final?"M69 20 L69 7 M107 20 L107 7":"M62 87 L62 125 M114 87 L114 125"} stroke="#D9D2E5" strokeWidth="8"/><path d="M58 7 H120" stroke="#C7A9EF" strokeWidth="5"/></>;
          else if (tipo === "pernas") figura = <><path d="M22 162 H158" stroke="#9C8BB5" strokeWidth="4"/><circle cx="88" cy="35" r="12" fill="#D9D2E5"/><path d="M88 48 L88 98" stroke="#D9D2E5" strokeWidth="14" strokeLinecap="round"/><path d={final?"M88 98 L59 132 L48 160":"M88 98 L68 125 L72 160"} stroke="#D9D2E5" strokeWidth="11" strokeLinecap="round"/><path d={final?"M88 98 L118 132 L130 160":"M88 98 L111 122 L105 160"} stroke="#D9D2E5" strokeWidth="11" strokeLinecap="round"/><path d={final?"M88 57 L62 75 L48 89 M88 57 L113 75 L128 89":"M88 57 L68 82 L56 98 M88 57 L108 82 L120 98"} stroke="#D9D2E5" strokeWidth="8" strokeLinecap="round"/><path d={final?"M44 163 H135":"M44 163 H135"} stroke="#C7A9EF" strokeWidth="4"/><path d="M145 35 V145 M138 42 L145 35 L152 42" stroke="#C7A9EF" strokeWidth="3"/></>;
          else if (tipo === "hinge") figura = <><circle cx="88" cy="45" r="12" fill="#D9D2E5"/><path d={final?"M88 58 L88 105":"M88 58 L116 103"} stroke="#D9D2E5" strokeWidth="14" strokeLinecap="round"/><path d={final?"M88 105 L69 151 M88 105 L108 151":"M116 103 L93 151 M116 103 L139 151"} stroke="#D9D2E5" strokeWidth="11" strokeLinecap="round"/><path d={final?"M78 70 L62 98 L62 122 M98 70 L114 98 L114 122":"M105 69 L79 103 L65 126 M119 75 L139 108 L144 130"} stroke="#D9D2E5" strokeWidth="9" strokeLinecap="round"/><path d={final?"M57 123 H119":"M59 129 H151"} stroke="#C7A9EF" strokeWidth="6"/><path d="M22 162 H158" stroke="#9C8BB5" strokeWidth="4"/></>;
          else if (tipo === "core") figura = <><path d="M20 151 H160" stroke="#9C8BB5" strokeWidth="4"/><circle cx="42" cy="94" r="11" fill="#D9D2E5"/><path d={/prancha|mountain climber|burpee/i.test(exercicio[0])?"M53 96 L104 112 L145 130":"M53 96 L92 105 L124 119"} stroke="#D9D2E5" strokeWidth="14" strokeLinecap="round"/><path d={final?"M75 103 L64 139 L43 149 M104 112 L125 139 L147 149":"M75 103 L83 140 L65 151 M104 112 L123 140 L143 151"} stroke="#D9D2E5" strokeWidth="10" strokeLinecap="round"/><path d={final?"M70 91 Q90 72 110 91":"M70 91 Q90 111 110 91"} stroke="#C7A9EF" strokeWidth="4" fill="none"/></>;
          else if (tipo === "bike") figura = <><circle cx="48" cy="143" r="25" fill="none" stroke="#9C8BB5" strokeWidth="5"/><circle cx="132" cy="143" r="25" fill="none" stroke="#9C8BB5" strokeWidth="5"/><path d="M48 143 L76 105 L104 143 L48 143 M76 105 L132 143 M76 105 L91 80" stroke="#9C8BB5" strokeWidth="5" fill="none"/><circle cx="91" cy="49" r="11" fill="#D9D2E5"/><path d="M91 61 L82 96 L108 111 M82 96 L65 111 M108 111 L119 132" stroke="#D9D2E5" strokeWidth="10" fill="none" strokeLinecap="round"/></>;
          else if (tipo === "remo") figura = <><path d="M22 151 H158 M43 139 H135" stroke="#9C8BB5" strokeWidth="5"/><circle cx="112" cy="52" r="11" fill="#D9D2E5"/><path d={final?"M108 64 L79 105 L54 132":"M108 64 L95 105 L54 132"} stroke="#D9D2E5" strokeWidth="13" fill="none" strokeLinecap="round"/><path d="M90 81 L63 112 L42 118 M90 81 L122 106 L145 115" stroke="#D9D2E5" strokeWidth="8" fill="none" strokeLinecap="round"/><path d="M42 118 L23 118" stroke="#C7A9EF" strokeWidth="5"/></>;
          else if (tipo === "mobilidade") figura = <><circle cx="88" cy="48" r="11" fill="#D9D2E5"/><path d="M88 60 L88 105 M88 74 L58 91 L43 78 M88 74 L118 91 L133 78 M88 105 L68 148 M88 105 L108 148" stroke="#D9D2E5" strokeWidth="10" fill="none" strokeLinecap="round"/><path d={final?"M88 74 L54 43 M88 74 L122 43":"M88 74 L65 58 M88 74 L111 58"} stroke="#C7A9EF" strokeWidth="5" strokeLinecap="round"/><path d="M30 160 H146" stroke="#9C8BB5" strokeWidth="4"/></>;
          else if (tipo === "elastico") figura = <>{pessoa("M88 48 L88 105","M78 60 L53 86","M98 60 L123 86","M82 105 L68 151","M94 105 L108 151")}<path d={final?"M53 86 Q88 28 123 86":"M53 86 Q88 110 123 86"} stroke="#F0B8D0" strokeWidth="4" fill="none"/><path d="M28 86 H48 M128 86 H148" stroke="#9C8BB5" strokeWidth="5"/></>;
          else figura = <>{pessoa("M88 48 L88 105","M78 60 L55 86","M98 60 L121 86","M82 105 L68 151","M94 105 L108 151")}<path d="M35 163 H141" stroke="#9C8BB5" strokeWidth="4"/><path d={final?"M125 70 L145 48":"M125 70 L145 90"} stroke="#C7A9EF" strokeWidth="4" fill="none"/></>;
          return <svg viewBox="0 0 180 190" role="img" aria-label={`${exercicio[0]} — ${fase === "inicial" ? "posição inicial" : "execução"}`} style={{ width: "100%", height: 180 }}>{figura}</svg>;
        };
        const filtrados = biblioteca.filter((e) => e.join(" ").toLowerCase().includes(buscaBiblioteca.toLowerCase()));
        return <div style={{ display: "grid", gap: 12 }}><div style={{ ...cardClean, background: "rgba(44,67,96,.48)", border: "1px solid rgba(96,165,250,.22)", backdropFilter: "blur(16px)" }}><h2 style={{ margin: "0 0 6px", fontSize: 19 }}>{textoUi('Biblioteca de exercícios', 'Exercise library')}</h2><p style={labelMini}>{textoUi("Referência rápida de grupos musculares e execução. Ajuste exercícios à sua condição e orientação profissional.", "Quick reference for muscle groups and exercise form. Adapt exercises to your condition and professional guidance.")}</p><input value={buscaBiblioteca} onChange={(e) => setBuscaBiblioteca(e.target.value)} placeholder={textoUi("Buscar exercício ou grupo muscular...", "Search exercise or muscle group...")} style={campoTexto}/></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>{filtrados.map((e) => <div key={e[0]} style={{ ...cardClean, background: "rgba(44,67,96,.48)", border: "1px solid rgba(96,165,250,.18)", backdropFilter: "blur(14px)" }}><div style={{ color: "#D6C4F1", fontSize: 10, fontWeight: 800, letterSpacing: ".08em" }}>{e[1].toUpperCase()}</div><strong style={{ display: "block", margin: "6px 0", fontSize: 14 }}>{e[0]}</strong><div style={{ color: "#D6C4F1", fontSize: 10, marginBottom: 7 }}>Equipamento: {e[2]}</div><p style={{ color: "#AAA1B8", fontSize: 12, lineHeight: 1.55, margin: 0 }}>{e[3]}</p><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 12 }}><button type="button" onClick={() => setExercicioDemonstracaoAberto(e)} style={{ minHeight: 36, borderRadius: 10, border: "1px solid rgba(199,169,239,.34)", background: "rgba(199,169,239,.12)", color: "#DCCAF5", fontSize: 11, fontWeight: 850, letterSpacing: ".12em", cursor: "pointer" }}>VER</button><button type="button" onClick={() => salvarExercicioNosCards({ nome: e[0], grupo: e[1], equipamento: e[2], instrucoes: e[3] })} style={{ minHeight: 36, borderRadius: 10, border: "1px solid rgba(157,223,200,.3)", background: "rgba(157,223,200,.1)", color: "#B7EBD0", fontSize: 10, fontWeight: 800, cursor: "pointer" }}>SALVAR NOS CARDS</button></div></div>)}</div>{!filtrados.length && <p style={labelMini}>{textoUi('Nenhum exercício encontrado.', 'No exercises found.')}</p>}{exercicioDemonstracaoAberto && <div role="presentation" onClick={() => setExercicioDemonstracaoAberto(null)} style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(5,7,13,.82)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}><section role="dialog" aria-modal="true" aria-label={`Demonstração: ${exercicioDemonstracaoAberto[0]}`} onClick={(ev) => ev.stopPropagation()} style={{ width: "min(100%, 620px)", maxHeight: "min(88vh, 760px)", overflowY: "auto", borderRadius: 22, padding: 20, background: "linear-gradient(145deg, rgba(35,33,46,.98), rgba(17,20,30,.98))", border: "1px solid rgba(199,169,239,.28)", boxShadow: "0 24px 80px rgba(0,0,0,.5)" }}><div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}><div><div style={{ color: "#C7A9EF", fontSize: 10, fontWeight: 850, letterSpacing: ".16em" }}>GUIA VISUAL DO EXERCÍCIO</div><h2 style={{ margin: "7px 0 4px", fontSize: 21, color: "#F4EFFB" }}>{exercicioDemonstracaoAberto[0]}</h2><div style={{ color: "#B9A8D2", fontSize: 12 }}>{exercicioDemonstracaoAberto[1]} • {exercicioDemonstracaoAberto[2]}</div></div><button type="button" onClick={() => setExercicioDemonstracaoAberto(null)} aria-label="Fechar demonstração" style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(199,169,239,.24)", background: "rgba(255,255,255,.06)", color: "#F4EFFB", fontSize: 20, cursor: "pointer" }}>×</button></div><div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}><div style={{ borderRadius: 16, padding: 12, background: "linear-gradient(180deg, rgba(199,169,239,.12), rgba(255,255,255,.025))", border: "1px solid rgba(199,169,239,.16)" }}><div style={{ fontSize: 10, fontWeight: 850, color: "#DCCAF5", letterSpacing: ".12em", marginBottom: 8 }}>01 • POSIÇÃO INICIAL</div>{desenharExercicio(exercicioDemonstracaoAberto, "inicial")}<div style={{ textAlign: "center", fontSize: 10, color: "#AAA1B8" }}>Prepare a postura e estabilize o corpo</div></div><div style={{ borderRadius: 16, padding: 12, background: "linear-gradient(180deg, rgba(199,169,239,.12), rgba(255,255,255,.025))", border: "1px solid rgba(199,169,239,.16)" }}><div style={{ fontSize: 10, fontWeight: 850, color: "#DCCAF5", letterSpacing: ".12em", marginBottom: 8 }}>02 • EXECUÇÃO</div>{desenharExercicio(exercicioDemonstracaoAberto, "final")}<div style={{ textAlign: "center", fontSize: 10, color: "#AAA1B8" }}>Execute o movimento com controle</div></div></div><div style={{ marginTop: 14, borderRadius: 14, padding: 14, background: "rgba(255,255,255,.04)", border: "1px solid rgba(199,169,239,.12)" }}><div style={{ color: "#DCCAF5", fontSize: 10, fontWeight: 850, letterSpacing: ".12em", marginBottom: 6 }}>ORIENTAÇÃO DE EXECUÇÃO</div><p style={{ margin: 0, color: "#D2CADB", fontSize: 13, lineHeight: 1.65 }}>{exercicioDemonstracaoAberto[3]}</p></div><p style={{ margin: "12px 2px 0", color: "#93899F", fontSize: 10, lineHeight: 1.5 }}>Ilustrações específicas por família de movimento, com posições inicial e final. Ajuste a amplitude e a carga à sua capacidade e priorize a execução segura.</p><button type="button" onClick={() => setExercicioDemonstracaoAberto(null)} style={{ marginTop: 14, width: "100%", minHeight: 42, borderRadius: 12, border: 0, background: "#C7A9EF", color: "#17131F", fontWeight: 850, cursor: "pointer" }}>FECHAR</button></section></div>}</div>;
      })()}

      {abaAtiva === "conquistas" && <div style={{ display: "grid", gap: 12 }}><div style={{ ...cardClean, background: "rgba(44,67,96,.48)", border: "1px solid rgba(96,165,250,.22)", backdropFilter: "blur(16px)" }}><h2 style={{ margin: "0 0 6px", fontSize: 19 }}>{textoUi("Suas conquistas", "Your achievements")}</h2><p style={labelMini}>{textoUi("Marcos calculados a partir dos registros existentes.", "Milestones calculated from existing records.")}</p></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>{[{n:"Primeiro recorde",ok:registrosPR.length>=1,d:"Registre seu primeiro PR"},{n:"Colecionador",ok:registrosPR.length>=5,d:"Registre 5 recordes"},{n:"Acompanhamento",ok:medidasCorporais.length>=3,d:"Registre 3 medições"},{n:"Planejador",ok:metasPessoais.length>=3,d:"Crie 3 metas pessoais"},{n:"Hidratação",ok:Object.keys(aguaPorData||{}).length>=7,d:"Registre água em 7 dias"},{n:"Constância",ok:Object.keys(logsPorData||{}).length>=10,d:"Tenha registros em 10 dias"}].map((x)=><div key={x.n} style={{ ...cardClean, background:x.ok?"rgba(59,130,246,.18)":"rgba(44,67,96,.38)", border:`1px solid ${x.ok?"rgba(96,165,250,.45)":"rgba(148,190,215,.14)"}` }}><div style={{fontSize:24,marginBottom:8}}>{x.ok?"🏆":"◇"}</div><strong style={{fontSize:13}}>{textoUi(x.n, ({"Primeiro recorde":"First record","Colecionador":"Collector","Acompanhamento":"Tracking","Planejador":"Planner","Hidratação":"Hydration","Constância":"Consistency"}[x.n] || x.n))}</strong><div style={{fontSize:11,color:"#AAA1B8",marginTop:5}}>{x.ok ? textoUi("Conquistado", "Achieved") : textoUi(x.d, ({"Registre seu primeiro PR":"Log your first personal record","Registre 5 recordes":"Log 5 personal records","Registre 3 medições":"Log 3 measurements","Crie 3 metas pessoais":"Create 3 personal goals","Registre água em 7 dias":"Log water on 7 days","Tenha registros em 10 dias":"Log activity on 10 days"}[x.d] || x.d))}</div></div>)}</div></div>}

      {abaAtiva === "relatorios" && (() => {
        const cardRel = { ...cardClean, background: "rgba(44,67,96,.46)", border: "1px solid rgba(96,165,250,.20)", backdropFilter: "blur(14px)", display: "grid", gap: 10 };
        const diasTreino = Object.keys(logsPorData || {}).length;
        const diasAgua = Object.keys(aguaPorData || {}).length;
        const totalAgua = Object.values(aguaPorData || {}).reduce((a,v)=>a+(Number(typeof v === "object" ? v?.total ?? v?.ml ?? 0 : v)||0),0);
        const refeicoesTotal = Object.values(refeicoesFeitasPorData || {}).reduce((a,v)=>a+(Array.isArray(v)?v.length:Object.values(v||{}).filter(Boolean).length),0);
        const cards = [{n:"Dias com registros de treino",v:diasTreino},{n:"Dias com hidratação",v:diasAgua},{n:"Água acumulada registrada",v:`${totalAgua.toLocaleString("pt-BR")} ml`},{n:"Recordes pessoais",v:registrosPR.length},{n:"Medições corporais",v:medidasCorporais.length},{n:"Metas concluídas",v:metasPessoais.filter(m=>m.concluida).length},{n:"Metas em andamento",v:metasPessoais.filter(m=>!m.concluida).length},{n:"Refeições marcadas",v:refeicoesTotal},{n:"Suplementos cadastrados",v:(suplementos||[]).length},{n:"Dias com cardio",v:Object.keys(cardioPorData||{}).length},{n:"Dias com sono registrado",v:Object.keys(sonoPorData||{}).length},{n:"Dias com mochila",v:Object.keys(mochilaMarcadaPorData||{}).length}];
        const chart=(titulo,dados,unidade="",cor="#B99AE7")=>{const xs=(dados||[]).filter(x=>Number.isFinite(Number(x.valor)));const max=Math.max(1,...xs.map(x=>Number(x.valor)));return <div style={cardRel}><strong style={{fontSize:13}}>{titulo}</strong>{xs.length?<div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(xs.length,10)},minmax(0,1fr))`,gap:6,alignItems:"end",minHeight:125}}>{xs.slice(-10).map((x,i)=><div key={`${x.rotulo}-${i}`} style={{display:"grid",gap:5,justifyItems:"center",minWidth:0}}><b style={{fontSize:9}}>{Number(x.valor).toLocaleString("pt-BR")}{unidade}</b><div style={{height:76,width:"100%",maxWidth:32,background:"rgba(148,163,184,.12)",borderRadius:6,display:"flex",alignItems:"end",overflow:"hidden"}}><div style={{height:`${Math.max(3,Number(x.valor)/max*100)}%`,width:"100%",background:cor}}/></div><span style={{fontSize:9,color:"#AAA1B8",textAlign:"center"}}>{x.rotulo}</span></div>)}</div>:<span style={labelMini}>{textoUi('Sem dados suficientes para gerar este gráfico.', 'Not enough data to generate this chart.')}</span>}</div>};
        const med=medidasCorporais.slice().sort((a,b)=>(a.data||"").localeCompare(b.data||""));
        const pr=registrosPR.slice().sort((a,b)=>(a.data||"").localeCompare(b.data||""));
        const atividade=dashboardData.atividade7Dias||[];
        return <div style={{display:"grid",gap:14}}><div style={cardRel}><div style={{color:"#D6C4F1",fontSize:10,fontWeight:800,letterSpacing:".12em"}}>{textoUi('CAVEIRA APP • RELATÓRIO COMPLETO', 'CAVEIRA APP • FULL REPORT')}</div><h2 style={{margin:0,fontSize:21}}>{textoUi('Relatório geral de desempenho', 'Overall performance report')}</h2><p style={{...labelMini,margin:0}}>{textoUi("Consolidação dos dados disponíveis na sua conta. Períodos sem registro não são estimados nem preenchidos artificialmente.", "Summary of data available in your account. Periods without records are not estimated or artificially filled.")}</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(135px,1fr))",gap:9}}>{cards.map(x=><div key={x.n} style={{...cardClean,minWidth:0}}><div style={labelMini}>{x.n}</div><strong style={{fontSize:20,color:"#E4D8F7"}}>{x.v}</strong></div>)}</div><button type="button" onClick={()=>window.print()} style={{...btnSecundario,flex:"none",maxWidth:240,background:"#A98BDD",color:"#15131C",border:0,fontWeight:800}}>{textoUi('Imprimir / Salvar relatório em PDF', 'Print / Save report as PDF')}</button></div>
          <h3 style={{margin:"2px 0 -5px",fontSize:16}}>{textoUi('Gráficos de desempenho', 'Performance charts')}</h3><div style={{display:"grid",gridTemplateColumns:ehDesktop?"repeat(2,minmax(0,1fr))":"1fr",gap:10}}>{chart(textoUi("Recordes pessoais — cargas registradas", "Personal records — logged weights"),pr.slice(-10).map(x=>({rotulo:(x.exercicio||"PR").slice(0,9),valor:Number(x.carga)}))," kg","#B99AE7")}{chart(textoUi("Cargas dos treinos registrados", "Weights from logged workouts"),(dashboardData.historico||[]).slice(-10).map(x=>({rotulo:(x.dataISO||x.nome||"Treino").slice(5,10),valor:Number(x.carga)||0}))," kg","#B89AE7")}{chart(textoUi("Peso corporal", "Body weight"),med.filter(x=>x.peso).map(x=>({rotulo:x.data?.slice(5)||"Data",valor:Number(x.peso)}))," kg","#C4A5EC")}{chart(textoUi("Cintura", "Waist"),med.filter(x=>x.cintura).map(x=>({rotulo:x.data?.slice(5)||"Data",valor:Number(x.cintura)}))," cm","#a78bfa")}{chart(textoUi("Peito", "Chest"),med.filter(x=>x.peito).map(x=>({rotulo:x.data?.slice(5)||"Data",valor:Number(x.peito)}))," cm","#9DDFC8")}{chart(textoUi("Hidratação — últimos 7 dias", "Hydration — last 7 days"),(dashboardData.agua7Dias||[]).map(x=>({rotulo:x.rotulo,valor:Number(x.ml)||0}))," ml","#C4A5EC")}{chart(textoUi("Volume de treino — últimos 7 dias", "Workout volume — last 7 days"),atividade.map(x=>({rotulo:x.rotulo,valor:Number(x.volumeKg)||0}))," kg","#E6C17C")}{chart(textoUi("Cardio — últimos 7 dias", "Cardio — last 7 days"),atividade.map(x=>({rotulo:x.rotulo,valor:Number(x.cardioMin)||0}))," min","#a78bfa")}{chart(textoUi("Tempo ativo — últimos 7 dias", "Active time — last 7 days"),atividade.map(x=>({rotulo:x.rotulo,valor:Number(x.duracaoMin)||0}))," min","#9DDFC8")}{chart(textoUi("Refeições marcadas — últimos 7 dias", "Meals logged — last 7 days"),atividade.map(x=>({rotulo:x.rotulo,valor:Number(x.refeicoes)||0})),"","#E9B18D")}{chart(textoUi("Cafeína registrada — últimos 7 dias", "Caffeine logged — last 7 days"),atividade.map(x=>({rotulo:x.rotulo,valor:Number(x.cafeina)||0})),"","#E9C987")}{chart(textoUi("Mochila — percentual de preparo", "Gear checklist completion"),atividade.map(x=>({rotulo:x.rotulo,valor:Number(x.mochilaPct)||0})),"%","#B99AE7")}{chart(textoUi("Dias com treino — últimos 7 dias", "Workout days — last 7 days"),atividade.map(x=>({rotulo:x.rotulo,valor:x.treino?1:0})),"","#9DDFC8")}</div>
          <div style={cardRel}><h3 style={{margin:0,fontSize:14}}>{textoUi('Histórico de recordes', 'Personal records history')}</h3>{pr.length?pr.map(x=><div key={x.id} style={{display:"flex",justifyContent:"space-between",gap:8,borderTop:"1px solid rgba(148,190,215,.12)",paddingTop:7,fontSize:11}}><span>{x.data} • {x.exercicio}</span><strong>{x.carga} kg</strong></div>):<span style={labelMini}>{textoUi("Nenhum recorde cadastrado.", "No records added.")}</span>}</div>
          <div style={cardRel}><h3 style={{margin:0,fontSize:14}}>{textoUi('Histórico de medidas corporais', 'Body measurements history')}</h3>{med.length?med.map(x=><div key={x.id} style={{borderTop:"1px solid rgba(148,190,215,.12)",paddingTop:7,fontSize:11}}>{x.data} • {x.peso?`Peso ${x.peso} kg`:""} {x.cintura?`• Cintura ${x.cintura} cm`:""} {x.peito?`• Peito ${x.peito} cm`:""}</div>):<span style={labelMini}>{textoUi('Nenhuma medição cadastrada.', 'No measurements recorded.')}</span>}</div>
          <div style={cardRel}><h3 style={{margin:0,fontSize:14}}>{textoUi("Metas pessoais", "Personal goals")}</h3>{metasPessoais.length?metasPessoais.map(m=><div key={m.id} style={{display:"flex",justifyContent:"space-between",gap:8,borderTop:"1px solid rgba(148,190,215,.12)",paddingTop:7,fontSize:11}}><span>{m.nome}{m.alvo?` — ${m.alvo}`:""}</span><strong style={{color:m.concluida?"#B7EBD0":"#D6C4F1"}}>{m.concluida?"Concluída":"Em andamento"}</strong></div>):<span style={labelMini}>{textoUi("Nenhuma meta cadastrada.", "No goals added.")}</span>}</div>
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
          background: "rgba(28, 27, 34, 0.88)",
          borderTop: "1px solid rgba(190, 170, 225, 0.15)",
          padding: "8px 12px",
          boxSizing: "border-box",
          transition: "max-width 0.2s ease",
        }}
      >
        {[
          { id: "hoje", rotulo: textoUi("Hoje", "Today") },
          { id: "montar", rotulo: textoUi("Montar", "Build") },
          { id: "timer", rotulo: textoUi("Timer", "Timer") },
          { id: "dashboard", rotulo: textoUi("Dashboard", "Dashboard") },
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
                background: ativa ? "#282432" : "transparent",
                color: ativa ? "#F1EEF7" : "#9E96AD",
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
  color: "#9E96AD",
  padding: "0 10px 7px",
  fontWeight: 600,
};

const btnMenu = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  textAlign: "left",
  padding: "10px 12px",
  borderRadius: "9px",
  border: "1px solid transparent",
  background: "transparent",
  color: "#aab2bf",
  fontSize: "13px",
  fontWeight: 400,
  letterSpacing: "0.01em",
  cursor: "pointer",
  gap: "12px",
  flexShrink: 0,
  transition: "background .18s ease, color .18s ease, border-color .18s ease, box-shadow .18s ease",
};

const estiloMenuAtivo = (pagina, paginaAtiva) => ({
  ...btnMenu,
  background: paginaAtiva === pagina ? "#252833" : "transparent",
  color: paginaAtiva === pagina ? "#f2f4f8" : "#aab2bf",
  border: paginaAtiva === pagina ? "1px solid rgba(255,255,255,.035)" : "1px solid transparent",
  borderLeft: "1px solid transparent",
  boxShadow: paginaAtiva === pagina ? "inset 0 0 18px rgba(197,178,255,.035)" : "none",
  fontWeight: paginaAtiva === pagina ? 650 : 400,
});

const btnCarga = {
  width: "22px",
  height: "22px",
  borderRadius: "6px",
  border: "1px solid rgba(190, 170, 225, 0.19)",
  background: "rgba(29, 27, 39, 0.72)",
  color: "#F1EEF7",
  cursor: "pointer",
  fontSize: "12px",
  flexShrink: 0,
};

const btnSecundario = {
  flex: 1,
  padding: "8px",
  borderRadius: "8px",
  border: "1px solid rgba(190, 170, 225, 0.19)",
  background: "rgba(29, 27, 39, 0.72)",
  color: "#F1EEF7",
  fontSize: "12px",
  cursor: "pointer",
};

const rotuloCampo = {
  display: "block",
  fontSize: "11px",
  fontWeight: 300,
  color: "#BEB7CA",
  marginBottom: "5px",
  letterSpacing: "0.02em",
};

const campoTexto = {
  width: "100%",
  padding: "9px 10px",
  borderRadius: "8px",
  border: "1px solid rgba(190, 170, 225, 0.15)",
  background: "rgba(29, 27, 39, 0.72)",
  color: "#F1EEF7",
  fontSize: "12px",
  boxSizing: "border-box",
};

const cardClean = {
  padding: "14px",
  borderRadius: "14px",
  background: "rgba(35, 32, 46, 0.76)",
  border: "1px solid rgba(190, 170, 225, 0.13)",
};

const labelMini = {
  fontSize: "11px",
  color: "#9E96AD",
};

const valorMini = {
  fontSize: "16px",
  fontWeight: 700,
  marginTop: "3px",
};
