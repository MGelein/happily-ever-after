/**Holds all the story instances that have been parsed*/
ArrayList<Story> stories = new ArrayList<Story>();
//The index at which we show the first story
int storyIndex = 0;
//List of colors for the 12 screens
color[] colors = new color[12];
//If we're pressing the left arrow key
boolean lDown = false;
//If we're pressing the right arrow key
boolean rDown = false;
//If we're viewing the mean (first view, of the average results)
boolean MEANVIEW = true;
//The object that will draw the mean
MeanView mean;

//Calculated screenW
float sw;
//Calculated screenH
float sh;

/**
 Initial program setup
 **/
void setup() {
  //Set the screen to fit 12 screens of 320x240 each, 4 wide
  fullScreen();
  sw = width / 4;
  sh = height / 3;
  //Load and parse the CSV file
  stories = parseLines(loadStrings("normalizedValence.csv"));
  //And the other one as well
  HashMap<String, Float> avgValues = parseAvg(loadStrings("avgDeltaValence.csv"));
  //Add these averages to each story
  for (Story s : stories) {
    //Retrieve avg delta valence value by name
    s.avgDelta = avgValues.get(s.name);
  }
  //Load the meanView data
  mean = new MeanView("standardDeviation.csv", stories);

  //Fill the array with 12 colors
  colors[0] = color(255, 0, 0);
  colors[1] = color(255, 125, 0);
  colors[2] = color(255, 0, 125);
  colors[3] = color(255, 125, 125);
  colors[4] = color(0, 255, 0);
  colors[5] = color(125, 255, 0);
  colors[6] = color(0, 255, 125);
  colors[7] = color(125, 255, 125);
  colors[8] = color(0, 0, 255);
  colors[9] = color(125, 0, 255);
  colors[10] = color(0, 125, 255);
  colors[11] = color(125, 125, 255);
}

/**
 Returns a hashmap that can return the avg delta valence for each story
 by using the name as key
 **/
HashMap<String, Float> parseAvg(String[] lines) {
  //Create the map
  HashMap<String, Float> map = new HashMap<String, Float>();
  //Go through all the lines
  for (String line : lines) {
    //Split on the comma
    String[] parts = line.split(",");
    //Trim the parts
    parts[0] = parts[0].trim();
    parts[1] = parts[1].trim();
    map.put(parts[0], parseFloat(parts[1]));
  }
  //Return the finished map
  return map;
}

/**
 Handles our draw loop
 **/
void draw() {
  //White background
  background(255);
  
  if (!MEANVIEW) {
    //Draw 12, or less stories
    for (int i = storyIndex; i < stories.size() && i < storyIndex + 12; i++) {
      Story story = stories.get(i);
      story.render(i);
    }
  } else {
    mean.render();
  }
}

/**
 Called when a key is pressed
 **/
void keyPressed() {
  if (keyCode == LEFT && !lDown) {
    lDown = true;
    storyIndex -= 12;//Move 12 back
    if (storyIndex < 0) storyIndex = 0;
  } else if (keyCode == RIGHT && !rDown) {
    rDown = true;
    if (storyIndex < stories.size() - 12) storyIndex += 12;//Move 12 forward
  }else if(key == ' '){
    MEANVIEW = false;
  }
}

/**
 Called when the key is released
 **/
void keyReleased() {
  if (keyCode == LEFT) lDown = false;
  if (keyCode == RIGHT) rDown = false;
} 

/**
 Parses the CSV file into an arraylist of items
 **/
ArrayList<Story> parseLines(String[] lines) {
  ArrayList<Story> list = new ArrayList<Story>();
  for (String line : lines) {
    list.add(new Story(line));
  }
  return list;
}

class Story {
  //The name of this story
  String name; 
  String sName;//Shortened name
  float[] pts;
  float avgDelta;

  /**
   Parses a new story from the provided string definition line in the
   CSV file that we loaded
   **/
  Story(String def) {
    //Split on a comma
    String[] parts = def.split(",");
    name = parts[0];//First part is the name
    sName = (name.length() > 30) ? name.substring(0, 27) + "..." : name;
    pts = otherParts(parts);
  }

  /**
   Render yourself at the provided index on screen
   **/
  void render(int i) {
    int index = i % 12;
    int x = index % 4;
    int y = (index - x) / 4;
    //Remember this position
    pushMatrix();
    //Translate to right position
    translate(x * sw, y * sh);
    //First draw outline
    drawOutline();
    //Next draw title bar
    drawTitle(i);
    //Draws the points to make a line graph
    drawPoints(index);


    //Pop back to remembered position
    popMatrix();
  }

  /**
   Draws the line diagram
   **/
  void drawPoints(int index) {
    //Prepare drawing using stroke and fill
    stroke(colors[index]);//Draw with the color for this square
    strokeWeight(1);
    noFill();
    float xOff = 20;
    float xInterval = (sw - xOff) / pts.length;
    float yOff = 40;
    float yRange = (sh - 2 * yOff);
    float xRange = (pts.length - 1) * xInterval;
    //First draw the average line,
    //The point we start add
    float startValue = 1 - pts[0];
    float endValue = startValue - avgDelta;
    //Draw the average line
    line(xOff, startValue * yRange + yOff, xOff + xRange, endValue * yRange + yOff);

    //Now draw the points line
    strokeWeight(2);
    for (int i = 0; i < pts.length - 1; i++) {
      float x1 = i * xInterval + xOff;
      float y1 = (1 - pts[i]) * yRange + yOff;
      float x2 = (i + 1) * xInterval + xOff;
      float y2 = (1- pts[i + 1]) * yRange + yOff;
      line(x1, y1, x2, y2);
    }
    //Set a dot to the highest point
    strokeWeight(10);
    for (int i = 0; i < pts.length; i++) {
      if (pts[i] == 0 || pts[i] == 1) {
        float x = i * xInterval + xOff;
        float y = (1 - pts[i]) * yRange + yOff;
        point(x, y);
      }
    }

    //Set the strokeWeight back to 1
    strokeWeight(1);
  }

  /**
   Draws the outline of a single box
   **/
  void drawOutline() {
    float xOff = 20;
    float yOff = 40;
    stroke(120);//Lighter grey
    line(0, 0, sw, 0);
    line(0, 0, 0, sh);
    line(xOff, yOff, xOff, sh - yOff);
    line(xOff, sh - yOff, sw - xOff, sh - yOff);
    drawLabels();
    stroke(80);//Darker grey
    line(0, sh - 1, sw - 1, sh - 1);
    line(sw - 1, sh - 1, sw - 1, 0);
  }

  /**
   Draws the labels on the graph
   **/
  void drawLabels() {
    //Rotate a quarter circle
    rotate(-PI / 2);
    //Now draw y-axis label
    text("happiness ->", -sh + 50, 15);
    //Rotate back
    rotate(PI / 2);
    //Draw the x-axis label
    text("time ->", 30, sh - 40 + 20);
  }

  /**
   Draws the title bar in the top
   **/
  void drawTitle(int i) {
    fill(0);
    textSize(16);
    float tw = textWidth(sName);
    float offx = (sw - tw) * .5;
    text(sName, offx, 20);
    text(i + ")", 8, 20);
    noFill();
    stroke(150);
    line(0, 30, sw, 30);
  }
}

/**
 Returns the array without its first part
 **/
float[] otherParts(String[] parts) {
  //Create a new array, one shorter
  float[] newArr = new float[parts.length - 1];
  //Skip the first part, and copy all others over
  for (int i = 1; i < parts.length; i++) {
    newArr[i - 1] = parseFloat(parts[i]);
  }
  return newArr;
}
