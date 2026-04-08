import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {DecimalPipe, NgForOf, NgIf} from "@angular/common";
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {DeductionModel, EmployeeModel} from '../../../models/salary.model';
import {EmployeeService} from '../../../services/manager/employee-service';
import {DeductionService} from '../../../services/manager/deduction-service';

@Component({
  selector: 'app-deduction',
  standalone: true,
    imports: [
        DecimalPipe,
        FormsModule,
        NgForOf,
        NgIf,
        ReactiveFormsModule
    ],
  templateUrl: './deduction.html',
  styleUrl: './deduction.css',
})
export class Deduction implements OnInit{
  deductions: DeductionModel[] = [];
  employees: EmployeeModel[] = [];
  form!: FormGroup;
  constructor(private readonly service:DeductionService,
              private readonly cdr: ChangeDetectorRef,
              private readonly fb: FormBuilder,
              private readonly employeeService:EmployeeService,)
  {
    this.form = this.fb.group({
      id: [null],
      employeeId: [null, [Validators.required]],
      type: ['', Validators.required],
      amount: ['',[Validators.required, Validators.min(0)]],
    })
  }
  clearForm(): void {
    this.form.reset();
  }
  getDeduction(){
    this.service.getAllDeduction().subscribe({
      next: (data :any) => {
        this.deductions = data;
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
    this.getDeduction();
    this.getEmployee();
  }

  onSubmit(): void {
    if (this.form.valid) {
      const data = this.form.getRawValue();
      if (data.id) {
        this.service.updateDeduction(data).subscribe(() => {
          this.getDeduction();
          this.form.reset();
        });
      } else {
        this.service.addDeduction(data).subscribe(() => {
          this.getDeduction();
          this.form.reset();
        });
      }
    }
  }

  editDeduction(id: number | undefined): void {
    if (id !== undefined) {
      const salary = this.deductions.find(s => s.id === id);
      if (salary) {
        this.form.patchValue(salary);
        // Scroll to form for better UX
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  deleteDeduction(id: number | undefined): void {
    if (id !== undefined && confirm('Are you sure you want to delete this salary?')) {
      this.service.deleteDeduction(id).subscribe(() => {
        this.getDeduction();
      });
    }
  }
}
