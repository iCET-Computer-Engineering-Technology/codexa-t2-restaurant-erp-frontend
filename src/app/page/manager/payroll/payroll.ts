import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PayrollService } from '../../../services/manager/payroll-service';
import { EmployeeService } from '../../../services/manager/employee-service';
import { PayrollModel, EmployeeModel } from '../../../models/salary.model';

@Component({
  selector: 'app-payroll',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './payroll.html',
  styleUrl: './payroll.css',
})
export class Payroll implements OnInit {
  payrolls: PayrollModel[] = [];
  employees: EmployeeModel[] = [];
  form!: FormGroup;

  constructor(
    private readonly service: PayrollService,
    private readonly employeeService: EmployeeService,
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder
  ) {
    const today = this.getTodayDateString();
    this.form = this.fb.group({
      id: [null],
      employeeId: [null, [Validators.required]],
      basicSalary: [null, [Validators.required, Validators.min(0)]],
      epfEmployee: [null, [Validators.required, Validators.min(0)]],
      epfEmployer: [null, [Validators.required, Validators.min(0)]],
      etfEmployer: [null, [Validators.required, Validators.min(0)]],
      allowance: [null, [Validators.required, Validators.min(0)]],
      bonus: [null, [Validators.required, Validators.min(0)]],
      donation: [null, [Validators.required, Validators.min(0)]],
      overtimeAmount: [null, [Validators.required, Validators.min(0)]],
      leaveDays: [null, [Validators.required, Validators.min(0)]],
      leaveDeduction: [null, [Validators.required, Validators.min(0)]],
      totalDeduction: [null, [Validators.required, Validators.min(0)]],
      netSalary: [null, [Validators.required, Validators.min(0)]],
      employerCost: [null, [Validators.required, Validators.min(0)]],
      payrollDate: [today, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.getEmployees();
    this.getPayrolls();

    // Listen to user_id changes to populate salary based on role
    this.form.get('employeeId')?.valueChanges.subscribe(() => {
      this.populatePayrollForEmployee();
    });

    this.form.get('payrollDate')?.valueChanges.subscribe((value) => {
      if (value) {
        this.getTodayDateString();
      }
    });
  }
  private getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getEmployees(): void {
    this.employeeService.getAllEmployee().subscribe({
      next: (data: any) => {
        this.employees = data;
        this.cdr.detectChanges();
      }
    });
  }

  getPayrolls(): void {
    this.service.getAllBasicSalaries().subscribe({
      next: (data: any) => {
        this.payrolls = data;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const data = this.form.getRawValue();

      if (data.id) {
        //  Update payroll
        this.service.updatePayroll(data).subscribe(() => {
          this.getPayrolls();
          this.form.reset();
        });

      } else {
        //  Add payroll first
        this.service.addPayroll(data).subscribe(() => {

          //  Then update employee
          const employeeUpdate = {
            id: data.employeeId,
            allowance: data.allowance,
            bonus: data.bonus,
            donation: data.donation
          };

          this.employeeService.updateEmployeeById(data.employeeId,employeeUpdate).subscribe(() => {
            console.log('Employee updated successfully');

            //  Refresh UI AFTER both complete
            this.getPayrolls();
            this.form.reset();
          });

        });
      }
    }
  }
    clearForm(): void {
      this.form.reset();
      this.form.patchValue({
        payrollDate: this.getTodayDateString()
      });
    }

  editPayroll(id: number | undefined): void {
    if (id !== undefined) {
      const payroll = this.payrolls.find(p => p.id === id);
      if (payroll) {
        this.form.patchValue(payroll);
        // Scroll to form for better UX
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  deletePayroll(id: number | undefined): void {
    if (id !== undefined && confirm('Are you sure you want to delete this payroll?')) {
      this.service.deletePayroll(id).subscribe(() => {
        this.getPayrolls();
      });
    }
  }

  getEmployeeName(employeeId: number): string {
    const employee = this.employees.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';
  }

  trackByPayrollId(index: number, payroll: PayrollModel): number {
    return payroll.id || index;
  }


  populatePayrollForEmployee(): void {
    const employeeId = Number(this.form.get('employeeId')?.value);

    forkJoin({
      employee: this.employeeService.getEmployeeById(employeeId).pipe(catchError(() => of(null))),
      bonus: this.service.getTotalBonus(employeeId).pipe(catchError(() => of(0))),
      donation: this.service.getTotalDonation(employeeId).pipe(catchError(() => of(0))),
      overtime: this.service.getTotalOvertime(employeeId).pipe(catchError(() => of(0))),
      leaveDays: this.service.getTotalLeaveDays(employeeId).pipe(catchError(() => of(0))),
      epf: this.service.getTotalEPF(employeeId).pipe(catchError(() => of({ employee: 0, employer: 0 }))),
      etf: this.service.getTotalETF(employeeId).pipe(catchError(() => of({ employer: 0 }))),
      allowances: this.service.getTotalAllowances(employeeId).pipe(catchError(() => of(0))),
    }).subscribe(({ employee, bonus, donation, overtime, leaveDays, epf, etf, allowances }) => {

      // ✅ Normalize API responses

      // @ts-ignore
      const epfEmployeeValue = epf?.employeeEPF ?? epf?.employee ?? 0;
      // @ts-ignore
      const epfEmployerValue = epf?.employerEPF ?? epf?.employer ?? 0;
      // @ts-ignore
      const etfEmployerValue = etf?.etf ?? etf?.employer ?? 0;

      // ✅ Base values (Employee)
      // @ts-ignore
      const basicSalary = employee?.basicSalary ?? 0;

      // ✅ Use TOTAL → EMPLOYEE → 0 priority
      // @ts-ignore
      const allowance = allowances ?? employee?.allowance ?? 0;
      // @ts-ignore
      const bonusAmount = bonus ?? employee?.bonus ?? 0;
      // @ts-ignore
      const donationAmount = donation ?? employee?.donation ?? 0;
      const overtimeAmount = overtime ?? 0;
      const leaveDaysAmount = leaveDays ?? 0;

      const epfEmployee = epfEmployeeValue;
      const epfEmployer = epfEmployerValue;
      const etfEmployer = etfEmployerValue;

      // ✅ Calculations
      // @ts-ignore
      const leaveDeduction = leaveDaysAmount * (basicSalary / 30);
      const totalDeduction = epfEmployee + leaveDeduction;

      const netSalary =
        basicSalary +
        allowance +
        bonusAmount +
        donationAmount +
        overtimeAmount -
        totalDeduction;

      const employerCost =
        basicSalary +
        epfEmployer +
        etfEmployer +
        allowance +
        bonusAmount +
        donationAmount +
        overtimeAmount;

      // ✅ Patch form
      this.form.patchValue({
        basicSalary,
        epfEmployee,
        epfEmployer,
        etfEmployer,
        allowance,
        bonus: bonusAmount,
        donation: donationAmount,
        overtimeAmount,
        leaveDays: leaveDaysAmount,
        leaveDeduction,
        totalDeduction,
        netSalary,
        employerCost
      });
    });
  }
}
