import { useState, useEffect } from 'react';
import api from './api';

// Fallback numbers for Nepal store
const DEFAULT_WHATSAPP = '9779842228345';
const DEFAULT_PHONE = '+977-9842228345';

// In-memory cache
let cachedWhatsAppNumber = DEFAULT_WHATSAPP;
let cachedDisplayPhone = DEFAULT_PHONE;
let cachedWhatsAppUrl = `https://wa.me/${DEFAULT_WHATSAPP}`;
let isInitialized = false;
let fetchPromise = null;

const listeners = new Set();

const notifyListeners = () => {
    listeners.forEach((fn) => {
        try {
            fn({
                whatsappNumber: cachedWhatsAppNumber,
                displayPhone: cachedDisplayPhone,
                whatsappUrl: cachedWhatsAppUrl,
            });
        } catch (e) {
            console.error('Error in contactConfig listener:', e);
        }
    });
};

/**
 * Extracts raw phone digits from various WhatsApp URL formats:
 * - https://wa.me/+9779822016230?text=...
 * - https://wa.me/9779822016230
 * - https://api.whatsapp.com/send?phone=9779822016230
 * - +977-9822016230 or raw numbers
 */
export const parseWhatsAppNumber = (raw) => {
    if (!raw) return '';
    const str = String(raw).trim();

    // 1. wa.me/<number>
    const waMatch = str.match(/wa\.me\/(?:\+?)([0-9]{7,15})/i);
    if (waMatch && waMatch[1]) return normalizeWhatsAppDigits(waMatch[1]);

    // 2. phone=<number> parameter
    const phoneParamMatch = str.match(/[?&]phone=(?:\+?)([0-9]{7,15})/i);
    if (phoneParamMatch && phoneParamMatch[1]) return normalizeWhatsAppDigits(phoneParamMatch[1]);

    // 3. raw digits (stripping non-digits)
    const digits = str.replace(/[^0-9]/g, '');
    if (digits.length >= 7 && digits.length <= 15) return normalizeWhatsAppDigits(digits);

    return '';
};

/**
 * Normalizes 10-digit mobile numbers in Nepal context (e.g. 98xxxxxxxx -> 97798xxxxxxxx)
 */
export const normalizeWhatsAppDigits = (digits) => {
    if (!digits) return '';
    const clean = String(digits).replace(/[^0-9]/g, '');
    // If Nepal 10-digit mobile starting with 98, 97, or 96
    if (clean.length === 10 && (clean.startsWith('98') || clean.startsWith('97') || clean.startsWith('96'))) {
        return `977${clean}`;
    }
    return clean;
};

/**
 * Formats a clean phone number for display (e.g. +977-9822016230)
 */
export const formatDisplayPhone = (digits, rawPhone) => {
    // If a clean custom formatted phone string was provided in footer.phone (not the legacy Indian default), use it
    if (rawPhone && typeof rawPhone === 'string') {
        const trimmed = rawPhone.trim();
        // If it's not the old stale default when the user set a custom WhatsApp
        if (trimmed && trimmed !== '+91 7742228345' && trimmed !== '917742228345') {
            return trimmed;
        }
    }

    if (!digits) return DEFAULT_PHONE;
    const clean = String(digits).replace(/[^0-9]/g, '');

    if (clean.startsWith('977') && clean.length === 13) {
        return `+977-${clean.slice(3)}`;
    }
    if (clean.startsWith('91') && clean.length === 12) {
        return `+91-${clean.slice(2)}`;
    }
    if (clean.length === 10) {
        return `+977-${clean}`;
    }
    return `+${clean}`;
};

/**
 * Extract WhatsApp number from CMS settings
 */
export const extractWhatsAppFromCms = (cmsData) => {
    if (!cmsData) return null;

    // 1. Search in contactIcons for WhatsApp
    const icons = cmsData.contactIcons;
    if (Array.isArray(icons)) {
        const waItem = icons.find(
            (c) => c && c.isActive !== false && (
                c.iconName === 'WhatsApp' ||
                String(c.platform || '').toLowerCase().includes('whatsapp')
            ) && c.url
        );
        if (waItem && waItem.url) {
            const num = parseWhatsAppNumber(waItem.url);
            if (num) return { number: num, rawUrl: waItem.url };
        }
    }

    // 2. Fallback: footer.phone
    if (cmsData.footer?.phone) {
        const num = parseWhatsAppNumber(cmsData.footer.phone);
        if (num) return { number: num, rawUrl: `https://wa.me/${num}` };
    }

    return null;
};

/**
 * Update the in-memory cache directly from CMS response data
 */
export const updateContactConfigCache = (cmsData) => {
    if (!cmsData) return;
    const extracted = extractWhatsAppFromCms(cmsData);
    if (extracted && extracted.number) {
        cachedWhatsAppNumber = extracted.number;
        cachedWhatsAppUrl = extracted.rawUrl || `https://wa.me/${extracted.number}`;
    }
    cachedDisplayPhone = formatDisplayPhone(cachedWhatsAppNumber, cmsData?.footer?.phone);
    isInitialized = true;
    notifyListeners();
};

/**
 * Fetch contact config from /api/cms (with deduplication)
 */
export const fetchContactConfig = async () => {
    if (fetchPromise) return fetchPromise;

    fetchPromise = api.get('/api/cms')
        .then(({ data }) => {
            updateContactConfigCache(data);
            return {
                whatsappNumber: cachedWhatsAppNumber,
                displayPhone: cachedDisplayPhone,
                whatsappUrl: cachedWhatsAppUrl,
            };
        })
        .catch((err) => {
            console.error('Failed to load contact config from /api/cms:', err);
            return {
                whatsappNumber: cachedWhatsAppNumber,
                displayPhone: cachedDisplayPhone,
                whatsappUrl: cachedWhatsAppUrl,
            };
        })
        .finally(() => {
            fetchPromise = null;
        });

    return fetchPromise;
};

// Immediate synchronous getters
export const getWhatsAppNumber = () => cachedWhatsAppNumber;
export const getDisplayPhone = () => cachedDisplayPhone;
export const getWhatsAppUrl = () => cachedWhatsAppUrl;

/**
 * React hook to subscribe to dynamic WhatsApp number and store phone
 */
export const useContactConfig = () => {
    const [config, setConfig] = useState({
        whatsappNumber: cachedWhatsAppNumber,
        displayPhone: cachedDisplayPhone,
        whatsappUrl: cachedWhatsAppUrl,
        isLoaded: isInitialized,
    });

    useEffect(() => {
        // Fetch on first mount
        fetchContactConfig().then((res) => {
            if (res) {
                setConfig({
                    ...res,
                    isLoaded: true,
                });
            }
        });

        const listener = (newConfig) => {
            setConfig({
                ...newConfig,
                isLoaded: true,
            });
        };

        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }, []);

    return config;
};

// Automatically initiate fetch in background on module load
if (typeof window !== 'undefined') {
    fetchContactConfig();
}
