import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export const useRoleBasedData = (entityName, user, filterConfig) => {
  return useQuery({
    queryKey: ['roleBasedData', entityName, user?.id, filterConfig],
    queryFn: async () => {
      if (!user) return [];

      const entity = base44.entities[entityName];
      if (!entity) return [];

      // Apply role-based filters
      let filter = {};

      if (user.role === 'Implementer') {
        if (filterConfig?.includes('responsible_person')) {
          filter.Responsible_Person = user.email;
        } else if (filterConfig?.includes('assigned_to')) {
          filter.Owner = user.email;
        } else if (filterConfig?.includes('activity_owner')) {
          filter.created_by = user.email;
        }
      }

      // For QA Assessor, filter by assigned assessor
      if (user.role === 'QA_Assessor' && filterConfig?.includes('assessor')) {
        const assessors = await base44.entities.QAME_Assessor.filter({
          Name: user.full_name || user.email
        });
        if (assessors && assessors.length > 0) {
          filter.Assigned_Assessors = assessors[0].id;
        }
      }

      try {
        if (Object.keys(filter).length > 0) {
          return await entity.filter(filter);
        } else {
          return await entity.list();
        }
      } catch (error) {
        console.error(`Error fetching ${entityName}:`, error);
        return [];
      }
    },
    enabled: !!user && !!entityName,
    staleTime: 30000
  });
};

export const getFilteredQuery = (user, filterType) => {
  if (!user) return {};

  const filters = {
    activities: user.role === 'Implementer' 
      ? { Responsible_Person: user.email }
      : {},
    projects: user.role === 'Implementer'
      ? { Owner: user.email }
      : {},
    outputs: user.role === 'Implementer'
      ? { Owner: user.email }
      : {},
    performance: user.role === 'Implementer'
      ? { created_by: user.email }
      : {},
  };

  return filters[filterType] || {};
};