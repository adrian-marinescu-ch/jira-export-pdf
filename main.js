const Papa = require("papaparse");
const PDFObject = require("pdfobject");
const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');
pdfMake.vfs = pdfFonts.pdfMake.vfs;

document.addEventListener("DOMContentLoaded", function () {
    let fileInput = document.getElementById('input');
    let inputName = document.getElementById('inputName');

    fileInput.addEventListener('change', function () {
        Papa.parse(fileInput.files[0], {
            header: true,
            complete: function (results, file) {
                if (results.errors) {
                    console.warn('Parse CSV errors', results.errors);
                }

                constructPdf(results.data, inputName.value);
            }
        });
    }, false);
});

function constructPdf(dataArray, fullName
) {
    let groupedData = [];
    let totalTime = 0;
    let startDate = undefined;
    let endDate = undefined;
    dataArray.forEach(function (arrayItem) {
        let newTime = parseFloat(arrayItem['Time Spent (h)']);
        let newDate = undefined;
        if (arrayItem['Date Started']) {
            newDate = Date.parse(arrayItem['Date Started']);
        }
        if (newDate !== undefined) {
            if (startDate === undefined) {
                startDate = newDate;
            }
            if (endDate === undefined) {
                endDate = newDate;
            }
            if (startDate !== undefined && startDate > newDate) {
                startDate = newDate;
            }
            if (endDate !== undefined && endDate < newDate) {
                endDate = newDate;
            }
        }

        if (arrayItem.Key && newTime > 0) {
            if (!(arrayItem.Key in groupedData)) {
                groupedData[arrayItem.Key] = {
                    'Key': arrayItem['Key'],
                    'Name': arrayItem['Summary'],
                    'Descriptions': [
                        arrayItem['Work Description']
                    ],
                    'Time': parseFloat(arrayItem['Time Spent (h)'])
                }
            } else {
                groupedData[arrayItem.Key]['Time'] = groupedData[arrayItem.Key]['Time'] + newTime;
                groupedData[arrayItem.Key]['Descriptions'].push(arrayItem['Work Description']);
            }
            totalTime = totalTime + newTime;
        }
    });

    let formattedData = [];
    Object.values(groupedData).forEach(function (data) {
        let descriptionsLength = data.Descriptions.length;
        if (descriptionsLength > 1) {
            formattedData.push([
                {
                    rowSpan: descriptionsLength + 1,
                    text: data.Key,
                    alignment: 'left',
                    fillColor: '#339966',
                    color: '#fff',
                    bold: true,
                    style: 'subheader',
                },
                {
                    text: data.Name,
                    alignment: 'left',
                    fillColor: '#339966',
                    color: '#fff',
                    bold: true,
                    style: 'subheader',
                },
                {
                    rowSpan: descriptionsLength + 1,
                    text: data.Time + 'h',
                    alignment: 'right',
                    fillColor: '#339966',
                    color: '#fff',
                    bold: true,
                    style: 'subheader',
                }
            ]);
            for (let i = 0; i < descriptionsLength; i++) {
                if (data.Descriptions[i] && data.Descriptions[i].length > 0) {
                    formattedData.push([
                        {},
                        {
                            text: data.Descriptions[i],
                            color: '#000',
                        },
                        {}
                    ]);
                }
            }
        } else {
            let multipleRows = data.Descriptions[0] && data.Descriptions[0].length > 0;
            let color = multipleRows ? '#339933' : '#339966';
            formattedData.push([
                {
                    rowSpan: multipleRows ? 2 : 1,
                    text: data.Key,
                    alignment: 'left',
                    fillColor: color,
                    color: '#fff',
                    bold: true,
                    style: 'subheader',
                },
                {
                    text: data.Name,
                    alignment: 'left',
                    fillColor: color,
                    color: '#fff',
                    style: 'subheader',
                },
                {
                    rowSpan: multipleRows ? 2 : 1,
                    text: data.Time + 'h',
                    alignment: 'right',
                    fillColor: color,
                    color: '#fff',
                    bold: true,
                    style: 'subheader',
                }
            ]);
            if (multipleRows) {
                formattedData.push([
                    {},
                    {
                        text: data.Descriptions[0],
                        color: '#000',
                    },
                    {}
                ]);
            }
        }
    });

    let content = [
        {text: 'Start date: ' + new Date(startDate).toDateString(), style: 'header', margin: [10, 10, 10, 0]},
        {text: 'End date: ' + new Date(endDate).toDateString(), style: 'header', margin: [10, 10, 10, 10]},
        {
            table: {
                headerRows: 1,
                body: [
                    [
                        {
                            text: 'Task',
                            fillColor: '#16A085',
                            alignment: 'center',
                            color: '#fff',
                            bold: true,
                            style: 'subheader'
                        },
                        {
                            text: 'Work log(s)',
                            fillColor: '#16A085',
                            alignment: 'center',
                            color: '#fff',
                            bold: true,
                            style: 'subheader'
                        },
                        {
                            text: 'Time',
                            fillColor: '#16A085',
                            alignment: 'center',
                            color: '#fff',
                            bold: true,
                            style: 'subheader'
                        }
                    ]
                ].concat(
                    formattedData,
                    [
                        [
                            {
                                colSpan: 2,
                                text: 'Grand total',
                                alignment: 'center',
                                fillColor: '#006699',
                                color: '#fff',
                            },
                            {},
                            {
                                text: totalTime + 'h',
                                alignment: 'center',
                                fillColor: '#999933',
                                color: '#fff',
                                bold: true,
                            },
                        ]
                    ]
                ),
            },
            layout: {
                hLineWidth: function (i, node) {
                    return (i === 0 || i === node.table.body.length) ? 2 : 1;
                },
                vLineWidth: function (i, node) {
                    return (i === 0 || i === node.table.widths.length) ? 2 : 1;
                },
                hLineColor: function (i, node) {
                    return '#fff';
                },
                vLineColor: function (i, node) {
                    return '#fff';
                },
                hLineStyle: function (i, node) { return {dash: { length: 4, space: 4 }}; },
                vLineStyle: function (i, node) { return {dash: { length: 4, space: 4 }}; },
                paddingLeft: function(i, node) { return 4; },
                paddingRight: function(i, node) { return 4; },
                paddingTop: function(i, node) { return 2; },
                paddingBottom: function(i, node) { return 2; },
            }
        }
    ];

    let pdfDoc = pdfMake.createPdf({
        content: fullName.length ? [{text: 'Name: ' + fullName, style: 'header', margin: [10, 10, 10, 0]}].concat(content): content,
        footer: function (currentPage, pageCount, pageSize) {
            return {
                table: {
                    widths: [pageSize.width],
                    body: [
                        [
                            { text: currentPage.toString() + ' of ' + pageCount, alignment: 'center' }
                        ],
                    ]
                },
                layout: 'noBorders'
            };
        },
    });

    pdfDoc.getDataUrl((main) => {
        PDFObject.embed(main, "#output");
    });
}
