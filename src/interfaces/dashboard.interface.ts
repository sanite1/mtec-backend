export interface SalesOverviewResponse {
  labels: string[];
  data: number[];
  totalRevenue: number;
}

export type SalesRangeFilter =
  | "this_month"
  | "3_months"
  | "6_months"
  | "1_year";
