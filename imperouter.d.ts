// This type definition needs its own tests.

export const GET     = `GET`
export const HEAD    = `HEAD`
export const OPTIONS = `OPTIONS`
export const POST    = `POST`
export const PUT     = `PUT`
export const PATCH   = `PATCH`
export const DELETE  = `DELETE`

export type Groups  = Record<string, string>
export type Pattern = RegExp | string

export type ReqFunAsync<R extends Request = Request, T = Response> = (req: R) => Promise<T>
export type ReqFunSync<R extends Request = Request, T = Response> = (req: R) => T
export type ReqFunParam<R extends Request = Request, T = Response> = (req: R, groups?: Groups) => T

export class Req extends Request {URL: URL}

export function preflight<R extends Request = Request, T = Response>(req: R, fun?: ReqFunSync<R, T>): T | undefined

// TODO: `Response<status = 404>`?
export function sub<R extends Request = Request, T = Response>(req: R, pat: Pattern, fun: ReqFunSync<R, T>): T | Response | undefined
export function sub<R extends Request = Request, T = Response>(req: R, pat: Pattern, fun: ReqFunAsync<R, T>): Promise<T | Response | undefined>

// TODO: `Response<status = 405>`?
export function methods<R extends Request = Request, T = Response>(req: R, pat: Pattern, fun: ReqFunSync<R, T>): T | Response | undefined
export function methods<R extends Request = Request, T = Response>(req: R, pat: Pattern, fun: ReqFunAsync<R, T>): Promise<T | Response | undefined>

export function method<R extends Request = Request, T = Response>(req: R, method: string, pat: Pattern, fun: ReqFunSync<R, T>): T | undefined
export function any<R extends Request = Request, T = Response>(req: R, pat: Pattern, fun: ReqFunParam<R, T>): T | undefined
export function get<R extends Request = Request, T = Response>(req: R, pat: Pattern, fun: ReqFunParam<R, T>): T | undefined
export function head<R extends Request = Request, T = Response>(req: R, pat: Pattern, fun: ReqFunParam<R, T>): T | undefined
export function options<R extends Request = Request, T = Response>(req: R, pat: Pattern, fun: ReqFunParam<R, T>): T | undefined
export function post<R extends Request = Request, T = Response>(req: R, pat: Pattern, fun: ReqFunParam<R, T>): T | undefined
export function put<R extends Request = Request, T = Response>(req: R, pat: Pattern, fun: ReqFunParam<R, T>): T | undefined
export function patch<R extends Request = Request, T = Response>(req: R, pat: Pattern, fun: ReqFunParam<R, T>): T | undefined
export function del<R extends Request = Request, T = Response>(req: R, pat: Pattern, fun: ReqFunParam<R, T>): T | undefined

// TODO: `Response<status = 405>`?
export function only(req: Request, ...methods: string[]): Response | undefined
export function onlyGet(req: Request): Response | undefined
export function onlyHead(req: Request): Response | undefined
export function onlyOptions(req: Request): Response | undefined
export function onlyPost(req: Request): Response | undefined
export function onlyPut(req: Request): Response | undefined
export function onlyPatch(req: Request): Response | undefined
export function onlyDelete(req: Request): Response | undefined

export function test(req: Request, method: string, pat: Pattern): boolean | undefined
export function testAny(req: Request, pat: Pattern): boolean

export function match(req: Request, method: string, pat: Pattern): RegExpMatchArray | undefined
export function matchAny(req: Request, pat: Pattern): RegExpMatchArray

export function either<R extends Request = Request, T = Response>(req: R, fun: ReqFunSync<R, T>, def: ReqFunSync<R, T>): T | undefined
export function either<R extends Request = Request, T = Response>(req: R, fun: ReqFunAsync<R, T>, def: ReqFunSync<R, T>): Promise<T | undefined>
export function either<R extends Request = Request, T = Response>(req: R, fun: ReqFunAsync<R, T>, def: ReqFunAsync<R, T>): Promise<T | undefined>
export function either<R extends Request = Request, T = Response>(req: R, fun: ReqFunSync<R, T>, def: ReqFunAsync<R, T>): Promise<T | undefined>

export function isMethod(req: Request, method: string): boolean
export function notAllowed(req: Request): Response
export function notFound(req: Request): Response
export function error(err: Error): Response
export function empty(_?: Request): Response
