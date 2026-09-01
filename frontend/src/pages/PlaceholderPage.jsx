import { useParams } from 'react-router-dom'
import { DatabaseZap } from 'lucide-react'
import AppShell from '../layouts/AppShell'
import { employeeNav, organizationNav, sectionMeta } from '../config/navigation'
import PageHeader from '../components/dashboard/PageHeader'
import EmptyState from '../components/ui/EmptyState'

export default function PlaceholderPage({ experience }) {
  const { section } = useParams()
  const meta = sectionMeta[section] || { title: 'EcoSphere', description: 'This workspace is being prepared.', icon: DatabaseZap }
  const organization = experience === 'organization'

  return (
    <AppShell navItems={organization ? organizationNav : employeeNav} experience={organization ? 'Organization console' : 'Employee portal'} user={{ name: 'Navaneeth', role: 'Frontend preview' }}>
      <PageHeader eyebrow={organization ? 'Organization workspace' : 'My EcoSphere'} title={meta.title} description={meta.description} />
      <article className="card overflow-hidden">
        <EmptyState icon={meta.icon} title={`${meta.title} is ready for its workflow`} description="The page foundation is connected to shared navigation and design components. Its API-driven workflow will be implemented in the next frontend slice." />
      </article>
    </AppShell>
  )
}
