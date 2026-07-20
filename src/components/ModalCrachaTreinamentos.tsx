import { useRef, useMemo } from "react";
import { Modal } from "./ui/Modal";
import { QRCodeSVG } from "qrcode.react";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { Printer, Share2 } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import type { User } from "../types";
import { toast } from "sonner";

interface ModalCrachaTreinamentosProps {
  user: User;
  onClose: () => void;
}

/**
 * Crachá de Treinamentos — exibe o QR Code que aponta para o dossiê público
 * de treinamentos do integrante (/dossie/:id). Acessível por ADMIN, RH e ENCARREGADO.
 * Reutiliza o mesmo template visual do crachá de login (cracha-bg.png).
 */
export function ModalCrachaTreinamentos({ user, onClose }: ModalCrachaTreinamentosProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // URL pública do dossiê de treinamentos — a mesma gerada pelo ModalTreinamentosUsuario
  const publicUrl = `${window.location.origin}/dossie/${user.id}`;

  const nameParts = useMemo(() => (user.nome || "").trim().split(" "), [user.nome]);
  const primeiroNome = nameParts[0] || "";
  const sobrenome = nameParts.slice(1).join(" ");

  const handlePrint = useReactToPrint({
    contentRef: cardRef,
    documentTitle: `Crachá Treinamentos - ${user.nome}`,
    pageStyle: `
      @page { size: auto; margin: 0; }
      body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .print-cracha { width: 380px !important; height: auto !important; box-shadow: none !important; margin: auto !important; }
    `,
  });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Treinamentos — ${user.nome}`,
          text: `Confira o perfil de treinamentos de ${primeiroNome} na Frota KLIN:`,
          url: publicUrl,
        });
        toast.success("Compartilhado com sucesso!");
      } catch {
        navigator.clipboard.writeText(publicUrl);
        toast.success("Link copiado!");
      }
    } else {
      navigator.clipboard.writeText(publicUrl);
      toast.success("Link copiado!");
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Crachá de Treinamentos" className="max-w-[380px]">
      <div className="flex flex-col items-center gap-6">

        {/* CRACHÁ FÍSICO */}
        <div
          ref={cardRef}
          className="w-full relative select-none shadow-2xl print-cracha"
          style={{
            containerType: "inline-size",
            aspectRatio: "427 / 585",
            backgroundImage: "url(/cracha-bg.png)",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            borderRadius: "5.5%",
            overflow: "hidden",
          }}
        >
          {/* Foto do integrante */}
          <div
            className="absolute overflow-hidden rounded-full"
            style={{
              top: "26%",
              left: "50.2%",
              transform: "translateX(-50%)",
              width: "37.5%",
              aspectRatio: "1 / 1",
            }}
          >
            <Avatar
              nome={user.nome}
              url={user.fotoUrl || user.image}
              className="w-full h-full rounded-full border-none shadow-none"
            />
          </div>

          {/* Primeiro nome */}
          <p
            className="absolute text-center text-white font-black uppercase leading-none truncate"
            style={{
              top: "53.5%",
              left: "5%",
              right: "5%",
              fontSize: "clamp(18px, 8.5cqi, 34px)",
              letterSpacing: "0.05em",
              textShadow: "0 2px 12px rgba(0,0,0,0.5)",
            }}
          >
            {primeiroNome}
          </p>

          {/* Sobrenome */}
          <p
            className="absolute text-center font-bold uppercase leading-none truncate"
            style={{
              top: "60.5%",
              left: "5%",
              right: "5%",
              fontSize: "clamp(7px, 3cqi, 13px)",
              letterSpacing: "0.22em",
              color: "#4ade80",
            }}
          >
            {sobrenome}
          </p>

          {/* Cargo/Função */}
          <p
            className="absolute text-center text-white font-black uppercase"
            style={{
              top: "65.4%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "80%",
              fontSize: "clamp(7px, 2.8cqi, 11.5px)",
              letterSpacing: "0.18em",
              whiteSpace: "nowrap",
            }}
          >
            {user.cargo ?? user.role}
          </p>

          {/* QR Code de treinamentos */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              top: "80.5%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "27%",
              aspectRatio: "1 / 1",
            }}
          >
            <QRCodeSVG
              value={publicUrl}
              style={{ width: "100%", height: "100%" }}
              level="M"
              bgColor="transparent"
              fgColor="#0f2b46"
            />
          </div>

          {/* Rótulo ao lado direito do escudo, na base do crachá */}
          <p
            className="absolute font-black uppercase"
            style={{
              bottom: "3%",
              left: "36%",
              fontSize: "clamp(5px, 2cqi, 8.5px)",
              color: "#1b4332",
              letterSpacing: "0.2em",
              whiteSpace: "nowrap",
              lineHeight: 1,
            }}
          >
            AUDITORIA · SST & TREINAMENTOS
          </p>
        </div>

        {/* AÇÕES */}
        <div className="w-full flex flex-col gap-3">
          <Button
            onClick={handlePrint}
            className="w-full h-11 text-sm font-bold bg-surface-hover hover:bg-border text-text-main border-none transition-transform active:scale-95"
            variant="secondary"
            icon={<Printer className="w-5 h-5 text-primary" />}
          >
            Imprimir Crachá
          </Button>

          <Button
            variant="secondary"
            onClick={handleShare}
            className="w-full h-11 px-0 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-transform active:scale-95"
            icon={<Share2 className="w-4 h-4" />}
          >
            Compartilhar Dossiê
          </Button>
        </div>

        <p className="text-[11px] text-text-muted text-center leading-relaxed -mt-2">
          Este QR Code direciona para o perfil público de treinamentos de{" "}
          <strong>{primeiroNome}</strong>. Qualquer pessoa com o link pode consultar as validades.
        </p>
      </div>
    </Modal>
  );
}
