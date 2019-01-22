/**Import filesystem access */
const fs = require('fs');

//The folder that the data lives in
const folder = './clean/';

//Read the list of the cleaned files into memory
const files = fs.readdirSync(folder);

//For each of the files, split it into two parts
files.forEach(file =>{
    //Read the contents of this file
    let contents = fs.readFileSync(folder + "/" + file, 'utf-8');

    //Split the contents by line
    let lines = contents.split('\n');

    //Stores the words in a separate list
    let human = [];
    let robot = [];
    //For each of the lines, split by equals sign, and save each to its own list
    lines.forEach(line => {
        //First check if this line is empty
        if(line.trim().length == 0) return;

        //Split the line into two parts
        let parts = line.split("=");
        human.push(parts[0]);
        robot.push(parts[1]);
    });

    //Finally, save each of the lists back to their own spot
    fs.writeFileSync('./human/' + file, human.join(' '), 'utf-8');
    fs.writeFileSync('./robot/' + file, robot.join(' '), 'utf-8');
});