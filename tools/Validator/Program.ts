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

import * as fs from 'fs';
import * as path from 'path';

import * as glob from 'glob';

// Reminder: This is run from the './out' directory.
const DiagnosticSeverity = require('../../../lib/diagnostics/DiagnosticSeverity').DiagnosticSeverity;
const ErrorCodeInfo = require('../../../lib/diagnostics/ErrorCodeInfo.Generated').ErrorCodeInfo;
const PhpSyntaxTree = require('../../../lib/parser/PhpSyntaxTree').PhpSyntaxTree;

let verbose = false;

if (process.argv.length <= 2) {
  console.error('Path to validation files expected.');
  process.exit(1);
}

const dir = path.normalize(process.argv[2]);
let stat = fs.statSync(dir);
if (!stat.isDirectory()) {
  console.error('Directory not found.');
  process.exit(1);
}

glob('**/*.php', { cwd: dir }, (error, matches) => {
  if (error) {
    console.error(error.message)
    return;
  }

  console.log('Found %s matches.', matches.length);

  let problems = 0;
  let elapsed = 0.0;

  for (let i = 0; i < matches.length; i++) {
    let file = path.join(dir, matches[i]);
    if (verbose) {
      console.log('%s: %s', i + 1, file);
    }

    if ((i + 1) % 1000 == 0) {
      console.log('Parsing file %s of %s...', i + 1, matches.length);
    }

    try {
      // Glob finds anything ending in ".php" including folders.
      stat = fs.statSync(file);
      if (stat.isDirectory()) {
        continue;
      }

      let text = fs.readFileSync(file, { encoding: 'latin1' });
      let start = process.hrtime();

      let tree = PhpSyntaxTree.fromText(text);

      let diff = process.hrtime(start);
      elapsed += (diff[0] * 1000) + (diff[1] / 1000000);

      if (tree.root.containsDiagnostics && !verbose) {
        console.log('%s: %s', i + 1, file);
      }

      let hasErrors = false;
      let diagnostics = tree.getDiagnostics();
      for (let d of diagnostics) {
      //let severity = d.severity == DiagnosticSeverity.Error ? 'E' : 'W';
        let message = ErrorCodeInfo.getMessage(d.code);
        let args = d.messageArgs.slice();
        message = message.replace(/%s/g, function () { return args.shift(); });
        if (d.severity == DiagnosticSeverity.Error) {
          console.error('[E] [PHP%s] [%s:%s] %s', d.code, d.offset, d.width, message);
          hasErrors = true;
        }
        else {
          console.warn('[W] [PHP%s] [%s:%s] %s', d.code, d.offset, d.width, message);
        }
      }

      if (hasErrors) {
        problems++;
      }
    }
    catch (e) {
      problems++;
      if (!verbose) {
        console.log('%s: %s', i + 1, file);
      }
      if (e instanceof Error) {
        console.error(e.stack);
      }
      else {
        console.error('Unknown error: "%s".', e.toString());
      }
    }
  }

  console.log('Parse time: %s ms', elapsed.toFixed(0));

  if (problems > 0) {
    console.log('Validation failed (%s files contained errors).', problems);
  }
  else {
    console.log('Validation successful.');
  }
  process.exit(problems);
});
