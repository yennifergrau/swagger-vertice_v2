export interface Policy {
  id?: number;
  order_id: number;
  car_id: number;
  policy_number: string;
  issue_date: string;
  start_date: string;
  end_date: string;
  policy_status: string;
  createdAt?: string;
  updatedAt?: string;
}
