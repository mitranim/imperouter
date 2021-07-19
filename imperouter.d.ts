// Untested draft.

export type Url         = string | URL
export type Query       = Record<string, Nil | Stringable | Stringable[]>
export type QueryStrict = Record<string, string[]>
export type Groups      = Record<string, string>
export type Nil         = null | undefined
export type Prim        = Nil | string | number | bigint | boolean | symbol
export type Stringable  = Prim | Date

export const GET     = 'GET'
export const HEAD    = 'HEAD'
export const OPTIONS = 'OPTIONS'
export const POST    = 'POST'
export const PUT     = 'PUT'
export const PATCH   = 'PATCH'
export const DELETE  = 'DELETE'

export type EmptyResFun = () => Response
export type ReqFunAsync<R extends Router = Router, T = Response> = (req: R) => Promise<T>
export type ReqFunSync<R extends Router = Router, T = Response> = (req: R) => T
export type ReqFunParam<R extends Router = Router, T = Response> = (req: R, groups?: Groups) => T

export class Router extends Request {
  preflight(fun?: EmptyResFun): Response | undefined

  // TODO: `Response<status = 404>`?
  sub<T>(reg: RegExp, fun: ReqFunSync<this, T>): T | Response
  sub<T>(reg: RegExp, fun: ReqFunAsync<this, T>): Promise<T | Response>

  // TODO: `Response<status = 405>`?
  meths<T>(reg: RegExp, fun: ReqFunSync<this, T>): T | Response
  meths<T>(reg: RegExp, fun: ReqFunAsync<this, T>): Promise<T | Response>

  meth<T>(method: string, reg: RegExp, fun: ReqFunSync<this, T>): T | undefined
  any<T>(reg: RegExp, fun: ReqFunParam<this, T>): T | undefined
  get(reg: RegExp, fun: ReqFunParam<this, T>): T | undefined
  head(reg: RegExp, fun: ReqFunParam<this, T>): T | undefined
  options(reg: RegExp, fun: ReqFunParam<this, T>): T | undefined
  post(reg: RegExp, fun: ReqFunParam<this, T>): T | undefined
  put(reg: RegExp, fun: ReqFunParam<this, T>): T | undefined
  patch(reg: RegExp, fun: ReqFunParam<this, T>): T | undefined
  delete(reg: RegExp, fun: ReqFunParam<this, T>): T | undefined

  // TODO: `Response<status = 405>`?
  only(...methods: string[]): Response | undefined
  onlyGet(): Response | undefined
  onlyHead(): Response | undefined
  onlyOptions(): Response | undefined
  onlyPost(): Response | undefined
  onlyPut(): Response | undefined
  onlyPatch(): Response | undefined
  onlyDelete(): Response | undefined

  test(method: string, reg: RegExp): boolean | undefined
  testAny(reg: RegExp): boolean

  match(method: string, reg: RegExp): RegExpMatchArray | undefined
  matchAny(reg: RegExp): RegExpMatchArray

  either<T>(fun: ReqFunSync<this, T>, def: ReqFunSync<this, T>): T | undefined
  either<T>(fun: ReqFunAsync<this, T>, def: ReqFunSync<this, T>): Promise<T | undefined>
  either<T>(fun: ReqFunAsync<this, T>, def: ReqFunAsync<this, T>): Promise<T | undefined>
  either<T>(fun: ReqFunSync<this, T>, def: ReqFunAsync<this, T>): Promise<T | undefined>

  isMeth(val: string): boolean
}

export function notAllowed(req: Request): Response
export function notFound(req: Request): Response
export function empty(_?: Request): Response

export function urlWithPathname(url: Url, pathname: string): string
export function urlWithSearch(url: Url, search: string): string
export function urlWithHash(url: Url, hash: string): string
export function urlWithQuery(url: Url, query: Query): string
export function urlAppendQuery(url: Url, query: Query): string
export function urlPatchQuery(url: Url, query: Query): string
export function urlMutReplaceQuery(url: Url, query: Query): string
export function urlMutAppendQuery(url: Url, query: Query): string
export function urlMutPatchQuery(url: Url, query: Query): string
export function searchReplace(search: URLSearchParams, query: Query): URLSearchParams
export function searchAppend(search: URLSearchParams, query: Query): URLSearchParams
export function searchPatch(search: URLSearchParams, query: Query): URLSearchParams
export function urlQuery(url: Url): QueryStrict
export function searchQuery(search: URLSearchParams): QueryStrict

// TODO: how to type?
export function withUrl(url: Url, fun: UrlFun, ...args: unknown[]): string
export type UrlFun = (url: URL, ...args: unknown[]) => URL | undefined
