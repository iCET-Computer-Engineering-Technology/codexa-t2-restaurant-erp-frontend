import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import {DecimalPipe, NgForOf, NgIf} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {AllowanceService} from '../../../services/manager/allowance-service';
import {AllowanceModel, EmployeeModel} from '../../../models/salary.model';
import {EmployeeService} from '../../../services/manager/employee-service';

@Component({
  selector: 'app-allowance',
  standalone: true,
  imports: [DecimalPipe, FormsModule, NgIf, ReactiveFormsModule, NgForOf],
  templateUrl: './allowance.html',
  styleUrl: './allowance.css',
})
export class Allowance implements OnInit{

  allowancs: AllowanceModel[] = [];
  employees: EmployeeModel[] = [];
  form!: FormGroup;
  constructor(private readonly service:AllowanceService,
              private readonly cdr: ChangeDetectorRef,
              private readonly fb: FormBuilder,
              private readonly employeeService:EmployeeService,)
  {
    this.form = this.fb.group({
      id: [null],
      employeeId: [null, [Validators.required]],
      type: ['', Validators.required],
      other: [''],
      amount: ['',[Validators.required, Validators.min(0)]],

      search: ['']
    })
  }

  getAllowance(){
    this.service.getAllAllowance().subscribe({
      next: (data :any) => {
        this.allowancs = data;
        this.cdr.detectChanges();
      }
    })
  }
 getEmployee(){
    this.employeeService.getAllEmployee().subscribe({
      next: (data :any) => {
        this.employees = data;
        this.cdr.detectChanges();
      }
    })
  }
  clearForm(): void {
    this.form.reset();
  }
  ngOnInit(): void {
    this.getAllowance();
    this.getEmployee();
  }
  fillSearch(type: string): void {
    this.form.get('search')?.setValue(type);
    this.search();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const data = this.form.getRawValue();
      if (data.id) {
        this.service.updateAllowance(data).subscribe(() => {
          this.getAllowance();
          this.form.reset();
        });
      } else {
        this.service.addAllowance(data).subscribe(() => {
          this.getAllowance();
          this.form.reset();
        });
      }
    }
  }

  editAllowance(id: number | undefined): void {
    if (id !== undefined) {
      const salary = this.allowancs.find(s => s.id === id);
      if (salary) {
        this.form.patchValue(salary);
        // Scroll to form for better UX
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  deleteAllowance(id: number | undefined): void {
    if (id !== undefined && confirm('Are you sure you want to delete this salary?')) {
      this.service.deleteAllowance(id).subscribe(() => {
        this.getAllowance();
      });
    }
  }

  protected search() {
    const searchTerm = this.form.get('search')?.value?.trim();

    // If the search is empty and they hit Enter, show the full list again
    if (!searchTerm) {
      this.getAllowance();
      return;
    }

    this.service.getAllowanceByType(searchTerm).subscribe({
      next: (data: any) => {
        // Wrap single result in an array so the table can render it
        this.allowancs = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Search failed', err);
        this.allowancs = []; // Show empty state
        this.cdr.detectChanges();
      }
    });
  }

}
