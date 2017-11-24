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

const gulp = require('gulp');
const merge = require('merge2');
const ts = require('gulp-typescript');

let codegen = ts.createProject('./tools/CodeGenerator/tsconfig.json');
gulp.task('compile-codegen', function() {
  return codegen.src()
    .pipe(codegen()).js
    .pipe(gulp.dest('./out/tools/CodeGenerator'));
});

gulp.task('run-codegen', ['compile-codegen'], function(doneFn) {
  cp.exec('node ./out/tools/CodeGenerator/Program.js', (error, stdout, stderr) => {
    doneFn(error);
  });
});

gulp.task('copy-json', ['run-codegen'], function() {
  return gulp.src('./src/ErrorCode.json')
    .pipe(gulp.dest('./lib'));
});

let parser = ts.createProject('./src/tsconfig.json');

// This task does not compile and run the code generator.
gulp.task('compile-parser', function() {
  let tsResult = parser.src().pipe(parser());
  return merge([
    tsResult.js.pipe(gulp.dest('./lib')),
    tsResult.dts.pipe(gulp.dest('./typings'))
  ]);
})

gulp.task('compile', ['copy-json'], function() {
  let tsResult = parser.src().pipe(parser());
  return merge([
    tsResult.js.pipe(gulp.dest('./lib')),
    tsResult.dts.pipe(gulp.dest('./typings'))
  ]);
});

gulp.task('watch', ['compile'], function() {
  // Use at own risk.
  // gulp.watch('./tools/CodeGenerator/**/*.ts', ['copy-json']);
  gulp.watch('./src/**/*.ts', ['compile-parser']);
});
