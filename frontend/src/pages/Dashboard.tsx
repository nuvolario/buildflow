import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, company } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-500">
          Benvenuto, {user?.nome} {user?.cognome}
        </p>
      </div>

      {company && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900">{company.nome}</h2>
          <p className="text-sm text-gray-500">Ruolo: {company.ruolo}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Cantieri Attivi</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Tasks Aperti</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Team Members</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
        </div>
      </div>
    </div>
  )
}
