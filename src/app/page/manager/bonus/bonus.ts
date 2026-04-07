import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {EmployeeService} from '../../../services/manager/employee-service';
import {BonusModel, EmployeeModel} from '../../../models/salary.model';
import {Employee} from '../employee/employee';
import {BonusService} from '../../../services/manager/bonus.service';
import {DecimalPipe, NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-bonus',
  imports: [
    DecimalPipe,
    NgForOf,
    NgIf,
    ReactiveFormsModule
  ],
  templateUrl: './bonus.html',
  styleUrl: './bonus.css',
})
export class Bonus implements OnInit{

  bonus: BonusModel [] = [];
  employees: EmployeeModel[] = [];
  form!: FormGroup;
  constructor(private readonly service:BonusService,
              private readonly cdr: ChangeDetectorRef,
              private readonly fb: FormBuilder,
              private readonly employeeService:EmployeeService,)
    {
      this.form = this.fb.group({
        id: [null],
        employeeId: [null],
        amount: [''],

        search: ['']
      })

    }
  getBonus(){
    this.service.getAllBonus().subscribe({
      next: (data :any) => {
        this.bonus = data;
        this.cdr.detectChanges();
      }
    })
  }
  clearForm(): void {
    this.form.reset();
  }
  getEmployee(){
    this.employeeService.getAllEmployee().subscribe({
      next: (data :any) => {
        this.employees = data;
        this.cdr.detectChanges();
      }
    })
  }

  ngOnInit(): void {
    this.getBonus();
    this.getEmployee();
  }

  employeeSearchByName(): void {
    const searchTerm = this.form.get('search')?.value?.toLowerCase() || '';

    if (searchTerm) {
      for (const employee of this.employees) {

        if (searchTerm === employee.firstName.toLowerCase()) {
          this.service.searchBonusById(employee.id).subscribe({
            next: (data: any) => {
              this.bonus = data;
              this.cdr.detectChanges();
            }
          });
          break;
        }

        else if (searchTerm === employee.lastName.toLowerCase()) {
          this.service.searchBonusById(employee.id).subscribe({
            next: (data: any) => {
              this.bonus = data;
              this.cdr.detectChanges();
            }
          });
          break;
        }

      }
    } else {
      this.getBonus();
    }
  }


  onSubmit(): void {
    if (this.form.valid) {
      const data = this.form.getRawValue();
      if (data.id) {
        this.service.updateBonus(data).subscribe(() => {
          this.getBonus();
          this.form.reset();
        });
      } else {
        this.service.addBonus(data).subscribe(() => {
          this.getBonus();
          this.form.reset();
        });
      }
    }
  }
  editBonus(id: number | undefined): void {
    if (id !== undefined) {
      const salary = this.bonus.find(s => s.id === id);
      if (salary) {
        this.form.patchValue(salary);
        // Scroll to form for better UX
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  deleteBonus(id: number | undefined): void {
    if (id !== undefined && confirm('Are you sure you want to delete this salary?')) {
      this.service.deleteBonus(id).subscribe(() => {
        this.getBonus();
      });
    }
  }
}
