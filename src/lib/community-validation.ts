export const PLATFORM_OWNER_EMAIL = "md.kamrujjaman092@gmail.com";
export const MAX_ACTIVE_COMMUNITIES = 10;

export function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

export function isPlatformOwner(email: string | null | undefined) {
    return normalizeEmail(email ?? "") === PLATFORM_OWNER_EMAIL;
}

export function getEmailDomain(email: string) {
    const normalizedEmail = normalizeEmail(email);
    const atIndex = normalizedEmail.lastIndexOf("@");
    return atIndex > 0 ? normalizedEmail.slice(atIndex + 1) : "";
}

export function isUniversityDomain(domain: string) {
    return /\.edu(?:\.bd)?$/i.test(domain);
}

export function validateUniversityEmail(email: string) {
    const domain = getEmailDomain(email);
    return isUniversityDomain(domain)
        ? { valid: true as const, domain }
        : {
            valid: false as const,
            error: "Use an official university email ending in .edu or .edu.bd.",
        };
}
