import { useState, useEffect } from 'react';
import { useCart } from './CartContext';
import { Link } from 'react-router-dom';

export default function FloatingCart() {
  const { cart, cartCount, totalPrice, removeFromCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (cartCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      {/* Cart Drawer / Preview */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 rounded-[2rem] bg-white p-6 shadow-2xl ring-1 ring-zinc-200 animate-fade-up">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Tu Carrito</h3>
            <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-900">✕</button>
          </div>

          {cartCount === 0 ? (
            <p className="py-8 text-center text-xs font-bold text-zinc-400">Tu carrito está vacío</p>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto space-y-4 pr-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img src={item.image} className="h-12 w-12 rounded-lg object-cover bg-zinc-50" alt={item.name} />
                    <div className="flex-grow">
                      <p className="text-xs font-bold leading-tight text-zinc-900">{item.name}</p>
                      <p className="text-[10px] text-zinc-400">{item.quantity} x {item.price}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-zinc-300 hover:text-red-500 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-zinc-100 pt-4">
                <div className="flex justify-between mb-4">
                  <span className="text-xs font-bold text-zinc-400">Total</span>
                  <span className="text-lg font-black text-blue-600">{totalPrice.toFixed(2)}€</span>
                </div>
                <Link 
                  to={cart[0] ? `/checkout?productId=${cart[0].id}` : "/"}
                  onClick={() => setIsOpen(false)}
                  className="block w-full rounded-full bg-zinc-900 py-3 text-center text-[10px] font-black uppercase tracking-widest text-white hover:bg-black transition-colors"
                >
                  Finalizar Pedido
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-600/40 transition-all active:scale-95 ${isAnimating ? "scale-125 bg-orange-500" : "hover:scale-110"}`}
      >
        {cartCount > 0 && (
          <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-black ring-4 ring-white">
            {cartCount}
          </div>
        )}
        <svg className="h-6 w-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      </button>
    </div>
  );
}
