"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import CartItemRow from "@/components/store/CartItemRow";
import { createOrder, type CheckoutFormData } from "@/lib/actions/orders";

const ALIAS = "big-nona";
const TAKEAWAY_ADDRESS = "Fatone 657";

const INITIAL_FORM: CheckoutFormData = {
  customerName: "",
  phone: "",
  deliveryType: "DELIVERY",
  street: "",
  streetNumber: "",
  apartment: "",
  notes: "",
  paymentMethod: "TRANSFER",
};

export default function CartClient() {
  const { items, totalItems, totalPrice, addToCart, decrementFromCart, removeFromCart, clearCart } =
    useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<CheckoutFormData>({
    ...INITIAL_FORM,
    customerName: session?.user?.name ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isDelivery = form.deliveryType === "DELIVERY";

  function handleField(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleDeliveryType(type: "DELIVERY" | "TAKEAWAY") {
    setForm((prev) => ({
      ...prev,
      deliveryType: type,
      paymentMethod: type === "DELIVERY" ? "TRANSFER" : prev.paymentMethod,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.paymentMethod === "TRANSFER") {
      setShowTransferModal(true);
      return;
    }
    confirmOrder();
  }

  function confirmOrder() {
    startTransition(async () => {
      const result = await createOrder(form, items);
      if (result.success) {
        router.push(`/orders/${result.orderId}?new=1`);
        clearCart();
      } else {
        setError(result.error);
      }
    });
  }

  if (!mounted || totalItems === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center gap-4">
        {!mounted ? (
          <span className="text-4xl animate-pulse">🛒</span>
        ) : (
          <>
            <span className="text-7xl">🛒</span>
            <h2 className="text-xl font-bold text-gray-700">Tu carrito está vacío</h2>
            <p className="text-gray-400 text-sm">
              Todavía no agregaste nada. ¡Mirá el menú y elegí lo que se te antoje!
            </p>
            <Link
              href="/"
              className="mt-2 bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold transition"
            >
              Ver el menú
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tu pedido</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Columna izquierda: ítems */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            {items.map((item) => (
              <CartItemRow
                key={`${item.product.id}-${item.note ?? ""}`}
                item={item}
                onAdd={() => addToCart(item.product, item.note, item.unitPrice)}
                onDecrement={() => decrementFromCart(item.product.id, item.note)}
                onRemove={() => removeFromCart(item.product.id, item.note)}
              />
            ))}

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal ({totalItems} {totalItems === 1 ? "ítem" : "ítems"})</span>
                <span>${totalPrice.toLocaleString("es-AR", { minimumFractionDigits: 0 })}</span>
              </div>
              {isDelivery && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Envío</span>
                  <span className="text-orange-500 font-medium">A pagar al repartidor</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-800 pt-1">
                <span>Total</span>
                <span className="text-brand-600">
                  ${totalPrice.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha: formulario checkout */}
        <div className="lg:w-96">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-4 space-y-4">

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Tipo de entrega *</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDeliveryType("DELIVERY")}
                  className={`rounded-2xl py-3 px-3 text-sm font-semibold border-2 transition flex flex-col items-center gap-1 ${
                    isDelivery
                      ? "border-brand-500 bg-brand-50 text-brand-600"
                      : "border-gray-200 text-gray-600 hover:border-brand-300"
                  }`}
                >
                  <span className="text-xl">🛵</span>
                  <span>Delivery</span>
                  <span className="text-xs font-semibold text-orange-500">por Uber Envíos</span>
                  <span className="text-xs font-normal opacity-70">Solo transferencia</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeliveryType("TAKEAWAY")}
                  className={`rounded-2xl py-3 px-3 text-sm font-semibold border-2 transition flex flex-col items-center gap-1 ${
                    !isDelivery
                      ? "border-brand-500 bg-brand-50 text-brand-600"
                      : "border-gray-200 text-gray-600 hover:border-brand-300"
                  }`}
                >
                  <span className="text-xl">🏪</span>
                  <span>Take away</span>
                  <span className="text-xs font-normal opacity-70">{TAKEAWAY_ADDRESS}</span>
                </button>
              </div>
            </div>

            <h2 className="text-base font-bold text-gray-700">
              {isDelivery ? "Datos de entrega" : "Tus datos"}
            </h2>

            {!session && (
              <Field label="Nombre completo *">
                <input
                  name="customerName"
                  required
                  placeholder="Juan García"
                  value={form.customerName}
                  onChange={handleField}
                  className={inputCls}
                />
              </Field>
            )}

            <Field label="Teléfono de contacto *">
              <input
                name="phone"
                required
                type="tel"
                placeholder="11 1234-5678"
                value={form.phone}
                onChange={handleField}
                className={inputCls}
              />
            </Field>

            {isDelivery && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Field label="Calle *">
                      <input
                        name="street"
                        required
                        placeholder="Av. Corrientes"
                        value={form.street}
                        onChange={handleField}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                  <Field label="Número *">
                    <input
                      name="streetNumber"
                      required
                      placeholder="1234"
                      value={form.streetNumber}
                      onChange={handleField}
                      className={inputCls}
                    />
                  </Field>
                </div>

                <Field label="Piso / Depto">
                  <input
                    name="apartment"
                    placeholder="3° B"
                    value={form.apartment}
                    onChange={handleField}
                    className={inputCls}
                  />
                </Field>

                <Field label="Aclaraciones para el repartidor">
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Timbre roto, llamar al llegar..."
                    value={form.notes}
                    onChange={handleField}
                    className={`${inputCls} resize-none`}
                  />
                </Field>
              </>
            )}

            {!isDelivery && (
              <div className="bg-brand-50 border border-brand-100 rounded-2xl px-4 py-3 text-sm text-brand-700">
                <p className="font-semibold mb-0.5">📍 Punto de retiro</p>
                <p>{TAKEAWAY_ADDRESS}</p>
              </div>
            )}

            <Field label="Método de pago *">
              {isDelivery ? (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600">
                  <span>🏦</span>
                  <span>Transferencia bancaria</span>
                </div>
              ) : (
                <select
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleField}
                  className={inputCls}
                >
                  <option value="TRANSFER">🏦 Transferencia bancaria</option>
                  <option value="CASH">💵 Efectivo en el local</option>
                </select>
              )}
            </Field>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition text-base"
            >
              {isPending ? "Confirmando pedido..." : `Confirmar pedido · $${totalPrice.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`}
            </button>

            {isDelivery && (
              <p className="text-xs text-center text-gray-400 leading-snug">
                🛵 Los envíos se realizan a través de <span className="font-semibold text-gray-500">Uber Envíos</span>. El costo del envío será abonado por el cliente al momento de la entrega.
              </p>
            )}
          </form>
        </div>
      </div>

      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-5">
            <div className="text-center">
              <span className="text-4xl">🏦</span>
              <h2 className="text-lg font-bold text-gray-800 mt-2">Pago por transferencia</h2>
              <p className="text-sm text-gray-500 mt-1">Realizá la transferencia antes de confirmar el pedido.</p>
            </div>

            <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400">Alias</p>
                <p className="text-base font-bold text-gray-800 tracking-wide">{ALIAS}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(ALIAS)}
                className="text-xs bg-brand-100 text-brand-600 font-semibold px-3 py-1.5 rounded-xl hover:bg-brand-200 transition"
              >
                Copiar
              </button>
            </div>

            <div className="bg-brand-50 rounded-2xl px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-gray-500">Monto a transferir</p>
              <p className="text-xl font-bold text-brand-600">
                ${totalPrice.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 border border-gray-300 text-gray-600 rounded-2xl py-3 text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => { setShowTransferModal(false); confirmOrder(); }}
                disabled={isPending}
                className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-2xl py-3 text-sm font-bold transition"
              >
                {isPending ? "Confirmando..." : "Ya transferí ✔️"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}
