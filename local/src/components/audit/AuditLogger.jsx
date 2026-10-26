import { base44 } from '@/api/base44Client';

export const logAuditEvent = async ({
  actionType,
  entity,
  recordId = null,
  remarks = null,
  previousValues = null,
  newValues = null
}) => {
  try {
    const user = await base44.auth.me();
    await base44.entities.Audit_Log.create({
      Action_Type: actionType,
      Entity: entity,
      Record_ID: recordId,
      User_Email: user?.email || 'system',
      Timestamp: new Date().toISOString(),
      Remarks: remarks,
      Previous_Values: previousValues ? JSON.stringify(previousValues) : null,
      New_Values: newValues ? JSON.stringify(newValues) : null
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
};

export default logAuditEvent;