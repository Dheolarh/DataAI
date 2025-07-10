export type Product = {
  id: string;
  name: string;
  sku: string;
  selling_price: number;
  // add more as needed
};

export type TransactionWithProduct = {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  customer_location: string;
  transaction_time: string;
  product: Product;
};
