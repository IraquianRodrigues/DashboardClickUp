"use client";

import { useEffect, useRef, useState } from "react";

export function KeepAlive() {
  const [wakeLockEnabled, setWakeLockEnabled] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    // 1. Tentar usar a API Wake Lock (funciona em navegadores modernos)
    const requestWakeLock = async () => {
      if (document.visibilityState !== "visible") {
        return; // O navegador não permite pedir Wake Lock se a aba não estiver visível
      }

      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
          setWakeLockEnabled(true);
          console.log("Wake Lock ativo: A tela não vai desligar.");
          
          wakeLockRef.current.addEventListener('release', () => {
            console.log('Wake Lock foi liberado.');
            setWakeLockEnabled(false);
          });
        }
      } catch (err: any) {
        if (err.name !== "NotAllowedError") {
          console.error(`Erro ao pedir Wake Lock: ${err.name}, ${err.message}`);
        }
      }
    };

    requestWakeLock();

    // Tentar reativar o Wake Lock se a aba ficar visível novamente
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !wakeLockEnabled) {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 2. Simular atividade de usuário a cada 1 minuto (MUITO EFICIENTE PARA TVs)
    // Sistemas de Smart TV usam eventos reais da janela para contar inatividade.
    const activityInterval = setInterval(() => {
      try {
        // Disparar evento de movimento do mouse falso
        const mouseEvent = new MouseEvent("mousemove", { bubbles: true, cancelable: true, view: window });
        document.dispatchEvent(mouseEvent);
        
        // Disparar evento de toque falso para TVs touchscreen/smart
        const touchEvent = new Event("touchstart", { bubbles: true, cancelable: true });
        document.dispatchEvent(touchEvent);

        // Fazer um micro-scroll imperceptível para resetar o idle timer do navegador da TV
        window.scrollBy(0, 1);
        setTimeout(() => window.scrollBy(0, -1), 50);
        
        console.log("[KeepAlive] Atividade simulada para manter a TV ligada.");
      } catch (e) {}
    }, 60 * 1000); // 1 minuto

    // 3. Fallback para Smart TVs: Recarregar a página antes dos 30 minutos (25 min)
    const refreshInterval = setInterval(() => {
      console.log("Recarregando a página para manter a TV acordada e liberar memória...");
      window.location.reload();
    }, 25 * 60 * 1000); // 25 minutos para garantir que ocorra antes do corte de 30 min da TV

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(activityInterval);
      clearInterval(refreshInterval);
    };
  }, [wakeLockEnabled]);

  // 4. Fallback de Mídia (Video Loop Hack)
  // Smart TVs costumam ignorar vídeos 1x1. Usamos 100vw/100vh com opacidade quase zero.
  return (
    <video
      loop
      muted
      autoPlay
      playsInline
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        opacity: 0.001, // Quase invisível, mas renderiza
        pointerEvents: "none",
        zIndex: -9999,
      }}
      src="data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAAz5tb292AAAAbG12aGQAAAAA/8y4Yv/MuGIAAAQAAAIAAAABAAABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAGGlvZHMAAAAAEwICBAMAAAABAAABAQAAAvh0cmFrAAAAXHRraGQAAAAD/8y4Yv/MuGIAAAABAAAAAAACAAAAAABAAAAAABAAAAAAAAAAAAAAAAEAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAgAAAAAAqGVkdHMAAAAcZWxzdAAAAAAAAAABAAACAAAAAAABAAAAAAACW21kaWEAAAAgbWRoZAAAAAD/zLhi/8y4YgAAOEAAAAEAAAEAAAAAAAAAInhkbHIAAAAAAAAAAWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACGG1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAsJzdGJsAAAAtHN0c2QAAAAAAAAAAQAAAJhhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAgACAEgASAAAAAAASAAAAOAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABABFhdmNDAwEDQf//EAAAABBnZ01BgQGAAgAAAwAQAAADAxtkCQQAABIfg4BAAAABAUBnc2dkAAAAABhzdHRzAAAAAAAAAAEAAAABAAABAAAAABxzdHNjAAAAAAAAAAEAAAABAAAAAQAAAAEAAAAUc3RzejAAAAAAAAAAIgAAAAEAAAAUc3RjbwAAAAAAAAABAAAAMAAAABB1ZHRhAAAACHNraXAAAAAA"
    />
  );
}
