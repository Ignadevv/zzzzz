import { useState, useEffect } from "react";
import { db } from "./firebase";
import FloatingCart from "./FloatingCart";
import { useCart } from "./CartContext";
import { collection, getDocs } from "firebase/firestore";

const categories = [
  "Xiaomi",
  "SmartGyro",
  "Kugoo Kukirin",
  "Dualtron",
  "Segway-Ninebot",
  "Vsett",
  "Ecoxtreme",
  "Accesorios",
];

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

const tips = [
  { title: "Cuida tu batería", desc: "No la dejes descargar al 0% para alargar su vida útil." },
  { title: "Presión de ruedas", desc: "Revisa la presión cada semana para evitar pinchazos." },
  { title: "Limpieza segura", desc: "Usa un paño húmedo, nunca agua a presión directa." },
  { title: "Ajuste de frenos", desc: "Mantén tus frenos ajustados para una conducción segura." },
];

const services = [
  "Envíos rápidos a toda España",
  "Garantía oficial de 3 años",
  "Financiación a medida",
  "Servicio técnico propio",
];

function ScooterMark() {
  return (
    <img src="images/logo.png" alt="Patineto Anacleto Logo" className="h-10 object-contain" />
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.8-3.8" strokeLinecap="round" />
    </svg>
  );
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const { addToCart } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev === tips.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products: ", error);
      }
    };
    fetchProducts();
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-zinc-950">
      <section className="relative min-h-screen overflow-hidden bg-black text-white">
        <img
          src="images/portada.png"
          alt="Venta de patinetes electricos y scooters"
          className="absolute inset-0 h-full w-full animate-slow-zoom object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/10" />

        <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-md">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
            <a href="#" className="flex items-center gap-3" aria-label="Patineto Anacleto inicio">
              <ScooterMark />
              <div className="flex flex-col">
                <span className="block text-sm font-black uppercase tracking-[0.3em] text-white">Patineto</span>
                <span className="block text-xs font-bold text-orange-500">Anacleto</span>
              </div>
            </a>
            <div className="hidden items-center gap-10 text-xs font-black uppercase tracking-widest text-white/90 lg:flex">
              <a href="#modelos" className="transition hover:text-orange-500">Modelos</a>
              <a href="#servicios" className="transition hover:text-orange-500">Servicios</a>
              <a href="#marcas" className="transition hover:text-orange-500">Marcas</a>
              <a href="#contacto" className="transition hover:text-orange-500">Contacto</a>
            </div>
            <a
              href="#modelos"
              className="group relative overflow-hidden rounded-full bg-blue-600 px-8 py-3 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            >
              <span className="relative z-10">Tienda</span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </a>
          </nav>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-140px)] max-w-7xl items-center px-5 py-20 sm:px-8">
          <div className="max-w-4xl animate-fade-up">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-[2px] w-12 bg-orange-500" />
              <p className="text-sm font-black uppercase tracking-[0.4em] text-orange-500">Expertos en Movilidad</p>
            </div>
            <h1 className="text-4xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-white sm:text-7xl lg:text-8xl xl:text-9xl">
              Tú próximo <span className="text-blue-500">Patinete</span> <br />
              está en <span className="text-orange-500 underline decoration-blue-500/50 underline-offset-8">Anacleto</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-2xl">
              Especialistas en venta y reparación de patinetes eléctricos. Calidad garantizada y servicio técnico oficial.
            </p>
            <div className="mt-12 flex flex-wrap gap-6">
              <a
                href="#modelos"
                className="inline-flex items-center justify-center rounded-full bg-orange-500 px-10 py-5 text-sm font-black uppercase tracking-widest text-black transition-all hover:-translate-y-1 hover:bg-white hover:shadow-xl"
              >
                Explorar Catálogo
              </a>
              <a
                href="#contacto"
                className="inline-flex items-center justify-center rounded-full border-2 border-white/20 px-10 py-5 text-sm font-black uppercase tracking-widest text-white transition-all hover:-translate-y-1 hover:border-blue-500 hover:text-blue-400"
              >
                Soporte Técnico
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-blue-600 py-3 text-white overflow-hidden">
        <div 
          className="flex transition-transform duration-1000 ease-in-out" 
          style={{ transform: `translateX(-${currentTipIndex * 100}%)` }}
        >
          {tips.map((tip, index) => (
            <div key={index} className="flex min-w-full items-center justify-center gap-4 px-5 text-center">
              <span className="rounded-full bg-orange-500 px-3 py-0.5 text-[10px] font-black uppercase text-black shrink-0">Tip Anacleto</span>
              <p className="text-sm font-black sm:text-lg uppercase tracking-tight">
                <span className="text-orange-300">{tip.title}:</span> {tip.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="modelos" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-1 w-8 bg-blue-600" />
              <p className="text-xs font-black uppercase tracking-[0.4em] text-blue-600">Catálogo Premium</p>
            </div>
            <h2 className="text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-6xl">
              Modelos en <span className="text-orange-500">Stock</span>
            </h2>
          </div>
          <form className="flex w-full max-w-md items-center gap-4 rounded-full bg-white px-6 py-4 shadow-lg ring-1 ring-zinc-200 transition-shadow focus-within:shadow-blue-600/10 focus-within:ring-blue-500">
            <SearchIcon />
            <input
              type="search"
              placeholder="Busca tu patinete ideal..."
              className="w-full bg-transparent text-sm font-bold uppercase tracking-wider outline-none placeholder:text-zinc-400"
            />
            <button className="rounded-full bg-blue-600 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-orange-500 hover:text-black">
              Buscar
            </button>
          </form>
        </div>

        <div className="mt-12 mb-16 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
          <button 
            onClick={() => setSelectedBrand(null)}
            className={`group flex flex-col items-center justify-center gap-3 rounded-2xl p-6 shadow-xl ring-1 ring-zinc-200 transition-all duration-300 hover:-translate-y-2 ${!selectedBrand ? "bg-orange-500 text-black" : "bg-white text-zinc-900 hover:bg-blue-600 hover:text-white"}`}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${!selectedBrand ? "bg-black text-white" : "bg-zinc-50 text-blue-600 group-hover:bg-white/20 group-hover:text-white"}`}>
              <span className="text-lg font-black">All</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Todos</span>
          </button>
          {categories.map((category, index) => (
            <button 
              key={category} 
              onClick={() => setSelectedBrand(category)}
              className={`group flex flex-col items-center justify-center gap-3 rounded-2xl p-6 shadow-xl ring-1 ring-zinc-200 transition-all duration-300 hover:-translate-y-2 ${selectedBrand === category ? "bg-blue-600 text-white" : "bg-white text-zinc-900 hover:bg-blue-600 hover:text-white"}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${selectedBrand === category ? "bg-white/20 text-white" : "bg-zinc-50 text-blue-600 group-hover:bg-white/20 group-hover:text-white"}`}>
                <span className="text-lg font-black">{category[0]}</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{category}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {products
            .filter(p => !selectedBrand || p.brand === selectedBrand || (selectedBrand === "Accesorios" && p.tag === "Accesorios"))
            .map((product, index) => (
            <article
              key={product.id}
              onClick={() => window.open(`/product/${product.id}`, '_blank')}
              className="group relative flex flex-col overflow-hidden rounded-[2.5rem] bg-white p-6 shadow-xl ring-1 ring-zinc-100 transition-all duration-500 cursor-pointer hover:-translate-y-3 hover:shadow-2xl hover:shadow-blue-600/20"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute right-6 top-6 z-10">
                <span className="rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black shadow-lg">
                  Nuevo
                </span>
              </div>
              <div className="relative mb-6 flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] bg-zinc-50 transition-colors group-hover:bg-blue-50">
                {(product.images && product.images.length > 0) ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.name} 
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110" 
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1593955681640-1a12903ea890?auto=format&fit=crop&q=80&w=400" }}
                  />
                ) : product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110" 
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1593955681640-1a12903ea890?auto=format&fit=crop&q=80&w=400" }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-100 to-blue-50 p-12">
                    <ScooterMark />
                  </div>
                )}
              </div>
              <div className="flex flex-grow flex-col">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">{product.tag}</p>
                <h3 className="mt-2 text-xl font-black uppercase leading-tight tracking-tight text-zinc-900 group-hover:text-blue-700">{product.name}</h3>
                <div className="mt-auto pt-6 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Desde</span>
                    <span className="text-2xl font-black text-zinc-900">{product.price}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white transition-all hover:bg-orange-500 hover:text-black hover:shadow-lg hover:shadow-orange-500/40"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="servicios" className="bg-zinc-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-20 px-5 py-32 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div className="animate-fade-up">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-[2px] w-12 bg-orange-500" />
              <p className="text-sm font-black uppercase tracking-[0.4em] text-orange-500">Nuestros Servicios</p>
            </div>
            <h2 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-7xl">
              Mucho más que una <br />
              <span className="text-blue-500">Tienda Online</span>
            </h2>
            <p className="mt-10 text-xl leading-relaxed text-white/50">
              En Anacleto nos encargamos de todo. Desde el asesoramiento inicial hasta el mantenimiento post-venta. Tu tranquilidad es nuestro motor.
            </p>
            <div className="mt-12 flex gap-8">
              <div className="flex flex-col">
                <span className="text-4xl font-black text-orange-500">+10k</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Clientes</span>
              </div>
              <div className="flex flex-col">
                <span className="text-4xl font-black text-blue-500">24h</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Envio Express</span>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((service, idx) => (
              <div key={service} className={`group flex flex-col justify-between rounded-3xl p-8 transition-all hover:-translate-y-2 ${idx % 2 === 0 ? "bg-white/5" : "bg-blue-600 text-white"}`}>
                <div className={`mb-8 flex h-12 w-12 items-center justify-center rounded-2xl ${idx % 2 === 0 ? "bg-orange-500 text-black" : "bg-white text-blue-600"}`}>
                  <span className="text-xl font-black">{idx + 1}</span>
                </div>
                <span className="text-xl font-black uppercase leading-tight tracking-tight">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <h2 className="text-4xl font-black uppercase leading-none tracking-[-0.05em] sm:text-6xl">
            Descubre el scooter eléctrico que mejor se adapta a ti.
          </h2>
          <div className="border-l-4 border-orange-500 pl-6">
            <p className="text-2xl font-black leading-tight">
              "Pedido perfecto, embalado con cuidado y entregado en 24-48 horas. Trato rapido y profesional."
            </p>
            <p className="mt-4 text-sm font-black uppercase tracking-[0.25em] text-zinc-500">Opinion verificada</p>
          </div>
        </div>
      </section>

      <footer id="contacto" className="bg-white px-5 py-12 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 border-t border-zinc-200 pt-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-blue-600">
            <ScooterMark />
            <span className="text-2xl font-black uppercase tracking-tight text-zinc-950">Patineto Anacleto</span>
          </div>
          <div className="text-sm font-bold text-zinc-600">
            Venta de patinetes y scooters eléctricos. Las mejores marcas al mejor precio.
          </div>
        </div>
      </footer>
      <FloatingCart />
    </main>
  );
}