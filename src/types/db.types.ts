import { RowDataPacket } from 'mysql2';

/** OrangeHRM MySQL DB row types — table: hs_hr_employee */
export interface EmployeeRow extends RowDataPacket {
  emp_number:  number;
  employee_id: string;
  emp_firstname: string;
  emp_middlename: string;
  emp_lastname: string;
  emp_work_email: string | null;
  termination_id: number | null;
}

/** OrangeHRM MySQL DB row types — table: ohrm_leave_request */
export interface LeaveRequestRow extends RowDataPacket {
  id:            number;
  leave_type_id: number;
  date_applied:  string;
  emp_number:    number;
  status:        number;
}
