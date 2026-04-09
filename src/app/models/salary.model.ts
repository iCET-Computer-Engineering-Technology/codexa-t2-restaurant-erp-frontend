
export interface BasicSalaryModel {
  id?: number;
  roleName: string;
  amount: number;
}
export interface AllowanceModel {
  id?: number;
  employeeId: number;
  type: string;
  amount: number;
}
export interface DeductionModel {
  id?: number;
  employeeId: number;
  type: string;
  amount: number;
}
export interface BonusModel {
  id?: number;
  employeeId: number;
  amount: number;
}
export interface EmployeeModel {
  id?: number;
  user_id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  basicSalary: number;
  allowance: number;
  bonus: number;
  donation: number;
  department: string;
  designation: number;
}
export interface EmployeeLeaveModel {
  id?: number;
  employeeId: number;
  leaveType:string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
}
export interface OvertimeModel {
  id?: number;
  employeeId: number;
  date: Date;
  hours: number;
  ratePerHour: number;
  totalAmount: number;
}
export interface PayrollModel {
  id?: number;
  employeeId: number;
  basicSalary: number;
  epfEmployee: number;
  epfEmployer: number;
  etfEmployer: number;
  allowance: number;
  bonus: number;
  donation: number;
  overtimeAmount: number;
  leaveDays: number;
  leaveDeduction: number;
  totalDeduction: number;
  netSalary: number;
  employerCost: number;
  payrollDate: Date;
}

export interface PayrollConfigModel {
  id?: number;
  epfEmployeeRate: number;
  epfEmployerRate: number;
  etfRate: number;
}

export interface UserModel{
  id?: number;
  username:string;
  role:string;
}
