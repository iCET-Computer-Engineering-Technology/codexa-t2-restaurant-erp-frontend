import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {BasicSalaryService} from '../../../services/manager/basic-salary-service';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BasicSalaryModel} from '../../../models/salary.model';

@Component({
  selector: 'app-basic-salary',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './basic-salary.html',
  styleUrl: './basic-salary.css',
})
export class BasicSalary implements OnInit{

  basicSalaries: BasicSalaryModel[] = [];
  form!: FormGroup;
  constructor(private readonly service: BasicSalaryService,
              private readonly cdr: ChangeDetectorRef,
              private readonly fb: FormBuilder)
  {
    this.form = this.fb.group({
      id: [null],
      roleName: ['', Validators.required],
      amount: ['',[Validators.required, Validators.min(0)]],
    });
  }

  getBasicSalary(){
    this.service.getAllBasicSalaries().subscribe({
      next: (data :any) => {
        this.basicSalaries = data;
        this.cdr.detectChanges();
      }
    })
  }

  ngOnInit(): void {
    this.getBasicSalary();
  }

  onSubmit(): void {
    if (this.form.valid) {
      const data = this.form.getRawValue();
      if (data.id) {
        this.service.updateBasicSalary(data).subscribe(() => {
          this.getBasicSalary();
          this.form.reset();
        });
      } else {
        this.service.addBasicSalary(data).subscribe(() => {
          this.getBasicSalary();
          this.form.reset();
        });
      }
    }
  }

  editBasicSalary(id: number | undefined): void {
    if (id !== undefined) {
      const salary = this.basicSalaries.find(s => s.id === id);
      if (salary) {
        this.form.patchValue(salary);
        // Scroll to form for better UX
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }
  clearForm(): void {
    this.form.reset();
  }
  deleteBasicSalary(id: number | undefined): void {
    if (id !== undefined && confirm('Are you sure you want to delete this salary?')) {
      this.service.deleteBasicSalary(id).subscribe(() => {
        this.getBasicSalary();
      });
    }
  }
}
