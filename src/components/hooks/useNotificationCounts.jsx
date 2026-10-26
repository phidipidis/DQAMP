import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export const useNotificationCounts = (user) => {
  return useQuery({
    queryKey: ['notificationCounts', user?.id],
    queryFn: async () => {
      if (!user) return {};

      const counts = {};

      try {
        if (user.role === 'Implementer') {
          // My Activities count
          const myActivities = await base44.entities.DQAMPActivity.filter({
            Responsible_Person: user.email
          });
          counts.my_activities_count = myActivities?.length || 0;

          // Pending activities count
          const pendingActivities = await base44.entities.DQAMPActivity.filter({
            Responsible_Person: user.email,
            Status: 'In Progress'
          });
          counts.pending_activities_count = pendingActivities?.length || 0;

          // My outputs count
          const myOutputs = await base44.entities.ProjectOutputs.filter({
            Owner: user.email
          });
          counts.my_outputs_count = myOutputs?.length || 0;

          // My projects count
          const allProjects = await base44.entities.Project.list();
          const myProjects = allProjects?.filter(p => 
            p.Owner === user.email || p.created_by === user.email
          );
          counts.my_projects_count = myProjects?.length || 0;
        }

        if (user.role === 'admin' || user.role === 'Planning_Admin') {
          // Pending approval count
          const pendingProjects = await base44.entities.Project.filter({
            Project_Status: 'Planning'
          });
          counts.pending_approval_count = pendingProjects?.length || 0;
        }

        if (user.role === 'QA_Assessor') {
          // Pending assessments count
          const activities = await base44.entities.DQAMPActivity.list();
          const pendingAssessments = activities?.filter(a => 
            !a.QAME_Rating && a.Status === 'Completed'
          );
          counts.pending_assessments_count = pendingAssessments?.length || 0;
        }
      } catch (error) {
        console.error('Error fetching notification counts:', error);
      }

      return counts;
    },
    enabled: !!user,
    refetchInterval: 60000,
    staleTime: 30000,
    cacheTime: 300000
  });
};