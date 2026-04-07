import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RevenueService, RevenueData } from '../../services/revenue.service';

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './revenue.html',
  styleUrl: './revenue.css',
})
export class Revenue implements OnInit {
  
  // Basic Stats
  totalRevenue: number = 0;
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedCalendarDay: number = new Date().getDate();
  isLoading: boolean = false;
  errorMessage: string = '';
  calendarSubmitAlert: string = '';

  // Data Arrays for Charts and Tables
  public doughnutChartLabels: string[] = ['Dine-in', 'Delivery', 'Takeaway']; // Default labels for circles
  public doughnutChartData: number[] = [0, 0, 0]; // Initialize with zeros
  public dailyRevenueLabels: string[] = [];
  public dailyRevenueData: number[] = [];
  public transactions: RevenueData[] = [];

  // Calendar Properties
  currentMonth: Date = new Date();
  calendarDays: any[] = [];
  weekDays: string[] = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  monthNames: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  constructor(private revenueService: RevenueService) {}

  ngOnInit(): void {
    this.generateCalendar();
    
    // Load weekly data for Performance circles
    this.loadWeeklyRevenueData();
    
    this.fetchData();
    this.loadDailyRevenueData();
  }

  loadWeeklyRevenueData(): void {
    this.revenueService.getWeeklyRevenue().subscribe({
      next: (data: RevenueData[]) => {
        if (data && data.length > 0) {
          this.doughnutChartLabels = data.map(item => item.channelType);
          this.doughnutChartData = data.map(item => item.totalRevenue);
          this.totalRevenue = data.reduce((sum, item) => sum + item.totalRevenue, 0);
        }
      },
      error: (err) => {
        console.error('Error fetching weekly revenue data', err);
        // Keep showing mock data on error
      }
    });
  }

  fetchData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.revenueService.getDailyRevenue(this.selectedDate).subscribe({
      next: (data: RevenueData[]) => {
        if (data && data.length > 0) {
          // Only update transactions table, NOT the Performance circles (they show weekly data)
          this.transactions = data;
        } else {
          this.transactions = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Backend connection error:', err);
        this.errorMessage = 'Could not connect to the backend server.';
        this.isLoading = false;
        this.transactions = [];
      }
    });
  }

  loadDailyRevenueData(): void {
    const labels = [];
    const values = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(days[d.getDay()]);
      values.push(Math.floor(Math.random() * 40000) + 10000);
    }
    this.dailyRevenueLabels = labels;
    this.dailyRevenueData = values;
  }

  // --- Helper Methods for UI ---

  getBarHeightPercent(revenue: number): number {
    const max = Math.max(...this.dailyRevenueData, 1);
    return (revenue / max) * 100;
  }

  getChannelPercentage(index: number): number {
    if (this.totalRevenue === 0 || !this.doughnutChartData[index]) return 0;
    return (this.doughnutChartData[index] / this.totalRevenue) * 100;
  }

  getCircleStrokeDasharray(index: number): string {
    const percentage = this.getChannelPercentage(index);
    const circumference = 2 * Math.PI * 50; // Radius=50 set in SVG
    const strokeDash = (percentage / 100) * circumference;
    return `${strokeDash} ${circumference}`;
  }

  getCircleColor(index: number): string {
    const colors = ['#06B6D4', '#3B82F6', '#8B5CF6']; // Cyan, Blue, Purple
    return colors[index] || '#cbd5e1';
  }

  // --- Calendar Logic  ---

  generateCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    this.calendarDays = [];
    
    for (let i = firstDay - 1; i >= 0; i--) {
      this.calendarDays.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, daysInPrevMonth - i)
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      this.calendarDays.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }
    
    const remainingDays = 42 - this.calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      this.calendarDays.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }
  }

  previousMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1);
    this.generateCalendar();
  }

  selectDateFromCalendar(day: any): void {
    if (day.isCurrentMonth) {
      const year = day.date.getFullYear();
      const month = String(day.date.getMonth() + 1).padStart(2, '0');
      const dayStr = String(day.date.getDate()).padStart(2, '0');
      
      this.selectedDate = `${year}-${month}-${dayStr}`;
      this.calendarSubmitAlert = `Date selected: ${dayStr}/${month}/${year} ✓`;
      setTimeout(() => this.calendarSubmitAlert = '', 3000);
      this.fetchData();
    }
  }

  isDateSelected(day: any): boolean {
    const year = day.date.getFullYear();
    const month = String(day.date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day.date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    
    return dateStr === this.selectedDate;
  }

  submitCalendarDate(): void {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(this.selectedCalendarDay).padStart(2, '0');
    
    this.selectedDate = `${year}-${month}-${day}`;
    this.calendarSubmitAlert = `Date selected: ${day}/${month}/${year} ✓`;
    setTimeout(() => this.calendarSubmitAlert = '', 3000);
    this.fetchData();
  }
}