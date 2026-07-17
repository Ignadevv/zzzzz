import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App";
import Admin from "./Admin";
import ProductDetail from "./ProductDetail";
import Checkout from "./Checkout";
import { CartProvider } from "./CartContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <CartProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </CartProvider>
    </HashRouter>
  </StrictMode>
);
