/*
    My solution to Climbing Route Challenge from checkio.org    
    https://js.checkio.org/en/mission/old-climbing-route/
*/


/*
Description from Checkio:

You have an elevation map and you want to know the shortest climbing route.

The map is given as a list of strings.

0 : plain ( elevation is 0)
1-9 : hill (number is elevation)
"mountain" is adjacent (only 4 directions) hill group.

It consists of two or more hills.
Isolated hill is not mountain.
Start is top-left. Goal is bottom-right. You have to go over all the mountaintops. 
You can only move vertical and horizontal. 
And you can only move to the same or one elevation difference.
You should look for the shortest route and return Number of steps. 
(if mountains do not exist, You may go to the goal at the shortest from the start.)

*/


/*

Conditions given by Checkio:
 
Input: A elevation map as a list of strings.

Output: number of steps as Integer.

Precondition:
elevation_map[0][0] == elevation_map[-1][-1] == '0'
3 ≤ len(elevation_map)
all(3 ≤ len(row) and len(row) == len(elevation_map[0]) for row in elevation__map)
Each mountain has only one mountaintop.
There is no mountain that can not climb.
 
*/

/*

Find the minimum distance between top left corner all accessible peaks ending in the bottom row.
Input is an array of string with numbers giving the elevation of the tile in the grid.
Elevation difference > 1 is not walkable. 

*/
"use strict";

function climbingRoute(elevation_map) {

    var neighbours = [[-1, 0], [0, 1], [1, 0], [0, -1]];
    var I = 99999;
    var numTiles = elevation_map.length * elevation_map[0].length;
    var numTiles_TMP;
    var pointStack = [];
    elevation_map = elevation_map.map((x) => (x.split("").map(Number)));

    var mountainTops = new Map();
    mountainTops.set("0,0", [0, 0]);
    mountainTops = peakFinder(mountainTops, elevation_map);
    mountainTops.set((elevation_map.length - 1) + "," + (elevation_map[0].length - 1), [elevation_map.length - 1, elevation_map[0].length - 1]);

    var distances = [];
    var topPoints = [];

    mountainTops.forEach(x => topPoints.push(x));
    distances = getDistances(topPoints);

    /*
        Creates a array/queue
        with all the tile coordinates in the elevation map.
        Removes the tile from the queue if it's distances to all peaks
        are found. Adds the tile back to the ending of the queue if
        all distances not yet are found.
     */

    function getDistances(fromPoints) {
        var distance_maps = [];
        var loopProtect = 999999;
        var fromPoint;

        for (let i in fromPoints) {
            fromPoint = fromPoints[i];
            var distance_map = elevation_map.slice();
            distance_map = distance_map.map((x, ix) => x.map((y) => I));
            distance_map[fromPoint[0]][fromPoint[1]] = 0;
            distance_maps.push(distance_map);
        }


        for (let r = 0; r < distance_map.length; r++) {
            for (let c = 0; c < distance_map[0].length; c++) {
                pointStack.push([r, c]); // Makes a stack of all tile points.
            }
        }


        while (pointStack.length > 0 && loopProtect >= 0) {
            loopProtect--;
            let tmp_point = pointStack.shift();
            let allFound = estimateDistances(elevation_map, distance_maps, tmp_point[0], tmp_point[1], neighbours);

            if (!allFound) pointStack.push(tmp_point);
        }

        let outputDistances = [];
        for (let d in distance_maps) {
            let oTMP = [];
            mountainTops.forEach(x => oTMP.push(distance_maps[d][x[0]][x[1]]));
            outputDistances.push(oTMP);
        }
        return outputDistances;
    }



    /*  
        Fills all the tiles in the distance array 
        for each mountain top with the shortest distances 
        away from the top.
    */

    function estimateDistances(arr, distArrays, row, col, neighbours) {

        let currentTile = arr[row][col];
        let currentDist;
        let neighbourRow, neighbourCol;
        let countFoundI = 0;

        for (let d in distArrays) {
            let distArr = distArrays[d];
            currentDist = distArr[row][col];
            for (let i in neighbours) {
                neighbourRow = row + neighbours[i][0];
                neighbourCol = col + neighbours[i][1];
                if (neighbourRow < 0 || neighbourRow >= arr.length || neighbourCol < 0 || neighbourCol >= arr[0].length) continue;

                if (distArr[row][col] === I) return false;

                if (Math.abs(currentTile - arr[neighbourRow][neighbourCol]) <= 1) { // is climbable

                    if (distArr[neighbourRow][neighbourCol] > currentDist) {
                        distArr[neighbourRow][neighbourCol] = currentDist + 1;
                    }
                }
                if (distArr[row][col] === I) countFoundI++;
            }
        }

        if (countFoundI === 0) return true;
        return false;
    }


    function peakFinder(peaks, elevations_arr) {
        let neighbourRow, neighbourCol;
        for (let row = 0; row < elevations_arr.length; row++) {
            for (let col = 0; col < elevations_arr[0].length; col++) {
                let slopeDownCount = 4; // Precondition is that there are no more than 1 true peak. Therefore all neighbouring slopes must be downward.
                let slopeDownLargerThan1 = 4; // peak not accessible if slopeDownLargerThan1 = 0
                let currentTile = elevations_arr[row][col];

                for (let neighbour_i in neighbours) {
                    neighbourRow = row + neighbours[neighbour_i][0];
                    neighbourCol = col + neighbours[neighbour_i][1];
                    if (neighbourRow < 0 || neighbourRow >= elevations_arr.length || 
                        neighbourCol < 0 || neighbourCol >= elevations_arr[0].length) {
                        if (currentTile >= 2) slopeDownCount--; //near edge
                        slopeDownLargerThan1--;
                        continue;
                    }

                    if (currentTile >= 2 && (currentTile > elevations_arr[neighbourRow][neighbourCol])) {
                        slopeDownCount--; // peak finder
                        if ((currentTile - elevations_arr[neighbourRow][neighbourCol]) > 1) slopeDownLargerThan1--;
                    }


                }
                if (slopeDownCount <= 0 && slopeDownLargerThan1 > 0) { // if slopeDownLargerThan1 == 0 then there are no walkable slopes.

                    if (isTrueTop(elevations_arr, elevations_arr[row][col], row, col)) peaks.set(row + "," + col, [row, col]);

                }
            }
        }

        /* 
        Checks if a mountain top is a true mountain top by an army of scouting ants :).
        Each ant moves recursively outward in all directions from the predicted 
        mountain top, and checks if there is a higher peak. Returns false if a higher or same
        height peak is found on the current mountain.
        */

        function isTrueTop(elevations_arr, maxHeight, rowPeak, colPeak) {
            var directions = [[-1, 0], [0, 1], [1, 0], [0, -1]]; // 0: up 1: left  2: down  3: right
            var abortR = false;

            var visited = elevations_arr.map(x => x.slice());
            var safety = 999; // Prevents infinite loop in case there is no route.

            startScoutingAnt(rowPeak, colPeak);


            function startScoutingAnt(rowPeak, colPeak) {
                visited[rowPeak][colPeak] = "V";
                scoutingAnt(0, rowPeak, colPeak);
                scoutingAnt(1, rowPeak, colPeak);
                scoutingAnt(2, rowPeak, colPeak);
                scoutingAnt(3, rowPeak, colPeak);
            }

            function scoutingAnt(dir, rowPeak, colPeak) {

                safety--;

                if (!abortR && safety >= 0) {

                    let rCurrentPos = rowPeak + directions[dir][0];
                    let cCurrentPos = colPeak + directions[dir][1];

                    if (rCurrentPos >= 0 && cCurrentPos >= 0 && rCurrentPos <
                         elevations_arr.length && cCurrentPos < elevations_arr[0].length) {

                        let currentElev = elevations_arr[rCurrentPos][cCurrentPos];
                        let tileVisited = visited[rCurrentPos][cCurrentPos];

                        if (currentElev >= maxHeight && tileVisited != "V") {
                            abortR = true;

                        }
                        else if (currentElev > 0 && tileVisited != "V") {


                            visited[rCurrentPos][cCurrentPos] = "V";


                            if (dir === 0 || dir === 2) {
                                scoutingAnt(dir, rCurrentPos, cCurrentPos);
                                scoutingAnt(1, rCurrentPos, cCurrentPos);
                                scoutingAnt(3, rCurrentPos, cCurrentPos);
                            }
                            else if (dir === 1 || dir === 3) {
                                scoutingAnt(dir, rCurrentPos, cCurrentPos);
                                scoutingAnt(0, rCurrentPos, cCurrentPos);
                                scoutingAnt(2, rCurrentPos, cCurrentPos);
                            }
                        }
                    }
                }
            }
            return !abortR;
        }
        return peaks;
    }


    /* 
        Brute force implementation of traveling salesman problem.
        Generates permutations of all the peaks. Adds up the distances,
        then returns the mimimum distance
    */
    function bruteForceTravelingSalesman(distArr) {

        var startVertex = 1;
        var endVertex = distArr.length - 2;
        var vertexes = genNumbersArr(0, distArr.length - 1);
        var pArray = permutateArray(vertexes, startVertex, endVertex);
        var tmp_dist = 0;
        var nextPoint, currentPoint;
        var pDistances = [];

        for (let i = 0; i < pArray.length; i++) {
            tmp_dist = 0;
            for (let j = 0; j < pArray[0].length - 1; j++) {
                currentPoint = pArray[i][j];
                nextPoint = pArray[i][j + 1];
                tmp_dist += distArr[currentPoint][nextPoint];
            }
            pDistances.push(tmp_dist);
        }


        function genNumbersArr(s, e) {
            let numlist = [];
            for (let i = s; i <= e; i++) {
                numlist.push(i);
            }
            return numlist;
        }


        function permutateArray(arrP, s, e) {
            var outputArr = [];
            permuteInner(arrP, s, e);

            function permuteInner(arrP, s, e) {
                arrP = arrP.slice();

                if (s === e) outputArr.push(arrP);
                else {
                    for (let i = s; i <= e; i++) {
                        arrP = swap(arrP, s, i);
                        permuteInner(arrP, s + 1, e);
                        arrP = swap(arrP, s, i);
                    }
                }
            }

            function swap(arrS, i1, i2) {
                let arr_tmp = arrS[i2];
                arrS[i2] = arrS[i1];
                arrS[i1] = arr_tmp;
                return arrS;
            }

            return outputArr;
        }
        var minDistance = 99999999999999;
        return pDistances.reduce((x, y) => Math.min(x, y), 9999999999);
    }

    if (distances.length === 2) return distances[0][1];
    if (distances.length === 3) return distances[0][1] + distances[1][2];
    var result = bruteForceTravelingSalesman(distances);
    return result;
}




var assert = require('assert');

if (!global.is_checking) {
    assert.equal(climbingRoute([
        '000',
        '210',
        '000']), 6, 'basic')
    assert.equal(climbingRoute([
        '00000',
        '05670',
        '04980',
        '03210',
        '00000']), 26, 'spiral')
    assert.equal(climbingRoute([
        '000000001',
        '222322222',
        '100000000']), 26, 'bridge')
    assert.equal(climbingRoute([
        '000000002110',
        '011100002310',
        '012100002220',
        '011100000000']), 26, 'two top')
    assert.equal(climbingRoute([
        '000000120000',
        '001002432100',
        '012111211000',
        '001000000000']), 16, 'one top')
    assert.equal(climbingRoute([
        '00000000111111100',
        '00000000122222100',
        '00000000123332100',
        '00000000123432100',
        '00000000123332100',
        '00000000122222100',
        '00000000111111100',
        '00011111000000000',
        '00012221000000000',
        '00012321000000000',
        '00012221000000012',
        '00011111000000000',
        '11100000000000000',
        '12100000000000000',
        '11100000000000000']), 52, 'pyramids')
    console.log("All checks passed!");
}

