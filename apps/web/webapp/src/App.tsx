import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import PayNowButton from "./components/PayNowButton";
import { api, authHeader, getApiErrorMessage } from "./lib/api";

type NoticeType = "success" | "error" | "info";

type Notice = {
  type: NoticeType;
  text: string;
};

type User = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Product = {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  price: number;
  mrp: number | null;
  stockQty: number;
  brand: string | null;
  images: string[];
  category?: Category | null;
};

type ProductListResponse = {
  items: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    mrp: number | null;
    images: string[];
    stockQty: number;
    brand: string | null;
  };
};

type CartPayload = {
  cart: {
    id: string;
    userId: string;
    items: CartItem[];
  };
  subtotal: number;
};

type Address = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type OrderSummary = {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  _count: { items: number };
};

type OrderDetail = {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  address: Address;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: string;
    product: {
      id: string;
      title: string;
      images: string[];
      brand: string | null;
    };
  }>;
};

const TOKEN_KEY = "token";

function formatMoneyFromPaise(value: number) {
  return `INR ${(value / 100).toFixed(2)}`;
}

function formatDecimalMoney(value: string) {
  return `INR ${Number(value).toFixed(2)}`;
}

export default function App() {
  const [notice, setNotice] = useState<Notice | null>(null);

  const [token, setToken] = useState<string>(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authForm, setAuthForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    categorySlug: "",
    sort: "newest",
    page: 1,
    limit: 8,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 1,
  });
  const [productQtyById, setProductQtyById] = useState<Record<string, number>>({});
  const [addToCartLoading, setAddToCartLoading] = useState<string | null>(null);

  const [cartPayload, setCartPayload] = useState<CartPayload | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartQtyById, setCartQtyById] = useState<Record<string, number>>({});

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    isDefault: true,
  });
  const [addressLoading, setAddressLoading] = useState(false);

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  const isLoggedIn = token.length > 0;
  const apiBase = useMemo(() => api.defaults.baseURL || "", []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get<{ categories: Category[] }>("/categories");
      setCategories(data.categories);
    } catch (error) {
      setNotice({ type: "error", text: getApiErrorMessage(error) });
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const { data } = await api.get<ProductListResponse>("/products", {
        params: {
          search: filters.search || undefined,
          categorySlug: filters.categorySlug || undefined,
          sort: filters.sort,
          page: filters.page,
          limit: filters.limit,
        },
      });
      setProducts(data.items);
      setPagination(data.pagination);
    } catch (error) {
      setNotice({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setProductsLoading(false);
    }
  }, [filters.categorySlug, filters.limit, filters.page, filters.search, filters.sort]);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get<{ user: User }>("/auth/me", authHeader(token));
      setUser(data.user);
    } catch (error) {
      setNotice({ type: "error", text: getApiErrorMessage(error) });
      logout();
    }
  }, [logout, token]);

  const fetchCart = useCallback(async () => {
    if (!token) return;
    setCartLoading(true);
    try {
      const { data } = await api.get<CartPayload>("/cart", authHeader(token));
      setCartPayload(data);
      const nextQty: Record<string, number> = {};
      for (const item of data.cart.items) {
        nextQty[item.id] = item.quantity;
      }
      setCartQtyById(nextQty);
    } catch (error) {
      setNotice({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setCartLoading(false);
    }
  }, [token]);

  const fetchAddresses = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await api.get<{ addresses: Address[] }>("/orders/addresses", authHeader(token));
      setAddresses(data.addresses);
      setSelectedAddressId((current) => {
        if (current || data.addresses.length === 0) return current;
        const preferred = data.addresses.find((address) => address.isDefault) || data.addresses[0];
        return preferred.id;
      });
    } catch (error) {
      setNotice({ type: "error", text: getApiErrorMessage(error) });
    }
  }, [token]);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const { data } = await api.get<{ orders: OrderSummary[] }>("/orders", authHeader(token));
      setOrders(data.orders);
    } catch (error) {
      setNotice({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setOrdersLoading(false);
    }
  }, [token]);

  const fetchOrderDetail = useCallback(async (orderId: string) => {
    if (!token) return;
    try {
      const { data } = await api.get<{ order: OrderDetail }>(`/orders/${orderId}`, authHeader(token));
      setOrderDetail(data.order);
    } catch (error) {
      setNotice({ type: "error", text: getApiErrorMessage(error) });
    }
  }, [token]);

  async function submitAuthForm() {
    setIsAuthSubmitting(true);
    try {
      if (authMode === "register") {
        const { data } = await api.post<{
          token: string;
          user: User;
        }>("/auth/register", {
          name: authForm.name,
          phone: authForm.phone,
          email: authForm.email,
          password: authForm.password,
        });

        setToken(data.token);
        setUser(data.user);
        setNotice({ type: "success", text: "Registered and logged in." });
      } else {
        const { data } = await api.post<{
          token: string;
          user: User;
        }>("/auth/login", {
          email: authForm.email,
          password: authForm.password,
        });

        setToken(data.token);
        setUser(data.user);
        setNotice({ type: "success", text: "Login successful." });
      }
    } catch (error) {
      setNotice({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsAuthSubmitting(false);
    }
  }

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setCartPayload(null);
      setAddresses([]);
      setOrders([]);
      setOrderDetail(null);
      return;
    }

    localStorage.setItem(TOKEN_KEY, token);
    void fetchMe();
    void fetchCart();
    void fetchAddresses();
    void fetchOrders();
  }, [fetchAddresses, fetchCart, fetchMe, fetchOrders, token]);

  async function addToCart(productId: string) {
    if (!token) {
      setNotice({ type: "error", text: "Please login before adding to cart." });
      return;
    }

    const quantity = Math.max(1, productQtyById[productId] || 1);

    setAddToCartLoading(productId);
    try {
      await api.post(
        "/cart/items",
        { productId, quantity },
        authHeader(token),
      );
      await fetchCart();
      setNotice({ type: "success", text: "Item added to cart." });
    } catch (error) {
      setNotice({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setAddToCartLoading(null);
    }
  }

  async function updateCartItem(itemId: string) {
    if (!token) return;

    const quantity = Math.max(1, cartQtyById[itemId] || 1);
    try {
      await api.patch(
        `/cart/items/${itemId}`,
        { quantity },
        authHeader(token),
      );
      await fetchCart();
      setNotice({ type: "success", text: "Cart item updated." });
    } catch (error) {
      setNotice({ type: "error", text: getApiErrorMessage(error) });
    }
  }

  async function removeCartItem(itemId: string) {
    if (!token) return;
    try {
      await api.delete(`/cart/items/${itemId}`, authHeader(token));
      await fetchCart();
      setNotice({ type: "info", text: "Item removed from cart." });
    } catch (error) {
      setNotice({ type: "error", text: getApiErrorMessage(error) });
    }
  }

  async function clearCart() {
    if (!token) return;
    try {
      await api.delete("/cart/clear", authHeader(token));
      await fetchCart();
      setNotice({ type: "info", text: "Cart cleared." });
    } catch (error) {
      setNotice({ type: "error", text: getApiErrorMessage(error) });
    }
  }

  async function createAddress() {
    if (!token) return;
    setAddressLoading(true);
    try {
      const { data } = await api.post<{ address: Address }>(
        "/orders/address",
        {
          fullName: addressForm.fullName,
          phone: addressForm.phone,
          line1: addressForm.line1,
          line2: addressForm.line2 || undefined,
          city: addressForm.city,
          state: addressForm.state,
          postalCode: addressForm.postalCode,
          country: addressForm.country,
          isDefault: addressForm.isDefault,
        },
        authHeader(token),
      );

      setSelectedAddressId(data.address.id);
      await fetchAddresses();
      setNotice({ type: "success", text: "Address saved." });
    } catch (error) {
      setNotice({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setAddressLoading(false);
    }
  }

  async function placeOrder() {
    if (!token) return;
    if (!selectedAddressId) {
      setNotice({ type: "error", text: "Select an address before placing the order." });
      return;
    }

    setPlacingOrder(true);
    try {
      const { data } = await api.post<{ order: OrderSummary }>(
        "/orders",
        { addressId: selectedAddressId },
        authHeader(token),
      );

      setNotice({
        type: "success",
        text: `Order placed: ${data.order.id.slice(0, 8)}...`,
      });
      await Promise.all([fetchOrders(), fetchCart()]);
    } catch (error) {
      setNotice({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setPlacingOrder(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">Frontend workspace</p>
        <h1>Commerce Console</h1>
        <p className="hero-copy">
          API base: <code>{apiBase}</code>
        </p>
      </header>

      {notice ? <p className={`notice ${notice.type}`}>{notice.text}</p> : null}

      <main className="panel-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Auth</h2>
            {isLoggedIn ? (
              <button className="ghost" onClick={logout}>
                Logout
              </button>
            ) : null}
          </div>

          {!isLoggedIn ? (
            <div className="stack">
              <div className="auth-switch">
                <button
                  className={authMode === "login" ? "tab active" : "tab"}
                  onClick={() => setAuthMode("login")}
                >
                  Login
                </button>
                <button
                  className={authMode === "register" ? "tab active" : "tab"}
                  onClick={() => setAuthMode("register")}
                >
                  Register
                </button>
              </div>

              {authMode === "register" ? (
                <>
                  <label>
                    Name
                    <input
                      value={authForm.name}
                      onChange={(event) =>
                        setAuthForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                      placeholder="Your name"
                    />
                  </label>
                  <label>
                    Phone
                    <input
                      value={authForm.phone}
                      onChange={(event) =>
                        setAuthForm((prev) => ({ ...prev, phone: event.target.value }))
                      }
                      placeholder="9999999999"
                    />
                  </label>
                </>
              ) : null}

              <label>
                Email
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(event) =>
                    setAuthForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  placeholder="you@example.com"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(event) =>
                    setAuthForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                />
              </label>
              <button
                onClick={submitAuthForm}
                disabled={isAuthSubmitting}
              >
                {isAuthSubmitting
                  ? "Submitting..."
                  : authMode === "login"
                  ? "Login"
                  : "Create account"}
              </button>
            </div>
          ) : (
            <div className="stack">
              <p className="chip">
                {user?.name || user?.email} ({user?.role || "user"})
              </p>
              <button className="ghost" onClick={() => void fetchMe()}>
                Refresh profile
              </button>
            </div>
          )}
        </section>

        <section className="panel panel-wide">
          <div className="panel-head">
            <h2>Products</h2>
            <button className="ghost" onClick={() => void fetchProducts()}>
              Refresh
            </button>
          </div>

          <div className="filters">
            <label>
              Search
              <input
                value={filters.search}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    page: 1,
                    search: event.target.value,
                  }))
                }
                placeholder="title or brand"
              />
            </label>
            <label>
              Category
              <select
                value={filters.categorySlug}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    page: 1,
                    categorySlug: event.target.value,
                  }))
                }
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Sort
              <select
                value={filters.sort}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    page: 1,
                    sort: event.target.value,
                  }))
                }
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price low-high</option>
                <option value="price_desc">Price high-low</option>
              </select>
            </label>
          </div>

          {productsLoading ? <p>Loading products...</p> : null}

          <div className="product-grid">
            {products.map((product) => (
              <article key={product.id} className="product-card">
                <h3>{product.title}</h3>
                <p className="muted">
                  {product.brand || "No brand"} | Stock: {product.stockQty}
                </p>
                <p className="price">{formatMoneyFromPaise(product.price)}</p>
                {product.mrp ? (
                  <p className="muted">MRP: {formatMoneyFromPaise(product.mrp)}</p>
                ) : null}
                <p className="muted">{product.category?.name || "Uncategorized"}</p>

                <div className="inline-actions">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={productQtyById[product.id] || 1}
                    onChange={(event) =>
                      setProductQtyById((prev) => ({
                        ...prev,
                        [product.id]: Number(event.target.value),
                      }))
                    }
                  />
                  <button
                    onClick={() => void addToCart(product.id)}
                    disabled={addToCartLoading === product.id}
                  >
                    {addToCartLoading === product.id ? "Adding..." : "Add to cart"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="pager">
            <button
              className="ghost"
              disabled={pagination.page <= 1}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: Math.max(1, prev.page - 1),
                }))
              }
            >
              Prev
            </button>
            <span>
              Page {pagination.page} / {Math.max(1, pagination.totalPages)}
            </span>
            <button
              className="ghost"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: Math.min(pagination.totalPages, prev.page + 1),
                }))
              }
            >
              Next
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Cart</h2>
            <button className="ghost" onClick={() => void fetchCart()}>
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
                      onChange={(event) =>
                        setCartQtyById((prev) => ({
                          ...prev,
                          [item.id]: Number(event.target.value),
                        }))
                      }
                    />
                    <button className="ghost" onClick={() => void updateCartItem(item.id)}>
                      Update
                    </button>
                    <button className="ghost danger" onClick={() => void removeCartItem(item.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <p className="price">Subtotal: {formatMoneyFromPaise(cartPayload.subtotal)}</p>
              <button className="ghost danger" onClick={() => void clearCart()}>
                Clear cart
              </button>
            </div>
          ) : (
            <p className="muted">Cart is empty.</p>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Addresses</h2>
            <button className="ghost" onClick={() => void fetchAddresses()}>
              Refresh
            </button>
          </div>

          {!isLoggedIn ? <p className="muted">Login to manage addresses.</p> : null}

          <div className="stack">
            <label>
              Full name
              <input
                value={addressForm.fullName}
                onChange={(event) =>
                  setAddressForm((prev) => ({ ...prev, fullName: event.target.value }))
                }
              />
            </label>
            <label>
              Phone
              <input
                value={addressForm.phone}
                onChange={(event) =>
                  setAddressForm((prev) => ({ ...prev, phone: event.target.value }))
                }
              />
            </label>
            <label>
              Line 1
              <input
                value={addressForm.line1}
                onChange={(event) =>
                  setAddressForm((prev) => ({ ...prev, line1: event.target.value }))
                }
              />
            </label>
            <label>
              Line 2
              <input
                value={addressForm.line2}
                onChange={(event) =>
                  setAddressForm((prev) => ({ ...prev, line2: event.target.value }))
                }
              />
            </label>
            <label>
              City
              <input
                value={addressForm.city}
                onChange={(event) =>
                  setAddressForm((prev) => ({ ...prev, city: event.target.value }))
                }
              />
            </label>
            <label>
              State
              <input
                value={addressForm.state}
                onChange={(event) =>
                  setAddressForm((prev) => ({ ...prev, state: event.target.value }))
                }
              />
            </label>
            <label>
              Postal code
              <input
                value={addressForm.postalCode}
                onChange={(event) =>
                  setAddressForm((prev) => ({ ...prev, postalCode: event.target.value }))
                }
              />
            </label>
            <button onClick={() => void createAddress()} disabled={addressLoading || !isLoggedIn}>
              {addressLoading ? "Saving..." : "Save address"}
            </button>
          </div>

          <div className="stack top-gap">
            {addresses.map((address) => (
              <label key={address.id} className="address-card">
                <input
                  type="radio"
                  name="selected-address"
                  checked={selectedAddressId === address.id}
                  onChange={() => setSelectedAddressId(address.id)}
                />
                <span>
                  {address.fullName}, {address.line1}, {address.city}, {address.state} {address.postalCode}
                  {address.isDefault ? " (default)" : ""}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="panel panel-wide">
          <div className="panel-head">
            <h2>Orders and Payment</h2>
            <button className="ghost" onClick={() => void fetchOrders()}>
              Refresh
            </button>
          </div>

          <div className="inline-actions">
            <button onClick={() => void placeOrder()} disabled={!isLoggedIn || placingOrder}>
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
                  <button className="ghost" onClick={() => void fetchOrderDetail(order.id)}>
                    Details
                  </button>
                  {order.status === "PENDING" && isLoggedIn ? (
                    <PayNowButton
                      orderId={order.id}
                      token={token}
                      onSuccess={async () => {
                        setNotice({ type: "success", text: "Payment verified. Order marked paid." });
                        await fetchOrders();
                        await fetchOrderDetail(order.id);
                      }}
                      onError={(message) => setNotice({ type: "error", text: message })}
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
      </main>
    </div>
  );
}
