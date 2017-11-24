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

const fs = require('fs');

const gulp = require('gulp');
const rimraf = require('rimraf');

gulp.task('clean', function() {
  let cb = (err) => {
    if (err) {
      throw err;
    }
  };
  rimraf('./src/ErrorCode.json', cb);
  rimraf('./lib', cb);
  rimraf('./out', cb);
  rimraf('./typings', cb);
});

const compile = require('./gulpfile.compile');
const test = require('./gulpfile.test');

const license = require('./gulpfile.license');
gulp.task('assert-license', () => license.assertLicense());

gulp.task('prepublish', ['assert-license', 'test'], function() {
  if (!fs.existsSync('./lib')) {
    let e = new Error('Project has not been compiled for publishing');
    e.showStack = false;
    throw e;
  }
});
