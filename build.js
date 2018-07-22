'use strict'

const babel = require('@babel/core')
const del = require('del')
const fs = require('fs')
const glob = require('glob')
const mkdirp = require('mkdirp')
const pt = require('path')

const SRC  = 'src'
const ES   = 'es'
const DIST = 'dist'

const babelPlugins = [
  ['@babel/plugin-check-constants',                {loose: true}],
  ['@babel/plugin-transform-block-scoping',        {loose: true}],
  ['@babel/plugin-transform-destructuring',        {loose: true}],
  ['@babel/plugin-transform-parameters',           {loose: true}],
  ['@babel/plugin-transform-shorthand-properties', {loose: true}],
  ['@babel/plugin-transform-template-literals',    {loose: true}],
]

const distBabelPlugins = [
  ...babelPlugins,
  ['@babel/plugin-transform-modules-commonjs', {strict: true, noInterop: true}],
]

function main() {
  const cmd = process.argv[2]
  if (!cmd) {
    build()
  }
  else if (cmd === 'watch') {
    watch()
    buildOrReport()
  }
  else {
    throw Error(`Unrecognized command: ${cmd}`)
  }
}

function clear() {
  del.sync(ES)
  del.sync(DIST)
}

function build() {
  clear()

  const t0 = Date.now()

  const paths = glob.sync(`${SRC}/**/*.js`)

  for (const path of paths) {
    const {code: esCode} = babel.transformFileSync(path, {plugins: babelPlugins})

    const esPath = pt.join(ES, pt.relative(SRC, path))
    const esDir = pt.dirname(esPath)
    if (esDir) mkdirp.sync(esDir)
    fs.writeFileSync(esPath, esCode)

    const {code: distCode} = babel.transform(esCode, {plugins: distBabelPlugins})

    const distPath = pt.join(DIST, pt.relative(SRC, path))
    const distDir = pt.dirname(distPath)
    if (distDir) mkdirp.sync(distDir)
    fs.writeFileSync(distPath, distCode)
  }

  const t1 = Date.now()
  console.info(`Built in ${t1 - t0}ms`)
}

function watch() {
  fs.watch(SRC, buildOrReport)
}

function buildOrReport() {
  try {
    build()
  }
  catch (err) {
    console.error(err)
  }
}

main()
