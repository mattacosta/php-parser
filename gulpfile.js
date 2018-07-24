/**
 * Copyright 2017 Matt Acosta
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const cp = require('child_process');
const fs = require('fs');

const del = require('del');
const gulp = require('gulp');
const merge = require('merge2');
const mocha = require('gulp-mocha');
const ts = require('gulp-typescript');

// --- Build tasks ------------------------------------------------------------

const codegen = ts.createProject('./tools/CodeGenerator/tsconfig.json');

const parser = ts.createProject('./src/tsconfig.json');

function compileCodeGenerator() {
  return codegen.src()
    .pipe(codegen()).js
    .pipe(gulp.dest('./out/tools/CodeGenerator'));
}

function compileParser() {
  let tsResult = parser.src().pipe(parser());
  return merge([
    tsResult.js.pipe(gulp.dest('./lib')),
    tsResult.dts.pipe(gulp.dest('./typings'))
  ]);
}

function runCodeGenerator(doneFn) {
  cp.exec('node ./out/tools/CodeGenerator/Program.js', (error, stdout, stderr) => {
    doneFn(error);
  });
}

function writeJsonOutput() {
  return gulp.src('./src/ErrorCode.json')
    .pipe(gulp.dest('./lib'));
}

gulp.task('compile-codegen', compileCodeGenerator);

gulp.task('run-codegen', gulp.series('compile-codegen', runCodeGenerator, writeJsonOutput));

gulp.task('compile-parser', compileParser);

gulp.task('compile', gulp.series('run-codegen', 'compile-parser'));

// --- Testing tasks ----------------------------------------------------------

function compileTests(doneFn) {
  // @todo Use gulp-typescript instead, once sourcemaps work.
  cp.exec('npm run pretest', (error, stdout, stderr) => {
    doneFn(error);
  });
}

function runTests(doneFn) {
  let hasError = false;
  function onError(error) {
    hasError = true;
  }
  return gulp.src('./out/test/**/*.js', { read: false })
    .pipe(mocha({ ui: 'tdd', reporter: 'dot' /* , suppress: true */ }))
    .on('error', onError)
    .on('end', function() {
      if (hasError) {
        let e = new Error('Tests failed');
        e.showStack = false;
        throw e;
      }
    });
}

gulp.task('pretest', compileTests);

gulp.task('test', gulp.series('pretest', runTests));

// --- General tasks ----------------------------------------------------------

/**
 * @todo Run the build task instead.
 */
function assertOutput(doneFn) {
  if (!fs.existsSync('./lib')) {
    let e = new Error('Project has not been compiled for publishing');
    e.showStack = false;
    throw e;
  }
}

/**
 * Deletes all generated files.
 */
function clean() {
  return del(['./src/ErrorCode.json', './lib', './out', './typings', './.nyc_output']);
}

const license = require('./gulpfile.license');

gulp.task('assert-license', license.assertLicense);

gulp.task('clean', clean);

gulp.task('prepublish', gulp.series(gulp.parallel('assert-license', 'test'), assertOutput));
