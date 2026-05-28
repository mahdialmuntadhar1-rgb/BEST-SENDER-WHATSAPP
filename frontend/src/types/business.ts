export interface Business {
  id: string;
  name: string;
  business_type: string;
  governorate: string;
  description: string | null;
  rating: number;
  image_url: string;
}

export interface BusinessTypeCount {
  business_type: string;
  count: number;
}

export interface GovernorateCount {
  governorate: string;
  count: number;
}

export interface BusinessListResponse {
  success: boolean;
  data: Business[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface BusinessTypeResponse {
  success: boolean;
  types: BusinessTypeCount[];
}

export interface BusinessGovernorateResponse {
  success: boolean;
  governorates: GovernorateCount[];
}
