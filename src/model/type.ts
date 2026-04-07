export interface CategoryModel {
    id : number;
    name : string;
    isActive : boolean;
}

export interface PortionsModel {
    id : number;
    name : string;
}

export interface MenuItemsModel{
    id : number;
    name : string;
    categoryId : number;
    description : string;
    isAvailable : boolean;
    imageUrl : string;
}

export interface MenuItemPriceModel {
    id : number;
    itemName : string;
    portionName : string;
    price : number;
    isActive : boolean;
}