import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SupabaseStorageService {
    private client?: SupabaseClient;

    private getClient(): SupabaseClient {
        if (this.client) {
            return this.client;
        }

        const config = environment.supabase;
        if (!config?.url || !config?.anonKey) {
            throw new Error(
                'Supabase is not configured. Set environment.supabase.url and environment.supabase.anonKey.'
            );
        }

        this.client = createClient(config.url, config.anonKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });

        return this.client;
    }

    async uploadMenuItemImage(file: File): Promise<string> {
        const config = environment.supabase;
        if (!config?.bucket) {
            throw new Error('Supabase bucket is not configured (environment.supabase.bucket).');
        }

        if (!file.type.startsWith('image/')) {
            throw new Error('Please select an image file.');
        }

        // Soft client-side guard (you can tune this)
        const maxBytes = 5 * 1024 * 1024;
        if (file.size > maxBytes) {
            throw new Error('Image is too large. Please upload an image under 5MB.');
        }

        const ext = this.safeExtension(file.name) ?? this.extensionFromMime(file.type) ?? 'png';
        const id =
            (globalThis.crypto as Crypto | undefined)?.randomUUID?.() ??
            `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const objectPath = `menu-items/${id}.${ext}`;

        const supabase = this.getClient();
        const upload = await supabase.storage
            .from(config.bucket)
            .upload(objectPath, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type,
            });

        if (upload.error) {
            throw new Error(upload.error.message);
        }

        const publicUrl = supabase.storage.from(config.bucket).getPublicUrl(objectPath);
        const url = publicUrl.data?.publicUrl;
        if (!url) {
            throw new Error('Upload succeeded but could not resolve a public URL.');
        }

        return url;
    }

    private safeExtension(fileName: string): string | undefined {
        const lastDot = fileName.lastIndexOf('.');
        if (lastDot < 0 || lastDot === fileName.length - 1) {
            return undefined;
        }

        const raw = fileName.slice(lastDot + 1).trim().toLowerCase();
        const sanitized = raw.replace(/[^a-z0-9]/g, '');
        return sanitized.length > 0 ? sanitized : undefined;
    }

    private extensionFromMime(mime: string): string | undefined {
        switch (mime) {
            case 'image/jpeg':
                return 'jpg';
            case 'image/png':
                return 'png';
            case 'image/webp':
                return 'webp';
            case 'image/gif':
                return 'gif';
            case 'image/svg+xml':
                return 'svg';
            default:
                return undefined;
        }
    }
}
