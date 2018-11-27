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

const os = require('os');

const filter = require('gulp-filter');
const gulp = require('gulp');
const through = require('through');

const allFiles = [
  '*',
  'src/**/*',
  'test/**/*',
  'tools/CodeGenerator/**/*'
];

const licenseExclude = [
  '**',
  '!LICENSE.txt',
  '!**/*.json',
  '!**/*.md',
  '!**/*.yaml'
];

const copyrightHeader = [
  '/**',
  ' * Copyright 2017 Matt Acosta',
  ' *',
  ' * Licensed under the Apache License, Version 2.0 (the "License");',
  ' * you may not use this file except in compliance with the License.',
  ' * You may obtain a copy of the License at',
  ' *',
  ' *     http://www.apache.org/licenses/LICENSE-2.0',
  ' *',
  ' * Unless required by applicable law or agreed to in writing, software',
  ' * distributed under the License is distributed on an "AS IS" BASIS,',
  ' * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.',
  ' * See the License for the specific language governing permissions and',
  ' * limitations under the License.',
  ' */'
].join(os.EOL);

const assertLicense = function(options) {
  options = options || {};
  let errorCount = 0;

  return gulp.src(allFiles, { base: '.' })
    .pipe(filter(f => !f.stat.isDirectory()))
    .pipe(filter(licenseExclude))
    .pipe(through(function write(file) {
      if (file.contents.toString('utf8').indexOf(copyrightHeader) !== 0) {
        console.error('Missing or incorrect license: ' + file.relative);
        errorCount++;
      }
      this.emit('data', file);
    }))
    .pipe(through(undefined, function end() {
      if (errorCount > 0) {
        let e = new Error('All files must contain a supported copyright header (' + errorCount + ' failed)');
        e.showStack = false;
        this.emit('error', e);
      }
      else {
        this.emit('end');
      }
    }));
};

exports.assertLicense = assertLicense;
