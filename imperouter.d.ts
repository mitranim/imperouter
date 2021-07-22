export const GET     = 'GET'
export const HEAD    = 'HEAD'
export const OPTIONS = 'OPTIONS'
export const POST    = 'POST'
export const PUT     = 'PUT'
export const PATCH   = 'PATCH'
export const DELETE  = 'DELETE'

export type Nil         = null | undefined
export type Prim        = Nil | string | number | bigint | boolean | symbol
export type Stringable  = Prim | Date
export type Url         = string | URL
export type Query       = Record<string, Nil | Stringable | Stringable[]>
export type QueryStrict = Record<string, string[]>
export type Groups      = Record<string, string>

export type ReqFunAsync<R extends Request = Request, T = Response> = (req: R) => Promise<T>
export type ReqFunSync<R extends Request = Request, T = Response> = (req: R) => T
export type ReqFunParam<R extends Request = Request, T = Response> = (req: R, groups?: Groups) => T

export class Req extends Request {URL: URL}

export function preflight<R extends Request = Request, T = Response>(req: R, fun?: ReqFunSync<R, T>): T | undefined

// TODO: `Response<status = 404>`?
export function sub<R extends Request = Request, T = Response>(req: Request, reg: RegExp, fun: ReqFunSync<R, T>): T | Response
export function sub<R extends Request = Request, T = Response>(req: Request, reg: RegExp, fun: ReqFunAsync<R, T>): Promise<T | Response>

// TODO: `Response<status = 405>`?
export function methods<R extends Request = Request, T = Response>(req: Request, reg: RegExp, fun: ReqFunSync<R, T>): T | Response
export function methods<R extends Request = Request, T = Response>(req: Request, reg: RegExp, fun: ReqFunAsync<R, T>): Promise<T | Response>

export function method<R extends Request = Request, T = Response>(req: Request, method: string, reg: RegExp, fun: ReqFunSync<R, T>): T | undefined
export function any<R extends Request = Request, T = Response>(req: Request, reg: RegExp, fun: ReqFunParam<R, T>): T | undefined
export function get<R extends Request = Request, T = Response>(req: Request, reg: RegExp, fun: ReqFunParam<R, T>): T | undefined
export function head<R extends Request = Request, T = Response>(req: Request, reg: RegExp, fun: ReqFunParam<R, T>): T | undefined
export function options<R extends Request = Request, T = Response>(req: Request, reg: RegExp, fun: ReqFunParam<R, T>): T | undefined
export function post<R extends Request = Request, T = Response>(req: Request, reg: RegExp, fun: ReqFunParam<R, T>): T | undefined
export function put<R extends Request = Request, T = Response>(req: Request, reg: RegExp, fun: ReqFunParam<R, T>): T | undefined
export function patch<R extends Request = Request, T = Response>(req: Request, reg: RegExp, fun: ReqFunParam<R, T>): T | undefined
export function del<R extends Request = Request, T = Response>(req: Request, reg: RegExp, fun: ReqFunParam<R, T>): T | undefined

// TODO: `Response<status = 405>`?
export function only(req: Request, ...methods: string[]): Response | undefined
export function onlyGet(req: Request): Response | undefined
export function onlyHead(req: Request): Response | undefined
export function onlyOptions(req: Request): Response | undefined
export function onlyPost(req: Request): Response | undefined
export function onlyPut(req: Request): Response | undefined
export function onlyPatch(req: Request): Response | undefined
export function onlyDelete(req: Request): Response | undefined

export function test(req: Request, method: string, reg: RegExp): boolean | undefined
export function testAny(req: Request, reg: RegExp): boolean

export function match(req: Request, method: string, reg: RegExp): RegExpMatchArray | undefined
export function matchAny(req: Request, reg: RegExp): RegExpMatchArray

export function either<R extends Request = Request, T = Response>(req: Request, fun: ReqFunSync<R, T>, def: ReqFunSync<R, T>): T | undefined
export function either<R extends Request = Request, T = Response>(req: Request, fun: ReqFunAsync<R, T>, def: ReqFunSync<R, T>): Promise<T | undefined>
export function either<R extends Request = Request, T = Response>(req: Request, fun: ReqFunAsync<R, T>, def: ReqFunAsync<R, T>): Promise<T | undefined>
export function either<R extends Request = Request, T = Response>(req: Request, fun: ReqFunSync<R, T>, def: ReqFunAsync<R, T>): Promise<T | undefined>

export function isMethod(req: Request, method: string): boolean
export function notAllowed(req: Request): Response
export function notFound(req: Request): Response
export function empty(_?: Request): Response

export function urlWithPathname(url: Url, pathname: string): string
export function urlWithSearch(url: Url, search: string): string
export function urlWithHash(url: Url, hash: string): string
export function urlWithQuery(url: Url, query: Query | Nil): string
export function urlAppendQuery(url: Url, query: Query | Nil): string
export function urlPatchQuery(url: Url, query: Query | Nil): string
export function urlMutReplaceQuery(url: Url, query: Query | Nil): string
export function urlMutAppendQuery(url: Url, query: Query | Nil): string
export function urlMutPatchQuery(url: Url, query: Query | Nil): string
export function searchReplace(search: URLSearchParams, query: Query | Nil): URLSearchParams
export function searchAppend(search: URLSearchParams, query: Query | Nil): URLSearchParams
export function searchPatch(search: URLSearchParams, query: Query | Nil): URLSearchParams
export function urlQuery(url: Url): QueryStrict
export function searchQuery(search: URLSearchParams): QueryStrict

// TODO: how to type?
export function withUrl(url: Url, fun: UrlFun, ...args: unknown[]): string
export type UrlFun = (url: URL, ...args: unknown[]) => URL | undefined
