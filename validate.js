/**Import filesystem library */
const fs = require('fs');

//The location of the valence list, can be modified later
const valenceListLocation = 'v-scores.txt';

//Amount of chunks
const CHUNKS = 10;
//The precision of the print output (amt of significant numbers)
const PREC = 4;

//The valence list as an object hashmap
const vList = {};

//Read the valence list by lines
console.log("Reading word list from: " + valenceListLocation);
let lines = fs.readFileSync(valenceListLocation, 'utf-8').split('\n');

//For each of the lines, parse it into the list
console.log("Parsing that list...");
lines.forEach(line =>{
    //Ignore empty lines
    if(line.trim().length < 1) return;
    //Split the line by tabs
    let parts = line.split('\t');
    //Remove the spaces in double words
    parts[0] = parts[0].replace(/\s/g, '_');
    //Save the first part (word) as key, and second part (valence) as value
    vList[parts[0]] = parseFloat(parts[1]);
});

//The location that we load the stories from
const storyFolder = './robot/';
console.log("Loading stories from: " + storyFolder);
//Read a list of stories
const storyNames = fs.readdirSync(storyFolder);
//Load each story into memory
const stories = [];
storyNames.forEach(storyName => {
    //Create a new story object and store the name
    let story = {name: storyName};
    //Store the contents of the story
    story.contents = fs.readFileSync(storyFolder + "/" + storyName, 'utf-8');
    story.contents = story.contents.replace(/  /g, ' ');//Remove any double spaces
    //Store the words array of the story
    story.words = story.contents.split(' ');//Split on spacces
    story.wordCount = story.words.length;
    story.chunks = [];
    story.valence = 0;
    //Now store this story in the stories array
    stories.push(story);
});

//After loading analyze every story
happyLines = ["name, first>last, (pen)ultimate, avgDelta"];
stories.forEach(story =>{
    analyzeStory(story);
    happyLines.push(getHappyLine(story));
});

//Calculate the SD for every story
let standardDeviation = calculateSD();
let sdLines = printSD(standardDeviation);

//Now output some csv files with data
console.log("Generating reports...");
let normLines = [];
let weightLines = [];
let rawLines = [];
let avgLines = [];
let jaspLines = [];
stories.forEach(story => {
    //Add the newlines to the jaspLines
    let newLines = getLines(story);
    newLines.forEach(line => {
        jaspLines.push(line);
    });

    normLines.push(story.name + "\t" + story.printNormalized.replace(/\./g, ","));
    weightLines.push(story.name + "\t" + story.printWeighted.replace(/\./g, ","));
    rawLines.push(story.name + "\t" + story.printValence.replace(/\./g, ","));
    avgLines.push(story.name + "\t" + (story.averageMovement.toPrecision(4)).replace(/\./g, ","));
});
//Finally save these report files
console.log("Saving './results/normalizedValence.tsv...");
fs.writeFileSync("./results/normalizedValence.tsv", normLines.join("\n"), "utf-8");
console.log("Saving './results/weightedValence.tsv...");
fs.writeFileSync("./results/weightedValence.tsv", weightLines.join("\n"), "utf-8");
console.log("Saving './results/rawValence.tsv...");
fs.writeFileSync("./results/rawValence.tsv", rawLines.join("\n"), "utf-8");
console.log("Saving './results/avgDeltaValence.tsv...");
fs.writeFileSync("./results/avgDeltaValence.tsv", avgLines.join("\n"), "utf-8");
console.log("Saving './results/standardDeviation.tsv...");
fs.writeFileSync("./results/standardDeviation.tsv", sdLines.join("\n"), "utf-8");
console.log("Saving './results/happyEndings.tsv...");
fs.writeFileSync("./results/happyEndings.tsv", happyLines.join("\n"), "utf-8");
console.log("Saving './results/jaspOutput.csv...");
fs.writeFileSync("./results/jaspOutput.csv", jaspLines.join("\n"), "utf-8");
console.log("Done!");


/**
 * Get the lines that provide the data points for this story
 * @param {Story} story 
 */
function getLines(story){
    let lines = [];
    for(let i = 0; i < story.chunks.length; i++){
        let line = [story.name];
        line.push((i + 1) + "");
        line.push(story.chunks[i].normalizedValence.toPrecision(4).replace(/\./g, ','));
        lines.push(line.join("\t"));
    }
    return lines;
}

/**
 * Returns a happy print line
 * @param {Story} story 
 */
function getHappyLine(story){
    let line = story.name + "\t";
    line += isHappyEnding(story) + "\t";
    line += isHappyEnding2(story) + "\t";
    line += isHappyEnding3(story) + "\t";
    return line;
}

/**
 * Calculate Standard Deviation for every category
 */
function calculateSD(){
    //Holds the results
    let sd = [];
    //For each chunk, analyze all stories
    for(let i = 0; i < CHUNKS; i++){
        //First calculate mean of this chunk
        let entry = {mean: 0, diffSQ: 0, sd: 0};
        stories.forEach(story =>{
            //Add the normalizedValence to a running total
            entry.mean += story.chunks[i].normalizedValence;
        });
        //Divide by number of stories
        entry.mean /= stories.length;
        
        //Now find SD for each category
        stories.forEach(story =>{
            //Find the difference squared, and average it
            entry.diffSQ += Math.pow(story.chunks[i].normalizedValence - entry.mean, 2);
        });
        //Divide by number of stories to get mean of difference squared
        entry.diffSQ /= stories.length;
        entry.sd = Math.sqrt(entry.diffSQ);

        //Add the entry to the SD list
        sd[i] = entry;
    }

    //Return the results
    return sd;
}

/**
 * Prints the object which has the mean and SD for every category
 * @param {Array} sdObj 
 */
function printSD(sdObj){
    //The lines we'll return
    let lines = [];
    //For each category, print a line
    sdObj.forEach(category =>{
        lines.push(category.mean.toPrecision(4) + "\t" + category.sd.toPrecision(4));
    });
    //Return the lines
    return lines;
}

/**
 * Analyzes the provided story object and stores the results back
 * into that same object
 * @param {StoryObject} story 
 */
function analyzeStory(story){
    //Calculate the chunk size
    let chunkSize = Math.round(story.wordCount / CHUNKS);
    //Which chunk are we working in
    let chunk = {valence: 0, wordCount : 0};
    //Go through every word
    for(let i = 0; i < story.wordCount; i++){
        //The word we're working with, and the next word
        let w = story.words[i];
        //If we're at the start of a new chunk, push old chunk, create new chunk
        if(i % chunkSize == 0 && i > 0){
            story.chunks.push(chunk);
            chunk = {valence: 0, wordCount: 0};
        }
        
        //Check for 2 word combinations first
        if(i < story.wordCount - 1){
            //Check if this word is actually existing in the list
            let val = countWords(w, story.words[i + 1]);
            if(val != -1){
                chunk.wordCount += 2;
                chunk.valence += val;
                //Skip the next word and continue the loop
                i++; continue;
            }
        } 
        //Check for this current word
        let v = countWord(w);
        if(v != -1){
            chunk.valence += v;
        }
        //Increase wordCount for this chunk
        chunk.wordCount ++;
    }
    //Add the last chunk if it has not beed added yet
    if(story.chunks.length < 10) {
        story.chunks.push(chunk);
    }

    //Go through all the chunks and normalize/weight them, also, create print version for this story
    let printValence = [];//Raw valence
    let printWeighted = [];//Weighted for wordcount values
    let printNormalized = [];//Normalized to the range of this story
    let min = 1000, max = -1;
    story.chunks.forEach(chunk =>{
        //Increase the maximum if this chunk has a higher valence
        if(chunk.valence > max) max = chunk.valence;
        //Decrease the minimum if this chunk has a lower valence
        if(chunk.valence < min) min = chunk.valence;
        //Now claculated weighted for word valence to correct for longer chunks
        chunk.weightedValence = chunk.valence / chunk.wordCount;

        //Add these values to the list of values
        printValence.push(chunk.valence.toPrecision(PREC));
        printWeighted.push(chunk.weightedValence.toPrecision(PREC));
    });
    
    //Now we have the min and max for this story, let's calculate normalized values
    let range = max - min;
    story.chunks.forEach(chunk =>{
        //First remove the floor
        chunk.normalizedValence = chunk.valence - min;
        //Then divide by the range
        chunk.normalizedValence /= range;
        //Finally add that value to the array for print
        printNormalized.push(chunk.normalizedValence.toPrecision(PREC));
    });
    
    //Calculate the movement between all chunks, and average to get average movement (duh)
    story.averageMovement = 0;
    for(let i = 1; i < story.chunks.length; i++){
        let deltaV = story.chunks[i].normalizedValence - story.chunks[i - 1].normalizedValence;
        story.averageMovement += deltaV;
    }
    story.averageMovement /= story.chunks.length;
    
    //Join to create a print string of valences
    story.printValence = printValence.join("\t");
    //Join to create a print string of weighted valences
    story.printWeighted = printWeighted.join("\t");
    //Join to create a print string of normalized valences
    story.printNormalized = printNormalized.join("\t");
}

/**
 * Tries to see if the provided String parameter has any kind of
 * value attached to it in the vList, if not it returns -1, otherwise
 * it returns the value
 * @param {String} word 
 */
function countWord(word){
    if(vList[word] != undefined) return vList[word];
    else return -1;
}

/**
 * Tries to see if the provided two word combination is found in the text
 * @param {String} wordA 
 * @param {String} wordB 
 */
function countWords(wordA, wordB){
    return countWord(wordA + "_" + wordB);
}

/**
 * Checks if the provided story has a happy ending
 * @param {Story} story 
 */
function isHappyEnding(story){
    //Get the last chunk
    let finalChunk = story.chunks[story.chunks.length - 1];
    let firstChunk = story.chunks[0];
    return (finalChunk.normalizedValence > firstChunk.normalizedValence);
}

/**
 * Checks if the provided story has a happy ending
 * @param {Story} story 
 */
function isHappyEnding2(story){
    //Get the last chunk
    let finalChunk = story.chunks[story.chunks.length - 1];
    let penultiChunk = story.chunks[story.chunks.length - 2];
    //And see if it is has a normalized value of 1
    if(finalChunk.normalizedValence == 1) return true;
    else if(penultiChunk.normalizedValence == 1) return true;
    else return false;
}

/**
 * Checks a happy ending
 * @param {Story} story 
 */
function isHappyEnding3(story){
    return story.averageMovement > 0;
}