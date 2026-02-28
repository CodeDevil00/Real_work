import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import AddressesPanel from "./components/AddressesPanel";
import AuthPanel from "./components/AuthPanel";
import CartPanel from "./components/CartPanel";
import OrdersPanel from "./components/OrdersPanel";
import ProductsPanel from "./components/ProductsPanel";
import { api, authHeader, getApiErrorMessage } from "./lib/api";
import type {
  Address,
  CartPayload,
  Category,
  Notice,
  OrderDetail,
  OrderSummary,
  Product,
  ProductListResponse,
  User,
} from "./types/app";

const TOKEN_KEY = "token";

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

  const setNoticeError = useCallback((error: unknown) => {
    setNotice({ type: "error", text: getApiErrorMessage(error) });
  }, []);

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
      setNoticeError(error);
    }
  }, [setNoticeError]);

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
      setNoticeError(error);
    } finally {
      setProductsLoading(false);
    }
  }, [filters.categorySlug, filters.limit, filters.page, filters.search, filters.sort, setNoticeError]);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get<{ user: User }>("/auth/me", authHeader(token));
      setUser(data.user);
    } catch (error) {
      setNoticeError(error);
      logout();
    }
  }, [logout, setNoticeError, token]);

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
      setNoticeError(error);
    } finally {
      setCartLoading(false);
    }
  }, [setNoticeError, token]);

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
      setNoticeError(error);
    }
  }, [setNoticeError, token]);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const { data } = await api.get<{ orders: OrderSummary[] }>("/orders", authHeader(token));
      setOrders(data.orders);
    } catch (error) {
      setNoticeError(error);
    } finally {
      setOrdersLoading(false);
    }
  }, [setNoticeError, token]);

  const fetchOrderDetail = useCallback(async (orderId: string) => {
    if (!token) return;
    try {
      const { data } = await api.get<{ order: OrderDetail }>(`/orders/${orderId}`, authHeader(token));
      setOrderDetail(data.order);
    } catch (error) {
      setNoticeError(error);
    }
  }, [setNoticeError, token]);

  const submitAuthForm = useCallback(async () => {
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
      setNoticeError(error);
    } finally {
      setIsAuthSubmitting(false);
    }
  }, [authForm.email, authForm.name, authForm.password, authForm.phone, authMode, setNoticeError]);

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
      await api.post("/cart/items", { productId, quantity }, authHeader(token));
      await fetchCart();
      setNotice({ type: "success", text: "Item added to cart." });
    } catch (error) {
      setNoticeError(error);
    } finally {
      setAddToCartLoading(null);
    }
  }

  async function updateCartItem(itemId: string) {
    if (!token) return;

    const quantity = Math.max(1, cartQtyById[itemId] || 1);
    try {
      await api.patch(`/cart/items/${itemId}`, { quantity }, authHeader(token));
      await fetchCart();
      setNotice({ type: "success", text: "Cart item updated." });
    } catch (error) {
      setNoticeError(error);
    }
  }

  async function removeCartItem(itemId: string) {
    if (!token) return;
    try {
      await api.delete(`/cart/items/${itemId}`, authHeader(token));
      await fetchCart();
      setNotice({ type: "info", text: "Item removed from cart." });
    } catch (error) {
      setNoticeError(error);
    }
  }

  async function clearCart() {
    if (!token) return;
    try {
      await api.delete("/cart/clear", authHeader(token));
      await fetchCart();
      setNotice({ type: "info", text: "Cart cleared." });
    } catch (error) {
      setNoticeError(error);
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
      setNoticeError(error);
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
      setNoticeError(error);
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
        <AuthPanel
          isLoggedIn={isLoggedIn}
          user={user}
          authMode={authMode}
          authForm={authForm}
          isAuthSubmitting={isAuthSubmitting}
          onAuthModeChange={setAuthMode}
          onAuthFormChange={(field, value) =>
            setAuthForm((prev) => ({ ...prev, [field]: value }))
          }
          onSubmit={() => void submitAuthForm()}
          onLogout={logout}
          onRefreshProfile={() => void fetchMe()}
        />

        <ProductsPanel
          categories={categories}
          products={products}
          productsLoading={productsLoading}
          filters={filters}
          pagination={{ page: pagination.page, totalPages: pagination.totalPages }}
          productQtyById={productQtyById}
          addToCartLoading={addToCartLoading}
          onRefresh={() => void fetchProducts()}
          onSearchChange={(value) =>
            setFilters((prev) => ({ ...prev, page: 1, search: value }))
          }
          onCategoryChange={(value) =>
            setFilters((prev) => ({ ...prev, page: 1, categorySlug: value }))
          }
          onSortChange={(value) =>
            setFilters((prev) => ({ ...prev, page: 1, sort: value }))
          }
          onProductQtyChange={(productId, value) =>
            setProductQtyById((prev) => ({ ...prev, [productId]: value }))
          }
          onAddToCart={(productId) => void addToCart(productId)}
          onPrevPage={() =>
            setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
          }
          onNextPage={() =>
            setFilters((prev) => ({
              ...prev,
              page: Math.min(pagination.totalPages, prev.page + 1),
            }))
          }
        />

        <CartPanel
          isLoggedIn={isLoggedIn}
          cartLoading={cartLoading}
          cartPayload={cartPayload}
          cartQtyById={cartQtyById}
          onRefresh={() => void fetchCart()}
          onCartQtyChange={(itemId, value) =>
            setCartQtyById((prev) => ({ ...prev, [itemId]: value }))
          }
          onUpdateItem={(itemId) => void updateCartItem(itemId)}
          onRemoveItem={(itemId) => void removeCartItem(itemId)}
          onClearCart={() => void clearCart()}
        />

        <AddressesPanel
          isLoggedIn={isLoggedIn}
          addressForm={addressForm}
          addressLoading={addressLoading}
          addresses={addresses}
          selectedAddressId={selectedAddressId}
          onRefresh={() => void fetchAddresses()}
          onAddressFieldChange={(field, value) =>
            setAddressForm((prev) => ({ ...prev, [field]: value }))
          }
          onSave={() => void createAddress()}
          onSelectAddress={setSelectedAddressId}
        />

        <OrdersPanel
          isLoggedIn={isLoggedIn}
          token={token}
          selectedAddressId={selectedAddressId}
          placingOrder={placingOrder}
          ordersLoading={ordersLoading}
          orders={orders}
          orderDetail={orderDetail}
          onRefresh={() => void fetchOrders()}
          onPlaceOrder={() => void placeOrder()}
          onDetails={(orderId) => void fetchOrderDetail(orderId)}
          onPaymentSuccess={async (orderId) => {
            setNotice({ type: "success", text: "Payment verified. Order marked paid." });
            await fetchOrders();
            await fetchOrderDetail(orderId);
          }}
          onPaymentError={(message) => setNotice({ type: "error", text: message })}
        />
      </main>
    </div>
  );
}
