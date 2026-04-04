import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgForOf, NgIf} from "@angular/common";
import {OvertimeModel, EmployeeModel} from '../../../models/salary.model';
import {EmployeeService} from '../../../services/manager/employee-service';
import {OvertimeService} from '../../../services/manager/overtime-service';

@Component({
  selector: 'app-overtime',
    imports: [
        FormsModule,
        NgForOf,
        NgIf,
        ReactiveFormsModule
    ],
  templateUrl: './overtime.html',
  styleUrl: './overtime.css',
})
export class Overtime implements OnInit{
  overtimes: OvertimeModel[] = [];
  employees: EmployeeModel[] = [];
  form!: FormGroup;
  constructor(private readonly service:OvertimeService,
              private readonly cdr: ChangeDetectorRef,
              private readonly fb: FormBuilder,
              private readonly employeeService:EmployeeService,)
  {
    this.form = this.fb.group({
      id: [null],
      employeeId: [null, [Validators.required]],
      date: ['',[Validators.required]],
      hours: ['',[Validators.required]],
      ratePerHour: ['',[Validators.required]],
      totalAmount: [''],
    });

    this.form.get('hours')?.valueChanges.subscribe(() => this.calculateTotalAmount());
    this.form.get('ratePerHour')?.valueChanges.subscribe(() => this.calculateTotalAmount());
  }

  private calculateTotalAmount() {
    const hours = this.form.get('hours')?.value;
    const ratePerHour = this.form.get('ratePerHour')?.value;
    if (hours && ratePerHour) {
      const totalAmount = hours * ratePerHour;
      this.form.get('totalAmount')?.setValue(totalAmount);
    } else {
      this.form.get('totalAmount')?.setValue(0);
    }
  }

  getEmployee(){
    this.employeeService.getAllEmployee().subscribe({
      next: (data :any) => {
        this.employees = data;
        this.cdr.detectChanges();
      }
    })
  }
  getOvertime(){
    this.service.getAllOvertime().subscribe({
      next: (data :any) => {
        this.overtimes = data;
        this.cdr.detectChanges();
      }
    })
  }
  onSubmit(): void {
    if (this.form.valid) {
      const data = this.form.getRawValue();
      if (data.id) {
        this.service.updateOvertime(data).subscribe(() => {
          this.getOvertime();
          this.form.reset();
        });
      } else {
        this.service.addOvertime(data).subscribe(() => {
          this.getOvertime();
          this.form.reset();
        });
      }
    }
  }

  editOvertime(id: number | undefined): void {
    if (id !== undefined) {
      const leave = this.overtimes.find(l => l.id === id);
      if (leave) {
        this.form.patchValue(leave);
        // Scroll to form for better UX
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  deleteOvertime(id: number | undefined): void {
    if (id !== undefined && confirm('Are you sure you want to delete this leave?')) {
      this.service.deleteOvertime(id).subscribe(() => {
        this.getOvertime();
      });
    }
  }
  clearForm(): void {
    this.form.reset();
  }
  ngOnInit(): void {
    this.getEmployee();
    this.getOvertime();
  }
}
