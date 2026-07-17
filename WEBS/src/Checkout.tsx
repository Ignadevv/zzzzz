import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

interface Product {
  id: string;
  name: string;
  price: string;
  brand: string;
  imageUrl?: string;
  images?: string[];
  specs?: {
    battery?: string;
    range?: string;
    tires?: string;
    power?: string;
    warranty?: string;
    maxSpeed?: string;
    weight?: string;
    brakes?: string;
  };
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  if (loading) return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
          
          {/* Main Checkout Form */}
          <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-zinc-200">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full border-4 border-blue-600 bg-white ring-1 ring-blue-600" />
                <h2 className="text-xl font-bold">Credit card (Stripe)</h2>
              </div>
              <div className="flex gap-1">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-6 w-10 object-contain grayscale opacity-70" alt="Visa" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6 w-10 object-contain grayscale opacity-70" alt="Mastercard" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-6 w-10 object-contain grayscale opacity-70" alt="Paypal" />
              </div>
            </div>

            <p className="mb-8 text-sm text-zinc-500">Pay with your credit card via Stripe.</p>

            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("¡Pedido realizado con éxito!"); }}>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold">
                  <div className="h-3 w-3 rounded-full border border-zinc-400" />
                  Card Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="**** **** **** ****" 
                    className="w-full rounded-lg bg-zinc-100 p-4 text-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="h-6 w-10 rounded bg-zinc-300" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold">
                    <div className="h-3 w-3 rounded-full border border-zinc-400" />
                    Expiry (MM/YY) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="MM / YY" 
                    className="w-full rounded-lg bg-zinc-100 p-4 text-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold">
                    <div className="h-3 w-3 rounded-full border border-zinc-400" />
                    Card Code <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="CVC" 
                    className="w-full rounded-lg bg-zinc-100 p-4 text-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <input type="checkbox" className="h-5 w-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                <label className="flex items-center gap-2 text-sm font-bold">
                  <div className="h-3 w-3 rounded-full border border-zinc-400" />
                  Save to Account
                </label>
              </div>

              <button className="mt-8 w-full rounded-lg bg-[#2d2e32] py-6 text-xl font-bold text-white transition hover:bg-black">
                Place order
              </button>
            </form>
          </div>

          {/* Sidebar Summary */}
          <div className="h-max rounded-[2rem] bg-zinc-900 p-8 text-white">
            <h3 className="mb-6 text-xl font-bold uppercase tracking-tight">Tu Pedido</h3>
            
            {product && (
              <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <img 
                  src={(product.images && product.images[0]) || product.imageUrl} 
                  className="h-16 w-16 rounded-xl object-cover" 
                  alt={product.name} 
                />
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase text-blue-500">{product.brand}</span>
                  <span className="font-bold text-sm leading-tight">{product.name}</span>
                  <span className="mt-1 text-orange-500 font-bold">{product.price}</span>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between text-white/60">
                <span>Subtotal</span>
                <span className="font-bold text-white">{product?.price}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Envío</span>
                <span className="font-bold text-green-400 text-xs uppercase tracking-widest">Gratis</span>
              </div>
              <div className="mt-6 flex justify-between border-t border-white/10 pt-6 text-xl font-black">
                <span>Total</span>
                <span className="text-orange-500">{product?.price}</span>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-white/5 p-4 text-[10px] leading-relaxed text-white/40">
              Al hacer clic en "Place order", aceptas nuestras condiciones de venta y política de privacidad. Tu pago será procesado de forma segura por Stripe.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
