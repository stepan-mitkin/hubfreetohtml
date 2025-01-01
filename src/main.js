const fs = require('fs').promises;
const path = require('path');
const freetohtml = require("./freetohtml/freetohtml")

// Display usage summary
function displayUsage() {
    console.log(`Usage:
    hubfreetohtml <file>                   The path to the .free file
    hubfreetohtml --output <output file>   The output filename
    hubfreetohtml                          Display this usage summary`);
}

function parseCommandLine() {
    const args = process.argv.slice(2);

    if (args.length === 0) {        
        return false;
    }

    let options = {}

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--output':
                options.output = args[++i];
                break;
            default:
                if (!options.inputFile) {
                    options.inputFile = args[i];
                }
        }
    }
    
    if (!options.inputFile) {
        return false;
    }

    options.inputFile = path.resolve(options.inputFile)

    if (!options.output) {
        var parsed = path.parse(options.inputFile)
        options.output = path.join(parsed.dir, parsed.name + ".html")
    }
    options.name = path.parse(options.inputFile).name

    return options
}

function onError(err) {
    console.error(`${err.message}`);
    console.error(`Filename: ${err.filename}`);
    if (err.nodeId) {
        console.error(`Node id: ${err.nodeId}`);
    }
    if (err.stack) {
        console.log(err.stack)
    }
    success = false
}

function readFile(filename) {
    return fs.readFile(filename, 'utf-8')
}

function writeFile(filename, content) {
    return fs.writeFile(filename, content, 'utf-8');
}

// Main logic
async function main() {
    var options = parseCommandLine()
    if (!options) {
        displayUsage();
        return;       
    }    
    
    options.readFile = readFile
    options.writeFile = writeFile

    var builder = freetohtml.FreeHtmlBuilder(options)    
    await builder.build()
}

main()