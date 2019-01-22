/**Import  */
const fs = require('fs');

//From what folder are we reading the files?
const folder = './uniques';

//Array of files in the folder
const files = fs.readdirSync(folder);

//For each of the files in the files list
files.forEach(file =>{
    //Read the contents of the file
    let contents = fs.readFileSync(folder + '/' + file, 'utf-8');
    
    // 1. Clean the XML garbage (remove any lines containing xml): <.+>.+
    contents = contents.replace(/<.+>.+/g, '');
    // 2. Clean the NLP tags: /.?[A-Z][A-Z]?
    contents = contents.replace(/\/.?[A-Z][A-Z]?/g, '');
    // 3. Get rid of the punctuation: /..?
    contents = contents.replace(/\/..?/g, '');
    // 4. Replace arrows with equals for readability: \s?-->\s?
    contents = contents.replace(/\s?-->\s?/g, '=');
    // 5. Replace any leftovers you forgot, you dummy
    contents = contents.replace(/\$/g, '');

    //Write the file back into a clean folder
    fs.writeFileSync('./clean/' + file, contents, 'utf-8');
});