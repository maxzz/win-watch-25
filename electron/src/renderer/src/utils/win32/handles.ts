/**
 * Convert "0000000000350AEE" to "0x00350AEE" if length is 16 and first 8 are 0.
 * Convert "0x0000000000350AEE" to "0x00350AEE" if length is 18 and first are "0x00000000".
 * Otherwise return the original handle.
 * @param hwnd - The handle to convert
 * @returns The converted handle
 */
export function normalizeHwnd(hwnd: string): string {
    if (!hwnd) {
        return hwnd;
    }
    if (hwnd.length === 16 && hwnd.startsWith("00000000")) {
        return "0x" + hwnd.substring(8);
    }
    if (hwnd.length === 18 && hwnd.startsWith("0x00000000")) {
        return "0x" + hwnd.substring(10);
    }
    return hwnd;
}

export function asHexNumber({ value, prefix, digits }: { value: number; prefix?: boolean; digits?: number; }): string {
    let rv = value.toString(16).toUpperCase();
    if (digits) {
        rv = rv.padStart(digits, '0');
    }
    if (prefix) {
        rv = "0x" + rv;
    }
    return rv;
}

export function asHex({ value, prefix, digits }: { value: string; prefix?: boolean; digits?: number; }): string {
    const num = parseInt(value);
    if (isNaN(num)) {
        return value;
    }
    return asHexNumber({ value: num, prefix, digits });
}

/**
 * Convert runtime ID to hex numbers.
 * @param runtimeId - The runtime ID to convert as "42.3998860.4.-2147483647.3998860.-4.32".
 * @returns The runtime ID converted to hex numbers as "2A.17962A83.4.80000001.17962A83.FFFFFFFC.2A".
 */
export function hexAccRuntimeId(runtimeId: string | undefined): string {
    if (!runtimeId) {
        return "";
    }
    const parts = runtimeId.split('.');
    const hexParts = parts.map(
        (part) => {
            const num = parseInt(part, 10);
            if (isNaN(num)) {
                return part;
            }
            const numberToFormat = num < 0 ? (num >>> 0) : num; // convert negative number to unsigned integer
            return numberToFormat.toString(16).toUpperCase();
        }
    );
    return hexParts.join('.');
}
