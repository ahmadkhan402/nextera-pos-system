# Nextera POS System - Database Setup Guide

## 📋 Overview

This document provides comprehensive information about the Nextera POS System database struc### Step 4: Configure App Settings
Update the default settings to match your store:
```sql
UPDATE app_settings 
SET 
    store_name = 'Your Store Name',
    store_address = 'Your Store Address',
    store_phone = 'Your Phone Number',
    store_email = 'your_email@example.com',
    tax_rate = 0.0875  -- Adjust tax rate as needed
WHERE id = (SELECT id FROM app_settings LIMIT 1);
```

### Step 5: Apply Role-Based Security (Optional)
If you need strict role-based access control:
1. Run `role_based_security.sql` after user setup
2. This applies proper admin/manager/cashier permissions
3. Without this, all authenticated users have full access

**Note**: The main script uses simplified policies to avoid recursion issues. Role-based security can be added later when needed.up process for Supabase.

## 🗄️ Database Schema

### Core Tables

#### 1. **app_settings**
Central configuration table for the POS system.
- **Purpose**: Store system-wide settings and configurations
- **Key Fields**: store information, tax rates, invoice settings, UI preferences
- **Access**: Read by all users, write by admins/managers only

#### 2. **products**
Product catalog with inventory management.
- **Purpose**: Store product information and inventory levels
- **Key Fields**: name, SKU, barcode, pricing, stock levels, categories
- **Features**: Weight-based products, batch tracking support, inventory tracking
- **Access**: Read by all users, write by managers/admins

#### 3. **customers**
Customer information and purchase history.
- **Purpose**: Manage customer relationships and credit limits
- **Key Fields**: contact info, credit limits, purchase history, price tiers
- **Features**: Automatic purchase tracking, credit management
- **Access**: Full access for all authenticated users

#### 4. **sales**
Transaction records and sales history.
- **Purpose**: Store completed sales transactions
- **Key Fields**: items, pricing, payment methods, customer info
- **Features**: JSON storage for cart items, applied discounts, card details
- **Access**: Full access for all authenticated users

#### 5. **discounts**
Discount rules and promotions.
- **Purpose**: Manage promotional offers and pricing rules
- **Key Fields**: discount types, conditions, validity periods
- **Features**: Multiple discount types (percentage, fixed, BOGO, free gifts)
- **Access**: Read by all users, write by managers/admins

#### 6. **users**
User accounts and permissions (extends Supabase auth).
- **Purpose**: Manage user access and roles
- **Key Fields**: roles, permissions, profile information
- **Features**: Role-based access control (admin, manager, cashier)
- **Access**: Read by all users, write by admins only

### Supporting Tables

#### 7. **categories**
Product categorization system.
- **Purpose**: Organize products into logical groups
- **Features**: Hierarchical organization support
- **Access**: Read by all users, write by managers/admins

#### 8. **suppliers**
Vendor and supplier information.
- **Purpose**: Track product sources and vendor relationships
- **Features**: Rating system, payment terms tracking
- **Access**: Read by all users, write by managers/admins

#### 9. **product_batches**
Batch tracking for inventory management.
- **Purpose**: Track product batches with expiry dates
- **Features**: Manufacturing dates, expiry tracking, supplier info
- **Access**: Read by all users, write by managers/admins

#### 10. **sales_tabs**
Multi-tab sales interface support.
- **Purpose**: Allow multiple concurrent sales sessions per user
- **Features**: JSON cart storage, customer association
- **Access**: Users can only access their own tabs

## 🔧 Database Features

### Performance Optimizations
- **Indexes**: Comprehensive indexing strategy for fast queries
- **Full-text search**: Product and customer name searching
- **Composite indexes**: Optimized for common query patterns

### Data Integrity
- **Constraints**: Comprehensive check constraints for data validation
- **Foreign keys**: Proper relationships between related tables
- **Triggers**: Automatic timestamp updates and business logic

### Security Features
- **Row Level Security (RLS)**: Enabled on all tables
- **Role-based access**: Different permissions for admin/manager/cashier
- **User isolation**: Sales tabs are user-specific

### Business Logic Functions

#### **generate_invoice_number()**
- Automatically generates sequential invoice numbers
- Uses configurable prefix from app_settings
- Thread-safe implementation

#### **update_customer_stats()**
- Automatically updates customer purchase totals
- Updates last purchase date on completed sales
- Maintains customer lifetime value

#### **update_updated_at_column()**
- Universal trigger function for timestamp management
- Applied to all tables for consistent audit trails

## 📊 Utility Views

### **products_low_stock**
- Shows products below minimum stock levels
- Calculates reorder quantities
- Filters by active and inventory-tracked products

### **customer_summary**
- Customer lifetime value calculations
- Purchase behavior analytics
- Average order values

## 🚀 Setup Instructions

### Step 1: Prerequisites
1. **Supabase Project**: Create a new Supabase project
2. **Database Access**: Ensure you have database admin access
3. **Environment Variables**: Set up your `.env.local` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Step 2: Run the Initialization Script
1. Open your Supabase SQL Editor
2. Copy the entire content of `supabase_complete_init.sql`
3. Execute the script
4. Verify no errors occurred

### Step 3: Verify Installation
Check that all tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Step 4: Create First Admin User
1. Sign up through your application's auth system
2. Manually update the user record in the database:
```sql
UPDATE users 
SET role = 'admin', permissions = ARRAY['all'] 
WHERE email = 'your_admin_email@example.com';
```

### Step 5: Configure App Settings
Update the default settings to match your store:
```sql
UPDATE app_settings 
SET 
    store_name = 'Your Store Name',
    store_address = 'Your Store Address',
    store_phone = 'Your Phone Number',
    store_email = 'your_email@example.com',
    tax_rate = 0.0875  -- Adjust tax rate as needed
WHERE id = (SELECT id FROM app_settings LIMIT 1);
```

## 🔒 Security Considerations

### Authentication
- Uses Supabase Auth for user authentication
- JWT tokens for secure API access
- Session management handled by Supabase

### Authorization
- **Admin**: Full system access, user management
- **Manager**: Product/inventory management, reports, sales
- **Cashier**: Sales operations, customer management (limited)

### Data Protection
- All sensitive data is encrypted at rest
- Row-level security prevents unauthorized access
- Input validation through database constraints

## 📈 Performance Tuning

### Recommended Settings
For high-volume stores, consider these Supabase project settings:

1. **Connection Pooling**: Enable in Supabase dashboard
2. **Database Size**: Scale as needed based on transaction volume
3. **Backup Frequency**: Configure automatic backups

### Monitoring Queries
Monitor these key performance indicators:

```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Monitor table sizes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public';
```

## 🔄 Maintenance Tasks

### Regular Maintenance

#### Daily
- Monitor error logs
- Check system performance
- Verify backup completion

#### Weekly
- Review sales reports
- Update inventory as needed
- Check for low stock items

#### Monthly
- Database performance review
- User access audit
- Data cleanup (old sessions, expired discounts)

### Database Cleanup
```sql
-- Clean up old sales tabs (older than 30 days)
DELETE FROM sales_tabs 
WHERE created_at < NOW() - INTERVAL '30 days';

-- Archive old sales (optional, for performance)
-- Consider moving to separate archive table for very old transactions
```

## 🛟 Troubleshooting

### Common Issues

#### **Connection Problems**
- Verify Supabase URL and API keys
- Check project status in Supabase dashboard
- Ensure RLS policies are properly configured

#### **Permission Errors**
- Verify user roles are set correctly
- Check RLS policies for the affected table
- Ensure user is active in the users table

#### **Performance Issues**
- Check for missing indexes
- Monitor database connection usage
- Review query performance in Supabase dashboard

#### **Data Integrity Issues**
- Check constraint violations in error logs
- Verify foreign key relationships
- Review trigger function logs

### Support Resources
1. **Supabase Documentation**: https://supabase.com/docs
2. **PostgreSQL Documentation**: https://www.postgresql.org/docs/
3. **GitHub Issues**: Check project repository for known issues

## 🔮 Future Enhancements

### Planned Features
- **Multi-store support**: Extended schema for multiple locations
- **Advanced reporting**: Additional views and analytics
- **Integration APIs**: External service connections
- **Mobile app support**: Optimized queries for mobile clients

### Schema Evolution
The database is designed to be extensible. Future updates will:
- Maintain backward compatibility
- Provide migration scripts
- Include rollback procedures
- Document all changes

---

**Last Updated**: August 4, 2025  
**Version**: 1.0  
**Compatibility**: Supabase PostgreSQL 15+
