import { Timestamp } from "rxjs";

export interface CategoryModel {
    id : number;
    name : String;
    isActive : Boolean;
}

export interface PortionsModel {
    id : number;
    name : String;
}

export interface MenuItemsModel{
    id : number;
    name : String;
    categoryId : number;
    description : String;
    isAvailable : Boolean;
    imageUrl : String;
}