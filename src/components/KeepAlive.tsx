"use client";

import { useEffect, useRef, useState } from "react";

export function KeepAlive() {
  const [wakeLockEnabled, setWakeLockEnabled] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    // 1. Tentar usar a API Wake Lock (funciona em navegadores modernos)
    const requestWakeLock = async () => {
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
        console.error(`Erro ao pedir Wake Lock: ${err.name}, ${err.message}`);
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

    // 2. Fallback para Smart TVs: Recarregar a página automaticamente a cada 28 minutos
    // TVs (Samsung/LG) frequentemente ignoram o Wake Lock.
    // Recarregar pouco antes do limite de 30 minutos garante que a TV reinicie seu contador de inatividade
    // e também limpa a memória da TV (evitando travamentos em monitores 24/7).
    const refreshInterval = setInterval(() => {
      console.log("Recarregando a página para manter a TV acordada e liberar memória...");
      window.location.reload();
    }, 28 * 60 * 1000); // 28 minutos

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(refreshInterval);
    };
  }, [wakeLockEnabled]);

  // 3. Fallback adicional (Video Loop Hack)
  // Tocar um vídeo vazio repetidamente é um hack conhecido para evitar que sistemas de TV
  // entrem no modo de suspensão de tela.
  return (
    <video
      loop
      muted
      autoPlay
      playsInline
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        opacity: 0.01,
        pointerEvents: "none",
        zIndex: -9999,
      }}
      src="data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAAz5tb292AAAAbG12aGQAAAAA/8y4Yv/MuGIAAAQAAAIAAAABAAABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAGGlvZHMAAAAAEwICBAMAAAABAAABAQAAAvh0cmFrAAAAXHRraGQAAAAD/8y4Yv/MuGIAAAABAAAAAAACAAAAAABAAAAAABAAAAAAAAAAAAAAAAEAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAgAAAAAAqGVkdHMAAAAcZWxzdAAAAAAAAAABAAACAAAAAAABAAAAAAACW21kaWEAAAAgbWRoZAAAAAD/zLhi/8y4YgAAOEAAAAEAAAEAAAAAAAAAInhkbHIAAAAAAAAAAWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACGG1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAsJzdGJsAAAAtHN0c2QAAAAAAAAAAQAAAJhhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAgACAEgASAAAAAAASAAAAOAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABABFhdmNDAwEDQf//EAAAABBnZ01BgQGAAgAAAwAQAAADAxtkCQQAABIfg4BAAAABAUBnc2dkAAAAABhzdHRzAAAAAAAAAAEAAAABAAABAAAAABxzdHNjAAAAAAAAAAEAAAABAAAAAQAAAAEAAAAUc3RzejAAAAAAAAAAIgAAAAEAAAAUc3RjbwAAAAAAAAABAAAAMAAAABB1ZHRhAAAACHNraXAAAAAA"
    />
  );
}
