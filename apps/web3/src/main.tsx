import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./style.css";

const container = document.getElementById("app") as HTMLElement;
const root = createRoot(container);

const queryClient = new QueryClient();
const networks = {
  devnet: { url: getFullnodeUrl("devnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
};

root.render(
  <StrictMode>
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networks} defaultNetwork="devnet">
          <WalletProvider>
            <h1>Hello</h1>
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </StrictMode>
  </StrictMode>
);
