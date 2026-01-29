/**
 * Convert "0000000000350AEE" to "0x00350AEE" if length is 16 and first 8 are 0.
 * Convert "0x0000000000350AEE" to "0x00350AEE" if length is 18 and first are "0x00000000".
 * Otherwise return the original handle.
 * @param hwnd - The handle to convert
 * @returns The converted handle
 */
export function normalizeHwnd(hwnd: string): string {
    if (hwnd.length === 16 && hwnd.startsWith("00000000")) {
        return "0x" + hwnd.substring(8);
    }
    if (hwnd.length === 18 && hwnd.startsWith("0x00000000")) {
        return hwnd.substring(2);
    }
    return hwnd;
}

export function asHexNumber({ value, prefix, digits }: { value: number; prefix?: boolean; digits?: number }): string {
    let rv = value.toString(16);
    if (digits) {
        rv = rv.padStart(digits, '0');
    }
    if (prefix) {
        rv = "0x" + rv;
    }
    return rv;
}

export function asHex({ value, prefix, digits }: { value: string; prefix?: boolean; digits?: number }): string {
    const num = parseInt(value);
    if (isNaN(num)) {
        return value;
    }
    return asHexNumber({ value: num, prefix, digits });
}
