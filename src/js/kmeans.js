// -*- mode: javascript; coding: utf-8-unix -*-

//----------------------------------------
// Global variables
//----------------------------------------
var canvas;
var context;

var centroids;
var colors;
var points;
var numClusters;
var numPoints;


//----------------------------------------
// Utilities
//----------------------------------------
function Point(x, y, clusterId) {
  this.x = x;
  this.y = y;
  this.clusterId = clusterId;
}


function styleRGB(r, g, b) {
  return "RGB(" + [r, g, b].join(",") + ")";
}


function hsv2rgb(h, s, v) {
  var r, g, b;

  if (s === 0) {
    var val = Math.round(v);
    return styleRGB(val, val, val);
  }

  if (h < 0) {
    h += 360;
  }
  h = h % 360;
  s = s / 255;

  var hi = Math.floor(h / 60) % 6;
  var f = (h / 60) - hi;
  var p = Math.round(v * (1 - s));
  var q = Math.round(v * (1 - f * s));
  var t = Math.round(v * (1 - (1 - f) * s));

  switch (hi) {
  case 0:
    r = v;
    g = t;
    b = p;
    break;
  case 1:
    r = q;
    g = v;
    b = p;
    break;
  case 2:
    r = p;
    g = v;
    b = t;
    break;
  case 3:
    r = p;
    g = q;
    b = v;
    break;
  case 4:
    r = t;
    g = p;
    b = v;
    break;
  case 5:
    r = v;
    g = p;
    b = q;
    break;
  default:
    break;
  }

  return styleRGB(r, g, b);
}


function getSquareDistance(p1, p2) {
  var dx = p2.x - p1.x;
  var dy = p2.y - p1.y;
  return dx * dx + dy * dy;
}


//----------------------------------------
// Drawing functions
//----------------------------------------
function initCanvas() {
  var width = canvas.width;
  var height = canvas.height;
  context.fillStyle = "#000000";
  context.fillRect(0, 0, width, height);
}


function drawCentroids(context, centroids, colors) {
  context.beginPath();
  context.lineWidth = 5;
  context.strokeStyle = "#cccccc";

  var size = 8;
  var i, p;
  for (i = 0; i < centroids.length; i++) {
    p = centroids[i];
    context.moveTo(p.x - size, p.y - size);
    context.lineTo(p.x + size, p.y + size);
    context.moveTo(p.x + size, p.y - size);
    context.lineTo(p.x - size, p.y + size);
  }
  context.stroke();

  context.lineWidth = 2;
  for (i = 0; i < centroids.length; i++) {
    p = centroids[i];
    context.beginPath();
    context.strokeStyle = colors[i];
    context.moveTo(p.x - size, p.y - size);
    context.lineTo(p.x + size, p.y + size);
    context.moveTo(p.x + size, p.y - size);
    context.lineTo(p.x - size, p.y + size);
    context.stroke();
  }
}


function drawPoints(context, points, colors) {
  for (var i = 0; i < points.length; i++) {
    context.beginPath();
    var p = points[i];
    context.fillStyle = (p.clusterId >= 0) ? colors[p.clusterId] : "#cccccc";
    context.arc(p.x, p.y, 5, 0, Math.PI * 2, true);
    context.closePath();
    context.fill();
  }
}


function drawLines(context, centroids, points) {
  for (var i = 0; i < points.length; i++) {
    context.beginPath();
    var p = points[i];
    var c = centroids[p.clusterId];
    context.lineWidth = 1;
    context.strokeStyle = colors[p.clusterId];
    context.moveTo(p.x, p.y);
    context.lineTo(c.x, c.y);
    context.stroke();
  }
}


//----------------------------------------
// Main clustering algorithms
//----------------------------------------
function clustering() {
  var i, j;
  for (i = 0; i < centroids.length; i++) {
    centroids[i].bestMatches = [];
  }
  for (j = 0; j < points.length; j++) {
    var p = points[j];
    var bestMatch = 0;
    var bestMatchDist = getSquareDistance(p, centroids[bestMatch]);
    for (i = 1; i < centroids.length; i++) {
      var d = getSquareDistance(p, centroids[i]);
      if (d < bestMatchDist) {
	bestMatch = i;
	bestMatchDist = d;
      }
    }
    centroids[bestMatch].bestMatches.push(j);
    points[j].clusterId = bestMatch;
  }
}

function updateCentroids() {
  var newCentroids = [];
  for (var j = 0; j < centroids.length; j++) {
    if (centroids[j].bestMatches.length > 0) {
      var ax = 0;
      var ay = 0;
      var bestMatches = centroids[j].bestMatches;
      for (var i = 0; i < bestMatches.length; i++) {
	var p = points[bestMatches[i]];
	ax += p.x;
	ay += p.y;
      }
      ax /= bestMatches.length;
      ay /= bestMatches.length;
      newCentroids.push(new Point(ax, ay, j));
    }
    else {
      newCentroids.push(centroids[j]);
    }
  }
  
  return newCentroids;
}


function init() {
  canvas = document.getElementById("main-canvas");
  context = canvas.getContext("2d");
  numPoints = parseInt(document.getElementById("numPoints").value, 10) || 100;
  numClusters = parseInt(document.getElementById("numClusters").value, 10) || 5;
  centroids = [];
  colors = [];
  points = [];

  var width = canvas.width;
  var height = canvas.height;
  context.clearRect(0, 0, width, height);
  initCanvas();

  var x, y, i;
  for (i = 0; i < numClusters; i++) {
    x = Math.floor(Math.random() * width);
    y = Math.floor(Math.random() * height);
    centroids.push(new Point(x, y, i));
    colors.push(hsv2rgb(i * 360 / numClusters, 255, 255));
  }

  for (i = 0; i < numPoints; i++) {
    x = Math.floor(Math.random() * width);
    y = Math.floor(Math.random() * height);
    points.push(new Point(x, y, null));
  }
  clustering();

  drawPoints(context, points, colors);
  drawCentroids(context, centroids, colors);
}


function update() {
  var newCentroids = updateCentroids();
  centroids = newCentroids;
  clustering();

  initCanvas();
  drawLines(context, newCentroids, points);
  drawPoints(context, points, colors);
  drawCentroids(context, newCentroids, colors);
}


