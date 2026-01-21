import { useState, useEffect } from 'react'
import api from '../services/api'

interface Cantiere {
  id: number
  codice: string
  nome: string
  stato: string
  citta?: string
  data_inizio_prevista?: string
  data_fine_prevista?: string
}

export default function Cantieri() {
  const [cantieri, setCantieri] = useState<Cantiere[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCantieri()
  }, [])

  async function loadCantieri() {
    setLoading(true)
    const response = await api.get<Cantiere[]>('/cantieri')
    if (response.success && response.data) {
      setCantieri(response.data)
    }
    setLoading(false)
  }

  const statoColors: Record<string, string> = {
    pianificato: 'bg-gray-100 text-gray-800',
    in_corso: 'bg-blue-100 text-blue-800',
    sospeso: 'bg-yellow-100 text-yellow-800',
    completato: 'bg-green-100 text-green-800',
    annullato: 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cantieri</h1>
          <p className="mt-1 text-gray-500">Gestisci i tuoi cantieri</p>
        </div>
        <button className="btn-primary">
          Nuovo Cantiere
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : cantieri.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500">Nessun cantiere trovato</p>
          <button className="btn-primary mt-4">
            Crea il tuo primo cantiere
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {cantieri.map((cantiere) => (
            <div key={cantiere.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{cantiere.codice}</span>
                    <span className={`badge ${statoColors[cantiere.stato] || 'bg-gray-100'}`}>
                      {cantiere.stato.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mt-1">
                    {cantiere.nome}
                  </h3>
                  {cantiere.citta && (
                    <p className="text-sm text-gray-500 mt-1">{cantiere.citta}</p>
                  )}
                </div>
                <button className="btn-outline text-sm py-1 px-3">
                  Dettagli
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
