export const ALL_PERMISSIONS = "*";

/** True when the permission list grants the single key (SuperAdmin "*" grants everything). */
export function can(permissions: readonly string[], key: string): boolean {
  return permissions.includes(ALL_PERMISSIONS) || permissions.includes(key);
}

/** True when the permission list grants at least one of the keys. */
export function canAny(permissions: readonly string[], keys: readonly string[]): boolean {
  return (
    permissions.includes(ALL_PERMISSIONS) || keys.some((key) => permissions.includes(key))
  );
}
