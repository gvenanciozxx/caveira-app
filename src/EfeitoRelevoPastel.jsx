import { useEffect, useRef } from "react";

export default function EfeitoRelevoPastel({ modo = "aberto" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animId;
    let tempo = 0;

    // Micro-pontos sutis de textura tátil
    const padraoPontos = document.createElement("canvas");
    padraoPontos.width = 4;
    padraoPontos.height = 4;
    const pctx = padraoPontos.getContext("2d");
    pctx.fillStyle = "rgba(15, 15, 20, 0.12)";
    pctx.fillRect(0, 0, 1.2, 1.2);
    pctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    pctx.fillRect(2.5, 2.5, 1, 1);

    function ajustarTamanho() {
      const pai = canvas.parentElement;
      if (!pai) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const largura = Math.max(1, pai.clientWidth);
      const altura = Math.max(1, pai.clientHeight);
      canvas.width = Math.floor(largura * dpr);
      canvas.height = Math.floor(altura * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    ajustarTamanho();
    window.addEventListener("resize", ajustarTamanho);

    function desenhar() {
      const pai = canvas.parentElement;
      if (!pai) return;
      const w = pai.clientWidth;
      const h = pai.clientHeight;

      tempo += 0.014;
      ctx.clearRect(0, 0, w, h);

      // Fundo base na tonalidade ligeiramente mais escura da barra lateral Premium
      ctx.fillStyle = "#1B293C";
      ctx.fillRect(0, 0, w, h);

      // Calcula a borda esquerda/superior da escultura que sobe em diagonal e ondas
      const passos = Math.max(32, Math.floor(h / 8));
      const pontosBorda = [];

      for (let i = 0; i <= passos; i++) {
        const ny = i / passos; // 0 (topo) -> 1 (base)
        const y = ny * h;

        // Sobe mais alto na direita e desce para a esquerda, com curvas suaves em ondas
        const baseX =
          w * (1.08 - ny * 0.92) +
          Math.sin(ny * Math.PI * 3.2 + tempo) * (w * 0.11) +
          Math.cos(ny * Math.PI * 1.8 - tempo * 0.75) * (w * 0.06);

        pontosBorda.push({ x: Math.max(0, Math.min(w, baseX)), y, ny });
      }

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pontosBorda[0].x, pontosBorda[0].y);
      for (let i = 1; i < pontosBorda.length; i++) {
        ctx.lineTo(pontosBorda[i].x, pontosBorda[i].y);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(w, 0);
      ctx.closePath();
      ctx.clip();

      // Gradiente pastel rico e vibrante (rosa, pêssego, amarelo, menta, azul-bebê, lilás)
      const gradPastel = ctx.createLinearGradient(0, h, w, 0);
      gradPastel.addColorStop(0.0, "#f472b6");
      gradPastel.addColorStop(0.2, "#fb923c");
      gradPastel.addColorStop(0.42, "#fde047");
      gradPastel.addColorStop(0.64, "#6ee7b7");
      gradPastel.addColorStop(0.83, "#7dd3fc");
      gradPastel.addColorStop(1.0, "#c4b5fd");

      ctx.fillStyle = gradPastel;
      ctx.fillRect(0, 0, w, h);

      // Dobras/ondas internas com alto relevo 3D (luz clara + sombra profunda)
      const dobras = 6;
      for (let d = 0; d < dobras; d++) {
        const offsetBase = (h / dobras) * d;
        const amp = Math.max(14, h * 0.065);

        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let p = 0; p <= 40; p++) {
          const nx = p / 40;
          const x = nx * w;
          const y =
            offsetBase +
            Math.sin(nx * Math.PI * 2.2 + tempo + d * 1.15) * amp +
            Math.cos(nx * Math.PI * 1.4 - tempo * 0.8 + d) * (amp * 0.5);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();

        const gradDobra = ctx.createLinearGradient(0, offsetBase - amp, 0, offsetBase + amp * 2.5);
        gradDobra.addColorStop(0, "rgba(255, 255, 255, 0.42)");
        gradDobra.addColorStop(0.45, "rgba(255, 255, 255, 0.05)");
        gradDobra.addColorStop(1, "rgba(10, 10, 14, 0.34)");

        ctx.fillStyle = gradDobra;
        ctx.fill();

        // Linha de destaque na crista da onda
        ctx.beginPath();
        for (let p = 0; p <= 40; p++) {
          const nx = p / 40;
          const x = nx * w;
          const y =
            offsetBase +
            Math.sin(nx * Math.PI * 2.2 + tempo + d * 1.15) * amp +
            Math.cos(nx * Math.PI * 1.4 - tempo * 0.8 + d) * (amp * 0.5);
          if (p === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(255, 255, 255, 0.52)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Luz direcional lateral para dar volume 3D escultórico
      const luzLateral = ctx.createLinearGradient(0, 0, w, h);
      luzLateral.addColorStop(0, "rgba(255, 255, 255, 0.28)");
      luzLateral.addColorStop(0.5, "rgba(255, 255, 255, 0.0)");
      luzLateral.addColorStop(1, "rgba(0, 0, 0, 0.24)");
      ctx.fillStyle = luzLateral;
      ctx.fillRect(0, 0, w, h);

      // Micro-pontos discretos por cima da escultura
      const pattern = ctx.createPattern(padraoPontos, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.restore();

      // Contorno suave na borda esculpida
      ctx.beginPath();
      ctx.moveTo(pontosBorda[0].x, pontosBorda[0].y);
      for (let i = 1; i < pontosBorda.length; i++) {
        ctx.lineTo(pontosBorda[i].x, pontosBorda[i].y);
      }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = modo === "linha" ? 2 : 1.6;
      ctx.stroke();

      animId = requestAnimationFrame(desenhar);
    }

    desenhar();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", ajustarTamanho);
    };
  }, [modo]);

  const ehLinha = modo === "linha";

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
        boxShadow: ehLinha ? "1px 0 10px rgba(244, 114, 182, 0.35)" : "none",
      }}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
