/**
 * Normalizes a string by converting it to lowercase, removing all non-alphanumeric characters except spaces,
 * and splitting it into lowercase word tokens.
 */
function tokenizeName(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Checks if the account name matches either the business name or the owner name.
 * Returns true if the account name tokens match the business/owner name tokens.
 */
export function verifyAccountNameMatch(
  accountName: string,
  businessName: string,
  ownerName?: string,
): boolean {
  if (!accountName) return false;

  const accWords = tokenizeName(accountName);
  if (accWords.length === 0) return false;

  // 1. Check matching with Business Name
  const bizWords = tokenizeName(businessName || '');
  if (bizWords.length > 0) {
    const matchesBiz =
      accWords.every((w) => bizWords.includes(w)) ||
      bizWords.every((w) => accWords.includes(w));

    if (matchesBiz) return true;
  }

  // 2. Check matching with Owner Name
  if (ownerName) {
    const ownerWords = tokenizeName(ownerName);
    if (ownerWords.length > 0) {
      const matchesOwner =
        accWords.every((w) => ownerWords.includes(w)) ||
        ownerWords.every((w) => accWords.includes(w));

      if (matchesOwner) return true;
    }
  }

  return false;
}
