/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 75.0, "KoPercent": 25.0};
    var dataset = [
        {
            "label" : "KO",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "OK",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.625, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "Rename Board"], "isController": false}, {"data": [1.0, 500, 1500, "Add description to Board"], "isController": false}, {"data": [1.0, 500, 1500, "View Board"], "isController": false}, {"data": [1.0, 500, 1500, "Display lists from the Board"], "isController": false}, {"data": [0.5, 500, 1500, "Delete Board"], "isController": false}, {"data": [0.0, 500, 1500, "Delete Board Manually"], "isController": false}, {"data": [0.0, 500, 1500, "Rename list"], "isController": false}, {"data": [0.5, 500, 1500, "Create Board"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 8, 2, 25.0, 624.375, 0, 1468, 1468.0, 1468.0, 1468.0, 1.5841584158415842, 4.5892636138613865, 0.6615485767326733], "isController": false}, "titles": ["Label", "#Samples", "KO", "Error %", "Average", "Min", "Max", "90th pct", "95th pct", "99th pct", "Throughput", "Received", "Sent"], "items": [{"data": ["Rename Board", 1, 0, 0.0, 478.0, 478, 478, 478.0, 478.0, 478.0, 2.092050209205021, 8.00250065376569, 1.1379609048117156], "isController": false}, {"data": ["Add description to Board", 1, 0, 0.0, 471.0, 471, 471, 471.0, 471.0, 471.0, 2.1231422505307855, 8.160828025477707, 1.1673135615711254], "isController": false}, {"data": ["View Board", 1, 0, 0.0, 422.0, 422, 422, 422.0, 422.0, 422.0, 2.3696682464454977, 9.140810130331754, 0.9094527547393365], "isController": false}, {"data": ["Display lists from the Board", 1, 0, 0.0, 383.0, 383, 383, 383.0, 383.0, 383.0, 2.6109660574412534, 6.481519255874674, 1.1958428524804177], "isController": false}, {"data": ["Delete Board", 1, 0, 0.0, 1374.0, 1374, 1374, 1374.0, 1374.0, 1374.0, 0.727802037845706, 1.579273562590975, 0.39019855349344973], "isController": false}, {"data": ["Delete Board Manually", 1, 1, 100.0, 399.0, 399, 399, 399.0, 399.0, 399.0, 2.506265664160401, 4.753093671679197, 1.3436912593984962], "isController": false}, {"data": ["Rename list", 1, 1, 100.0, 0.0, 0, 0, 0.0, 0.0, 0.0, Infinity, Infinity, NaN], "isController": false}, {"data": ["Create Board", 1, 0, 0.0, 1468.0, 1468, 1468, 1468.0, 1468.0, 1468.0, 0.6811989100817438, 2.640976243188011, 0.22684455892370572], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Percentile 1
            case 8:
            // Percentile 2
            case 9:
            // Percentile 3
            case 10:
            // Throughput
            case 11:
            // Kbytes/s
            case 12:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 31: https:\/\/api.trello.com\/1\/lists\/{listID}?name=dumylist&amp;key=69ee33921dc44513022cba2ffd1bb162&amp;token=ATTA611e471495b6272d6c0d421f14d1b420f16d837340d797a1a8e20a1ae06ea873F27B6FF2", 1, 50.0, 12.5], "isController": false}, {"data": ["404/Not Found", 1, 50.0, 12.5], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 8, 2, "Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 31: https:\/\/api.trello.com\/1\/lists\/{listID}?name=dumylist&amp;key=69ee33921dc44513022cba2ffd1bb162&amp;token=ATTA611e471495b6272d6c0d421f14d1b420f16d837340d797a1a8e20a1ae06ea873F27B6FF2", 1, "404/Not Found", 1, null, null, null, null, null, null], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["Delete Board Manually", 1, 1, "404/Not Found", 1, null, null, null, null, null, null, null, null], "isController": false}, {"data": ["Rename list", 1, 1, "Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in path at index 31: https:\/\/api.trello.com\/1\/lists\/{listID}?name=dumylist&amp;key=69ee33921dc44513022cba2ffd1bb162&amp;token=ATTA611e471495b6272d6c0d421f14d1b420f16d837340d797a1a8e20a1ae06ea873F27B6FF2", 1, null, null, null, null, null, null, null, null], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
