import { formatDecimalMoney } from "../lib/format";
import type { OrderDetail, OrderSummary } from "../types/app";
import PayNowButton from "./PayNowButton";

type Props = {
  isLoggedIn: boolean;
  token: string;
  selectedAddressId: string;
  placingOrder: boolean;
  ordersLoading: boolean;
  orders: OrderSummary[];
  orderDetail: OrderDetail | null;
  onRefresh: () => void;
  onPlaceOrder: () => void;
  onDetails: (orderId: string) => void;
  onPaymentSuccess: (orderId: string) => void | Promise<void>;
  onPaymentError: (message: string) => void;
};

export default function OrdersPanel({
  isLoggedIn,
  token,
  selectedAddressId,
  placingOrder,
  ordersLoading,
  orders,
  orderDetail,
  onRefresh,
  onPlaceOrder,
  onDetails,
  onPaymentSuccess,
  onPaymentError,
}: Props) {
  return (
    <section className="panel panel-wide">
      <div className="panel-head">
        <h2>Orders and Payment</h2>
        <button className="ghost" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      <div className="inline-actions">
        <button onClick={onPlaceOrder} disabled={!isLoggedIn || placingOrder}>
          {placingOrder ? "Placing..." : "Place order from cart"}
        </button>
        <span className="muted">
          Selected address: {selectedAddressId ? selectedAddressId.slice(0, 8) : "none"}
        </span>
      </div>

      {ordersLoading ? <p>Loading orders...</p> : null}

      <div className="stack top-gap">
        {orders.map((order) => (
          <div key={order.id} className="list-row">
            <div>
              <strong>{order.id.slice(0, 8)}...</strong>
              <p className="muted">
                {order.status} | {formatDecimalMoney(order.total)} | {order._count.items} items
              </p>
            </div>
            <div className="inline-actions">
              <button className="ghost" onClick={() => onDetails(order.id)}>
                Details
              </button>
              {order.status === "PENDING" && isLoggedIn ? (
                <PayNowButton
                  orderId={order.id}
                  token={token}
                  onSuccess={() => onPaymentSuccess(order.id)}
                  onError={onPaymentError}
                />
              ) : null}
            </div>
          </div>
        ))}
        {orders.length === 0 ? <p className="muted">No orders yet.</p> : null}
      </div>

      {orderDetail ? (
        <div className="detail-card">
          <h3>Order detail: {orderDetail.id}</h3>
          <p className="muted">
            Status: {orderDetail.status} | Total: {formatDecimalMoney(orderDetail.total)}
          </p>
          <p className="muted">
            Ship to: {orderDetail.address.fullName}, {orderDetail.address.line1}, {orderDetail.address.city}
          </p>
          <ul>
            {orderDetail.items.map((item) => (
              <li key={item.id}>
                {item.product.title} x {item.quantity} @ {formatDecimalMoney(item.unitPrice)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
