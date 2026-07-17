import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

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

export default function Admin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [tag, setTag] = useState("Scooter Urbano");
  const [brand, setBrand] = useState("Xiaomi");
  const [imagesBase64, setImagesBase64] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [battery, setBattery] = useState("");
  const [range, setRange] = useState("");
  const [tires, setTires] = useState("");
  const [power, setPower] = useState("");
  const [warranty, setWarranty] = useState("");
  const [maxSpeed, setMaxSpeed] = useState("");
  const [weight, setWeight] = useState("");
  const [brakes, setBrakes] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    const querySnapshot = await getDocs(collection(db, "products"));
    const productsData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
    setProducts(productsData);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(dataUrl);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imagesBase64.length === 0) {
      alert("Por favor, selecciona al menos una imagen.");
      return;
    }
    setLoading(true);
    
    try {
      await addDoc(collection(db, "products"), {
        name,
        price,
        tag,
        brand,
        images: imagesBase64,
        description: description || "Scooter de alta calidad para tus desplazamientos diarios.",
        specs: {
          battery,
          range,
          tires,
          power,
          warranty: warranty || "3 años de garantía oficial",
          maxSpeed,
          weight,
          brakes
        }
      });
      
      alert("¡Producto añadido con éxito!");
      setName("");
      setPrice("");
      setImagesBase64([]);
      setDescription("");
      setBattery("");
      setRange("");
      setTires("");
      setPower("");
      setWarranty("");
      setMaxSpeed("");
      setWeight("");
      setBrakes("");
      await fetchProducts();
    } catch (error: any) {
      console.error("Error adding product: ", error);
      if (error.code === 'permission-denied' || error.message?.includes('too large')) {
        alert("ERROR: Las imágenes son demasiado grandes. Firestore solo permite 1MB por producto. Prueba a subir fotos de menor resolución o menos cantidad.");
      } else {
        alert("Error al añadir producto. Revisa que las fotos no sean muy pesadas.");
      }
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, "products", id));
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product: ", error);
      alert("Error al eliminar producto.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8f4] p-8 text-zinc-900">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12 flex items-center justify-between rounded-3xl bg-zinc-950 p-8 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500">
              <span className="text-2xl font-black text-black">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-white">
                Anacleto <span className="text-blue-500">Panel</span>
              </h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Gestion de Inventario</p>
            </div>
          </div>
          <a href="/" className="group flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-white hover:text-black">
            <span>Ver Tienda</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>
        </header>

        <section className="mb-12 rounded-[2.5rem] bg-white p-10 shadow-xl ring-1 ring-zinc-200">
          <div className="mb-8 flex items-center gap-3">
            <div className="h-1 w-8 bg-orange-500" />
            <h2 className="text-xl font-black uppercase tracking-widest text-zinc-800">Nuevo Producto</h2>
          </div>
          <form onSubmit={addProduct} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <input
              type="text"
              placeholder="Nombre del producto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-lg border border-zinc-300 p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Precio (ej. 29,99 EUR o 350 EUR)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="rounded-lg border border-zinc-300 p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="rounded-lg border border-zinc-300 p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="Scooter Urbano">Scooter Urbano</option>
              <option value="Scooter Todoterreno">Scooter Todoterreno</option>
              <option value="Patinete Eléctrico">Patinete Eléctrico</option>
              <option value="Alta Gama">Alta Gama</option>
              <option value="Accesorios">Accesorios</option>
            </select>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="rounded-lg border border-zinc-300 p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-600">Imágenes (Máx. 1MB total)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  setLoading(true);
                  try {
                    const compressedBase64s = await Promise.all(
                      files.map((file) => compressImage(file))
                    );
                    setImagesBase64(prev => [...prev, ...compressedBase64s]);
                  } catch (err) {
                    console.error("Error comprimiendo imágenes:", err);
                    alert("Error al procesar las imágenes.");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="rounded-lg border border-zinc-300 p-2 text-sm outline-none focus:border-blue-500"
              />
              {imagesBase64.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {imagesBase64.map((img, i) => (
                    <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border border-zinc-200 shadow-sm">
                      <img src={img} className="h-full w-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setImagesBase64(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center bg-red-500 text-[8px] text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="Breve descripción del producto (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-lg border border-zinc-300 p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 lg:col-span-3"
            />
            
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-200">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-zinc-400">Batería</label>
                <input type="text" value={battery} onChange={(e) => setBattery(e.target.value)} placeholder="60V 24Ah" className="bg-transparent border-b border-zinc-300 outline-none text-sm font-bold" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-zinc-400">Autonomía</label>
                <input type="text" value={range} onChange={(e) => setRange(e.target.value)} placeholder="85Km" className="bg-transparent border-b border-zinc-300 outline-none text-sm font-bold" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-zinc-400">Neumáticos</label>
                <input type="text" value={tires} onChange={(e) => setTires(e.target.value)} placeholder='11"' className="bg-transparent border-b border-zinc-300 outline-none text-sm font-bold" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-zinc-400">Potencia</label>
                <input type="text" value={power} onChange={(e) => setPower(e.target.value)} placeholder="2x1000W" className="bg-transparent border-b border-zinc-300 outline-none text-sm font-bold" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-zinc-400">Garantía</label>
                <input type="text" value={warranty} onChange={(e) => setWarranty(e.target.value)} placeholder="3 años" className="bg-transparent border-b border-zinc-300 outline-none text-sm font-bold" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-zinc-400">Vel. Máxima</label>
                <input type="text" value={maxSpeed} onChange={(e) => setMaxSpeed(e.target.value)} placeholder="80Km/h" className="bg-transparent border-b border-zinc-300 outline-none text-sm font-bold" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-zinc-400">Peso</label>
                <input type="text" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="36Kg" className="bg-transparent border-b border-zinc-300 outline-none text-sm font-bold" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-zinc-400">Frenado</label>
                <input type="text" value={brakes} onChange={(e) => setBrakes(e.target.value)} placeholder="Hidráulicos" className="bg-transparent border-b border-zinc-300 outline-none text-sm font-bold" />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="lg:col-span-3 rounded-lg bg-blue-600 p-3 font-bold uppercase text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Añadiendo..." : "Añadir Producto"}
            </button>
          </form>
        </section>

        <section className="rounded-[2.5rem] bg-white p-10 shadow-xl ring-1 ring-zinc-200">
          <div className="mb-8 flex items-center gap-3">
            <div className="h-1 w-8 bg-blue-600" />
            <h2 className="text-xl font-black uppercase tracking-widest text-zinc-800">Productos Publicados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 uppercase text-zinc-600">
                <tr>
                  <th className="p-4">Nombre</th>
                  <th className="p-4">Precio</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Marca</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-zinc-500">
                      No hay productos todavía. Añade uno arriba.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="transition hover:bg-zinc-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={(product.images && product.images[0]) || product.imageUrl || "https://images.unsplash.com/photo-1593955681640-1a12903ea890?auto=format&fit=crop&q=80&w=400"} 
                            alt={product.name}
                            className="h-10 w-10 rounded-lg object-cover ring-1 ring-zinc-200"
                          />
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="p-4">{product.price}</td>
                      <td className="p-4">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                          {product.tag}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-orange-600">
                          {product.brand}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="font-bold text-red-500 transition hover:text-red-700 hover:underline"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
