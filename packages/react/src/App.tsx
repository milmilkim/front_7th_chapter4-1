import { useCurrentPage } from "./router";
import { ModalProvider, ToastProvider } from "./components";
import { useLoadCartStore } from "./entities";
import { useEffect, useState } from "react";

const CartInitializer = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return <CartLoader />;
};

const CartLoader = () => {
  useLoadCartStore();
  return null;
};

/**
 * 전체 애플리케이션 렌더링
 */
export const App = () => {
  const PageComponent = useCurrentPage();

  return (
    <>
      <ToastProvider>
        <ModalProvider>{PageComponent ? <PageComponent /> : null}</ModalProvider>
      </ToastProvider>
      {typeof window !== "undefined" && <CartInitializer />}
    </>
  );
};
