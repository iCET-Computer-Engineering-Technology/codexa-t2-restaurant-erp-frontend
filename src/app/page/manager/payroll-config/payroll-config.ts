import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {NgIf} from "@angular/common";
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {PayrollConfigService} from '../../../services/manager/payroll-config-service';
import {PayrollConfigModel} from '../../../models/salary.model';

@Component({
  selector: 'app-payroll-config',
    imports: [
        FormsModule,
        NgIf,
        ReactiveFormsModule
    ],
  templateUrl: './payroll-config.html',
  styleUrl: './payroll-config.css',
})
export class PayrollConfig implements OnInit {
  payrollConfigs: PayrollConfigModel[] = [];
  form!: FormGroup;

  constructor(private readonly service: PayrollConfigService,
              private readonly cdr: ChangeDetectorRef,
              private readonly fb: FormBuilder,) {
    this.form = this.fb.group({
      id: [null],
      epfEmployeeRate: [null, [Validators.required, Validators.min(0)]],
      epfEmployerRate: [null, [Validators.required, Validators.min(0)]],
      etfRate: [null, [Validators.required,Validators.min(0)]],
    })
  }

  onSubmit(): void {
    if (this.form.valid) {
      const data = this.form.getRawValue();
      if (data.id) {
        this.service.updatePayrollConfig(data).subscribe(() => {
          this.getPayrollConfig();
          this.form.reset();
        });
      } else {
        this.service.addPayrollConfig(data).subscribe(() => {
          this.getPayrollConfig();
          this.form.reset();
        });
      }
    }
  }
  clearForm(): void {
    this.form.reset();
  }
  editPayrollConfig(id: number | undefined): void {
    if (id !== undefined) {
      const leave = this.payrollConfigs.find(l => l.id === id);
      if (leave) {
        this.form.patchValue(leave);
        // Scroll to form for better UX
        window.scrollTo({top: 0, behavior: 'smooth'});
      }
    }
  }

  deletePayrollConfig(id: number | undefined): void {
    if (id !== undefined && confirm('Are you sure you want to delete this leave?')) {
      this.service.deletePayrollConfig(id).subscribe(() => {
        this.getPayrollConfig();
      });
    }
  }

  getPayrollConfig() {
    this.service.getAllPayrollConfig().subscribe({
      next: (data: any) => {
        this.payrollConfigs = data;
        this.cdr.detectChanges();
      }
    })
  }
  ngOnInit(): void {
    this.getPayrollConfig();
  }

}
