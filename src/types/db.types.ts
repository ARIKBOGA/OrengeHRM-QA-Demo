import { RowDataPacket } from 'mysql2';

export interface EmployeeRow extends RowDataPacket {
  emp_number:               number;
  employee_id:              string | null;
  emp_lastname:             string;
  emp_firstname:            string;
  emp_middle_name:          string;
  emp_nick_name:            string | null;
  emp_birthday:             string | null;
  nation_code:              number | null;
  emp_gender:               number | null;
  emp_marital_status:       string | null;
  emp_other_id:             string | null;
  emp_dri_lice_num:         string | null;
  emp_dri_lice_exp_date:    string | null;
  emp_work_email:           string | null;
  joined_date:              string | null;
  termination_id:           number | null;
}

export interface LeaveRequestRow extends RowDataPacket {
  id:            number;
  leave_type_id: number;
  date_applied:  string;
  emp_number:    number;
}

export interface LeaveTypeRow extends RowDataPacket {
  id:      number;
  name:    string;
  deleted: number;
}

export interface UserRow extends RowDataPacket {
  id:           number;
  user_role_id: number;
  emp_number:   number | null;
  user_name:    string | null;
  deleted:      number;
  status:       number;
}