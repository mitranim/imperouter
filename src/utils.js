export function isFunction(value) {
  return typeof value === 'function'
}

export function isObject(value) {
  return value !== null && typeof value === 'object'
}

export function isArray(value) {
  return value instanceof Array
}

export function isString(value) {
  return typeof value === 'string'
}

export function isRegExp(value) {
  return value instanceof RegExp
}

export function onlyString(value) {
  if (value == null) return ''
  validate(value, isString)
  return value
}

export function validate(value, fun) {
  if (!fun(value)) {
    throw Error(`Expected ${show(value)} to satisfy test ${show(fun)}`)
  }
}

export function show(value) {
  return (
    isFunction(value) && value.name
    ? value.name
    : isPlainDataStructure(value)
    ? JSON.stringify(value)
    : isString(value)
    ? `"${value}"`
    : String(value)
  )
}

function isPlainDataStructure(value) {
  if (!isObject(value)) return false
  if (isArray(value)) return true
  const proto = Object.getPrototypeOf(value)
  return proto === null || proto === Object.prototype
}

export function omitNil(dict) {
  const out = {}
  for (const key in dict) if (dict[key] != null) out[key] = dict[key]
  return out
}

export function prepend(char, value) {
  validate(char, isString)
  if (value == null || value === '') return ''
  validate(value, isString)
  return value[0] === char ? value : char + value
}

export function copy(dict) {
  const out = {}
  for (const key in dict) out[key] = dict[key]
  return out
}
