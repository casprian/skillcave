#!/bin/bash

# SkillCave Super Admin Setup Script
# This script helps set up the super admin system

echo "🚀 SkillCave Super Admin Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Database Migration${NC}"
echo "---"
echo "1. Go to: https://supabase.com/dashboard"
echo "2. Select your SkillCave project"
echo "3. Navigate to: SQL Editor"
echo "4. Click 'New Query'"
echo "5. Copy the contents of: migrations/01_organizations_migration.sql"
echo "6. Paste into the SQL editor"
echo "7. Click 'Run'"
echo "8. Verify success message"
echo ""

read -p "Press Enter once you've completed the database migration..."

echo ""
echo -e "${BLUE}Step 2: Create Super Admin User${NC}"
echo "---"
echo "1. Go to: Authentication > Users"
echo "2. Click 'Create User'"
echo "3. Enter the following details:"
echo "   Email: superadmin@skillcave.com"
echo "   Password: SuperAdmin123!"
echo "4. Copy the User ID (shown after creation)"
echo ""

read -p "Enter the Super Admin User ID: " SUPER_ADMIN_ID

if [ -z "$SUPER_ADMIN_ID" ]; then
    echo -e "${YELLOW}⚠️  User ID cannot be empty${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 3: Create Super Admin Profile${NC}"
echo "---"
echo "1. Go to: SQL Editor"
echo "2. Click 'New Query'"
echo "3. Run this SQL:"
echo ""
echo "INSERT INTO public.profiles (id, email, name, role)"
echo "VALUES ('$SUPER_ADMIN_ID', 'superadmin@skillcave.com', 'Super Admin', 'super_admin')"
echo "ON CONFLICT (id) DO UPDATE SET role = 'super_admin';"
echo ""

read -p "Press Enter once you've executed the SQL..."

echo ""
echo -e "${BLUE}Step 4: Verify Installation${NC}"
echo "---"
echo "Run this SQL to verify:"
echo "SELECT id, email, name, role FROM public.profiles WHERE role = 'super_admin';"
echo ""

read -p "Press Enter once verified..."

echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "You can now:"
echo "1. Start the app: npm start"
echo "2. Login with:"
echo "   Email: superadmin@skillcave.com"
echo "   Password: SuperAdmin123!"
echo "3. You'll be redirected to the Super Admin Dashboard"
echo ""
echo "📚 For more details, see: SUPER_ADMIN_SETUP.md"
