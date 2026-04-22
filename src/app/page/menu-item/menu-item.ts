import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CategoryModel, MenuItemsModel } from '../../../model/type';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';
import { SupabaseStorageService } from '../../services/supabase-storage.service';

@Component({
  selector: 'app-menu-items',
  imports: [FormsModule, CommonModule],
  templateUrl: './menu-item.html',
  styleUrl: './menu-item.css',
})
export class MenuItem implements OnInit {

  isEditMode : boolean = false;

  menuItemList: Array<MenuItemsModel> = [];
  currentPage: number = 1;
  itemsPerPage: number = 5; 

  categoryList: Array<CategoryModel> = [];

  uploadingImage = false;
  
  menuItemObj: MenuItemsModel = {
    id: 0,
    name: '',
    categoryId: 0,
    categoryName: '',
    description: '',
    isAvailable: true,
    imageUrl: ''
  }

  private readonly api = environment.apiUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef,
    private readonly supabaseStorage: SupabaseStorageService
  ) { }

  ngOnInit(): void {
    this.getAll();
    this.loadCategories();
  }

  loadCategories() {
    this.http.get<CategoryModel[]>(`${this.api}/categories/get-all`).subscribe(data => {
      this.categoryList = data;
    });
  }

  getAll() {
    this.http.get<MenuItemsModel[]>(`${this.api}/menu-items`).subscribe(data => {
      this.menuItemList = data.sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable));
      this.cdr.detectChanges();
    });
  }

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    this.uploadingImage = true;
    try {
      const publicUrl = await this.supabaseStorage.uploadMenuItemImage(file);
      this.menuItemObj.imageUrl = publicUrl;
    } catch (err: any) {
      const message = err?.message ? String(err.message) : 'Image upload failed.';
      console.error('Supabase upload failed:', err);
      Swal.fire('Upload failed', message, 'error');
    } finally {
      this.uploadingImage = false;
      if (input) {
        input.value = '';
      }
    }
  }

  get paginatedData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.menuItemList.slice(start, start + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.menuItemList.length / this.itemsPerPage);
  }

  getPagesArray() {
    return Array(this.totalPages).fill(0).map((x, i) => i + 1);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  addMenuItem(): void {
    if (this.uploadingImage) {
      Swal.fire('Please wait', 'Image is still uploading.', 'info');
      return;
    }

    this.http.post(`${this.api}/menu-items`, this.menuItemObj).subscribe(data => {
      this.getAll();
      this.clearForm();
    })
  }

  clearForm(): void {
    this.menuItemObj = {
      id: 0,
      name: '',
      categoryId: 0,
      categoryName: '',
      description: '',
      isAvailable: true,
      imageUrl: ''
    }
    this.isEditMode = false;
  }

  onEdit(menuItem : MenuItemsModel) : void {
    this.menuItemObj = { ...menuItem }; 
    this.isEditMode = true; 
  }

  updateMenuItem() : void {
    if (this.uploadingImage) {
      Swal.fire('Please wait', 'Image is still uploading.', 'info');
      return;
    }

    this.http.put(`${this.api}/menu-items` , this.menuItemObj).subscribe(data => {
      this.getAll();
      this.clearForm();
    })
  }

  deleteMenuItem(id: number): void {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626", 
      cancelButtonColor: "#6b7280", 
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${this.api}/menu-items/${id}`).subscribe({
          next: (data) => {
            Swal.fire("Deleted!", "The item has been deleted.", "success");
            this.getAll();
          },
          error: (err) => {
            console.error("Delete failed:", err);
            Swal.fire("Error", "Could not delete the item.", "error");
          }
        });
      }
    });
  }
}