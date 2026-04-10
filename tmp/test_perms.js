
const mockUserWithNoPerms = { role: 'user', permissions: [] };
const mockUserWithView = { role: 'user', permissions: ['WORKFLOW_VIEW'] };
const mockAdmin = { role: 'admin', permissions: [] };

const hasPermission = (user, permission) => {
    if (!user) return false;
    if (['admin', 'super_admin'].includes(user.role?.toLowerCase())) return true;
    const perms = user.permissions || user.role?.permissions || [];
    return perms.includes(permission);
};

console.log('Test 1 (No Perms):', hasPermission(mockUserWithNoPerms, 'WORKFLOW_CREATE') === false);
console.log('Test 2 (View Perm):', hasPermission(mockUserWithView, 'WORKFLOW_VIEW') === true);
console.log('Test 3 (View Perm check Create):', hasPermission(mockUserWithView, 'WORKFLOW_CREATE') === false);
console.log('Test 4 (Admin):', hasPermission(mockAdmin, 'WORKFLOW_DELETE') === true);
