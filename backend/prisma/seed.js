const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { PERMISSIONS } = require('../src/config/permissions');

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { code: 'ECOSPHERE-DEMO' },
    update: {},
    create: { name: 'EcoSphere Demo Organization', code: 'ECOSPHERE-DEMO', status: 'ACTIVE' }
  });
  const department = await prisma.department.upsert({
    where: { organizationId_code: { organizationId: organization.id, code: 'SUSTAINABILITY' } },
    update: {},
    create: { organizationId: organization.id, name: 'Sustainability', code: 'SUSTAINABILITY', status: 'ACTIVE' }
  });
  const permissionRows = {};
  for (const code of PERMISSIONS) {
    permissionRows[code] = await prisma.permission.upsert({
      where: { organizationId_code: { organizationId: organization.id, code } },
      update: { name: code }, create: { organizationId: organization.id, code, name: code }
    });
  }
  const adminRole = await prisma.role.upsert({
    where: { organizationId_code: { organizationId: organization.id, code: 'ADMIN' } }, update: {},
    create: { organizationId: organization.id, code: 'ADMIN', name: 'Administrator', status: 'ACTIVE' }
  });
  const employeeRole = await prisma.role.upsert({
    where: { organizationId_code: { organizationId: organization.id, code: 'EMPLOYEE' } }, update: {},
    create: { organizationId: organization.id, code: 'EMPLOYEE', name: 'Employee', status: 'ACTIVE' }
  });
  for (const permission of Object.values(permissionRows)) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId_scope: { roleId: adminRole.id, permissionId: permission.id, scope: 'ORGANIZATION' } },
      update: {}, create: { roleId: adminRole.id, permissionId: permission.id, scope: 'ORGANIZATION' }
    });
  }
  for (const code of ['environment.view','social.view','social.participate','governance.view','governance.acknowledge','gamification.view','gamification.participate','reports.personal']) {
    const permission = permissionRows[code];
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId_scope: { roleId: employeeRole.id, permissionId: permission.id, scope: 'OWN' } },
      update: {}, create: { roleId: employeeRole.id, permissionId: permission.id, scope: 'OWN' }
    });
  }
  const passwordHash = await bcrypt.hash('Admin@1234', 12);
  const employeePasswordHash = await bcrypt.hash('Employee@1234', 12);
  const admin = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: organization.id, email: 'admin@ecosphere.local' } }, update: { passwordHash },
    create: { organizationId: organization.id, departmentId: department.id, employeeId: 'DEMO-ADMIN', email: 'admin@ecosphere.local', passwordHash, firstName: 'Demo', lastName: 'Administrator', status: 'ACTIVE' }
  });
  const employee = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: organization.id, email: 'employee@ecosphere.local' } }, update: { passwordHash: employeePasswordHash },
    create: { organizationId: organization.id, departmentId: department.id, employeeId: 'DEMO-EMPLOYEE', email: 'employee@ecosphere.local', passwordHash: employeePasswordHash, firstName: 'Demo', lastName: 'Employee', status: 'ACTIVE' }
  });
  for (const [user, role, scope] of [[admin, adminRole, 'ORGANIZATION'], [employee, employeeRole, 'OWN']]) {
    await prisma.userRole.upsert({
      where: { organizationId_userId_roleId_scope: { organizationId: organization.id, userId: user.id, roleId: role.id, scope } },
      update: { status: 'ACTIVE' }, create: { organizationId: organization.id, userId: user.id, roleId: role.id, scope, status: 'ACTIVE' }
    });
  }
  for (const [key, value] of [['environment.autoCalculation',{ enabled: true }],['esg.scoringWeights',{ environmental: 40, social: 30, governance: 30 }]]) {
    await prisma.setting.upsert({ where: { organizationId_key: { organizationId: organization.id, key } }, update: { value }, create: { organizationId: organization.id, key, value, createdById: admin.id } });
  }
}

main().finally(() => prisma.$disconnect());
