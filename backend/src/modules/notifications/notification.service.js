class NotificationService {
  constructor(repositories) { this.repositories = repositories; }

  async create(context, { userId, type, title, body, resourceType, resourceId }) {
    return this.repositories.notifications.create(context, {
      userId, type, title, body, resourceType: resourceType || null, resourceId: resourceId || null, readAt: null
    });
  }

  async list(context, unreadOnly = false) {
    return this.repositories.notifications.findMany(context, {
      where: { userId: context.userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' }
    });
  }

  async markRead(context, id) {
    const notification = await this.repositories.notifications.findById(context, id);
    if (notification.userId !== context.userId) throw require('../../shared/AppError').AppError.forbidden('You can only change your own notifications.');
    return this.repositories.notifications.update(context, id, { readAt: new Date() });
  }
}

module.exports = { NotificationService };
