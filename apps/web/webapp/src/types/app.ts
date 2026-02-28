export type NoticeType = "success" | "error" | "info";

export type Notice = {
  type: NoticeType;
  text: string;
};

export type User = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Product = {
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

export type ProductListResponse = {
  items: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CartItem = {
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

export type CartPayload = {
  cart: {
    id: string;
    userId: string;
    items: CartItem[];
  };
  subtotal: number;
};

export type Address = {
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

export type OrderSummary = {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  _count: { items: number };
};

export type OrderDetail = {
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
