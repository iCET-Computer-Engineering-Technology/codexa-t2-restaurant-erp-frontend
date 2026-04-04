import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {EmployeeLeaveModel, EmployeeModel} from '../../../models/salary.model';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {EmployeeService} from '../../../services/manager/employee-service';
import {EmployeeLeaveService} from '../../../services/manager/employee-leave-service';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-employee-leave',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    NgForOf
  ],
  templateUrl: './employee-leave.html',
  styleUrl: './employee-leave.css',
})
export class EmployeeLeave implements OnInit {
  employeeLeaves: EmployeeLeaveModel[] = [];
  employees: EmployeeModel[] = [];
  form!: FormGroup;
  constructor(private readonly service:EmployeeLeaveService,
              private readonly cdr: ChangeDetectorRef,
              private readonly fb: FormBuilder,
              private readonly employeeService:EmployeeService,)
  {
    this.form = this.fb.group({
      id: [null],
      employeeId: [null, [Validators.required]],
      leaveType: ['', Validators.required],
      startDate: ['',[Validators.required]],
      endDate: ['',[Validators.required]],
      totalDays: [''], // Removed Validators.required
      reason: ['',[Validators.required]],
    });

    // Subscribe to date changes to calculate total days
    this.form.get('startDate')?.valueChanges.subscribe(() => this.calculateTotalDays());
    this.form.get('endDate')?.valueChanges.subscribe(() => this.calculateTotalDays());
  }

  calculateTotalDays(): void {
    const start = this.form.get('startDate')?.value;
    const end = this.form.get('endDate')?.value;
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (endDate >= startDate) {
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 3600 * 24)) + 1; // Inclusive days
        this.form.get('totalDays')?.setValue(diffDays);
      } else {
        this.form.get('totalDays')?.setValue(0);
      }
    }
  }
  clearForm(): void {
    this.form.reset();
  }
  getEmployeeLeave(){
    this.service.getAllEmployeeLeave().subscribe({
      next: (data :any) => {
        this.employeeLeaves = data;
        this.cdr.detectChanges();
      }
    })
  }
  getEmployee(){
    this.employeeService.getAllEmployee().subscribe({
      next: (data :any) => {
        this.employees = data;
        console.log(this.employees);
        this.cdr.detectChanges();
      }
    })
  }

  ngOnInit(): void {
    this.getEmployeeLeave();
    this.getEmployee();
  }

  onSubmit(): void {
    if (this.form.valid) {
      const data = this.form.getRawValue();
      if (data.id) {
        this.service.updateEmployeeLeave(data).subscribe(() => {
          this.getEmployeeLeave();
          this.form.reset();
        });
      } else {
        this.service.addEmployeeLeave(data).subscribe(() => {
          this.getEmployeeLeave();
          this.form.reset();
        });
      }
    }
  }

  editEmployeeLeave(id: number | undefined): void {
    if (id !== undefined) {
      const leave = this.employeeLeaves.find(l => l.id === id);
      if (leave) {
        this.form.patchValue(leave);
        // Scroll to form for better UX
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  deleteEmployeeLeave(id: number | undefined): void {
    if (id !== undefined && confirm('Are you sure you want to delete this leave?')) {
      this.service.deleteEmployeeLeave(id).subscribe(() => {
        this.getEmployeeLeave();
      });
    }
  }
}
