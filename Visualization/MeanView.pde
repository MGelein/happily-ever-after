/**
 Will Render the Mean results
 */
class MeanView {

  float[] means;
  float[] sds;
  ArrayList<Story> allStories;

  MeanView(String url, ArrayList<Story> stories) {
    allStories = stories;
    //Loads the CSV data
    String[] lines = loadStrings(url);
    //Instantiate same size arrays
    means = new float[lines.length];
    sds = new float[lines.length];

    //Parse every line
    int counter = 0;
    for (String l : lines) {
      String[] parts = l.split(",");
      parts[0] = parts[0].trim();
      parts[1] = parts[1].trim();
      means[counter] = parseFloat(parts[0]);
      sds[counter] = parseFloat(parts[1]);
      counter ++;
    }
  }

  /**
   Renders these results
   **/
  void render() {
    //First draw outline
    drawOutline();
    //Dark gray stroke
    stroke(80);
    //Thick line
    strokeWeight(4);

    //Buffer variables (for space buffer that is)
    float xOff = 200;
    float xInterval = (width - xOff) / means.length;
    float yOff = 100;
    float yRange = (height - 2 * yOff);

    for (int i = 0; i < means.length - 1; i++) {
      float x1 = i * xInterval + xOff;
      float y1 = (1 - means[i]) * yRange + yOff;
      float x2 = (i + 1) * xInterval + xOff;
      float y2 = (1- means[i + 1]) * yRange + yOff;
      line(x1, y1, x2, y2);
    }

    fill(0);
    textSize(16);
    //Put a dot everywhere, and SD marker
    for (int i = 0; i < means.length; i++) {
      float x = i * xInterval + xOff;
      float y = (1 - means[i]) * yRange + yOff;
      strokeWeight(20);
      point(x, y);
      fill(255);
      text(means[i] + "", x + 10, y - 10);
      fill(0);
      text(means[i] + "", x + 10, y - 9);
      //Now draw SD marker
      float yHigh = (1 - means[i] - sds[i]) * yRange + yOff;
      float yLow = (1 - means[i] + sds[i]) * yRange + yOff;
      point(x, y);
      fill(255);
      text("sd: " + sds[i] + "", x + 10, yHigh);
      fill(0);
      text("sd: " + sds[i] + "", x + 10, yHigh);
      strokeWeight(1);
      line(x, y, x, yHigh);
      line(x, y, x, yLow);
      strokeWeight(2);
      line(x - 5, yHigh, x + 5, yHigh);
      line(x - 5, yLow, x + 5, yLow);
    }

    //For every story, draw a point on the line
    strokeWeight(3);
    stroke(255, 0, 0);
    for (int i = 0; i < means.length; i++) {
      for (Story s : allStories) {
        float x = i * xInterval + xOff;
        float y = (1 - s.pts[i]) * yRange + yOff;
        point(x, y);
      }
    }
  }

  /**
   Draws the outline of the graph
   **/
  void drawOutline() {
    stroke(120);
    strokeWeight(2);
    float xOff = 200;
    float yOff = 100;
    line(xOff - 10, yOff, xOff - 10, height - yOff);
    line(xOff - 10, height - yOff, width - xOff + 50, height - yOff);
  }
}
