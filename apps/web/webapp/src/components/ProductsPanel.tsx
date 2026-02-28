import { formatMoneyFromPaise } from "../lib/format";
import type { Category, Product } from "../types/app";

type Filters = {
  search: string;
  categorySlug: string;
  sort: string;
};

type Pagination = {
  page: number;
  totalPages: number;
};

type Props = {
  categories: Category[];
  products: Product[];
  productsLoading: boolean;
  filters: Filters;
  pagination: Pagination;
  productQtyById: Record<string, number>;
  addToCartLoading: string | null;
  onRefresh: () => void;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onProductQtyChange: (productId: string, value: number) => void;
  onAddToCart: (productId: string) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export default function ProductsPanel({
  categories,
  products,
  productsLoading,
  filters,
  pagination,
  productQtyById,
  addToCartLoading,
  onRefresh,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  onProductQtyChange,
  onAddToCart,
  onPrevPage,
  onNextPage,
}: Props) {
  return (
    <section className="panel panel-wide">
      <div className="panel-head">
        <h2>Products</h2>
        <button className="ghost" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      <div className="filters">
        <label>
          Search
          <input
            value={filters.search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="title or brand"
          />
        </label>
        <label>
          Category
          <select
            value={filters.categorySlug}
            onChange={(event) => onCategoryChange(event.target.value)}
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
          <select value={filters.sort} onChange={(event) => onSortChange(event.target.value)}>
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
                onChange={(event) => onProductQtyChange(product.id, Number(event.target.value))}
              />
              <button
                onClick={() => onAddToCart(product.id)}
                disabled={addToCartLoading === product.id}
              >
                {addToCartLoading === product.id ? "Adding..." : "Add to cart"}
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="pager">
        <button className="ghost" disabled={pagination.page <= 1} onClick={onPrevPage}>
          Prev
        </button>
        <span>
          Page {pagination.page} / {Math.max(1, pagination.totalPages)}
        </span>
        <button
          className="ghost"
          disabled={pagination.page >= pagination.totalPages}
          onClick={onNextPage}
        >
          Next
        </button>
      </div>
    </section>
  );
}
