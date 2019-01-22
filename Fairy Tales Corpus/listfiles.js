//Import the filesystem requirements
const fs = require('fs');

//What folder are we reading
const folder = 	"./corpus-map/";

//Read the folders in the folder above
const folders = fs.readdirSync(folder);

//List of files, start empty
const fileList = [];

//Go read for files in every folder
folders.forEach(function(f){
	if(fs.existsSync(folder + "/" + f) && fs.lstatSync(folder + "/" + f).isDirectory()){
		let files = fs.readdirSync(folder + "/" + f);
		files.forEach(function(fi){
			fileList.push(fi);
			//folder = ./corpus-map/
			//f = every folder inside of folder
			//fi = every file inside of 'f'
			let fin = normalizeName(fi);
			fs.copyFileSync(folder + "/" + f + "/" + fi, "./uniques/" + fin);
		});
	}
});

function normalizeName(name){
	name = name.toLowerCase();
	name = name.replace(/\d+/g, '');
	name = name.replace(/-/g, ' ');
	name = name.trim();
	return name;
}

//Write to file of all doubled unchecked data
fs.writeFileSync("tree.txt", fileList.join("\n"));

//Now remove all things that are only clusters
for(let i = fileList.length - 1; i >= 0; i--){
	if(fileList[i].match(/c\d\d?\d?/g)){
		fileList.splice(i, 1);
	}
}

//Assign each one to its own ID
let fileCounter = {};
fileList.forEach(function(name){
	if(fileCounter[name] != undefined){
		fileCounter[name]++;
	}else{
		fileCounter[name] = 1;
	}
});

//Write the counter to a separate json file
fs.writeFileSync("filecounts.json", JSON.stringify(fileCounter, null, 4));

//Get a list of all separate files
fs.writeFileSync("uniqueFiles.txt", Object.keys(fileCounter).join("\n"));