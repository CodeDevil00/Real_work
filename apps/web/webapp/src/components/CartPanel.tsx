import { formatMoneyFromPaise } from "../lib/format";
import type { CartPayload } from "../types/app";

type Props = {
  isLoggedIn: boolean;
  cartLoading: boolean;
  cartPayload: CartPayload | null;
  cartQtyById: Record<string, number>;
  onRefresh: () => void;
  onCartQtyChange: (itemId: string, value: number) => void;
  onUpdateItem: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
};

export default function CartPanel({
  isLoggedIn,
  cartLoading,
  cartPayload,
  cartQtyById,
  onRefresh,
  onCartQtyChange,
  onUpdateItem,
  onRemoveItem,
  onClearCart,
}: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Cart</h2>
        <button className="ghost" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      {!isLoggedIn ? <p className="muted">Login to manage cart.</p> : null}
      {cartLoading ? <p>Loading cart...</p> : null}

      {cartPayload?.cart.items.length ? (
        <div className="stack">
          {cartPayload.cart.items.map((item) => (
            <div key={item.id} className="list-row">
              <div>
                <strong>{item.product.title}</strong>
                <p className="muted">{formatMoneyFromPaise(item.product.price)}</p>
              </div>
              <div className="inline-actions">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={cartQtyById[item.id] ?? item.quantity}
                  onChange={(event) => onCartQtyChange(item.id, Number(event.target.value))}
                />
                <button className="ghost" onClick={() => onUpdateItem(item.id)}>
                  Update
                </button>
                <button className="ghost danger" onClick={() => onRemoveItem(item.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
          <p className="price">Subtotal: {formatMoneyFromPaise(cartPayload.subtotal)}</p>
          <button className="ghost danger" onClick={onClearCart}>
            Clear cart
          </button>
        </div>
      ) : (
        <p className="muted">Cart is empty.</p>
      )}
    </section>
  );
}
