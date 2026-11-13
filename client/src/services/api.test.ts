import { describe, expect, it } from 'vitest'
import { ApiError, apiError, errorMessage, readError } from './api'
import {
  CHALLENGE_MESSAGE, COMMENT_CHALLENGE_MESSAGE, NETWORK_ERROR_MESSAGE, RATE_LIMIT_MESSAGE, SERVER_ERROR_MESSAGE,
} from '../constants/errorCopy'

const page = '<!DOCTYPE html><html><head><title>Attention Required! | Cloudflare</title></head></html>'
const res = (status: number, body: string, headers: Record<string, string> = {}) => new Response(body, { status, headers })
const json = (status: number, body: unknown) => res(status, JSON.stringify(body), { 'content-type': 'application/json' })

describe('apiError', () => {
  it("takes the API's own 4xx detail, and says the API answered", async () => {
    const err = await apiError(json(403, { detail: 'Cannot delete this comment' }), 'fallback')
    expect([err.status, err.message, err.fromServer, err.challenged]).toEqual([403, 'Cannot delete this comment', true, false])
  })

  it("reads a Cloudflare page as not the API's, with the fallback", async () => {
    for (const status of [400, 401, 403, 404, 409, 422]) {
      const err = await apiError(res(status, page, { 'content-type': 'text/html; charset=UTF-8' }), 'fallback')
      expect([err.message, err.fromServer, err.challenged]).toEqual(['fallback', false, false])
    }
  })

  it('names a challenge whatever its status: a custom error rule can change it, but keeps the header', async () => {
    for (const status of [403, 429, 503]) {
      const err = await apiError(res(status, page, { 'content-type': 'text/html', 'cf-mitigated': 'challenge' }), 'fallback')
      expect([err.status, err.message, err.fromServer, err.challenged]).toEqual([status, CHALLENGE_MESSAGE, false, true])
    }
  })

  it("keeps Cloudflare's JSON problem details out of the message", async () => {
    const err = await apiError(json(403, { title: 'Error 1020: Access denied', detail: 'Access denied.', cloudflare_error: true }), 'fallback')
    expect([err.message, err.fromServer]).toEqual(['fallback', false])
  })

  it('gives an empty body the fallback', async () => {
    const err = await apiError(res(403, ''), 'fallback')
    expect([err.message, err.fromServer]).toEqual(['fallback', false])
  })

  it('keeps the fixed copy for 429 and 5xx, from anyone, and reads no body for them', async () => {
    for (const answer of [res(429, page), json(429, { error: 'Rate limit exceeded: 10 per 1 minute' })]) {
      expect((await apiError(answer, 'f')).message).toBe(RATE_LIMIT_MESSAGE)
      expect(answer.bodyUsed).toBe(false)
    }
    const fives = [500, 502, 503, 504, 520, 522, 524, 526, 530].map(status => res(status, page))
    // error_handler's own 500 and Railway's 502 alike.
    fives.push(json(500, { error: 'Internal server error', message: 'x', path: '/api/x' }))
    fives.push(json(502, { status: 'error', code: 502, message: 'Application failed to respond' }))
    for (const answer of fives) {
      expect((await apiError(answer, 'f')).message).toBe(SERVER_ERROR_MESSAGE)
      expect(answer.bodyUsed).toBe(false)
    }
  })

  it('backs readError with the same message', async () => {
    expect(await readError(res(403, page), 'fallback')).toBe('fallback')
    expect(await readError(json(409, { detail: 'Email already registered' }), 'fallback')).toBe('Email already registered')
    // The forms that throw readError's text (sign-in, Settings, reset) get a challenge's too.
    expect(await readError(res(403, page, { 'cf-mitigated': 'challenge' }), 'fallback')).toBe(CHALLENGE_MESSAGE)
  })

  it('counts every 404 the API sends as its own, so a missing page still says so', async () => {
    // A route's HTTPException; the path guard and unknown /api paths; the bot filter and origin check.
    for (const body of [{ detail: 'Walkthrough not found: main-story/x' }, { detail: 'Not Found' }, { error: 'Not Found' }]) {
      expect((await apiError(json(404, body), 'fallback')).fromServer).toBe(true)
    }
  })

  it("reads JSON with no detail or error as not the API's, as Railway's own answers are", async () => {
    for (const body of [{ status: 'error', code: 404, message: 'Application not found' }, { message: 'Forbidden' }, {}]) {
      for (const status of [403, 404]) {
        const err = await apiError(json(status, body), 'fallback')
        expect([err.message, err.fromServer], `${status} ${JSON.stringify(body)}`).toEqual(['fallback', false])
      }
    }
  })

  it("reads FastAPI's validation list as the API's own", async () => {
    const err = await apiError(json(422, { detail: [{ msg: 'Value error, Username already taken' }] }), 'fallback')
    expect([err.message, err.fromServer]).toEqual(['Username already taken', true])
  })

  it("takes an ApiError built by hand for one the API didn't send", () => {
    const err = new ApiError(403, 'x')
    expect([err.fromServer, err.challenged]).toEqual([false, false])
  })
})

describe('errorMessage', () => {
  it("never shows a parser's text, which quotes the body", async () => {
    const parsed: unknown = await new Response(page).json().catch((e: unknown) => e)
    expect(parsed).toBeInstanceOf(SyntaxError)
    expect(errorMessage(parsed, 'fallback')).toBe('fallback')
    // WebKit's res.json() rejects with a DOMException of that name, with words of its own.
    expect(errorMessage(new DOMException('The string did not match the expected pattern.', 'SyntaxError'), 'fallback')).toBe('fallback')
  })

  it("keeps an ApiError's message and the offline notice", () => {
    expect(errorMessage(new ApiError(403, 'x'), 'fallback')).toBe('x')
    expect(errorMessage(new TypeError('Failed to fetch'), 'fallback')).toBe(NETWORK_ERROR_MESSAGE)
  })

  it("swaps a challenge's sentence for the caller's, and nothing else", () => {
    const challenged = new ApiError(403, CHALLENGE_MESSAGE, { challenged: true })
    expect(errorMessage(challenged, 'fallback', COMMENT_CHALLENGE_MESSAGE)).toBe(COMMENT_CHALLENGE_MESSAGE)
    expect(errorMessage(challenged, 'fallback')).toBe(CHALLENGE_MESSAGE)
    expect(errorMessage(new ApiError(403, 'x', { fromServer: true }), 'fallback', COMMENT_CHALLENGE_MESSAGE)).toBe('x')
  })
})
