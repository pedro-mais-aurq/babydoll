// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TodayCinematic } from '../src/cinematics/today/TodayCinematic'
import type { TodayImage } from '../src/cinematics/today/todayContent'

const images: TodayImage[] = [1, 2, 3, 4].map((number) => ({
  id: `image-${number}`,
  name: `Imagem ${number}`,
  src: `https://example.com/image-${number}.png`,
  alt: `Lembrança ${number}`,
}))

const mountedRoots: Root[] = []

async function renderCinematic(
  loadImages: () => Promise<TodayImage[]>,
  onComplete = vi.fn(),
) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  mountedRoots.push(root)

  await act(async () => {
    root.render(<TodayCinematic loadImages={loadImages} onComplete={onComplete} />)
  })

  return { container, onComplete }
}

function setInputValue(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )?.set

  valueSetter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    })),
  )
})

afterEach(() => {
  act(() => {
    while (mountedRoots.length > 0) {
      mountedRoots.pop()?.unmount()
    }
  })
  document.body.replaceChildren()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('TodayCinematic', () => {
  it('mantém um loading discreto enquanto as imagens não chegam', async () => {
    const { container } = await renderCinematic(
      () => new Promise<TodayImage[]>(() => undefined),
    )

    expect(container.querySelector('[aria-label="Carregando cinemática"]')).not.toBeNull()
  })

  it('renderiza a sequência quando as quatro imagens estão disponíveis', async () => {
    const { container } = await renderCinematic(async () => images)

    expect(container.textContent).toContain('Nosso primeiro dia 5,')
    expect(container.textContent).toContain('quando tudo ainda era doce')
    expect(container.textContent).toContain('ainda temos muito pela frente')
    expect(container.querySelectorAll('img')).toHaveLength(4)
  })

  it('mostra indisponibilidade controlada quando o carregamento falha', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { container } = await renderCinematic(async () => {
      throw new Error('network failure')
    })

    expect(container.getAttribute('role')).toBeNull()
    expect(container.textContent).toContain('essa lembrança precisa de mais um instante')
    expect(container.querySelector('[role="alert"]')).not.toBeNull()
  })

  it('trata conteúdo incompleto como lembrança ausente', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { container } = await renderCinematic(async () => images.slice(0, 3))

    expect(container.textContent).toContain('uma lembrança não conseguiu chegar até aqui')
  })

  it('só encerra após a resposta Ida e volta', async () => {
    const onComplete = vi.fn()
    const { container } = await renderCinematic(async () => images, onComplete)
    const input = container.querySelector<HTMLInputElement>('#andromeda-answer')
    const form = container.querySelector<HTMLFormElement>('form')

    expect(input).not.toBeNull()
    expect(form).not.toBeNull()

    await act(async () => {
      if (input && form) {
        setInputValue(input, 'Só ida')
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      }
    })

    expect(container.textContent).toContain('ainda falta uma parte desse caminho')
    expect(onComplete).not.toHaveBeenCalled()

    await act(async () => {
      if (input && form) {
        setInputValue(input, '  IDA   E VOLTA  ')
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
        await new Promise((resolve) => window.setTimeout(resolve, 0))
      }
    })

    expect(container.textContent).toContain('sempre.')
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
