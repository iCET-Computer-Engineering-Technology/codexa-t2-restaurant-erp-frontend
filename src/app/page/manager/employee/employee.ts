import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule, NgForOf, NgIf} from '@angular/common';
import {EmployeeService} from '../../../services/manager/employee-service';
import {EmployeeModel, UserModel} from '../../../models/salary.model';
import {BasicSalaryService} from '../../../services/manager/basic-salary-service';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgForOf,
    NgIf,
    ReactiveFormsModule
  ],
  templateUrl: './employee.html',
  styleUrl: './employee.css',
})
export class Employee implements OnInit {
  users: UserModel[] = [];
  employees: EmployeeModel[] = [];
  form!: FormGroup;
  constructor(private readonly service: EmployeeService,
              private readonly cdr: ChangeDetectorRef,
              private readonly basicSalaryService: BasicSalaryService,
              private readonly fb: FormBuilder)
      {
        this.form = this.fb.group({
            id: [null],
            user_id: [null],
            firstName: ['',[Validators.required]],
            lastName: ['',[Validators.required]],
            email: ['',[Validators.required]],
            phone: ['',[Validators.required]],
            basicSalary: [''],
            department: ['',[Validators.required]],
            designation: ['',[Validators.required]],
        })
      }

      getUser():void{
        this.service.getAllUser().subscribe({
          next: (data :any) => {
            this.users = data;
            this.cdr.detectChanges();
          }
        })
      }
      setBaciSalary(){
        const userId = Number(this.form.get('user_id')?.value);
        console.log(userId);
        if (userId) {
          const selectedUser = this.users.find(u => u.id === userId);
          if (selectedUser) {
            // Get basic salary by role
            this.basicSalaryService.getBasicSalaryByRole(selectedUser.role).subscribe({
              next: (data: any) => {
                if (data) {
                  this.form.patchValue({
                    basicSalary: data.amount
                  });
                }
                this.cdr.detectChanges();
              }
            });
          }
        }
      }
      getEmployee():void{
        this.service.getAllEmployee().subscribe({
          next: (data :any) => {
            this.employees = data;
            this.cdr.detectChanges();
          }
        })
      }

      onSubmit(): void {
        if (this.form.valid) {
          const data = this.form.getRawValue();
          if (data.id) {
            this.service.updateEmployee(data).subscribe(() => {
              this.getEmployee();
              this.form.reset();
            });
          } else {
            this.service.addEmployee(data).subscribe(() => {
              this.getEmployee();
              this.form.reset();
            });
          }
        }
      }

      editEmployee(id: number | undefined): void {
        if (id !== undefined) {
          const leave = this.employees.find(l => l.id === id);
          if (leave) {
            this.form.patchValue(leave);
            // Scroll to form for better UX
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      }

      deleteEmployee(id: number | undefined): void {
        if (id !== undefined && confirm('Are you sure you want to delete this leave?')) {
          this.service.deleteEmployee(id).subscribe(() => {
            this.getEmployee();
          });
        }
      }
      clearForm(): void {
        this.form.reset();
      }
      ngOnInit(): void {
          this.getUser();
          this.getEmployee();

          // Listen to user_id changes to populate salary based on role
          this.form.get('user_id')?.valueChanges.subscribe(() => {
            this.setBaciSalary();
          });
      }
}
