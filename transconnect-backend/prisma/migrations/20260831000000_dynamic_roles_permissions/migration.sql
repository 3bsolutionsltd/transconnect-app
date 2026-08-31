-- Dynamic role and permission management.
-- The UserRole enum stays in place; "users"."roleId" is backfilled from it so both can be read during rollout.

CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "roles_slug_key" ON "roles"("slug");

CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "permissions_slug_key" ON "permissions"("slug");
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");

CREATE TABLE "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId", "permissionId")
);

CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey"
    FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users" ADD COLUMN "roleId" TEXT;
CREATE INDEX "users_roleId_idx" ON "users"("roleId");
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the roles that currently exist as UserRole enum values.
INSERT INTO "roles" ("id", "slug", "name", "description", "isSystem", "updatedAt") VALUES
    ('role_passenger', 'PASSENGER', 'Passenger', 'Traveller account with no back-office access.', true, CURRENT_TIMESTAMP),
    ('role_operator', 'OPERATOR', 'Operator', 'Bus company account managing its own fleet and routes.', true, CURRENT_TIMESTAMP),
    ('role_manager', 'MANAGER', 'Manager', 'Manages bookings across operators.', true, CURRENT_TIMESTAMP),
    ('role_admin', 'ADMIN', 'Administrator', 'Full platform access. Always holds every permission.', true, CURRENT_TIMESTAMP),
    ('role_master_field_operator', 'MASTER_FIELD_OPERATOR', 'Master Field Operator', 'Field operations across all operators.', true, CURRENT_TIMESTAMP),
    ('role_operator_field_operator', 'OPERATOR_FIELD_OPERATOR', 'Operator Field Operator', 'Field operations scoped to assigned operators.', true, CURRENT_TIMESTAMP);

INSERT INTO "permissions" ("id", "slug", "resource", "action", "description") VALUES
    ('perm_dashboard_view', 'dashboard.view', 'dashboard', 'view', 'View the admin dashboard.'),
    ('perm_routes_read', 'routes.read', 'routes', 'read', 'View routes and schedules.'),
    ('perm_routes_write', 'routes.write', 'routes', 'write', 'Create, edit and deactivate routes.'),
    ('perm_operators_read', 'operators.read', 'operators', 'read', 'View operator records.'),
    ('perm_operators_write', 'operators.write', 'operators', 'write', 'Create, approve and edit operators.'),
    ('perm_operators_directory_view', 'operators_directory.view', 'operators_directory', 'view', 'View the field operator directory.'),
    ('perm_bookings_read', 'bookings.read', 'bookings', 'read', 'View bookings.'),
    ('perm_bookings_write', 'bookings.write', 'bookings', 'write', 'Create, amend and cancel bookings.'),
    ('perm_agents_read', 'agents.read', 'agents', 'read', 'View agents.'),
    ('perm_agents_write', 'agents.write', 'agents', 'write', 'Create and manage agents.'),
    ('perm_qr_scanner_use', 'qr_scanner.use', 'qr_scanner', 'use', 'Validate tickets with the QR scanner.'),
    ('perm_analytics_view', 'analytics.view', 'analytics', 'view', 'View revenue and usage analytics.'),
    ('perm_users_read', 'users.read', 'users', 'read', 'View platform users.'),
    ('perm_users_write', 'users.write', 'users', 'write', 'Create, edit and deactivate users.'),
    ('perm_roles_read', 'roles.read', 'roles', 'read', 'View roles and their permissions.'),
    ('perm_roles_write', 'roles.write', 'roles', 'write', 'Create roles and change their permissions.'),
    ('perm_settings_manage', 'settings.manage', 'settings', 'manage', 'Change platform settings.');

-- Administrators get every permission, including any added later by the seeding logic.
INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT 'role_admin', "id" FROM "permissions";

INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT 'role_manager', "id" FROM "permissions"
WHERE "slug" IN ('dashboard.view', 'bookings.read', 'bookings.write', 'routes.read', 'operators.read', 'analytics.view');

-- Mirrors the navigation Master Field Operators see today: Dashboard, Bookings, Operators directory.
INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT 'role_master_field_operator', "id" FROM "permissions"
WHERE "slug" IN ('dashboard.view', 'bookings.read', 'bookings.write', 'operators_directory.view');

INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT 'role_operator_field_operator', "id" FROM "permissions"
WHERE "slug" IN ('dashboard.view', 'bookings.read');

INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT 'role_operator', "id" FROM "permissions"
WHERE "slug" IN ('dashboard.view', 'bookings.read', 'bookings.write', 'routes.read', 'routes.write', 'analytics.view');

UPDATE "users" SET "roleId" = 'role_' || lower("role"::text) WHERE "roleId" IS NULL;
