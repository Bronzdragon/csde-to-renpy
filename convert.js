//jshint esversion: 6
const fs = require('fs');

let endResult = "";
let flags = new Map();

function camelize(str) {
  // Does not handle special characters well.
  // Code 'borrowed' from https://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
    return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
  }).replace(/[^a-zA-Z0-9]+/g, '');
}

function printTextNode({actor = '', id = '0000', text = '', outbound = []} = {}) {

  const character = characters.find(character => character.name === actor);
  if (!character) {
    console.error(`Character with the name '${actor}' was not found.`);
  }

  let result = '';
  result += `label a${id}:\n`;
  result += `    ${camelize(character.name)} "${text}"\n`;

  if (outbound.length === 1 && outbound[0].id) {
    result += `    jump a${outbound[0].id}`;
  } else {
    result += '    return';
  }

  return result;
}

function printChoiceNode({id = '0000', outbound = []} = {}) {
  let result = '';
  result +=`label a${id}:\n`;
  result += 'menu:\n';

  for (const choice of outbound) {
    result += `    "${choice.text}":\n`;
    result += `        jump a${choice.id}\n`;
  }

  return result;
}

function printSetNode({id = '0000', key = '', value = '', outbound = []} = {}) {
  let result = '';
  result +=`label a${id}:\n`;
  result += `    $ ${camelize(key)} = "${value}"\n`;

  if (outbound.length === 1 && outbound[0].id) {
    result += `    jump a${outbound[0].id}`;
  } else {
    result += '    return';
  }

  return result;
}

function printBranchNode({id = '0000', key = '', outbound = []} = {}) {
  let result = '';
  result +=`label a${id}:\n`;

  flags.set(camelize(key), outbound[0].text);

  for (const branch of outbound) {
    result += `if ${camelize(key)} == "${branch.text}":\n`;
    result += `    jump a${branch.id}\n`;
  }

  return result;
}


if(process.argv.length <= 2){
  console.info("Usage: node convert.js input_file [output_file]");
  return;
}

const [ , , inputFilePath, outputFilePath] = process.argv;



let json;
try {
  const fileContents = fs.readFileSync(inputFilePath, 'utf8');
  json = JSON.parse(fileContents);
} catch (e) {
  console.error("Could not read file.\n", e.message);
  return;
}

const {characters, nodes} = json;

endResult +=`# Generated using CSDE-TO-RENPY v0.1

`;

for (const character of characters) {
  // console.log(character);
  character.id = camelize(character.name);
  endResult += `define ${character.id} = Character("${character.name}")\n`;
  // outputResult(`define ${character.id} = Character("${character.name}")`);
}
endResult += '\n';

for (const [key, value] of flags) {
  endResult += `default ${key} = "${value}"`;
}

endResult += `label start:
    jump a0000
`;

for (const node of nodes) {
  if (node.type === "dialogue.Text") {
    endResult += printTextNode(node) + '\n\n';
  } else if (node.type === "dialogue.Choice") {
    endResult += printChoiceNode(node) + '\n\n';
  } else if (node.type === "dialogue.Set") {
    endResult += printSetNode(node) + '\n\n';
  } else if (node.type === "dialogue.Branch") {
    endResult += printBranchNode(node) + '\n\n';
  }
}

// If we don't have an place to output it, dump it to the console.
if (!outputFilePath) {
  console.info(endResult);
  return;
} else {
  // Create the file.
  fs.writeFileSync(outputFilePath, endResult);
}
