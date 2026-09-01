export {};
  import AuditLog from '../models/AuditLog';

const logAdminAction = async ({ actor, action, targetType, targetId, before = {}, after = {} }) => {
  if (!actor || !action || !targetType || !targetId) {
    return null;
  }

  return AuditLog.create({
    actor,
    action,
    targetType,
    targetId,
    before,
    after
  });
};

export {
  logAdminAction
};
