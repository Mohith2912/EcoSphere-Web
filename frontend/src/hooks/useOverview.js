import { useEffect, useState } from 'react'
import { getOverview } from '../api/dashboard'

export function useOverview() {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  useEffect(() => {
    let active = true
    getOverview()
      .then((data) => active && setState({ data, loading: false, error: '' }))
      .catch((error) => active && setState({ data: null, loading: false, error: error.message }))
    return () => { active = false }
  }, [])
  return state
}
