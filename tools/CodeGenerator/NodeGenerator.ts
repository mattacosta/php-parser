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

import * as os from 'os';

import { NodeClass, NodeProperty } from './NodeConfig';

export class NodeGenerator {

  protected readonly licenseText: string = [
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

  protected debug: boolean;

  protected text: string;

  protected constructor(debug = false) {
    this.debug = debug;
    this.text = this.licenseText +
      '\n' +
      '\n' +
      '// ----------------------------------------------------------------------------\n' +
      '// THIS IS A GENERATED FILE. DO NOT MODIFY.\n' +
      '// ----------------------------------------------------------------------------\n' +
      '\n' +
      '\'use strict\';\n' +
      '\n';
  }

  public static generate(list: NodeClass[]): string {
    let nameSort = list.slice().sort((a, b) => {
      if (a.name > b.name) {
        return 1;
      }
      if (a.name < b.name) {
        return -1;
      }
      return 0;
    });
    // @todo This should really check dependencies, but it works. For now.
    let abstractSort = list.slice().sort((a, b) => {
      if (a.extends && !b.extends) {
        return 1;
      }
      if (!a.extends && b.extends) {
        return -1;
      }
      if (a.abstract && !b.abstract) {
        return -1;
      }
      if (!a.abstract && b.abstract) {
        return 1;
      }
      if (a.name > b.name) {
        return 1;
      }
      if (a.name < b.name) {
        return -1;
      }
      return 0;
    });

    let generator = new NodeGenerator();
    generator.addImports(nameSort);
    for (let i = 0; i < abstractSort.length; i++) {
      generator.addClass(abstractSort[i], i);
    }
    return generator.text;
  }

  protected addAcceptMethods(visitorName: string | undefined, className: string): string {
    if (!visitorName) {
      console.log(className + 'Node: Missing visitorName property.');
    }

    let text = '  public accept(visitor: NodeVisitor) {\n';
    if (!visitorName) {
      text += '    throw new Error(\'Not implemented\');\n';
    }
    else {
      text += '    visitor.' + visitorName + '(this);\n';
    }
    text += '  }\n';
    text += '\n';
    text += '  public acceptResult<T>(visitor: NodeTransform<T>): T {\n';
    if (!visitorName) {
      text += '    throw new Error(\'Not implemented\');\n';
    }
    else {
      text += '    return visitor.' + visitorName + '(this);\n';
    }
    text += '  }\n';
    return text;
  }

  protected addChildAtMethod(properties: NodeProperty[]): string {
    let text = '';
    text += '  public childAt(index: number): INode | null {\n';
    text += '    switch (index) {\n';
    for (let i = 0; i < properties.length; i++) {
      let prop = properties[i];
      text += '      case ' + i + ':\n';
      text += '        return this.' + prop.name + ';\n';
    }
    text += '      default:\n';
    text += '        return null;\n';
    text += '    }\n';
    text += '  }\n';
    return text;
  }

  protected addClass(info: NodeClass, index: number) {
    this.assertClass(info);

    let abstract = info.abstract ? ' abstract' : '';
    let baseClass = info.extends ? info.extends + 'Node' : 'Node';

    this.text += 'export' + abstract + ' class ' + info.name + 'Node extends ' + baseClass + ' {\n';
    this.text += '\n';
    if (info.properties) {
      this.text += this.addProperties(info.properties, info.abstract),
      this.text += '\n';
      if (!info.abstract) {
        this.text += this.addConstructor(info.properties, info.name),
        this.text += '\n';
        this.text += this.addCountGetter(info.properties.length),
        this.text += '\n';
        this.text += this.addFlagsGetter();
        this.text += '\n';
        this.text += this.addFullWidthGetter();
        this.text += '\n';
        this.text += this.addAcceptMethods(info.visitorName, info.name),
        this.text += '\n';
        this.text += this.addChildAtMethod(info.properties),
        this.text += '\n';
        this.text += this.addCreateNodeMethod(info.name),
        this.text += '\n';
        this.text += this.addHashCode(info.properties, index);
        this.text += '\n';
        this.text += this.addWithDiagnostics(info.properties, info.name);
        this.text += '\n';
        this.text += this.addUpdateFlagsAndWidth();
      }
    }
    else if (this.debug && info.abstract) {
      this.text += '  protected readonly is' + info.name + ': boolean;\n';
      this.text += '\n';
    }
    this.text += '}\n';
  }

  protected addConstructor(properties: NodeProperty[], className: string): string {
    let text = '  constructor(';

    let paramList = '';
    let body = '';
    for (let i = 0; i < properties.length; i++) {
      let prop = properties[i];
      let type = this.getNodeTypes(prop, className);
      paramList += prop.name + ': ' + type;
      body += '    this.' + prop.name + ' = ' + prop.name + ';\n';
      if (prop.optional) {
        paramList += ' | null';
        body += '    if (' + prop.name + ' !== null) {\n';
        body += '      this.updateFlagsAndWidth(' + prop.name + '.flags, ' + prop.name + '.fullWidth);\n';
        body += '    }\n';
      }
      else {
        body += '    this.updateFlagsAndWidth(' + prop.name + '.flags, ' + prop.name + '.fullWidth);\n';
      }
      paramList += ', ';
    }
    paramList += 'diagnostics?: SyntaxDiagnostic[]';

    text += paramList + ') {\n';
    text += '    super(diagnostics || Node.EmptyDiagnosticList);\n';
    text += '    this._flags = NodeFlags.None;\n';
    text += '    this._fullWidth = 0;\n';
    text += '    this.hash = 0;\n';
    text += '\n';
    text += body;
    text += '\n';
    text += '    if (diagnostics !== void 0 && diagnostics.length > 0) {\n';
    text += '      this._flags = this._flags | NodeFlags.ContainsDiagnostics;\n';
    text += '    }\n';
    text += '  }\n';

    return text;
  }

  protected addCountGetter(count: number): string {
    let text = '';
    text += '  public get count(): number {\n';
    text += '    return ' + count + ';\n';
    text += '  }\n';
    return text;
  }

  protected addCreateNodeMethod(name: string): string {
    let text = '';
    text += '  public createSyntaxNode(parent: SyntaxNode, offset: number): ' + name + 'SyntaxNode {\n';
    text += '    return new ' + name + 'SyntaxNode(this, parent, offset);\n';
    text += '  }\n';
    return text;
  }

  protected addFlagsGetter(): string {
    let text = '';
    text += '  public get flags(): number {\n';
    text += '    return this._flags;\n';
    text += '  }\n';
    return text;
  }

  protected addFullWidthGetter(): string {
    let text = '';
    text += '  public get fullWidth(): number {\n';
    text += '    return this._fullWidth;\n';
    text += '  }\n';
    return text;
  }

  protected addHashCode(properties: NodeProperty[], index: number): string {
    // @todo Using the index as a sort of `NodeKind` property isn't exactly ideal.
    index = index + 5;  // 1=Token, 2=Trivia, 3=List, 4=SourceTextNode

    let text = '';
    text += '  public hashCode(): number {\n';
    text += '    if (this.hash === 0) {\n';
    text += '      let hash = Hash.combine(this._flags ^ this._fullWidth, ' + index + ');\n';
    // text += '      hash = Hash.combine(hash, ' + index + ');\n';

    for (let i = 0; i < properties.length; i++) {
      let prop = properties[i];
      text += '      hash = this.' + prop.name + ' !== null ? Hash.combine(this.' + prop.name + '.hashCode(), hash) : hash;\n';
    }

    text += '      this.hash = hash;\n';
    text += '    }\n';
    text += '    return this.hash;\n';
    text += '  }\n';
    return text;
  }

  protected addImports(classList: NodeClass[]) {
    this.text += 'import { Hash } from \'@mattacosta/php-common\';\n';
    this.text += '\n';
    this.text += 'import {\n';
    for (let i = 0; i < classList.length; i++) {
      if (!classList[i].abstract) {
        this.text += '  ' + classList[i].name + 'SyntaxNode,\n';
      }
    }
    this.text += '} from \'../syntax/SyntaxNode.Generated\';\n';
    this.text += 'import { INode } from \'./INode\';\n';
    this.text += 'import { Node } from \'./Node\';\n';
    this.text += 'import { NodeFlags } from \'./NodeFlags\';\n';
    this.text += 'import { NodeList } from \'./NodeList\';\n';
    this.text += 'import { NodeTransform } from \'./NodeTransform.Generated\';\n';
    this.text += 'import { NodeVisitor } from \'./NodeVisitor.Generated\';\n';
    this.text += 'import { SyntaxDiagnostic } from \'../../diagnostics/SyntaxDiagnostic\';\n';
    this.text += 'import { SyntaxNode } from \'../syntax/SyntaxNode\';\n';
    this.text += 'import { TokenNode } from \'./TokenNode\';\n';
    this.text += '\n';
  }

  protected addProperties(properties: NodeProperty[], isAbstractClass = false): string {
    let text = '';

    // text += '  protected _flags = NodeFlags.IsNotMissing;\n';
    // text += '\n';
    // text += '  protected _fullWidth = 0;\n';
    // text += '\n';
    // text += '  protected hash = 0;\n';
    // text += '\n';

    for (let i = 0; i < properties.length; i++) {
      this.assertProperty(properties[i]);

      let prop = properties[i];
      let abstract = isAbstractClass ? ' abstract' : '';
      let optional = prop.optional ? ' | null' : '';
      let type = this.getNodeTypes(prop);
      text += '  public' + abstract + ' readonly ' + prop.name + ': ' + type + optional + ';\n';
    }

    return text;
  }

  // protected addSetFlags(): string {
  //   let text = '';
  //   text += '  protected setFlags(value: NodeFlags) {\n';
  //   text += '    this._flags = value;\n';
  //   text += '  }\n';
  //   return text;
  // }

  // protected addSetFullWidth(): string {
  //   let text = '';
  //   text += '  protected setFullWidth(value: number) {\n';
  //   text += '    this._fullWidth = value;\n';
  //   text += '  }\n';
  //   return text;
  // }

  protected addUpdateFlagsAndWidth(): string {
    let text = '';
    text += '  protected updateFlagsAndWidth(flags: NodeFlags, fullWidth: number) {\n';
    text += '    this._flags = this._flags | (flags & NodeFlags.InheritMask);\n';
    text += '    this._fullWidth = this._fullWidth + fullWidth;\n';
    text += '  }\n';
    return text;
  }

  protected addWithDiagnostics(properties: NodeProperty[], name: string): string {
    let text = '';
    text += '  public withDiagnostics(diagnostics: SyntaxDiagnostic[]): ' + name + 'Node {\n';

    let parameterList = '';
    for (let i = 0; i < properties.length; i++) {
      let prop = properties[i];
      parameterList += 'this.' + prop.name;
      parameterList += ', ';
    }
    parameterList += 'diagnostics';

    text += '    return new ' + name + 'Node(' + parameterList + ');\n';
    text += '  }\n';
    return text;
  }

  protected getNodeTypes(property: NodeProperty, className = ''): string {
    if (Array.isArray(property.type)) {
      let text = this.toNodeType(property.type[0]);
      if (text == 'TokenNode') {
        console.warn(className + ': type lists cannot contain token nodes');
      }
      for (let i = 1; i < property.type.length; i++) {
        let type = this.toNodeType(property.type[i]);
        if (type == 'TokenNode') {
          console.warn(className + ': type lists cannot contain token nodes');
        }
        text += ' | ' + type;
      }
      return text;
    }
    return this.toNodeType(property.type);
  }

  protected toNodeType(type: string): string {
    if (type == 'Node' || type == 'NodeList' || type == 'TokenNode') {
      return type;
    }
    return type + 'Node';
  }

  private assertClass(info: NodeClass) {
    let knownProperties = new Set(['name', 'abstract', 'extends', 'properties', 'visitorName', 'visitorType']);
    for (let key of Object.keys(info)) {
      if (!knownProperties.has(key)) {
        throw new Error(`Unknown property: ${key}`);
      }
    }
  }

  private assertProperty(info: NodeProperty) {
    let knownProperties = new Set(['name', 'type', 'inherited', 'optional']);
    for (let key of Object.keys(info)) {
      if (!knownProperties.has(key)) {
        throw new Error(`Unknown property: ${key}`);
      }
    }
  }

}
