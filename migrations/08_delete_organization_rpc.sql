-- Create a server-side RPC function to delete organizations
-- This function handles the cascade deletion properly and bypasses RLS issues

CREATE OR REPLACE FUNCTION public.delete_organization(org_id UUID)
RETURNS JSON AS $$
DECLARE
  deleted_count INTEGER := 0;
  result JSON;
BEGIN
  -- Start a transaction-like operation
  
  -- Step 1: Delete learning submissions
  DELETE FROM learning_submissions 
  WHERE organization_id = org_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % learning submissions', deleted_count;
  
  -- Step 2: Delete organization admins
  DELETE FROM organization_admins 
  WHERE organization_id = org_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % organization admins', deleted_count;
  
  -- Step 3: Delete profiles that belong to this organization
  DELETE FROM profiles 
  WHERE organization_id = org_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % profiles', deleted_count;
  
  -- Step 4: Delete the organization itself
  DELETE FROM organizations 
  WHERE id = org_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count = 0 THEN
    result := json_build_object(
      'success', false,
      'message', 'Organization not found'
    );
  ELSE
    result := json_build_object(
      'success', true,
      'message', 'Organization and all related data deleted successfully',
      'organization_id', org_id
    );
  END IF;
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'message', 'Error deleting organization: ' || SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_organization(UUID) TO authenticated;

-- Test the function with a known organization ID
-- SELECT public.delete_organization('your-org-uuid-here');
