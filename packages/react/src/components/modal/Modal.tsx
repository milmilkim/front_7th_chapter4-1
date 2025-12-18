import { type PropsWithChildren, useEffect } from "react";
import { useModalContext } from "./ModalProvider";
import { withEscKey } from "../../utils";
import { PublicImage } from "../../components";

const Header = ({ children }: PropsWithChildren) => {
  const modal = useModalContext();
  return (
    <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
      <h2 className="text-lg font-bold text-gray-900 flex items-center">{children}</h2>

      <button id="cart-modal-close-btn" className="text-gray-400 hover:text-gray-600 p-1" onClick={modal.close}>
        <PublicImage src="/close-icon.svg" alt="닫기" className="w-6 h-6" />
      </button>
    </div>
  );
};

const Container = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="relative bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const ModalRoot = ({ children }: Readonly<PropsWithChildren>) => {
  const modal = useModalContext();

  useEffect(() => {
    const handleEscKey = withEscKey(() => {
      modal.close();
      document.removeEventListener("keydown", handleEscKey);
    });

    document.addEventListener("keydown", handleEscKey, { once: true });

    return () => document.removeEventListener("keydown", handleEscKey);
  }, [modal]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto cart-modal" onClick={modal.close}>
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity cart-modal-overlay" />

      {children}
    </div>
  );
};

export const Modal = Object.assign(ModalRoot, { Header, Container });
