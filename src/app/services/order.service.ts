import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
    EMPTY,
    Observable,
    catchError,
    concatMap,
    defaultIfEmpty,
    from,
    map,
    of,
    switchMap,
    take,
    throwError,
} from 'rxjs';

import { environment } from '../../environments/environment';
import {
    CustomerDto,
    MenuCategoriesDto,
    MenuItemPriceDto,
    MenuItemsDto,
    OrderTypeDto,
    OrderCreateRequest,
    OrderResponse,
    PortionDto,
    TableDto,
} from '../models/order-placement.model';
import { OrderWithItemNameResponse } from '../models/order.model';

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private readonly http = inject(HttpClient);

    private readonly apiUrl = environment.apiUrl; //http://localhost:8080/api
    private readonly rootUrl = environment.apiUrl.replace(/\/api\/?$/, ''); //http://localhost:8080

    //Category Tabs
    getAllCategories(): Observable<MenuCategoriesDto[]> {
        return this.firstSuccessfulGet<MenuCategoriesDto[]>(
            [`${this.apiUrl}/categories/get-all`, `${this.apiUrl}/categories`],
            (response) => this.normalizeCategories(response),
            []
        );
    }

    //Menu Items Grid
    getMenuItemsByCategory(categoryId: number): Observable<MenuItemsDto[]> {
        return this.firstSuccessfulGet<MenuItemsDto[]>(
            [
                `${this.apiUrl}/menu-items/category/${categoryId}`,
                `${this.apiUrl}/menu-items?categoryId=${categoryId}`,
            ],
            (response) => this.normalizeMenuItems(response),
            []
        );
    }

    getItemPrices(itemId: number): Observable<MenuItemPriceDto[]> {
        const primaryUrl = `${this.apiUrl}/menu-item-price/get-price/${itemId}`;
        const fallbackUrl = `${this.apiUrl}/menu-item-price/find/${itemId}`;

        return this.http
            .get<unknown>(primaryUrl)
            .pipe(
                map((res) => this.normalizeMenuItemPrices(res, itemId)),
                switchMap((prices) => {
                    if (prices.length > 0) {
                        return of(prices);
                    }
                    return this.http
                        .get<unknown>(fallbackUrl)
                        .pipe(map((res) => this.normalizeMenuItemPrices(res, itemId)));
                }),
                catchError((error) => {
                    console.error('Error fetching item prices:', error);
                    return throwError(() => error);
                })
            );
    }

    //Portions (master list)
    getAllPortions(): Observable<PortionDto[]> {
        return this.firstSuccessfulGet<PortionDto[]>(
            [
                `${this.apiUrl}/portions/get-all`,
                `${this.apiUrl}/portion/get-all`,
                `${this.apiUrl}/portions`,
                `${this.apiUrl}/portion`,
            ],
            (response) => this.normalizePortions(response),
            []
        );
    }

    //Order Types
    getActiveOrderTypes(): Observable<OrderTypeDto[]> {
        return this.firstSuccessfulGet<OrderTypeDto[]>(
            [`${this.apiUrl}/order-types/active`, `${this.apiUrl}/order-types`],
            (response) => this.normalizeOrderTypes(response),
            []
        );
    }

    private normalizeOrderTypes(response: unknown): OrderTypeDto[] {
        const candidates = this.extractArray<Record<string, unknown>>(response);
        return candidates
            .map((raw: any) => {
                const id = Number(raw?.id ?? raw?.orderTypeId ?? raw?.order_type_id);
                const typeName = String(raw?.typeName ?? raw?.type_name ?? raw?.orderType ?? raw?.name ?? '').trim();
                const description = raw?.description != null ? String(raw.description) : undefined;
                const isActive = Boolean(raw?.isActive ?? raw?.active ?? true);
                const createdAt = raw?.createdAt != null ? String(raw.createdAt) : undefined;
                const updatedAt = raw?.updatedAt != null ? String(raw.updatedAt) : undefined;

                return { id, typeName, description, isActive, createdAt, updatedAt } satisfies OrderTypeDto;
            })
            .filter((t) => Number.isFinite(t.id) && t.id > 0 && t.typeName.length > 0);
    }

    private normalizePortions(response: unknown): PortionDto[] {
        const candidates = this.extractArray<Record<string, unknown>>(response);
        return candidates
            .map((raw: any) => {
                const id = Number(raw?.id ?? raw?.portionId ?? raw?.portion_id);
                const name = String(raw?.name ?? raw?.portionName ?? raw?.portion_name ?? raw?.label ?? '').trim();
                const isActive = Boolean(raw?.isActive ?? raw?.active ?? true);
                return { id, name, isActive } satisfies PortionDto;
            })
            .filter((p) => Number.isFinite(p.id) && p.id > 0 && p.name.length > 0);
    }

    private normalizeMenuItemPrices(response: unknown, fallbackItemId: number): MenuItemPriceDto[] {
        const candidates = this.extractArray<Record<string, unknown>>(response);

        return candidates
            .map((raw: any) => {
                const portionId = Number(
                    raw?.portionId ??
                    raw?.portion_id ??
                    raw?.portion?.id ??
                    raw?.portion?.portionId
                );
                const itemId = Number(raw?.itemId ?? raw?.menuItemId ?? raw?.menu_item_id ?? fallbackItemId);
                const price = Number(raw?.price ?? raw?.unitPrice ?? raw?.amount);
                const portionNameRaw =
                    raw?.portionName ??
                    raw?.portion_name ??
                    raw?.portionType ??
                    raw?.portion_type ??
                    raw?.sizeName ??
                    raw?.size_name ??
                    raw?.size ??
                    raw?.type ??
                    raw?.portion?.name ??
                    raw?.portion?.portionName ??
                    raw?.portion?.portion_name ??
                    raw?.portion?.type ??
                    raw?.portion?.size ??
                    raw?.portion?.label;

                const portionName = (() => {
                    if (typeof portionNameRaw === 'string' && portionNameRaw.trim().length > 0) {
                        return portionNameRaw.trim();
                    }
                    // If backend doesn't return a name, still show unique label per portionId
                    if (Number.isFinite(portionId) && portionId > 0) {
                        return `Portion ${portionId}`;
                    }
                    return 'Portion';
                })();
                const id = Number(raw?.id ?? 0);
                const isActive = Boolean(raw?.isActive ?? raw?.active ?? true);

                return {
                    id,
                    itemId,
                    portionId,
                    price,
                    isActive,
                    itemName: raw?.itemName,
                    categoryName: raw?.categoryName,
                    portionName,
                } satisfies MenuItemPriceDto;
            })
            .filter(
                (p) =>
                    Number.isFinite(p.itemId) &&
                    Number.isFinite(p.portionId) &&
                    Number.isFinite(p.price)
            );
    }

    private normalizeCategories(response: unknown): MenuCategoriesDto[] {
        const candidates = this.extractArray<Record<string, unknown>>(response);
        return candidates
            .map((raw: any) => ({
                id: Number(raw?.id ?? raw?.categoryId ?? raw?.category_id),
                name: String(raw?.name ?? raw?.categoryName ?? raw?.category_name ?? ''),
                isActive: Boolean(raw?.isActive ?? raw?.active ?? true),
            }))
            .filter((c) => Number.isFinite(c.id) && c.name.length > 0);
    }

    private normalizeMenuItems(response: unknown): MenuItemsDto[] {
        const candidates = this.extractArray<Record<string, unknown>>(response);
        return candidates
            .map((raw: any) => ({
                id: Number(raw?.id ?? raw?.itemId ?? raw?.menuItemId ?? raw?.menu_item_id),
                categoryId: Number(raw?.categoryId ?? raw?.category?.id ?? raw?.category_id ?? 0),
                categoryName: raw?.categoryName ?? raw?.category?.name,
                name: String(raw?.name ?? raw?.itemName ?? raw?.menuItemName ?? ''),
                description: raw?.description != null ? String(raw.description) : undefined,
                isAvailable: raw?.isAvailable != null ? Boolean(raw.isAvailable) : undefined,
                imageUrl: this.normalizeImageUrl(
                    raw?.imageUrl ??
                    raw?.image_url ??
                    raw?.image ??
                    raw?.photoUrl ??
                    raw?.photo_url ??
                    raw?.thumbnailUrl ??
                    raw?.thumbnail_url ??
                    raw?.thumbnail
                ),
                createdAt: raw?.createdAt != null ? String(raw.createdAt) : undefined,
                updatedAt: raw?.updatedAt != null ? String(raw.updatedAt) : undefined,
            }))
            .filter((i) => Number.isFinite(i.id) && i.name.length > 0);
    }

    private normalizeImageUrl(value: unknown): string | undefined {
        if (value == null) {
            return undefined;
        }

        const raw = String(value).trim();
        if (raw.length === 0) {
            return undefined;
        }

        // Normalize Windows
        const normalizedPath = raw.replace(/\\/g, '/');

        // Allow already usable URLs
        if (normalizedPath.startsWith('data:') || normalizedPath.startsWith('blob:')) {
            return normalizedPath;
        }

        if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
            try {
                return new URL(normalizedPath).toString();
            } catch {
                return normalizedPath;
            }
        }

        // Resolve absolute paths against root URL
        try {
            return new URL(normalizedPath, `${this.rootUrl}/`).toString();
        } catch {
            return raw;
        }
    }

    private extractArray<T>(response: unknown): T[] {
        if (Array.isArray(response)) {
            return response as T[];
        }

        const obj = response as any;
        const knownKeys = [
            'data',
            'result',
            'results',
            'items',
            'prices',
            'priceList',
            'menuItemPrices',
            'menuItemPriceList',
            'payload',
        ];

        for (const key of knownKeys) {
            if (Array.isArray(obj?.[key])) {
                return obj[key] as T[];
            }
        }

        return [];
    }

    //Order Form: Tables
    getAllTables(): Observable<TableDto[]> {
        return this.firstSuccessfulGet<TableDto[]>(
            [`${this.apiUrl}/tables`, `${this.rootUrl}/tables`],
            (response) => this.normalizeTables(response),
            []
        );
    }

    private normalizeTables(response: unknown): TableDto[] {
        const candidates = this.extractArray<Record<string, unknown>>(response);
        return candidates
            .map((raw: any) => ({
                id: Number(raw?.id ?? raw?.tableId ?? raw?.table_id),
                tableNumber: String(raw?.tableNumber ?? raw?.number ?? raw?.table_number ?? ''),
                capacity: raw?.capacity != null ? Number(raw.capacity) : raw?.seats != null ? Number(raw.seats) : undefined,
                status: raw?.status != null ? String(raw.status) : raw?.tableStatus != null ? String(raw.tableStatus) : undefined,
            } satisfies TableDto))
            .filter((t) => Number.isFinite(t.id) && t.tableNumber.length > 0);
    }

    //Order Form: Customer search
    searchCustomer(mobile: string): Observable<CustomerDto> {
        const phone = encodeURIComponent(mobile);
        return this.firstSuccessfulGetOrThrow<CustomerDto>(
            [`${this.rootUrl}/customers/search/phone/${phone}`, `${this.apiUrl}/customers/search/phone/${phone}`],
            (response) => this.normalizeCustomer(response)
        );
    }

    private normalizeCustomer(response: unknown): CustomerDto {
        const raw = (response as any)?.data ?? (response as any)?.result ?? response;

        return {
            id: Number(raw?.id ?? raw?.customerId ?? raw?.customer_id ?? 0),
            firstName: String(raw?.firstName ?? raw?.first_name ?? ''),
            lastName: String(raw?.lastName ?? raw?.last_name ?? ''),
            email: raw?.email != null ? String(raw.email) : undefined,
            phone: String(raw?.phone ?? raw?.mobile ?? raw?.mobileNumber ?? raw?.mobile_number ?? ''),
            address: raw?.address != null ? String(raw.address) : undefined,
            preferredLanguage: raw?.preferredLanguage != null ? String(raw.preferredLanguage) : undefined,
            dietaryNotes: raw?.dietaryNotes != null ? String(raw.dietaryNotes) : undefined,
            communicationEmail: raw?.communicationEmail != null ? Number(raw.communicationEmail) : undefined,
            communicationSms: raw?.communicationSms != null ? Number(raw.communicationSms) : undefined,
            gdprDeleted: raw?.gdprDeleted != null ? Number(raw.gdprDeleted) : undefined,
            birthday: raw?.birthday != null ? String(raw.birthday) : undefined,
            loyaltyPoints: raw?.loyaltyPoints != null ? Number(raw.loyaltyPoints) : undefined,
            createdAt: raw?.createdAt != null ? String(raw.createdAt) : undefined,
        } satisfies CustomerDto;
    }

    //Submit
    createOrder(orderData: OrderCreateRequest): Observable<OrderResponse> {
        return this.firstSuccessfulPostOrThrow<OrderResponse>(
            [`${this.apiUrl}/order/create`, `${this.apiUrl}/orders`],
            orderData,
            (response) => this.normalizeOrderResponse(response)
        );
    }

    // View Orders Tab Methods
    getAllOrdersWithItemNames(): Observable<OrderWithItemNameResponse[]> {
        return this.http.get<OrderWithItemNameResponse[]>(
            `${this.apiUrl}/order/find-all-with-item-names`
        ).pipe(
            map(orders => orders.map(order => this.normalizeOrderWithItems(order)))
        );
    }

    getOrdersByStatus(status: string): Observable<OrderWithItemNameResponse[]> {
        return this.http.get<OrderWithItemNameResponse[]>(
            `${this.apiUrl}/order/find-by-status/${status}`
        ).pipe(
            map(orders => orders.map(order => this.normalizeOrderWithItems(order)))
        );
    }

    getOrderWithItemNamesById(id: number): Observable<OrderWithItemNameResponse> {
        return this.http.get<OrderWithItemNameResponse>(
            `${this.apiUrl}/order/find-with-item-names/${id}`
        ).pipe(
            map(order => this.normalizeOrderWithItems(order))
        );
    }

    private normalizeOrderWithItems(raw: any): OrderWithItemNameResponse {
        return {
            id: Number(raw?.id ?? 0),
            orderTypeId: raw?.orderTypeId != null ? Number(raw.orderTypeId) : undefined,
            orderNumber: String(raw?.orderNumber ?? ''),
            orderType: String(raw?.orderType ?? ''),
            tableId: raw?.tableId != null ? Number(raw.tableId) : undefined,
            customerId: raw?.customerId != null ? Number(raw.customerId) : undefined,
            serverId: raw?.serverId != null ? Number(raw.serverId) : undefined,
            status: String(raw?.status ?? 'unknown'),
            subTotal: Number(raw?.subTotal ?? 0),
            discountAmount: Number(raw?.discountAmount ?? 0),
            taxAmount: Number(raw?.taxAmount ?? 0),
            serviceCharge: Number(raw?.serviceCharge ?? 0),
            totalAmount: Number(raw?.totalAmount ?? 0),
            notes: raw?.notes != null ? String(raw.notes) : undefined,
            createdAt: String(raw?.createdAt ?? ''),
            updatedAt: String(raw?.updatedAt ?? ''),
            items: Array.isArray(raw?.items) ? raw.items.map((item: any) => ({
                id: Number(item?.id ?? 0),
                menuItemId: Number(item?.menuItemId ?? 0),
                menuItemName: String(item?.menuItemName ?? item?.itemName ?? ''),
                portionId: Number(item?.portionId ?? 0),
                portionName: String(item?.portionName ?? ''),
                quantity: Number(item?.quantity ?? 0),
                price: Number(item?.price ?? 0),
                lineTotal: item?.lineTotal != null ? Number(item.lineTotal) : Number(item?.price ?? 0) * Number(item?.quantity ?? 0),
                status: item?.status != null ? String(item.status) : undefined,
                notes: item?.notes != null ? String(item.notes) : undefined,
            })) : []
        };
    }

    private firstSuccessfulGet<T>(
        urls: string[],
        normalize: (response: unknown) => T,
        fallbackValue: T
    ): Observable<T> {
        return from(urls).pipe(
            concatMap((url) =>
                this.http.get<unknown>(url).pipe(
                    map((response) => normalize(response)),
                    catchError(() => EMPTY)
                )
            ),
            take(1),
            defaultIfEmpty(fallbackValue)
        );
    }

    private firstSuccessfulGetOrThrow<T>(
        urls: string[],
        normalize: (response: unknown) => T
    ): Observable<T> {
        return from(urls).pipe(
            concatMap((url) =>
                this.http.get<unknown>(url).pipe(
                    map((response) => normalize(response)),
                    catchError(() => EMPTY)
                )
            ),
            take(1),
            defaultIfEmpty(null as unknown as T),
            switchMap((value) => (value == null ? throwError(() => new Error('Request failed')) : of(value)))
        );
    }

    private firstSuccessfulPostOrThrow<T>(
        urls: string[],
        body: unknown,
        normalize: (response: unknown) => T
    ): Observable<T> {
        return from(urls).pipe(
            concatMap((url) =>
                this.http.post<unknown>(url, body).pipe(
                    map((response) => normalize(response)),
                    catchError(() => EMPTY)
                )
            ),
            take(1),
            defaultIfEmpty(null as unknown as T),
            switchMap((value) => (value == null ? throwError(() => new Error('Request failed')) : of(value)))
        );
    }

    private normalizeOrderResponse(response: unknown): OrderResponse {
        const raw = (response as any)?.data ?? (response as any)?.result ?? response;

        return {
            id: Number(raw?.id ?? raw?.orderId ?? 0),
            orderTypeId: raw?.orderTypeId != null ? Number(raw.orderTypeId) : undefined,
            orderNumber: String(raw?.orderNumber ?? raw?.order_no ?? raw?.number ?? ''),
            orderType: String(raw?.orderType ?? raw?.type ?? ''),
            tableId: raw?.tableId != null ? Number(raw.tableId) : undefined,
            customerId: raw?.customerId != null ? Number(raw.customerId) : undefined,
            serverId: raw?.serverId != null ? Number(raw.serverId) : undefined,
            status: raw?.status != null ? String(raw.status) : undefined,
            subTotal: raw?.subTotal != null ? Number(raw.subTotal) : undefined,
            discountAmount: raw?.discountAmount != null ? Number(raw.discountAmount) : undefined,
            taxAmount: raw?.taxAmount != null ? Number(raw.taxAmount) : undefined,
            serviceCharge: raw?.serviceCharge != null ? Number(raw.serviceCharge) : undefined,
            totalAmount: raw?.totalAmount != null ? Number(raw.totalAmount) : raw?.total != null ? Number(raw.total) : undefined,
            notes: raw?.notes != null ? String(raw.notes) : undefined,
            createdAt: raw?.createdAt != null ? String(raw.createdAt) : undefined,
            updatedAt: raw?.updatedAt != null ? String(raw.updatedAt) : undefined,
            items: Array.isArray(raw?.items) ? raw.items : undefined,
        } satisfies OrderResponse;
    }
}
