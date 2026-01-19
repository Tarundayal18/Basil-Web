// lib/openFoodFacts.ts
// OpenFoodFacts API integration for automatic product data lookup

type OFFProduct = {
  product_name?: string;
  product_name_en?: string;
  product_name_nl?: string;
  product_name_in?: string; // India-specific
  brands?: string;
  categories?: string;
  categories_tags?: string[];
  image_front_url?: string;
  quantity?: string;
  packaging?: string;
};

function withTimeout(ms: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { controller, id };
}

async function fetchOFF(url: string, timeout = 2500) {
  const { controller, id } = withTimeout(timeout);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "User-Agent": "Basil-ERP/1.0",
      },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

export async function lookupOpenFoodFacts(barcode: string) {
  if (!barcode || barcode.length < 8) return null;

  /**
   * 1️⃣ World endpoint (primary)
   */
  const worldUrl = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
  let data = await fetchOFF(worldUrl);

  /**
   * 2️⃣ India-specific endpoint (if available)
   */
  if (!data || data.status !== 1) {
    const inUrl = `https://in.openfoodfacts.org/api/v2/product/${barcode}.json`;
    data = await fetchOFF(inUrl);
  }

  /**
   * 3️⃣ Final safety net (search API)
   */
  if (!data || data.status !== 1) {
    const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${barcode}&search_simple=1&json=1&page_size=1`;
    const searchData = await fetchOFF(searchUrl);

    if (searchData?.products?.length) {
      data = { product: searchData.products[0], status: 1 };
    }
  }

  if (!data || data.status !== 1 || !data.product) return null;

  const p: OFFProduct = data.product;

  return {
    name:
      p.product_name_in ||
      p.product_name_en ||
      p.product_name ||
      p.product_name_nl ||
      "",
    brand: p.brands || "",
    category: Array.isArray(p.categories_tags)
      ? p.categories_tags[0]?.replace(/^..:/, "")
      : p.categories || "",
    image: p.image_front_url || "",
    quantity: p.quantity || "",
    packaging: p.packaging || "",
  };
}

