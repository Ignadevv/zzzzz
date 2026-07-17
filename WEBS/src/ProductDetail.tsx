import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { useCart } from "./CartContext";
import FloatingCart from "./FloatingCart";

interface Product {
  id: string;
  name: string;
  price: string;
  tag: string;
  brand: string;
  imageUrl?: string;
  images?: string[];
  description?: string;
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

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "products", id);
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
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-5 text-center">
        <h1 className="text-4xl font-black uppercase text-zinc-900">Producto no encontrado</h1>
        <Link to="/" className="mt-8 rounded-full bg-blue-600 px-8 py-3 font-black uppercase text-white">Volver a la tienda</Link>
      </div>
    );
  }

  const images = (product.images && product.images.length > 0) 
    ? product.images 
    : [product.imageUrl || "https://images.unsplash.com/photo-1593955681640-1a12903ea890?auto=format&fit=crop&q=80&w=400"];

  return (
    <div className="min-h-screen bg-white text-zinc-950">
      {/* Mini Nav / Breadcrumbs */}
      <nav className="border-b border-zinc-100 bg-zinc-50 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
          <Link to="/" className="hover:text-blue-600">Inicio</Link>
          <span>/</span>
          <span className="text-zinc-600">{product.brand}</span>
          <span>/</span>
          <span className="text-blue-600">{product.name}</span>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          
          {/* Gallery Section */}
          <div className="lg:col-span-7">
            <div className="flex flex-col-reverse gap-4 md:flex-row">
              {/* Thumbnails */}
              <div className="flex gap-4 md:flex-col overflow-x-auto md:overflow-visible">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${idx === activeImage ? "border-blue-600 ring-4 ring-blue-600/10" : "border-zinc-100 hover:border-zinc-300"}`}
                  >
                    <img src={img} className="h-full w-full object-cover" alt="" />
                  </button>
                ))}
              </div>
              {/* Main Image */}
              <div className="relative aspect-square w-full overflow-hidden rounded-[2.5rem] bg-zinc-50 shadow-inner ring-1 ring-zinc-100">
                <img 
                  src={images[activeImage]} 
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" 
                  alt={product.name} 
                />
                <div className="absolute left-6 top-6">
                  <span className="rounded-full bg-orange-500 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-black shadow-lg">
                    {product.tag}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Info Section */}
          <div className="lg:col-span-5 lg:sticky lg:top-8 lg:h-max">
            <div className="mb-4 flex items-center gap-2 text-blue-600">
              <span className="text-xs font-black uppercase tracking-[0.3em]">{product.brand}</span>
              <div className="h-1 w-1 rounded-full bg-zinc-300" />
              <span className="text-xs font-bold text-zinc-400">Stock Disponible</span>
            </div>
            
            <h1 className="text-4xl font-black uppercase leading-[0.9] tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
              {product.name}
            </h1>

            <div className="mt-8 rounded-3xl bg-zinc-950 p-6 text-white shadow-xl shadow-blue-900/10">
              <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/40">Precio Especial</div>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-black text-white">{product.price}</span>
                <span className="mb-2 text-sm font-bold text-white/40 line-through">{(parseFloat(product.price.replace(/[^\d.]/g, '')) * 1.2).toFixed(2)} EUR</span>
              </div>
              <div className="mt-6 flex items-center gap-2 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="text-xs font-bold text-white/80">Envio Express 24h disponible</span>
              </div>
            </div>

            <div className="mt-10 space-y-8">
              <div>
                <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-zinc-400">Descripción</h3>
                <p className="text-lg leading-relaxed text-zinc-600">
                  {product.description || "Este modelo representa la cúspide de la movilidad urbana. Diseñado para ofrecer el máximo confort, seguridad y autonomía en tus trayectos diarios."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">Garantía</span>
                  <span className="mt-1 block font-black text-zinc-900">3 Años Oficial</span>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">Soporte</span>
                  <span className="mt-1 block font-black text-zinc-900">Taller Propio</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  addToCart(product);
                }}
                className="group flex w-full items-center justify-center gap-4 rounded-full bg-blue-600 py-6 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-orange-500 hover:text-black hover:shadow-2xl hover:shadow-blue-600/20"
              >
                <span>Añadir al Carrito</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>

              <div className="flex items-center justify-center gap-8 border-t border-zinc-100 pt-8">
                <div className="flex flex-col items-center">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4 opacity-40" alt="Paypal" />
                </div>
                <div className="flex flex-col items-center">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4 opacity-40" alt="Visa" />
                </div>
                <div className="flex flex-col items-center">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4 opacity-40" alt="Mastercard" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Technical Specs Section - Full Width */}
      <section className="bg-white py-24 border-t border-zinc-100">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black uppercase tracking-tight text-zinc-900">Características técnicas</h2>
            <p className="mt-2 text-zinc-500 font-medium tracking-wide">de {product.name}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8">
            {/* Batería */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50">
                <svg className="h-6 w-6 text-zinc-900" fill="currentColor" viewBox="0 0 24 24"><path d="M16 20H8V6H16M16.67 4H15V2H9V4H7.33C6.6 4 6 4.6 6 5.33V20.67C6 21.4 6.6 22 7.33 22H16.67C17.41 22 18 21.4 18 20.67V5.33C18 4.6 17.41 4 16.67 4Z"/></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Batería</span>
              <span className="font-bold text-sm text-zinc-900">{product.specs?.battery || "60V 24Ah"}</span>
            </div>

            {/* Autonomía */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50">
                <svg className="h-6 w-6 text-zinc-900" fill="currentColor" viewBox="0 0 24 24"><path d="M22,16V4c0-1.1-0.9-2-2-2H8C6.9,2,6,2.9,6,4v12c0,1.1,0.9,2,2,2h12C21.1,18,22,17.1,22,16z M16,14c-1.1,0-2-0.9-2-2c0-1.1,0.9-2,2-2 s2,0.9,2,2C18,13.1,17.1,14,16,14z M2,11v7c0,1.1,0.9,2,2,2h11v-2H4v-7H2z"/></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Autonomía</span>
              <span className="font-bold text-sm text-zinc-900">{product.specs?.range || "85Km"}</span>
            </div>

            {/* Neumáticos */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50">
                <svg className="h-6 w-6 text-zinc-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8 S16.41,20,12,20z M12,7c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5S14.76,7,12,7z"/></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Neumáticos</span>
              <span className="font-bold text-sm text-zinc-900">{product.specs?.tires || "11\""}</span>
            </div>

            {/* Potencia */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50">
                <svg className="h-6 w-6 text-zinc-900" fill="currentColor" viewBox="0 0 24 24"><path d="M13,3l-2,5h3l-4,7h3l-4,7v-7h-3l4-7h-3l4-5H13z"/></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Potencia Motor</span>
              <span className="font-bold text-sm text-zinc-900">{product.specs?.power || "2x1000W"}</span>
            </div>

            {/* Garantía */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50">
                <svg className="h-6 w-6 text-zinc-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12,1L3,5v6c0,5.55,3.84,10.74,9,12c5.16-1.26,9-6.45,9-12V5L12,1L12,1z M12,11.99h7c-0.53,4.12-3.28,7.79-7,8.94V12H5V6.3l7-3.11V11.99z"/></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Garantía</span>
              <span className="font-bold text-xs text-zinc-900 max-w-[100px] leading-tight">{product.specs?.warranty || "3 años con el mejor servicio postventa"}</span>
            </div>

            {/* Velocidad */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50">
                <svg className="h-6 w-6 text-zinc-900" fill="currentColor" viewBox="0 0 24 24"><path d="M20.38,8.57l1.23,1.45c0.11,0.13,0.1,0.33-0.03,0.44l-8.01,6.86c-0.13,0.11-0.33,0.1-0.44-0.03l-1.23-1.45 c-0.11-0.13-0.1-0.33,0.03-0.44l8.01-6.86C20.07,8.44,20.27,8.45,20.38,8.57z M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10 S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8S16.41,20,12,20z"/></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Velocidad Máxima</span>
              <span className="font-bold text-sm text-zinc-900">{product.specs?.maxSpeed || "80Km/h"}</span>
            </div>

            {/* Peso */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50">
                <svg className="h-6 w-6 text-zinc-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2z"/></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Peso</span>
              <span className="font-bold text-sm text-zinc-900">{product.specs?.weight || "36Kg"}</span>
            </div>

            {/* Frenado */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50">
                <svg className="h-6 w-6 text-zinc-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,18c-3.31,0-6-2.69-6-6s2.69-6,6-6s6,2.69,6,6 S15.31,18,12,18z"/></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Frenado</span>
              <span className="font-bold text-sm text-zinc-900">{product.specs?.brakes || "Hidráulicos"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Help Section */}
    </div>
  );
}
