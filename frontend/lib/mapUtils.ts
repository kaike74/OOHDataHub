/**
 * Map utilities for the OOHDataHub system
 */

import { PropostaItem } from './types';

interface MapBounds {
    center: { lat: number; lng: number };
    zoom: number;
}

/**
 * Calculates optimal map center and zoom level for a set of points
 * @param points - Array of proposal items with coordinates
 * @returns Map bounds with center and zoom
 */
export function getMapBounds(points: PropostaItem[]): MapBounds {
    const validPoints = points.filter(p => p.latitude && p.longitude);

    if (validPoints.length === 0) {
        // Default to Brazil center
        return {
            center: { lat: -14.235, lng: -51.925 },
            zoom: 4
        };
    }

    if (validPoints.length === 1) {
        return {
            center: {
                lat: validPoints[0].latitude!,
                lng: validPoints[0].longitude!
            },
            zoom: 15
        };
    }

    // Calculate bounds
    let minLat = validPoints[0].latitude!;
    let maxLat = validPoints[0].latitude!;
    let minLng = validPoints[0].longitude!;
    let maxLng = validPoints[0].longitude!;

    validPoints.forEach(point => {
        if (point.latitude! < minLat) minLat = point.latitude!;
        if (point.latitude! > maxLat) maxLat = point.latitude!;
        if (point.longitude! < minLng) minLng = point.longitude!;
        if (point.longitude! > maxLng) maxLng = point.longitude!;
    });

    // Calculate center
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Calculate zoom based on bounds
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);

    let zoom = 15;
    if (maxDiff > 10) zoom = 5;
    else if (maxDiff > 5) zoom = 6;
    else if (maxDiff > 2) zoom = 7;
    else if (maxDiff > 1) zoom = 8;
    else if (maxDiff > 0.5) zoom = 9;
    else if (maxDiff > 0.2) zoom = 10;
    else if (maxDiff > 0.1) zoom = 11;
    else if (maxDiff > 0.05) zoom = 12;
    else if (maxDiff > 0.02) zoom = 13;
    else if (maxDiff > 0.01) zoom = 14;

    return {
        center: { lat: centerLat, lng: centerLng },
        zoom
    };
}

/**
 * Generates a Google Maps Static API URL for the given points
 * @param points - Array of proposal items with coordinates
 * @param width - Map width in pixels (default: 800)
 * @param height - Map height in pixels (default: 400)
 * @returns Static map URL
 */
export function generateStaticMapUrl(
    points: PropostaItem[],
    width: number = 800,
    height: number = 400
): string {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.error('Google Maps API key not found');
        return '';
    }

    const validPoints = points.filter(p => p.latitude && p.longitude);

    if (validPoints.length === 0) {
        return '';
    }

    const bounds = getMapBounds(validPoints);

    // Build markers parameter
    const markers = validPoints.map(point =>
        `color:0xFC1E75|${point.latitude},${point.longitude}`
    ).join('&markers=');

    // Build URL
    const url = new URL('https://maps.googleapis.com/maps/api/staticmap');
    url.searchParams.set('center', `${bounds.center.lat},${bounds.center.lng}`);
    url.searchParams.set('zoom', bounds.zoom.toString());
    url.searchParams.set('size', `${width}x${height}`);
    url.searchParams.set('maptype', 'roadmap');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('scale', '2'); // Retina display

    // Add markers
    validPoints.forEach(point => {
        url.searchParams.append('markers', `color:0xFC1E75|${point.latitude},${point.longitude}`);
    });

    return url.toString();
}

/**
 * Converts a static map URL to a data URL (for embedding in PDFs)
 * @param mapUrl - Static map URL
 * @returns Promise resolving to data URL
 */
export async function mapUrlToDataUrl(mapUrl: string): Promise<string> {
    try {
        const response = await fetch(mapUrl);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Failed to convert map URL to data URL:', error);
        return '';
    }
}
