export type Category = {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
};

export type Product = {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  image_url: string | null;
  image_data: string | null;
  available: boolean;
  sort_order: number;
};
