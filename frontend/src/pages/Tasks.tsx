import { useState, useEffect } from 'react'
import api from '../services/api'

interface Task {
  id: number
  titolo: string
  descrizione?: string
  stato: string
  priorita: string
  cantiere_nome?: string
  assegnato_nome?: string
  assegnato_cognome?: string
  data_scadenza?: string
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    setLoading(true)
    const response = await api.get<Task[]>('/tasks')
    if (response.success && response.data) {
      setTasks(response.data)
    }
    setLoading(false)
  }

  const statoColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    blocked: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-500'
  }

  const prioritaColors: Record<string, string> = {
    bassa: 'text-gray-400',
    normale: 'text-gray-600',
    alta: 'text-orange-500',
    urgente: 'text-red-500'
  }

  // Group tasks by stato
  const tasksByStato = {
    pending: tasks.filter(t => t.stato === 'pending'),
    in_progress: tasks.filter(t => t.stato === 'in_progress'),
    completed: tasks.filter(t => t.stato === 'completed'),
    blocked: tasks.filter(t => t.stato === 'blocked')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-1 text-gray-500">Gestisci le attivita dei cantieri</p>
        </div>
        <button className="btn-primary">
          Nuovo Task
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500">Nessun task trovato</p>
          <p className="text-sm text-gray-400 mt-2">
            Crea prima un cantiere per aggiungere tasks
          </p>
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto">
          {(['pending', 'in_progress', 'completed', 'blocked'] as const).map((stato) => (
            <div key={stato} className="min-w-[280px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-700 capitalize">
                  {stato.replace('_', ' ')}
                </h3>
                <span className="text-sm text-gray-500">
                  {tasksByStato[stato].length}
                </span>
              </div>

              <div className="space-y-3">
                {tasksByStato[stato].map((task) => (
                  <div
                    key={task.id}
                    className="card p-3 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {task.titolo}
                      </h4>
                      <span className={`text-lg ${prioritaColors[task.priorita]}`}>
                        {task.priorita === 'urgente' && '!'}
                        {task.priorita === 'alta' && '!'}
                      </span>
                    </div>

                    {task.cantiere_nome && (
                      <p className="text-xs text-gray-500 mt-1">
                        {task.cantiere_nome}
                      </p>
                    )}

                    {task.assegnato_nome && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                          {task.assegnato_nome[0]}{task.assegnato_cognome?.[0]}
                        </div>
                        <span className="text-xs text-gray-500">
                          {task.assegnato_nome} {task.assegnato_cognome}
                        </span>
                      </div>
                    )}

                    {task.data_scadenza && (
                      <p className="text-xs text-gray-400 mt-2">
                        Scadenza: {new Date(task.data_scadenza).toLocaleDateString('it-IT')}
                      </p>
                    )}
                  </div>
                ))}

                {tasksByStato[stato].length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Nessun task
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
