import { Timestamp } from "rxjs";

export interface ItemsModel{
    id : number;
    name : String;
    description : String;
    category : String;
    isActive : Boolean;
}