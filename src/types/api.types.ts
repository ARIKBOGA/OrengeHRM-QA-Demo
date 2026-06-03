/**
 * OrangeHRM REST API v2 Response Types
 * Source: {baseUrl}/web/index.php/api/v2/...
 */

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    [key: string]: unknown;
  };
  status: number;
  message?: string;
}

export interface Employee {
  empNumber:   number;
  employeeId:  string;
  firstName:   string;
  middleName:  string;
  lastName:    string;
  jobTitle?:   { id: number; title: string } | null;
  status?:     string;
  subunit?:    { id: number; name: string } | null;
}

export interface LeaveType {
  id:   number;
  name: string;
}

export interface LeaveRequest {
  id:          number;
  fromDate:    string;
  toDate:      string;
  leaveType:   LeaveType;
  status:      string;
}

export interface OAuthTokenResponse {
  access_token: string;
  expires_in:   number;
  token_type:   string;
  scope:        string | null;
}
