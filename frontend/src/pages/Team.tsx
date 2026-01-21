import { useState, useEffect } from 'react'
import api from '../services/api'

interface Squadra {
  id: number
  nome: string
  colore: string
  membri_count?: number
}

interface Membro {
  id: number
  nome: string
  cognome: string
  telefono?: string
  stato: string
}

export default function Team() {
  const [squadre, setSquadre] = useState<Squadra[]>([])
  const [membri, setMembri] = useState<Membro[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'squadre' | 'membri'>('squadre')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [squadreRes, membriRes] = await Promise.all([
      api.get<Squadra[]>('/squadre'),
      api.get<Membro[]>('/membri')
    ])

    if (squadreRes.success && squadreRes.data) {
      setSquadre(squadreRes.data)
    }
    if (membriRes.success && membriRes.data) {
      setMembri(membriRes.data)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="mt-1 text-gray-500">Gestisci squadre e membri</p>
        </div>
        <button className="btn-primary">
          {activeTab === 'squadre' ? 'Nuova Squadra' : 'Nuovo Membro'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-8">
          <button
            onClick={() => setActiveTab('squadre')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'squadre'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Squadre ({squadre.length})
          </button>
          <button
            onClick={() => setActiveTab('membri')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'membri'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Membri ({membri.length})
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : activeTab === 'squadre' ? (
        squadre.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-500">Nessuna squadra trovata</p>
            <button className="btn-primary mt-4">Crea la prima squadra</button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {squadre.map((squadra) => (
              <div key={squadra.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: squadra.colore }}
                  />
                  <h3 className="font-semibold text-gray-900">{squadra.nome}</h3>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {squadra.membri_count || 0} membri
                </p>
              </div>
            ))}
          </div>
        )
      ) : (
        membri.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-500">Nessun membro trovato</p>
            <button className="btn-primary mt-4">Aggiungi il primo membro</button>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Telefono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stato
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {membri.map((membro) => (
                  <tr key={membro.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {membro.nome} {membro.cognome}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {membro.telefono || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${
                        membro.stato === 'attivo'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {membro.stato}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
