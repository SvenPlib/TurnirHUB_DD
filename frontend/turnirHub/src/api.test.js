
import { describe, it, expect, vi, afterEach } from 'vitest'
import { api } from './api'

describe('API komunikacija', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uspešen GET zahtevek vrne podatke', async () => {
    const data = { user: { id: 1 } }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => data,
    }))

    const result = await api('/api/auth/me')

    expect(result).toEqual(data)
  })

  it('privzeto uporablja metodo GET', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })
    vi.stubGlobal('fetch', mockFetch)

    await api('/api/auth/me')

    expect(mockFetch.mock.calls[0][1].method).toBe('GET')
  })

  it('pri zahtevku pošlje piškotke', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })
    vi.stubGlobal('fetch', mockFetch)

    await api('/api/auth/me')

    expect(mockFetch.mock.calls[0][1].credentials)
      .toBe('include')
  })

  it('POST zahtevek pretvori podatke v JSON', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })
    vi.stubGlobal('fetch', mockFetch)

    const body = {
      email: 'test@example.com',
      password: 'test123',
    }

    await api('/api/auth/login', {
      method: 'POST',
      body,
    })

    const options = mockFetch.mock.calls[0][1]

    expect(options.method).toBe('POST')
    expect(options.body).toBe(JSON.stringify(body))
    expect(options.headers['Content-Type'])
      .toBe('application/json')
  })

  it('neuspešen odgovor sproži napako s statusom', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: 'Napačno geslo',
      }),
    }))

    await expect(api('/api/auth/login'))
      .rejects.toMatchObject({
        message: 'Napačno geslo',
        status: 401,
      })
  })

  it('API sestavi pravilen URL zahtevka', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    vi.stubGlobal('fetch', mockFetch)

    await api('/api/tournaments')

    expect(mockFetch.mock.calls[0][0])
      .toMatch(/\/api\/tournaments$/)
  })

  it('GET zahtevek brez body nima Content-Type glave', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    vi.stubGlobal('fetch', mockFetch)

    await api('/api/tournaments')

    const options = mockFetch.mock.calls[0][1]

    expect(options.headers).toBeUndefined()
    expect(options.body).toBeUndefined()
  })

  it('API podpira PUT zahtevke', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    vi.stubGlobal('fetch', mockFetch)

    const body = { name: 'Nov naziv turnirja' }

    await api('/api/tournaments/1', {
      method: 'PUT',
      body,
    })

    const options = mockFetch.mock.calls[0][1]

    expect(options.method).toBe('PUT')
    expect(options.body).toBe(JSON.stringify(body))
  })

  it('neveljaven JSON pri uspešnem odgovoru vrne null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        throw new SyntaxError('Invalid JSON')
      },
    }))

    const result = await api('/api/tournaments')

    expect(result).toBeNull()
  })

  it('napaka brez sporočila uporabi privzeto sporočilo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    }))

    await expect(api('/api/tournaments'))
      .rejects.toMatchObject({
        message: 'Napaka pri komunikaciji s strežnikom',
        status: 500,
      })
  })

  it('validacijske napake ohrani v error.fields', async () => {
    const fields = {
      email: 'Neveljaven e-poštni naslov',
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'Napaka pri validaciji',
        fields,
      }),
    }))

    await expect(api('/api/auth/register'))
      .rejects.toMatchObject({
        status: 400,
        fields,
      })
  })
})
