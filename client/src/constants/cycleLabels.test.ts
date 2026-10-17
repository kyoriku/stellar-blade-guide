import { describe, it, expect } from 'vitest'
import { cycleLabel } from './cycleLabels'

describe('cycleLabel', () => {
  it('shows the stored Base as NG', () => {
    expect(cycleLabel('Base')).toBe('NG')
  })

  it('shows every other value as stored', () => {
    for (const value of ['NG+', 'NG++', 'DLC', 'NG+++', 'All']) expect(cycleLabel(value)).toBe(value)
  })
})
