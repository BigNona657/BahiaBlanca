export type DeliveryConfig = {
  base_fee: number;
  price_per_km: number;
  free_from: number;
  max_km: number;
};

export const DEFAULT_DELIVERY_CONFIG: DeliveryConfig = {
  base_fee: 0,
  price_per_km: 0,
  free_from: 50000,
  max_km: 0,
};
