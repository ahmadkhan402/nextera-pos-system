# Nextera POS System - Roles and Permissions Guide

## 🔑 Available Roles in Database

Based on the database schema and Row Level Security policies, here are the three main roles:

### 1. 👑 **Admin**
- **Database Value**: `'admin'`
- **Default Role**: No (must be explicitly assigned)
- **Highest Level Access**: Full system control

### 2. 🏢 **Manager** 
- **Database Value**: `'manager'`
- **Default Role**: No (must be explicitly assigned)
- **Mid-Level Access**: Business operations management

### 3. 💰 **Cashier**
- **Database Value**: `'cashier'`
- **Default Role**: Yes (default for new users)
- **Operational Access**: Day-to-day POS operations

## 📋 Permission Matrix

| **Feature/Action** | **Admin** | **Manager** | **Cashier** |
|-------------------|-----------|-------------|-------------|
| **👥 User Management** | | | |
| View all users | ✅ | ❌ | ❌ |
| Create/Edit/Delete users | ✅ | ❌ | ❌ |
| Edit own profile | ✅ | ✅ | ✅ |
| View own profile | ✅ | ✅ | ✅ |
| **⚙️ App Settings** | | | |
| View app settings | ✅ | ✅ | ✅ |
| Modify app settings | ✅ | ✅ | ❌ |
| **📦 Inventory Management** | | | |
| View products | ✅ | ✅ | ✅ |
| Create/Edit/Delete products | ✅ | ✅ | ❌ |
| Manage product variations | ✅ | ✅ | ❌ |
| View product batches | ✅ | ✅ | ✅ |
| Manage product batches | ✅ | ✅ | ❌ |
| **📂 Categories & Suppliers** | | | |
| View categories/suppliers | ✅ | ✅ | ✅ |
| Manage categories/suppliers | ✅ | ✅ | ❌ |
| **👥 Customer Management** | | | |
| View customers | ✅ | ✅ | ✅ |
| Create customers | ✅ | ✅ | ✅ |
| Edit customers | ✅ | ✅ | ❌ |
| Delete customers | ✅ | ❌ | ❌ |
| **💸 Sales Operations** | | | |
| View sales | ✅ | ✅ | ✅ |
| Create sales | ✅ | ✅ | ✅ |
| Edit sales | ✅ | ✅ | ❌ |
| Delete/Refund sales | ✅ | ❌ | ❌ |
| **🎫 Discount Management** | | | |
| View active discounts | ✅ | ✅ | ✅ |
| View all discounts | ✅ | ✅ | ❌ |
| Create/Edit discounts | ✅ | ✅ | ❌ |
| **📊 Sales Tabs** | | | |
| Manage own sales tabs | ✅ | ✅ | ✅ |
| Manage all sales tabs | ✅ | ✅ | ❌ |

## 🎯 Granular Permissions System

The database uses a flexible permissions array system where specific permissions can be assigned:

### Database Structure
```sql
-- In users table:
permissions TEXT[] DEFAULT ARRAY[]::TEXT[]
```

### Example Permission Values
```typescript
// TypeScript interface from your code:
interface User {
  role: 'admin' | 'manager' | 'cashier';
  permissions: string[]; // Array of specific permissions
}
```

### Suggested Permission Strings

#### 📦 **Product Permissions**
```javascript
[
  'products:read',
  'products:create', 
  'products:update',
  'products:delete',
  'products:manage_variations',
  'products:manage_batches'
]
```

#### 👥 **Customer Permissions** 
```javascript
[
  'customers:read',
  'customers:create',
  'customers:update', 
  'customers:delete',
  'customers:view_credit'
]
```

#### 💰 **Sales Permissions**
```javascript
[
  'sales:read',
  'sales:create',
  'sales:update',
  'sales:delete',
  'sales:process_refunds',
  'sales:apply_discounts'
]
```

#### 📊 **Reports Permissions**
```javascript
[
  'reports:daily_sales',
  'reports:inventory',
  'reports:customer_analytics',
  'reports:financial'
]
```

#### ⚙️ **System Permissions**
```javascript
[
  'settings:read',
  'settings:update',
  'users:read',
  'users:create',
  'users:update',
  'users:delete'
]
```

#### 🎫 **Discount Permissions**
```javascript
[
  'discounts:read',
  'discounts:create',
  'discounts:update',
  'discounts:delete',
  'discounts:apply'
]
```

## 🛡️ Database Implementation

### Users Table Schema
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'cashier', -- admin, manager, cashier
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[], -- array of permission strings
  avatar TEXT,
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security Examples
```sql
-- Example: Only admin users can read all users
CREATE POLICY "Allow admin users to read all users" ON users
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND active = true
    )
  );

-- Example: Admin/Manager can modify products
CREATE POLICY "Allow admin/manager users to modify products" ON products
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
      AND active = true
    )
  );
```

## 🚀 Recommended Role Setup

### Default Admin User
```sql
INSERT INTO users (
  id, username, email, name, role, permissions, active
) VALUES (
  'admin-uuid-here',
  'admin',
  'admin@yourstore.com', 
  'System Administrator',
  'admin',
  ARRAY[
    'users:*', 'settings:*', 'products:*', 'customers:*', 
    'sales:*', 'reports:*', 'discounts:*'
  ],
  true
);
```

### Store Manager
```sql
INSERT INTO users (
  id, username, email, name, role, permissions, active  
) VALUES (
  'manager-uuid-here',
  'manager1',
  'manager@yourstore.com',
  'Store Manager', 
  'manager',
  ARRAY[
    'products:*', 'customers:read,create,update', 'sales:*',
    'reports:daily_sales,inventory', 'discounts:*', 'settings:read'
  ],
  true
);
```

### Cashier
```sql
INSERT INTO users (
  id, username, email, name, role, permissions, active
) VALUES (
  'cashier-uuid-here',
  'cashier1', 
  'cashier@yourstore.com',
  'Cashier Name',
  'cashier',
  ARRAY[
    'products:read', 'customers:read,create', 'sales:read,create',
    'discounts:read,apply'
  ],
  true
);
```

## 🔍 Permission Checking in Application

### Frontend Permission Check Example
```typescript
// In your TypeScript application:
function hasPermission(user: User, permission: string): boolean {
  // Check role-based permissions first
  if (user.role === 'admin') return true;
  
  // Check specific permissions
  return user.permissions.includes(permission) || 
         user.permissions.includes(permission.split(':')[0] + ':*');
}

// Usage examples:
if (hasPermission(currentUser, 'products:create')) {
  // Show create product button
}

if (hasPermission(currentUser, 'users:read')) {
  // Show user management menu
}
```

### Backend Permission Validation
```typescript
// Express.js middleware example:
function requirePermission(permission: string) {
  return (req, res, next) => {
    const user = req.user; // From authentication middleware
    
    if (!hasPermission(user, permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

// Route protection:
app.post('/api/products', requirePermission('products:create'), createProduct);
app.delete('/api/users/:id', requirePermission('users:delete'), deleteUser);
```

## 📚 Summary

- **3 Main Roles**: Admin (full access), Manager (business operations), Cashier (POS operations)
- **Flexible Permissions**: Array-based system allows granular control
- **Database Security**: Row Level Security policies enforce access control
- **Extensible**: Easy to add new permissions as features grow
- **Role Inheritance**: Admin has all permissions, Manager has business permissions, Cashier has operational permissions

This role-based permission system provides comprehensive security while maintaining flexibility for your POS system!
