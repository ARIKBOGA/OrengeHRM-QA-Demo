export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
  rels?: unknown[];
}

/** GET /pim/employees veya POST /pim/employees response */
export interface Employee {
  empNumber:    number;
  firstName:    string;
  lastName:     string;
  middleName:   string;
  employeeId:   string | null;
  terminationId: number | null;
}

/** GET /pim/employees/{empNumber}/personal-details response */
export interface EmployeePersonalDetails {
  empNumber:                 number;
  firstName:                 string;
  lastName:                  string;
  middleName:                string;
  employeeId:                string | null;
  otherId:                   string;
  drivingLicenseNo:          string;
  drivingLicenseExpiredDate: string | null;
  gender:                    number | null;
  maritalStatus:             string;
  birthday:                  string | null;
  terminationId:             number | null;
  nationality: {
    id:   number | null;
    name: string | null;
  };
}

export interface LeaveType {
  id:   number;
  name: string;
}

export interface LeaveRequest {
  id:        number;
  fromDate:  string;
  toDate:    string;
  leaveType: LeaveType;
  status:    string;
}

/** PUT /pim/employees/{empNumber}/personal-details request body */
export interface UpdatePersonalDetailsPayload {
  firstName:                  string;
  lastName:                   string;
  middleName?:                string;
  employeeId?:                string | null;
  otherId?:                   string;
  drivingLicenseNo?:          string;
  drivingLicenseExpiredDate?: string | null;
  gender?:                    number | null;
  maritalStatus?:             string;
  birthday?:                  string | null;
  nationalityId?:             number;       // integer, POSITIVE only — omit if no nationality
  nickname?:                  string;
  smoker?:                    boolean;
  militaryService?:           string;
}