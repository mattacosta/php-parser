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
import * as yaml from 'js-yaml';

import { DiagnosticConfig } from './DiagnosticConfig';
import { ErrorCodeGenerator } from './ErrorCodeGenerator';
import { ErrorCodeInfoGenerator } from './ErrorCodeInfoGenerator';
import { ErrorCodeJsonGenerator } from './ErrorCodeJsonGenerator';
import { NodeConfig } from './NodeConfig';
import { NodeGenerator } from './NodeGenerator';
import { NodeTransformGenerator } from './NodeTransformGenerator';
import { NodeVisitorGenerator } from './NodeVisitorGenerator';
import { SyntaxNodeGenerator } from './SyntaxNodeGenerator';
import { SyntaxTransformGenerator } from './SyntaxTransformGenerator';
import { SyntaxVisitorGenerator } from './SyntaxVisitorGenerator';

try {
  const basePath = './src';
  const nodeText = fs.readFileSync(basePath + '/nodes.yaml', 'utf8');
  const nodeConfig = <NodeConfig>yaml.safeLoad(nodeText);

  fs.writeFileSync(basePath + '/language/node/Node.Generated.ts', NodeGenerator.generate(nodeConfig.nodes));
  fs.writeFileSync(basePath + '/language/node/NodeVisitor.Generated.ts', NodeVisitorGenerator.generate(nodeConfig.nodes));
  fs.writeFileSync(basePath + '/language/node/NodeTransform.Generated.ts', NodeTransformGenerator.generate(nodeConfig.nodes));

  fs.writeFileSync(basePath + '/language/syntax/SyntaxNode.Generated.ts', SyntaxNodeGenerator.generate(nodeConfig.nodes));
  fs.writeFileSync(basePath + '/language/syntax/SyntaxTransform.Generated.ts', SyntaxTransformGenerator.generate(nodeConfig.nodes));
  fs.writeFileSync(basePath + '/language/syntax/SyntaxVisitor.Generated.ts', SyntaxVisitorGenerator.generate(nodeConfig.nodes));

  console.log(`Generated ${nodeConfig.nodes.length} nodes`);

  const diagnosticText = fs.readFileSync(basePath + '/diagnostics.yaml', 'utf8');
  const diagConfig = <DiagnosticConfig>yaml.safeLoad(diagnosticText);

  fs.writeFileSync(basePath + '/diagnostics/ErrorCode.Generated.ts', ErrorCodeGenerator.generate(diagConfig.diagnostics));
  fs.writeFileSync(basePath + '/diagnostics/ErrorCodeInfo.Generated.ts', ErrorCodeInfoGenerator.generate(diagConfig.diagnostics));

  fs.writeFileSync(basePath + '/ErrorCode.json', ErrorCodeJsonGenerator.generate(diagConfig.diagnostics));

  console.log(`Generated ${diagConfig.diagnostics.length} diagnostics`);
}
catch (e) {
  console.log(e);
}

process.exit();
