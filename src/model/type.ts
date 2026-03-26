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
    categoryName?: string;
    description : String;
    isAvailable : Boolean;
    imageUrl : String;

}

export interface MenuItemPriceModel {
    id : number;
    itemName : string;
    portionName : string;
    price : number;
    isActive : Boolean;
    itemId : number;
    portionId : number;

}