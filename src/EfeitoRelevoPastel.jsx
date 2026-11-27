
import { useEffect, useRef } from "react";

export default function EfeitoRelevoPastel({ modo = "aberto", tema = "escuro" }) {
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

    pctx.fillStyle = tema === "claro" ? "rgba(90, 70, 120, 0.10)" : "rgba(0, 0, 0, 0.20)";
    pctx.fillRect(0, 0, 1.2, 1.2);
    pctx.fillStyle = tema === "claro" ? "rgba(255, 255, 255, 0.42)" : "rgba(197, 178, 255, 0.12)";
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

      // Fundo preto grafite
      ctx.fillStyle = "#090a0e";
      ctx.fillRect(0, 0, w, h);

      // Calcula a borda esquerda/superior da escultura
      const passos = Math.max(32, Math.floor(h / 8));
      const pontosBorda = [];

      for (let i = 0; i <= passos; i++) {
        const ny = i / passos;
        const y = ny * h;

        const baseX =
          w * (1.08 - ny * 0.92) +
          Math.sin(ny * Math.PI * 3.2 + tempo) * (w * 0.11) +
          Math.cos(ny * Math.PI * 1.8 - tempo * 0.75) * (w * 0.06);

        pontosBorda.push({
          x: Math.max(0, Math.min(w, baseX)),
          y,
          ny,
        });
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

      // Paleta separada por tema; a pintura do Canvas não é controlada por CSS.
      const gradPastel = ctx.createLinearGradient(0, h, w, 0);
      if (tema === "claro") {
        gradPastel.addColorStop(0.0, "#F8F7FB");
        gradPastel.addColorStop(0.2, "#F0ECF7");
        gradPastel.addColorStop(0.42, "#E9E2F2");
        gradPastel.addColorStop(0.64, "#DED3EC");
        gradPastel.addColorStop(0.83, "#D4C5E7");
        gradPastel.addColorStop(1.0, "#C8B6DE");
      } else {
        gradPastel.addColorStop(0.0, "#0b0b10");
        gradPastel.addColorStop(0.2, "#111019");
        gradPastel.addColorStop(0.42, "#191526");
        gradPastel.addColorStop(0.64, "#29203b");
        gradPastel.addColorStop(0.83, "#40315e");
        gradPastel.addColorStop(1.0, "#59417b");
      }

      ctx.fillStyle = gradPastel;
      ctx.fillRect(0, 0, w, h);

      // Dobras e ondas internas com relevo 3D
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

        const gradDobra = ctx.createLinearGradient(
          0,
          offsetBase - amp,
          0,
          offsetBase + amp * 2.5
        );

        gradDobra.addColorStop(0, tema === "claro" ? "rgba(126, 91, 170, 0.15)" : "rgba(197, 178, 255, 0.20)");
        gradDobra.addColorStop(0.45, tema === "claro" ? "rgba(126, 91, 170, 0.035)" : "rgba(197, 178, 255, 0.035)");
        gradDobra.addColorStop(1, tema === "claro" ? "rgba(90, 70, 120, 0.10)" : "rgba(0, 0, 0, 0.42)");

        ctx.fillStyle = gradDobra;
        ctx.fill();

        // Linha de destaque lilás na crista da onda
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

        ctx.strokeStyle = tema === "claro" ? "rgba(126, 91, 170, 0.24)" : "rgba(197, 178, 255, 0.30)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Luz direcional lilás suave
      const luzLateral = ctx.createLinearGradient(0, 0, w, h);

      luzLateral.addColorStop(0, tema === "claro" ? "rgba(255, 255, 255, 0.35)" : "rgba(197, 178, 255, 0.14)");
      luzLateral.addColorStop(0.5, tema === "claro" ? "rgba(255, 255, 255, 0.04)" : "rgba(197, 178, 255, 0.015)");
      luzLateral.addColorStop(1, tema === "claro" ? "rgba(100, 75, 135, 0.08)" : "rgba(0, 0, 0, 0.35)");

      ctx.fillStyle = luzLateral;
      ctx.fillRect(0, 0, w, h);

      // Micro-pontos discretos por cima da escultura
      const pattern = ctx.createPattern(padraoPontos, "repeat");

      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.restore();

      // Contorno suave lilás na borda esculpida
      ctx.beginPath();
      ctx.moveTo(pontosBorda[0].x, pontosBorda[0].y);

      for (let i = 1; i < pontosBorda.length; i++) {
        ctx.lineTo(pontosBorda[i].x, pontosBorda[i].y);
      }

      ctx.strokeStyle = tema === "claro" ? "rgba(126, 91, 170, 0.30)" : "rgba(197, 178, 255, 0.42)";
      ctx.lineWidth = modo === "linha" ? 2 : 1.6;
      ctx.stroke();

      animId = requestAnimationFrame(desenhar);
    }

    desenhar();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", ajustarTamanho);
    };
  }, [modo, tema]);

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
        boxShadow: ehLinha
          ? (tema === "claro" ? "1px 0 10px rgba(126, 91, 170, 0.16)" : "1px 0 10px rgba(197, 178, 255, 0.25)")
          : "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
}
