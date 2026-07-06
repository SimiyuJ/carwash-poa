
export const permissions = {
  /* =========================================
     ADMIN
  ========================================= */

  admin: [
    "/dashboard",
    "/pos",
    "/queue",
    "/customers",
    "/customer-profiles",
    "/vehicles",
    "/appointments",
    "/services",
    "/staff",
    "/subscriptions",
    "/reports",
    "/settings",
    "/admin",
    "/purchases",
    "/expenses",
    "/receipts",
    "/inventory",
    "/branch-select"
  ],

  /* =========================================
     MANAGER
  ========================================= */

  manager: [
  "/dashboard",
    "/pos",
    "/queue",
    "/customers",
    "/customer-profiles",
    "/vehicles",
    "/appointments",
    "/services",
    "/staff",
    "/subscriptions",
    "/reports",
    "/settings",
    "/admin",
    "/purchases",
    "/expenses",
    "/receipts",
    "/inventory",
    "/invoices",
    "/branch-select"
  ],

  /* =========================================
     CASHIER
  ========================================= */

  cashier: [
    "/dashboard",
    "/pos",
    "/customers",
    "/customer-profiles",
    "/vehicles",
    "/appointments",
    "/subscriptions",
  ],

  /* =========================================
     WASHER
  ========================================= */

  washer: [
    "/dashboard",
    "/queue",
    "/vehicles",
    "/customer-profiles",
  ],

  /* =========================================
     CUSTOMER
  ========================================= */

  customer: [
    "/customer-profiles",
    "/customer-profiles/dashboard",
    "/customer-profiles/vehicles",
    "/customer-profiles/subscriptions",
    "/customer-profiles/loyalty",
    "/customer-profiles/settings",
    "/customer-profiles/appointments",
  ],
} as const;

/* =========================================
   USER ROLE TYPE
========================================= */

export type UserRole =
  | "admin"
  | "manager"
  | "cashier"
  | "washer"
  | "customer";

/* =========================================
   HAS PERMISSION
========================================= */

export function hasPermission(
  role: UserRole,
  pathname: string
) {
  const allowedRoutes =
    permissions[role] || [];

  return allowedRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(
        route + "/"
      )
  );
}

/* =========================================
   STAFF CHECK
========================================= */

export function isStaffRole(
  role: UserRole
) {
  return [
    "admin",
    "manager",
    "cashier",
    "washer",
  ].includes(role);
}

/* =========================================
   CUSTOMER CHECK
========================================= */

export function isCustomerRole(
  role: UserRole
) {
  return role === "customer";
}

/* =========================================
   ROLE CREATION PERMISSIONS
========================================= */

export const roleCreationPermissions =
  {
    admin: [
      "admin",
      "manager",
      "cashier",
      "washer",
      "customer",
    ],

    manager: [
      "cashier",
      "washer",
      "customer",
    ],
  } as const;