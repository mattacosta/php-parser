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
const mocha = require('gulp-mocha');

gulp.task('compile-tests', function(doneFn) {
  // @todo Use gulp-typescript instead, once sourcemaps work.
  cp.exec('npm run pretest', (error, stdout, stderr) => {
    doneFn(error);
  });
})

gulp.task('test', ['compile-tests'], function(doneFn) {
  return gulp.src('./out/test/**/*.js', { read: false })
    .pipe(mocha({ ui: 'tdd', reporter: 'dot', suppress: true }))
    // .on('error', (error) => {
    //   // console.log(error.stdout);
    //   let e = new Error('Test failed');
    //   e.showStack = false;
    //   doneFn(e);
    // });
});
